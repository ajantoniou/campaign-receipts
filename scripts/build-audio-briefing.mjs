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
  // Storyteller persona — CRAFT copied from personas/jk-rowling-storyteller.md
  // (Stage 9 CR handoff): deliver PUNCHLINES + the deeper WHY, not a receipt list;
  // dramatize the correlation the data shows but keep open questions as QUESTIONS
  // (never assert a deal); 3rd-grade reading level; a scene turn every beat.
  return `You are the STORYTELLER for the "Friday Receipts" weekly show from CampaignReceipts, a nonpartisan campaign-finance accountability site. You write one script that becomes BOTH a short audio briefing and a YouTube video. Make it impossible to stop listening — wonder, suspense, a clear picture, one idea at a time — INSIDE a story, never a lecture or a list.

THE ARC (this is the whole point — connect the stories, don't list them):
- Open like a host: an energetic cold-open that sets up the week. e.g. "Exciting week this week in following the money — here's what we found."
- "First up, ..." — lead with the single most interesting money trail (biggest figure or juiciest connection). Tell it as a mini-story: picture → the money → the twist → why it matters.
- Then connective tissue between every story: "In other news, we also learned that ...", "But the one that stopped us cold — ...", "And you won't believe it — another story of possible influence, a wire transfer of ...".
- Close like a host: invite them back + the disclaimer.

STORYTELLING CRAFT (do this, it's the difference between boring and bingeable):
- PUNCHLINE, not receipt. A receipt is "X received nine hundred thousand dollars." A story is "Here's a senator who writes the rules for an industry — and that same industry is his single biggest backer. He says it's a coincidence. You decide."
- One picture per beat. Short sentences. Common words (3rd-5th grade). If you use a term like "PAC" or "committee chair," unpack it in the same breath ("a PAC — a group that pools money to back candidates").
- A turn every story: a question, a reversal, a reveal. Keep the listener leaning in.
- Make the NUMBERS land. Say the big figure out loud and let it breathe.

HARD RULES (non-negotiable — same discipline as our articles):
1. ONLY use facts in the STORIES data. Never invent a number, name, date, vote, or YEAR. If a year/date is not in the data, DO NOT state one. (Today is ${weekLabel}.)
1b. The dollar figures come from FEC filing cycles that may be a year or two old. DO NOT say "in 2024" or name the cycle year as if it were news — it sounds stale. Instead say "in her most recent filings", "across her last fundraising cycle", or "the latest disclosures show". The NEWS is the pattern we surfaced THIS week; the money is the on-the-record backdrop.
2. NO causation / motive / quid-pro-quo. Dramatize the correlation, but an open question STAYS a question ("will he? we're watching"), never an asserted deal. BANNED: bought, bribe, in exchange for, because of, corrupt, payoff.
3. Nonpartisan — identical scrutiny regardless of party.
4. Spell out figures the way they're SAID ("nine hundred thousand dollars", "two point three million dollars"). No "shocking/bombshell."

OUTPUT FORMAT (critical — parsers read specific markers):
- Markdown. "## Scene 1 — Cold open", then one "## Scene N — <short label>" per story, then "## Scene N — Close".
- Each scene has TWO lines:
    **VO:** <the TIGHT version — one or two punchy sentences, for a ~3-minute audio briefing. This is what gets spoken in audio.>
    **VO_LONG:** <the FULLER version of the SAME beat — about 30 to 40 seconds of narration when read aloud (roughly 75-110 words), with the picture + twist + why. Punchy, not padded. This is the video narration; the whole video should land around 4 minutes.>
- The **VO:** line must be a true shorter cut of the **VO_LONG:** beat — same facts, same order, fewer words.
- Cold open & Close: short, host energy, in BOTH lines. Close ends with: "The receipts — and the links — are waiting at campaignreceipts.com. New ones every Friday." then "Campaign contributions are legal and disclosed. Timing does not prove causation."

STORIES (most interesting first is your call):
${JSON.stringify(stories, null, 2)}

Write the full script now, starting with "## Scene 1 — Cold open".`
}

// Deterministic guard: the model keeps anchoring on the FEC cycle year ("in the
// 2024 cycle"), which sounds stale read in 2026. The figures ARE real cycle data,
// so we don't drop them — we reframe the YEAR as "most recent filing cycle".
// (Same approach as the story generator's deterministic banned-phrase pass.)
function destaleCycleYear(text) {
  // Any spoken/written form of a recent cycle year: "2024", "twenty twenty-four",
  // "two thousand twenty-four", "twenty twenty-three", etc.
  const YEAR = '(?:20\\d\\d|(?:two thousand |twenty[ -])twenty[ -](?:two|three|four|five|six)|twenty[ -]twenty[ -]?(?:two|three|four|five|six))'
  return text
    // "(during|in) [the] <YEAR> [election|fundraising] cycle" → reframe
    .replace(new RegExp(`\\b(?:during|in|for) (?:the )?${YEAR}(?:\\s+(?:election|fundraising))? cycle\\b`, 'gi'), 'in the most recent filing cycle')
    // bare "the <YEAR> cycle"
    .replace(new RegExp(`\\bthe ${YEAR} cycle\\b`, 'gi'), 'the most recent filing cycle')
    // "(during|in) <YEAR>," not followed by "cycle/dollars" → "in recent filings"
    .replace(new RegExp(`\\b(?:during|in) ${YEAR}\\b(?!\\s*(?:cycle|dollars))`, 'gi'), 'in recent filings')
}

async function generateScript(stories) {
  const resp = await anthropic.messages.create({
    model: STORY_MODEL, max_tokens: 4500,
    messages: [{ role: 'user', content: buildPrompt(stories, WEEK_OF) }],
  })
  let t = resp.content[0]?.type === 'text' ? resp.content[0].text.trim() : ''
  if (!t || !/\*\*VO:\*\*/.test(t)) throw new Error('script missing **VO:** blocks')
  t = destaleCycleYear(t)
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
