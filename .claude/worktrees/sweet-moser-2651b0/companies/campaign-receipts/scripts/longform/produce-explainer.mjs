#!/usr/bin/env node
/**
 * produce-explainer.mjs — long-form (1920x1080) explainer renderer.
 *
 * Adapted from scripts/shorts/produce-viral-001.mjs. Differences:
 *   - 1920x1080 (was 1080x1920)
 *   - 10 scenes, hold 4-8 sec each (was 1-3 sec)
 *   - Sarah-teacher TTS cadence: stability=0.55, similarity=0.75, style=0.20,
 *     model=eleven_multilingual_v2 (was viral cadence on turbo)
 *   - Persistent 100px bottom bar SEALED2016.COM (was 60px)
 *   - Subscribe-bell overlay at 0:30 (was 0:05)
 *   - End card: book grades all 145 promises
 *   - No fal.ai; SVG/ffmpeg only
 *   - Audio mix unchanged recipe: threshold=0.03, ratio=20, attack=120, release=500
 *     voice -16 LUFS, music -22 LUFS, >=8dB differential verified by RMS scan
 *
 * Inputs:
 *   eng/longform-scripts/sealed-iran-deal.md (canonical script — VO embedded)
 *
 * Outputs:
 *   scripts/longform/_build/iran-deal/vo.mp3
 *   scripts/longform/_build/iran-deal/master.mp4
 *   scripts/longform/_build/iran-deal/rms-report.json
 *   scripts/longform/_build/iran-deal/summary.json
 *   public/longform/sealed-aipac-iran-deal.mp4
 *   public/longform/sealed-aipac-iran-deal.jpg
 *
 * Usage:
 *   node scripts/longform/produce-explainer.mjs
 *   node scripts/longform/produce-explainer.mjs --skip-tts
 */

import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'

