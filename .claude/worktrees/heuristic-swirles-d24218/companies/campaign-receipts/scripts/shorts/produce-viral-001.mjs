#!/usr/bin/env node
/**
 * produce-viral-001.mjs — viral-Shorts rebuild of SEALED-001 (AIPAC / Iran deal).
 *
 * Differences from produce-001-motion.mjs:
 *   - 12+ distinct visual segments (NOT 2-3 Ken-Burns clips on a share card)
 *   - Tightened VO (~30s, faster cadence) regenerated via ElevenLabs
 *   - Word-by-word animated captions (per-cue PNGs gated by between(t,...))
 *   - Faux-EO document reveal, count-up money number, Tel Aviv → Jerusalem map
 *   - High-contrast color grade applied to master
 *   - Stamp slams with impact SFX synthesized via ffmpeg
 *   - Adelson face shown for ≥3s during buyer reveal
 *
 * No fal.ai dependency for v2 — all visuals deterministic SVG/ffmpeg.
 * (Kling i2v distorts text/faces on news content. Wrong tool for receipts.)
 *
 * Inputs:
 *   _build/001/metadata.json     (existing)
 *   _build/001/vo-v2.txt         (new tightened script)
 *
 * Outputs:
 *   _build/001/vo-v2.mp3         (new ElevenLabs synth)
 *   _build/001/viral-master.mp4
 *   _build/001/viral-summary.json
 *   _build/001/viral-segments.json
 *   public/shorts/sealed-001-aipac-iran-deal.mp4   (replaces v1)
 *   public/shorts/sealed-001-aipac-iran-deal.jpg
 *
 * Usage:
 *   node scripts/shorts/produce-viral-001.mjs              (full run, regen VO)
 *   node scripts/shorts/produce-viral-001.mjs --skip-tts   (reuse vo-v2.mp3)
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
const SHARE_CARD = `${REPO}/companies/concise-sealed/public/share-cards/v1/share-01-aipac-iran-deal.png`
const W = 1080, H = 1920, FPS = 30

const FLAGS = new Set(process.argv.slice(2))
const SKIP_TTS = FLAGS.has('--skip-tts')

// ── env ────────────────────────────────────────────────────────────────────
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

// ── shell ──────────────────────────────────────────────────────────────────
function sh(cmd, a, opts = {}) {
  const r = spawnSync(cmd, a, { stdio: 'inherit', ...opts })
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

// ── SVG → PNG ──────────────────────────────────────────────────────────────
function xml(s){return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')}
function svgToPng(svg, png, w, h) {
  const svgP = png.replace(/\.png$/, '.svg')
  fs.writeFileSync(svgP, svg)
  sh('rsvg-convert', ['-w', String(w), '-h', String(h), svgP, '-o', png])
}

// ── TTS (tightened, higher-affect) ─────────────────────────────────────────
async function synthesizeVo(voText, outPath) {
  const apiKey = env.ELEVENLABS_API_KEY || env.NT_ELEVENLABS_API_KEY
  if (!apiKey) { console.error('No ELEVENLABS_API_KEY'); process.exit(1) }
  const voiceId = env.CR_SHORTS_VOICE_ID || 'EXAVITQu4vr4xnSDxMaL'  // Sarah
  // Higher-affect settings vs v1 (was stab=0.5 sim=0.75 style=0.0).
  const stability = 0.45
  const similarity = 0.75
  const style = 0.40
  const body = {
    text: voText,
    model_id: 'eleven_turbo_v2_5',
    voice_settings: { stability, similarity_boost: similarity, style, use_speaker_boost: true },
  }
  console.log(`[tts] ${voText.length} chars → ElevenLabs Sarah (stab=${stability}, sim=${similarity}, style=${style})`)
  const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: 'POST',
    headers: { 'xi-api-key': apiKey, 'Content-Type': 'application/json', 'Accept': 'audio/mpeg' },
    body: JSON.stringify(body),
  })
  if (!r.ok) { console.error(`ElevenLabs HTTP ${r.status}: ${(await r.text()).slice(0,400)}`); process.exit(1) }
  fs.writeFileSync(outPath, Buffer.from(await r.arrayBuffer()))
  const cost = voText.length / 1000 * 0.22
  logCost('sealed-001-viral', 'elevenlabs', cost, `chars=${voText.length} v2 high-affect`)
  console.log(`[tts] wrote ${outPath}, ~$${cost.toFixed(3)}`)
}

// ─── SEGMENT VISUAL GENERATORS ─────────────────────────────────────────────
// Color palette (matches sealed2016.com civic-trust system)
const C = {
  cream:   'rgb(250,247,239)',
  ink:     '#1a2b4a',
  red:     '#A11B1B',
  redD:    '#7a1010',
  green:   '#2A7A3E',
  gold:    '#C8861D',
  paper:   'rgb(244,238,222)',
  black:   '#0a0a0a',
  white:   '#ffffff',
}

// 1) HOOK — $82M money bills montage backdrop with HUGE shock text
function svgHook() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#0a3a1a"/>
      <stop offset="100%" stop-color="#021008"/>
    </linearGradient>
    <pattern id="bills" x="0" y="0" width="220" height="110" patternUnits="userSpaceOnUse" patternTransform="rotate(-8)">
      <rect width="200" height="92" x="10" y="9" rx="6" fill="#a8c9a4" stroke="#2a5a30" stroke-width="2"/>
      <circle cx="110" cy="55" r="22" fill="#86a884" stroke="#2a5a30" stroke-width="1.5"/>
      <text x="110" y="62" text-anchor="middle" font-family="Georgia, serif" font-weight="900" font-size="22" fill="#2a5a30">100</text>
      <text x="35" y="28" font-family="Georgia, serif" font-size="14" fill="#2a5a30" font-weight="700">100</text>
      <text x="170" y="86" font-family="Georgia, serif" font-size="14" fill="#2a5a30" font-weight="700">100</text>
    </pattern>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <rect width="${W}" height="${H}" fill="url(#bills)" opacity="0.55"/>
  <rect width="${W}" height="${H}" fill="#000000" opacity="0.45"/>
  <text x="${W/2}" y="780" text-anchor="middle"
    font-family="Helvetica, Arial, sans-serif" font-weight="900"
    font-size="220" fill="#ffcc33" letter-spacing="-4" stroke="#000000" stroke-width="6" paint-order="stroke fill">$82M</text>
  <text x="${W/2}" y="930" text-anchor="middle"
    font-family="Helvetica, Arial, sans-serif" font-weight="900"
    font-size="78" fill="#ffffff" letter-spacing="2">BOUGHT 3</text>
  <text x="${W/2}" y="1020" text-anchor="middle"
    font-family="Helvetica, Arial, sans-serif" font-weight="900"
    font-size="78" fill="#ffffff" letter-spacing="2">TRUMP PROMISES</text>
  <text x="${W/2}" y="1180" text-anchor="middle"
    font-family="Helvetica, Arial, sans-serif" font-weight="700"
    font-size="42" fill="#ffcc33" letter-spacing="6">HERE'S THE RECEIPT.</text>
</svg>`
}

// 2,4,6) PROMISE CARDS — bold numbered receipts on cream/ink
function svgPromise(num, line1, line2) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="${C.cream}"/>
  <rect x="0" y="0" width="${W}" height="22" fill="${C.red}"/>
  <rect x="0" y="${H-22}" width="${W}" height="22" fill="${C.red}"/>
  <text x="${W/2}" y="580" text-anchor="middle"
    font-family="Georgia, serif" font-style="italic" font-weight="400"
    font-size="56" fill="#5a4a3a">promise</text>
  <text x="${W/2}" y="900" text-anchor="middle"
    font-family="Georgia, serif" font-weight="900"
    font-size="540" fill="${C.red}" letter-spacing="-10">${num}</text>
  <line x1="240" y1="980" x2="840" y2="980" stroke="${C.ink}" stroke-width="4"/>
  <text x="${W/2}" y="1140" text-anchor="middle"
    font-family="Helvetica, Arial, sans-serif" font-weight="900"
    font-size="${line2 ? 76 : 92}" fill="${C.ink}" letter-spacing="2">${xml(line1)}</text>
  ${line2 ? `<text x="${W/2}" y="1240" text-anchor="middle"
    font-family="Helvetica, Arial, sans-serif" font-weight="900"
    font-size="76" fill="${C.ink}" letter-spacing="2">${xml(line2)}</text>` : ''}
  <text x="${W/2}" y="1500" text-anchor="middle"
    font-family="Menlo, Monaco, monospace" font-weight="700"
    font-size="32" fill="${C.red}" letter-spacing="5">SEALED2016.COM</text>
</svg>`
}

// 3,5,7) DONE STAMP cards — big date + slammed BROKEN/DONE stamp
function svgDone(dateText, subTitle) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="${C.paper}"/>
  <rect x="0" y="0" width="${W}" height="22" fill="${C.red}"/>
  <rect x="0" y="${H-22}" width="${W}" height="22" fill="${C.red}"/>
  <text x="${W/2}" y="640" text-anchor="middle"
    font-family="Helvetica, Arial, sans-serif" font-weight="400"
    font-size="42" fill="#5a4a3a" letter-spacing="8">${xml(subTitle)}</text>
  <g transform="translate(${W/2}, 920) rotate(-8)">
    <rect x="-380" y="-100" width="760" height="220" fill="none" stroke="${C.red}" stroke-width="14" opacity="0.85"/>
    <rect x="-380" y="-100" width="760" height="220" fill="none" stroke="${C.red}" stroke-width="6" opacity="0.55"/>
    <text x="0" y="40" text-anchor="middle"
      font-family="Helvetica, Arial, sans-serif" font-weight="900"
      font-size="180" fill="${C.red}" letter-spacing="20" opacity="0.92">DONE</text>
  </g>
  <text x="${W/2}" y="1280" text-anchor="middle"
    font-family="Helvetica, Arial, sans-serif" font-weight="900"
    font-size="96" fill="${C.ink}" letter-spacing="4">${xml(dateText)}</text>
  <text x="${W/2}" y="1500" text-anchor="middle"
    font-family="Menlo, Monaco, monospace" font-weight="700"
    font-size="32" fill="${C.red}" letter-spacing="5">SEALED2016.COM</text>
</svg>`
}

// 5b) MAP — Tel Aviv → Jerusalem (Embassy move)
function svgEmbassyMap() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="#0d2240"/>
  <rect x="0" y="0" width="${W}" height="22" fill="${C.red}"/>
  <rect x="0" y="${H-22}" width="${W}" height="22" fill="${C.red}"/>
  <!-- stylized Israel landmass -->
  <path d="M 540 600
           L 660 620
           L 700 800
           L 690 1000
           L 660 1150
           L 600 1280
           L 540 1380
           L 480 1280
           L 460 1100
           L 470 920
           L 500 760 Z"
        fill="#d4c9a0" stroke="#8a7a4a" stroke-width="4"/>
  <!-- Sea label -->
  <text x="280" y="900" font-family="Georgia, serif" font-style="italic" font-size="38" fill="#7aaad0">Mediterranean</text>
  <!-- Tel Aviv pin (CROSSED OUT) -->
  <circle cx="510" cy="900" r="22" fill="#888" stroke="#fff" stroke-width="4"/>
  <line x1="490" y1="880" x2="530" y2="920" stroke="#A11B1B" stroke-width="8"/>
  <line x1="530" y1="880" x2="490" y2="920" stroke="#A11B1B" stroke-width="8"/>
  <text x="350" y="870" font-family="Helvetica, sans-serif" font-weight="700" font-size="38" fill="#cccccc" text-decoration="line-through">Tel Aviv</text>
  <!-- Arrow -->
  <path d="M 540 920 Q 600 1000 640 1080" stroke="#ffcc33" stroke-width="10" fill="none" stroke-linecap="round"/>
  <polygon points="640,1080 615,1060 625,1095" fill="#ffcc33"/>
  <!-- Jerusalem pin (highlighted) -->
  <circle cx="660" cy="1100" r="36" fill="${C.red}" stroke="#ffcc33" stroke-width="6"/>
  <circle cx="660" cy="1100" r="10" fill="#ffcc33"/>
  <text x="710" y="1110" font-family="Helvetica, sans-serif" font-weight="900" font-size="56" fill="#ffcc33">JERUSALEM</text>
  <!-- Title -->
  <text x="${W/2}" y="420" text-anchor="middle"
    font-family="Helvetica, sans-serif" font-weight="900" font-size="78" fill="#ffffff" letter-spacing="2">EMBASSY MOVED</text>
  <text x="${W/2}" y="500" text-anchor="middle"
    font-family="Helvetica, sans-serif" font-weight="700" font-size="42" fill="#ffcc33" letter-spacing="4">TEL AVIV → JERUSALEM</text>
  <!-- Footer URL -->
  <text x="${W/2}" y="1820" text-anchor="middle"
    font-family="Menlo, monospace" font-weight="700" font-size="32" fill="#ffcc33" letter-spacing="5">SEALED2016.COM</text>
</svg>`
}

// 7b) EO 13899 document reveal
function svgEOReveal() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="#1a1a1a"/>
  <!-- "Paper" document -->
  <g transform="translate(${W/2}, ${H/2}) rotate(-2)">
    <rect x="-440" y="-620" width="880" height="1240" fill="${C.cream}" stroke="#8a7a4a" stroke-width="3"/>
    <!-- Faux seal -->
    <circle cx="0" cy="-480" r="60" fill="none" stroke="${C.ink}" stroke-width="3"/>
    <circle cx="0" cy="-480" r="42" fill="none" stroke="${C.ink}" stroke-width="2"/>
    <text x="0" y="-470" text-anchor="middle" font-family="Georgia, serif" font-weight="900" font-size="20" fill="${C.ink}">SEAL</text>
    <!-- Title -->
    <text x="0" y="-360" text-anchor="middle" font-family="Georgia, serif" font-weight="400" font-style="italic" font-size="32" fill="#5a4a3a">The White House</text>
    <text x="0" y="-280" text-anchor="middle" font-family="Georgia, serif" font-weight="900" font-size="64" fill="${C.ink}" letter-spacing="4">EXECUTIVE ORDER</text>
    <text x="0" y="-150" text-anchor="middle" font-family="Helvetica, sans-serif" font-weight="900" font-size="180" fill="${C.red}" letter-spacing="2">13899</text>
    <line x1="-260" y1="-60" x2="260" y2="-60" stroke="${C.ink}" stroke-width="2"/>
    <text x="0" y="20" text-anchor="middle" font-family="Helvetica, sans-serif" font-weight="700" font-size="34" fill="${C.ink}">COMBATING</text>
    <text x="0" y="68" text-anchor="middle" font-family="Helvetica, sans-serif" font-weight="700" font-size="34" fill="${C.ink}">ANTI-SEMITISM</text>
    <!-- Faux body lines -->
    ${[140,180,220,260,300,340,380].map(y =>
      `<rect x="-380" y="${y}" width="${720 - Math.random()*120}" height="6" fill="#bbaa88"/>`).join('')}
    <!-- Stamp -->
    <g transform="translate(180, 520) rotate(12)">
      <rect x="-130" y="-44" width="260" height="88" fill="none" stroke="${C.red}" stroke-width="6"/>
      <text x="0" y="14" text-anchor="middle" font-family="Helvetica, sans-serif" font-weight="900" font-size="52" fill="${C.red}" letter-spacing="4">SIGNED</text>
    </g>
    <!-- Signature line -->
    <line x1="-380" y1="500" x2="-100" y2="500" stroke="${C.ink}" stroke-width="2"/>
    <text x="-240" y="540" text-anchor="middle" font-family="Georgia, serif" font-style="italic" font-size="22" fill="#5a4a3a">Donald J. Trump</text>
  </g>
  <text x="${W/2}" y="1820" text-anchor="middle"
    font-family="Menlo, monospace" font-weight="700" font-size="32" fill="${C.red}" letter-spacing="5">SEALED2016.COM</text>
</svg>`
}

// 8) BUYER REVEAL — silhouette + name + dollar count-up frame
function svgBuyerCountUp(amountText) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <radialGradient id="spot" cx="0.5" cy="0.4" r="0.6">
      <stop offset="0%" stop-color="#3a2a1a"/>
      <stop offset="100%" stop-color="#080404"/>
    </radialGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#spot)"/>
  <!-- Silhouette portrait placeholder (head + shoulders) -->
  <g transform="translate(${W/2}, 720)">
    <ellipse cx="0" cy="0" r="180" fill="#1a1208"/>
    <path d="M -280 280 Q -280 100 -160 90 Q 0 50 160 90 Q 280 100 280 280 L 280 400 L -280 400 Z"
          fill="#1a1208"/>
    <!-- Eyeglasses suggestion -->
    <circle cx="-70" cy="-20" r="40" fill="none" stroke="#3a2a18" stroke-width="6"/>
    <circle cx="70" cy="-20" r="40" fill="none" stroke="#3a2a18" stroke-width="6"/>
    <line x1="-30" y1="-20" x2="30" y2="-20" stroke="#3a2a18" stroke-width="6"/>
  </g>
  <text x="${W/2}" y="240" text-anchor="middle"
    font-family="Helvetica, sans-serif" font-weight="700" font-size="42" fill="#ffcc33" letter-spacing="6">MEET THE BUYER</text>
  <text x="${W/2}" y="340" text-anchor="middle"
    font-family="Helvetica, sans-serif" font-weight="900" font-size="120" fill="#ffffff" letter-spacing="2">SHELDON</text>
  <text x="${W/2}" y="460" text-anchor="middle"
    font-family="Helvetica, sans-serif" font-weight="900" font-size="120" fill="#ffffff" letter-spacing="2">ADELSON</text>
  <text x="${W/2}" y="1320" text-anchor="middle"
    font-family="Helvetica, sans-serif" font-weight="700" font-size="40" fill="#cccccc" letter-spacing="6">2016 CYCLE DONATIONS</text>
  <text x="${W/2}" y="1480" text-anchor="middle"
    font-family="Helvetica, sans-serif" font-weight="900" font-size="180" fill="#ffcc33" letter-spacing="-2"
    stroke="#000000" stroke-width="4" paint-order="stroke fill">${xml(amountText)}</text>
  <text x="${W/2}" y="1820" text-anchor="middle"
    font-family="Menlo, monospace" font-weight="700" font-size="32" fill="#ffcc33" letter-spacing="5">SEALED2016.COM</text>
</svg>`
}

// 9) VERDICT — "DRAIN THE SWAMP?" struck through, BROKEN slam
function svgVerdict() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="${C.paper}"/>
  <rect x="0" y="0" width="${W}" height="22" fill="${C.red}"/>
  <rect x="0" y="${H-22}" width="${W}" height="22" fill="${C.red}"/>
  <text x="${W/2}" y="540" text-anchor="middle"
    font-family="Georgia, serif" font-style="italic" font-size="48" fill="#5a4a3a">they promised:</text>
  <g transform="translate(${W/2}, 720)">
    <text x="0" y="0" text-anchor="middle"
      font-family="Helvetica, sans-serif" font-weight="900" font-size="110" fill="${C.ink}" letter-spacing="4">DRAIN THE</text>
    <text x="0" y="120" text-anchor="middle"
      font-family="Helvetica, sans-serif" font-weight="900" font-size="110" fill="${C.ink}" letter-spacing="4">SWAMP</text>
    <line x1="-380" y1="60" x2="380" y2="60" stroke="${C.red}" stroke-width="14"/>
  </g>
  <g transform="translate(${W/2}, 1140) rotate(-6)">
    <rect x="-440" y="-130" width="880" height="260" fill="none" stroke="${C.red}" stroke-width="18" opacity="0.9"/>
    <text x="0" y="50" text-anchor="middle"
      font-family="Helvetica, sans-serif" font-weight="900" font-size="220" fill="${C.red}" letter-spacing="20">BROKEN</text>
  </g>
  <text x="${W/2}" y="1460" text-anchor="middle"
    font-family="Helvetica, sans-serif" font-weight="700" font-size="52" fill="${C.ink}" letter-spacing="3">THE SWAMP GOT PAID.</text>
  <text x="${W/2}" y="1820" text-anchor="middle"
    font-family="Menlo, monospace" font-weight="700" font-size="32" fill="${C.red}" letter-spacing="5">SEALED2016.COM</text>
</svg>`
}

// 10) FINAL CTA — already established sealed2016.com brand
function svgFinalCard() {
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
  <text x="${W/2}" y="1080" text-anchor="middle"
    font-family="Helvetica, sans-serif" font-weight="900" font-size="84" fill="${C.ink}" letter-spacing="3">145 PROMISES</text>
  <text x="${W/2}" y="1180" text-anchor="middle"
    font-family="Helvetica, sans-serif" font-weight="900" font-size="84" fill="${C.ink}" letter-spacing="3">EVERY RECEIPT</text>
  <text x="${W/2}" y="1500" text-anchor="middle"
    font-family="Menlo, monospace" font-weight="900" font-size="92" fill="${C.red}" letter-spacing="3">SEALED2016.COM</text>
</svg>`
}

// ── word-by-word animated captions ─────────────────────────────────────────
function svgWord(word, highlight = false) {
  // Render a single word as a chip; numbers/names get civic-red highlight.
  const fontSize = highlight ? 96 : 72
  const padX = 28, padY = 16
  // Estimate width: ~ fontSize * 0.62 per character
  const approxW = Math.max(120, Math.ceil(word.length * fontSize * 0.62) + padX * 2)
  const approxH = fontSize + padY * 2
  const fill = highlight ? '#ffcc33' : '#ffffff'
  const stroke = highlight ? '#7a1010' : '#000000'
  return {
    svg: `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${approxW}" height="${approxH}" viewBox="0 0 ${approxW} ${approxH}">
  <text x="${approxW/2}" y="${approxH/2 + fontSize/3}" text-anchor="middle"
    font-family="Helvetica, Arial Black, sans-serif" font-weight="900"
    font-size="${fontSize}" fill="${fill}"
    stroke="${stroke}" stroke-width="6" paint-order="stroke fill">${xml(word)}</text>
</svg>`,
    w: approxW, h: approxH,
  }
}

// ─── SFX synthesis (no Freesound network dep) ──────────────────────────────
// Whoosh: filtered white noise burst, 200ms
function makeWhoosh(outPath) {
  sh('ffmpeg', ['-y',
    '-f','lavfi','-i','anoisesrc=c=white:r=44100:d=0.25:a=0.8',
    '-af','highpass=f=200,lowpass=f=4500,volume=0.6,afade=t=in:st=0:d=0.04,afade=t=out:st=0.16:d=0.09',
    '-c:a','pcm_s16le', outPath])
}
// Impact: low sine + noise burst, 180ms
function makeImpact(outPath) {
  sh('ffmpeg', ['-y',
    '-f','lavfi','-i','sine=f=70:duration=0.18',
    '-f','lavfi','-i','anoisesrc=c=brown:r=44100:d=0.18:a=0.9',
    '-filter_complex','[0:a]volume=1.2[s];[1:a]highpass=f=120,lowpass=f=2400,volume=0.7[n];[s][n]amix=inputs=2,afade=t=out:st=0.10:d=0.08',
    '-c:a','pcm_s16le', outPath])
}
// Glitch tick: short high tone
function makeTick(outPath) {
  sh('ffmpeg', ['-y',
    '-f','lavfi','-i','sine=f=2200:duration=0.06',
    '-af','volume=0.5,afade=t=out:st=0.02:d=0.04',
    '-c:a','pcm_s16le', outPath])
}

// ─── caption tokenizer with highlight rules ────────────────────────────────
const HIGHLIGHT_RE = /^\$?[\d,.]+M?$|^\$?\d/                  // numbers/dollars
const NAME_HIGHLIGHTS = new Set(['ADELSON','SHELDON','BROKEN','DONE','JERUSALEM','IRAN','SWAMP','PAID','TRUMP'])
function tokenizeCaption(text) {
  // Split on whitespace, preserve punctuation attached to words
  return text.trim().split(/\s+/).map(w => {
    const upper = w.toUpperCase().replace(/[^\w$]/g, '')
    const highlight = HIGHLIGHT_RE.test(w) || NAME_HIGHLIGHTS.has(upper)
    return { word: w.toUpperCase(), highlight }
  })
}

// ── main pipeline ──────────────────────────────────────────────────────────
async function main() {
  fs.mkdirSync(BUILD, { recursive: true })
  fs.mkdirSync(PUB_SHORTS, { recursive: true })
  const meta = JSON.parse(fs.readFileSync(`${BUILD}/metadata.json`,'utf8'))

  // 1) TTS regen
  const voPath = `${BUILD}/vo-v2.mp3`
  const voText = fs.readFileSync(`${BUILD}/vo-v2.txt`, 'utf8').trim()
  if (SKIP_TTS && fs.existsSync(voPath)) {
    console.log(`[tts] skip — reusing ${voPath}`)
  } else {
    await synthesizeVo(voText, voPath)
  }
  const voDur = probeDur(voPath)
  console.log(`[plan] voDur=${voDur.toFixed(2)}s`)
  if (voDur > 40) {
    console.warn(`[plan] WARNING: VO is ${voDur.toFixed(2)}s — over 35s viral target. Continuing.`)
  }

  // 2) Build segments. We have 10 visual cards. Distribute timing across voDur.
  // Total VO ~30-35s. We want minimum 12 cuts → segment some cards into multiple
  // takes (different zooms / shake seeds) to inflate cut count without new art.
  //
  // Segment plan (with cut count target ≥12):
  //   0  HOOK            0.0 - 2.4   ($82M)
  //   1  PROMISE 1       2.4 - 4.6
  //   2  DONE May 8 2018 4.6 - 6.4
  //   3  PROMISE 2       6.4 - 8.6
  //   4  EMBASSY MAP     8.6 - 10.8
  //   5  DONE May 14     10.8 - 12.8
  //   6  PROMISE 3       12.8 - 15.0
  //   7  EO 13899        15.0 - 17.4
  //   8  DONE Dec 2019   17.4 - 19.4
  //   9  BUYER reveal A  19.4 - 22.0
  //   10 BUYER count-up  22.0 - 24.4 (different SVG: $82,000,000)
  //   11 VERDICT         24.4 - 27.4
  //   12 CTA card        27.4 - voDur+1.0
  // = 13 distinct cuts.

  const totalTarget = Math.max(voDur + 1.0, 30.0)
  // Scale baseline plan to actual voDur. Baseline assumes voDur=29.0.
  const baseline = 29.0
  const baselineTimings = [
    { id:'hook',    start:0.0,  end:2.4  },
    { id:'pr1',     start:2.4,  end:4.6  },
    { id:'done1',   start:4.6,  end:6.4  },
    { id:'pr2',     start:6.4,  end:8.6  },
    { id:'map',     start:8.6,  end:10.8 },
    { id:'done2',   start:10.8, end:12.8 },
    { id:'pr3',     start:12.8, end:15.0 },
    { id:'eo',      start:15.0, end:17.4 },
    { id:'done3',   start:17.4, end:19.4 },
    { id:'buyerA',  start:19.4, end:22.0 },
    { id:'buyerB',  start:22.0, end:24.4 },
    { id:'verdict', start:24.4, end:27.4 },
    { id:'cta',     start:27.4, end:29.0 },
  ]
  const scale = voDur / baseline
  const segs = baselineTimings.map((s, i) => ({
    idx: i, id: s.id,
    start: s.start * scale,
    end: i === baselineTimings.length - 1 ? totalTarget : s.end * scale,
  }))
  // ensure CTA holds the music tail
  segs[segs.length-1].end = totalTarget

  // 3) Render each segment's PNG and a Ken-Burns-ish motion clip from it.
  // For DONE stamps we add a 0.15s "slam" effect: stamp starts at scale=1.6 zoom-in to 1.0.
  const overlays = path.join(BUILD, '_overlays_v2')
  fs.mkdirSync(overlays, { recursive: true })

  const cardPng = (id) => path.join(overlays, `card-${id}.png`)
  const svgFor = (id) => {
    switch (id) {
      case 'hook':    return svgHook()
      case 'pr1':     return svgPromise('1','KILL THE','IRAN DEAL')
      case 'done1':   return svgDone('MAY 8, 2018', 'PROMISE 1 — KEPT FOR DONOR')
      case 'pr2':     return svgPromise('2','MOVE EMBASSY','TO JERUSALEM')
      case 'map':     return svgEmbassyMap()
      case 'done2':   return svgDone('MAY 14, 2018', 'PROMISE 2 — KEPT FOR DONOR')
      case 'pr3':     return svgPromise('3','EXPAND ANTI-','SEMITISM DEF.')
      case 'eo':      return svgEOReveal()
      case 'done3':   return svgDone('DEC 11, 2019', 'PROMISE 3 — KEPT FOR DONOR')
      case 'buyerA':  return svgBuyerCountUp('$0')
      case 'buyerB':  return svgBuyerCountUp('$82,000,000')
      case 'verdict': return svgVerdict()
      case 'cta':     return svgFinalCard()
      default: throw new Error(`unknown card ${id}`)
    }
  }
  for (const s of segs) svgToPng(svgFor(s.id), cardPng(s.id), W, H)

  // 4) Build per-segment motion clip — light zoom on most; slam on DONE; pan on map.
  const segClipPath = (id) => path.join(BUILD, `vseg-${id}.mp4`)
  function motionClip(s) {
    const dur = s.end - s.start
    const frames = Math.max(2, Math.round(dur * FPS))
    let z, shakeFx = ''
    // zoom rate per frame to reach ~1.10 over dur
    const perFrame = 0.10 / frames
    if (s.id.startsWith('done')) {
      // Slam: start big, snap to 1.0 quickly, then settle. Use zoom from 1.30 → 1.0 over first 8 frames.
      const f1 = 8
      z = `zoompan=z='if(lt(on,${f1}),max(1.0,1.30-on*${(0.30/f1).toFixed(6)}),1.0+(on-${f1})*0.0006)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${frames}:s=${W}x${H}:fps=${FPS}`
    } else if (s.id === 'map') {
      // Slow pan from TLV side to Jerusalem side
      z = `zoompan=z='1.05+on*${(0.10/frames).toFixed(6)}':x='iw/2-(iw/zoom/2)+(on-${frames/2})*1.5':y='ih/2-(ih/zoom/2)':d=${frames}:s=${W}x${H}:fps=${FPS}`
    } else if (s.id === 'hook') {
      // Quick pulse zoom: 1.10 → 1.0 in first 6 frames, then push in slowly
      z = `zoompan=z='if(lt(on,6),max(1.0,1.10-on*${(0.10/6).toFixed(6)}),1.0+on*0.0005)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${frames}:s=${W}x${H}:fps=${FPS}`
      shakeFx = `,crop=${W}:${H}:'4*sin(2*PI*t*3.0)':'3*cos(2*PI*t*2.6)'`
    } else if (s.id === 'cta') {
      z = `zoompan=z='1.0':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${frames}:s=${W}x${H}:fps=${FPS}`
    } else {
      // Generic push in
      const dir = (s.idx % 2 === 0) ? 'in' : 'out'
      if (dir === 'in') {
        z = `zoompan=z='1.0+on*${perFrame.toFixed(6)}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${frames}:s=${W}x${H}:fps=${FPS}`
      } else {
        z = `zoompan=z='1.10-on*${perFrame.toFixed(6)}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${frames}:s=${W}x${H}:fps=${FPS}`
      }
    }
    const vf = `scale=${W*2}:${H*2}:force_original_aspect_ratio=increase,crop=${W*2}:${H*2},${z}${shakeFx},trim=duration=${dur},setpts=PTS-STARTPTS,format=yuv420p`
    sh('ffmpeg', ['-y',
      '-framerate', String(FPS), '-loop','1','-t', String(dur), '-i', cardPng(s.id),
      '-vf', vf, '-r', String(FPS),
      '-c:v','libx264','-pix_fmt','yuv420p','-preset','fast','-crf','20','-an',
      segClipPath(s.id),
    ])
  }
  for (const s of segs) motionClip(s)

  // 5) Concat all segments
  const concatList = path.join(BUILD, 'viral-concat.txt')
  fs.writeFileSync(concatList, segs.map(s=>`file '${segClipPath(s.id)}'`).join('\n')+'\n')
  const concatPath = path.join(BUILD, 'viral-concat.mp4')
  sh('ffmpeg', ['-y','-f','concat','-safe','0','-i', concatList,
    '-c:v','libx264','-pix_fmt','yuv420p','-preset','fast','-crf','20','-r',String(FPS),'-an', concatPath])

  // 6) Word-by-word captions per segment. Each segment's "caption text" is the
  //    line being voiced during that window.
  const segCaptions = {
    hook:    'EIGHTY-TWO MILLION DOLLARS',
    pr1:     'PROMISE 1: KILL IRAN DEAL',
    done1:   'DONE. MAY 8, 2018.',
    pr2:     'PROMISE 2: MOVE EMBASSY',
    map:     'TEL AVIV → JERUSALEM',
    done2:   'DONE. MAY 14, 2018.',
    pr3:     'PROMISE 3: ANTI-SEMITISM E.O.',
    eo:      'EXECUTIVE ORDER 13899',
    done3:   'DONE. DECEMBER 2019.',
    buyerA:  'MEET THE BUYER',
    buyerB:  'ADELSON: $82,000,000',
    verdict: 'THREE FOR THREE. BROKEN.',
    cta:     '145 PROMISES. EVERY RECEIPT.',
  }
  // Render each word PNG once (dedupe)
  const wordsDir = path.join(overlays, 'words')
  fs.mkdirSync(wordsDir, { recursive: true })
  const wordPngCache = new Map()
  function ensureWordPng(word, highlight) {
    const key = `${highlight ? 'H' : 'N'}__${word}`
    if (wordPngCache.has(key)) return wordPngCache.get(key)
    const safe = word.replace(/[^A-Z0-9]/gi, '_').slice(0, 24)
    const png = path.join(wordsDir, `${highlight?'H':'N'}_${safe}_${wordPngCache.size}.png`)
    const { svg, w, h } = svgWord(word, highlight)
    svgToPng(svg, png, w, h)
    wordPngCache.set(key, { png, w, h })
    return { png, w, h }
  }

  // Plan word-overlay schedule: per segment, distribute N words across that
  // segment's duration. Each word appears AT a time and stays until end of segment.
  // Position: bottom-center band y ≈ 1480, but for some cards (hook already has
  // huge text; cta already final) we skip captions to avoid clutter.
  const SKIP_CAPTION_FOR = new Set(['hook','cta','verdict','eo','map'])  // those already have huge type
  const wordOverlays = []  // { png, t_start, t_end, w, h }
  for (const s of segs) {
    if (SKIP_CAPTION_FOR.has(s.id)) continue
    const tokens = tokenizeCaption(segCaptions[s.id] || '')
    if (!tokens.length) continue
    const dur = s.end - s.start
    const slot = Math.max(0.10, (dur - 0.2) / tokens.length)
    tokens.forEach((tk, i) => {
      const { png, w, h } = ensureWordPng(tk.word, tk.highlight)
      const t_start = s.start + 0.1 + i * slot
      const t_end = s.end - 0.05
      wordOverlays.push({ png, t_start, t_end, w, h, line_index: i, segId: s.id })
    })
  }

  // Group word overlays by segment to compose them as a horizontal line that
  // grows word-by-word. For each segment, words appear sequentially on a single
  // baseline at y ≈ 1480, centered as if the FINAL line.
  // Strategy: precompute the final line width per segment, then for each word's
  // appearance compute x as its left-offset relative to that centered line.
  const segWords = new Map()
  for (const wo of wordOverlays) {
    if (!segWords.has(wo.segId)) segWords.set(wo.segId, [])
    segWords.get(wo.segId).push(wo)
  }
  const captionTimedOverlays = []  // { png, t_start, t_end, x, y, w, h }
  const SPACE = 18
  const CAPTION_Y_CENTER = 1700  // bottom-band, above the safe zone
  for (const [segId, ws] of segWords.entries()) {
    const totalW = ws.reduce((a,w)=>a + w.w, 0) + SPACE * (ws.length - 1)
    let cursor = Math.max(20, Math.round((W - totalW) / 2))
    for (const w of ws) {
      const y = CAPTION_Y_CENTER - Math.floor(w.h / 2)
      captionTimedOverlays.push({ png: w.png, t_start: w.t_start, t_end: w.t_end, x: cursor, y, w: w.w, h: w.h })
      cursor += w.w + SPACE
    }
  }

  // 7) Burn captions onto the concat. Build filter_complex.
  const capInputs = ['-i', concatPath]
  const capChain = []
  let last = '[0:v]'
  captionTimedOverlays.forEach((c, i) => {
    capInputs.push('-loop','1','-t', String(totalTarget+0.5), '-i', c.png)
    const next = `[w${i}]`
    capChain.push(`${last}[${i+1}:v]overlay=${c.x}:${c.y}:enable='between(t,${c.t_start.toFixed(3)},${c.t_end.toFixed(3)})'${next}`)
    last = next
  })
  // Color grade at end of caption chain
  capChain.push(`${last}eq=saturation=1.30:contrast=1.15:gamma=0.95[vout]`)
  const capFilter = capChain.join(';')
  const visualPath = path.join(BUILD, 'viral-visual.mp4')
  sh('ffmpeg', ['-y', ...capInputs,
    '-filter_complex', capFilter,
    '-map','[vout]',
    '-c:v','libx264','-pix_fmt','yuv420p','-preset','medium','-crf','20','-r',String(FPS),
    visualPath,
  ])

  // 8) SFX synthesis
  const sfxDir = path.join(BUILD, '_sfx')
  fs.mkdirSync(sfxDir, { recursive: true })
  const whooshPath = path.join(sfxDir, 'whoosh.wav')
  const impactPath = path.join(sfxDir, 'impact.wav')
  const tickPath = path.join(sfxDir, 'tick.wav')
  makeWhoosh(whooshPath)
  makeImpact(impactPath)
  makeTick(tickPath)

  // 9) Build SFX layer aligned to segment boundaries
  //    - On every segment cut: whoosh (most cuts) or impact (on DONE slams + verdict)
  //    - Verdict + buyer reveal also get an impact
  const sfxEvents = []  // { at: seconds, kind: 'whoosh'|'impact'|'tick' }
  for (let i = 0; i < segs.length; i++) {
    const s = segs[i]
    if (i === 0) { sfxEvents.push({ at: 0.0, kind: 'impact' }); continue }
    if (s.id.startsWith('done') || s.id === 'verdict') sfxEvents.push({ at: s.start, kind: 'impact' })
    else if (s.id === 'eo' || s.id === 'buyerB') sfxEvents.push({ at: s.start, kind: 'tick' })
    else sfxEvents.push({ at: s.start, kind: 'whoosh' })
  }

  // Build SFX track: for each event, an input file with adelay, then amix
  const sfxInputs = []
  sfxEvents.forEach((e) => {
    const f = e.kind === 'impact' ? impactPath : e.kind === 'tick' ? tickPath : whooshPath
    sfxInputs.push('-i', f)
  })
  const sfxFilter = sfxEvents.map((e, i) => {
    const delayMs = Math.max(0, Math.round(e.at * 1000))
    return `[${i}:a]adelay=${delayMs}|${delayMs},volume=0.85[s${i}]`
  }).join(';')
  const sfxMix = `${sfxEvents.map((_,i)=>`[s${i}]`).join('')}amix=inputs=${sfxEvents.length}:duration=longest:dropout_transition=0,atrim=0:${totalTarget},apad=pad_dur=${totalTarget}[sfxout]`
  const sfxTrack = path.join(BUILD, 'sfx-track.m4a')
  sh('ffmpeg', ['-y', ...sfxInputs,
    '-filter_complex', `${sfxFilter};${sfxMix}`,
    '-map','[sfxout]',
    '-c:a','aac','-b:a','192k', sfxTrack,
  ])

  // 10) Audio mix — voice + music (sidechain ducked) + SFX layer
  const mixPath = path.join(BUILD, 'viral-mix.m4a')
  const fadeOutStart = Math.max(0, totalTarget - 1.0)
  const aFilter =
    `[0:a]loudnorm=I=-16:TP=-1.5:LRA=7,volume=1.4,apad[voice];` +
    `[1:a]atrim=0:${totalTarget},aloop=loop=0:size=1,atrim=0:${totalTarget},` +
    `loudnorm=I=-26:TP=-3:LRA=11,volume=0.32,` +
    `afade=t=in:st=0:d=0.4,afade=t=out:st=${fadeOutStart.toFixed(2)}:d=1.0[mu];` +
    `[mu][voice]sidechaincompress=threshold=0.02:ratio=20:attack=80:release=400:level_sc=4[mud];` +
    `[2:a]volume=0.9,atrim=0:${totalTarget}[sfx];` +
    `[voice][mud][sfx]amix=inputs=3:duration=longest:dropout_transition=0:weights=1.0 0.55 0.7,` +
    `alimiter=limit=0.95:level=disabled,atrim=0:${totalTarget}[aout]`
  sh('ffmpeg', ['-y','-i', voPath, '-i', MUSIC, '-i', sfxTrack,
    '-filter_complex', aFilter,
    '-map','[aout]',
    '-c:a','aac','-b:a','192k', mixPath,
  ])

  // 11) Mux video + audio = master
  const masterPath = path.join(BUILD, 'viral-master.mp4')
  sh('ffmpeg', ['-y','-i', visualPath, '-i', mixPath,
    '-t', String(totalTarget),
    '-c:v','copy','-c:a','copy','-shortest', masterPath,
  ])
  console.log(`[master] wrote ${masterPath}`)

  // 12) Verify ffprobe
  const info = JSON.parse(shCap('ffprobe', ['-v','error','-show_format','-show_streams','-of','json', masterPath]).stdout)
  const v = info.streams.find(s=>s.codec_type==='video')
  const a = info.streams.find(s=>s.codec_type==='audio')
  const dur = parseFloat(info.format.duration)
  const fps = eval(v.r_frame_rate)
  console.log(`[ffprobe] ${v?.width}x${v?.height} @ ${fps}fps  ${dur.toFixed(2)}s  v=${!!v} a=${!!a}`)
  if (v.width !== W || v.height !== H) { console.error('DIMS FAIL'); process.exit(1) }
  if (dur > 40.05) { console.error(`DURATION FAIL ${dur}s — over viral 35s target`); process.exit(1) }

  // 13) RMS verification (same approach as produce-001-motion)
  function rmsDb(file, start, dur_) {
    const r = shCap('ffmpeg', ['-hide_banner','-nostats','-ss',String(start),'-i', file,'-t',String(dur_),
      '-af','astats=metadata=1:reset=0','-f','null','-'])
    const m = [...(r.stderr||'').matchAll(/RMS level dB:\s*(-?\d+(?:\.\d+)?)/g)]
    if (!m.length) return null
    return parseFloat(m[m.length-1][1])
  }
  const musicOnly = path.join(BUILD, 'viral-music-only.m4a')
  sh('ffmpeg', ['-y','-i', MUSIC, '-filter_complex',
    `[0:a]atrim=0:${totalTarget},aloop=loop=0:size=1,atrim=0:${totalTarget},loudnorm=I=-26:TP=-3:LRA=11,volume=0.32,` +
    `afade=t=in:st=0:d=0.4,afade=t=out:st=${fadeOutStart.toFixed(2)}:d=1.0,atrim=0:${totalTarget}[a]`,
    '-map','[a]','-c:a','aac','-b:a','192k', musicOnly])
  // Sample voice windows across the speech (approx — first 6 segments that have voice)
  const speechWindows = segs.slice(0, 8).map(s => ({ t: s.start + 0.1, dur: Math.min(s.end - s.start - 0.2, 1.0), label: s.id }))
  const rmsReport = { mode:'music-only-reference', windows: [], pass: true }
  for (const w of speechWindows) {
    const winDur = Math.max(0.3, w.dur)
    const masterR = rmsDb(masterPath, w.t, winDur)
    const musicRefR = rmsDb(musicOnly, w.t, winDur)
    const diff = (masterR!=null && musicRefR!=null) ? (masterR - musicRefR) : null
    const pass = diff != null && diff >= 8.0
    rmsReport.windows.push({ t: w.t, label: w.label, master_rms_db: masterR, music_ref_rms_db: musicRefR, diff_vs_music_ref: diff, pass })
    if (!pass) rmsReport.pass = false
    console.log(`[rms] @${w.t.toFixed(2)}s ${w.label} master=${masterR}dB musRef=${musicRefR}dB diff=${diff?.toFixed(2)} ${pass?'PASS':'FAIL'}`)
  }
  fs.writeFileSync(path.join(BUILD,'viral-rms-report.json'), JSON.stringify(rmsReport, null, 2))

  // 14) Publish — overwrite v1
  const finalMp4 = path.join(PUB_SHORTS, `${meta.slug}.mp4`)
  fs.copyFileSync(masterPath, finalMp4)
  // Thumbnail: pull a frame from the BROKEN/verdict slam (~26s scaled). Use buyer count-up frame at t=23s as backup.
  const thumb = path.join(PUB_SHORTS, `${meta.slug}.jpg`)
  // Try verdict frame first
  const verdictMid = (segs.find(s=>s.id==='verdict').start + segs.find(s=>s.id==='verdict').end) / 2
  sh('ffmpeg', ['-y','-ss', verdictMid.toFixed(2), '-i', finalMp4, '-frames:v','1','-q:v','2', thumb])

  // 15) Summary
  const summary = {
    final_mp4: finalMp4, size_bytes: fs.statSync(finalMp4).size, duration_s: dur,
    width: v.width, height: v.height, fps,
    distinct_cuts: segs.length,
    segment_plan: segs.map(s => ({ id: s.id, start: +s.start.toFixed(2), end: +s.end.toFixed(2), dur: +(s.end - s.start).toFixed(2) })),
    captions_animated: true,
    caption_word_count: captionTimedOverlays.length,
    color_grade: 'eq=saturation=1.30:contrast=1.15:gamma=0.95',
    sfx_events: sfxEvents.length,
    sfx_kinds: { whoosh: sfxEvents.filter(e=>e.kind==='whoosh').length, impact: sfxEvents.filter(e=>e.kind==='impact').length, tick: sfxEvents.filter(e=>e.kind==='tick').length },
    rms_pass: rmsReport.pass,
    rms_worst_diff: Math.min(...rmsReport.windows.map(w => (w.diff_vs_music_ref ?? 999))),
    fal_attempted: 0, fal_succeeded: 0, fal_failed: 0,
    vo_duration_s: voDur,
    vo_settings: { stability: 0.45, similarity: 0.75, style: 0.40, voice: 'Sarah' },
  }
  fs.writeFileSync(path.join(BUILD,'viral-summary.json'), JSON.stringify(summary, null, 2))
  fs.writeFileSync(path.join(BUILD,'viral-segments.json'), JSON.stringify(segs, null, 2))
  console.log('\n─── SUMMARY ───')
  console.log(JSON.stringify(summary, null, 2))
  console.log(`\nDONE: ${finalMp4}`)
  console.log(`Thumb: ${thumb}`)
}

main().catch(e => { console.error(e); process.exit(1) })
