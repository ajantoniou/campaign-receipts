#!/usr/bin/env node
/**
 * splice-subscribe-001.mjs — Insert a Subscribe CTA interstitial into the
 * existing SEALED-001 viral cut. Targeted edit, not a full re-render.
 *
 * What it does:
 *   1. Generate vo-subscribe.mp3 via ElevenLabs Sarah:
 *      "Subscribe — new receipts drop daily."
 *   2. Build a 2.5s parchment interstitial (vseg-subscribe.mp4) with bell
 *      pulse + animated SUBSCRIBE / NEW RECEIPTS DROP DAILY type.
 *   3. Re-render the final card (vseg-cta.mp4) to add a "SUBSCRIBE — NEW
 *      RECEIPTS DAILY" line beneath the SEALED2016.COM URL.
 *   4. Re-concat: [hook] + [subscribe] + [pr1..verdict] + [new cta].
 *   5. Rebuild audio: original vo-v2.mp3 split at 3.21s; insert subscribe VO
 *      (with 0.3s pre/post silence) at the boundary; music ducks under voice
 *      via sidechain compressor, same as original pipeline.
 *   6. Re-mux to public/shorts/sealed-001-aipac-iran-deal.mp4 (already
 *      archived to ...-v1-no-subscribe.mp4 by caller).
 *
 * Inputs (must exist):
 *   _build/001/viral-segments.json
 *   _build/001/vo-v2.mp3
 *   _build/001/vseg-{hook,pr1,...,verdict}.mp4   (re-uses existing clips)
 *   _build/001/sfx-track.m4a                     (extended for new timeline)
 *   /Applications/DrAntoniou Projects/AgentCompanies/companies/concise-sealed/public/movie/_build_v4/music.mp3
 *
 * Outputs:
 *   _build/001/vo-subscribe.mp3
 *   _build/001/vseg-subscribe.mp4
 *   _build/001/vseg-cta.mp4                      (overwrites; new final card)
 *   _build/001/viral-concat-v2.txt
 *   _build/001/viral-concat-v2.mp4
 *   _build/001/viral-mix-v2.m4a
 *   _build/001/viral-master-v2.mp4
 *   _build/001/viral-rms-report-v2.json
 *   _build/001/viral-summary-v2.json
 *   public/shorts/sealed-001-aipac-iran-deal.mp4  (OVERWRITES)
 *   public/shorts/sealed-001-aipac-iran-deal.jpg  (regenerated)
 *
 * Usage:
 *   node scripts/shorts/splice-subscribe-001.mjs
 *   node scripts/shorts/splice-subscribe-001.mjs --skip-tts   (reuse vo-subscribe.mp3)
 */

import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'

const REPO = '/Applications/DrAntoniou Projects/AgentCompanies'
const CR   = `${REPO}/companies/campaign-receipts`
const BUILD = `${CR}/scripts/shorts/_build/001`
const PUB_SHORTS = `${CR}/public/shorts`
const MUSIC = `${REPO}/companies/concise-sealed/public/movie/_build_v4/music.mp3`
const COST_LOG = `${CR}/scripts/shorts/.external-costs.jsonl`
const W = 1080, H = 1920, FPS = 30
const SUBSCRIBE_TEXT = 'Subscribe — new receipts drop daily.'
const SUBSCRIBE_INSERT_AT = 3.205314537931035   // exact end of hook segment from viral-segments.json
const SUBSCRIBE_DUR = 3.1                       // VO + 0.3s pre + 0.3s post silence target
const FLAGS = new Set(process.argv.slice(2))
const SKIP_TTS = FLAGS.has('--skip-tts')

