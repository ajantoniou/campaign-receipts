#!/usr/bin/env node
//
// scripts/longform/produce-cr-weekly.mjs — the weekly Campaign Receipts long-form
// video. Data-driven adaptation of produce-explainer.mjs (the proven SEALED renderer):
// same SVG→ffmpeg engine, VO-driven scene timing, pro audio mix + RMS verification,
// subscribe overlay, thumbnail — but scenes are GENERATED from the week's audio
// briefing script + receipt figures, in CR branding, with optional Veo hero shots.
//
// Input:  content/audio/<WEEK>/briefing.md   (the **VO:** scene script the audio
//         briefing already produced — reused verbatim, so video == audio narration)
// Output: scripts/longform/_build/<WEEK>/master.mp4 + thumb.jpg + summary.json
//
// Usage:
//   node scripts/longform/produce-cr-weekly.mjs --week-of=YYYY-MM-DD [--skip-tts] [--no-veo] [--max-veo=2]
//
// Env: ELEVENLABS_API_KEY (TTS), GEMINI_API_KEY (Veo, optional), CR_LONGFORM_VOICE_ID
//      (optional), CR_MUSIC_PATH (optional — if unset/missing, ships voice-only).
//
// Binaries: rsvg-convert, ffmpeg, ffprobe (present locally + in the Docker render image).

import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..', '..')           // repo root (standalone checkout)
const W = 1920, H = 1080, FPS = 30
const PAD = 0.35

const args = process.argv.slice(2)
const getArg = (k, d = null) => args.find((a) => a.startsWith(`--${k}=`))?.split('=')[1] ?? d
const SKIP_TTS = args.includes('--skip-tts')
const NO_VEO = args.includes('--no-veo')
const MAX_VEO = Number(getArg('max-veo', 2))

function isoMonday(d = new Date()) {
  const x = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
  x.setUTCDate(x.getUTCDate() - ((x.getUTCDay() + 6) % 7))
  return x.toISOString().slice(0, 10)
}
const WEEK = getArg('week-of', isoMonday())
const BUILD = path.join(ROOT, 'scripts', 'longform', '_build', WEEK)
const SCRIPT_MD = path.join(ROOT, 'content', 'audio', WEEK, 'briefing.md')
const COST_LOG = path.join(ROOT, 'scripts', '.external-costs.jsonl')
const MUSIC = process.env.CR_MUSIC_PATH && fs.existsSync(process.env.CR_MUSIC_PATH) ? process.env.CR_MUSIC_PATH : null

