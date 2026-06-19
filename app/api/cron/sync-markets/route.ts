import { NextResponse } from 'next/server'
import { matchMarketToDb } from '@/lib/betting-edge'
import { classify, eventToMarket } from '@/lib/betting-markets'
import fs from 'fs'
import path from 'path'

// Trigger via: GET /api/cron/sync-markets?secret=YOUR_CRON_SECRET
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  // Simple protection against random triggers if configured
  if (process.env.CRON_SECRET && searchParams.get('secret') !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const dataDir = path.join(process.cwd(), 'data', 'markets')
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true })
    }

    // 1. Fetch top active political markets from Gamma API
    // We fetch a bunch to find 10 that need updating
    const GAMMA = 'https://gamma-api.polymarket.com'
    const res = await fetch(`${GAMMA}/events?limit=50&closed=false&active=true`, {
      headers: { Accept: 'application/json' },
      cache: 'no-store'
    })
    
    if (!res.ok) throw new Error(`Gamma API returned ${res.status}`)
    const events = await res.json()

    const politicalEvents = events.filter((ev: any) => classify(ev.title) !== 'World & Policy')
    
    let processed = 0
    const BATCH_SIZE = 10
    const results = []

    for (const ev of politicalEvents) {
      if (processed >= BATCH_SIZE) break;

      const slug = ev.slug
      const jsonPath = path.join(dataDir, `${slug}.json`)
      
      let needsUpdate = true
      if (fs.existsSync(jsonPath)) {
        const stat = fs.statSync(jsonPath)
        const ageHours = (Date.now() - stat.mtimeMs) / (1000 * 60 * 60)
        // Only update if older than 12 hours to save Anthropic/LLM costs
        if (ageHours < 12) {
          needsUpdate = false
        }
      }

      if (needsUpdate) {
        console.log(`Analyzing market: ${slug}`)
        const market = eventToMarket(ev, classify(ev.title))
        if (!market) continue;

        try {
          // Generate Donor Intelligence
          const edge = await matchMarketToDb(market.question, market.slug)
          
          const payload = {
            market,
            edge,
            updatedAt: new Date().toISOString()
          }

          fs.writeFileSync(jsonPath, JSON.stringify(payload, null, 2))
          results.push({ slug, status: 'updated' })
          processed++
        } catch (err: any) {
          console.error(`Failed to analyze ${slug}:`, err.message)
          results.push({ slug, status: 'error', error: err.message })
        }
      }
    }

    return NextResponse.json({
      ok: true,
      processedCount: processed,
      results
    })

  } catch (err: any) {
    console.error('Cron Sync Error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