const REPO = '/Applications/DrAntoniou Projects/AgentCompanies'
const CR = `${REPO}/companies/campaign-receipts`
const BUILD = `${CR}/scripts/longform/_build/iran-deal`
const PUB = `${CR}/public/longform`
const MUSIC = `${REPO}/companies/concise-sealed/public/movie/_build_v4/music.mp3`
const COST_LOG = `${CR}/scripts/longform/.external-costs.jsonl`
const SCRIPT_MD = `${CR}/eng/longform-scripts/sealed-iran-deal.md`
const SLUG = 'sealed-aipac-iran-deal'
const W = 1920, H = 1080, FPS = 30

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
function sh(cmd, a) {
  const r = spawnSync(cmd, a, { stdio: 'inherit' })
  if (r.status !== 0) { console.error(`FAIL: ${cmd} ${a.slice(0,4).join(' ')}…`); process.exit(r.status || 1) }
}
function shCap(cmd, a) {
  const r = spawnSync(cmd, a, { encoding: 'utf8' })
  return { stdout: r.stdout || '', stderr: r.stderr || '', status: r.status }
}
function probeDur(f) {
  return parseFloat(shCap('ffprobe', ['-v','error','-show_entries','format=duration','-of','default=nw=1:nk=1', f]).stdout.trim())
}
function logCost(piece, vendor, usd, note) {
  fs.mkdirSync(path.dirname(COST_LOG), { recursive: true })
  fs.appendFileSync(COST_LOG, JSON.stringify({ ts: new Date().toISOString(), piece, vendor, cost_usd: +usd.toFixed(4), note }) + '\n')
}
function xml(s) { return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;') }
function svgToPng(svg, png, w, h) {
  const svgP = png.replace(/\.png$/, '.svg')
  fs.writeFileSync(svgP, svg)
  sh('rsvg-convert', ['-w', String(w), '-h', String(h), svgP, '-o', png])
}

// ── color palette ──────────────────────────────────────────────────────────
const C = {
  cream:  'rgb(250,247,239)',
  paper:  'rgb(244,238,222)',
  ink:    '#1a2b4a',
  red:    '#A11B1B',
  redD:   '#7a1010',
  green:  '#2A7A3E',
  gold:   '#C8861D',
  navy:   '#0d2240',
  black:  '#0a0a0a',
  white:  '#ffffff',
}

// ── VO extraction from script ──────────────────────────────────────────────
// Pull the **VO:** lines from the script markdown. Each scene's VO becomes one
// paragraph in the synth input, separated by short pauses so cadence breathes.
function extractVOFromScript(md) {
  const lines = md.split('\n')
  const scenes = []
  let curHeader = null
  for (const ln of lines) {
    const hm = ln.match(/^##\s+Scene\s+(\d+)\s+—\s+(.+?)\s+\((\d+:\d+)[–-](\d+:\d+)\)/)
    if (hm) { curHeader = { n: +hm[1], title: hm[2], start: hm[3], end: hm[4] }; continue }
    const vm = ln.match(/^\*\*VO:\*\*\s*"(.+)"\s*$/)
    if (vm && curHeader) {
      scenes.push({ ...curHeader, vo: vm[1].replace(/\\"/g, '"') })
      curHeader = null
    }
  }
  return scenes
}

// ── TTS (Sarah teacher cadence) ────────────────────────────────────────────
async function synthesizeVo(voText, outPath) {
  const apiKey = env.ELEVENLABS_API_KEY || env.NT_ELEVENLABS_API_KEY
  if (!apiKey) { console.error('No ELEVENLABS_API_KEY'); process.exit(1) }
  const voiceId = env.CR_LONGFORM_VOICE_ID || 'EXAVITQu4vr4xnSDxMaL'
  const stability = 0.55, similarity = 0.75, style = 0.20
  const body = {
    text: voText,
    model_id: 'eleven_multilingual_v2',
    voice_settings: { stability, similarity_boost: similarity, style, use_speaker_boost: true },
  }
  console.log(`[tts] ${voText.length} chars → ElevenLabs Sarah teacher (stab=${stability}, sim=${similarity}, style=${style}, model=eleven_multilingual_v2)`)
  const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: 'POST',
    headers: { 'xi-api-key': apiKey, 'Content-Type': 'application/json', 'Accept': 'audio/mpeg' },
    body: JSON.stringify(body),
  })
  if (!r.ok) { console.error(`ElevenLabs HTTP ${r.status}: ${(await r.text()).slice(0,400)}`); process.exit(1) }
  fs.writeFileSync(outPath, Buffer.from(await r.arrayBuffer()))
  const cost = voText.length / 1000 * 0.30  // multilingual_v2 ~ $0.30/1k chars
  logCost('sealed-iran-deal-longform', 'elevenlabs', cost, `chars=${voText.length} multilingual_v2 teacher`)
  console.log(`[tts] wrote ${outPath}, ~$${cost.toFixed(3)}`)
}

// ── persistent overlay (100px bottom bar) ──────────────────────────────────
function persistentBarSvg() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect x="0" y="${H-100}" width="${W}" height="100" fill="${C.paper}" opacity="0.92"/>
  <rect x="0" y="${H-100}" width="${W}" height="3" fill="${C.red}"/>
  <text x="60" y="${H-40}" font-family="Menlo, Monaco, monospace" font-weight="700"
    font-size="34" fill="${C.red}" letter-spacing="6">SEALED2016.COM</text>
  <text x="${W-60}" y="${H-40}" text-anchor="end" font-family="Georgia, serif" font-style="italic"
    font-size="26" fill="#5a4a3a">the 2016 promises, on the record</text>
</svg>`
}

function subscribeBellSvg() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="560" height="120" viewBox="0 0 560 120">
  <rect x="0" y="0" width="560" height="120" rx="14" fill="${C.ink}" opacity="0.94"/>
  <rect x="0" y="0" width="560" height="120" rx="14" fill="none" stroke="${C.gold}" stroke-width="3"/>
  <g transform="translate(50, 60)">
    <path d="M -22 -18 Q -22 -36 0 -36 Q 22 -36 22 -18 L 22 8 L 30 18 L -30 18 L -22 8 Z"
      fill="${C.gold}" stroke="${C.gold}" stroke-width="2"/>
    <circle cx="0" cy="26" r="6" fill="${C.gold}"/>
  </g>
  <text x="100" y="55" font-family="Helvetica, sans-serif" font-weight="900" font-size="32" fill="${C.white}" letter-spacing="3">SUBSCRIBE</text>
  <text x="100" y="92" font-family="Helvetica, sans-serif" font-weight="500" font-size="22" fill="${C.gold}">new receipts drop daily</text>
</svg>`
}

// ── scene SVG generators (10 scenes) ───────────────────────────────────────
function sceneTitleBlock(eyebrow, big1, big2, footer) {
  return `
  <text x="${W/2}" y="240" text-anchor="middle"
    font-family="Helvetica, sans-serif" font-weight="700" font-size="36"
    fill="${C.red}" letter-spacing="8">${xml(eyebrow)}</text>
  <text x="${W/2}" y="430" text-anchor="middle"
    font-family="Helvetica, sans-serif" font-weight="900" font-size="${big2 ? 120 : 140}"
    fill="${C.ink}" letter-spacing="4">${xml(big1)}</text>
  ${big2 ? `<text x="${W/2}" y="570" text-anchor="middle"
    font-family="Helvetica, sans-serif" font-weight="900" font-size="120"
    fill="${C.ink}" letter-spacing="4">${xml(big2)}</text>` : ''}
  ${footer ? `<text x="${W/2}" y="${big2 ? 700 : 580}" text-anchor="middle"
    font-family="Georgia, serif" font-style="italic" font-size="40"
    fill="#5a4a3a">${xml(footer)}</text>` : ''}`
}

// 1) HOOK — six flags, US X'd out
function svgScene1() {
  const flags = [
    { label: 'US',     x: 280,  fill: '#bf0a30', stripe: true },
    { label: 'UK',     x: 540,  fill: '#012169' },
    { label: 'FRANCE', x: 800,  fill: '#0055a4' },
    { label: 'GERMANY',x: 1060, fill: '#000000' },
    { label: 'RUSSIA', x: 1320, fill: '#ffffff', stroke: true },
    { label: 'CHINA',  x: 1580, fill: '#de2910' },
  ]
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="${C.navy}"/>
  <text x="${W/2}" y="180" text-anchor="middle"
    font-family="Helvetica, sans-serif" font-weight="900" font-size="78"
    fill="${C.white}" letter-spacing="6">WHO PAID TO KILL</text>
  <text x="${W/2}" y="280" text-anchor="middle"
    font-family="Helvetica, sans-serif" font-weight="900" font-size="78"
    fill="${C.gold}" letter-spacing="6">THE IRAN DEAL</text>
  ${flags.map(f => `
    <g transform="translate(${f.x}, 540)">
      <rect x="-90" y="-60" width="180" height="120" fill="${f.fill}" ${f.stroke ? `stroke="${C.white}" stroke-width="3"` : ''}/>
      ${f.label === 'US' ? `
        <line x1="-90" y1="-60" x2="90" y2="60" stroke="${C.red}" stroke-width="22"/>
        <line x1="90" y1="-60" x2="-90" y2="60" stroke="${C.red}" stroke-width="22"/>` : ''}
      <text x="0" y="100" text-anchor="middle" font-family="Helvetica, sans-serif" font-weight="700"
        font-size="22" fill="${C.white}" letter-spacing="2">${f.label}</text>
    </g>`).join('')}
  <text x="${W/2}" y="800" text-anchor="middle"
    font-family="Georgia, serif" font-style="italic" font-size="34"
    fill="#9aaad0">2015 — seven countries signed. 2018 — one walked out alone.</text>
</svg>`
}

// 2) JCPOA explainer — 3.67% vs 90% bar chart
function svgScene2() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="${C.cream}"/>
  ${sceneTitleBlock('THE DEAL, IN PLAIN ENGLISH', 'JCPOA', null, 'Joint Comprehensive Plan of Action')}
  <g transform="translate(${W/2 - 350}, 700)">
    <rect x="0" y="-80" width="280" height="80" fill="${C.green}"/>
    <text x="140" y="-100" text-anchor="middle" font-family="Helvetica, sans-serif" font-weight="900" font-size="40" fill="${C.green}">3.67%</text>
    <text x="140" y="40" text-anchor="middle" font-family="Helvetica, sans-serif" font-weight="700" font-size="22" fill="${C.ink}">DEAL CAP</text>
  </g>
  <g transform="translate(${W/2 + 70}, 380)">
    <rect x="0" y="0" width="280" height="320" fill="${C.red}"/>
    <text x="140" y="-20" text-anchor="middle" font-family="Helvetica, sans-serif" font-weight="900" font-size="40" fill="${C.red}">90%</text>
    <text x="140" y="360" text-anchor="middle" font-family="Helvetica, sans-serif" font-weight="700" font-size="22" fill="${C.ink}">WEAPONS-GRADE</text>
  </g>
</svg>`
}

// 3) Promise #73
function svgScene3() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="${C.cream}"/>
  <text x="${W/2}" y="240" text-anchor="middle" font-family="Georgia, serif" font-style="italic" font-size="44" fill="#5a4a3a">2016 campaign promise</text>
  <text x="${W/2}" y="420" text-anchor="middle" font-family="Georgia, serif" font-weight="900" font-size="240" fill="${C.red}" letter-spacing="-8">#73</text>
  <line x1="${W/2 - 360}" y1="500" x2="${W/2 + 360}" y2="500" stroke="${C.ink}" stroke-width="4"/>
  <text x="${W/2}" y="640" text-anchor="middle" font-family="Helvetica, sans-serif" font-weight="900" font-size="78" fill="${C.ink}" letter-spacing="3">TEAR UP THE</text>
  <text x="${W/2}" y="740" text-anchor="middle" font-family="Helvetica, sans-serif" font-weight="900" font-size="78" fill="${C.ink}" letter-spacing="3">IRAN NUCLEAR DEAL</text>
</svg>`
}

// 4) Withdrawal — May 8, 2018 (faux federal-register style)
function svgScene4() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="#1a1a1a"/>
  <g transform="translate(${W/2}, 460)">
    <rect x="-560" y="-300" width="1120" height="600" fill="${C.cream}" stroke="#8a7a4a" stroke-width="3"/>
    <circle cx="0" cy="-220" r="50" fill="none" stroke="${C.ink}" stroke-width="3"/>
    <text x="0" y="-210" text-anchor="middle" font-family="Georgia, serif" font-weight="900" font-size="18" fill="${C.ink}">SEAL</text>
    <text x="0" y="-130" text-anchor="middle" font-family="Georgia, serif" font-style="italic" font-size="28" fill="#5a4a3a">The White House</text>
    <text x="0" y="-60" text-anchor="middle" font-family="Georgia, serif" font-weight="900" font-size="48" fill="${C.ink}" letter-spacing="4">WITHDRAWAL FROM THE JCPOA</text>
    <line x1="-440" y1="-20" x2="440" y2="-20" stroke="${C.ink}" stroke-width="2"/>
    <text x="0" y="80" text-anchor="middle" font-family="Helvetica, sans-serif" font-weight="900" font-size="96" fill="${C.red}" letter-spacing="6">MAY 8, 2018</text>
    <text x="0" y="160" text-anchor="middle" font-family="Georgia, serif" font-style="italic" font-size="26" fill="#5a4a3a">Diplomatic Reception Room — signed memorandum</text>
    <g transform="translate(360, 220) rotate(8)">
      <rect x="-140" y="-46" width="280" height="92" fill="none" stroke="${C.red}" stroke-width="6"/>
      <text x="0" y="14" text-anchor="middle" font-family="Helvetica, sans-serif" font-weight="900" font-size="56" fill="${C.red}" letter-spacing="4">SIGNED</text>
    </g>
  </g>
  <text x="${W/2}" y="900" text-anchor="middle" font-family="Helvetica, sans-serif" font-weight="700" font-size="32" fill="${C.gold}" letter-spacing="8">US WITHDRAWAL — EVERY OTHER COUNTRY STAYED IN</text>
</svg>`
}

// 5) AIPAC three priorities — three numbered cards
function svgScene5() {
  const cards = [
    { n: '1', t: 'KILL THE',       t2: 'IRAN DEAL' },
    { n: '2', t: 'MOVE EMBASSY',   t2: 'TO JERUSALEM' },
    { n: '3', t: 'EXPAND ANTI-',   t2: 'SEMITISM DEF.' },
  ]
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="${C.cream}"/>
  <text x="${W/2}" y="160" text-anchor="middle" font-family="Helvetica, sans-serif" font-weight="700" font-size="34" fill="${C.red}" letter-spacing="8">AIPAC PUBLISHED PRIORITIES</text>
  <text x="${W/2}" y="220" text-anchor="middle" font-family="Georgia, serif" font-style="italic" font-size="28" fill="#5a4a3a">American Israel Public Affairs Committee — three asks, on the record</text>
  ${cards.map((c, i) => {
    const cx = 380 + i * 580
    return `
    <g transform="translate(${cx}, 540)">
      <rect x="-220" y="-260" width="440" height="520" fill="${C.paper}" stroke="${C.ink}" stroke-width="4"/>
      <text x="0" y="-150" text-anchor="middle" font-family="Georgia, serif" font-style="italic" font-size="32" fill="#5a4a3a">priority</text>
      <text x="0" y="40" text-anchor="middle" font-family="Georgia, serif" font-weight="900" font-size="240" fill="${C.red}" letter-spacing="-8">${c.n}</text>
      <line x1="-160" y1="80" x2="160" y2="80" stroke="${C.ink}" stroke-width="3"/>
      <text x="0" y="160" text-anchor="middle" font-family="Helvetica, sans-serif" font-weight="900" font-size="32" fill="${C.ink}">${xml(c.t)}</text>
      <text x="0" y="210" text-anchor="middle" font-family="Helvetica, sans-serif" font-weight="900" font-size="32" fill="${C.ink}">${xml(c.t2)}</text>
    </g>`
  }).join('')}
</svg>`
}

// 6) Three for three — KEPT stamps
function svgScene6() {
  const stamps = [
    { date: '5/8/18',   label: 'JCPOA WITHDRAWAL' },
    { date: '5/14/18',  label: 'JERUSALEM EMBASSY' },
    { date: '12/11/19', label: 'EO 13899' },
  ]
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="${C.paper}"/>
  <text x="${W/2}" y="150" text-anchor="middle" font-family="Helvetica, sans-serif" font-weight="900" font-size="62" fill="${C.ink}" letter-spacing="4">THREE FOR THREE</text>
  <text x="${W/2}" y="210" text-anchor="middle" font-family="Georgia, serif" font-style="italic" font-size="32" fill="#5a4a3a">the published list, executed in order, inside 18 months</text>
  ${stamps.map((s, i) => {
    const cx = 380 + i * 580
    const rot = [-8, 6, -4][i]
    return `
    <g transform="translate(${cx}, 580) rotate(${rot})">
      <rect x="-240" y="-150" width="480" height="300" fill="none" stroke="${C.red}" stroke-width="10" opacity="0.9"/>
      <rect x="-240" y="-150" width="480" height="300" fill="none" stroke="${C.red}" stroke-width="4" opacity="0.5"/>
      <text x="0" y="-30" text-anchor="middle" font-family="Helvetica, sans-serif" font-weight="900" font-size="58" fill="${C.red}" letter-spacing="4">${xml(s.date)}</text>
      <text x="0" y="60" text-anchor="middle" font-family="Helvetica, sans-serif" font-weight="900" font-size="120" fill="${C.red}" letter-spacing="6">KEPT</text>
      <text x="0" y="120" text-anchor="middle" font-family="Helvetica, sans-serif" font-weight="700" font-size="22" fill="${C.ink}" letter-spacing="2">${xml(s.label)}</text>
    </g>`
  }).join('')}
</svg>`
}

// 7) Adelson buyer reveal — silhouette + $82M / $218M
function svgScene7() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <radialGradient id="spot7" cx="0.3" cy="0.4" r="0.6">
      <stop offset="0%" stop-color="#3a2a1a"/>
      <stop offset="100%" stop-color="#080404"/>
    </radialGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#spot7)"/>
  <g transform="translate(420, 540)">
    <ellipse cx="0" cy="-30" r="160" fill="#1a1208"/>
    <path d="M -260 240 Q -260 80 -140 70 Q 0 30 140 70 Q 260 80 260 240 L 260 360 L -260 360 Z" fill="#1a1208"/>
    <circle cx="-62" cy="-50" r="38" fill="none" stroke="#3a2a18" stroke-width="6"/>
    <circle cx="62" cy="-50" r="38" fill="none" stroke="#3a2a18" stroke-width="6"/>
    <line x1="-24" y1="-50" x2="24" y2="-50" stroke="#3a2a18" stroke-width="6"/>
  </g>
  <text x="900" y="200" font-family="Helvetica, sans-serif" font-weight="700" font-size="36" fill="${C.gold}" letter-spacing="8">THE BUYER</text>
  <text x="900" y="300" font-family="Helvetica, sans-serif" font-weight="900" font-size="100" fill="${C.white}" letter-spacing="3">SHELDON</text>
  <text x="900" y="400" font-family="Helvetica, sans-serif" font-weight="900" font-size="100" fill="${C.white}" letter-spacing="3">ADELSON</text>
  <text x="900" y="460" font-family="Georgia, serif" font-style="italic" font-size="28" fill="#cccccc">casino billionaire — largest individual GOP donor of his era</text>
  <text x="900" y="600" font-family="Helvetica, sans-serif" font-weight="700" font-size="26" fill="#cccccc" letter-spacing="4">2016 CYCLE</text>
  <text x="900" y="700" font-family="Helvetica, sans-serif" font-weight="900" font-size="120" fill="${C.gold}" letter-spacing="-2">$82M</text>
  <text x="900" y="780" font-family="Helvetica, sans-serif" font-weight="700" font-size="26" fill="#cccccc" letter-spacing="4">LIFETIME TO GOP</text>
  <text x="900" y="880" font-family="Helvetica, sans-serif" font-weight="900" font-size="120" fill="${C.gold}" letter-spacing="-2">$218M</text>
</svg>`
}

// 8) Fairness — split screen, "we follow the paper"
function svgScene8() {
  const dems = ['Soros', 'Bloomberg', 'Steyer', 'Saban', 'Hoffman']
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="${C.cream}"/>
  <line x1="${W/2}" y1="120" x2="${W/2}" y2="${H-140}" stroke="${C.ink}" stroke-width="3" stroke-dasharray="12,8"/>
  <text x="${W/4}" y="180" text-anchor="middle" font-family="Helvetica, sans-serif" font-weight="700" font-size="30" fill="#5a4a3a" letter-spacing="6">DEMOCRATIC MEGA-DONORS</text>
  <text x="${W/4}" y="240" text-anchor="middle" font-family="Georgia, serif" font-style="italic" font-size="24" fill="#5a4a3a">comparable magnitudes</text>
  ${dems.map((d, i) => `<text x="${W/4}" y="${340 + i*70}" text-anchor="middle" font-family="Georgia, serif" font-weight="700" font-size="46" fill="${C.ink}">${d}</text>`).join('')}
  <text x="${3*W/4}" y="180" text-anchor="middle" font-family="Helvetica, sans-serif" font-weight="700" font-size="30" fill="${C.red}" letter-spacing="6">THE ADELSON RECEIPT</text>
  <text x="${3*W/4}" y="240" text-anchor="middle" font-family="Georgia, serif" font-style="italic" font-size="24" fill="#5a4a3a">unusually clean three-for-three</text>
  <g transform="translate(${3*W/4}, 360)">
    <rect x="-220" y="-30" width="440" height="80" fill="${C.paper}" stroke="${C.red}" stroke-width="3"/>
    <text x="0" y="24" text-anchor="middle" font-family="Helvetica, sans-serif" font-weight="900" font-size="28" fill="${C.red}">$82M → IRAN DEAL ENDED</text>
  </g>
  <g transform="translate(${3*W/4}, 470)">
    <rect x="-220" y="-30" width="440" height="80" fill="${C.paper}" stroke="${C.red}" stroke-width="3"/>
    <text x="0" y="24" text-anchor="middle" font-family="Helvetica, sans-serif" font-weight="900" font-size="28" fill="${C.red}">→ EMBASSY MOVED</text>
  </g>
  <g transform="translate(${3*W/4}, 580)">
    <rect x="-220" y="-30" width="440" height="80" fill="${C.paper}" stroke="${C.red}" stroke-width="3"/>
    <text x="0" y="24" text-anchor="middle" font-family="Helvetica, sans-serif" font-weight="900" font-size="28" fill="${C.red}">→ ANTI-SEMITISM EO</text>
  </g>
  <text x="${W/2}" y="820" text-anchor="middle" font-family="Georgia, serif" font-style="italic" font-size="44" fill="${C.ink}">we follow the paper.</text>
</svg>`
}