// ── env (repo-root .env + os.environ) ───────────────────────────────────────
function loadEnv() {
  const env = { ...process.env }
  const p = path.join(ROOT, '.env')
  if (fs.existsSync(p)) for (const ln of fs.readFileSync(p, 'utf8').split('\n')) {
    const m = ln.match(/^([A-Z0-9_]+)=(.*)$/); if (m && !env[m[1]]) env[m[1]] = m[2].replace(/^["']|["']$/g, '')
  }
  return env
}
const env = loadEnv()

// ── shell helpers (from produce-explainer.mjs) ──────────────────────────────
function sh(cmd, a) { const r = spawnSync(cmd, a, { stdio: 'inherit' }); if (r.status !== 0) { console.error(`FAIL: ${cmd}`); process.exit(r.status || 1) } }
function shCap(cmd, a) { const r = spawnSync(cmd, a, { encoding: 'utf8' }); return { stdout: r.stdout || '', stderr: r.stderr || '', status: r.status } }
function probeDur(f) { return parseFloat(shCap('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=nw=1:nk=1', f]).stdout.trim()) }
function logCost(vendor, usd, note) { fs.mkdirSync(path.dirname(COST_LOG), { recursive: true }); fs.appendFileSync(COST_LOG, JSON.stringify({ ts: new Date().toISOString(), piece: `cr-weekly-${WEEK}`, vendor, cost_usd: +usd.toFixed(4), note }) + '\n') }
function xml(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;') }
function svgToPng(svg, png, w, h) { const p = png.replace(/\.png$/, '.svg'); fs.writeFileSync(p, svg); sh('rsvg-convert', ['-w', String(w), '-h', String(h), p, '-o', png]) }

// ── CR brand palette (agent-companies-design: parchment / navy / civic-red) ──
const C = { paper: 'rgb(244,239,230)', paper2: 'rgb(235,227,208)', ink: '#16263D', muted: '#6E7891', red: '#B23A3A', green: '#2E7D55', gold: '#C8861D' }

// ── VO + scene parsing from briefing.md ─────────────────────────────────────
// Storyteller format: "## Scene N — <label>" then "**VO:** <tight>" and
// "**VO_LONG:** <fuller>". The VIDEO narration uses VO_LONG (~30-40s/story, ~4-min video); the
// burned CAPTION uses the tight VO (keeps captions short → no overlap). The audio
// briefing (build-audio-briefing.mjs) separately reads only **VO:** for its <3-min cut.
const unquote = (s) => { let v = s.trim(); if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1).trim(); return v }
function parseScenes(md) {
  const lines = md.split('\n'); const scenes = []; let header = null; let cur = null
  const flush = () => { if (cur && (cur.long || cur.short)) scenes.push({ label: cur.label, vo: cur.long || cur.short, caption: cur.short || cur.long }); cur = null }
  for (const ln of lines) {
    const hm = ln.match(/^##\s+Scene\s+\d+\s*[—–-]\s*(.+?)\s*$/i)
    if (hm) { flush(); header = hm[1].trim(); cur = { label: header, short: '', long: '' }; continue }
    const lm = ln.match(/^\*\*VO_LONG:\*\*\s*(.+)$/i)
    if (lm) { if (!cur) cur = { label: header || 'Receipt', short: '', long: '' }; cur.long = unquote(lm[1]); continue }
    const vm = ln.match(/^\*\*VO:\*\*\s*(.+)$/)
    if (vm) { if (!cur) cur = { label: header || 'Receipt', short: '', long: '' }; cur.short = unquote(vm[1]); continue }
  }
  flush()
  return scenes
}

// First dollar figure mentioned in a VO line, for the on-card stat (spoken form OK).
function pullFigure(vo) {
  const m = vo.match(/(\$?\s?[\d.,]+\s?(?:billion|million|thousand|hundred)?\s?dollars?)|(\$[\d.,]+\s?[MBK]?)/i)
  return m ? m[0].replace(/\s+/g, ' ').trim() : null
}
// Shorten a label/headline to fit the card.
const clamp = (s, n) => (s.length > n ? s.slice(0, n - 1).trimEnd() + '…' : s)

// ── TTS (reuse SEALED Sarah cadence; CR voice override via env) ─────────────
async function synthesizeVo(voText, outPath) {
  const apiKey = env.ELEVENLABS_API_KEY || env.CR_ELEVENLABS_API_KEY || env.NT_ELEVENLABS_API_KEY
  if (!apiKey) { console.error('No ELEVENLABS_API_KEY'); process.exit(1) }
  const voiceId = env.CR_LONGFORM_VOICE_ID || env.CR_ELEVENLABS_SARAH_VOICE_ID || 'EXAVITQu4vr4xnSDxMaL'
  const body = { text: voText, model_id: 'eleven_multilingual_v2', voice_settings: { stability: 0.55, similarity_boost: 0.75, style: 0.20, use_speaker_boost: true } }
  const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, { method: 'POST', headers: { 'xi-api-key': apiKey, 'Content-Type': 'application/json', Accept: 'audio/mpeg' }, body: JSON.stringify(body) })
  if (!r.ok) { console.error(`ElevenLabs HTTP ${r.status}: ${(await r.text()).slice(0, 300)}`); process.exit(1) }
  fs.writeFileSync(outPath, Buffer.from(await r.arrayBuffer()))
  logCost('elevenlabs', voText.length / 1000 * 0.30, `chars=${voText.length}`)
}

// ── overlays ────────────────────────────────────────────────────────────────
function persistentBarSvg() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect x="0" y="${H - 100}" width="${W}" height="100" fill="${C.paper}" opacity="0.94"/>
  <rect x="0" y="${H - 100}" width="${W}" height="3" fill="${C.red}"/>
  <text x="60" y="${H - 40}" font-family="Menlo, Monaco, monospace" font-weight="700" font-size="34" fill="${C.red}" letter-spacing="6">CAMPAIGNRECEIPTS.COM</text>
  <text x="${W - 60}" y="${H - 40}" text-anchor="end" font-family="Georgia, serif" font-style="italic" font-size="26" fill="${C.muted}">follow the money — sourced to FEC filings</text>
</svg>`
}
function subscribeBellSvg() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="620" height="120" viewBox="0 0 620 120">
  <rect x="0" y="0" width="620" height="120" rx="14" fill="${C.ink}" opacity="0.95"/>
  <rect x="0" y="0" width="620" height="120" rx="14" fill="none" stroke="${C.gold}" stroke-width="3"/>
  <g transform="translate(50, 60)"><path d="M -22 -18 Q -22 -36 0 -36 Q 22 -36 22 -18 L 22 8 L 30 18 L -30 18 L -22 8 Z" fill="${C.gold}"/><circle cx="0" cy="26" r="6" fill="${C.gold}"/></g>
  <text x="100" y="50" font-family="Helvetica, sans-serif" font-weight="900" font-size="30" fill="#fff" letter-spacing="3">SUBSCRIBE</text>
  <text x="100" y="90" font-family="Helvetica, sans-serif" font-weight="500" font-size="21" fill="${C.gold}">$9 newsletter — link in description</text>
</svg>`
}

