#!/usr/bin/env node
/**
 * SEALED hook film v5 — trailer-grade + real motion + trust/revenue overlays.
 *
 * Forked from v4. v4 ken-burns-fell-back because fal Wan2.5 422'd on bad
 * params (duration as int, not string-enum). v5 fixes that and adds:
 *   - Real fal image-to-video via Kling 1.6 std (duration:"5"), with Hailuo
 *     and Luma fallbacks. Schemas verified against fal openapi.json.
 *   - All 7 ElevenLabs narration segments regenerated fresh (no v2/v3 reuse).
 *   - Sidechain ducking via ffmpeg sidechaincompress (music auto-lowers
 *     ~10dB during speech, releases over 600ms).
 *   - LUFS normalization: voice -16, music -22 during speech, master -14.
 *   - Two text overlays in 21.5-29s music-only window:
 *       Trust:   "81 of 145 promises link to a primary source."
 *       Revenue: "The book the campaign tried to delete."
 *   - RMS verification: at every speech window, music must be ≥8dB below voice.
 *
 * Music: Incompetech "Impact Prelude" by Kevin MacLeod, CC BY 4.0 — REUSED
 * from _build_v4/music.mp3. Same credit beat.
 *
 * Sequence (total ~34s incl 2s credit beat):
 *   0-3s    cover-2016 ken-burns
 *   3-6s    cover-2020 MOTION (fal i2v) or ken-burns fallback
 *   6-10s   cover-2024 + scorecard chip
 *   10-13s  cover-2024 dolly-in (motion fallback for b-roll)
 *   13-16s  cover-2026 MOTION (fal i2v) or ken-burns fallback
 *   16-19s  live-donaldjtrump zoom toward donate button
 *   19-21.5s end-frame reveal
 *   21.5-25s TRUST overlay over wordmark fade-in
 *   25-29s   REVENUE overlay over wordmark hold
 *   29-32s   wordmark hold + fade
 *   32-34s   Music credit beat
 */