// 9) Enrichment after withdrawal — chart 3.67% → 60% → 90%
function svgScene9() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="${C.cream}"/>
  <text x="${W/2}" y="160" text-anchor="middle" font-family="Helvetica, sans-serif" font-weight="900" font-size="58" fill="${C.ink}" letter-spacing="3">THE DEAL GOT TORN UP.</text>
  <text x="${W/2}" y="230" text-anchor="middle" font-family="Helvetica, sans-serif" font-weight="900" font-size="58" fill="${C.red}" letter-spacing="3">THE PROGRAM GOT BIGGER.</text>
  <line x1="200" y1="800" x2="${W-200}" y2="800" stroke="${C.ink}" stroke-width="4"/>
  <line x1="220" y1="320" x2="220" y2="800" stroke="${C.ink}" stroke-width="4"/>
  <line x1="200" y1="370" x2="${W-200}" y2="370" stroke="${C.red}" stroke-width="3" stroke-dasharray="14,10"/>
  <text x="${W-220}" y="358" text-anchor="end" font-family="Helvetica, sans-serif" font-weight="900" font-size="32" fill="${C.red}">WEAPONS-GRADE 90%</text>
  <g transform="translate(420, 0)">
    <rect x="0" y="780" width="180" height="20" fill="${C.green}"/>
    <text x="90" y="760" text-anchor="middle" font-family="Helvetica, sans-serif" font-weight="900" font-size="36" fill="${C.green}">3.67%</text>
    <text x="90" y="870" text-anchor="middle" font-family="Helvetica, sans-serif" font-weight="700" font-size="22" fill="${C.ink}">UNDER DEAL</text>
  </g>
  <g transform="translate(840, 0)">
    <rect x="0" y="550" width="180" height="250" fill="${C.red}"/>
    <text x="90" y="530" text-anchor="middle" font-family="Helvetica, sans-serif" font-weight="900" font-size="36" fill="${C.red}">60%</text>
    <text x="90" y="870" text-anchor="middle" font-family="Helvetica, sans-serif" font-weight="700" font-size="22" fill="${C.ink}">BY 2021 (POST-WITHDRAWAL)</text>
  </g>
  <g transform="translate(1260, 0)">
    <rect x="0" y="370" width="180" height="430" fill="${C.ink}" opacity="0.25"/>
    <text x="90" y="358" text-anchor="middle" font-family="Helvetica, sans-serif" font-weight="900" font-size="36" fill="${C.ink}">90%</text>
    <text x="90" y="870" text-anchor="middle" font-family="Helvetica, sans-serif" font-weight="700" font-size="22" fill="${C.ink}">WEAPONS-GRADE</text>
  </g>
