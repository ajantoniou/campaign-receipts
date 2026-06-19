#!/usr/bin/env node
/**
 * SEALED 60-sec movie hook v1 — orchestrator.
 *
 * Renders typography frames + a live donaldjtrump.com capture via Puppeteer,
 * then stitches ken-burns clips + cross-fades + persistent lower-third via ffmpeg.
 *
 * Outputs:
 *   public/movie/sealed-hook-v1.mp4       (1920x1080, ~60s, H.264)
 *   public/movie/sealed-hook-v1-9x16.mp4  (1080x1920 reel crop)
 *   public/movie/sealed-hook-v1-poster.jpg (end-frame poster)
 *
 * Usage:  node companies/concise-sealed/scripts/movie/v1-hook.mjs
 * Optional: --skip-live  (use placeholder for the donaldjtrump.com capture, e.g. offline)
 *
 * No fal.ai calls in v1. Renders silent + captioned. Narration deferred.
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
const BUILD = path.join(MOVIE_OUT, '_build')
const CR_SOURCES = path.join(REPO_ROOT, 'companies', 'campaign-receipts', 'public', 'sources')

// puppeteer is installed in Sealed's own node_modules
const VC_NODE = path.join(COMPANY_ROOT, 'node_modules')
const requireFromVC = createRequire(path.join(VC_NODE, 'package.json'))

fs.mkdirSync(BUILD, { recursive: true })

const args = new Set(process.argv.slice(2))
const SKIP_LIVE = args.has('--skip-live')

// ── Brand tokens ────────────────────────────────────────────────────────────
const COLORS = {
  cream: '#F5EFE0',
  parchment: '#EFE6D2',
  navy: '#0B2545',
  red: '#8C1D18',
  green: '#2F5D3A',
  amber: '#B8860B',
  ink: '#1E1A14',
}

// ── HTML templates for typography frames (rendered by Puppeteer) ───────────
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
  .small { font-size: 22px; }
`

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

const tmplEndcard = `
<!doctype html><meta charset="utf-8"><style>${baseStyles}
.wm { font-size: 132px; font-weight: 700; color: ${COLORS.navy}; letter-spacing: 0.04em; }
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

// Caption frame: a transparent overlay PNG with a translucent dark band + caption text.
// (We use this for the quote captions so beats 1's quotes don't require burning text into the ken-burns clip.)
function tmplCaption(text, { quoted = false } = {}) {
  const inner = quoted ? `&ldquo;${text}&rdquo;` : text
  return `<!doctype html><meta charset="utf-8"><style>
  *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
  html,body{width:1920px;height:1080px;background:transparent}
  body{display:flex;align-items:flex-end;justify-content:center;padding-bottom:200px;
    font-family:'Lora',Georgia,serif;}
  .band{background:linear-gradient(180deg, rgba(11,37,69,0) 0%, rgba(11,11,11,0.78) 100%);
    padding:36px 60px 28px;border-radius:8px;color:${COLORS.cream};
    max-width:1080px;text-align:center;
    border-top:2px solid ${COLORS.red};}
  .t{font-size:64px;line-height:1.2;letter-spacing:0.02em;font-weight:500;}
  @import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,500;0,700&display=swap');
  </style><body><div class="band"><div class="t">${inner}</div></div></body>`
}

// Lower-third disclosure — burned in throughout beats 1 and 2.
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
    // Wait briefly for webfonts; if offline, fall through to system fonts.
    try {
      await Promise.race([
        page.evaluate(async () => { if (document.fonts && document.fonts.ready) { await document.fonts.ready } }),
        new Promise(r => setTimeout(r, 2500)),
      ])
    } catch {}
    await page.screenshot({ path: outPath, omitBackground: !!transparent, type: outPath.endsWith('.jpg') ? 'jpeg' : 'png' })
    console.log(`[render] ${path.basename(outPath)}`)
  }

  await snap(tmplTitle0615, path.join(BUILD, 'title-0615.png'))
  await snap(tmplLedger, path.join(BUILD, 'ledger.png'))
  await snap(tmplScoreboard, path.join(BUILD, 'scoreboard.png'))
  await snap(tmplDeleted, path.join(BUILD, 'deleted.png'))
  await snap(tmplEndcard, path.join(BUILD, 'endcard.png'))
  await snap(tmplLowerThird, path.join(BUILD, 'lowerthird.png'), { transparent: true })

  // Caption overlays
  await snap(tmplCaption('I will drain the swamp.', { quoted: true }), path.join(BUILD, 'cap-swamp.png'), { transparent: true })
  await snap(tmplCaption('Repeal and replace Obamacare.', { quoted: true }), path.join(BUILD, 'cap-aca.png'), { transparent: true })
  await snap(tmplCaption('Bring back our jobs.', { quoted: true }), path.join(BUILD, 'cap-jobs.png'), { transparent: true })
  await snap(tmplCaption('Then in 2024 he ran again.'), path.join(BUILD, 'cap-2024a.png'), { transparent: true })
  await snap(tmplCaption('We preserved those promises too.'), path.join(BUILD, 'cap-2024b.png'), { transparent: true })

  // Live donaldjtrump.com — capture or placeholder
  const livePath = path.join(BUILD, 'live-donaldjtrump.png')
  if (SKIP_LIVE || fs.existsSync(livePath)) {
    if (!fs.existsSync(livePath)) {
      // Fallback synthetic shell
      const fallback = `<!doctype html><meta charset="utf-8"><style>${baseStyles}
        body{background:#000;color:#fff;font-family:'Lora',serif;}
        .wrap{width:1280px;text-align:center;color:#fff;}
        .logo{font-size:96px;font-weight:700;letter-spacing:0.04em;}
        .donate{margin-top:60px;padding:24px 56px;background:#C8102E;color:#fff;display:inline-block;font-family:'IBM Plex Mono',monospace;letter-spacing:0.2em;font-size:28px;text-transform:uppercase;border-radius:4px;}
        .note{margin-top:48px;color:#aaa;font-size:22px;font-style:italic;}
      </style><body><div class="wrap">
        <div class="logo serif">TRUMP</div>
        <div class="donate">Donate Now</div>
        <div class="note">[live donaldjtrump.com — donate-only shell]</div>
      </div></body>`
      await snap(fallback, livePath)
    } else {
      console.log('[render] live capture exists, reusing')
    }
  } else {
    console.log('[render] capturing live donaldjtrump.com…')
    try {
      const livePage = await browser.newPage()
      await livePage.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 })
      await livePage.goto('https://www.donaldjtrump.com/', { waitUntil: 'domcontentloaded', timeout: 25000 })
      // Give it a moment to settle
      await new Promise(r => setTimeout(r, 4000))
      await livePage.screenshot({ path: livePath, type: 'png' })
      await livePage.close()
      console.log('[render] live capture saved')
    } catch (e) {
      console.warn('[render] live capture failed, using fallback:', e.message)
      await snap(`<!doctype html><meta charset="utf-8"><style>${baseStyles}
        body{background:#000;color:#fff;}
        .wrap{width:1280px;text-align:center;}
        .logo{font-size:96px;font-weight:700;}
        .donate{margin-top:60px;padding:24px 56px;background:#C8102E;color:#fff;display:inline-block;font-family:'IBM Plex Mono',monospace;letter-spacing:0.2em;font-size:28px;text-transform:uppercase;}
      </style><body><div class="wrap"><div class="logo serif">TRUMP</div><div class="donate">Donate Now</div></div></body>`,
        livePath)
    }
  }

  await browser.close()
}

// ── ffmpeg pipeline ─────────────────────────────────────────────────────────
function sh(cmd, args) {
  console.log(`[ffmpeg] ${cmd} ${args.map(a => a.length > 60 ? a.slice(0, 60) + '…' : a).join(' ')}`)
  const r = spawnSync(cmd, args, { stdio: 'inherit' })
  if (r.status !== 0) throw new Error(`${cmd} exited ${r.status}`)
}

// Each beat is rendered as its own clip, then concatenated. Cross-fades via concat
// would be ideal but the simpler-and-robust path is: ken-burns per clip, then
// concat with brief fade-in/out on each clip. We use the demuxer concat for stability.

const FPS = 30
const W = 1920, H = 1080

// Build per-segment clips.
// We use the filter:
//   scale=W*4:H*4 → letterbox to W:H → zoompan d=frames z='zoom+...' x= y= s=WxH
// Actually the canonical Hollywood ken-burns recipe is:
//   -loop 1 -i img.jpg -t T -vf "scale=W*8:H*8, zoompan=z='min(zoom+0.0005,1.25)':d=T*FPS:s=WxH:fps=FPS, format=yuv420p"
function kenBurns({ image, duration, out, zoomDir = 'in', captionPng = null, lowerThird = true }) {
  // zoompan needs s=WxH and a long stream. zoompan reads from stream as a series of frames.
  const frames = Math.round(duration * FPS)
  const zoomExpr = zoomDir === 'in'
    ? `if(lte(zoom,1.0),1.18,max(1.001,zoom-0.0008))` // start zoomed in, slow zoom out
    : `min(zoom+0.0006,1.22)` // slow zoom in
  // We'll use "out" (slow zoom out) and "in" (slow zoom in) variants.
  // Simpler robust form:
  const z = zoomDir === 'in'
    ? `zoompan=z='min(zoom+0.0006,1.18)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${frames}:s=${W}x${H}:fps=${FPS}`
    : `zoompan=z='if(lte(zoom,1.0),1.18,max(1.001,zoom-0.0006))':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${frames}:s=${W}x${H}:fps=${FPS}`

  // Build filter chain.
  // NB: zoompan's d= counts INPUT frames (default 25fps for -loop), so we feed
  // the image at the target FPS via -framerate and then trim to exact duration
  // after zoompan to guarantee the segment length matches `duration` exactly.
  const lt = path.join(BUILD, 'lowerthird.png')
  const inputs = ['-framerate', String(FPS), '-loop', '1', '-t', String(duration), '-i', image]
  let filter = `[0:v]scale=${W*2}:${H*2}:force_original_aspect_ratio=increase,crop=${W*2}:${H*2},${z},trim=duration=${duration},setpts=PTS-STARTPTS,format=yuv420p[bg]`
  let last = 'bg'

  let extraInputIdx = 1
  if (captionPng) {
    inputs.push('-framerate', String(FPS), '-loop', '1', '-t', String(duration), '-i', captionPng)
    filter += `;[${extraInputIdx}:v]scale=${W}:${H}[cap]`
    filter += `;[${last}][cap]overlay=0:0[wcap]`
    last = 'wcap'
    extraInputIdx++
  }
  if (lowerThird) {
    inputs.push('-framerate', String(FPS), '-loop', '1', '-t', String(duration), '-i', lt)
    filter += `;[${extraInputIdx}:v]scale=${W}:${H}[lt]`
    filter += `;[${last}][lt]overlay=0:0[wlt]`
    last = 'wlt'
    extraInputIdx++
  }

  // Add brief fade-in/out
  filter += `;[${last}]fade=t=in:st=0:d=0.25,fade=t=out:st=${(duration-0.25).toFixed(2)}:d=0.25[v]`

  sh('ffmpeg', [
    '-y',
    ...inputs,
    '-filter_complex', filter,
    '-map', '[v]',
    '-r', String(FPS),
    '-c:v', 'libx264',
    '-pix_fmt', 'yuv420p',
    '-preset', 'medium',
    '-crf', '18',
    out,
  ])
}

// Static frame (typography) — no ken-burns, just hold + fade
function staticClip({ image, duration, out, lowerThird = false, captionPng = null }) {
  const inputs = ['-loop', '1', '-t', String(duration), '-i', image]
  let filter = `[0:v]scale=${W}:${H}:force_original_aspect_ratio=decrease,pad=${W}:${H}:(ow-iw)/2:(oh-ih)/2:color=0x0B0B0B,format=yuv420p[bg]`
  let last = 'bg'
  let idx = 1
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
  sh('ffmpeg', [
    '-y', ...inputs,
    '-filter_complex', filter,
    '-map', '[v]',
    '-r', String(FPS),
    '-c:v', 'libx264', '-pix_fmt', 'yuv420p',
    '-preset', 'medium', '-crf', '18',
    out,
  ])
}

function buildSegments() {
  const seg = (name) => path.join(BUILD, `seg-${name}.mp4`)

  // BEAT 1 — 0–20s
  staticClip({ image: path.join(BUILD, 'title-0615.png'), duration: 3, out: seg('01-title'), lowerThird: true })
  kenBurns({ image: path.join(PUBLIC, 'ch1-swamp.jpg'), duration: 5, out: seg('02-swamp'), zoomDir: 'in',
             captionPng: path.join(BUILD, 'cap-swamp.png'), lowerThird: true })
  kenBurns({ image: path.join(PUBLIC, 'ch4-healthcare.jpg'), duration: 6, out: seg('03-aca'), zoomDir: 'out',
             captionPng: path.join(BUILD, 'cap-aca.png'), lowerThird: true })
  kenBurns({ image: path.join(PUBLIC, 'ch7-china.jpg'), duration: 6, out: seg('04-jobs'), zoomDir: 'in',
             captionPng: path.join(BUILD, 'cap-jobs.png'), lowerThird: true })

  // BEAT 2 — 20–40s
  // 2x2 grid composite. Pre-render a single image via ffmpeg tile filter.
  const gridPath = path.join(BUILD, 'cover-grid.png')
  sh('ffmpeg', [
    '-y',
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
    '-map', '[v]', '-frames:v', '1', gridPath,
  ])
  kenBurns({ image: gridPath, duration: 5, out: seg('05-grid'), zoomDir: 'out', lowerThird: true })
  staticClip({ image: path.join(BUILD, 'ledger.png'), duration: 7, out: seg('06-ledger'), lowerThird: true })
  staticClip({ image: path.join(BUILD, 'scoreboard.png'), duration: 8, out: seg('07-score'), lowerThird: true })

  // BEAT 3 — 40–60s
  kenBurns({ image: path.join(CR_SOURCES, 'policy-trade-2024-screenshot.png'), duration: 5,
             out: seg('08-trade2024'), zoomDir: 'in',
             captionPng: path.join(BUILD, 'cap-2024a.png'), lowerThird: true })
  kenBurns({ image: path.join(CR_SOURCES, 'policy-economy-2024-screenshot.png'), duration: 4,
             out: seg('09-econ2024'), zoomDir: 'out',
             captionPng: path.join(BUILD, 'cap-2024b.png'), lowerThird: true })
  // Live shell — short, no caption, no lower third (beat 3 transitions to its own framing)
  staticClip({ image: path.join(BUILD, 'live-donaldjtrump.png'), duration: 4, out: seg('10-live'), lowerThird: false })
  staticClip({ image: path.join(BUILD, 'deleted.png'), duration: 4, out: seg('11-deleted'), lowerThird: false })
  staticClip({ image: path.join(BUILD, 'endcard.png'), duration: 3, out: seg('12-end'), lowerThird: false })

  return [
    seg('01-title'), seg('02-swamp'), seg('03-aca'), seg('04-jobs'),
    seg('05-grid'), seg('06-ledger'), seg('07-score'),
    seg('08-trade2024'), seg('09-econ2024'), seg('10-live'), seg('11-deleted'), seg('12-end'),
  ]
}

function concatSegments(segments, outPath) {
  const list = path.join(BUILD, 'concat.txt')
  fs.writeFileSync(list, segments.map(p => `file '${p.replace(/'/g, "\\'")}'`).join('\n') + '\n')
  sh('ffmpeg', [
    '-y',
    '-f', 'concat', '-safe', '0',
    '-i', list,
    '-c:v', 'libx264', '-pix_fmt', 'yuv420p',
    '-preset', 'medium', '-crf', '18',
    '-r', String(FPS),
    '-movflags', '+faststart',
    outPath,
  ])
}

function make9x16(srcPath, outPath) {
  // Auto-crop: center column of 16:9 → 9:16 means cropping width.
  // 1920x1080 → take center 607.5x1080 (1080*9/16=607.5) → scale to 1080x1920.
  sh('ffmpeg', [
    '-y',
    '-i', srcPath,
    '-vf', `crop=608:1080:(iw-608)/2:0,scale=1080:1920,format=yuv420p`,
    '-c:v', 'libx264', '-pix_fmt', 'yuv420p',
    '-preset', 'medium', '-crf', '18',
    '-r', String(FPS),
    '-movflags', '+faststart',
    outPath,
  ])
}

function poster(srcPath, outPath) {
  // Grab a frame at t=0:58 (end-card area)
  sh('ffmpeg', [
    '-y',
    '-ss', '57.5',
    '-i', srcPath,
    '-frames:v', '1', '-q:v', '2',
    outPath,
  ])
}

// ── Main ────────────────────────────────────────────────────────────────────
async function main() {
  console.log('[hook] SEALED 60-sec movie hook v1')
  console.log('[hook] company root:', COMPANY_ROOT)

  // Sanity check source assets
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
  for (const p of required) {
    if (!fs.existsSync(p)) throw new Error(`missing source asset: ${p}`)
  }
  console.log('[hook] all source assets present')

  await renderFrames()

  const segments = buildSegments()

  const master = path.join(MOVIE_OUT, 'sealed-hook-v1.mp4')
  const reel = path.join(MOVIE_OUT, 'sealed-hook-v1-9x16.mp4')
  const posterPath = path.join(MOVIE_OUT, 'sealed-hook-v1-poster.jpg')

  concatSegments(segments, master)
  make9x16(master, reel)
  poster(master, posterPath)

  // Probe output for verification
  const probe = (p) => {
    try {
      const out = execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'stream=width,height,r_frame_rate,duration', '-of', 'default=nw=1', p], { encoding: 'utf8' })
      return out.trim()
    } catch (e) { return `probe-failed: ${e.message}` }
  }
  console.log('\n[hook] master:\n' + probe(master))
  console.log('[hook] reel:\n' + probe(reel))
  console.log(`[hook] poster: ${fs.statSync(posterPath).size} bytes`)
}

main().catch(err => { console.error(err); process.exit(1) })