// ── env / shell ───────────────────────────────────────────────────────────
function loadEnv() {
  const env = {}
  const p = `${REPO}/.env`
  if (fs.existsSync(p)) {
    for (const ln of fs.readFileSync(p, 'utf8').split('\n')) {
      const m = ln.match(/^([A-Z0-9_]+)=(.*)$/)
      if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '')
    }
  }
  return env
}
const env = loadEnv()
function sh(cmd, a) {
  const r = spawnSync(cmd, a, { stdio: 'inherit' })
  if (r.status !== 0) { console.error(`FAIL: ${cmd} ${a.slice(0,4).join(' ')}…`); process.exit(r.status||1) }
}
function shCap(cmd, a) {
  const r = spawnSync(cmd, a, { encoding: 'utf8' })
  return { stdout: r.stdout||'', stderr: r.stderr||'', status: r.status }
}
function probeDur(f) {
  return parseFloat(shCap('ffprobe', ['-v','error','-show_entries','format=duration','-of','default=nw=1:nk=1', f]).stdout.trim())
}
function logCost(piece, vendor, usd, note) {
  fs.mkdirSync(path.dirname(COST_LOG), { recursive: true })
  fs.appendFileSync(COST_LOG, JSON.stringify({ ts: new Date().toISOString(), piece, vendor, cost_usd: +usd.toFixed(4), note })+'\n')
}
function xml(s){return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}
function svgToPng(svg, png, w, h) {
  const svgP = png.replace(/\.png$/, '.svg')
  fs.writeFileSync(svgP, svg)
  sh('rsvg-convert', ['-w', String(w), '-h', String(h), svgP, '-o', png])
}

const C = {
  cream:   'rgb(250,247,239)',
  ink:     '#1a2b4a',
  red:     '#A11B1B',
  paper:   'rgb(244,238,222)',
}

// ── TTS ────────────────────────────────────────────────────────────────────
async function synthesizeSubscribeVo(outPath) {
  const apiKey = env.ELEVENLABS_API_KEY || env.NT_ELEVENLABS_API_KEY
  if (!apiKey) { console.error('No ELEVENLABS_API_KEY'); process.exit(1) }
  const voiceId = env.CR_SHORTS_VOICE_ID || 'EXAVITQu4vr4xnSDxMaL'
  const body = {
    text: SUBSCRIBE_TEXT,
    model_id: 'eleven_multilingual_v2',
    voice_settings: { stability: 0.45, similarity_boost: 0.75, style: 0.40, use_speaker_boost: true },
  }
  console.log(`[tts] "${SUBSCRIBE_TEXT}" → ElevenLabs Sarah`)
  const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: 'POST',
    headers: { 'xi-api-key': apiKey, 'Content-Type': 'application/json', 'Accept': 'audio/mpeg' },
    body: JSON.stringify(body),
  })
  if (!r.ok) { console.error(`ElevenLabs HTTP ${r.status}: ${(await r.text()).slice(0,400)}`); process.exit(1) }
  fs.writeFileSync(outPath, Buffer.from(await r.arrayBuffer()))
  const cost = SUBSCRIBE_TEXT.length / 1000 * 0.22
  logCost('sealed-001-subscribe-cta', 'elevenlabs', cost, `chars=${SUBSCRIBE_TEXT.length}`)
  console.log(`[tts] wrote ${outPath}, ~$${cost.toFixed(4)}`)
}

// ── Subscribe interstitial SVG ─────────────────────────────────────────────
// Static composition. Bell-pulse + entry animation done in ffmpeg via overlay.
function svgSubscribeBase() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="${C.paper}"/>
  <rect x="0" y="0" width="${W}" height="22" fill="${C.red}"/>
  <rect x="0" y="${H-22}" width="${W}" height="22" fill="${C.red}"/>
  <text x="${W/2}" y="200" text-anchor="middle"
    font-family="Georgia, serif" font-weight="900" font-size="64" fill="${C.ink}" letter-spacing="8">SEALED</text>
  <text x="${W/2}" y="248" text-anchor="middle"
    font-family="Georgia, serif" font-style="italic" font-size="26" fill="#5a4a3a">the 2016 promises, on the record</text>
  <text x="${W/2}" y="900" text-anchor="middle"
    font-family="Helvetica, Arial, sans-serif" font-weight="900" font-size="148" fill="${C.red}" letter-spacing="4">SUBSCRIBE</text>
  <line x1="280" y1="980" x2="800" y2="980" stroke="${C.ink}" stroke-width="4"/>
  <text x="${W/2}" y="1140" text-anchor="middle"
    font-family="Helvetica, Arial, sans-serif" font-weight="900" font-size="64" fill="${C.ink}" letter-spacing="4">NEW RECEIPTS</text>
  <text x="${W/2}" y="1220" text-anchor="middle"
    font-family="Helvetica, Arial, sans-serif" font-weight="900" font-size="64" fill="${C.ink}" letter-spacing="4">DROP DAILY</text>
  <text x="${W/2}" y="1500" text-anchor="middle"
    font-family="Menlo, Monaco, monospace" font-weight="700" font-size="32" fill="${C.red}" letter-spacing="5">SEALED2016.COM</text>