// ── open captions: a lower-third caption strip PNG per scene (this ffmpeg has no
// drawtext/libass, so captions are rendered as SVG→PNG and overlaid, same as cards).
// Word-wrap the VO to ~46 chars/line, max 3 lines (clamp), sit above the bottom bar.
function wrapLines(text, perLine = 46, maxLines = 3) {
  const words = String(text).split(/\s+/); const lines = []; let cur = ''
  for (const w of words) { if ((cur + ' ' + w).trim().length > perLine) { lines.push(cur.trim()); cur = w } else cur += ' ' + w }
  if (cur.trim()) lines.push(cur.trim())
  if (lines.length > maxLines) { lines.length = maxLines; lines[maxLines - 1] = lines[maxLines - 1].replace(/\W*$/, '') + '…' }
  return lines
}
function captionPngSvg(text) {
  const lines = wrapLines(text)
  const lh = 56, boxH = lines.length * lh + 44, boxY = H - 100 - boxH - 18 // above the persistent bar
  const tspans = lines.map((ln, i) => `<text x="${W / 2}" y="${boxY + 56 + i * lh}" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-weight="700" font-size="42" fill="#ffffff">${xml(ln)}</text>`).join('')
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect x="${W / 2 - 880}" y="${boxY}" width="1760" height="${boxH}" rx="14" fill="#0a0a0a" opacity="0.62"/>
  ${tspans}
</svg>`
}

// ── outro scene: full-screen SUBSCRIBE + LIKE + newsletter CTA card ─────────
function outroSvg() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="${C.ink}"/>
  <rect x="0" y="0" width="${W}" height="10" fill="${C.red}"/>
  <text x="${W / 2}" y="280" text-anchor="middle" font-family="Helvetica, sans-serif" font-weight="900" font-size="110" fill="#fff" letter-spacing="2">FOLLOW THE MONEY</text>
  <text x="${W / 2}" y="380" text-anchor="middle" font-family="Georgia, serif" font-style="italic" font-size="44" fill="${C.gold}">new receipts every Friday</text>
  <g transform="translate(${W / 2 - 360}, 520)">
    <rect x="0" y="0" width="320" height="120" rx="60" fill="${C.red}"/>
    <text x="160" y="78" text-anchor="middle" font-family="Helvetica, sans-serif" font-weight="900" font-size="46" fill="#fff" letter-spacing="2">SUBSCRIBE</text>
  </g>
  <g transform="translate(${W / 2 + 40}, 520)">
    <rect x="0" y="0" width="320" height="120" rx="60" fill="none" stroke="${C.gold}" stroke-width="4"/>
    <text x="160" y="78" text-anchor="middle" font-family="Helvetica, sans-serif" font-weight="900" font-size="46" fill="${C.gold}" letter-spacing="3">👍 LIKE</text>
  </g>
  <text x="${W / 2}" y="800" text-anchor="middle" font-family="Helvetica, sans-serif" font-weight="800" font-size="52" fill="#fff">Get the $9 weekly newsletter</text>
  <text x="${W / 2}" y="870" text-anchor="middle" font-family="Menlo, monospace" font-weight="700" font-size="60" fill="${C.gold}" letter-spacing="4">CAMPAIGNRECEIPTS.COM</text>
  <text x="${W / 2}" y="980" text-anchor="middle" font-family="Georgia, serif" font-style="italic" font-size="30" fill="${C.muted}">Sourced to public FEC filings. Timing does not prove causation.</text>
</svg>`
}

