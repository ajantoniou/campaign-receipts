// scripts/longform/make-vote-thumbnail.mjs — the viral 1280x720 thumbnail for a
// vote-vs-donor video (copywriter spec 2026-06-25). SVG + rsvg-convert + ffmpeg only
// (NO puppeteer/chromium — runs on the Docker worker, same toolchain as the video).
//
// Layout: navy canvas · up to 3 politician FACES fanned on the right · "+N" gold badge ·
// company LOGO knockout top-left · huge cream $AMOUNT · 6-word overlay ("{COMPANY} PAID /
// THEY VOTED YES") · civic-red RECEIPT stamp. Everything auto-filled; pieces that are
// missing (a face, the logo) just don't render — never a broken slot.
//
// export makeVoteThumbnail({ outPath, buildDir, faces[], logoPng, money, company, moreCount })

import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'

const W = 1280, H = 720
const NAVY = '#0a1f3d', CREAM = '#f5ecd7', RED = '#a4243b', GOLD = '#b08a3e'
const sh = (c, a) => { const r = spawnSync(c, a, { stdio: 'pipe' }); if (r.status !== 0) throw new Error(`${c} failed: ${(r.stderr || '').toString().slice(0, 200)}`) }
const xml = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

function svgToPng(svg, png) { const p = png.replace(/\.png$/, '.svg'); fs.writeFileSync(p, svg); sh('rsvg-convert', ['-w', String(W), '-h', String(H), p, '-o', png]) }

// Crop a portrait to a navy-bordered card (faces fan); returns the framed PNG path.
function frameFace(src, dest, w, h) {
  sh('ffmpeg', ['-y', '-i', src, '-vf', `scale=${w}:${h}:force_original_aspect_ratio=increase,crop=${w}:${h}:(iw-${w})/2:(ih-${h})/3,pad=${w + 10}:${h + 10}:5:5:color=0xf5ecd7`, '-frames:v', '1', dest])
  return dest
}

export function makeVoteThumbnail({ outPath, buildDir, faces = [], logoPng = null, money = '', company = '', moreCount = 0 }) {
  const tdir = path.join(buildDir, 'thumb-parts'); fs.mkdirSync(tdir, { recursive: true })

  // 1) base navy canvas + the text/badges/stamp as one SVG.
  const co = (company || '').toUpperCase().slice(0, 14)
  const overlay1 = co ? `${co} PAID` : 'THEY TOOK MONEY'
  const baseSvg = `<?xml version="1.0"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="${NAVY}"/>
  <radialGradient id="v" cx="35%" cy="40%" r="75%"><stop offset="0%" stop-color="#13355f"/><stop offset="100%" stop-color="${NAVY}"/></radialGradient>
  <rect width="${W}" height="${H}" fill="url(#v)"/>
  <rect x="0" y="0" width="${W}" height="10" fill="${RED}"/>
  <!-- 6-word overlay (two facts, non-causal) -->
  <text x="60" y="300" font-family="Helvetica, Arial, sans-serif" font-weight="900" font-size="58" fill="${CREAM}" letter-spacing="1">${xml(overlay1)}</text>
  <text x="60" y="372" font-family="Helvetica, Arial, sans-serif" font-weight="900" font-size="58" fill="${CREAM}" letter-spacing="1">THEY VOTED YES</text>
  <!-- the money, huge -->
  ${money ? `<text x="60" y="560" font-family="Helvetica, Arial, sans-serif" font-weight="900" font-size="200" fill="${CREAM}" letter-spacing="-4">${xml(money)}</text>` : ''}
  <!-- RECEIPT stamp -->
  <g transform="translate(70,640) rotate(-6)"><rect x="-8" y="-34" width="200" height="48" fill="none" stroke="${RED}" stroke-width="4"/><text x="92" y="2" text-anchor="middle" font-family="Menlo, monospace" font-weight="700" font-size="30" fill="${RED}" letter-spacing="4">RECEIPT</text></g>
</svg>`
  const basePng = path.join(tdir, 'base.png'); svgToPng(baseSvg, basePng)

  // 2) composite: base ← faces (fanned right) ← logo (top-left) ← "+N" badge.
  let cur = basePng
  const FW = 300, FH = 380
  faces.slice(0, 3).forEach((f, i) => {
    if (!f || !fs.existsSync(f)) return
    const framed = frameFace(f, path.join(tdir, `face-${i}.png`), FW, FH)
    const x = W - 380 - i * 90        // fan: front-most rightmost
    const y = 180 + i * 18
    const out = path.join(tdir, `comp-f${i}.png`)
    sh('ffmpeg', ['-y', '-i', cur, '-i', framed, '-filter_complex', `[0:v][1:v]overlay=${x}:${y}[o]`, '-map', '[o]', '-frames:v', '1', out])
    cur = out
  })
  // logo top-left (on a small cream chip for legibility)
  if (logoPng && fs.existsSync(logoPng)) {
    const chip = path.join(tdir, 'logo-chip.png')
    sh('ffmpeg', ['-y', '-i', logoPng, '-vf', `scale=200:90:force_original_aspect_ratio=decrease,pad=240:120:(ow-iw)/2:(oh-ih)/2:color=white`, '-frames:v', '1', chip])
    const out = path.join(tdir, 'comp-logo.png')
    sh('ffmpeg', ['-y', '-i', cur, '-i', chip, '-filter_complex', `[0:v][1:v]overlay=60:70[o]`, '-map', '[o]', '-frames:v', '1', out])
    cur = out
  }
  // "+N" gold badge on the face stack
  if (moreCount > 0) {
    const badgeSvg = `<?xml version="1.0"?><svg xmlns="http://www.w3.org/2000/svg" width="180" height="90"><rect width="180" height="90" rx="45" fill="${GOLD}"/><text x="90" y="62" text-anchor="middle" font-family="Helvetica, Arial, sans-serif" font-weight="900" font-size="48" fill="${NAVY}">+${moreCount}</text></svg>`
    const bp = path.join(tdir, 'badge.svg'); fs.writeFileSync(bp, badgeSvg)
    const badgePng = path.join(tdir, 'badge.png'); sh('rsvg-convert', ['-w', '180', '-h', '90', bp, '-o', badgePng])
    const out = path.join(tdir, 'comp-badge.png')
    sh('ffmpeg', ['-y', '-i', cur, '-i', badgePng, '-filter_complex', `[0:v][1:v]overlay=${W - 230}:${H - 150}[o]`, '-map', '[o]', '-frames:v', '1', out])
    cur = out
  }

  // 3) final → JPEG (YouTube thumbnail)
  sh('ffmpeg', ['-y', '-i', cur, '-q:v', '2', outPath])
  return outPath
}
