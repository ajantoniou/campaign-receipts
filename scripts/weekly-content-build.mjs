#!/usr/bin/env node
//
// scripts/weekly-content-build.mjs  —  PHASE 1 of the weekly content engine.
// (B2B Terminal Pivot Version)
//
// Generates the "Prediction Market Movers" newsletter by scanning locally
// synced markets from data/markets/ and building a clean HTML table.
//

import { createClient } from '@supabase/supabase-js'
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://campaignreceipts.com'

const DRY = process.argv.includes('--dry-run')

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('FATAL: SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY missing')
  process.exit(1)
}
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } })

const C = {
  paper: '#0a0a0a',
  paper2: '#111111',
  ink: '#ffffff',
  ink2: '#888888',
  line: '#333333',
  green: '#00FF00',
  blue: '#58A6FF',
}
const esc = (s) => (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

function isoMonday(d = new Date()) {
  const x = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
  const dow = (x.getUTCDay() + 6) % 7
  x.setUTCDate(x.getUTCDate() - dow)
  return x.toISOString().slice(0, 10)
}

function buildHtml(weekOf, markets) {
  const marketBlocks = markets
    .map((m) => {
      const url = `${SITE}/betting/${m.market.slug}`
      const vol = m.market.volume_usd ? `$${m.market.volume_usd.toLocaleString()}` : ''
      return `<tr><td style="padding:18px 0;border-bottom:1px solid ${C.line}">
        <div style="font:600 11px font-mono, monospace;color:${C.blue};text-transform:uppercase;letter-spacing:1px;margin:0 0 6px 0">${esc(m.market.group_name || 'Market')} &middot; ${vol} VOL</div>
        <a href="${url}" style="color:${C.ink};text-decoration:none">
          <div style="font:700 19px Helvetica,Arial,sans-serif;color:${C.ink};margin:0 0 8px 0">${esc(m.market.question)}</div>
        </a>
        <a href="${url}" style="display:inline-block;background:${C.green};color:#000;font:600 13px font-mono,monospace;padding:8px 16px;text-decoration:none;border-radius:4px;margin-top:8px">UNLOCK DONOR EDGE &rarr;</a>
      </td></tr>`
    })
    .join('')

  return `<!doctype html><html><body style="margin:0;background:${C.paper2};padding:0">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.paper2}">
    <tr><td align="center" style="padding:24px 12px">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background:${C.paper};border:1px solid ${C.line};border-radius:10px;max-width:600px">
        <tr><td style="padding:24px 28px 8px 28px;border-bottom:1px solid ${C.line}">
          <div style="font:700 22px Helvetica,Arial,sans-serif;color:${C.ink};letter-spacing:-.5px">Alpha Terminal</div>
          <div style="font:600 12px font-mono,monospace;color:${C.green};text-transform:uppercase;letter-spacing:1px">Prediction Market Movers &middot; week of ${weekOf}</div>
        </td></tr>
        <tr><td style="padding:8px 28px 0 28px">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${marketBlocks}</table>
        </td></tr>
        <tr><td style="padding:24px 28px">
          <div style="background:${C.paper2};border:1px solid ${C.line};border-left:3px solid ${C.green};border-radius:8px;padding:14px 16px">
            <div style="font:600 11px font-mono,monospace;color:${C.green};text-transform:uppercase;letter-spacing:1px;margin:0 0 4px 0">Institutional Edge Available</div>
            <div style="font:400 13px/1.5 Helvetica,Arial,sans-serif;color:${C.ink2}">A Terminal subscription unlocks True Odds, SuperPAC dark money flows, and Lobbying consensus for algorithmic execution. <a href="${SITE}/pricing" style="color:${C.green};font-weight:600">Upgrade to Terminal &rarr;</a></div>
          </div>
        </td></tr>
      </table>
      <div style="font:400 12px Arial,sans-serif;color:${C.ink2};margin-top:24px">
        No longer trading? <a href="{{unsubscribe_url}}" style="color:${C.ink2}">Unsubscribe</a>
      </div>
    </td></tr>
  </table>
  </body></html>`
}

async function main() {
  console.log(`PHASE 1 — weekly-content-build (B2B Version)`)
  const weekOf = isoMonday()

  // 1. Load markets from data/markets/
  const dataDir = join(process.cwd(), 'data', 'markets')
  const markets = []
  if (existsSync(dataDir)) {
    const files = readdirSync(dataDir).filter(f => f.endsWith('.json'))
    for (const f of files) {
      try {
        const m = JSON.parse(readFileSync(join(dataDir, f), 'utf8'))
        if (m && m.market) markets.push(m)
      } catch (e) {}
    }
  }

  // 2. Sort by volume and pick top 5
  markets.sort((a, b) => (b.market.volume_usd || 0) - (a.market.volume_usd || 0))
  const topMarkets = markets.slice(0, 5)

  if (topMarkets.length === 0) {
    console.log('No markets found. Skipping newsletter build.')
    return
  }

  const html = buildHtml(weekOf, topMarkets)
  const text = `Alpha Terminal — Prediction Market Movers\n\nTop active markets this week:\n` +
    topMarkets.map(m => `- ${m.market.question}\n  Unlock Edge: ${SITE}/betting/${m.market.slug}`).join('\n\n')

  if (DRY) {
    console.log(html)
    return
  }

  const payload = {
    week_of: weekOf,
    subject: `Alpha Terminal: Top ${topMarkets.length} active political markets this week`,
    html,
    text_body: text,
    status: 'built'
  }

  const { error } = await supabase.from('cr_newsletter_issues')
    .upsert(payload, { onConflict: 'week_of' })

  if (error) {
    throw new Error(`DB upsert failed: ${error.message}`)
  }

  console.log(`Success: built newsletter for ${weekOf}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
