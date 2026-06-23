#!/usr/bin/env node
//
// scripts/build-audio-briefing.mjs  —  the "Friday Receipts" audio briefing.
//
// Turns the week's published weekly_story articles into a ~5-minute podcast-style
// VO script (scene-based, **VO:** blocks — the format scripts/pipeline/elevenlabs-tts.py
// speaks), generates the MP3 with that existing TTS, and records the audio on the
// week's cr_newsletter_issues row so the newsletter can link "Listen to the briefing."
//
// Editorial voice matches content/scripts/*: plain-spoken, scene turns, the CR
// "follow the money" discipline — facts + timeline, NEVER causation/quid-pro-quo.
//
// Idempotent: regenerates this week's script + mp3; skips the LLM if a script
// already exists for the week unless --force.
//
// Usage:
//   node scripts/build-audio-briefing.mjs [--dry-run] [--week-of=YYYY-MM-DD] [--force]
//   (--dry-run writes the script .md + prints, but does NOT call TTS/upload)
//
// Env: SUPABASE_*, ANTHROPIC_API_KEY, ELEVENLABS_API_KEY (for the TTS sub-step).

import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'
import { writeFileSync, mkdirSync, existsSync, statSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { spawnSync } from 'node:child_process'

const STORY_MODEL = 'claude-haiku-4-5'
const __dirname = dirname(fileURLToPath(import.meta.url))

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY
if (!SUPABASE_URL || !SUPABASE_KEY) { console.error('Missing Supabase env'); process.exit(1) }
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } })

const args = process.argv.slice(2)
const DRY = args.includes('--dry-run')
const FORCE = args.includes('--force')
const weekArg = args.find((a) => a.startsWith('--week-of='))?.split('=')[1]
if (!DRY && !ANTHROPIC_KEY) { console.error('Missing ANTHROPIC_API_KEY'); process.exit(1) }
const anthropic = DRY && !ANTHROPIC_KEY ? null : new Anthropic({ apiKey: ANTHROPIC_KEY })

function isoMonday(d = new Date()) {
  const x = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
  const dow = (x.getUTCDay() + 6) % 7
  x.setUTCDate(x.getUTCDate() - dow)
  return x.toISOString().slice(0, 10)
}
const WEEK_OF = weekArg || isoMonday()
const OUT_DIR = join(__dirname, '..', 'content', 'audio', WEEK_OF)
const SCRIPT_PATH = join(OUT_DIR, 'briefing.md')
const MP3_PATH = join(OUT_DIR, 'briefing.mp3')

async function weekArticles() {
  const { data } = await supabase
    .from('cr_articles')
    .select('title, dek, body_md, source_refs, published_at')
    .eq('kind', 'weekly_story')
    .like('slug', `friday-receipts-${WEEK_OF}-%`)
    .eq('status', 'published')
    .order('published_at', { ascending: false })
  return (data || []).map((a) => {
    const ref = Array.isArray(a.source_refs) && a.source_refs[0] ? a.source_refs[0] : {}
    return { title: a.title, dek: a.dek, branch: ref.branch || 'States', body: (a.body_md || '').slice(0, 1500) }
  })
}

function buildPrompt(stories, weekLabel) {
  return `You are the writer for the "Friday Receipts" audio briefing from CampaignReceipts, a nonpartisan campaign-finance accountability site. Write a ~5-minute (700-850 word) spoken radio briefing covering this week's ${stories.length} money-trail stories.

OUTPUT FORMAT (critical — the TTS reads ONLY **VO:** lines):
- Markdown. One scene per story plus a cold-open and a close.
- Each scene: a "## Scene N — <label>" header, then a "**VO:**" line with the spoken text.
- ONLY the text after **VO:** is spoken. Headers/notes are ignored.

HARD RULES (same discipline as our articles):
1. ONLY use facts present in the STORIES data. Never invent a number, name, date, or vote.
2. NO causation / motive / quid-pro-quo. State the money and the role/vote as facts; let the listener judge. BANNED: "bought," "bribe," "in exchange for," "because of," "corrupt."
3. Nonpartisan — same scrutiny regardless of party.
4. Spoken style: short sentences, plain English (3rd-5th grade), active voice. Spell out figures the way they're said ("two point three million dollars"). No headers/markdown read aloud. No "shocking/bombshell."
5. Cold open = one-sentence hook with the week's biggest figure. Close = "The receipts are at campaignreceipts.com. New ones every Friday." and the standing line: "Campaign contributions are legal and disclosed. Timing does not prove causation."

STORIES (${weekLabel}):
${JSON.stringify(stories, null, 2)}

Write the full script now, starting with "## Scene 1 — Cold open".`
}

