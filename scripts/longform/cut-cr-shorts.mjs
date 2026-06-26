#!/usr/bin/env node
//
// scripts/longform/cut-cr-shorts.mjs — NATIVE 9:16 (1080x1920) YouTube Shorts.
//
// Founder 2026-06-26: the old cutter CROPPED the 16:9 master → left-column text + the
// right-side face fell outside the crop and got cut off on mobile. FIX: render a NATIVE
// vertical card per scene (re-laid-out for 9:16 — stacked, centered), and only pull the
// AUDIO for that scene's span from the master. Nothing is cropped; text + face are
// composed for portrait from the start.
//
// Reads scenes.json (written by produce-cr-weekly.mjs) for content + the local portrait/
// logo paths it already fetched. SVG+rsvg+ffmpeg only (worker-compatible).
//
// Output: scripts/longform/_build/<WEEK>/short-01.mp4, short-02.mp4
// Usage: node scripts/longform/cut-cr-shorts.mjs --week-of=YYYY-MM-DD [--count=2]

import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..', '..')
const SW = 1080, SH = 1920, FPS = 30
const NAVY = '#16263D', PAPER = 'rgb(244,239,230)', MUTED = '#6E7891', RED = '#B23A3A', GOLD = '#C8861D'

const args = process.argv.slice(2)
const getArg = (k, d = null) => args.find((a) => a.startsWith(`--${k}=`))?.split('=')[1] ?? d
const COUNT = Number(getArg('count', 2))
function isoMonday(d = new Date()) { const x = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())); x.setUTCDate(x.getUTCDate() - ((x.getUTCDay() + 6) % 7)); return x.toISOString().slice(0, 10) }
const WEEK = getArg('week-of', isoMonday())
const BUILD = path.join(ROOT, 'scripts', 'longform', '_build', WEEK)
const MASTER = path.join(BUILD, 'master.mp4')