// ── data-driven scene card (replaces hand-coded svgScene1..10) ──────────────
// hasPortrait: reserve the right ~560px for the portrait overlay → shrink the big
// figure + headline width so text never runs under the photo (fixes overlap).
function sceneCardSvg(scene, idx, total, hasPortrait) {
  const eyebrow = clamp((scene.label || 'Receipt').toUpperCase(), hasPortrait ? 28 : 38)
  const fig = scene.figure
  const headline = clamp(scene.headline || scene.label || 'Follow the money', hasPortrait ? 44 : 64)
  const figSize = hasPortrait ? 150 : 200
  const headSize = headline.length > 40 ? (hasPortrait ? 46 : 58) : (hasPortrait ? 56 : 70)
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="${C.paper}"/>
  <rect x="0" y="0" width="${W}" height="8" fill="${C.red}"/>
  <text x="120" y="180" font-family="Menlo, Monaco, monospace" font-weight="700" font-size="34" fill="${C.red}" letter-spacing="8">${xml(eyebrow)}</text>
  <text x="120" y="220" font-family="Menlo, monospace" font-size="22" fill="${C.muted}" letter-spacing="2">CAMPAIGN RECEIPTS · ${xml(String(idx + 1))} of ${xml(String(total))}</text>
  ${fig ? `<text x="120" y="500" font-family="Helvetica, sans-serif" font-weight="900" font-size="${figSize}" fill="${C.ink}" letter-spacing="-2">${xml(fig)}</text>` : ''}
  <text x="120" y="${fig ? 650 : 470}" font-family="Georgia, serif" font-size="${headSize}" fill="${C.ink}">${xml(headline)}</text>
  <rect x="120" y="${H - 220}" width="${(hasPortrait ? 1150 : W - 120) - 120}" height="2" fill="${C.paper2}"/>
  <text x="120" y="${H - 170}" font-family="Georgia, serif" font-style="italic" font-size="28" fill="${C.muted}">Campaign contributions are legal and disclosed.</text>
</svg>`
}

async function main() {
  if (!fs.existsSync(SCRIPT_MD)) { console.error(`No briefing script: ${SCRIPT_MD}\nRun build-audio-briefing.mjs --week-of=${WEEK} first.`); process.exit(1) }
  fs.mkdirSync(BUILD, { recursive: true })
  const scenes = parseScenes(fs.readFileSync(SCRIPT_MD, 'utf8'))
  if (scenes.length < 3) { console.error(`Only ${scenes.length} scenes parsed — need ≥3.`); process.exit(1) }
  scenes.forEach((s) => { s.figure = pullFigure(s.caption || s.vo); s.headline = s.label })
  const N = scenes.length
  console.log(`[script] ${N} scenes from ${path.relative(ROOT, SCRIPT_MD)}`)

  // Politician portraits (scene-aligned sidecar from build-audio-briefing.mjs).
  // Download each official bioguide photo to a framed PNG; overlaid on the card.
  const portDir = path.join(BUILD, 'portraits'); fs.mkdirSync(portDir, { recursive: true })
  const portraitsPath = path.join(ROOT, 'content', 'audio', WEEK, 'portraits.json')
  let portraitList = []
  if (fs.existsSync(portraitsPath)) { try { portraitList = JSON.parse(fs.readFileSync(portraitsPath, 'utf8')).filter(Boolean) } catch { portraitList = [] } }
  // The storyteller reorders scenes freely, so align portraits to scenes BY NAME
  // (last name appearing in the scene label/caption), not by index.
  const lastName = (full) => String(full || '').trim().split(/\s+/).pop().toLowerCase().replace(/[^a-z]/g, '')
  const matchPortrait = (scene) => {
    const hay = `${scene.label} ${scene.caption || ''} ${scene.vo || ''}`.toLowerCase()
    return portraitList.find((p) => p.name && hay.includes(lastName(p.name))) || null
  }
  const portraits = scenes.map(matchPortrait)
  // Download → must be a real image. bioguide.congress.gov blocks direct fetches
  // (returns HTML), so fall back to Wikipedia's page image by politician name.
  async function fetchImage(url, dest) {
    try {
      const res = await fetch(url, { headers: { 'User-Agent': 'CampaignReceipts/1.0 (contact@campaignreceipts.com)' } })
      if (!res.ok) return false
      if (!/^image\//.test(res.headers.get('content-type') || '')) return false
      const buf = Buffer.from(await res.arrayBuffer())
      if (buf.length < 3000) return false
      fs.writeFileSync(dest, buf); return true
    } catch { return false }
  }
  async function wikipediaImage(name) {
    try {
      const u = `https://en.wikipedia.org/w/api.php?action=query&prop=pageimages&format=json&piprop=original&titles=${encodeURIComponent(name)}&redirects=1`
      const r = await fetch(u, { headers: { 'User-Agent': 'CampaignReceipts/1.0 (contact@campaignreceipts.com)' } })
      const j = await r.json()
      const pages = j?.query?.pages || {}
      for (const k of Object.keys(pages)) { const src = pages[k]?.original?.source; if (src) return src }
    } catch { /* none */ }
    return null
  }
  const portraitPng = {}
  for (let i = 0; i < N; i++) {
    const p = portraits[i]
    if (!p?.photo_url && !p?.name) continue
    const raw = path.join(portDir, `p-${i + 1}.jpg`)
    let got = p.photo_url ? await fetchImage(p.photo_url, raw) : false
    if (!got && p.name) { const wiki = await wikipediaImage(p.name); if (wiki) got = await fetchImage(wiki, raw) }
    if (!got) { console.log(`[portrait] scene ${i + 1}: no usable image for ${p.name || '?'}`); continue }
    // Frame it: 520x650 cover, navy border + civic-red top rule.
    const framed = path.join(portDir, `p-${i + 1}.png`)
    sh('ffmpeg', ['-y', '-i', raw, '-vf', `scale=520:650:force_original_aspect_ratio=increase,crop=520:650,pad=540:678:10:22:color=0x16263D,drawbox=x=0:y=0:w=540:h=10:color=0xB23A3A:t=fill`, '-frames:v', '1', framed])
    if (fs.existsSync(framed)) { portraitPng[i] = framed; console.log(`[portrait] scene ${i + 1}: ${p.name}`) }
  }

  // 1) Per-scene TTS
  const voDir = path.join(BUILD, 'vo'); fs.mkdirSync(voDir, { recursive: true })
  const scenePaths = scenes.map((_, i) => path.join(voDir, `scene-${String(i + 1).padStart(2, '0')}.mp3`))
  for (let i = 0; i < N; i++) {
    if (SKIP_TTS && fs.existsSync(scenePaths[i])) { console.log(`[tts] reuse scene ${i + 1}`); continue }
    await synthesizeVo(scenes[i].vo, scenePaths[i]); console.log(`[tts] scene ${i + 1} (${scenes[i].vo.length} ch)`)
  }
  const sceneDurs = scenePaths.map(probeDur)
  const holds = sceneDurs.map((d) => d + PAD)
  const totalDur = holds.reduce((a, b) => a + b, 0)
  console.log(`[plan] runtime ≈ ${totalDur.toFixed(1)}s across ${N} scenes`)

  // 2) Optional Veo hero clips for the first MAX_VEO scenes (cold-open + one mid).
  const heroIdx = NO_VEO ? [] : [0, Math.floor(N / 2)].slice(0, MAX_VEO).filter((v, i, a) => a.indexOf(v) === i)
  const heroClip = {}
  for (const i of heroIdx) {
    const out = path.join(BUILD, `hero-${i + 1}.mp4`)
    const prompt = `Cinematic documentary b-roll, no text no people: ${scenes[i].label}. US Capitol / government archive aesthetic, warm film grain, slow camera move.`
    const r = spawnSync('node', [path.join(ROOT, 'scripts', 'pipeline', 'veo-generate.mjs'), '--prompt', prompt, '--out', out, '--aspect', '16:9'], { stdio: 'inherit', env: process.env })
    if (r.status === 0 && fs.existsSync(out)) { heroClip[i] = out; logCost('veo', 0.40, `hero scene ${i + 1}`); console.log(`[veo] hero ${i + 1} ok`) }
    else console.log(`[veo] hero ${i + 1} failed — falling back to motion-graphic card`)
  }

  // 3) Cards + overlays → PNG
  const cardsDir = path.join(BUILD, 'cards'); fs.mkdirSync(cardsDir, { recursive: true })
  const persistPng = path.join(cardsDir, 'bar.png'); svgToPng(persistentBarSvg(), persistPng, W, H)
  const bellPng = path.join(cardsDir, 'bell.png'); svgToPng(subscribeBellSvg(), bellPng, 620, 120)
  const cardPng = (i) => path.join(cardsDir, `scene-${String(i + 1).padStart(2, '0')}.png`)
  const capPng = (i) => path.join(cardsDir, `cap-${String(i + 1).padStart(2, '0')}.png`)
  for (let i = 0; i < N; i++) {
    svgToPng(sceneCardSvg(scenes[i], i, N, !!portraitPng[i]), cardPng(i), W, H)
    svgToPng(captionPngSvg(scenes[i].caption || scenes[i].vo), capPng(i), W, H) // tight caption (burned-in, short → no overlap)
  }
  const outroPng = path.join(cardsDir, 'outro.png'); svgToPng(outroSvg(), outroPng, W, H)
  const OUTRO_DUR = 5

  // 4) Per-scene motion clip (ken-burns on card, or Veo hero scaled + card lower-third bar)
  const clipsDir = path.join(BUILD, 'clips'); fs.mkdirSync(clipsDir, { recursive: true })
  const clip = (i) => path.join(clipsDir, `scene-${String(i + 1).padStart(2, '0')}.mp4`)
  for (let i = 0; i < N; i++) {
    const dur = holds[i], frames = Math.max(2, Math.round(dur * FPS)), perFrame = 0.08 / frames
    // 3 inputs: base (hero or card), persistent bar, caption strip. Overlay bar then caption.
    if (heroClip[i]) {
      sh('ffmpeg', ['-y', '-stream_loop', '-1', '-i', heroClip[i], '-loop', '1', '-t', String(dur), '-i', persistPng, '-loop', '1', '-t', String(dur), '-i', capPng(i),
        '-filter_complex', `[0:v]scale=${W}:${H}:force_original_aspect_ratio=increase,crop=${W}:${H},trim=duration=${dur},setpts=PTS-STARTPTS,format=yuv420p[bg];[bg][1:v]overlay=0:0[b];[b][2:v]overlay=0:0:format=auto[vout]`,
        '-map', '[vout]', '-r', String(FPS), '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-preset', 'fast', '-crf', '20', '-an', '-t', String(dur), clip(i)])
    } else {
      const z = (i % 2 === 0)
        ? `zoompan=z='1.0+on*${perFrame.toFixed(6)}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${frames}:s=${W}x${H}:fps=${FPS}`
        : `zoompan=z='1.08-on*${perFrame.toFixed(6)}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${frames}:s=${W}x${H}:fps=${FPS}`
      const inputs = ['-framerate', String(FPS), '-loop', '1', '-t', String(dur), '-i', cardPng(i), '-loop', '1', '-t', String(dur), '-i', persistPng, '-loop', '1', '-t', String(dur), '-i', capPng(i)]
      // base card → ken-burns; overlay persistent bar [1], caption [2], and (if present) the portrait [3] at top-right.
      let fc = `[0:v]scale=${W * 2}:${H * 2}:force_original_aspect_ratio=increase,crop=${W * 2}:${H * 2},${z},trim=duration=${dur},setpts=PTS-STARTPTS,format=yuv420p[bg];[bg][1:v]overlay=0:0[b];[b][2:v]overlay=0:0:format=auto`
      if (portraitPng[i]) {
        inputs.push('-loop', '1', '-t', String(dur), '-i', portraitPng[i])
        fc += `[c];[c][3:v]overlay=${W - 600}:200:format=auto[vout]`
      } else {
        fc += `[vout]`
      }
      sh('ffmpeg', ['-y', ...inputs, '-filter_complex', fc,
        '-map', '[vout]', '-r', String(FPS), '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-preset', 'fast', '-crf', '20', '-an', clip(i)])
    }
    console.log(`[clip] scene ${i + 1} ${dur.toFixed(1)}s${heroClip[i] ? ' (veo)' : portraitPng[i] ? ' +portrait' : ''} +caption`)
  }

  // 4b) Outro clip (static subscribe/like/newsletter card, OUTRO_DUR seconds).
  const outroClip = path.join(clipsDir, 'outro.mp4')
  sh('ffmpeg', ['-y', '-framerate', String(FPS), '-loop', '1', '-t', String(OUTRO_DUR), '-i', outroPng,
    '-filter_complex', `[0:v]scale=${W}:${H},format=yuv420p[vout]`,
    '-map', '[vout]', '-r', String(FPS), '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-preset', 'fast', '-crf', '20', '-an', outroClip])

  // 5) Concat (scenes + outro)
  const concatList = path.join(BUILD, 'concat.txt')
  fs.writeFileSync(concatList, scenes.map((_, i) => `file '${clip(i)}'`).join('\n') + `\nfile '${outroClip}'\n`)
  const concatPath = path.join(BUILD, 'visual-concat.mp4')
  sh('ffmpeg', ['-y', '-f', 'concat', '-safe', '0', '-i', concatList, '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-preset', 'fast', '-crf', '20', '-r', String(FPS), '-an', concatPath])

  // 6) Subscribe-bell overlay at ~30% mark for 6s (or 8s in if short)
  const bellAt = Math.min(30, totalDur * 0.3)
  const visualPath = path.join(BUILD, 'visual.mp4')
  sh('ffmpeg', ['-y', '-i', concatPath, '-i', bellPng,
    '-filter_complex', `[0:v][1:v]overlay=${W - 660}:60:enable='between(t,${bellAt.toFixed(1)},${(bellAt + 6).toFixed(1)})'[vout]`,
    '-map', '[vout]', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-preset', 'fast', '-crf', '20', '-r', String(FPS), visualPath])

  // 7) VO track (per-scene apad → concat)
  const voPadDir = path.join(BUILD, 'vo-padded'); fs.mkdirSync(voPadDir, { recursive: true })
  const voPad = scenePaths.map((_, i) => path.join(voPadDir, `s${String(i + 1).padStart(2, '0')}.m4a`))
  for (let i = 0; i < N; i++) sh('ffmpeg', ['-y', '-i', scenePaths[i], '-af', `apad=pad_dur=${PAD},atrim=0:${holds[i]}`, '-c:a', 'aac', '-b:a', '192k', voPad[i]])
  const voList = path.join(BUILD, 'vo-concat.txt'); fs.writeFileSync(voList, voPad.map((p) => `file '${p}'`).join('\n') + '\n')
  const voFull = path.join(BUILD, 'vo-full.m4a')
  sh('ffmpeg', ['-y', '-f', 'concat', '-safe', '0', '-i', voList, '-c:a', 'aac', '-b:a', '192k', voFull])
  const voFullDur = probeDur(voFull)

  // 8) Audio: voice-only, or voice + ducked music if CR_MUSIC_PATH set.
  const mixPath = path.join(BUILD, 'mix.m4a')
  if (MUSIC) {
    const fadeOut = Math.max(0, voFullDur - 1.2)
    const aFilter =
      `[0:a]loudnorm=I=-16:TP=-1.5:LRA=7,volume=1.5,apad[voice];` +
      `[1:a]aloop=loop=-1:size=2e9,atrim=0:${voFullDur + 2},loudnorm=I=-22:TP=-3:LRA=11,volume=0.18,afade=t=in:st=0.5:d=0.6,afade=t=out:st=${fadeOut.toFixed(2)}:d=1.2[mu];` +
      `[mu][voice]sidechaincompress=threshold=0.03:ratio=20:attack=120:release=500:level_sc=4[mud];` +
      `[voice][mud]amix=inputs=2:duration=longest:dropout_transition=0:weights=1.4 0.5,alimiter=limit=0.95:level=disabled,atrim=0:${voFullDur}[aout]`
    sh('ffmpeg', ['-y', '-i', voFull, '-i', MUSIC, '-filter_complex', aFilter, '-map', '[aout]', '-c:a', 'aac', '-b:a', '192k', mixPath])
  } else {
    sh('ffmpeg', ['-y', '-i', voFull, '-af', 'loudnorm=I=-16:TP=-1.5:LRA=7', '-c:a', 'aac', '-b:a', '192k', mixPath])
  }

  // 8b) Pad the audio with OUTRO_DUR of silence so it spans the outro scene.
  const mixPadded = path.join(BUILD, 'mix-padded.m4a')
  sh('ffmpeg', ['-y', '-i', mixPath, '-af', `apad=pad_dur=${OUTRO_DUR}`, '-t', String(voFullDur + OUTRO_DUR), '-c:a', 'aac', '-b:a', '192k', mixPadded])
  const finalDur = voFullDur + OUTRO_DUR

  // 9) Mux → master (length = scenes + outro)
  const masterPath = path.join(BUILD, 'master.mp4')
  sh('ffmpeg', ['-y', '-i', visualPath, '-i', mixPadded, '-t', String(finalDur), '-c:v', 'copy', '-c:a', 'copy', '-shortest', masterPath])

  // 10) Verify
  const info = JSON.parse(shCap('ffprobe', ['-v', 'error', '-show_format', '-show_streams', '-of', 'json', masterPath]).stdout)
  const v = info.streams.find((s) => s.codec_type === 'video'), a = info.streams.find((s) => s.codec_type === 'audio')
  const dur = parseFloat(info.format.duration), sizeBytes = fs.statSync(masterPath).size
  console.log(`[ffprobe] ${v?.width}x${v?.height} ${dur.toFixed(1)}s v=${!!v} a=${!!a} ${(sizeBytes / 1e6).toFixed(1)}MB`)
  if (v.width !== W || v.height !== H) { console.error(`DIMS FAIL ${v.width}x${v.height}`); process.exit(1) }
  if (!a) { console.error('NO AUDIO'); process.exit(1) }
  if (dur < 60 || dur > 900) { console.error(`DURATION FAIL ${dur}s`); process.exit(1) }
  if (sizeBytes > 200 * 1024 * 1024) { console.error('SIZE FAIL >200MB'); process.exit(1) }

  // 11) Thumbnail: frame from the scene with the biggest figure (most marketable)
  const thumbIdx = scenes.reduce((best, s, i) => (s.figure && (!scenes[best].figure || s.figure.length > scenes[best].figure.length) ? i : best), 0)
  let tc = 0; for (let i = 0; i < thumbIdx; i++) tc += holds[i]; tc += holds[thumbIdx] / 2
  const thumb = path.join(BUILD, 'thumb.jpg')
  sh('ffmpeg', ['-y', '-ss', tc.toFixed(2), '-i', masterPath, '-frames:v', '1', '-q:v', '2', thumb])

  const summary = { week: WEEK, master: masterPath, thumb, duration_s: +dur.toFixed(2), width: v.width, height: v.height, scenes: N, veo_heroes: Object.keys(heroClip).length, music: !!MUSIC, size_mb: +(sizeBytes / 1e6).toFixed(2) }
  fs.writeFileSync(path.join(BUILD, 'summary.json'), JSON.stringify(summary, null, 2))
  console.log('\n─── SUMMARY ───\n' + JSON.stringify(summary, null, 2))
  console.log(`\nDONE: ${masterPath}`)
}

main().catch((e) => { console.error('FATAL:', e); process.exit(1) })
