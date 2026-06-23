#!/usr/bin/env node
//
// scripts/produce-weekly-video.mjs — the weekly YouTube pumping machine orchestrator.
//
// Chains, fail-CLOSED (any failure → skip publish; never half-publish):
//   preflight (binaries + keys + briefing.md) → render long-form (produce-cr-weekly)
//   → cut 2 shorts (cut-cr-shorts) → generate metadata (long + short)
//   → upload long-form + 2 shorts to the CR YouTube channel → record URLs on the issue.
//
// Publish privacy: env CR_VIDEO_PRIVACY (default 'unlisted' — SAFE for first runs;
// set to 'public' once quality is proven). Every description drives the $9 newsletter.
//
// Usage:
//   node scripts/produce-weekly-video.mjs [--week-of=YYYY-MM-DD] [--no-upload] [--privacy=public|unlisted]
//
// Env: SUPABASE_*, ANTHROPIC_API_KEY, ELEVENLABS_API_KEY, GEMINI_API_KEY (Veo, optional),
//      CR_YOUTUBE_* (OAuth), CR_VIDEO_PRIVACY.
// Binaries (on the render host): node, python3, ffmpeg, ffprobe, rsvg-convert.

import { createClient } from '@supabase/supabase-js'
import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')

const args = process.argv.slice(2)
const getArg = (k, d = null) => args.find((a) => a.startsWith(`--${k}=`))?.split('=')[1] ?? d
const NO_UPLOAD = args.includes('--no-upload')
const PRIVACY = getArg('privacy', process.env.CR_VIDEO_PRIVACY || 'unlisted')

function isoMonday(d = new Date()) { const x = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())); x.setUTCDate(x.getUTCDate() - ((x.getUTCDay() + 6) % 7)); return x.toISOString().slice(0, 10) }
const WEEK = getArg('week-of', isoMonday())
const BUILD = path.join(ROOT, 'scripts', 'longform', '_build', WEEK)
const SCRIPT_MD = path.join(ROOT, 'content', 'audio', WEEK, 'briefing.md')

const supabase = createClient(process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } })

function run(label, cmd, a, opts = {}) {
  console.log(`\n▶ ${label}`)
  const r = spawnSync(cmd, a, { stdio: 'inherit', env: process.env, ...opts })
  if (r.status !== 0) throw new Error(`${label} failed (exit ${r.status})`)
}
function have(bin, arg = '--version') { return spawnSync(bin, [arg], { stdio: 'ignore' }).status === 0 }

async function uploadOne({ video, metaFile, thumb, slug, piece }) {
  const meta = JSON.parse(fs.readFileSync(metaFile, 'utf8'))
  const descFile = metaFile.replace(/youtube-meta(-short)?\.json$/, (m, s) => `description${s || ''}.md`)
  const a = [
    path.join(ROOT, 'scripts', 'pipeline', 'youtube-upload.py'),
    '--video', video,
    '--title', meta.title,
    '--description-file', descFile,
    '--tags', (meta.tags || []).join(','),
    '--privacy', PRIVACY,
    '--slug', slug, '--piece', piece,
    '--skip-audio-qc', '--skip-production-qc',
  ]
  if (thumb && fs.existsSync(thumb)) a.push('--thumbnail', thumb)
  // Capture stdout to parse the resulting youtu.be URL.
  const r = spawnSync('python3', a, { encoding: 'utf8', env: process.env })
  process.stdout.write(r.stdout || ''); process.stderr.write(r.stderr || '')
  if (r.status !== 0) throw new Error(`upload failed for ${slug} (exit ${r.status})`)
  const m = (r.stdout || '').match(/youtu\.be\/([\w-]{6,})/)
  return m ? `https://youtu.be/${m[1]}` : null
}

async function main() {
  console.log(`[${new Date().toISOString()}] CR weekly video machine — week ${WEEK} (privacy=${PRIVACY}${NO_UPLOAD ? ', NO-UPLOAD' : ''})`)

  // ── Preflight: fail-CLOSED. Missing anything → skip, do NOT publish. ──
  const missing = []
  for (const b of [['node'], ['python3'], ['ffmpeg', '-version'], ['ffprobe', '-version'], ['rsvg-convert', '--version']]) if (!have(b[0], b[1])) missing.push(b[0])
  if (!process.env.ELEVENLABS_API_KEY && !process.env.CR_ELEVENLABS_API_KEY) missing.push('ELEVENLABS_API_KEY')
  if (!process.env.ANTHROPIC_API_KEY) missing.push('ANTHROPIC_API_KEY')
  if (!fs.existsSync(SCRIPT_MD)) missing.push(`briefing.md(${WEEK})`)
  if (missing.length) { console.log(`SKIP weekly video — missing: ${missing.join(', ')}.`); return }

  try {
    // 1) Long-form render (Veo heroes if GEMINI_API_KEY present; else motion-graphic only).
    const veoFlag = process.env.GEMINI_API_KEY ? [] : ['--no-veo']
    run('render long-form', 'node', [path.join(ROOT, 'scripts', 'longform', 'produce-cr-weekly.mjs'), `--week-of=${WEEK}`, '--max-veo=2', ...veoFlag])
    const master = path.join(BUILD, 'master.mp4'), thumb = path.join(BUILD, 'thumb.jpg')
    if (!fs.existsSync(master)) throw new Error('master.mp4 not produced')

    // 2) Shorts
    run('cut shorts', 'node', [path.join(ROOT, 'scripts', 'longform', 'cut-cr-shorts.mjs'), `--week-of=${WEEK}`, '--count=2'])

    // 3) Metadata (long + short)
    run('meta (long)', 'node', [path.join(ROOT, 'scripts', 'longform', 'generate-youtube-meta.mjs'), `--week-of=${WEEK}`, '--kind=long'])
    run('meta (short)', 'node', [path.join(ROOT, 'scripts', 'longform', 'generate-youtube-meta.mjs'), `--week-of=${WEEK}`, '--kind=short'])

    if (NO_UPLOAD) { console.log('\n--no-upload: built master + shorts + meta; skipping YouTube + DB.'); return }

    // 4) Upload long-form, then shorts. cr-* slug routes to CR_NEW_NEWS playlist.
    const videoUrl = await uploadOne({ video: master, metaFile: path.join(BUILD, 'youtube-meta.json'), thumb, slug: `cr-weekly-${WEEK}`, piece: `cr-weekly-${WEEK}` })
    console.log(`Long-form: ${videoUrl}`)

    const shortsManifest = JSON.parse(fs.readFileSync(path.join(BUILD, 'shorts.json'), 'utf8'))
    const shortUrls = []
    for (const s of shortsManifest) {
      const u = await uploadOne({ video: s.file, metaFile: path.join(BUILD, 'youtube-meta-short.json'), thumb: null, slug: `cr-weekly-${WEEK}-short${s.short}`, piece: `cr-weekly-${WEEK}-short${s.short}` })
      shortUrls.push(u); console.log(`Short ${s.short}: ${u}`)
    }

    // 5) Record on the issue.
    await supabase.from('cr_newsletter_issues').update({ video_url: videoUrl, shorts_urls: shortUrls, updated_at: new Date().toISOString() }).eq('week_of', WEEK)
    console.log(`\nDONE. Recorded video + ${shortUrls.length} shorts on issue ${WEEK}.`)
  } catch (e) {
    console.error(`\n❌ weekly video machine failed (fail-closed, nothing half-published): ${e.message}`)
    process.exit(1)
  }
}

main().catch((e) => { console.error('FATAL:', e.message); process.exit(1) })