function sh(cmd, a) { const r = spawnSync(cmd, a, { stdio: 'pipe' }); if (r.status !== 0) { console.error(`FAIL ${cmd}: ${(r.stderr || '').toString().slice(0, 200)}`); process.exit(r.status || 1) } }
function probeDur(f) { const r = spawnSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=nw=1:nk=1', f], { encoding: 'utf8' }); return parseFloat((r.stdout || '').trim()) }
const xml = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const clamp = (s, n) => (String(s).length > n ? String(s).slice(0, n - 1).trimEnd() + '…' : String(s))
function wrap(text, per) { const w = String(text).split(/\s+/); const out = []; let cur = ''; for (const x of w) { if ((cur + ' ' + x).trim().length > per) { out.push(cur.trim()); cur = x } else cur += ' ' + x } if (cur.trim()) out.push(cur.trim()); return out }
function svgToPng(svg, png) { const p = png.replace(/\.png$/, '.svg'); fs.writeFileSync(p, svg); sh('rsvg-convert', ['-w', String(SW), '-h', String(SH), p, '-o', png]) }

// NATIVE vertical card: eyebrow → NAME → VOTED FOR → bill (wrapped) → [photo] → money → CTA.
function verticalCardSvg(s, partsDir, i) {
  const billLines = wrap(s.billLine || '', 22).slice(0, 3)
  const billSvg = billLines.map((ln, k) => `<text x="${SW / 2}" y="${560 + k * 64}" text-anchor="middle" font-family="Georgia, serif" font-size="54" fill="${NAVY}">${xml(ln)}</text>`).join('')
  return `<?xml version="1.0"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${SW}" height="${SH}" viewBox="0 0 ${SW} ${SH}">
  <rect width="${SW}" height="${SH}" fill="${PAPER}"/>
  <rect x="0" y="0" width="${SW}" height="10" fill="${RED}"/>
  <text x="${SW / 2}" y="200" text-anchor="middle" font-family="Menlo, monospace" font-weight="700" font-size="32" fill="${RED}" letter-spacing="6">CAMPAIGN RECEIPTS</text>
  <text x="${SW / 2}" y="330" text-anchor="middle" font-family="Helvetica, sans-serif" font-weight="900" font-size="${(s.person || '').length > 18 ? 64 : 84}" fill="${NAVY}">${xml(clamp(s.person || '', 26))}</text>
  <text x="${SW / 2}" y="430" text-anchor="middle" font-family="Menlo, monospace" font-weight="700" font-size="34" fill="${MUTED}" letter-spacing="5">${xml(s.actionLabel || 'FOLLOW THE MONEY')}</text>
  ${billSvg}
  <!-- photo zone is composited by ffmpeg at y≈830 (centered) -->
  <text x="${SW / 2}" y="${SH - 360}" text-anchor="middle" font-family="Menlo, monospace" font-weight="700" font-size="30" fill="${MUTED}" letter-spacing="4">FROM ${xml((s.industry || '').toUpperCase())} DONORS</text>
  <text x="${SW / 2}" y="${SH - 220}" text-anchor="middle" font-family="Helvetica, sans-serif" font-weight="900" font-size="150" fill="${RED}" letter-spacing="-3">${xml(s.money || '')}</text>
  <rect x="0" y="${SH - 120}" width="${SW}" height="120" fill="${NAVY}"/>
  <text x="${SW / 2}" y="${SH - 68}" text-anchor="middle" font-family="Menlo, monospace" font-weight="700" font-size="34" fill="#fff" letter-spacing="3">CAMPAIGNRECEIPTS.COM</text>
  <text x="${SW / 2}" y="${SH - 28}" text-anchor="middle" font-family="Helvetica, sans-serif" font-weight="600" font-size="26" fill="${GOLD}">$9 weekly newsletter · link in description</text>
</svg>`
}

function main() {
  if (!fs.existsSync(MASTER)) { console.error(`No master: ${MASTER}`); process.exit(1) }
  const scenesPath = path.join(BUILD, 'scenes.json')
  if (!fs.existsSync(scenesPath)) { console.error('No scenes.json — re-render long-form first.'); process.exit(1) }
  const scenes = JSON.parse(fs.readFileSync(scenesPath, 'utf8'))
  const masterDur = probeDur(MASTER)
  const partsDir = path.join(BUILD, 'short-parts'); fs.mkdirSync(partsDir, { recursive: true })

  // Pick the meatiest scenes (biggest money), always include scene index that has a person.
  const withMoney = scenes.filter((s) => s.person && s.money)
  const picks = (withMoney.length ? withMoney : scenes).slice().sort((a, b) => (b.hold || 0) - (a.hold || 0)).slice(0, COUNT)

  const out = []
  picks.forEach((s, n) => {
    const start = Math.max(0, s.start || 0)
    let dur = Math.min(s.hold || 20, 55); if (dur < 12) dur = Math.min(15, masterDur - start)
    if (start + dur > masterDur) dur = masterDur - start

    // 1) native vertical card
    const cardPng = path.join(partsDir, `card-${n + 1}.png`); svgToPng(verticalCardSvg(s, partsDir, n), cardPng)
    // 2) composite the framed photo centered (if present), via ffmpeg
    let composed = cardPng
    if (s.portrait && fs.existsSync(s.portrait)) {
      const ph = path.join(partsDir, `ph-${n + 1}.png`)
      sh('ffmpeg', ['-y', '-i', s.portrait, '-vf', `scale=560:700:force_original_aspect_ratio=increase,crop=560:700,pad=580:728:10:14:color=0x16263D`, '-frames:v', '1', ph])
      const c2 = path.join(partsDir, `card-ph-${n + 1}.png`)
      sh('ffmpeg', ['-y', '-i', cardPng, '-i', ph, '-filter_complex', `[0:v][1:v]overlay=(W-580)/2:840[o]`, '-map', '[o]', '-frames:v', '1', c2])
      composed = c2
    }
    // 3) still card + the master's AUDIO for this span → 9:16 short (gentle push-in, no crop)
    const frames = Math.max(2, Math.round(dur * FPS))
    const outPath = path.join(BUILD, `short-${String(n + 1).padStart(2, '0')}.mp4`)
    sh('ffmpeg', ['-y',
      '-framerate', String(FPS), '-loop', '1', '-t', dur.toFixed(2), '-i', composed,
      '-ss', start.toFixed(2), '-t', dur.toFixed(2), '-i', MASTER,
      '-filter_complex', `[0:v]scale=${SW}:${SH},zoompan=z='min(zoom+0.0004,1.04)':d=${frames}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=${SW}x${SH}:fps=${FPS},format=yuv420p[v]`,
      '-map', '[v]', '-map', '1:a',
      '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-preset', 'fast', '-crf', '20', '-c:a', 'aac', '-b:a', '192k', '-t', dur.toFixed(2), outPath])
    out.push({ short: n + 1, scene: s.idx + 1, start: +start.toFixed(2), dur: +dur.toFixed(2), file: outPath })
    console.log(`[short ${n + 1}] native 9:16 · scene ${s.idx + 1} · ${dur.toFixed(1)}s${s.portrait ? ' +photo' : ''}`)
  })

  fs.writeFileSync(path.join(BUILD, 'shorts.json'), JSON.stringify(out, null, 2))
  console.log(`Wrote ${out.length} native vertical shorts.`)
}
main()
