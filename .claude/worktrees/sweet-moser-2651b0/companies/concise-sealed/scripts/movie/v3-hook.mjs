#!/usr/bin/env node
/**
 * SEALED 60-sec movie hook v3 — cinematic hook (Path C hybrid).
 *
 * Spine: 4 existing pencil-sketch covers (cover-2016/2020/2024/2026.jpg)
 *      + cached donate-shell screenshot (live-donaldjtrump.png from _build_v2)
 *      + puppeteer-rendered deletion frame + SEALED2016.COM wordmark.
 *
 * Music: investigative-doc bed via fal.ai cassetteai/music-generator
 *        (fallback: Mixkit CC0 documentary cue).
 * Narration: ElevenLabs Adam (pNInz6obpgDQGcFmaJgB), explicit ffmpeg silence pads
 *            between lines (no SSML). Mix: VO -3 dB / music -18 dB via amix weights.
 *
 * Outputs:
 *   public/movie/sealed-hook-v3.mp4         (1920x1080 ~60s)
 *   public/movie/sealed-hook-v3-9x16.mp4    (1080x1920 safe-column crop)
 *   public/movie/sealed-hook-v3-poster.jpg  (still from Hold 3)
 *
 * Usage: node scripts/movie/v3-hook.mjs [--skip-tts] [--skip-music] [--reuse]
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
const BUILD = path.join(MOVIE_OUT, '_build_v3')
const VO = path.join(BUILD, 'vo')
const V2_DONATE = path.join(MOVIE_OUT, '_build_v2', 'live-donaldjtrump.png')

const VC_NODE = path.join(REPO_ROOT, 'companies', 'votingcitizen', 'node_modules')
const requireFromVC = createRequire(path.join(VC_NODE, 'package.json'))

fs.mkdirSync(BUILD, { recursive: true })
fs.mkdirSync(VO, { recursive: true })

const args = new Set(process.argv.slice(2))
const SKIP_TTS = args.has('--skip-tts')
const SKIP_MUSIC = args.has('--skip-music')

// ── env load ───────────────────────────────────────────────────────────────
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

// ── helpers ────────────────────────────────────────────────────────────────
function sh(cmd, a) {
  const short = a.map(x => (typeof x === 'string' && x.length > 100) ? x.slice(0,100)+'…' : x)
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
  cream: '#F5EFE0',
  parchment: '#EFE6D2',
  navy: '#0B2545',
  red: '#8C1D18',
  gold: '#B8860B',
  ink: '#1E1A14',
}

// ── narration script (locked) ──────────────────────────────────────────────
// align_t = start time of this line in the final 60s mix.
// Pauses between lines are realized by ffmpeg adelay (explicit silence pads).
// Lines crafted to fit Hold cadence (7 holds × ~8.5s).
// align_t honors the locked half-second pauses on the deletion beat
// (l6→l7→l8 each separated by 0.5s exactly). Other pauses extended to fill
// 60s with ambient music; visual holds anchored to these times.
const VO_LINES = [
  // Hold 1 (0.0-10.7s): cover-2016
  { id: 'l1-2016',    text: 'In 2016, he made 145 promises.',                              align_t: 3.00 },
  // Hold 2 (10.7-18.5s): cover-2020
  { id: 'l2-slogans', text: 'Drain the swamp. Build the wall. End the wars.',              align_t: 10.71 },
  // Hold 3 (18.5-30.0s): cover-2024 + scorecard chip (chip fades in around 23s)
  { id: 'l3-receipts',text: 'Nine years later, the receipts are in.',                      align_t: 18.48 },
  { id: 'l4-score',   text: '46 kept. 51 partial. 40 broken. 8, reader decides.',          align_t: 21.11 },
  // Hold 4 (30.0-37.4s): cover-2026
  { id: 'l5-new',     text: 'Then in 2024, his campaign made new promises.',               align_t: 33.94 },
  // Hold 5 (37.4-44.0s): donate shell — fadewhite transition into this hold
  { id: 'l6-after',   text: 'And after the election —',                                    align_t: 38.88 },
  { id: 'l7-deleted', text: 'they deleted them.',                                          align_t: 41.09 }, // 0.5s after l6 end
  // Hold 6 (44.0-50.0s): end-frame ("SEALED kept it")
  { id: 'l8-kept',    text: 'SEALED kept them.',                                           align_t: 42.71 }, // 0.5s after l7 end
  // Hold 7 (50.0-60.0s): wordmark
  { id: 'l9-mark',    text: 'SEALED2016.COM',                                              align_t: 46.46 },
]

const VOICE_ID = 'pNInz6obpgDQGcFmaJgB' // Adam — narrator register

async function generateTTS() {
  const key = process.env.ELEVENLABS_API_KEY
  if (!key) throw new Error('ELEVENLABS_API_KEY not set')
  for (const line of VO_LINES) {
    const out = path.join(VO, `${line.id}.mp3`)
    if (fs.existsSync(out)) { console.log(`[tts] cached ${line.id}`); continue }
    console.log(`[tts] ${line.id}: ${line.text}`)
    const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}`, {
      method: 'POST',
      headers: {
        'xi-api-key': key,
        'Content-Type': 'application/json',
        'Accept': 'audio/mpeg',
      },
      body: JSON.stringify({
        text: line.text,
        model_id: 'eleven_multilingual_v2',
        voice_settings: { stability: 0.6, similarity_boost: 0.8, style: 0.15, use_speaker_boost: true },
      }),
    })
    if (!res.ok) {
      const t = await res.text()
      throw new Error(`ElevenLabs ${res.status}: ${t.slice(0, 240)}`)
    }
    const buf = Buffer.from(await res.arrayBuffer())
    fs.writeFileSync(out, buf)
  }
  console.log('[tts] all lines generated')
}

// Build the 60s narration master: each line placed at align_t with adelay; amix.
// loudnorm to a consistent broadcast level so the -3dB / -18dB mix is predictable.
function buildVoMaster(totalSec = 60) {
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
  sh('ffmpeg', [
    '-y', ...inputs,
    '-filter_complex', filter,
    '-map', '[out]',
    '-c:a', 'aac', '-b:a', '192k',
    out,
  ])
  return out
}

// ── music: fal.ai cassetteai/music-generator with Mixkit CC0 fallback ──────
const MUSIC_PROMPT = 'Epic cinematic action-movie trailer score, Hans Zimmer Two Steps From Hell style. Rising orchestral brass swells, dramatic percussive hits, hybrid Hollywood trailer cue, building from low tension to heroic resolve, 60 seconds, no vocals. Heavy timpani hits at climactic moments. Strings, brass, percussion, choir builds. 95 BPM.'

async function generateMusicFal() {
  const key = process.env.FAL_KEY
  if (!key) throw new Error('FAL_KEY not set')
  const out = path.join(BUILD, 'music.mp3')
  if (fs.existsSync(out) && fs.statSync(out).size > 50_000) {
    console.log('[music] cached'); return out
  }
  console.log('[music] fal.ai cassetteai/music-generator …')
  // submit
  const submit = await fetch('https://queue.fal.run/cassetteai/music-generator', {
    method: 'POST',
    headers: { 'Authorization': `Key ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt: MUSIC_PROMPT, duration: 60 }),
  })
  if (!submit.ok) {
    const t = await submit.text()
    throw new Error(`fal submit ${submit.status}: ${t.slice(0,240)}`)
  }
  const subJson = await submit.json()
  const reqId = subJson.request_id
  const statusUrl = subJson.status_url || `https://queue.fal.run/cassetteai/music-generator/requests/${reqId}/status`
  const resultUrl = subJson.response_url || `https://queue.fal.run/cassetteai/music-generator/requests/${reqId}`
  console.log(`[music] queued ${reqId}`)
  // poll
  const start = Date.now()
  while (Date.now() - start < 5 * 60_000) {
    await new Promise(r => setTimeout(r, 3000))
    const s = await fetch(statusUrl, { headers: { 'Authorization': `Key ${key}` } })
    if (!s.ok) continue
    const sJson = await s.json()
    console.log(`[music] status: ${sJson.status}`)
    if (sJson.status === 'COMPLETED') break
    if (sJson.status === 'FAILED' || sJson.status === 'ERROR') {
      throw new Error(`fal music FAILED: ${JSON.stringify(sJson).slice(0,240)}`)
    }
  }
  const r = await fetch(resultUrl, { headers: { 'Authorization': `Key ${key}` } })
  if (!r.ok) throw new Error(`fal result ${r.status}`)
  const rj = await r.json()
  // result shape: { audio_file: { url, ... } } or { audio: { url } }
  const url = rj.audio_file?.url || rj.audio?.url || rj.url
  if (!url) throw new Error(`fal result missing url: ${JSON.stringify(rj).slice(0,240)}`)
  const audio = await fetch(url)
  if (!audio.ok) throw new Error(`fal audio download ${audio.status}`)
  fs.writeFileSync(out, Buffer.from(await audio.arrayBuffer()))
  console.log(`[music] saved ${out} (${fs.statSync(out).size} bytes)`)
  return out
}

async function generateMusicMixkit() {
  // CC0 fallback: Mixkit "Hopeful Documentary" / "Reflective Documentary" pool.
  // Mixkit license: free for commercial + non-commercial, no attribution required.
  // https://mixkit.co/license/#sfxFree
  const out = path.join(BUILD, 'music.mp3')
  if (fs.existsSync(out) && fs.statSync(out).size > 50_000) return out
  const candidates = [
    // Tense / contemplative cues from Mixkit's free library (direct CDN urls; stable as of 2026).
    'https://assets.mixkit.co/music/preview/mixkit-serene-view-443.mp3',
    'https://assets.mixkit.co/music/preview/mixkit-deep-meditation-109.mp3',
    'https://assets.mixkit.co/music/preview/mixkit-relaxing-in-nature-522.mp3',
  ]
  for (const url of candidates) {
    try {
      console.log(`[music] mixkit fallback: ${url}`)
      const r = await fetch(url)
      if (!r.ok) continue
      const buf = Buffer.from(await r.arrayBuffer())
      if (buf.length < 50_000) continue
      fs.writeFileSync(out, buf)
      console.log(`[music] saved fallback ${out} (${buf.length} bytes)`)
      return out
    } catch (e) {
      console.warn(`[music] mixkit candidate failed: ${e.message}`)
    }
  }
  throw new Error('all music sources failed')
}

async function getMusic() {
  try {
    return await generateMusicFal()
  } catch (e) {
    console.warn(`[music] fal failed (${e.message}); falling back to Mixkit CC0`)
    return await generateMusicMixkit()
  }
}

// ── puppeteer-rendered frames (end-frame + wordmark + scorecard chip) ──────
async function renderFrames() {
  const puppeteer = requireFromVC('puppeteer')
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--font-render-hinting=none'],
  })
  const page = await browser.newPage()
  await page.setViewport({ width: W, height: H, deviceScaleFactor: 1 })

  const snap = async (html, out) => {
    await page.setContent(html, { waitUntil: 'domcontentloaded', timeout: 15000 })
    try { await page.evaluate(() => document.fonts && document.fonts.ready) } catch {}
    await new Promise(r => setTimeout(r, 1200))
    await page.screenshot({ path: out, type: 'png', omitBackground: false })
  }

  const fontImport = `@import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,500;0,700;1,400&family=IBM+Plex+Mono:wght@400;500;700&display=swap');`

  // End-frame: "THEY DELETED THE PLATFORM. WE KEPT IT." on dark vignette.
  const endFrame = `<!doctype html><meta charset="utf-8"><style>
    ${fontImport}
    *,*::before,*::after { box-sizing: border-box; margin: 0; padding: 0; }
    html, body { width: ${W}px; height: ${H}px; }
    body {
      background: #0A0A0A;
      background-image: radial-gradient(ellipse at center, rgba(20,20,30,1) 0%, rgba(0,0,0,1) 80%);
      color: #F5EFE0;
      font-family: 'Lora', Georgia, serif;
      display: flex; align-items: center; justify-content: center;
      overflow: hidden;
    }
    .wrap { width: 1500px; text-align: center; }
    .line1 { font-size: 96px; line-height: 1.12; font-weight: 500; letter-spacing: 0.005em; color: #E5DDC8; }
    .strike { text-decoration: line-through; text-decoration-color: #8C1D18; text-decoration-thickness: 6px; opacity: 0.95; }
    .line2 { margin-top: 56px; font-size: 112px; font-weight: 700; color: #F5EFE0; letter-spacing: 0.005em; }
    .accent { color: #B8860B; }
  </style><body><div class="wrap">
    <div class="line1"><span class="strike">They deleted the platform.</span></div>
    <div class="line2">SEALED <span class="accent">kept</span> it.</div>
  </div></body>`
  await snap(endFrame, path.join(BUILD, 'end-frame.png'))

  // Wordmark: SEALED2016.COM on parchment cream.
  const wordmark = `<!doctype html><meta charset="utf-8"><style>
    ${fontImport}
    *,*::before,*::after { box-sizing: border-box; margin: 0; padding: 0; }
    html, body { width: ${W}px; height: ${H}px; }
    body {
      background: ${COLORS.parchment};
      background-image:
        radial-gradient(ellipse at center, rgba(245,239,224,0) 0%, rgba(0,0,0,0.18) 100%),
        repeating-linear-gradient(0deg, rgba(11,37,69,0.025) 0 1px, transparent 1px 7px);
      color: ${COLORS.ink};
      font-family: 'Lora', Georgia, serif;
      display: flex; align-items: center; justify-content: center;
      overflow: hidden;
    }
    .wrap { width: 1500px; text-align: center; }
    .rule { width: 380px; height: 2px; background: ${COLORS.navy}; margin: 0 auto 36px; opacity: 0.55; }
    .mark { font-family: 'IBM Plex Mono', ui-monospace, Menlo, monospace;
            font-size: 132px; font-weight: 700; color: ${COLORS.navy}; letter-spacing: 0.04em; }
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

  // Scorecard chip (transparent overlay for Hold 3, fades in ~3s into hold).
  const chip = `<!doctype html><meta charset="utf-8"><style>
    ${fontImport}
    *,*::before,*::after { box-sizing: border-box; margin: 0; padding: 0; }
    html, body { width: ${W}px; height: ${H}px; background: transparent; }
    body { display: flex; align-items: flex-end; justify-content: center; padding-bottom: 88px;
           font-family: 'IBM Plex Mono', ui-monospace, Menlo, monospace; }
    .chip { background: rgba(11,37,69,0.92); color: #F5EFE0; padding: 26px 44px; border-radius: 2px;
            display: flex; gap: 38px; align-items: baseline; font-size: 38px; letter-spacing: 0.06em;
            box-shadow: 0 8px 32px rgba(0,0,0,0.35); }
    .item { display: flex; gap: 12px; align-items: baseline; }
    .n { font-size: 56px; font-weight: 700; }
    .lbl { font-size: 20px; text-transform: uppercase; letter-spacing: 0.22em; opacity: 0.85; }
    .kept { color: #7FB069; }
    .partial { color: #E8B84A; }
    .broken { color: #E07A5F; }
    .reader { color: #CFC4A0; }
  </style><body>
    <div class="chip">
      <div class="item"><span class="n kept">46</span><span class="lbl">kept</span></div>
      <div class="item"><span class="n partial">51</span><span class="lbl">partial</span></div>
      <div class="item"><span class="n broken">40</span><span class="lbl">broken</span></div>
      <div class="item"><span class="n reader">8</span><span class="lbl">reader</span></div>
    </div>
  </body>`
  // chip needs transparent PNG
  await page.setViewport({ width: W, height: H, deviceScaleFactor: 1 })
  await page.setContent(chip, { waitUntil: 'domcontentloaded', timeout: 15000 })
  try { await page.evaluate(() => document.fonts && document.fonts.ready) } catch {}
  await new Promise(r => setTimeout(r, 1200))
  await page.evaluate(() => { document.documentElement.style.background = 'transparent'; document.body.style.background = 'transparent'; })
  await page.screenshot({ path: path.join(BUILD, 'scorecard-chip.png'), type: 'png', omitBackground: true })

  await browser.close()
}

// ── beat-matched edit ──────────────────────────────────────────────────────
// Convert each portrait cover into a 1920x1080 frame with parchment side-pads
// and a subtle vignette so the pencil-sketch portrait sits as a "book on a desk".
function makeCoverFrame(coverPath, outPng) {
  // Use ffmpeg: scale cover to fit 1080 height (preserves portrait), then pad
  // to 1920 wide on parchment, then composite vignette.
  sh('ffmpeg', ['-y',
    '-i', coverPath,
    '-vf',
      `scale=-1:980,` +
      `pad=${W}:${H}:(ow-iw)/2:(oh-ih)/2:color=0xEFE6D2,` +
      // subtle paper grain via geq is heavy; use a simple radial vignette via vignette filter
      `vignette=PI/5,format=yuv420p`,
    '-frames:v', '1', outPng])
}

// Ken-burns over a still image — slow zoom-in or zoom-out, dimensions preserved.
function holdKenBurns({ image, duration, out, zoomDir = 'in', overlayPng = null, overlayInAt = 0.5, fadeInWhite = false }) {
  const frames = Math.round(duration * FPS)
  const z = zoomDir === 'in'
    ? `zoompan=z='min(zoom+0.0004,1.10)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${frames}:s=${W}x${H}:fps=${FPS}`
    : `zoompan=z='if(lte(zoom,1.0),1.10,max(1.001,zoom-0.0004))':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${frames}:s=${W}x${H}:fps=${FPS}`
  const inputs = ['-framerate', String(FPS), '-loop', '1', '-t', String(duration), '-i', image]
  let filter = `[0:v]scale=${W*2}:${H*2}:force_original_aspect_ratio=increase,crop=${W*2}:${H*2},${z},trim=duration=${duration},setpts=PTS-STARTPTS,format=yuv420p[bg]`
  let last = 'bg', idx = 1
  if (overlayPng) {
    inputs.push('-framerate', String(FPS), '-loop', '1', '-t', String(duration), '-i', overlayPng)
    filter += `;[${idx}:v]scale=${W}:${H},fade=t=in:st=${overlayInAt}:d=0.5:alpha=1[ov];` +
              `[${last}][ov]overlay=0:0[wov]`
    last = 'wov'; idx++
  }
  const inFx = fadeInWhite
    ? `fade=t=in:st=0:d=0.35:color=white,fade=t=out:st=${(duration-0.2).toFixed(2)}:d=0.2`
    : `fade=t=in:st=0:d=0.2,fade=t=out:st=${(duration-0.2).toFixed(2)}:d=0.2`
  filter += `;[${last}]${inFx}[v]`
  sh('ffmpeg', ['-y', ...inputs, '-filter_complex', filter, '-map', '[v]',
    '-r', String(FPS), '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-preset', 'fast', '-crf', '20', out])
}

function buildSegments() {
  const seg = (n) => path.join(BUILD, `seg-${n}.mp4`)

  // Pre-bake portrait covers → 1920x1080 frames with parchment pads + vignette.
  const f2016 = path.join(BUILD, 'frame-2016.png')
  const f2020 = path.join(BUILD, 'frame-2020.png')
  const f2024 = path.join(BUILD, 'frame-2024.png')
  const f2026 = path.join(BUILD, 'frame-2026.png')
  makeCoverFrame(path.join(PUBLIC, 'cover-2016.jpg'), f2016)
  makeCoverFrame(path.join(PUBLIC, 'cover-2020.jpg'), f2020)
  makeCoverFrame(path.join(PUBLIC, 'cover-2024.jpg'), f2024)
  makeCoverFrame(path.join(PUBLIC, 'cover-2026.jpg'), f2026)

  // Hold 1 (0.0-10.7s): cover-2016
  holdKenBurns({ image: f2016, duration: 10.71, out: seg('1-2016'), zoomDir: 'in' })
  // Hold 2 (10.7-18.5s): cover-2020
  holdKenBurns({ image: f2020, duration: 7.77, out: seg('2-2020'), zoomDir: 'out' })
  // Hold 3 (18.5-30.0s): cover-2024 with scorecard chip fading in ~+4.6s (i.e. at ~23s, mid-"46 kept")
  holdKenBurns({ image: f2024, duration: 11.50, out: seg('3-2024'), zoomDir: 'in',
                 overlayPng: path.join(BUILD, 'scorecard-chip.png'), overlayInAt: 4.6 })
  // Hold 4 (30.0-37.4s): cover-2026
  holdKenBurns({ image: f2026, duration: 7.40, out: seg('4-2026'), zoomDir: 'out' })
  // Hold 5 (37.4-44.0s): donate shell — fadewhite entry on "after the election —"
  holdKenBurns({ image: V2_DONATE, duration: 6.60, out: seg('5-donate'), zoomDir: 'in', fadeInWhite: true })
  // Hold 6 (44.0-50.0s): end-frame ("SEALED kept it")
  holdKenBurns({ image: path.join(BUILD, 'end-frame.png'), duration: 6.00, out: seg('6-end') })
  // Hold 7 (50.0-60.0s): wordmark (SEALED2016.COM) — landing hold, slow zoom-out
  holdKenBurns({ image: path.join(BUILD, 'wordmark.png'), duration: 10.02, out: seg('7-mark'), zoomDir: 'out' })

  return [
    seg('1-2016'), seg('2-2020'), seg('3-2024'), seg('4-2026'),
    seg('5-donate'), seg('6-end'), seg('7-mark'),
  ]
}

function concatSegments(segments, outPath) {
  const list = path.join(BUILD, 'concat.txt')
  fs.writeFileSync(list, segments.map(p => `file '${p.replace(/'/g, "\\'")}'`).join('\n') + '\n')
  sh('ffmpeg', ['-y', '-f', 'concat', '-safe', '0', '-i', list,
    '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-preset', 'medium', '-crf', '22',
    '-maxrate', '1800k', '-bufsize', '3600k',
    '-r', String(FPS), '-movflags', '+faststart', outPath])
}

// Mix VO and music with deterministic levels.
// Both streams are first loudnormed to a known LUFS, then attenuated.
//   VO:    loudnorm I=-16 LUFS  → volume=-3dB  → ~-19 LUFS effective
//   Music: loudnorm I=-23 LUFS  → volume=-18dB → ~-41 LUFS effective
// Differential ≈ 22 dB → narration sits clearly above the bed without ducking.
function buildAudioMaster(voPath, musicPath, totalSec = 60) {
  const out = path.join(BUILD, 'audio-master.m4a')
  // -3 dB ≈ volume=0.708 ; -18 dB ≈ volume=0.1259
  sh('ffmpeg', ['-y',
    '-i', voPath,
    '-i', musicPath,
    '-filter_complex',
      `[0:a]volume=0.708,apad[vo];` +
      `[1:a]loudnorm=I=-23:TP=-3:LRA=11,volume=0.1259,` +
        `afade=t=in:st=0:d=1.2,afade=t=out:st=${totalSec-2.0}:d=2.0[mu];` +
      `[vo][mu]amix=inputs=2:duration=first:normalize=0[mix];` +
      `[mix]atrim=0:${totalSec},asetpts=PTS-STARTPTS,` +
      `alimiter=limit=0.95:attack=5:release=50[out]`,
    '-map', '[out]',
    '-c:a', 'aac', '-b:a', '192k',
    out,
  ])
  return out
}

function muxAudio(videoPath, audioPath, outPath) {
  sh('ffmpeg', ['-y', '-i', videoPath, '-i', audioPath,
    '-map', '0:v:0', '-map', '1:a:0',
    '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k',
    '-shortest', '-movflags', '+faststart', outPath])
}

function make9x16(srcPath, outPath) {
  // Crop center safe column ~608 wide (matches v2 framing), scale to 1080x1920.
  sh('ffmpeg', ['-y', '-i', srcPath,
    '-vf', `crop=608:1080:(iw-608)/2:0,scale=1080:1920,format=yuv420p`,
    '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-preset', 'medium', '-crf', '24',
    '-maxrate', '1100k', '-bufsize', '2200k',
    '-r', String(FPS), '-c:a', 'aac', '-b:a', '128k', '-movflags', '+faststart', outPath])
}

function poster(srcPath, outPath) {
  // Pull poster from Hold 3 (scorecard reveal) — ~24s
  sh('ffmpeg', ['-y', '-ss', '24.0', '-i', srcPath, '-frames:v', '1', '-q:v', '2', outPath])
}

// ── main ───────────────────────────────────────────────────────────────────
async function main() {
  console.log('[v3] SEALED 60-sec cinematic hook')

  // verify required input assets
  const required = [
    path.join(PUBLIC, 'cover-2016.jpg'),
    path.join(PUBLIC, 'cover-2020.jpg'),
    path.join(PUBLIC, 'cover-2024.jpg'),
    path.join(PUBLIC, 'cover-2026.jpg'),
    V2_DONATE,
  ]
  for (const p of required) if (!fs.existsSync(p)) throw new Error(`missing source asset: ${p}`)

  await renderFrames()

  if (!SKIP_TTS) await generateTTS()
  const voTrack = buildVoMaster(60)

  let musicTrack = null
  if (!SKIP_MUSIC) {
    musicTrack = await getMusic()
  }

  const segments = buildSegments()
  const masterSilent = path.join(BUILD, 'master-silent.mp4')
  concatSegments(segments, masterSilent)

  let audioMaster = voTrack
  if (musicTrack) {
    audioMaster = buildAudioMaster(voTrack, musicTrack, 60)
  }

  const master = path.join(MOVIE_OUT, 'sealed-hook-v3.mp4')
  const reel = path.join(MOVIE_OUT, 'sealed-hook-v3-9x16.mp4')
  const posterPath = path.join(MOVIE_OUT, 'sealed-hook-v3-poster.jpg')

  muxAudio(masterSilent, audioMaster, master)
  make9x16(master, reel)
  poster(master, posterPath)

  console.log('\n[v3] master:\n' + probe(master))
  console.log('[v3] reel:\n' + probe(reel))
  console.log(`[v3] poster: ${fs.statSync(posterPath).size} bytes`)
  const mb = (p) => (fs.statSync(p).size / 1_000_000).toFixed(2)
  console.log(`[v3] sizes — master ${mb(master)} MB | reel ${mb(reel)} MB`)
}

main().catch(e => { console.error(e); process.exit(1) })