</svg>`
}

// 10) Verdict + end card
function svgScene10() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="${C.cream}"/>
  <text x="${W/2}" y="170" text-anchor="middle" font-family="Georgia, serif" font-style="italic" font-size="40" fill="#5a4a3a">promise #73 — tear up the Iran nuclear deal</text>
  <g transform="translate(${W/2}, 380) rotate(-4)">
    <rect x="-380" y="-130" width="760" height="260" fill="none" stroke="${C.red}" stroke-width="14" opacity="0.92"/>
    <text x="0" y="50" text-anchor="middle" font-family="Helvetica, sans-serif" font-weight="900" font-size="200" fill="${C.red}" letter-spacing="20">KEPT</text>
  </g>
  <text x="${W/2}" y="650" text-anchor="middle" font-family="Helvetica, sans-serif" font-weight="700" font-size="44" fill="${C.ink}" letter-spacing="3">THE BOOK GRADES ALL 145 PROMISES LIKE THIS</text>
  <text x="${W/2}" y="730" text-anchor="middle" font-family="Georgia, serif" font-style="italic" font-size="30" fill="#5a4a3a">same standard. same receipts.</text>
  <text x="${W/2}" y="870" text-anchor="middle" font-family="Menlo, monospace" font-weight="900" font-size="80" fill="${C.red}" letter-spacing="6">SEALED2016.COM</text>
  <text x="${W/2}" y="930" text-anchor="middle" font-family="Helvetica, sans-serif" font-weight="700" font-size="28" fill="${C.gold}" letter-spacing="6">SUBSCRIBE — NEW RECEIPTS DROP DAILY</text>
</svg>`
}

