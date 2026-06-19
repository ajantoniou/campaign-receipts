#!/usr/bin/env node
/**
 * SEALED 30-sec hook film v4 — trailer-grade cinematic cut.
 *
 * Forked from v3 (60s cinematic). Tightened to ~30s + 2s music credit.
 * Hard cuts (no xfade), aggressive ken-burns on stills, fal i2v on covers,
 * fal text-to-video for 2 b-roll inserts.
 *
 * Music: Incompetech "Impact Prelude" by Kevin MacLeod, CC BY 4.0.
 *        Attribution credit beat at end of film.
 *        Fallback chain: Hitman → Volatile Reaction → Heroic Age.
 *
 * Narration: ElevenLabs Adam, 6 lines tightened ~20s of voice.
 *
 * 9 holds + 1 credit beat = ~32s total:
 *   0-3s   Hold 1  cover-2016 (aggressive ken-burns)
 *   3-6s   Hold 2  cover-2020 (fal i2v → ken-burns fallback)
 *   6-10s  Hold 3  cover-2024 + scorecard chip
 *   10-13s Hold 4  b-roll 1 (fal t2v: courthouse/newsroom)
 *   13-15s Hold 5  cover-2026 (fal i2v → ken-burns fallback)
 *   15-17s Hold 6  b-roll 2 (fal t2v: typing/documents)
 *   17-22s Hold 7  live-donaldjtrump zoom-in
 *   22-26s Hold 8  end-frame
 *   26-30s Hold 9  wordmark hold
 *   30-32s Credit  "Music: Kevin MacLeod · incompetech.com · CC BY 4.0"
 *
 * Audio mix: narration -3dB, music -12dB, music ducks at ~15.9-16.4s
 * (the load-bearing half-second silence before "SEALED kept them").
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
const BUILD = path.join(MOVIE_OUT, '_build_v4')
const VO = path.join(BUILD, 'vo')
const V2_DONATE = path.join(MOVIE_OUT, '_build_v2', 'live-donaldjtrump.png')

const VC_NODE = path.join(COMPANY_ROOT, 'node_modules')
const requireFromVC = createRequire(path.join(VC_NODE, 'package.json'))

fs.mkdirSync(BUILD, { recursive: true })
fs.mkdirSync(VO, { recursive: true })

const args = new Set(process.argv.slice(2))
const SKIP_TTS = args.has('--skip-tts')
const SKIP_MUSIC = args.has('--skip-music')
const SKIP_FAL_MOTION = args.has('--skip-fal-motion')
const SKIP_BROLL = args.has('--skip-broll')

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
  const short = a.map(x => (typeof x === 'string' && x.length > 120) ? x.slice(0,120)+'…' : x)
  console.log(`[ffmpeg] ${cmd} ${short.join(' ')}`)
  const r = spawnSync(cmd, a, { stdio: 'inherit' })
  if (r.status !== 0) throw new Error(`${cmd} exited ${r.status}`)
}
function probe(p) {
  try {
    return execFileSync('ffprobe', ['-v','error','-show_entries',
      'stream=codec_type,width,height,duration:format=duration','-of','default=nw=1', p],
      { encoding: 'utf8' }).trim()
  } catch (e) { return `probe-failed: ${e.message}` }
}

const FPS = 30
const W = 1920, H = 1080
const COLORS = {
  cream: '#F5EFE0', parchment: '#EFE6D2', navy: '#0B2545',
  red: '#8C1D18', gold: '#B8860B', ink: '#1E1A14', civicBlue: '#1B3A6B',
}

// ── narration (7 lines, ~20s voice) ────────────────────────────────────────
const VO_LINES = [
  { id: 'l1-145',     text: 'In 2016, he made 145 promises.',                       align_t: 0.40 },
  { id: 'l2-slogans', text: 'Drain the swamp. Build the wall. End the wars.',       align_t: 2.40 },
  { id: 'l3-score',   text: 'Nine years later — 46 kept. 51 partial. 40 broken.',   align_t: 6.20 },
  { id: 'l4-new',     text: 'Then in 2024, he made new promises.',                  align_t: 10.30 },
  { id: 'l5-deleted', text: 'After the election — they deleted them.',              align_t: 13.10 },
  // ~0.5s silence beat at 16.0
  { id: 'l6-kept',    text: 'SEALED kept them.',                                    align_t: 16.50 },
  { id: 'l7-mark',    text: 'SEALED2016.COM',                                       align_t: 19.80 },
]

const VOICE_ID = 'pNInz6obpgDQGcFmaJgB'

async function generateTTS() {
  const key = process.env.ELEVENLABS_API_KEY
  if (!key) throw new Error('ELEVENLABS_API_KEY not set')
  for (const line of VO_LINES) {
    const out = path.join(VO, `${line.id}.mp3`)
    if (fs.existsSync(out) && fs.statSync(out).size > 1000) { console.log(`[tts] cached ${line.id}`); continue }
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
  }
  console.log('[tts] done')
}

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
    delays.push(`[${idx}:a]adelay=${ms}|${ms},apad[a${idx}]`)
    idx++
  }
  if (idx === 0) throw new Error('no VO segments found')
  const mixInputs = Array.from({ length: idx }, (_, i) => `[a${i}]`).join('')
  const filter =
    delays.join(';') +
    `;${mixInputs}amix=inputs=${idx}:duration=longest:normalize=0[mixed];` +
    `[mixed]atrim=0:${totalSec},loudnorm=I=-16:TP=-1.5:LRA=11[out]`
  sh('ffmpeg', ['-y', ...inputs, '-filter_complex', filter, '-map', '[out]',
    '-c:a', 'aac', '-b:a', '192k', out])
  return out
}

// ── music: Incompetech (Kevin MacLeod) ─────────────────────────────────────
const INCOMPETECH_TRACKS = [
  { name: 'Impact Prelude',    url: 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Impact%20Prelude.mp3' },
  { name: 'Hitman',            url: 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Hitman.mp3' },
  { name: 'Volatile Reaction', url: 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Volatile%20Reaction.mp3' },
  { name: 'Heroic Age',        url: 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Heroic%20Age.mp3' },
]

async function getMusic() {
  const out = path.join(BUILD, 'music.mp3')
  const meta = path.join(BUILD, 'music-meta.json')
  if (fs.existsSync(out) && fs.statSync(out).size > 50_000 && fs.existsSync(meta)) {
    console.log('[music] cached')
    return { path: out, meta: JSON.parse(fs.readFileSync(meta, 'utf8')) }
  }
  for (const t of INCOMPETECH_TRACKS) {
    try {
      console.log(`[music] fetching ${t.name} …`)
      const r = await fetch(t.url, { headers: { 'User-Agent': 'Mozilla/5.0' } })
      if (!r.ok) { console.warn(`[music] ${t.name} HTTP ${r.status}`); continue }
      const buf = Buffer.from(await r.arrayBuffer())
      if (buf.length < 50_000) { console.warn(`[music] ${t.name} too small`); continue }
      fs.writeFileSync(out, buf)
      const info = { name: t.name, url: t.url, license: 'CC BY 4.0', composer: 'Kevin MacLeod', source: 'incompetech.com' }
      fs.writeFileSync(meta, JSON.stringify(info, null, 2))
      console.log(`[music] saved ${t.name} (${buf.length} bytes)`)
      return { path: out, meta: info }
    } catch (e) {
      console.warn(`[music] ${t.name} failed: ${e.message}`)
    }
  }
  throw new Error('all Incompetech tracks failed')
}

// ── fal.ai storage + i2v + t2v ─────────────────────────────────────────────
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

async function falPoll(endpoint, body, { timeoutMs = 5 * 60_000 } = {}) {
  const key = process.env.FAL_KEY
  const submit = await fetch(`https://queue.fal.run/${endpoint}`, {
    method: 'POST',
    headers: { 'Authorization': `Key ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!submit.ok) {
    const t = await submit.text()
    throw new Error(`fal submit ${submit.status}: ${t.slice(0,300)}`)
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
      throw new Error(`fal FAILED: ${JSON.stringify(sj).slice(0,300)}`)
    }
  }
  const r = await fetch(resultUrl, { headers: { 'Authorization': `Key ${key}` } })
  if (!r.ok) throw new Error(`fal result ${r.status}`)
  return await r.json()
}

async function falImage2Video({ imagePath, prompt, duration = 5, outPath }) {
  console.log(`[fal-i2v] uploading ${path.basename(imagePath)} …`)
  const imgUrl = await falUpload(imagePath, 'image/jpeg')
  console.log(`[fal-i2v] generating: "${prompt.slice(0,80)}…"`)
  const result = await falPoll('fal-ai/wan-25/image-to-video', {
    prompt, image_url: imgUrl,
    duration: Math.max(3, Math.round(duration)),
    resolution: '720p',
  })
  const url = result.video?.url || result.url
  if (!url) throw new Error(`fal i2v no url: ${JSON.stringify(result).slice(0,240)}`)
  const v = await fetch(url)
  if (!v.ok) throw new Error(`fal i2v download ${v.status}`)
  fs.writeFileSync(outPath, Buffer.from(await v.arrayBuffer()))
  console.log(`[fal-i2v] saved ${outPath} (${fs.statSync(outPath).size} bytes)`)
}

async function falText2Video({ prompt, duration = 5, outPath }) {
  console.log(`[fal-t2v] "${prompt.slice(0,80)}…"`)
  const result = await falPoll('fal-ai/wan-25/text-to-video', {
    prompt, duration: Math.max(3, Math.round(duration)),
    resolution: '720p', aspect_ratio: '16:9',
  })
  const url = result.video?.url || result.url
  if (!url) throw new Error(`fal t2v no url: ${JSON.stringify(result).slice(0,240)}`)
  const v = await fetch(url)
  if (!v.ok) throw new Error(`fal t2v download ${v.status}`)
  fs.writeFileSync(outPath, Buffer.from(await v.arrayBuffer()))
  console.log(`[fal-t2v] saved ${outPath} (${fs.statSync(outPath).size} bytes)`)
}

// ── puppeteer-rendered frames ──────────────────────────────────────────────
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

  const fontImport = `@import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,500;0,700;1,400&family=IBM+Plex+Mono:wght@400;500;700&family=Geist+Mono:wght@400;500&display=swap');`

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

  const wordmark = `<!doctype html><meta charset="utf-8"><style>
    ${fontImport}
    *,*::before,*::after { box-sizing: border-box; margin: 0; padding: 0; }
    html, body { width: ${W}px; height: ${H}px; }
    body { background:${COLORS.parchment};
      background-image: radial-gradient(ellipse at center, rgba(245,239,224,0) 0%, rgba(0,0,0,0.18) 100%),
        repeating-linear-gradient(0deg, rgba(11,37,69,0.025) 0 1px, transparent 1px 7px);
      color:${COLORS.ink}; font-family:'Lora',Georgia,serif;
      display:flex; align-items:center; justify-content:center; overflow:hidden; }
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

function holdStatic({ image, duration, out }) {
  sh('ffmpeg', ['-y', '-framerate', String(FPS), '-loop', '1', '-t', String(duration), '-i', image,
    '-vf', `scale=${W}:${H},format=yuv420p`,
    '-r', String(FPS), '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-preset', 'fast', '-crf', '20',
    '-an', out])
}

const HOLDS = {
  h1: 3.0, h2: 3.0, h3: 4.0, h4: 3.0, h5: 2.0,
  h6: 2.0, h7: 5.0, h8: 4.0, h9: 4.0, credit: 2.0,
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

  const motion = { i2v: { attempted: [], succeeded: [], failed: [] },
                   t2v: { attempted: [], succeeded: [], failed: [] } }

  // Hold 1
  holdKenBurns({ image: f2016, duration: HOLDS.h1, out: seg('1-2016'), zoomDir: 'in' })

  // Hold 2: fal i2v on cover-2020 → fallback ken-burns
  {
    const target = seg('2-2020')
    const raw = path.join(BUILD, 'i2v-2020.mp4')
    if (!SKIP_FAL_MOTION && !fs.existsSync(raw)) {
      motion.i2v.attempted.push('cover-2020')
      try {
        await falImage2Video({
          imagePath: f2020,
          prompt: 'Subtle parallax push-in on a worn pencil-sketch campaign book cover. Documentary archival mood, paper-grain texture, gentle camera drift.',
          duration: 4, outPath: raw,
        })
      } catch (e) {
        console.warn(`[fal-i2v] cover-2020 FAILED: ${e.message}`)
        motion.i2v.failed.push({ id: 'cover-2020', error: e.message.slice(0,160) })
      }
    }
    if (fs.existsSync(raw) && fs.statSync(raw).size > 50_000) {
      normalizeMotionClip({ input: raw, duration: HOLDS.h2, out: target })
      motion.i2v.succeeded.push('cover-2020')
    } else {
      console.log('[motion] Hold 2 → ken-burns fallback')
      holdKenBurns({ image: f2020, duration: HOLDS.h2, out: target, zoomDir: 'in', shake: true })
    }
  }

  // Hold 3
  holdKenBurns({
    image: f2024, duration: HOLDS.h3, out: seg('3-2024'), zoomDir: 'in',
    overlayPng: path.join(BUILD, 'scorecard-chip.png'), overlayInAt: 1.2, shake: false,
  })

  // Hold 4: b-roll 1 (t2v)
  {
    const target = seg('4-broll1')
    const raw = path.join(BUILD, 't2v-courthouse.mp4')
    if (!SKIP_BROLL && !fs.existsSync(raw)) {
      motion.t2v.attempted.push('courthouse-newsroom')
      try {
        await falText2Video({
          prompt: 'Tense empty newsroom or marble courthouse hallway, cinematic documentary footage, fluorescent overhead lights, papers and folders on a desk, slow low handheld camera move, desaturated color palette, no people faces visible. 16:9.',
          duration: 4, outPath: raw,
        })
      } catch (e) {
        console.warn(`[fal-t2v] b-roll 1 FAILED: ${e.message}`)
        motion.t2v.failed.push({ id: 'b-roll-1', error: e.message.slice(0,160) })
      }
    }
    if (fs.existsSync(raw) && fs.statSync(raw).size > 50_000) {
      normalizeMotionClip({ input: raw, duration: HOLDS.h4, out: target })
      motion.t2v.succeeded.push('b-roll-1')
    } else {
      console.log('[motion] Hold 4 → ken-burns end-frame fallback')
      holdKenBurns({ image: path.join(BUILD, 'end-frame.png'), duration: HOLDS.h4, out: target, zoomDir: 'in', shake: true })
    }
  }

  // Hold 5: fal i2v on cover-2026
  {
    const target = seg('5-2026')
    const raw = path.join(BUILD, 'i2v-2026.mp4')
    if (!SKIP_FAL_MOTION && !fs.existsSync(raw)) {
      motion.i2v.attempted.push('cover-2026')
      try {
        await falImage2Video({
          imagePath: f2026,
          prompt: 'Slow zoom-in on a stark pencil-sketch campaign book cover. Cinematic documentary mood, subtle paper grain, gentle camera motion.',
          duration: 3, outPath: raw,
        })
      } catch (e) {
        console.warn(`[fal-i2v] cover-2026 FAILED: ${e.message}`)
        motion.i2v.failed.push({ id: 'cover-2026', error: e.message.slice(0,160) })
      }
    }
    if (fs.existsSync(raw) && fs.statSync(raw).size > 50_000) {
      normalizeMotionClip({ input: raw, duration: HOLDS.h5, out: target })
      motion.i2v.succeeded.push('cover-2026')
    } else {
      console.log('[motion] Hold 5 → ken-burns fallback')
      holdKenBurns({ image: f2026, duration: HOLDS.h5, out: target, zoomDir: 'in', shake: true })
    }
  }

  // Hold 6: b-roll 2 (t2v)
  {
    const target = seg('6-broll2')
    const raw = path.join(BUILD, 't2v-typing.mp4')
    if (!SKIP_BROLL && !fs.existsSync(raw)) {
      motion.t2v.attempted.push('typing-documents')
      try {
        await falText2Video({
          prompt: 'Extreme close-up of hands typing on a backlit laptop keyboard, documents scrolling on screen. Modern office, dim lighting, cinematic shallow depth-of-field, fast urgent typing motion. 16:9.',
          duration: 3, outPath: raw,
        })
      } catch (e) {
        console.warn(`[fal-t2v] b-roll 2 FAILED: ${e.message}`)
        motion.t2v.failed.push({ id: 'b-roll-2', error: e.message.slice(0,160) })
      }
    }
    if (fs.existsSync(raw) && fs.statSync(raw).size > 50_000) {
      normalizeMotionClip({ input: raw, duration: HOLDS.h6, out: target })
      motion.t2v.succeeded.push('b-roll-2')
    } else {
      console.log('[motion] Hold 6 → ken-burns fallback')
      holdKenBurns({ image: f2026, duration: HOLDS.h6, out: target, zoomDir: 'out', shake: true })
    }
  }

  holdKenBurns({ image: V2_DONATE, duration: HOLDS.h7, out: seg('7-donate'), zoomDir: 'in', shake: false })
  holdKenBurns({ image: path.join(BUILD, 'end-frame.png'), duration: HOLDS.h8, out: seg('8-end'), zoomDir: 'in', shake: false })
  holdKenBurns({ image: path.join(BUILD, 'wordmark.png'), duration: HOLDS.h9, out: seg('9-mark'), zoomDir: 'out', shake: false })
  holdStatic({ image: path.join(BUILD, 'credit.png'), duration: HOLDS.credit, out: seg('10-credit') })

  fs.writeFileSync(path.join(BUILD, 'motion-outcomes.json'), JSON.stringify(motion, null, 2))

  return {
    segments: [
      seg('1-2016'), seg('2-2020'), seg('3-2024'),
      seg('4-broll1'), seg('5-2026'), seg('6-broll2'),
      seg('7-donate'), seg('8-end'), seg('9-mark'),
      seg('10-credit'),
    ],
    motion,
  }
}

function concatSegments(segments, outPath) {
  const list = path.join(BUILD, 'concat.txt')
  fs.writeFileSync(list, segments.map(p => `file '${p.replace(/'/g, "\\'")}'`).join('\n') + '\n')
  sh('ffmpeg', ['-y', '-f', 'concat', '-safe', '0', '-i', list,
    '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-preset', 'medium', '-crf', '21',
    '-maxrate', '2200k', '-bufsize', '4400k',
    '-r', String(FPS), '-movflags', '+faststart', outPath])
}

function buildAudioMaster(voPath, musicPath, filmDuration, totalDuration) {
  const out = path.join(BUILD, 'audio-master.m4a')
  // VO -3dB ≈ 0.7079 ; music -12dB ≈ 0.2512 ; duck factor 0.32 (~-10dB)
  const muVol = `volume='if(between(t,15.9,16.45), 0.2512*0.32, if(between(t,${filmDuration},${totalDuration}), 0.2512*0.7, 0.2512))':eval=frame`
  sh('ffmpeg', ['-y', '-i', voPath, '-i', musicPath,
    '-filter_complex',
      `[0:a]volume=0.7079,apad[vo];` +
      `[1:a]loudnorm=I=-20:TP=-2:LRA=11,${muVol},` +
        `afade=t=in:st=0:d=0.6,afade=t=out:st=${(totalDuration-0.8).toFixed(2)}:d=0.8[mu];` +
      `[vo][mu]amix=inputs=2:duration=first:normalize=0[mix];` +
      `[mix]atrim=0:${totalDuration},asetpts=PTS-STARTPTS,` +
      `alimiter=limit=0.95:attack=5:release=50[out]`,
    '-map', '[out]', '-c:a', 'aac', '-b:a', '192k', out])
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
    '-maxrate', '1400k', '-bufsize', '2800k',
    '-r', String(FPS), '-c:a', 'aac', '-b:a', '128k', '-movflags', '+faststart', outPath])
}

function poster(srcPath, outPath) {
  sh('ffmpeg', ['-y', '-ss', '7.5', '-i', srcPath, '-frames:v', '1', '-q:v', '2', outPath])
}

async function main() {
  console.log('[v4] SEALED 30-sec trailer-grade hook + 2s credit')

  const filmDuration = Object.entries(HOLDS).filter(([k]) => k !== 'credit').reduce((a,[,v])=>a+v, 0)
  const totalDuration = filmDuration + HOLDS.credit
  console.log(`[v4] film=${filmDuration}s credit=${HOLDS.credit}s total=${totalDuration}s`)

  const required = [
    path.join(PUBLIC, 'cover-2016.jpg'),
    path.join(PUBLIC, 'cover-2020.jpg'),
    path.join(PUBLIC, 'cover-2024.jpg'),
    path.join(PUBLIC, 'cover-2026.jpg'),
    V2_DONATE,
  ]
  for (const p of required) if (!fs.existsSync(p)) throw new Error(`missing asset: ${p}`)

  await renderFrames()

  if (!SKIP_TTS) await generateTTS()
  const voTrack = buildVoMaster(totalDuration)

  let musicInfo = null
  if (!SKIP_MUSIC) musicInfo = await getMusic()

  const { segments, motion } = await buildSegments()
  const masterSilent = path.join(BUILD, 'master-silent.mp4')
  concatSegments(segments, masterSilent)

  let audioMaster = voTrack
  if (musicInfo) audioMaster = buildAudioMaster(voTrack, musicInfo.path, filmDuration, totalDuration)

  const master = path.join(MOVIE_OUT, 'sealed-hook-v4.mp4')
  const reel = path.join(MOVIE_OUT, 'sealed-hook-v4-9x16.mp4')
  const posterPath = path.join(MOVIE_OUT, 'sealed-hook-v4-poster.jpg')

  muxAudio(masterSilent, audioMaster, master)
  make9x16(master, reel)
  poster(master, posterPath)

  console.log('\n[v4] master:\n' + probe(master))
  console.log('[v4] reel:\n' + probe(reel))
  console.log(`[v4] poster: ${fs.statSync(posterPath).size} bytes`)
  console.log(`[v4] music: ${musicInfo ? musicInfo.meta.name : 'NONE'}`)
  console.log(`[v4] motion outcomes: i2v ${motion.i2v.succeeded.length}/${motion.i2v.attempted.length}  t2v ${motion.t2v.succeeded.length}/${motion.t2v.attempted.length}`)
  const mb = (p) => (fs.statSync(p).size / 1_000_000).toFixed(2)
  console.log(`[v4] sizes — master ${mb(master)} MB | reel ${mb(reel)} MB`)
}

main().catch(e => { console.error(e); process.exit(1) })