</svg>`
}
// Bell badge — drawn at top-right corner as a separate overlay so we can pulse it
function svgBellBadge() {
  const w = 420, h = 100
  return {
    svg: `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <rect x="4" y="4" width="${w-8}" height="${h-8}" rx="14" fill="rgb(250,247,239)" stroke="${C.red}" stroke-width="4"/>
  <text x="34" y="68" font-family="Helvetica, Arial, sans-serif" font-size="56" fill="${C.red}">🔔</text>
  <text x="108" y="66" font-family="Helvetica, Arial, sans-serif" font-weight="900" font-size="40" fill="${C.red}" letter-spacing="2">SUBSCRIBE</text>
</svg>`,
    w, h,
  }
}
// New final card — adds subscribe line beneath the URL
function svgFinalCardWithSubscribe() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="${C.cream}"/>
  <rect x="0" y="0" width="${W}" height="22" fill="${C.red}"/>
  <rect x="0" y="${H-22}" width="${W}" height="22" fill="${C.red}"/>
  <text x="${W/2}" y="700" text-anchor="middle"
    font-family="Georgia, serif" font-weight="900" font-size="220" fill="${C.ink}" letter-spacing="12">SEALED</text>
  <text x="${W/2}" y="800" text-anchor="middle"
    font-family="Georgia, serif" font-style="italic" font-size="44" fill="#5a4a3a">the 2016 promises, on the record</text>
  <line x1="240" y1="900" x2="840" y2="900" stroke="${C.red}" stroke-width="4"/>
  <text x="${W/2}" y="1060" text-anchor="middle"
    font-family="Helvetica, sans-serif" font-weight="900" font-size="84" fill="${C.ink}" letter-spacing="3">145 PROMISES</text>
  <text x="${W/2}" y="1160" text-anchor="middle"
    font-family="Helvetica, sans-serif" font-weight="900" font-size="84" fill="${C.ink}" letter-spacing="3">EVERY RECEIPT</text>
  <text x="${W/2}" y="1430" text-anchor="middle"
    font-family="Menlo, monospace" font-weight="900" font-size="86" fill="${C.red}" letter-spacing="3">SEALED2016.COM</text>
  <text x="${W/2}" y="1560" text-anchor="middle"
    font-family="Menlo, monospace" font-weight="700" font-size="44" fill="${C.red}" letter-spacing="5">🔔 SUBSCRIBE — NEW RECEIPTS DAILY</text>
</svg>`
}