import { execFileSync, spawnSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const COMPANY_ROOT = path.resolve(__dirname, '..', '..')
const REPO_ROOT = path.resolve(COMPANY_ROOT, '..', '..')
const PUBLIC = path.join(COMPANY_ROOT, 'public')
const MOVIE_OUT = path.join(PUBLIC, 'movie')
const BUILD = path.join(MOVIE_OUT, '_build_v5')
const VO = path.join(BUILD, 'vo')
const V2_DONATE = path.join(MOVIE_OUT, '_build_v2', 'live-donaldjtrump.png')
const V4_MUSIC = path.join(MOVIE_OUT, '_build_v4', 'music.mp3')

const VC_NODE = path.join(COMPANY_ROOT, 'node_modules')
const requireFromVC = createRequire(path.join(VC_NODE, 'package.json'))

fs.mkdirSync(BUILD, { recursive: true })
fs.mkdirSync(VO, { recursive: true })

const args = new Set(process.argv.slice(2))
const SKIP_TTS = args.has('--skip-tts')
const SKIP_FAL_MOTION = args.has('--skip-fal-motion')

function loadEnv() {
  const envPath = path.join(REPO_ROOT, '.env')
  if (!fs.existsSync(envPath)) return
  const txt = fs.readFileSync(envPath, 'utf8')
  for (const line of txt.split('\n')) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/)
    if (!m) continue
    const [, k, v] = m
    if (!process.env[k]) process.env[k] = v.replace(/^["']|["']$/g, '')
  }
}
loadEnv()

function sh(cmd, a) {
  const short = a.map(x => (typeof x === 'string' && x.length > 160) ? x.slice(0,160)+'…' : x)
  console.log(`[${cmd}] ${short.join(' ')}`)
  const r = spawnSync(cmd, a, { stdio: 'inherit' })
  if (r.status !== 0) throw new Error(`${cmd} exited ${r.status}`)
}
function shCapture(cmd, a) {
  const r = spawnSync(cmd, a, { encoding: 'utf8' })
  return { status: r.status, stdout: r.stdout || '', stderr: r.stderr || '' }
}
function probe(p) {
  try {
    return execFileSync('ffprobe', ['-v','error','-show_entries',
      'stream=codec_type,width,height,duration,channels,codec_name:format=duration','-of','default=nw=1', p],
      { encoding: 'utf8' }).trim()
  } catch (e) { return `probe-failed: ${e.message}` }
}

const FPS = 30
const W = 1920, H = 1080
const COLORS = {
  cream: '#F5EFE0', parchment: '#EFE6D2', navy: '#0B2545',
  red: '#8C1D18', gold: '#B8860B', ink: '#1E1A14', civicBlue: '#1B3A6B',
  inkNavy: '#0F1F3A',
}

// ── narration (7 lines, voice ends ~22s; overlays then fill 21.5-29s) ──────
const VO_LINES = [
  // align_t = absolute start time of each VO line. Each line MUST start
  // strictly AFTER the prior line ends + ~0.3s breath. v5.0 used overlapping
  // align_t values that caused lines 1+2, 3+4, and 4+5 to play simultaneously
  // (the "two voices drowning each other" founder reported). Re-spaced below.
  //
  // Durations measured on shipped v5 VO mp3s:
  //   l1: 3.72s   l2: 3.58s   l3: 6.59s   l4: 3.30s
  //   l5: 3.02s   l6: 1.25s   l7: 3.39s
  { id: 'l1-145',     text: 'In 2016, he made 145 promises.',                       align_t: 0.30 },
  // l1 ends at 0.30+3.72 = 4.02. +0.6 breath → 4.62
  { id: 'l2-slogans', text: 'Drain the swamp. Build the wall. End the wars.',       align_t: 4.60 },
  // l2 ends at 4.60+3.58 = 8.18. +0.6 breath → 8.78
  { id: 'l3-score',   text: 'Nine years later — 46 kept. 51 partial. 40 broken.',   align_t: 8.80 },
  // l3 ends at 8.80+6.59 = 15.39. +0.5 breath → 15.89
  { id: 'l4-new',     text: 'Then in 2024, he made new promises.',                  align_t: 15.90 },
  // l4 ends at 15.90+3.30 = 19.20. +0.4 breath → 19.60
  { id: 'l5-deleted', text: 'After the election — they deleted them.',              align_t: 19.60 },
  // 0.5s hard silence at ~16.0 before climax
  // l5 ends at 19.60+3.02 = 22.62. +0.8 dramatic silence beat → 23.42
  { id: 'l6-kept',    text: 'SEALED kept them.',                                    align_t: 23.40 },
  // l6 ends at 23.40+1.25 = 24.65. +0.7 breath → 25.35
  { id: 'l7-mark',    text: 'SEALED2016.COM',                                       align_t: 25.40 },
]

const VOICE_ID = 'pNInz6obpgDQGcFmaJgB' // Adam

// Force fresh generation by deleting any cached segments first
function purgeStaleVO() {
  for (const f of fs.readdirSync(VO)) {
    try { fs.unlinkSync(path.join(VO, f)) } catch {}
  }
  console.log('[tts] purged VO cache for fresh v5 narration')
}

async function generateTTS() {
  const key = process.env.ELEVENLABS_API_KEY
  if (!key) throw new Error('ELEVENLABS_API_KEY not set')
  for (const line of VO_LINES) {
    const out = path.join(VO, `${line.id}.mp3`)
    console.log(`[tts] ${line.id}: ${line.text}`)
    const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`, {
      method: 'POST',
      headers: { 'xi-api-key': key, 'Content-Type': 'application/json', 'Accept': 'audio/mpeg' },
      body: JSON.stringify({
        text: line.text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: { stability: 0.55, similarity_boost: 0.8, style: 0.22, use_speaker_boost: true },
      }),
    })
    if (!res.ok) throw new Error(`ElevenLabs ${res.status}: ${(await res.text()).slice(0,240)}`)
    fs.writeFileSync(out, Buffer.from(await res.arrayBuffer()))
    const mtime = new Date(fs.statSync(out).mtime).toISOString()
    console.log(`[tts]   wrote ${out} (${fs.statSync(out).size} bytes, ${mtime})`)
  }
  console.log('[tts] all 7 segments fresh')
}

// ── narration master with per-line LUFS normalization ──────────────────────
// CRITICAL: normalize each line INDIVIDUALLY before delay+mix, so each spoken
// line peaks consistently around -16 LUFS short-term. Avoids the "soft climax"
// problem where short lines (e.g. "SEALED kept them") get buried.
function buildVoMaster(totalSec) {
  const out = path.join(BUILD, 'vo-master.m4a')
  const inputs = []
  const delays = []
  let idx = 0
  for (const line of VO_LINES) {
    const p = path.join(VO, `${line.id}.mp3`)
    if (!fs.existsSync(p)) continue
    inputs.push('-i', p)
    const ms = Math.round(line.align_t * 1000)
    // Per-line loudnorm → ensures every spoken line is at -16 LUFS regardless
    // of original ElevenLabs gain. Then delay + pad to total.
    // l6-kept is short (~1.25s) — climax line. Boost +4dB extra so it punches
    // through against the music swell that lives in that stretch.
    const extraGain = line.id === 'l6-kept' ? ',volume=4dB' : ''
    delays.push(`[${idx}:a]loudnorm=I=-16:TP=-1.5:LRA=7${extraGain},adelay=${ms}|${ms},apad[a${idx}]`)
    idx++
  }
  if (idx === 0) throw new Error('no VO segments found')
  const mixInputs = Array.from({ length: idx }, (_, i) => `[a${i}]`).join('')
  const filter =
    delays.join(';') +
    `;${mixInputs}amix=inputs=${idx}:duration=longest:normalize=0[mixed];` +
    `[mixed]atrim=0:${totalSec},aformat=channel_layouts=stereo[out]`
  sh('ffmpeg', ['-y', ...inputs, '-filter_complex', filter, '-map', '[out]',
    '-c:a', 'aac', '-b:a', '192k', out])
  return out
}

// ── music: REUSE v4 Incompetech mp3 ────────────────────────────────────────
function getMusic() {
  if (!fs.existsSync(V4_MUSIC)) throw new Error(`v4 music not found at ${V4_MUSIC}`)
  const out = path.join(BUILD, 'music.mp3')
  fs.copyFileSync(V4_MUSIC, out)
  const meta = { name: 'Impact Prelude', composer: 'Kevin MacLeod', source: 'incompetech.com', license: 'CC BY 4.0', reused_from: '_build_v4/music.mp3' }
  fs.writeFileSync(path.join(BUILD, 'music-meta.json'), JSON.stringify(meta, null, 2))
  return { path: out, meta }
}

// ── fal.ai: storage upload + queue poll ────────────────────────────────────
async function falUpload(localPath, contentType = 'image/jpeg') {
  const key = process.env.FAL_KEY
  if (!key) throw new Error('FAL_KEY not set')
  const fileName = path.basename(localPath)
  const init = await fetch('https://rest.alpha.fal.ai/storage/upload/initiate', {
    method: 'POST',
    headers: { 'Authorization': `Key ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ content_type: contentType, file_name: fileName }),
  })
  if (!init.ok) throw new Error(`fal storage init ${init.status}: ${await init.text()}`)
  const { file_url, upload_url } = await init.json()
  const buf = fs.readFileSync(localPath)
  const put = await fetch(upload_url, { method: 'PUT', headers: { 'Content-Type': contentType }, body: buf })
  if (!put.ok) throw new Error(`fal upload PUT ${put.status}`)
  return file_url
}