const SCENE_BUILDERS = [svgScene1, svgScene2, svgScene3, svgScene4, svgScene5, svgScene6, svgScene7, svgScene8, svgScene9, svgScene10]

// ── parse mm:ss to seconds ─────────────────────────────────────────────────
function ts(mmss) { const [m, s] = mmss.split(':').map(Number); return m * 60 + s }

// ── main pipeline ──────────────────────────────────────────────────────────
async function main() {
  fs.mkdirSync(BUILD, { recursive: true })
  fs.mkdirSync(PUB, { recursive: true })

  // 1) Extract VO from canonical script
  const md = fs.readFileSync(SCRIPT_MD, 'utf8')
  const scenes = extractVOFromScript(md)
  if (scenes.length !== 10) {
    console.error(`Expected 10 scenes from script, got ${scenes.length}.`)
    process.exit(1)
  }
  console.log(`[script] parsed ${scenes.length} scenes from ${SCRIPT_MD}`)
  scenes.forEach(s => console.log(`  scene ${s.n} (${s.start}-${s.end}) ${s.vo.length} chars`))

  // 2) Per-scene TTS (so we can place exact audio under exact visual hold)
  // Inter-scene gap: 0.35s of silence to give the cut a breath.
  const voDir = path.join(BUILD, 'vo')
  fs.mkdirSync(voDir, { recursive: true })
  const scenePaths = []
  let totalChars = 0
  for (const s of scenes) {
    const p = path.join(voDir, `scene-${String(s.n).padStart(2,'0')}.mp3`)
    scenePaths.push(p)
    totalChars += s.vo.length
    if (SKIP_TTS && fs.existsSync(p)) {
      console.log(`[tts] skip scene ${s.n} — reusing ${p}`)
      continue
    }
    await synthesizeVo(s.vo, p)
  }
  console.log(`[tts] total VO chars across 10 scenes: ${totalChars}`)

  // 3) Probe each scene's VO duration, derive hold = vo + 0.35s pad
  const sceneDurs = scenePaths.map(p => probeDur(p))
  const PAD = 0.35
  const holds = sceneDurs.map(d => d + PAD)
  const totalDur = holds.reduce((a, b) => a + b, 0)
  console.log(`[plan] per-scene durations (incl ${PAD}s pad):`)
  scenes.forEach((s, i) => console.log(`  scene ${s.n}: vo=${sceneDurs[i].toFixed(2)}s hold=${holds[i].toFixed(2)}s`))
  console.log(`[plan] total runtime ≈ ${totalDur.toFixed(2)}s (target 240-270s)`)

  // 4) Render each scene PNG, then ken-burns motion clip
  const cardsDir = path.join(BUILD, 'cards')
  fs.mkdirSync(cardsDir, { recursive: true })
  const persistPng = path.join(cardsDir, 'persistent-bar.png')
  svgToPng(persistentBarSvg(), persistPng, W, H)
  const bellPng = path.join(cardsDir, 'subscribe-bell.png')
  svgToPng(subscribeBellSvg(), bellPng, 560, 120)

  const cardPng = (i) => path.join(cardsDir, `scene-${String(i+1).padStart(2,'0')}.png`)
  for (let i = 0; i < 10; i++) {
    svgToPng(SCENE_BUILDERS[i](), cardPng(i), W, H)
  }

  // 5) Per-scene motion clip with persistent bottom bar burned in
  const clipsDir = path.join(BUILD, 'clips')
  fs.mkdirSync(clipsDir, { recursive: true })
  const sceneClipPath = (i) => path.join(clipsDir, `scene-${String(i+1).padStart(2,'0')}.mp4`)
  for (let i = 0; i < 10; i++) {
    const dur = holds[i]
    const frames = Math.max(2, Math.round(dur * FPS))
    // gentle alternating ken-burns: even scenes push in, odd push out
    const perFrame = 0.08 / frames
    const z = (i % 2 === 0)
      ? `zoompan=z='1.0+on*${perFrame.toFixed(6)}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${frames}:s=${W}x${H}:fps=${FPS}`
      : `zoompan=z='1.08-on*${perFrame.toFixed(6)}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${frames}:s=${W}x${H}:fps=${FPS}`
    // chain: scale up source (rsvg renders at exact W×H; double for crop quality), ken-burns, overlay persistent bar
    const vf = `[0:v]scale=${W*2}:${H*2}:force_original_aspect_ratio=increase,crop=${W*2}:${H*2},${z},trim=duration=${dur},setpts=PTS-STARTPTS,format=yuv420p[bg];[bg][1:v]overlay=0:0:format=auto[vout]`
    sh('ffmpeg', ['-y',
      '-framerate', String(FPS), '-loop', '1', '-t', String(dur), '-i', cardPng(i),
      '-loop', '1', '-t', String(dur), '-i', persistPng,
      '-filter_complex', vf,
      '-map', '[vout]',
      '-r', String(FPS),
      '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-preset', 'fast', '-crf', '20', '-an',
      sceneClipPath(i),
    ])
    console.log(`[clip] scene ${i+1} → ${dur.toFixed(2)}s`)
  }

  // 6) Concat into pre-overlay master
  const concatList = path.join(BUILD, 'concat.txt')
  fs.writeFileSync(concatList, Array.from({length: 10}, (_,i) => `file '${sceneClipPath(i)}'`).join('\n') + '\n')
  const concatPath = path.join(BUILD, 'visual-concat.mp4')
  sh('ffmpeg', ['-y', '-f', 'concat', '-safe', '0', '-i', concatList,
    '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-preset', 'fast', '-crf', '20', '-r', String(FPS), '-an', concatPath])

  // 7) Burn subscribe-bell at 0:30 mark for 5 seconds (top-right area to avoid bottom bar)
  const visualPath = path.join(BUILD, 'visual.mp4')
  sh('ffmpeg', ['-y',
    '-i', concatPath,
    '-i', bellPng,
    '-filter_complex', `[0:v][1:v]overlay=${W - 600}:60:enable='between(t,30,35)'[vout]`,
    '-map', '[vout]',
    '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-preset', 'fast', '-crf', '20', '-r', String(FPS),
    visualPath,
  ])

  // 8) Stitch scene VOs into one continuous voice track with 0.35s gaps
  const voConcatList = path.join(BUILD, 'vo-concat.txt')
  // For pad we need silence segments; build via ffmpeg adelay+concat or use anullsrc
  // Easier: re-encode each scene with PAD silence appended via apad, then concat.
  const voPaddedDir = path.join(BUILD, 'vo-padded')
  fs.mkdirSync(voPaddedDir, { recursive: true })
  const voPadded = []
  for (let i = 0; i < scenePaths.length; i++) {
    const out = path.join(voPaddedDir, `s${String(i+1).padStart(2,'0')}.m4a`)
    sh('ffmpeg', ['-y', '-i', scenePaths[i],
      '-af', `apad=pad_dur=${PAD},atrim=0:${holds[i]}`,
      '-c:a', 'aac', '-b:a', '192k', out])
    voPadded.push(out)
  }
  fs.writeFileSync(voConcatList, voPadded.map(p => `file '${p}'`).join('\n') + '\n')
  const voFullPath = path.join(BUILD, 'vo-full.m4a')
  sh('ffmpeg', ['-y', '-f', 'concat', '-safe', '0', '-i', voConcatList, '-c:a', 'aac', '-b:a', '192k', voFullPath])
  const voFullDur = probeDur(voFullPath)
  console.log(`[vo] full track ${voFullDur.toFixed(2)}s`)

  // 9) Audio mix: voice (-16 LUFS) + music (-22 LUFS sidechain ducked)
  // Recipe from script: threshold=0.03, ratio=20, attack=120, release=500
  // No music in first 0.5s (cold open punch).
  const fadeOutStart = Math.max(0, voFullDur - 1.2)
  // Music bed kept low under speech to guarantee >=8 dB voice/music differential.
  // volume=0.18 (post-loudnorm -22) lands music around -28 dB RMS; voice loudnorm I=-16 + volume=1.5
  // lands voice around -16 dB RMS → ~12 dB headroom even before sidechain ducking.
  const aFilter =
    `[0:a]loudnorm=I=-16:TP=-1.5:LRA=7,volume=1.5,apad[voice];` +
    `[1:a]aloop=loop=-1:size=2e9,atrim=0:${voFullDur + 2},` +
    `loudnorm=I=-22:TP=-3:LRA=11,volume=0.18,` +
    `afade=t=in:st=0.5:d=0.6,afade=t=out:st=${fadeOutStart.toFixed(2)}:d=1.2[mu];` +
    `[mu][voice]sidechaincompress=threshold=0.03:ratio=20:attack=120:release=500:level_sc=4[mud];` +
    `[voice][mud]amix=inputs=2:duration=longest:dropout_transition=0:weights=1.4 0.5,` +
    `alimiter=limit=0.95:level=disabled,atrim=0:${voFullDur}[aout]`
  const mixPath = path.join(BUILD, 'mix.m4a')
  sh('ffmpeg', ['-y', '-i', voFullPath, '-i', MUSIC,
    '-filter_complex', aFilter,
    '-map', '[aout]',
    '-c:a', 'aac', '-b:a', '192k', mixPath])

  // 10) Mux video + mix → master
  const masterPath = path.join(BUILD, 'master.mp4')
  sh('ffmpeg', ['-y', '-i', visualPath, '-i', mixPath,
    '-t', String(voFullDur),
    '-c:v', 'copy', '-c:a', 'copy', '-shortest', masterPath])
  console.log(`[master] wrote ${masterPath}`)

  // 11) ffprobe verify
  const info = JSON.parse(shCap('ffprobe', ['-v','error','-show_format','-show_streams','-of','json', masterPath]).stdout)
  const v = info.streams.find(s => s.codec_type === 'video')
  const a = info.streams.find(s => s.codec_type === 'audio')
  const dur = parseFloat(info.format.duration)
  const fps = eval(v.r_frame_rate)
  const sizeBytes = fs.statSync(masterPath).size
  console.log(`[ffprobe] ${v?.width}x${v?.height} @ ${fps}fps  ${dur.toFixed(2)}s  v=${!!v} a=${!!a}  ${(sizeBytes/1e6).toFixed(1)}MB`)
  if (v.width !== W || v.height !== H) { console.error(`DIMS FAIL: got ${v.width}x${v.height}, want ${W}x${H}`); process.exit(1) }
  if (dur < 230 || dur > 280) { console.error(`DURATION FAIL: ${dur.toFixed(2)}s — want 240-270s (tol 230-280)`); process.exit(1) }
  if (sizeBytes > 100 * 1024 * 1024) { console.error(`SIZE FAIL: ${sizeBytes} bytes > 100MB`); process.exit(1) }

  // 12) RMS scan — verify >=8dB voice/music differential at each scene's mid-VO window
  function rmsDb(file, start, dur_) {
    const r = shCap('ffmpeg', ['-hide_banner','-nostats','-ss', String(start), '-i', file, '-t', String(dur_),
      '-af','astats=metadata=1:reset=0','-f','null','-'])
    const m = [...(r.stderr || '').matchAll(/RMS level dB:\s*(-?\d+(?:\.\d+)?)/g)]
    if (!m.length) return null
    return parseFloat(m[m.length-1][1])
  }
  // Music-only reference (mirror the same processing chain w/o voice)
  const musicOnlyPath = path.join(BUILD, 'music-only.m4a')
  sh('ffmpeg', ['-y', '-i', MUSIC, '-filter_complex',
    `[0:a]aloop=loop=-1:size=2e9,atrim=0:${voFullDur + 2},` +
    `loudnorm=I=-22:TP=-3:LRA=11,volume=0.18,` +
    `afade=t=in:st=0.5:d=0.6,afade=t=out:st=${fadeOutStart.toFixed(2)}:d=1.2,atrim=0:${voFullDur}[a]`,
    '-map','[a]','-c:a','aac','-b:a','192k', musicOnlyPath])
  // Sample each scene at its midpoint
  let cursor = 0
  const rmsReport = { mode: 'master-vs-music-only-reference', target_diff_db: 8.0, windows: [], pass: true }
  for (let i = 0; i < 10; i++) {
    const mid = cursor + sceneDurs[i] / 2
    const winDur = Math.min(1.0, sceneDurs[i] * 0.6)
    const masterR = rmsDb(masterPath, mid, winDur)
    const musicR = rmsDb(musicOnlyPath, mid, winDur)
    const diff = (masterR != null && musicR != null) ? (masterR - musicR) : null
    const pass = diff != null && diff >= 8.0
    rmsReport.windows.push({ scene: i+1, t: +mid.toFixed(2), master_rms_db: masterR, music_ref_rms_db: musicR, diff_db: diff, pass })
    if (!pass) rmsReport.pass = false
    console.log(`[rms] scene ${i+1} @${mid.toFixed(2)}s master=${masterR}dB music=${musicR}dB diff=${diff?.toFixed(2)} ${pass ? 'PASS' : 'FAIL'}`)
    cursor += holds[i]
  }
  fs.writeFileSync(path.join(BUILD, 'rms-report.json'), JSON.stringify(rmsReport, null, 2))

  // 13) Publish + thumbnail
  const finalMp4 = path.join(PUB, `${SLUG}.mp4`)
  fs.copyFileSync(masterPath, finalMp4)
  const thumb = path.join(PUB, `${SLUG}.jpg`)
  // Thumb: pull frame from scene 7 (Adelson reveal — most marketable single frame)
  let thumbCursor = 0
  for (let i = 0; i < 6; i++) thumbCursor += holds[i]
  thumbCursor += holds[6] / 2  // mid of scene 7
  sh('ffmpeg', ['-y', '-ss', thumbCursor.toFixed(2), '-i', finalMp4, '-frames:v', '1', '-q:v', '2', thumb])

  // 14) Summary
  const summary = {
    slug: SLUG,
    final_mp4: finalMp4,
    thumbnail: thumb,
    size_bytes: sizeBytes,
    size_mb: +(sizeBytes / 1e6).toFixed(2),
    duration_s: +dur.toFixed(2),
    width: v.width, height: v.height, fps,
    scenes: scenes.map((s, i) => ({
      n: s.n,
      title: s.title,
      script_window: `${s.start}-${s.end}`,
      vo_chars: s.vo.length,
      vo_dur_s: +sceneDurs[i].toFixed(2),
      hold_s: +holds[i].toFixed(2),
    })),
    audio_mix: {
      voice_lufs: -16,
      music_lufs: -22,
      sidechain: 'threshold=0.03 ratio=20 attack=120 release=500',
      cold_open_punch_s: 0.5,
    },
    rms_pass: rmsReport.pass,
    rms_worst_diff_db: Math.min(...rmsReport.windows.map(w => w.diff_db ?? 999)),
    vo_settings: { stability: 0.55, similarity: 0.75, style: 0.20, model: 'eleven_multilingual_v2', voice: 'Sarah' },
    persistent_overlay_h: 100,
    subscribe_cta_at_s: 30,
    total_vo_chars: totalChars,
    est_tts_cost_usd: +(totalChars / 1000 * 0.30).toFixed(3),
  }
  fs.writeFileSync(path.join(BUILD, 'summary.json'), JSON.stringify(summary, null, 2))
  console.log('\n─── SUMMARY ───')
  console.log(JSON.stringify(summary, null, 2))
  console.log(`\nDONE: ${finalMp4}`)
  console.log(`Thumb: ${thumb}`)
}

main().catch(e => { console.error(e); process.exit(1) })
