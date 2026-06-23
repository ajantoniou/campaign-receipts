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

import { writeFileSync, existsSync, statSync } from 'node:fs'

const args = process.argv.slice(2)
const getArg = (k, d = null) => { const i = args.indexOf(`--${k}`); return i >= 0 && args[i + 1] ? args[i + 1] : d }
const PROMPT = getArg('prompt')
const OUT = getArg('out')
const ASPECT = getArg('aspect', '16:9')
const MODEL = getArg('model', 'veo-3.1-fast-generate-preview')
const MAX_POLL_MS = Number(getArg('timeout-ms', 240000)) // 4 min
const KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY

if (!PROMPT || !OUT) { console.error('usage: --prompt "..." --out clip.mp4'); process.exit(2) }
if (!KEY) { console.error('Missing GEMINI_API_KEY'); process.exit(2) }

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
  console.log(`Veo clip saved: ${OUT} (${Math.round(statSync(OUT).size / 1024)} KB)`)
}

main().catch((e) => { console.error('Veo FATAL:', e.message); process.exit(1) })