async function falPoll(endpoint, body, { timeoutMs = 6 * 60_000 } = {}) {
  const key = process.env.FAL_KEY
  const submit = await fetch(`https://queue.fal.run/${endpoint}`, {
    method: 'POST',
    headers: { 'Authorization': `Key ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!submit.ok) {
    const t = await submit.text()
    throw new Error(`fal submit ${submit.status}: ${t.slice(0,360)}`)
  }
  const sub = await submit.json()
  const statusUrl = sub.status_url
  const resultUrl = sub.response_url
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    await new Promise(r => setTimeout(r, 3000))
    const s = await fetch(statusUrl, { headers: { 'Authorization': `Key ${key}` } })
    if (!s.ok) continue
    const sj = await s.json()
    console.log(`[fal] ${endpoint.split('/').pop()} status=${sj.status}`)
    if (sj.status === 'COMPLETED') break
    if (sj.status === 'FAILED' || sj.status === 'ERROR') {
      throw new Error(`fal FAILED: ${JSON.stringify(sj).slice(0,360)}`)
    }
  }
  const r = await fetch(resultUrl, { headers: { 'Authorization': `Key ${key}` } })
  if (!r.ok) throw new Error(`fal result ${r.status}: ${(await r.text()).slice(0,300)}`)
  return await r.json()
}

// Try multiple fal i2v endpoints with verified schemas. Returns first success.
async function falImageToVideoMulti({ imagePath, prompt, outPath }) {
  const imgUrl = await falUpload(imagePath, 'image/jpeg')
  const attempts = [
    {
      endpoint: 'fal-ai/kling-video/v1.6/standard/image-to-video',
      body: { prompt, image_url: imgUrl, duration: '5', cfg_scale: 0.5 },
    },
    {
      endpoint: 'fal-ai/minimax/hailuo-02/standard/image-to-video',
      body: { prompt, image_url: imgUrl, duration: '6', resolution: '768P', prompt_optimizer: true },
    },
    {
      endpoint: 'fal-ai/luma-dream-machine/ray-2-flash/image-to-video',
      body: { prompt, image_url: imgUrl, duration: '5s', aspect_ratio: '16:9', resolution: '720p' },
    },
  ]
  const errors = []
  for (const a of attempts) {
    try {
      console.log(`[fal-i2v] trying ${a.endpoint} on ${path.basename(imagePath)}`)
      const result = await falPoll(a.endpoint, a.body)
      const url = result.video?.url || result.url || result.output?.video?.url
      if (!url) throw new Error(`no url in result: ${JSON.stringify(result).slice(0,200)}`)
      const v = await fetch(url)
      if (!v.ok) throw new Error(`download ${v.status}`)
      fs.writeFileSync(outPath, Buffer.from(await v.arrayBuffer()))
      console.log(`[fal-i2v] SUCCESS via ${a.endpoint} → ${fs.statSync(outPath).size} bytes`)
      return { endpoint: a.endpoint, size: fs.statSync(outPath).size }
    } catch (e) {
      const msg = (e.message || String(e)).slice(0, 240)
      console.warn(`[fal-i2v] ${a.endpoint} failed: ${msg}`)
      errors.push({ endpoint: a.endpoint, error: msg })
      // If a moderation/likeness-style rejection, try a softened prompt once more
      if (/moderation|safety|policy|reject|content/i.test(msg)) {
        try {
          const softer = prompt
            .replace(/portrait/gi, 'editorial illustration')
            .replace(/pencil-sketch/gi, 'stylized abstract sketch')
          const body2 = { ...a.body, prompt: softer }
          console.log(`[fal-i2v] retry ${a.endpoint} with softened prompt`)
          const result = await falPoll(a.endpoint, body2)
          const url = result.video?.url || result.url || result.output?.video?.url
          if (url) {
            const v = await fetch(url)
            if (v.ok) {
              fs.writeFileSync(outPath, Buffer.from(await v.arrayBuffer()))
              console.log(`[fal-i2v] SUCCESS (retry) via ${a.endpoint}`)
              return { endpoint: a.endpoint + ' (retry)', size: fs.statSync(outPath).size }
            }
          }
        } catch (e2) {
          errors.push({ endpoint: a.endpoint + ' (retry)', error: (e2.message||'').slice(0,240) })
        }
      }
    }
  }
  throw new Error(`all i2v endpoints failed: ${JSON.stringify(errors).slice(0,400)}`)
}

// ── puppeteer-rendered still frames + overlay PNGs ─────────────────────────
async function renderFrames() {
  const puppeteer = requireFromVC('puppeteer')
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--font-render-hinting=none'],
  })
  const page = await browser.newPage()
  await page.setViewport({ width: W, height: H, deviceScaleFactor: 1 })

  const snap = async (html, out, transparent = false) => {
    await page.setContent(html, { waitUntil: 'domcontentloaded', timeout: 15000 })
    try { await page.evaluate(() => document.fonts && document.fonts.ready) } catch {}
    await new Promise(r => setTimeout(r, 1200))
    if (transparent) {
      await page.evaluate(() => { document.documentElement.style.background = 'transparent'; document.body.style.background = 'transparent'; })
    }
    await page.screenshot({ path: out, type: 'png', omitBackground: transparent })
  }

  const fontImport = `@import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,500;0,700;1,400&family=Instrument+Serif:ital@0;1&family=IBM+Plex+Mono:wght@400;500;700&family=Geist+Mono:wght@400;500;700&display=swap');`

  // End-frame
  const endFrame = `<!doctype html><meta charset="utf-8"><style>
    ${fontImport}
    *,*::before,*::after { box-sizing: border-box; margin: 0; padding: 0; }
    html, body { width: ${W}px; height: ${H}px; }
    body { background:#0A0A0A; background-image: radial-gradient(ellipse at center, rgba(20,20,30,1) 0%, rgba(0,0,0,1) 80%);
      color:#F5EFE0; font-family:'Lora',Georgia,serif; display:flex; align-items:center; justify-content:center; overflow:hidden; }
    .wrap { width: 1500px; text-align: center; }
    .line1 { font-size: 92px; line-height: 1.12; font-weight: 500; color:#E5DDC8; }
    .strike { text-decoration: line-through; text-decoration-color: #8C1D18; text-decoration-thickness: 6px; opacity: 0.95; }
    .line2 { margin-top: 56px; font-size: 116px; font-weight: 700; color:#F5EFE0; letter-spacing: 0.005em; }
    .accent { color: #B8860B; }
  </style><body><div class="wrap">
    <div class="line1"><span class="strike">They deleted the platform.</span></div>
    <div class="line2">SEALED <span class="accent">kept</span> it.</div>
  </div></body>`
  await snap(endFrame, path.join(BUILD, 'end-frame.png'))

  // Wordmark
  const wordmark = `<!doctype html><meta charset="utf-8"><style>
    ${fontImport}
    *,*::before,*::after { box-sizing: border-box; margin: 0; padding: 0; }
    html, body { width: ${W}px; height: ${H}px; }
    body { background:${COLORS.parchment};
      background-image: radial-gradient(ellipse at center, rgba(245,239,224,0) 0%, rgba(0,0,0,0.18) 100%),
        repeating-linear-gradient(0deg, rgba(11,37,69,0.025) 0 1px, transparent 1px 7px);
      color:${COLORS.ink}; font-family:'Lora',Georgia,serif;
      display:flex; align-items:center; justify-content:flex-start; flex-direction:column; padding-top: 240px; overflow:hidden; }
    .wrap { width: 1500px; text-align: center; }
    .rule { width: 380px; height: 2px; background: ${COLORS.navy}; margin: 0 auto 36px; opacity: 0.55; }
    .mark { font-family:'IBM Plex Mono',ui-monospace,Menlo,monospace; font-size: 132px; font-weight: 700; color: ${COLORS.navy}; letter-spacing: 0.04em; }
    .dot { color: ${COLORS.red}; }
    .tag { margin-top: 40px; font-size: 32px; letter-spacing: 0.32em; text-transform: uppercase; color: ${COLORS.ink}; opacity: 0.7; }
    .rule2 { width: 380px; height: 2px; background: ${COLORS.navy}; margin: 36px auto 0; opacity: 0.55; }
  </style><body><div class="wrap">
    <div class="rule"></div>
    <div class="mark">SEALED2016<span class="dot">.</span>COM</div>
    <div class="tag">145 promises · public ledger</div>
    <div class="rule2"></div>
  </div></body>`
  await snap(wordmark, path.join(BUILD, 'wordmark.png'))

  // Scorecard chip (transparent)
  const chip = `<!doctype html><meta charset="utf-8"><style>
    ${fontImport}
    *,*::before,*::after { box-sizing: border-box; margin: 0; padding: 0; }
    html, body { width: ${W}px; height: ${H}px; background: transparent; }
    body { display:flex; align-items:flex-end; justify-content:center; padding-bottom: 88px;
      font-family:'IBM Plex Mono',ui-monospace,Menlo,monospace; }
    .chip { background: rgba(11,37,69,0.94); color: #F5EFE0; padding: 26px 44px; border-radius: 2px;
      display:flex; gap: 38px; align-items: baseline; font-size: 38px; letter-spacing: 0.06em;
      box-shadow: 0 8px 32px rgba(0,0,0,0.4); }
    .item { display:flex; gap: 12px; align-items: baseline; }
    .n { font-size: 60px; font-weight: 700; }
    .lbl { font-size: 20px; text-transform: uppercase; letter-spacing: 0.22em; opacity: 0.85; }
    .kept { color: #7FB069; } .partial { color: #E8B84A; } .broken { color: #E07A5F; }
  </style><body>
    <div class="chip">
      <div class="item"><span class="n kept">46</span><span class="lbl">kept</span></div>
      <div class="item"><span class="n partial">51</span><span class="lbl">partial</span></div>
      <div class="item"><span class="n broken">40</span><span class="lbl">broken</span></div>
    </div>
  </body>`
  await snap(chip, path.join(BUILD, 'scorecard-chip.png'), true)

  // TRUST overlay (transparent PNG, lower-third)
  const trustOverlay = `<!doctype html><meta charset="utf-8"><style>
    ${fontImport}
    *,*::before,*::after { box-sizing: border-box; margin: 0; padding: 0; }
    html, body { width: ${W}px; height: ${H}px; background: transparent; }
    body { display:flex; align-items:flex-end; justify-content:center; padding-bottom: 160px;
      font-family:'Geist Mono','IBM Plex Mono',ui-monospace,Menlo,monospace; }
    .band { background: rgba(239,230,210,0.92); padding: 28px 56px; border-radius: 2px;
      box-shadow: 0 6px 32px rgba(0,0,0,0.35); color: ${COLORS.civicBlue};
      text-align: center; max-width: 1500px; }
    .big { font-size: 56px; font-weight: 700; letter-spacing: 0.02em; color: ${COLORS.civicBlue}; display: block; margin-bottom: 6px; }
    .rest { font-size: 32px; font-weight: 400; letter-spacing: 0.04em; }
  </style><body>
    <div class="band">
      <span class="big">81 of 145</span>
      <span class="rest">promises link to a primary source.</span>
    </div>
  </body>`
  await snap(trustOverlay, path.join(BUILD, 'overlay-trust.png'), true)

  // REVENUE overlay (transparent PNG)
  const revenueOverlay = `<!doctype html><meta charset="utf-8"><style>
    ${fontImport}
    *,*::before,*::after { box-sizing: border-box; margin: 0; padding: 0; }
    html, body { width: ${W}px; height: ${H}px; background: transparent; }
    body { display:flex; align-items:flex-end; justify-content:center; padding-bottom: 160px;
      font-family:'Instrument Serif','Lora',Georgia,serif; }
    .band { background: rgba(239,230,210,0.92); padding: 32px 60px; border-radius: 2px;
      box-shadow: 0 6px 32px rgba(0,0,0,0.35); color: ${COLORS.inkNavy};
      text-align: center; max-width: 1500px; }
    .line { font-size: 64px; font-weight: 400; letter-spacing: 0.005em; line-height: 1.15; font-style: italic; }
  </style><body>
    <div class="band">
      <div class="line">The book the campaign tried to delete.</div>
    </div>
  </body>`
  await snap(revenueOverlay, path.join(BUILD, 'overlay-revenue.png'), true)

  // Credit
  const credit = `<!doctype html><meta charset="utf-8"><style>
    ${fontImport}
    *,*::before,*::after { box-sizing: border-box; margin: 0; padding: 0; }
    html, body { width: ${W}px; height: ${H}px; }
    body { background:${COLORS.parchment};
      background-image: repeating-linear-gradient(0deg, rgba(11,37,69,0.025) 0 1px, transparent 1px 7px);
      color:${COLORS.civicBlue}; font-family:'Geist Mono','IBM Plex Mono',ui-monospace,Menlo,monospace;
      display:flex; align-items:center; justify-content:center; }
    .credit { font-size: 30px; letter-spacing: 0.04em; opacity: 0.85; }
  </style><body>
    <div class="credit">Music: Kevin MacLeod · incompetech.com · CC BY 4.0</div>
  </body>`
  await snap(credit, path.join(BUILD, 'credit.png'))

  await browser.close()
}

function makeCoverFrame(coverPath, outPng) {
  sh('ffmpeg', ['-y', '-i', coverPath,
    '-vf', `scale=-1:980,pad=${W}:${H}:(ow-iw)/2:(oh-ih)/2:color=0xEFE6D2,vignette=PI/5,format=yuv420p`,
    '-frames:v', '1', outPng])
}

function holdKenBurns({ image, duration, out, zoomDir = 'in', shake = true, overlayPng = null, overlayInAt = 0.5 }) {
  const frames = Math.round(duration * FPS)
  const perFrameZ = 0.15 / frames
  const z = zoomDir === 'in'
    ? `zoompan=z='min(zoom+${perFrameZ.toFixed(6)},1.15)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${frames}:s=${W}x${H}:fps=${FPS}`
    : `zoompan=z='if(lte(zoom,1.0),1.15,max(1.001,zoom-${perFrameZ.toFixed(6)}))':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${frames}:s=${W}x${H}:fps=${FPS}`
  const inputs = ['-framerate', String(FPS), '-loop', '1', '-t', String(duration), '-i', image]
  const shakeFx = shake
    ? `,crop=${W}:${H}:'4*sin(2*PI*t*0.7)':'3*cos(2*PI*t*0.5)'`
    : ''
  let filter = `[0:v]scale=${W*2}:${H*2}:force_original_aspect_ratio=increase,crop=${W*2}:${H*2},${z}${shakeFx},trim=duration=${duration},setpts=PTS-STARTPTS,format=yuv420p[bg]`
  let last = 'bg', idx = 1
  if (overlayPng) {
    inputs.push('-framerate', String(FPS), '-loop', '1', '-t', String(duration), '-i', overlayPng)
    filter += `;[${idx}:v]scale=${W}:${H},fade=t=in:st=${overlayInAt}:d=0.4:alpha=1[ov];[${last}][ov]overlay=0:0[wov]`
    last = 'wov'; idx++
  }
  filter += `;[${last}]format=yuv420p[v]`
  sh('ffmpeg', ['-y', ...inputs, '-filter_complex', filter, '-map', '[v]',
    '-r', String(FPS), '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-preset', 'fast', '-crf', '20',
    '-an', out])
}

function normalizeMotionClip({ input, duration, out }) {
  const vf = `scale=${W}:${H}:force_original_aspect_ratio=increase,crop=${W}:${H},trim=duration=${duration},setpts=PTS-STARTPTS,format=yuv420p`
  sh('ffmpeg', ['-y', '-i', input, '-vf', vf,
    '-r', String(FPS), '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-preset', 'fast', '-crf', '20',
    '-an', out])
}

function holdStatic({ image, duration, out, overlayPng = null, overlayInAt = 0.4, overlayOutBefore = 0.4 }) {
  const inputs = ['-framerate', String(FPS), '-loop', '1', '-t', String(duration), '-i', image]
  let filter = `[0:v]scale=${W}:${H},format=yuv420p[bg]`
  let last = 'bg', idx = 1
  if (overlayPng) {
    inputs.push('-framerate', String(FPS), '-loop', '1', '-t', String(duration), '-i', overlayPng)
    const outStart = (duration - overlayOutBefore).toFixed(2)
    filter += `;[${idx}:v]scale=${W}:${H},fade=t=in:st=${overlayInAt}:d=0.4:alpha=1,fade=t=out:st=${outStart}:d=0.4:alpha=1[ov];[${last}][ov]overlay=0:0[wov]`
    last = 'wov'
  }
  filter += `;[${last}]format=yuv420p[v]`
  sh('ffmpeg', ['-y', ...inputs, '-filter_complex', filter, '-map', '[v]',
    '-r', String(FPS), '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-preset', 'fast', '-crf', '20',
    '-an', out])
}

// ── new pacing for v5 ──────────────────────────────────────────────────────
// Segments add to film_duration; credit beat appended after.
// v5.1 timing — re-paced after fixing the VO overlap bug. Narration
// now occupies 0.30 → 28.79s (was overlapping itself by ~5s of voice-on-voice
// in v5.0 because align_t didn't account for prior-line duration). Visual
// holds extended to accommodate the un-overlapped narration; trust+revenue
// overlays moved into the post-narration music-only window 29-37s.
const HOLDS = {
  h1_2016:    4.5,   // 0-4.5      (l1: 0.30-4.02)
  h2_2020:    4.0,   // 4.5-8.5    (l2: 4.60-8.18, fal motion)
  h3_2024:    7.0,   // 8.5-15.5   (l3 scorecard reveal: 8.80-15.39)
  h4_doc:     4.0,   // 15.5-19.5  (l4: 15.90-19.20)
  h5_2026:    3.5,   // 19.5-23    (l5: 19.60-22.62, fal motion)
  h6_donate:  2.0,   // 23-25      (l6 climax: 23.40-24.65)
  h7_end:     4.0,   // 25-29      (l7 + end-frame reveal: 25.40-28.79)
  h8_trust:   4.0,   // 29-33      (TRUST overlay, music-only)
  h9_revenue: 4.0,   // 33-37      (REVENUE overlay, music-only)
  h10_mark:   3.0,   // 37-40      (wordmark hold + fade)
  credit:     2.0,   // 40-42      (Incompetech CC-BY beat)
}

async function buildSegments() {
  const seg = (n) => path.join(BUILD, `seg-${n}.mp4`)
  const f2016 = path.join(BUILD, 'frame-2016.png')
  const f2020 = path.join(BUILD, 'frame-2020.png')
  const f2024 = path.join(BUILD, 'frame-2024.png')
  const f2026 = path.join(BUILD, 'frame-2026.png')
  makeCoverFrame(path.join(PUBLIC, 'cover-2016.jpg'), f2016)
  makeCoverFrame(path.join(PUBLIC, 'cover-2020.jpg'), f2020)
  makeCoverFrame(path.join(PUBLIC, 'cover-2024.jpg'), f2024)
  makeCoverFrame(path.join(PUBLIC, 'cover-2026.jpg'), f2026)

  const motion = { i2v: { attempted: [], succeeded: [], failed: [] } }

  // 1. cover-2016 ken-burns
  holdKenBurns({ image: f2016, duration: HOLDS.h1_2016, out: seg('1-2016'), zoomDir: 'in' })

  // 2. cover-2020 MOTION via fal i2v
  {
    const target = seg('2-2020')
    const raw = path.join(BUILD, 'i2v-2020.mp4')
    if (!SKIP_FAL_MOTION && !(fs.existsSync(raw) && fs.statSync(raw).size > 50_000)) {
      motion.i2v.attempted.push('cover-2020')
      try {
        const r = await falImageToVideoMulti({
          imagePath: path.join(PUBLIC, 'cover-2020.jpg'),
          prompt: 'subtle cinematic motion, slow dramatic camera dolly forward, atmospheric, news-documentary register, editorial illustration book cover, paper grain, no abrupt movement',
          outPath: raw,
        })
        motion.i2v.succeeded.push({ id: 'cover-2020', via: r.endpoint, bytes: r.size })
      } catch (e) {
        motion.i2v.failed.push({ id: 'cover-2020', error: (e.message||'').slice(0,400) })
      }
    }
    if (fs.existsSync(raw) && fs.statSync(raw).size > 50_000) {
      normalizeMotionClip({ input: raw, duration: HOLDS.h2_2020, out: target })
    } else {
      console.log('[motion] 2 → ken-burns fallback')
      holdKenBurns({ image: f2020, duration: HOLDS.h2_2020, out: target, zoomDir: 'in', shake: true })
    }
  }

  // 3. cover-2024 + scorecard chip
  holdKenBurns({
    image: f2024, duration: HOLDS.h3_2024, out: seg('3-2024'), zoomDir: 'in',
    overlayPng: path.join(BUILD, 'scorecard-chip.png'), overlayInAt: 1.2, shake: false,
  })

  // 4. cover-2024 dolly-in (b-roll replacement — slower, no chip)
  holdKenBurns({ image: f2024, duration: HOLDS.h4_doc, out: seg('4-doc'), zoomDir: 'out', shake: true })

  // 5. cover-2026 MOTION via fal i2v
  {
    const target = seg('5-2026')
    const raw = path.join(BUILD, 'i2v-2026.mp4')
    if (!SKIP_FAL_MOTION && !(fs.existsSync(raw) && fs.statSync(raw).size > 50_000)) {
      motion.i2v.attempted.push('cover-2026')
      try {
        const r = await falImageToVideoMulti({
          imagePath: path.join(PUBLIC, 'cover-2026.jpg'),
          prompt: 'subtle cinematic motion, slow dramatic camera dolly forward, atmospheric, news-documentary register, editorial illustration book cover, paper grain, no abrupt movement',
          outPath: raw,
        })
        motion.i2v.succeeded.push({ id: 'cover-2026', via: r.endpoint, bytes: r.size })
      } catch (e) {
        motion.i2v.failed.push({ id: 'cover-2026', error: (e.message||'').slice(0,400) })
      }
    }
    if (fs.existsSync(raw) && fs.statSync(raw).size > 50_000) {
      normalizeMotionClip({ input: raw, duration: HOLDS.h5_2026, out: target })
    } else {
      console.log('[motion] 5 → ken-burns fallback')
      holdKenBurns({ image: f2026, duration: HOLDS.h5_2026, out: target, zoomDir: 'in', shake: true })
    }
  }

  // 6. live-donaldjtrump zoom-in
  holdKenBurns({ image: V2_DONATE, duration: HOLDS.h6_donate, out: seg('6-donate'), zoomDir: 'in', shake: false })

  // 7. end-frame reveal
  holdKenBurns({ image: path.join(BUILD, 'end-frame.png'), duration: HOLDS.h7_end, out: seg('7-end'), zoomDir: 'in', shake: false })

  // 8. wordmark + TRUST overlay (21.5-25s)
  holdStatic({
    image: path.join(BUILD, 'wordmark.png'),
    duration: HOLDS.h8_trust,
    out: seg('8-trust'),
    overlayPng: path.join(BUILD, 'overlay-trust.png'),
    overlayInAt: 0.0, overlayOutBefore: 0.4,
  })

  // 9. wordmark + REVENUE overlay (25-29s)
  holdStatic({
    image: path.join(BUILD, 'wordmark.png'),
    duration: HOLDS.h9_revenue,
    out: seg('9-revenue'),
    overlayPng: path.join(BUILD, 'overlay-revenue.png'),
    overlayInAt: 0.0, overlayOutBefore: 0.4,
  })

  // 10. wordmark hold + fade
  holdKenBurns({ image: path.join(BUILD, 'wordmark.png'), duration: HOLDS.h10_mark, out: seg('10-mark'), zoomDir: 'out', shake: false })

  // credit
  holdStatic({ image: path.join(BUILD, 'credit.png'), duration: HOLDS.credit, out: seg('11-credit') })

  fs.writeFileSync(path.join(BUILD, 'motion-outcomes.json'), JSON.stringify(motion, null, 2))

  return {
    segments: [
      seg('1-2016'), seg('2-2020'), seg('3-2024'), seg('4-doc'),
      seg('5-2026'), seg('6-donate'), seg('7-end'),
      seg('8-trust'), seg('9-revenue'), seg('10-mark'),
      seg('11-credit'),
    ],
    motion,
  }
}

function concatSegments(segments, outPath) {
  const list = path.join(BUILD, 'concat.txt')
  fs.writeFileSync(list, segments.map(p => `file '${p.replace(/'/g, "\\'")}'`).join('\n') + '\n')
  sh('ffmpeg', ['-y', '-f', 'concat', '-safe', '0', '-i', list,
    '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-preset', 'medium', '-crf', '21',
    '-maxrate', '2400k', '-bufsize', '4800k',
    '-r', String(FPS), '-movflags', '+faststart', outPath])
}

// ── audio master: voice loudnorm + sidechain-ducked music + loudnorm master
function buildAudioMaster(voPath, musicPath, totalDuration) {
  const out = path.join(BUILD, 'audio-master.m4a')
  // Voice already loudnormed to -16 LUFS in buildVoMaster.
  // Music base level set so non-ducked is around -22 LUFS; ducked by sidechain.
  // sidechaincompress reduces gain when sidechain signal (voice) crosses threshold.
  // We use threshold 0.05, ratio 8, attack 200ms, release 600ms — exactly as spec.
  // Pre-attenuate music to start near -22 LUFS. Use loudnorm I=-22.
  const filter =
    // 0: voice (already loud-normed). Pad to total duration. Keep stereo.
    `[0:a]apad,atrim=0:${totalDuration},asetpts=PTS-STARTPTS[voice];` +
    // 1: music. loudnorm to -22, fade in/out, pad / trim to total. Stereo.
    `[1:a]aformat=channel_layouts=stereo,aloop=loop=-1:size=2e9,atrim=0:${totalDuration},` +
      `loudnorm=I=-26:TP=-3:LRA=11,volume=0.7,` +
      // Hard time-gated extra duck during the "SEALED kept them" climax window
      // (16.4-18.2s). Belt-and-suspenders against sidechain rebound on the
      // short climax line.
      `volume='if(between(t,23.0,25.0), 0.18, 1.0)':eval=frame,` +
      `afade=t=in:st=0:d=0.8,afade=t=out:st=${(totalDuration-1.2).toFixed(2)}:d=1.2[mu];` +
    // Sidechain: voice signal triggers compression on music
    `[mu][voice]sidechaincompress=threshold=0.03:ratio=20:attack=120:release=500:level_sc=3[mu_ducked];` +
    // Mix
    `[voice][mu_ducked]amix=inputs=2:duration=first:normalize=0[mix];` +
    `[mix]atrim=0:${totalDuration},asetpts=PTS-STARTPTS,` +
      `loudnorm=I=-14:TP=-1:LRA=11,` +
      `alimiter=limit=0.94:attack=5:release=50[out]`
  sh('ffmpeg', ['-y', '-i', voPath, '-i', musicPath,
    '-filter_complex', filter,
    '-map', '[out]', '-c:a', 'aac', '-b:a', '192k', '-ac', '2', out])
  return out
}

function muxAudio(videoPath, audioPath, outPath) {
  sh('ffmpeg', ['-y', '-i', videoPath, '-i', audioPath,
    '-map', '0:v:0', '-map', '1:a:0',
    '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k',
    '-shortest', '-movflags', '+faststart', outPath])
}

function make9x16(srcPath, outPath) {
  sh('ffmpeg', ['-y', '-i', srcPath,
    '-vf', `crop=608:1080:(iw-608)/2:0,scale=1080:1920,format=yuv420p`,
    '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-preset', 'medium', '-crf', '23',
    '-maxrate', '1600k', '-bufsize', '3200k',
    '-r', String(FPS), '-c:a', 'aac', '-b:a', '128k', '-movflags', '+faststart', outPath])
}

function poster(srcPath, outPath) {
  sh('ffmpeg', ['-y', '-ss', '7.5', '-i', srcPath, '-frames:v', '1', '-q:v', '2', outPath])
}

// ── Verification: count audio streams, RMS scan, LUFS measurement ──────────
function countAudioStreams(filePath) {
  const r = shCapture('ffprobe', ['-v','error','-select_streams','a','-show_entries','stream=index,codec_name,channels','-of','json', filePath])
  const j = JSON.parse(r.stdout || '{}')
  return (j.streams || []).length
}

function rmsScanWindows(filePath, windows) {
  // windows: array of {label, start, end}
  // For each, run ffmpeg astats per channel and capture overall RMS dB.
  const results = []
  for (const w of windows) {
    const dur = (w.end - w.start).toFixed(2)
    // Extract two RMS values: full mix (best we can do at audio-master stage).
    // Caller will run this on voPath separately and musicPath separately.
    const r = shCapture('ffmpeg', ['-hide_banner', '-nostats', '-ss', String(w.start), '-i', filePath, '-t', dur, '-af', 'astats=metadata=1:reset=0', '-f', 'null', '-'])
    const out = r.stderr
    // Grab the last "RMS level dB:" value
    const matches = [...out.matchAll(/RMS level dB:\s*(-?\d+\.\d+|-?inf)/g)]
    let rms = null
    if (matches.length) {
      // Use the last (overall) value
      const v = matches[matches.length - 1][1]
      rms = v === '-inf' ? -120 : parseFloat(v)
    }
    results.push({ ...w, rms_db: rms })
  }
  return results
}

function measureLUFS(filePath) {
  const r = shCapture('ffmpeg', ['-hide_banner', '-nostats', '-i', filePath, '-af', 'loudnorm=I=-14:TP=-1:LRA=11:print_format=json', '-f', 'null', '-'])
  const m = r.stderr.match(/\{[\s\S]*?"input_i"[\s\S]*?\}/)
  if (!m) return { error: 'no loudnorm json found' }
  try { return JSON.parse(m[0]) } catch (e) { return { error: e.message } }
}

async function main() {
  console.log('[v5] SEALED hook film v5 — real motion + audio discipline + overlays')

  const filmDuration = Object.entries(HOLDS).filter(([k]) => k !== 'credit').reduce((a,[,v])=>a+v, 0)
  const totalDuration = filmDuration + HOLDS.credit
  console.log(`[v5] film=${filmDuration}s credit=${HOLDS.credit}s total=${totalDuration}s`)

  const required = [
    path.join(PUBLIC, 'cover-2016.jpg'),
    path.join(PUBLIC, 'cover-2020.jpg'),
    path.join(PUBLIC, 'cover-2024.jpg'),
    path.join(PUBLIC, 'cover-2026.jpg'),
    V2_DONATE,
    V4_MUSIC,
  ]
  for (const p of required) if (!fs.existsSync(p)) throw new Error(`missing asset: ${p}`)

  await renderFrames()

  if (!SKIP_TTS) {
    purgeStaleVO()
    await generateTTS()
  }
  const voTrack = buildVoMaster(totalDuration)

  const musicInfo = getMusic()

  const { segments, motion } = await buildSegments()
  const masterSilent = path.join(BUILD, 'master-silent.mp4')
  concatSegments(segments, masterSilent)

  const audioMaster = buildAudioMaster(voTrack, musicInfo.path, totalDuration)

  const master = path.join(MOVIE_OUT, 'sealed-hook-v5.mp4')
  const reel = path.join(MOVIE_OUT, 'sealed-hook-v5-9x16.mp4')
  const posterPath = path.join(MOVIE_OUT, 'sealed-hook-v5-poster.jpg')

  muxAudio(masterSilent, audioMaster, master)
  make9x16(master, reel)
  poster(master, posterPath)

  // ── verification ─────────────────────────────────────────────────────────
  console.log('\n[v5][verify] master:\n' + probe(master))
  console.log('[v5][verify] reel:\n' + probe(reel))

  const masterAudioStreams = countAudioStreams(master)
  console.log(`[v5][verify] master audio streams: ${masterAudioStreams} (must be 1)`)

  // RMS windows: scan each line over its actual speech duration (probed from
  // the mp3) — NOT a fixed 2.4s, since short lines like "SEALED kept them" get
  // their RMS dragged down by trailing silence. Inset 0.1s on each side to
  // dodge the attack envelope.
  function probeDur(p) {
    const r = shCapture('ffprobe', ['-v','error','-show_entries','format=duration','-of','default=nw=1:nk=1', p])
    return parseFloat((r.stdout||'0').trim()) || 1.5
  }
  const speechWindows = VO_LINES.map(l => {
    const dur = probeDur(path.join(VO, `${l.id}.mp3`))
    return { label: l.id, start: l.align_t + 0.1, end: l.align_t + Math.max(0.4, dur - 0.1) }
  })

  // Build a music-only ducked track for the diff scan
  const muOnly = path.join(BUILD, 'music-ducked-only.m4a')
  sh('ffmpeg', ['-y', '-i', voTrack, '-i', musicInfo.path, '-filter_complex',
    `[0:a]apad,atrim=0:${totalDuration},asetpts=PTS-STARTPTS[voice];` +
    `[1:a]aformat=channel_layouts=stereo,aloop=loop=-1:size=2e9,atrim=0:${totalDuration},` +
      `loudnorm=I=-26:TP=-3:LRA=11,volume=0.7,` +
      `volume='if(between(t,23.0,25.0), 0.18, 1.0)':eval=frame[mu];` +
    `[mu][voice]sidechaincompress=threshold=0.03:ratio=20:attack=120:release=500:level_sc=3[out]`,
    '-map', '[out]', '-c:a', 'aac', '-b:a', '192k', muOnly])

  const voRms = rmsScanWindows(voTrack, speechWindows)
  const muRms = rmsScanWindows(muOnly, speechWindows)

  console.log('\n[v5][verify] RMS scan (per speech window):')
  console.log('  window     voice_dB   music_dB   diff_dB   pass(≥8)')
  let rmsPass = true
  const rmsRows = []
  for (let i = 0; i < voRms.length; i++) {
    const v = voRms[i].rms_db, m = muRms[i].rms_db
    const diff = (v != null && m != null) ? (v - m) : null
    const pass = diff != null && diff >= 8
    if (!pass) rmsPass = false
    const row = { label: voRms[i].label, voice_db: v, music_db: m, diff_db: diff, pass }
    rmsRows.push(row)
    console.log(`  ${row.label.padEnd(10)} ${String(v).padStart(8)}   ${String(m).padStart(8)}   ${String(diff?.toFixed(2)).padStart(7)}   ${pass ? 'YES' : 'NO '}`)
  }

  const voLUFS = measureLUFS(voTrack)
  const muLUFS = measureLUFS(musicInfo.path)
  const masterLUFS = measureLUFS(master)
  console.log('\n[v5][verify] LUFS:')
  console.log(`  voice integrated: ${voLUFS.input_i}`)
  console.log(`  music integrated: ${muLUFS.input_i}`)
  console.log(`  master integrated: ${masterLUFS.input_i}`)

  fs.writeFileSync(path.join(BUILD, 'verification.json'), JSON.stringify({
    duration_target_s: totalDuration,
    audio_streams: masterAudioStreams,
    rms_pass: rmsPass,
    rms_rows: rmsRows,
    lufs: { voice: voLUFS.input_i, music: muLUFS.input_i, master: masterLUFS.input_i },
    motion,
  }, null, 2))

  if (masterAudioStreams !== 1) {
    throw new Error(`audio stream count = ${masterAudioStreams}, expected 1. DO NOT SHIP.`)
  }
  if (!rmsPass) {
    console.warn('\n[v5][verify] WARNING: RMS differential below 8dB at one or more speech windows. See verification.json. NOT shipping by spec.')
    throw new Error('RMS verification FAILED — music too close to voice. Remix required.')
  }

  const mb = (p) => (fs.statSync(p).size / 1_000_000).toFixed(2)
  console.log('\n[v5] === SUMMARY ===')
  console.log(`  master:  ${master}  ${mb(master)} MB`)
  console.log(`  reel:    ${reel}   ${mb(reel)} MB`)
  console.log(`  poster:  ${posterPath}  ${(fs.statSync(posterPath).size/1000).toFixed(1)} KB`)
  console.log(`  motion succeeded: ${motion.i2v.succeeded.length} of ${motion.i2v.attempted.length}`)
  console.log(`  RMS pass: ${rmsPass}`)
}

main().catch(e => { console.error('[v5] FATAL:', e); process.exit(1) })
