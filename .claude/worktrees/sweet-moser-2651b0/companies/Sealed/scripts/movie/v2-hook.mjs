#!/usr/bin/env node
/**
 * SEALED 60-sec movie hook v2 — orchestrator.
 *
 * v2 deltas vs v1 (see scripts/movie/script-v2.md for persona direction):
 *  - Cold open on "145 PROMISES." (youtube-virality-expert: number-first hook)
 *  - ElevenLabs narration ("Adam", james-the-narrator register)
 *  - Title hold 3s → 1.5s (video-producer pacing pass)
 *  - Scoreboard hold 8s → 10s
 *  - Caption band opacity 0.78 → 0.55 (design-expert)
 *  - End-card wordmark +24px breathing room
 *  - Optional 15s ultra-hook cut for X/TikTok
 *
 * Outputs:
 *   public/movie/sealed-hook-v2.mp4         (1920x1080 master ~60s)
 *   public/movie/sealed-hook-v2-9x16.mp4    (1080x1920 reel crop)
 *   public/movie/sealed-hook-v2-poster.jpg
 *   public/movie/sealed-hook-v2-15s.mp4     (ultra-hook)
 *
 * Usage: node companies/concise-sealed/scripts/movie/v2-hook.mjs [--skip-live] [--skip-tts] [--no-15s]
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
const BUILD = path.join(MOVIE_OUT, '_build_v2')
const VO = path.join(BUILD, 'vo')
const CR_SOURCES = path.join(REPO_ROOT, 'companies', 'campaign-receipts', 'public', 'sources')

const VC_NODE = path.join(COMPANY_ROOT, 'node_modules')
const requireFromVC = createRequire(path.join(VC_NODE, 'package.json'))

fs.mkdirSync(BUILD, { recursive: true })
fs.mkdirSync(VO, { recursive: true })

const args = new Set(process.argv.slice(2))
const SKIP_LIVE = args.has('--skip-live')
const SKIP_TTS = args.has('--skip-tts')
const NO_15S = args.has('--no-15s')

// Load env from repo root .env if not already set
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

const COLORS = {
  cream: '#F5EFE0',
  parchment: '#EFE6D2',
  navy: '#0B2545',
  red: '#8C1D18',
  green: '#2F5D3A',
  amber: '#B8860B',
  ink: '#1E1A14',
}

const baseStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,500;0,700;1,400&family=IBM+Plex+Mono:wght@400;500&display=swap');
  *,*::before,*::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { width: 1920px; height: 1080px; }
  body {
    background: ${COLORS.parchment};
    color: ${COLORS.ink};
    font-family: 'Lora', Georgia, serif;
    display: flex; align-items: center; justify-content: center;
    overflow: hidden;
    background-image:
      radial-gradient(ellipse at center, rgba(245,239,224,0) 0%, rgba(0,0,0,0.12) 100%),
      repeating-linear-gradient(0deg, rgba(11,37,69,0.025) 0 1px, transparent 1px 7px);
  }
  .safe { width: 1080px; text-align: center; }
  .mono { font-family: 'IBM Plex Mono', ui-monospace, Menlo, monospace; }
  .serif { font-family: 'Lora', Georgia, serif; }
  .upper { text-transform: uppercase; letter-spacing: 0.18em; }
`

// v2 cold-open: number-first hook (youtube-virality-expert)
const tmplColdOpen = `
<!doctype html><meta charset="utf-8"><style>${baseStyles}
.huge { font-size: 280px; font-weight: 700; color: ${COLORS.navy}; letter-spacing: 0.02em; line-height: 1; }
.lbl { margin-top: 24px; font-size: 56px; color: ${COLORS.red}; letter-spacing: 0.08em; font-weight: 500; }
.sub { margin-top: 36px; color: ${COLORS.ink}; opacity: 0.7; font-size: 28px; letter-spacing: 0.22em; }
.rule { width: 320px; height: 2px; background: ${COLORS.navy}; margin: 30px auto; opacity: 0.5; }
</style><body><div class="safe">
  <div class="huge serif">145</div>
  <div class="lbl mono upper">Promises.</div>
  <div class="rule"></div>
  <div class="sub mono upper">He made them. We kept the list.</div>
</div></body>`

const tmplTitle0615 = `
<!doctype html><meta charset="utf-8"><style>${baseStyles}
.title { font-size: 140px; font-weight: 700; color: ${COLORS.navy}; letter-spacing: 0.04em; }
.sub { margin-top: 28px; color: ${COLORS.red}; font-size: 36px; letter-spacing: 0.08em; }
.rule { width: 320px; height: 2px; background: ${COLORS.navy}; margin: 36px auto; opacity: 0.6; }
.kicker { color: ${COLORS.ink}; opacity: 0.7; font-size: 22px; letter-spacing: 0.3em; }
</style><body><div class="safe">
  <div class="kicker mono upper">A Sealed Press Object</div>
  <div class="rule"></div>
  <div class="title serif">JUNE 16, 2015</div>
  <div class="sub mono upper">He came down the escalator.</div>
</div></body>`

const tmplScoreboard = `
<!doctype html><meta charset="utf-8"><style>${baseStyles}
.wrap { width: 1280px; text-align: center; }
.head { font-size: 56px; color: ${COLORS.navy}; margin-bottom: 14px; }
.subhead { color: ${COLORS.ink}; opacity: 0.7; font-size: 26px; letter-spacing: 0.16em; }
.grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 28px; margin-top: 60px; }
.tile { background: ${COLORS.cream}; border: 1.5px solid rgba(11,37,69,0.25); padding: 36px 18px 30px; border-radius: 6px; box-shadow: 0 6px 24px rgba(0,0,0,0.08); }
.n { font-size: 92px; font-weight: 700; line-height: 1; }
.lbl { font-size: 22px; letter-spacing: 0.2em; margin-top: 14px; }
.kept .n { color: ${COLORS.green}; }
.partial .n { color: ${COLORS.amber}; }
.broken .n { color: ${COLORS.red}; }
.reader .n { color: ${COLORS.navy}; }
.lbl { color: ${COLORS.ink}; opacity: 0.85; }
.rule { width: 280px; height: 2px; background: ${COLORS.navy}; margin: 22px auto 30px; opacity: 0.5; }
</style><body><div class="wrap">
  <div class="subhead mono upper">The Receipt</div>
  <div class="rule"></div>
  <div class="head serif">145 promises tracked.</div>
  <div class="grid">
    <div class="tile kept"><div class="n serif">46</div><div class="lbl mono upper">Kept</div></div>
    <div class="tile partial"><div class="n serif">51</div><div class="lbl mono upper">Partial</div></div>
    <div class="tile broken"><div class="n serif">40</div><div class="lbl mono upper">Broken</div></div>
    <div class="tile reader"><div class="n serif">8</div><div class="lbl mono upper">Reader-Decides</div></div>
  </div>
</div></body>`

const tmplLedger = `
<!doctype html><meta charset="utf-8"><style>${baseStyles}
.head { font-size: 96px; color: ${COLORS.navy}; font-weight: 700; }
.sub { font-size: 38px; color: ${COLORS.red}; margin-top: 28px; letter-spacing: 0.06em; }
.kicker { color: ${COLORS.ink}; opacity: 0.7; font-size: 22px; letter-spacing: 0.3em; }
.rule { width: 280px; height: 2px; background: ${COLORS.navy}; margin: 28px auto; opacity: 0.5; }
</style><body><div class="safe">
  <div class="kicker mono upper">The Ledger</div>
  <div class="rule"></div>
  <div class="head serif">He made 145 promises.</div>
  <div class="sub mono upper">We tracked every one.</div>
</div></body>`

const tmplDeleted = `
<!doctype html><meta charset="utf-8"><style>${baseStyles}
body { background: #0B0B0B; color: ${COLORS.cream}; }
.huge { font-size: 132px; color: ${COLORS.red}; font-weight: 700; letter-spacing: 0.02em; line-height: 1.05; }
.kept { margin-top: 36px; font-size: 96px; color: ${COLORS.cream}; font-weight: 500; letter-spacing: 0.04em; }
.kicker { color: ${COLORS.cream}; opacity: 0.6; font-size: 22px; letter-spacing: 0.3em; }
.rule { width: 320px; height: 2px; background: ${COLORS.red}; margin: 32px auto; opacity: 0.85; }
</style><body><div class="safe">
  <div class="kicker mono upper">The Archive</div>
  <div class="rule"></div>
  <div class="huge serif">THEY DELETED<br/>THE PLATFORM.</div>
  <div class="kept mono upper">We kept it.</div>
</div></body>`

// v2 end-card: +24px breathing room above wordmark (design-expert)
const tmplEndcard = `
<!doctype html><meta charset="utf-8"><style>${baseStyles}
.wm { font-size: 132px; font-weight: 700; color: ${COLORS.navy}; letter-spacing: 0.04em; margin-top: 24px; }
.urls { margin-top: 36px; font-size: 38px; color: ${COLORS.ink}; opacity: 0.85; letter-spacing: 0.06em; }
.sub { margin-top: 30px; font-size: 30px; color: ${COLORS.red}; letter-spacing: 0.08em; }
.rule { width: 320px; height: 2px; background: ${COLORS.navy}; margin: 36px auto; opacity: 0.5; }
.kicker { color: ${COLORS.ink}; opacity: 0.6; font-size: 22px; letter-spacing: 0.3em; }
</style><body><div class="safe">
  <div class="kicker mono upper">The Receipts They Tried to Disappear</div>
  <div class="rule"></div>
  <div class="wm serif">SEALED2016.COM</div>
  <div class="urls mono">campaignreceipts.com / sources</div>
  <div class="sub mono upper">Free. Embeddable. Source-cited.</div>
</div></body>`

// v2 caption: opacity 0.78 → 0.55 (design-expert)
function tmplCaption(text, { quoted = false } = {}) {
  const inner = quoted ? `&ldquo;${text}&rdquo;` : text
  return `<!doctype html><meta charset="utf-8"><style>
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  html,body{width:1920px;height:1080px;background:transparent}
  body{display:flex;align-items:flex-end;justify-content:center;padding-bottom:200px;
    font-family:'Lora',Georgia,serif;}
  .band{background:linear-gradient(180deg, rgba(11,37,69,0) 0%, rgba(11,11,11,0.55) 100%);
    padding:36px 60px 28px;border-radius:8px;color:${COLORS.cream};
    max-width:1080px;text-align:center;
    border-top:2px solid ${COLORS.red};}
  .t{font-size:64px;line-height:1.2;letter-spacing:0.02em;font-weight:500;}
  @import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,500;0,700&display=swap');
  </style><body><div class="band"><div class="t">${inner}</div></div></body>`
}

const tmplLowerThird = `
<!doctype html><meta charset="utf-8"><style>
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  html,body{width:1920px;height:1080px;background:transparent}
  body{display:flex;align-items:flex-end;justify-content:center;padding-bottom:36px;
    font-family:'IBM Plex Mono',ui-monospace,Menlo,monospace;}
  .lt{background:rgba(245,239,224,0.92);color:${COLORS.navy};
    padding:10px 22px;border-radius:4px;font-size:18px;
    letter-spacing:0.16em;text-transform:uppercase;
    border:1px solid rgba(11,37,69,0.4);
    max-width:1080px;text-align:center;}
  @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@500&display=swap');
  </style><body><div class="lt">Voice-over reads verbatim 2016 campaign quotes &nbsp;·&nbsp; Source page in description</div></body>`

// ── Puppeteer renderer ──────────────────────────────────────────────────────
async function renderFrames() {
  const puppeteer = requireFromVC('puppeteer')
  console.log('[render] launching puppeteer…')
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] })
  const page = await browser.newPage()
  await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 })

  async function snap(html, outPath, { transparent = false } = {}) {
    await page.setContent(html, { waitUntil: 'domcontentloaded', timeout: 15000 })
    try {
      await Promise.race([
        page.evaluate(async () => { if (document.fonts && document.fonts.ready) { await document.fonts.ready } }),
        new Promise(r => setTimeout(r, 2500)),
      ])
    } catch {}
    await page.screenshot({ path: outPath, omitBackground: !!transparent, type: outPath.endsWith('.jpg') ? 'jpeg' : 'png' })
    console.log(`[render] ${path.basename(outPath)}`)
  }

  await snap(tmplColdOpen, path.join(BUILD, 'coldopen.png'))
  await snap(tmplTitle0615, path.join(BUILD, 'title-0615.png'))
  await snap(tmplLedger, path.join(BUILD, 'ledger.png'))
  await snap(tmplScoreboard, path.join(BUILD, 'scoreboard.png'))
  await snap(tmplDeleted, path.join(BUILD, 'deleted.png'))
  await snap(tmplEndcard, path.join(BUILD, 'endcard.png'))
  await snap(tmplLowerThird, path.join(BUILD, 'lowerthird.png'), { transparent: true })

  await snap(tmplCaption('I will drain the swamp.', { quoted: true }), path.join(BUILD, 'cap-swamp.png'), { transparent: true })
  await snap(tmplCaption('Repeal and replace Obamacare.', { quoted: true }), path.join(BUILD, 'cap-aca.png'), { transparent: true })
  await snap(tmplCaption('Bring back our jobs.', { quoted: true }), path.join(BUILD, 'cap-jobs.png'), { transparent: true })
  await snap(tmplCaption('Then in 2024 he ran again.'), path.join(BUILD, 'cap-2024a.png'), { transparent: true })
  await snap(tmplCaption('We preserved those promises too.'), path.join(BUILD, 'cap-2024b.png'), { transparent: true })

  // Reuse v1 live capture if exists; else synthesize.
  const v1Live = path.join(MOVIE_OUT, '_build', 'live-donaldjtrump.png')
  const livePath = path.join(BUILD, 'live-donaldjtrump.png')
  if (fs.existsSync(v1Live)) {
    fs.copyFileSync(v1Live, livePath)
    console.log('[render] reusing v1 live capture')
  } else if (SKIP_LIVE) {
    const fallback = `<!doctype html><meta charset="utf-8"><style>${baseStyles}
      body{background:#000;color:#fff;}
      .wrap{width:1280px;text-align:center;color:#fff;}
      .logo{font-size:96px;font-weight:700;letter-spacing:0.04em;}
      .donate{margin-top:60px;padding:24px 56px;background:#C8102E;color:#fff;display:inline-block;font-family:'IBM Plex Mono',monospace;letter-spacing:0.2em;font-size:28px;text-transform:uppercase;border-radius:4px;}
      .note{margin-top:48px;color:#aaa;font-size:22px;font-style:italic;}
    </style><body><div class="wrap"><div class="logo serif">TRUMP</div><div class="donate">Donate Now</div><div class="note">[live donaldjtrump.com — donate-only shell]</div></div></body>`
    await snap(fallback, livePath)
  } else {
    try {
      const livePage = await browser.newPage()
      await livePage.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 })
      await livePage.goto('https://www.donaldjtrump.com/', { waitUntil: 'domcontentloaded', timeout: 25000 })
      await new Promise(r => setTimeout(r, 4000))
      await livePage.screenshot({ path: livePath, type: 'png' })
      await livePage.close()
      console.log('[render] live capture saved')
    } catch (e) {
      console.warn('[render] live capture failed:', e.message)
      const fb = `<!doctype html><meta charset="utf-8"><style>${baseStyles}body{background:#000;color:#fff;}.wrap{width:1280px;text-align:center;}.logo{font-size:96px;font-weight:700;}.donate{margin-top:60px;padding:24px 56px;background:#C8102E;color:#fff;display:inline-block;font-family:'IBM Plex Mono',monospace;letter-spacing:0.2em;font-size:28px;text-transform:uppercase;}</style><body><div class="wrap"><div class="logo serif">TRUMP</div><div class="donate">Donate Now</div></div></body>`
      await snap(fb, livePath)
    }
  }

  await browser.close()
}

// ── ElevenLabs TTS ──────────────────────────────────────────────────────────
const VOICE_ID = 'pNInz6obpgDQGcFmaJgB' // "Adam" — narrator register
const VO_LINES = [
  { id: 'l1-date',    text: 'June sixteenth, two thousand fifteen.',        align_t: 2.0 },
  { id: 'l2-swamp',   text: 'I will drain the swamp in Washington.',         align_t: 4.5 },
  { id: 'l3-aca',     text: 'Repeal and replace Obamacare.',                 align_t: 10.5 },
  { id: 'l4-jobs',    text: 'Bring back our jobs.',                          align_t: 14.5 },
  { id: 'l5-decade',  text: 'For ten years, we kept the receipts.',          align_t: 18.5 },
  { id: 'l6-ledger',  text: 'One hundred forty-five promises. We tracked every one.', align_t: 23.5 },
  { id: 'l7-score',   text: 'Forty-six kept. Fifty-one partial. Forty broken. Eight, you decide.', align_t: 28.8 },
  { id: 'l8-ran',     text: 'Then in twenty twenty-four, he ran again.',     align_t: 38.5 },
  { id: 'l9-kept',    text: 'We preserved that platform too.',               align_t: 44.5 },
  { id: 'l10-deleted',text: 'They deleted the platform. We kept it.',        align_t: 52.5 },
]

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
        voice_settings: { stability: 0.55, similarity_boost: 0.75, style: 0.0, use_speaker_boost: true },
      }),
    })
    if (!res.ok) {
      const t = await res.text()
      throw new Error(`ElevenLabs ${res.status}: ${t.slice(0, 200)}`)
    }
    const buf = Buffer.from(await res.arrayBuffer())
    fs.writeFileSync(out, buf)
  }
  console.log('[tts] all lines generated')
}

// Build the master VO track: silence base + adelay each line + amix
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
  if (idx === 0) return null
  const mixInputs = Array.from({ length: idx }, (_, i) => `[a${i}]`).join('')
  const filter =
    delays.join(';') +
    `;${mixInputs}amix=inputs=${idx}:duration=longest:normalize=0[mixed];` +
    `[mixed]atrim=0:${totalSec},loudnorm=I=-16:TP=-1.5:LRA=11[out]`

  sh('ffmpeg', [
    '-y',
    ...inputs,
    '-filter_complex', filter,
    '-map', '[out]',
    '-c:a', 'aac', '-b:a', '192k',
    out,
  ])
  return out
}

// ── ffmpeg helpers ──────────────────────────────────────────────────────────
function sh(cmd, a) {
  console.log(`[ffmpeg] ${cmd} ${a.map(x => x.length > 80 ? x.slice(0, 80) + '…' : x).join(' ')}`)
  const r = spawnSync(cmd, a, { stdio: 'inherit' })
  if (r.status !== 0) throw new Error(`${cmd} exited ${r.status}`)
}

const FPS = 30
const W = 1920, H = 1080

function kenBurns({ image, duration, out, zoomDir = 'in', captionPng = null, lowerThird = true }) {
  const frames = Math.round(duration * FPS)
  const z = zoomDir === 'in'
    ? `zoompan=z='min(zoom+0.0006,1.18)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${frames}:s=${W}x${H}:fps=${FPS}`
    : `zoompan=z='if(lte(zoom,1.0),1.18,max(1.001,zoom-0.0006))':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${frames}:s=${W}x${H}:fps=${FPS}`
  const lt = path.join(BUILD, 'lowerthird.png')
  const inputs = ['-framerate', String(FPS), '-loop', '1', '-t', String(duration), '-i', image]
  let filter = `[0:v]scale=${W*2}:${H*2}:force_original_aspect_ratio=increase,crop=${W*2}:${H*2},${z},trim=duration=${duration},setpts=PTS-STARTPTS,format=yuv420p[bg]`
  let last = 'bg', idx = 1
  if (captionPng) {
    inputs.push('-framerate', String(FPS), '-loop', '1', '-t', String(duration), '-i', captionPng)
    filter += `;[${idx}:v]scale=${W}:${H}[cap];[${last}][cap]overlay=0:0[wcap]`
    last = 'wcap'; idx++
  }
  if (lowerThird) {
    inputs.push('-framerate', String(FPS), '-loop', '1', '-t', String(duration), '-i', lt)
    filter += `;[${idx}:v]scale=${W}:${H}[lt];[${last}][lt]overlay=0:0[wlt]`
    last = 'wlt'; idx++
  }
  filter += `;[${last}]fade=t=in:st=0:d=0.25,fade=t=out:st=${(duration-0.25).toFixed(2)}:d=0.25[v]`
  sh('ffmpeg', ['-y', ...inputs, '-filter_complex', filter, '-map', '[v]',
    '-r', String(FPS), '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-preset', 'medium', '-crf', '18', out])
}

function staticClip({ image, duration, out, lowerThird = false, captionPng = null }) {
  const inputs = ['-loop', '1', '-t', String(duration), '-i', image]
  let filter = `[0:v]scale=${W}:${H}:force_original_aspect_ratio=decrease,pad=${W}:${H}:(ow-iw)/2:(oh-ih)/2:color=0x0B0B0B,format=yuv420p[bg]`
  let last = 'bg', idx = 1
  const lt = path.join(BUILD, 'lowerthird.png')
  if (captionPng) {
    inputs.push('-framerate', String(FPS), '-loop', '1', '-t', String(duration), '-i', captionPng)
    filter += `;[${idx}:v]scale=${W}:${H}[cap];[${last}][cap]overlay=0:0[wcap]`
    last = 'wcap'; idx++
  }
  if (lowerThird) {
    inputs.push('-framerate', String(FPS), '-loop', '1', '-t', String(duration), '-i', lt)
    filter += `;[${idx}:v]scale=${W}:${H}[lt];[${last}][lt]overlay=0:0[wlt]`
    last = 'wlt'; idx++
  }
  filter += `;[${last}]fade=t=in:st=0:d=0.25,fade=t=out:st=${(duration-0.25).toFixed(2)}:d=0.25[v]`
  sh('ffmpeg', ['-y', ...inputs, '-filter_complex', filter, '-map', '[v]',
    '-r', String(FPS), '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-preset', 'medium', '-crf', '18', out])
}

// v2 segment durations — see script-v2.md. Total = 2+2+6+4+4+5+5+10+6+4+4+4+4 = 60s
function buildSegments() {
  const seg = (name) => path.join(BUILD, `seg-${name}.mp4`)

  // Act 1
  staticClip({ image: path.join(BUILD, 'coldopen.png'), duration: 2, out: seg('00-coldopen'), lowerThird: true })
  staticClip({ image: path.join(BUILD, 'title-0615.png'), duration: 2, out: seg('01-title'), lowerThird: true })
  kenBurns({ image: path.join(PUBLIC, 'ch1-swamp.jpg'), duration: 6, out: seg('02-swamp'), zoomDir: 'in',
             captionPng: path.join(BUILD, 'cap-swamp.png'), lowerThird: true })
  kenBurns({ image: path.join(PUBLIC, 'ch4-healthcare.jpg'), duration: 4, out: seg('03-aca'), zoomDir: 'out',
             captionPng: path.join(BUILD, 'cap-aca.png'), lowerThird: true })
  kenBurns({ image: path.join(PUBLIC, 'ch7-china.jpg'), duration: 4, out: seg('04-jobs'), zoomDir: 'in',
             captionPng: path.join(BUILD, 'cap-jobs.png'), lowerThird: true })

  // Act 2
  const gridPath = path.join(BUILD, 'cover-grid.png')
  sh('ffmpeg', ['-y',
    '-i', path.join(PUBLIC, 'cover-2016.jpg'),
    '-i', path.join(PUBLIC, 'cover-2020.jpg'),
    '-i', path.join(PUBLIC, 'cover-2024.jpg'),
    '-i', path.join(PUBLIC, 'cover-2026.jpg'),
    '-filter_complex',
      `[0:v]scale=960:540:force_original_aspect_ratio=increase,crop=960:540[a];` +
      `[1:v]scale=960:540:force_original_aspect_ratio=increase,crop=960:540[b];` +
      `[2:v]scale=960:540:force_original_aspect_ratio=increase,crop=960:540[c];` +
      `[3:v]scale=960:540:force_original_aspect_ratio=increase,crop=960:540[d];` +
      `[a][b]hstack=inputs=2[top];[c][d]hstack=inputs=2[bot];[top][bot]vstack=inputs=2,format=yuv420p[v]`,
    '-map', '[v]', '-frames:v', '1', gridPath])
  kenBurns({ image: gridPath, duration: 5, out: seg('05-grid'), zoomDir: 'out', lowerThird: true })
  staticClip({ image: path.join(BUILD, 'ledger.png'), duration: 5, out: seg('06-ledger'), lowerThird: true })
  staticClip({ image: path.join(BUILD, 'scoreboard.png'), duration: 10, out: seg('07-score'), lowerThird: true })

  // Act 3
  kenBurns({ image: path.join(CR_SOURCES, 'policy-trade-2024-screenshot.png'), duration: 6,
             out: seg('08-trade2024'), zoomDir: 'in',
             captionPng: path.join(BUILD, 'cap-2024a.png'), lowerThird: true })
  kenBurns({ image: path.join(CR_SOURCES, 'policy-economy-2024-screenshot.png'), duration: 4,
             out: seg('09-econ2024'), zoomDir: 'out',
             captionPng: path.join(BUILD, 'cap-2024b.png'), lowerThird: true })
  staticClip({ image: path.join(BUILD, 'live-donaldjtrump.png'), duration: 4, out: seg('10-live'), lowerThird: false })
  staticClip({ image: path.join(BUILD, 'deleted.png'), duration: 4, out: seg('11-deleted'), lowerThird: false })
  staticClip({ image: path.join(BUILD, 'endcard.png'), duration: 4, out: seg('12-end'), lowerThird: false })

  return [
    seg('00-coldopen'), seg('01-title'), seg('02-swamp'), seg('03-aca'), seg('04-jobs'),
    seg('05-grid'), seg('06-ledger'), seg('07-score'),
    seg('08-trade2024'), seg('09-econ2024'), seg('10-live'), seg('11-deleted'), seg('12-end'),
  ]
}

function concatSegments(segments, outPath) {
  const list = path.join(BUILD, 'concat.txt')
  fs.writeFileSync(list, segments.map(p => `file '${p.replace(/'/g, "\\'")}'`).join('\n') + '\n')
  sh('ffmpeg', ['-y', '-f', 'concat', '-safe', '0', '-i', list,
    '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-preset', 'medium', '-crf', '18',
    '-r', String(FPS), '-movflags', '+faststart', outPath])
}

function muxAudio(videoPath, audioPath, outPath) {
  sh('ffmpeg', ['-y', '-i', videoPath, '-i', audioPath,
    '-map', '0:v:0', '-map', '1:a:0',
    '-c:v', 'copy', '-c:a', 'aac', '-b:a', '192k',
    '-shortest', '-movflags', '+faststart', outPath])
}

function make9x16(srcPath, outPath, withAudio = true) {
  const argsA = withAudio
    ? ['-c:a', 'aac', '-b:a', '192k']
    : []
  sh('ffmpeg', ['-y', '-i', srcPath,
    '-vf', `crop=608:1080:(iw-608)/2:0,scale=1080:1920,format=yuv420p`,
    '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-preset', 'medium', '-crf', '18',
    '-r', String(FPS), ...argsA, '-movflags', '+faststart', outPath])
}

function poster(srcPath, outPath) {
  sh('ffmpeg', ['-y', '-ss', '57.5', '-i', srcPath, '-frames:v', '1', '-q:v', '2', outPath])
}

// Ultra-hook 15s cut: coldopen (2s) + score (8s) + deleted (3s) + endcard (2s)
function buildUltraHook(masterAudio, outPath) {
  const seg = (n) => path.join(BUILD, `ultra-${n}.mp4`)
  staticClip({ image: path.join(BUILD, 'coldopen.png'), duration: 2, out: seg('a'), lowerThird: true })
  staticClip({ image: path.join(BUILD, 'scoreboard.png'), duration: 8, out: seg('b'), lowerThird: true })
  staticClip({ image: path.join(BUILD, 'deleted.png'), duration: 3, out: seg('c'), lowerThird: false })
  staticClip({ image: path.join(BUILD, 'endcard.png'), duration: 2, out: seg('d'), lowerThird: false })
  const list = path.join(BUILD, 'ultra-concat.txt')
  fs.writeFileSync(list, [seg('a'), seg('b'), seg('c'), seg('d')]
    .map(p => `file '${p.replace(/'/g, "\\'")}'`).join('\n') + '\n')
  const silentOut = path.join(BUILD, 'ultra-silent.mp4')
  sh('ffmpeg', ['-y', '-f', 'concat', '-safe', '0', '-i', list,
    '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-preset', 'medium', '-crf', '18',
    '-r', String(FPS), '-movflags', '+faststart', silentOut])

  // 15s ultra has its own narration mix: score line at 2.5s, deleted at 10s
  const scoreLine = path.join(VO, 'l7-score.mp3')
  const delLine = path.join(VO, 'l10-deleted.mp3')
  let audioOut = null
  if (fs.existsSync(scoreLine) && fs.existsSync(delLine)) {
    audioOut = path.join(BUILD, 'ultra-vo.m4a')
    sh('ffmpeg', ['-y', '-i', scoreLine, '-i', delLine,
      '-filter_complex',
        `[0:a]adelay=2500|2500,apad[a0];` +
        `[1:a]adelay=10000|10000,apad[a1];` +
        `[a0][a1]amix=inputs=2:duration=longest:normalize=0[m];` +
        `[m]atrim=0:15,loudnorm=I=-16:TP=-1.5:LRA=11[out]`,
      '-map', '[out]', '-c:a', 'aac', '-b:a', '192k', audioOut])
  }
  if (audioOut) {
    muxAudio(silentOut, audioOut, outPath)
  } else {
    fs.copyFileSync(silentOut, outPath)
  }
}

// ── Main ────────────────────────────────────────────────────────────────────
async function main() {
  console.log('[v2] SEALED 60-sec movie hook v2')

  const required = [
    path.join(PUBLIC, 'ch1-swamp.jpg'),
    path.join(PUBLIC, 'ch4-healthcare.jpg'),
    path.join(PUBLIC, 'ch7-china.jpg'),
    path.join(PUBLIC, 'cover-2016.jpg'),
    path.join(PUBLIC, 'cover-2020.jpg'),
    path.join(PUBLIC, 'cover-2024.jpg'),
    path.join(PUBLIC, 'cover-2026.jpg'),
    path.join(CR_SOURCES, 'policy-trade-2024-screenshot.png'),
    path.join(CR_SOURCES, 'policy-economy-2024-screenshot.png'),
  ]
  for (const p of required) if (!fs.existsSync(p)) throw new Error(`missing source asset: ${p}`)

  await renderFrames()

  if (!SKIP_TTS) {
    await generateTTS()
  }

  const segments = buildSegments()

  const masterSilent = path.join(BUILD, 'master-silent.mp4')
  concatSegments(segments, masterSilent)

  const master = path.join(MOVIE_OUT, 'sealed-hook-v2.mp4')
  const reel = path.join(MOVIE_OUT, 'sealed-hook-v2-9x16.mp4')
  const posterPath = path.join(MOVIE_OUT, 'sealed-hook-v2-poster.jpg')

  let voTrack = null
  if (!SKIP_TTS) {
    voTrack = buildVoMaster(60)
  }

  if (voTrack) {
    muxAudio(masterSilent, voTrack, master)
  } else {
    fs.copyFileSync(masterSilent, master)
  }

  make9x16(master, reel, !!voTrack)
  poster(master, posterPath)

  if (!NO_15S) {
    const ultra = path.join(MOVIE_OUT, 'sealed-hook-v2-15s.mp4')
    buildUltraHook(voTrack, ultra)
  }

  const probe = (p) => {
    try {
      return execFileSync('ffprobe', ['-v', 'error', '-show_entries',
        'stream=width,height,codec_type,duration:format=duration', '-of', 'default=nw=1', p],
        { encoding: 'utf8' }).trim()
    } catch (e) { return `probe-failed: ${e.message}` }
  }
  console.log('\n[v2] master:\n' + probe(master))
  console.log('[v2] reel:\n' + probe(reel))
  if (!NO_15S) console.log('[v2] 15s:\n' + probe(path.join(MOVIE_OUT, 'sealed-hook-v2-15s.mp4')))
  console.log(`[v2] poster: ${fs.statSync(posterPath).size} bytes`)
}

main().catch(e => { console.error(e); process.exit(1) })