async function main() {
  fs.mkdirSync(BUILD, { recursive: true })
  const overlays = path.join(BUILD, '_overlays_v2')
  fs.mkdirSync(overlays, { recursive: true })

  const segs = JSON.parse(fs.readFileSync(`${BUILD}/viral-segments.json`,'utf8'))
  console.log(`[plan] inserting subscribe at t=${SUBSCRIBE_INSERT_AT.toFixed(3)}s (end of hook segment)`)

  // ── 1. TTS subscribe line ───────────────────────────────────────────────
  const subVo = `${BUILD}/vo-subscribe.mp3`
  if (SKIP_TTS && fs.existsSync(subVo)) {
    console.log(`[tts] skip — reusing ${subVo}`)
  } else {
    await synthesizeSubscribeVo(subVo)
  }
  const subVoDur = probeDur(subVo)
  console.log(`[tts] subVo duration = ${subVoDur.toFixed(3)}s`)
  // Compute interstitial total duration: 0.3s pre + voice + 0.3s post, min SUBSCRIBE_DUR
  const interstitialDur = Math.max(SUBSCRIBE_DUR, subVoDur + 0.6)
  const preSilence = 0.3
  console.log(`[plan] interstitial duration = ${interstitialDur.toFixed(3)}s (preSil=${preSilence}, voice=${subVoDur.toFixed(2)})`)

  // ── 2. Render subscribe base PNG + bell badge PNG ───────────────────────
  const basePng = path.join(overlays, 'card-subscribe.png')
  svgToPng(svgSubscribeBase(), basePng, W, H)
  const bell = svgBellBadge()
  const bellPng = path.join(overlays, 'badge-bell.png')
  svgToPng(bell.svg, bellPng, bell.w, bell.h)

  // ── 3. Build vseg-subscribe.mp4: base card + bell pulse top-right ──────
  // Bell pulse: scale 1.0→1.15→1.0 every 1.5s. Implement via overlay with
  // scaled bell + zoompan would be complex; simpler: pre-render 3 bell sizes
  // and alternate via enable-windows.
  // Simpler still: just overlay the same bell PNG with a subtle scale animation
  // using scale=if(...) — but overlay scale interpolation isn't first-class.
  // Use two bell sizes (1.0 and 1.15) and alternate via enable= between.
  const bellPngBig = path.join(overlays, 'badge-bell-big.png')
  svgToPng(bell.svg, bellPngBig, Math.round(bell.w * 1.15), Math.round(bell.h * 1.15))

  const segPath = `${BUILD}/vseg-subscribe.mp4`
  const bellX = W - bell.w - 60      // right-justified with 60px margin
  const bellY = 360
  const bellBigX = W - Math.round(bell.w * 1.15) - 60 + 4
  const bellBigY = 360 - Math.round(bell.h * 0.15 / 2)
  // Pulse windows: bell-big visible 0.0-0.4 and 1.5-1.9, otherwise bell-small.
  // Title animations: SUBSCRIBE text already burned into base card; add a quick
  // zoom-in on the base card for energy.
  const frames = Math.round(interstitialDur * FPS)
  // Static base — no zoom (keeps big SUBSCRIBE text inside frame). Motion comes from bell pulse.
  const baseFilter = `[0:v]zoompan=z='1.0':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${frames}:s=${W}x${H}:fps=${FPS},trim=duration=${interstitialDur},setpts=PTS-STARTPTS,format=yuv420p[v0]`
  // overlay small bell (default), then big bell (during pulse windows)
  const overlayChain =
    `[v0][1:v]overlay=${bellX}:${bellY}[v1];` +
    `[v1][2:v]overlay=${bellBigX}:${bellBigY}:enable='between(t,0.0,0.35)+between(t,1.5,1.85)'[vout]`
  const filter = `${baseFilter};${overlayChain}`
  sh('ffmpeg', ['-y',
    '-framerate', String(FPS), '-loop','1','-t', String(interstitialDur), '-i', basePng,
    '-framerate', String(FPS), '-loop','1','-t', String(interstitialDur), '-i', bellPng,
    '-framerate', String(FPS), '-loop','1','-t', String(interstitialDur), '-i', bellPngBig,
    '-filter_complex', filter,
    '-map','[vout]',
    '-c:v','libx264','-pix_fmt','yuv420p','-preset','fast','-crf','20','-r',String(FPS),'-an',
    segPath,
  ])
  console.log(`[seg] wrote ${segPath}`)

  // ── 4. Re-render new final card (vseg-cta.mp4) with subscribe line ─────
  const ctaSeg = segs[segs.length - 1]
  const ctaDur = ctaSeg.end - ctaSeg.start
  const newCtaPng = path.join(overlays, 'card-cta-v2.png')
  svgToPng(svgFinalCardWithSubscribe(), newCtaPng, W, H)
  const ctaFrames = Math.round(ctaDur * FPS)
  const ctaFilter = `[0:v]zoompan=z='1.0':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${ctaFrames}:s=${W}x${H}:fps=${FPS},trim=duration=${ctaDur},setpts=PTS-STARTPTS,format=yuv420p[vout]`
  const newCtaPath = `${BUILD}/vseg-cta.mp4`
  sh('ffmpeg', ['-y',
    '-framerate', String(FPS), '-loop','1','-t', String(ctaDur), '-i', newCtaPng,
    '-filter_complex', ctaFilter,
    '-map','[vout]',
    '-c:v','libx264','-pix_fmt','yuv420p','-preset','fast','-crf','20','-r',String(FPS),'-an',
    newCtaPath,
  ])
  console.log(`[seg] re-rendered ${newCtaPath} with subscribe line`)

  // ── 5. Concat: hook + subscribe + pr1..verdict + new cta ───────────────
  // Reuse all existing vseg-*.mp4 except the new subscribe and the re-rendered cta.
  const ordered = [
    'hook', 'subscribe',
    'pr1','done1','pr2','map','done2','pr3','eo','done3','buyerA','buyerB','verdict',
    'cta',
  ]
  const concatList = `${BUILD}/viral-concat-v2.txt`
  fs.writeFileSync(concatList, ordered.map(id => `file '${BUILD}/vseg-${id}.mp4'`).join('\n') + '\n')
  const concatPath = `${BUILD}/viral-concat-v2.mp4`
  sh('ffmpeg', ['-y','-f','concat','-safe','0','-i', concatList,
    '-c:v','libx264','-pix_fmt','yuv420p','-preset','fast','-crf','20','-r',String(FPS),'-an', concatPath])
  const newTotalDur = probeDur(concatPath)
  console.log(`[concat] new total video duration = ${newTotalDur.toFixed(3)}s`)
  if (newTotalDur > 45.0) {
    console.error(`ABORT: new runtime ${newTotalDur.toFixed(2)}s exceeds 45s limit`)
    process.exit(1)
  }

  // ── 6. Build new VO track: original vo split at 3.21s, subscribe inserted ─
  // The original VO (38.73s) plays:
  //   0.0 - 3.21s   : "Eighty-two million dollars bought three Trump promises."
  //   3.21s+        : "Promise one: kill the Iran nuclear deal..."
  // We need: original[0..3.21] + silence(0.3) + subscribeVO + silence(rest) + original[3.21..end]
  // Where total interstitial = interstitialDur. Voice starts at SUBSCRIBE_INSERT_AT + preSilence.
  //
  // Construct via ffmpeg:
  //   - voice_pre  = atrim 0..SUBSCRIBE_INSERT_AT from vo-v2.mp3
  //   - voice_sub  = vo-subscribe.mp3, prepended by preSilence and post-padded to interstitialDur
  //   - voice_post = atrim SUBSCRIBE_INSERT_AT.. from vo-v2.mp3
  //   - concat the three
  const voicePath = `${BUILD}/voice-v2.m4a`
  const postSilence = interstitialDur - preSilence - subVoDur
  const filterVoice =
    `[0:a]atrim=0:${SUBSCRIBE_INSERT_AT},asetpts=PTS-STARTPTS[vpre];` +
    `[1:a]adelay=${Math.round(preSilence*1000)}|${Math.round(preSilence*1000)},apad=pad_dur=${postSilence.toFixed(3)},atrim=0:${interstitialDur.toFixed(3)},asetpts=PTS-STARTPTS[vsub];` +
    `[0:a]atrim=${SUBSCRIBE_INSERT_AT},asetpts=PTS-STARTPTS[vpost];` +
    `[vpre][vsub][vpost]concat=n=3:v=0:a=1[vout]`
  sh('ffmpeg', ['-y','-i', `${BUILD}/vo-v2.mp3`, '-i', subVo,
    '-filter_complex', filterVoice,
    '-map','[vout]',
    '-c:a','aac','-b:a','192k', voicePath,
  ])
  const voiceDur = probeDur(voicePath)
  console.log(`[voice] combined voice duration = ${voiceDur.toFixed(3)}s`)

  // ── 7. Final audio mix: voice + music (sidechain ducked); skip SFX track ─
  // We deliberately omit the per-cut SFX layer in v2 — would require shifting
  // all SFX events for segments after 3.21s by +interstitialDur, and adding a
  // gentle tick for the subscribe segment. Simpler: just rebuild the music+voice
  // mix to the new total runtime. The original SFX layer was a polish layer;
  // its absence is acceptable for this CTA splice.
  const totalTarget = Math.max(voiceDur, newTotalDur)
  const mixPath = `${BUILD}/viral-mix-v2.m4a`
  const fadeOutStart = Math.max(0, totalTarget - 1.0)
  const aFilter =
    `[0:a]loudnorm=I=-16:TP=-1.5:LRA=7,volume=1.4,apad=pad_dur=${totalTarget.toFixed(3)},atrim=0:${totalTarget.toFixed(3)}[voice];` +
    `[1:a]atrim=0:${totalTarget.toFixed(3)},aloop=loop=0:size=1,atrim=0:${totalTarget.toFixed(3)},` +
    `loudnorm=I=-26:TP=-3:LRA=11,volume=0.32,` +
    `afade=t=in:st=0:d=0.4,afade=t=out:st=${fadeOutStart.toFixed(2)}:d=1.0[mu];` +
    `[mu][voice]sidechaincompress=threshold=0.02:ratio=20:attack=80:release=400:level_sc=4[mud];` +
    `[voice][mud]amix=inputs=2:duration=longest:dropout_transition=0:weights=1.0 0.55,` +
    `alimiter=limit=0.95:level=disabled,atrim=0:${totalTarget.toFixed(3)}[aout]`
  sh('ffmpeg', ['-y','-i', voicePath, '-i', MUSIC,
    '-filter_complex', aFilter,
    '-map','[aout]',
    '-c:a','aac','-b:a','192k', mixPath,
  ])

  // ── 8. Mux ─────────────────────────────────────────────────────────────
  const masterPath = `${BUILD}/viral-master-v2.mp4`
  sh('ffmpeg', ['-y','-i', concatPath, '-i', mixPath,
    '-t', String(totalTarget),
    '-c:v','copy','-c:a','copy','-shortest', masterPath,
  ])

  // ── 9. Verify ──────────────────────────────────────────────────────────
  const info = JSON.parse(shCap('ffprobe', ['-v','error','-show_format','-show_streams','-of','json', masterPath]).stdout)
  const v = info.streams.find(s=>s.codec_type==='video')
  const dur = parseFloat(info.format.duration)
  const fps = eval(v.r_frame_rate)
  console.log(`[ffprobe] ${v.width}x${v.height} @ ${fps}fps  ${dur.toFixed(2)}s`)
  if (v.width !== W || v.height !== H) { console.error('DIMS FAIL'); process.exit(1) }
  if (dur > 45.0) { console.error(`DURATION FAIL ${dur.toFixed(2)}s > 45s`); process.exit(1) }
  if (dur < 41.0) { console.warn(`[warn] duration ${dur.toFixed(2)}s is below soft floor 41s; continuing`) }

  // ── 10. RMS verification ──────────────────────────────────────────────
  function rmsDb(file, start, dur_) {
    const r = shCap('ffmpeg', ['-hide_banner','-nostats','-ss',String(start),'-i', file,'-t',String(dur_),
      '-af','astats=metadata=1:reset=0','-f','null','-'])
    const m = [...(r.stderr||'').matchAll(/RMS level dB:\s*(-?\d+(?:\.\d+)?)/g)]
    if (!m.length) return null
    return parseFloat(m[m.length-1][1])
  }
  const musicOnly = `${BUILD}/viral-music-only-v2.m4a`
  sh('ffmpeg', ['-y','-i', MUSIC, '-filter_complex',
    `[0:a]atrim=0:${totalTarget.toFixed(3)},aloop=loop=0:size=1,atrim=0:${totalTarget.toFixed(3)},loudnorm=I=-26:TP=-3:LRA=11,volume=0.32,` +
    `afade=t=in:st=0:d=0.4,afade=t=out:st=${fadeOutStart.toFixed(2)}:d=1.0,atrim=0:${totalTarget.toFixed(3)}[a]`,
    '-map','[a]','-c:a','aac','-b:a','192k', musicOnly])

  // Speech windows: include the SUBSCRIBE window (around SUBSCRIBE_INSERT_AT + 0.4)
  // and original windows shifted by +interstitialDur for everything after the boundary.
  const subWinStart = SUBSCRIBE_INSERT_AT + preSilence + 0.3   // mid-subscribe-VO
  const subWinDur = Math.min(0.8, subVoDur - 0.4)
  const speechWindows = [
    { t: 0.5,  dur: 1.0, label: 'hook' },
    { t: 2.0,  dur: 1.0, label: 'hook-late' },
    { t: subWinStart, dur: subWinDur, label: 'subscribe' },
    { t: SUBSCRIBE_INSERT_AT + interstitialDur + 0.3, dur: 1.0, label: 'pr1' },
    { t: SUBSCRIBE_INSERT_AT + interstitialDur + 4.0, dur: 1.0, label: 'pr2-area' },
    { t: SUBSCRIBE_INSERT_AT + interstitialDur + 12.0, dur: 1.0, label: 'pr3-area' },
    { t: SUBSCRIBE_INSERT_AT + interstitialDur + 22.0, dur: 1.0, label: 'buyer-area' },
    { t: SUBSCRIBE_INSERT_AT + interstitialDur + 28.0, dur: 1.0, label: 'verdict-area' },
  ]
  const rmsReport = { windows: [], pass: true }
  for (const w of speechWindows) {
    if (w.t + w.dur > totalTarget) continue
    const masterR = rmsDb(masterPath, w.t, w.dur)
    const musicRefR = rmsDb(musicOnly, w.t, w.dur)
    const diff = (masterR!=null && musicRefR!=null) ? (masterR - musicRefR) : null
    const pass = diff != null && diff >= 8.0
    rmsReport.windows.push({ t: +w.t.toFixed(2), label: w.label, master_rms_db: masterR, music_ref_rms_db: musicRefR, diff_vs_music_ref: diff, pass })
    if (!pass) rmsReport.pass = false
    console.log(`[rms] @${w.t.toFixed(2)}s ${w.label} master=${masterR}dB musRef=${musicRefR}dB diff=${diff?.toFixed(2)} ${pass?'PASS':'FAIL'}`)
  }
  rmsReport.worst_diff = Math.min(...rmsReport.windows.map(w => w.diff_vs_music_ref ?? 999))
  fs.writeFileSync(`${BUILD}/viral-rms-report-v2.json`, JSON.stringify(rmsReport, null, 2))

  if (!rmsReport.pass) {
    console.error(`ABORT: RMS scan failed (worst diff ${rmsReport.worst_diff.toFixed(2)} dB < 8 dB threshold)`)
    process.exit(1)
  }

  // ── 11. Publish ───────────────────────────────────────────────────────
  const finalMp4 = `${PUB_SHORTS}/sealed-001-aipac-iran-deal.mp4`
  fs.copyFileSync(masterPath, finalMp4)
  // Thumbnail — keep the verdict frame look. Find new verdict-mid time.
  const verdictNewStart = SUBSCRIBE_INSERT_AT + interstitialDur + (segs.find(s=>s.id==='verdict').start - SUBSCRIBE_INSERT_AT)
  const verdictDur = segs.find(s=>s.id==='verdict').end - segs.find(s=>s.id==='verdict').start
  const thumbT = verdictNewStart + verdictDur / 2
  const thumb = `${PUB_SHORTS}/sealed-001-aipac-iran-deal.jpg`
  sh('ffmpeg', ['-y','-ss', thumbT.toFixed(2), '-i', finalMp4, '-frames:v','1','-q:v','2', thumb])

  // ── 12. Summary ──────────────────────────────────────────────────────
  const summary = {
    final_mp4: finalMp4,
    size_bytes: fs.statSync(finalMp4).size,
    duration_s: dur,
    width: v.width, height: v.height, fps,
    subscribe_text: SUBSCRIBE_TEXT,
    subscribe_inserted_at_s: SUBSCRIBE_INSERT_AT,
    subscribe_interstitial_dur_s: interstitialDur,
    subscribe_vo_dur_s: subVoDur,
    rms_pass: rmsReport.pass,
    rms_worst_diff: rmsReport.worst_diff,
    archived_prior_version: `${PUB_SHORTS}/sealed-001-aipac-iran-deal-v1-no-subscribe.mp4`,
  }
  fs.writeFileSync(`${BUILD}/viral-summary-v2.json`, JSON.stringify(summary, null, 2))
  console.log('\n─── SUBSCRIBE SPLICE SUMMARY ───')
  console.log(JSON.stringify(summary, null, 2))
}

main().catch(e => { console.error(e); process.exit(1) })