async function generateScript(stories) {
  const resp = await anthropic.messages.create({
    model: STORY_MODEL, max_tokens: 2500,
    messages: [{ role: 'user', content: buildPrompt(stories, WEEK_OF) }],
  })
  const t = resp.content[0]?.type === 'text' ? resp.content[0].text.trim() : ''
  if (!t || !/\*\*VO:\*\*/.test(t)) throw new Error('script missing **VO:** blocks')
  return t
}

async function main() {
  console.log(`[${new Date().toISOString()}] Audio briefing for ${WEEK_OF}${DRY ? ' (DRY RUN)' : ''}`)
  const stories = await weekArticles()
  console.log(`Stories this week: ${stories.length}`)
  if (stories.length === 0) { console.log('No articles — skipping audio briefing.'); return }

  mkdirSync(OUT_DIR, { recursive: true })

  // 1) Script (skip LLM if already present unless --force).
  let script
  if (existsSync(SCRIPT_PATH) && !FORCE) {
    console.log('Script already exists — reusing (use --force to regenerate).')
    script = null
  } else if (anthropic) {
    script = await generateScript(stories)
    writeFileSync(SCRIPT_PATH, script)
    console.log(`Wrote script: ${SCRIPT_PATH} (${script.length} chars)`)
  } else {
    console.log('(dry-run without ANTHROPIC key — cannot generate script)'); return
  }

  if (DRY) {
    console.log('\n--- VO LINES (what gets spoken) ---')
    const vos = (script || '').match(/\*\*VO:\*\*\s*(.+)/g) || []
    vos.forEach((v, i) => console.log(`${i + 1}. ${v.replace(/\*\*VO:\*\*\s*/, '').slice(0, 90)}…`))
    console.log('\nDRY RUN — script written, TTS/upload skipped.')
    return
  }

  // Preflight: the TTS sub-step needs python3 (stdlib only) + ffmpeg (chunk concat)
  // + an ElevenLabs key. If any is missing on this worker, skip cleanly — the
  // newsletter still ships, just without audio. (Never break Friday's send.)
  const have = (bin, arg = '--version') => spawnSync(bin, [arg], { stdio: 'ignore' }).status === 0
  const missing = []
  if (!have('python3')) missing.push('python3')
  if (!have('ffmpeg', '-version')) missing.push('ffmpeg')
  if (!process.env.ELEVENLABS_API_KEY && !process.env.CR_ELEVENLABS_API_KEY) missing.push('ELEVENLABS_API_KEY')
  if (missing.length) {
    console.log(`Skipping audio briefing — missing on this worker: ${missing.join(', ')}. (Newsletter ships without audio.)`)
    return
  }

  // 2) TTS via the existing pipeline script → MP3.
  console.log('Generating MP3 via elevenlabs-tts.py…')
  // --no-verify: skip the Whisper exact-match QC. It's tuned for word-perfect
  // shorts (caption sync); for a 5-min narrated briefing a near-match is fine and
  // the QC both adds Whisper cost and false-fails on number-heavy lines.
  const tts = spawnSync('python3', [join(__dirname, 'pipeline', 'elevenlabs-tts.py'), '--script', SCRIPT_PATH, '--out', MP3_PATH, '--no-verify'], { stdio: 'inherit', env: process.env })
  if (tts.status !== 0 || !existsSync(MP3_PATH)) { console.error('TTS failed.'); process.exit(1) }
  const sizeKB = Math.round(statSync(MP3_PATH).size / 1024)
  console.log(`MP3 produced: ${MP3_PATH} (${sizeKB} KB)`)

  // 3) Upload to Supabase Storage + record on the issue.
  const { readFileSync } = await import('node:fs')
  const buf = readFileSync(MP3_PATH)
  const objectPath = `audio-briefings/${WEEK_OF}.mp3`
  const { error: upErr } = await supabase.storage.from('cr-audio').upload(objectPath, buf, { contentType: 'audio/mpeg', upsert: true })
  if (upErr) { console.error('storage upload error (bucket "public" may need creating):', upErr.message) }
  else {
    const { data: pub } = supabase.storage.from('cr-audio').getPublicUrl(objectPath)
    const audioUrl = pub?.publicUrl || null
    await supabase.from('cr_newsletter_issues').update({ audio_url: audioUrl, updated_at: new Date().toISOString() }).eq('week_of', WEEK_OF)
    console.log(`Audio URL recorded on issue: ${audioUrl}`)
  }
  console.log('Done.')
}

main().catch((e) => { console.error('FATAL:', e.message); process.exit(1) })
