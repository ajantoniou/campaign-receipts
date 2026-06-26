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
import { createClient } from '@supabase/supabase-js'
import { fetchLogo } from '../pipeline/donor-logo.mjs'

const supabase = createClient(process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })

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

// Expand abbreviations the TTS voice mispronounces (founder 2026-06-25: "Rep." came
// out wrong). Spoken text only — the on-screen card keeps the short forms.
function normalizeSpoken(t) {
  return String(t)
    .replace(/\bRep\.\s+/g, 'Representative ')
    .replace(/\bReps\.\s+/g, 'Representatives ')
    .replace(/\bSen\.\s+/g, 'Senator ')
    .replace(/\bSens\.\s+/g, 'Senators ')
    .replace(/\bGov\.\s+/g, 'Governor ')
    .replace(/\bD-([A-Z]{2})\b/g, 'Democrat of $1')   // "(D-NY)" → spoken
    .replace(/\bR-([A-Z]{2})\b/g, 'Republican of $1')
    .replace(/\bHR\s?(\d+)/g, 'H R $1')               // bill numbers spelled
    .replace(/\bU\.S\./g, 'U S')
}

// ── TTS (reuse SEALED Sarah cadence; CR voice override via env) ─────────────
async function synthesizeVo(voText, outPath) {
  const apiKey = env.ELEVENLABS_API_KEY || env.CR_ELEVENLABS_API_KEY || env.NT_ELEVENLABS_API_KEY
  if (!apiKey) { console.error('No ELEVENLABS_API_KEY'); process.exit(1) }
  const voiceId = env.CR_LONGFORM_VOICE_ID || env.CR_ELEVENLABS_SARAH_VOICE_ID || 'EXAVITQu4vr4xnSDxMaL'
  voText = normalizeSpoken(voText)
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

// (Captions removed in the redesign — the scene card itself carries the few facts
// that matter: photo + money + bill/vote. No paragraph dumps. Per founder 2026-06-25.)

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

// ── scene card — "do less" redesign (founder 2026-06-25): just the few facts that
// matter. LEFT column = name → big MONEY figure → the BILL/VOTE line. RIGHT zone
// (x≥1280) is reserved blank for the politician photo, composited by ffmpeg — the
// text never enters that zone, so they CANNOT overlap. No captions, no Veo, no loop.
// hasPortrait shrinks the left column to the reserved width; without a photo the text
// uses the full width.
function wrapSvgText(text, perLine, x, yStart, lh, attrs) {
  const words = String(text).split(/\s+/); const lines = []; let cur = ''
  for (const w of words) { if ((cur + ' ' + w).trim().length > perLine) { lines.push(cur.trim()); cur = w } else cur += ' ' + w }
  if (cur.trim()) lines.push(cur.trim())
  return lines.slice(0, 3).map((ln, i) => `<text x="${x}" y="${yStart + i * lh}" ${attrs}>${xml(ln)}</text>`).join('')
}
function sceneCardSvg(scene, idx, total, hasPortrait) {
  const colChars = hasPortrait ? 26 : 40          // left text-column width (chars)
  const name = clamp(scene.person || scene.label || '', colChars + 4)
  const money = scene.money || scene.figure || '' // the big number
  const action = scene.actionLabel || ''          // "VOTED FOR" / "SPONSORED"
  const billLine = scene.billLine || scene.label || '' // the bill / vote
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="${C.paper}"/>
  <rect x="0" y="0" width="${W}" height="8" fill="${C.red}"/>
  <text x="120" y="170" font-family="Menlo, Monaco, monospace" font-weight="700" font-size="30" fill="${C.red}" letter-spacing="6">CAMPAIGN RECEIPTS · ${xml(String(idx + 1))} OF ${xml(String(total))}</text>
  <!-- politician name -->
  <text x="120" y="320" font-family="Helvetica, sans-serif" font-weight="800" font-size="${name.length > 22 ? 56 : 68}" fill="${C.ink}">${xml(name)}</text>
  <!-- the action + bill/vote -->
  ${action ? `<text x="120" y="400" font-family="Menlo, monospace" font-weight="700" font-size="30" fill="${C.muted}" letter-spacing="3">${xml(action)}</text>` : ''}
  ${wrapSvgText(billLine, colChars, 120, 470, 56, `font-family="Georgia, serif" font-size="48" fill="${C.ink}"`)}
  <!-- the money: label ABOVE, big figure BELOW with clear separation (no overlap).
       Figure is 120px; its baseline at H-90 puts its cap-top near H-210, comfortably
       below the label baseline at H-250. -->
  ${money ? `<text x="120" y="${H - 300}" font-family="Menlo, monospace" font-weight="700" font-size="26" fill="${C.muted}" letter-spacing="4">FROM ${xml((scene.industry || '').toUpperCase())} DONORS</text>` : ''}
  ${money ? `<text x="120" y="${H - 160}" font-family="Helvetica, sans-serif" font-weight="900" font-size="120" fill="${C.red}" letter-spacing="-3">${xml(money)}</text>` : ''}
</svg>`
}

async function main() {
  if (!fs.existsSync(SCRIPT_MD)) { console.error(`No briefing script: ${SCRIPT_MD}\nRun build-audio-briefing.mjs --week-of=${WEEK} first.`); process.exit(1) }
  fs.mkdirSync(BUILD, { recursive: true })
  const scenes = parseScenes(fs.readFileSync(SCRIPT_MD, 'utf8'))
  if (scenes.length < 3) { console.error(`Only ${scenes.length} scenes parsed — need ≥3.`); process.exit(1) }
  const N = scenes.length
  console.log(`[script] ${N} scenes from ${path.relative(ROOT, SCRIPT_MD)}`)

  // Pull the structured story facts (person/money/bill/industry) from the week's
  // cr_story_candidates — the card shows ONLY these (founder "do less"). The briefing
  // VO still drives narration; we match candidates to scenes by politician last name.
  const usdShort = (n) => { const x = Number(n) || 0; return x >= 1e6 ? `$${(x / 1e6).toFixed(1)}M` : x >= 1e3 ? `$${Math.round(x / 1e3)}K` : `$${Math.round(x)}` }
  let cands = []
  try {
    const { data } = await supabase.from('cr_story_candidates').select('headline, source_refs').eq('week_of', WEEK)
    cands = data || []
  } catch { /* card falls back to label-only */ }
  const candLast = (c) => { const n = c.source_refs?.[0]?.politician_name || ''; return n.trim().split(/\s+/).pop().toLowerCase().replace(/[^a-z]/g, '') }
  scenes.forEach((s) => {
    const hay = `${s.label} ${s.vo || ''}`.toLowerCase()
    const c = cands.find((x) => { const l = candLast(x); return l && hay.includes(l) })
    const r = c?.source_refs?.[0] || {}
    s.person = r.politician_name || s.label
    s.moneyVal = r.matched_donor_total || r.bloc_total || 0
    s.money = s.moneyVal ? usdShort(s.moneyVal) : pullFigure(s.vo)
    s.blocSize = r.bloc_size || 1
    s.industry = r.industry || ''
    s.actionLabel = r.action === 'voted_yes' ? 'VOTED FOR' : r.action === 'sponsored' ? 'SPONSORED' : ''
    s.billLine = r.bill_name || r.bill_label || s.label
    s.headline = s.label
    // top donor company names (for logos): bloc_top_donors (vote bloc) or matched_donors
    s.donorNames = (r.bloc_top_donors && r.bloc_top_donors.length ? r.bloc_top_donors : (r.matched_donors || []).map((d) => d.name)).slice(0, 3)
  })

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

  // Donor company LOGOS (founder 2026-06-25): fetch each scene's top donor logos, lay
  // them out as a single row on a white chip → one PNG per scene, overlaid lower-left
  // by the money figure (in the text zone, away from the photo). Skips gracefully when
  // a donor has no resolvable logo.
  const logoDir = path.join(BUILD, 'logos'); fs.mkdirSync(logoDir, { recursive: true })
  const logoRowPng = {}
  for (let i = 0; i < N; i++) {
    const names = scenes[i].donorNames || []
    const got = []
    for (let j = 0; j < names.length && got.length < 3; j++) {
      const dest = path.join(logoDir, `s${i + 1}-${j}.png`)
      if (await fetchLogo(names[j], dest)) got.push(dest)
    }
    if (!got.length) continue
    // Lay logos in a row: each on a 200x110 white rounded chip, 16px gap.
    const CHIP_W = 200, CHIP_H = 110, GAP = 16
    const rowW = got.length * CHIP_W + (got.length - 1) * GAP
    const rowPng = path.join(logoDir, `row-${i + 1}.png`)
    // build via ffmpeg: white rounded chips with each logo fit inside, hstacked
    const chipPngs = got.map((g, k) => {
      const chip = path.join(logoDir, `chip-${i + 1}-${k}.png`)
      sh('ffmpeg', ['-y', '-i', g, '-vf', `scale=${CHIP_W - 24}:${CHIP_H - 24}:force_original_aspect_ratio=decrease,pad=${CHIP_W}:${CHIP_H}:(ow-iw)/2:(oh-ih)/2:color=white`, '-frames:v', '1', chip])
      return chip
    })
    if (chipPngs.length === 1) { fs.copyFileSync(chipPngs[0], rowPng) }
    else {
      const inputs = chipPngs.flatMap((c) => ['-i', c])
      const fc = chipPngs.map((_, k) => `[${k}:v]`).join('') + `hstack=inputs=${chipPngs.length}[out]`
      sh('ffmpeg', ['-y', ...inputs, '-filter_complex', fc, '-map', '[out]', '-frames:v', '1', rowPng])
    }
    if (fs.existsSync(rowPng)) { logoRowPng[i] = rowPng; console.log(`[logos] scene ${i + 1}: ${got.length} (${names.slice(0, got.length).join(', ')})`) }
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

  // (No Veo — founder 2026-06-25: the looping 8s clip looked cheap. Static cards only.)

  // 3) Cards + overlays → PNG. Each scene = static card (name/money/bill) + the photo
  //    composited into the RESERVED right zone (x=1300) so it never covers the text.
  const cardsDir = path.join(BUILD, 'cards'); fs.mkdirSync(cardsDir, { recursive: true })
  const persistPng = path.join(cardsDir, 'bar.png'); svgToPng(persistentBarSvg(), persistPng, W, H)
  const cardPng = (i) => path.join(cardsDir, `scene-${String(i + 1).padStart(2, '0')}.png`)
  for (let i = 0; i < N; i++) svgToPng(sceneCardSvg(scenes[i], i, N, !!portraitPng[i]), cardPng(i), W, H)
  const outroPng = path.join(cardsDir, 'outro.png'); svgToPng(outroSvg(), outroPng, W, H)
  const OUTRO_DUR = 5

  // 4) Per-scene clip: STATIC card (no ken-burns, no loop) for the scene's duration,
  //    persistent bar overlaid, and the framed photo overlaid top-right in its reserved
  //    zone (x = W-580 ≈ 1340). Clean and calm — nothing repeats.
  const clipsDir = path.join(BUILD, 'clips'); fs.mkdirSync(clipsDir, { recursive: true })
  const clip = (i) => path.join(clipsDir, `scene-${String(i + 1).padStart(2, '0')}.mp4`)
  for (let i = 0; i < N; i++) {
    const dur = holds[i]
    const inputs = ['-framerate', String(FPS), '-loop', '1', '-t', String(dur), '-i', cardPng(i), '-loop', '1', '-t', String(dur), '-i', persistPng]
    let idx = 2
    let fc = `[0:v]scale=${W}:${H},format=yuv420p[bg];[bg][1:v]overlay=0:0:format=auto[v1]`
    let last = '[v1]'
    if (portraitPng[i]) {
      inputs.push('-loop', '1', '-t', String(dur), '-i', portraitPng[i])
      fc += `;${last}[${idx}:v]overlay=${W - 580}:300:format=auto[v2]`; last = '[v2]'; idx++
    }
    if (logoRowPng[i]) {
      inputs.push('-loop', '1', '-t', String(dur), '-i', logoRowPng[i])
      // donor logos: in the mid gap, above the "FROM <industry> DONORS" line (which is
      // at y≈H-230). Clears a 3-line bill (ends ~y=582) and stays left of the photo.
      fc += `;${last}[${idx}:v]overlay=120:${H - 430}:format=auto[vL]`; last = '[vL]'; idx++
    }
    // CINEMATIC (founder 2026-06-25): a very slow eased push-in on the finished
    // composite (NOT a loop — one continuous 3% zoom over the whole hold) + faint film
    // grain + a 0.4s fade-in. Calm, produced, never repeats.
    const frames = Math.max(2, Math.round(dur * FPS))
    const zoom = `zoompan=z='min(zoom+0.00035,1.03)':d=${frames}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=${W}x${H}:fps=${FPS}`
    fc += `;${last}${zoom},noise=alls=6:allf=t,fade=t=in:st=0:d=0.4,format=yuv420p[vout]`
    sh('ffmpeg', ['-y', ...inputs, '-filter_complex', fc,
      '-map', '[vout]', '-r', String(FPS), '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-preset', 'fast', '-crf', '20', '-an', '-t', String(dur), clip(i)])
    console.log(`[clip] scene ${i + 1} ${dur.toFixed(1)}s${portraitPng[i] ? ' +photo' : ''}${logoRowPng[i] ? ' +logos' : ''}`)
  }

  // 4b) Outro clip (static subscribe/like/newsletter card, OUTRO_DUR seconds).
  const outroClip = path.join(clipsDir, 'outro.mp4')
  sh('ffmpeg', ['-y', '-framerate', String(FPS), '-loop', '1', '-t', String(OUTRO_DUR), '-i', outroPng,
    '-filter_complex', `[0:v]scale=${W}:${H},format=yuv420p[vout]`,
    '-map', '[vout]', '-r', String(FPS), '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-preset', 'fast', '-crf', '20', '-an', outroClip])

  // 5) Concat (scenes + outro) → the visual track. (No mid-video bell overlay — the
  //    outro card carries subscribe/like; keeps it clean.)
  const concatList = path.join(BUILD, 'concat.txt')
  fs.writeFileSync(concatList, scenes.map((_, i) => `file '${clip(i)}'`).join('\n') + `\nfile '${outroClip}'\n`)
  const visualPath = path.join(BUILD, 'visual.mp4')
  sh('ffmpeg', ['-y', '-f', 'concat', '-safe', '0', '-i', concatList, '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-preset', 'fast', '-crf', '20', '-r', String(FPS), '-an', visualPath])

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

  // 11) Thumbnail: the viral vote-vs-donor card (faces + logo + money). Lead = the
  //     scene with the biggest money figure. Faces = that scene's photo + the next two
  //     story photos (a fan); logo = that scene's first donor logo; +N = bloc minus 3.
  const thumb = path.join(BUILD, 'thumb.jpg')
  try {
    const leadIdx = scenes.reduce((best, s, i) => ((s.moneyVal || 0) > (scenes[best].moneyVal || 0) ? i : best), 1)
    const faceList = [portraitPng[leadIdx], ...Object.entries(portraitPng).filter(([k]) => +k !== leadIdx).map(([, v]) => v)].filter(Boolean).slice(0, 3)
    const leadLogo = (logoDir && fs.existsSync(path.join(logoDir, `s${leadIdx + 1}-0.png`))) ? path.join(logoDir, `s${leadIdx + 1}-0.png`) : null
    const more = Math.max(0, (scenes[leadIdx].blocSize || 0) - 3)
    const { makeVoteThumbnail } = await import('./make-vote-thumbnail.mjs')
    makeVoteThumbnail({ outPath: thumb, buildDir: BUILD, faces: faceList, logoPng: leadLogo, money: scenes[leadIdx].money || scenes[leadIdx].figure || '', company: (scenes[leadIdx].donorNames || [])[0] || scenes[leadIdx].industry || '', moreCount: more })
    console.log(`[thumb] vote thumbnail: ${faceList.length} faces${leadLogo ? ' +logo' : ''}${more ? ` +${more}` : ''}`)
  } catch (e) {
    // Fail-soft: fall back to a frame grab so a thumbnail always exists.
    console.log(`[thumb] vote thumbnail failed (${e.message}) — frame-grab fallback`)
    sh('ffmpeg', ['-y', '-ss', String(Math.min(60, totalDur / 2)), '-i', masterPath, '-frames:v', '1', '-q:v', '2', thumb])
  }

  // Persist per-scene content + timing so the shorts cutter can render NATIVE 9:16
  // cards (not crop the wide master — that cut off text/faces). Includes the local
  // portrait/logo paths it already fetched.
  fs.writeFileSync(path.join(BUILD, 'scenes.json'), JSON.stringify(scenes.map((s, i) => ({
    idx: i, person: s.person, actionLabel: s.actionLabel, billLine: s.billLine,
    money: s.money, industry: s.industry, donorNames: s.donorNames || [],
    hold: holds[i], start: holds.slice(0, i).reduce((a, b) => a + b, 0),
    portrait: portraitPng[i] || null, logoRow: logoRowPng[i] || null,
  })), null, 2))

  const summary = { week: WEEK, master: masterPath, thumb, duration_s: +dur.toFixed(2), width: v.width, height: v.height, scenes: N, veo_heroes: 0, music: !!MUSIC, size_mb: +(sizeBytes / 1e6).toFixed(2) }
  fs.writeFileSync(path.join(BUILD, 'summary.json'), JSON.stringify(summary, null, 2))
  console.log('\n─── SUMMARY ───\n' + JSON.stringify(summary, null, 2))
  console.log(`\nDONE: ${masterPath}`)
}

main().catch((e) => { console.error('FATAL:', e); process.exit(1) })
