#!/usr/bin/env node
//
// scripts/longform/generate-youtube-meta.mjs — viral YouTube metadata for the
// weekly CR video. Writes title + tags + description.md, every one driving the
// $9 newsletter signup and "support the channel."
//
// The description MUST contain "campaignreceipts.com" to satisfy youtube-upload.py's
// require_growth_triad() gate. We lead with the newsletter CTA by design.
//
// Output: scripts/longform/_build/<WEEK>/youtube-meta.json  { title, tags[], description }
//         scripts/longform/_build/<WEEK>/description.md      (for --description-file)
//
// Usage: node scripts/longform/generate-youtube-meta.mjs --week-of=YYYY-MM-DD [--kind=long|short]
// Env: SUPABASE_*, ANTHROPIC_API_KEY.

import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..', '..')
const MODEL = 'claude-haiku-4-5'
const SITE = 'https://campaignreceipts.com'

const args = process.argv.slice(2)
const getArg = (k, d = null) => args.find((a) => a.startsWith(`--${k}=`))?.split('=')[1] ?? d
const KIND = getArg('kind', 'long')

function isoMonday(d = new Date()) { const x = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())); x.setUTCDate(x.getUTCDate() - ((x.getUTCDay() + 6) % 7)); return x.toISOString().slice(0, 10) }
const WEEK = getArg('week-of', isoMonday())
const BUILD = path.join(ROOT, 'scripts', 'longform', '_build', WEEK)

const supabase = createClient(process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

// The growth block: appended to EVERY description so the CTA + growth-triad link
// are always present regardless of what the model writes.
function growthBlock() {
  return [
    '',
    '━━━━━━━━━━━━━━━━━━━━',
    '📩 GET THE WEEKLY RECEIPTS — $9/mo newsletter',
    `Every Friday: who funded the vote, before anyone else covers it. Subscribe at ${SITE}`,
    '',
    '❤️ SUPPORT THE CHANNEL',
    `Like, subscribe, and share — it’s how independent money-in-politics reporting survives. More at ${SITE}`,
    '',
    'All figures sourced to public FEC filings. Campaign contributions are legal and disclosed. Timing does not prove causation.',
  ].join('\n')
}

async function main() {
  if (!process.env.ANTHROPIC_API_KEY) { console.error('Missing ANTHROPIC_API_KEY'); process.exit(1) }
  fs.mkdirSync(BUILD, { recursive: true })

  const { data: arts } = await supabase
    .from('cr_articles').select('title, dek')
    .eq('kind', 'weekly_story').like('slug', `friday-receipts-${WEEK}-%`).eq('status', 'published')
    .order('published_at', { ascending: false })
  const stories = (arts || []).map((a) => ({ title: a.title, dek: a.dek }))
  if (!stories.length) { console.error(`No articles for week ${WEEK}`); process.exit(1) }

  const prompt = `You write YouTube metadata for "Campaign Receipts," a nonpartisan money-in-politics channel. This ${KIND === 'short' ? 'YouTube SHORT (vertical, ~45s)' : 'long-form video (~6 min)'} covers this week's money-trail stories.

Return STRICT JSON: {"title": "...", "tags": ["...", ...], "description": "..."}.

RULES:
- title: ≤100 chars, curiosity-driven but FACTUAL (a real figure or name from the stories). No clickbait lies, no "SHOCKING"/"BOMBSHELL". ${KIND === 'short' ? 'Punchy, ≤60 chars ideal.' : ''}
- tags: 8-12 lowercase tags (politics, campaign finance, fec, the relevant names/topics).
- description: 2-4 sentences summarizing the video's money trail, nonpartisan, NO causation/quid-pro-quo (banned: bought, bribe, in exchange for). Do NOT add CTAs or links — those are appended automatically.

STORIES:
${JSON.stringify(stories.slice(0, 6), null, 2)}`

  // Retry: a single non-JSON / transient model response shouldn't fail the whole
  // publish (founder 2026-06-23: the orchestrator died here on one bad response).
  let meta = null
  for (let attempt = 1; attempt <= 3 && !meta; attempt++) {
    try {
      const resp = await anthropic.messages.create({ model: MODEL, max_tokens: 800, messages: [{ role: 'user', content: prompt }] })
      let txt = resp.content[0]?.type === 'text' ? resp.content[0].text.trim() : ''
      txt = txt.replace(/^```json\s*/i, '').replace(/```$/i, '').trim()
      meta = JSON.parse(txt)
    } catch (e) {
      console.error(`meta attempt ${attempt}/3 failed: ${e.message}`)
      if (attempt < 3) await new Promise((r) => setTimeout(r, 1500 * attempt))
    }
  }
  // Last-resort fallback so the publish never dies here — generic but valid metadata.
  if (!meta) { console.error('meta: all attempts failed; using safe fallback'); meta = { title: "Follow the Money — This Week's Receipts", tags: ['campaign finance', 'money in politics', 'fec', 'congress'], description: 'This week’s money trails: who voted for which industry’s bill, and which donors funded them. Every figure sourced to public FEC filings and roll-call records.' } }

  const title = String(meta.title || 'Follow the money — this week in campaign finance').slice(0, 100)
  const tags = Array.isArray(meta.tags) ? meta.tags.slice(0, 12).map(String) : ['campaign finance', 'politics', 'fec']
  const description = `${String(meta.description || '').trim()}\n${growthBlock()}`

  // Guard: the upload gate requires this string.
  if (!description.toLowerCase().includes('campaignreceipts.com')) { console.error('description missing campaignreceipts.com'); process.exit(1) }

  const out = { week: WEEK, kind: KIND, title, tags, description }
  const suffix = KIND === 'short' ? '-short' : ''
  fs.writeFileSync(path.join(BUILD, `youtube-meta${suffix}.json`), JSON.stringify(out, null, 2))
  fs.writeFileSync(path.join(BUILD, `description${suffix}.md`), description)
  console.log(`title: ${title}`)
  console.log(`tags: ${tags.join(', ')}`)
  console.log(`description.md + youtube-meta${suffix}.json written to ${path.relative(ROOT, BUILD)}`)
}

main().catch((e) => { console.error('FATAL:', e.message); process.exit(1) })
