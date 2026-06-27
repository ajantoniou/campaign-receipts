#!/usr/bin/env node
//
// scripts/pipeline/veo-generate.mjs — generate a short hero video clip with
// Google Veo 3.1 (fast) via the Gemini API, and download it to an mp4.
//
// Used by the weekly CR video renderer for 2-3 "hero" b-roll shots (cold-open,
// mid-video) layered into the otherwise motion-graphic explainer. Veo is the
// expensive part, so this is deliberately small + capped by the caller.
//
// Verified working with GEMINI_API_KEY (model veo-3.1-fast-generate-preview):
// submit predictLongRunning → poll operation → download the returned file URI.
//
// Usage:
//   node scripts/pipeline/veo-generate.mjs --prompt "..." --out clip.mp4 [--aspect 16:9] [--model veo-3.1-fast-generate-preview]
//
// Env: GEMINI_API_KEY (or GOOGLE_API_KEY).
// Exit 0 on a downloaded mp4; non-zero on any failure (caller treats as "no hero clip").

import { writeFileSync, existsSync, statSync, readFileSync, appendFileSync, mkdirSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const args = process.argv.slice(2)
const getArg = (k, d = null) => { const i = args.indexOf(`--${k}`); return i >= 0 && args[i + 1] ? args[i + 1] : d }
const PROMPT = getArg('prompt')
const OUT = getArg('out')
const ASPECT = getArg('aspect', '16:9')
const MODEL = getArg('model', 'veo-3.1-fast-generate-preview')
const MAX_POLL_MS = Number(getArg('timeout-ms', 240000)) // 4 min
const KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY

// ── COST GUARD (added after a Gemini runaway burned $20 in 5 min — Antigravity, not us,
//    but never again from OUR code). A persistent daily ledger caps Veo spend regardless
//    of who calls this helper or how many times. Veo fast ≈ $0.40/clip; override via env.
const CLIP_USD = Number(process.env.CR_VEO_CLIP_USD || 0.40)
const DAILY_CAP_USD = Number(process.env.CR_VEO_DAILY_CAP_USD || 5.0) // ~12 clips/day max
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const LEDGER = path.join(__dirname, '..', '.veo-spend.jsonl')
function today() { return new Date().toISOString().slice(0, 10) } // UTC day bucket
function spentToday() {
  if (!existsSync(LEDGER)) return 0
  let sum = 0
  for (const ln of readFileSync(LEDGER, 'utf8').split('\n')) {
    if (!ln.trim()) continue
    try { const r = JSON.parse(ln); if (r.day === today()) sum += Number(r.usd) || 0 } catch { /* skip */ }
  }
  return sum
}
function recordSpend(usd) { mkdirSync(path.dirname(LEDGER), { recursive: true }); appendFileSync(LEDGER, JSON.stringify({ day: today(), ts: new Date().toISOString(), usd, model: MODEL }) + '\n') }

if (!PROMPT || !OUT) { console.error('usage: --prompt "..." --out clip.mp4'); process.exit(2) }
if (!KEY) { console.error('Missing GEMINI_API_KEY'); process.exit(2) }

const already = spentToday()
if (already + CLIP_USD > DAILY_CAP_USD) {
  console.error(`COST GUARD: Veo daily cap reached ($${already.toFixed(2)} spent today, cap $${DAILY_CAP_USD}). Refusing this clip. Raise CR_VEO_DAILY_CAP_USD to override.`)
  process.exit(3) // distinct code; caller treats as "no hero clip" (fail-soft)
}

const BASE = 'https://generativelanguage.googleapis.com/v1beta'
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function main() {
  // 1) Submit the long-running generation.
  const submit = await fetch(`${BASE}/models/${MODEL}:predictLongRunning?key=${KEY}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ instances: [{ prompt: PROMPT }], parameters: { aspectRatio: ASPECT } }),
  })
  const sj = await submit.json()
  if (sj.error || !sj.name) { console.error('Veo submit failed:', JSON.stringify(sj.error || sj).slice(0, 200)); process.exit(1) }
  const op = sj.name
  console.log(`Veo op started: ${op}`)

  // 2) Poll until done (or timeout). Veo fast typically completes in ~1-2 min.
  const started = Date.now()
  let videoUri = null
  while (Date.now() - started < MAX_POLL_MS) {
    await sleep(15000)
    const pr = await fetch(`${BASE}/${op}?key=${KEY}`)
    const pj = await pr.json()
    if (pj.error) { console.error('Veo poll error:', JSON.stringify(pj.error).slice(0, 200)); process.exit(1) }
    if (pj.done) {
      const samples = pj.response?.generateVideoResponse?.generatedSamples || pj.response?.generatedSamples || []
      videoUri = samples[0]?.video?.uri || null
      if (!videoUri) { console.error('Veo done but no video uri:', JSON.stringify(pj.response).slice(0, 200)); process.exit(1) }
      break
    }
    console.log('  …pending')
  }
  if (!videoUri) { console.error('Veo timed out'); process.exit(1) }

  // 3) Download the mp4 (the file URI needs the API key appended).
  const dl = await fetch(videoUri.includes('key=') ? videoUri : `${videoUri}${videoUri.includes('?') ? '&' : '?'}key=${KEY}`)
  if (!dl.ok) { console.error('Veo download failed:', dl.status); process.exit(1) }
  const buf = Buffer.from(await dl.arrayBuffer())
  writeFileSync(OUT, buf)
  if (!existsSync(OUT) || statSync(OUT).size < 10000) { console.error('Veo mp4 too small'); process.exit(1) }
  recordSpend(CLIP_USD) // only count clips that actually downloaded
  console.log(`Veo clip saved: ${OUT} (${Math.round(statSync(OUT).size / 1024)} KB) · today's Veo spend ~$${(spentToday()).toFixed(2)}/${DAILY_CAP_USD}`)
}

main().catch((e) => { console.error('Veo FATAL:', e.message); process.exit(1) })
