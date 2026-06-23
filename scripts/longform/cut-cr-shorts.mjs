#!/usr/bin/env node
//
// scripts/longform/cut-cr-shorts.mjs — cut N vertical (9:16, 1080x1920) YouTube
// Shorts from the weekly CR long-form master, at the scene boundaries the renderer
// already recorded (summary.json), reframing 16:9 → 9:16 and burning a "$9
// newsletter — link in description" CTA strip. No transcript dependency.
//
// We pick the punchiest scenes: the cold-open (scene 1) and the scene with the
// biggest dollar figure. Each short is clamped to 15-58s (Shorts max 60s).
//
// Input:  scripts/longform/_build/<WEEK>/master.mp4 + summary.json + the renderer's
//         per-scene VO durations (recomputed here from the vo/ mp3s for exact spans).
// Output: scripts/longform/_build/<WEEK>/short-01.mp4, short-02.mp4
//
// Usage: node scripts/longform/cut-cr-shorts.mjs --week-of=YYYY-MM-DD [--count=2]
// Binaries: ffmpeg, ffprobe.

import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..', '..')
const PAD = 0.35

const args = process.argv.slice(2)
const getArg = (k, d = null) => args.find((a) => a.startsWith(`--${k}=`))?.split('=')[1] ?? d
const COUNT = Number(getArg('count', 2))
function isoMonday(d = new Date()) { const x = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())); x.setUTCDate(x.getUTCDate() - ((x.getUTCDay() + 6) % 7)); return x.toISOString().slice(0, 10) }
const WEEK = getArg('week-of', isoMonday())
const BUILD = path.join(ROOT, 'scripts', 'longform', '_build', WEEK)
const MASTER = path.join(BUILD, 'master.mp4')

function sh(cmd, a) { const r = spawnSync(cmd, a, { stdio: 'inherit' }); if (r.status !== 0) { console.error(`FAIL: ${cmd}`); process.exit(r.status || 1) } }
function shCap(cmd, a) { const r = spawnSync(cmd, a, { encoding: 'utf8' }); return (r.stdout || '').trim() }
function probeDur(f) { return parseFloat(shCap('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=nw=1:nk=1', f])) }

// This ffmpeg may lack the drawtext filter (no libfreetype), so the CTA is an
// SVG→PNG strip overlaid with ffmpeg's overlay filter (rsvg-convert, same as the
// long-form renderer). Returns the PNG path for a 1080x1920 transparent overlay.
function buildCtaPng() {
  const png = path.join(BUILD, 'short-cta.png')
  if (fs.existsSync(png)) return png
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920" viewBox="0 0 1080 1920">
  <rect x="0" y="1560" width="1080" height="360" fill="#0a0a0a" opacity="0.6"/>
  <rect x="0" y="1560" width="1080" height="6" fill="#B23A3A"/>
  <text x="540" y="1690" text-anchor="middle" font-family="Menlo, Monaco, monospace" font-weight="700" font-size="56" fill="#ffffff" letter-spacing="3">CAMPAIGNRECEIPTS.COM</text>
  <text x="540" y="1770" text-anchor="middle" font-family="Helvetica, sans-serif" font-weight="700" font-size="44" fill="#C8861D">$9 weekly newsletter — link in description</text>
</svg>`
  const svgP = png.replace(/\.png$/, '.svg'); fs.writeFileSync(svgP, svg)
  sh('rsvg-convert', ['-w', '1080', '-h', '1920', svgP, '-o', png])
  return png
}

function main() {
  if (!fs.existsSync(MASTER)) { console.error(`No master: ${MASTER}`); process.exit(1) }

  // Recompute per-scene spans from the renderer's vo mp3s (authoritative timing).
  const voDir = path.join(BUILD, 'vo')
  const voFiles = fs.existsSync(voDir) ? fs.readdirSync(voDir).filter((f) => f.endsWith('.mp3')).sort() : []
  if (!voFiles.length) { console.error('No vo/ mp3s to derive spans'); process.exit(1) }
  const holds = voFiles.map((f) => probeDur(path.join(voDir, f)) + PAD)
  const starts = holds.map((_, i) => holds.slice(0, i).reduce((a, b) => a + b, 0))
  const masterDur = probeDur(MASTER)

  // Choose scenes: scene 1 (hook) + the longest non-first scene (proxy for "meatiest").
  const order = holds.map((d, i) => ({ i, d })).sort((a, b) => b.d - a.d).map((x) => x.i)
  const picks = [0, ...order.filter((i) => i !== 0)].filter((v, i, a) => a.indexOf(v) === i).slice(0, COUNT)

  const ctaPng = buildCtaPng()
  const out = []
  picks.forEach((sceneIdx, n) => {
    // Clamp the span to a Shorts-friendly 15-58s; if a scene is longer, take its first 55s.
    const start = Math.max(0, starts[sceneIdx])
    let dur = Math.min(holds[sceneIdx], 55)
    if (dur < 15) dur = Math.min(15, masterDur - start) // pad short scenes by spilling into the next
    if (start + dur > masterDur) dur = masterDur - start
    const outPath = path.join(BUILD, `short-${String(n + 1).padStart(2, '0')}.mp4`)
    // 16:9 → 9:16: crop center, scale to 1080x1920, then overlay the CTA strip PNG.
    sh('ffmpeg', ['-y', '-ss', start.toFixed(2), '-t', dur.toFixed(2), '-i', MASTER, '-i', ctaPng,
      '-filter_complex', `[0:v]crop=ih*9/16:ih,scale=1080:1920,setsar=1[v];[v][1:v]overlay=0:0:format=auto[vout]`,
      '-map', '[vout]', '-map', '0:a',
      '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-preset', 'fast', '-crf', '20',
      '-c:a', 'aac', '-b:a', '192k', outPath])
    out.push({ short: n + 1, scene: sceneIdx + 1, start: +start.toFixed(2), dur: +dur.toFixed(2), file: outPath })
    console.log(`[short ${n + 1}] scene ${sceneIdx + 1} @ ${start.toFixed(1)}s for ${dur.toFixed(1)}s → ${path.basename(outPath)}`)
  })

  fs.writeFileSync(path.join(BUILD, 'shorts.json'), JSON.stringify(out, null, 2))
  console.log(`Wrote ${out.length} shorts.`)
}

main()
