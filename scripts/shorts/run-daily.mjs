#!/usr/bin/env node
/**
 * run-daily.mjs — daily orchestrator for CR Shorts.
 *
 * Reads queue (PROMISES in generate-script.mjs) and a persistent _state.json
 * cursor, picks the next promise, runs generate → produce → upload (or
 * dry-run). One short per day; idempotent.
 *
 * State file: scripts/shorts/_state.json
 *   { "queue": ["drain-the-swamp-aipac-iran", ...],
 *     "next_index": 1,
 *     "history": [ { date, promise_id, status, build_dir, youtube_video_id } ] }
 *
 * Usage:
 *   node scripts/shorts/run-daily.mjs --dry-run
 *   node scripts/shorts/run-daily.mjs --privacy unlisted
 *   node scripts/shorts/run-daily.mjs --only drain-the-swamp-aipac-iran --dry-run
 *
 * Idempotency: if today's slot already produced a video, exits without re-running TTS.
 */

import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const STATE_PATH = path.join(__dirname, '_state.json')
const BUILD_ROOT = path.join(__dirname, '_build')

const DEFAULT_QUEUE = [
  'drain-the-swamp-aipac-iran',
  // future promise IDs append here
]

function parseArgs() {
  const out = { flags: new Set() }
  const a = process.argv.slice(2)
  for (let i = 0; i < a.length; i++) {
    if (a[i].startsWith('--')) {
      const k = a[i].slice(2)
      const v = (i + 1 < a.length && !a[i + 1].startsWith('--')) ? a[++i] : null
      if (v === null) out.flags.add(k); else out[k] = v
    }
  }
  return out
}

function loadState() {
  if (fs.existsSync(STATE_PATH)) return JSON.parse(fs.readFileSync(STATE_PATH, 'utf8'))
  return { queue: DEFAULT_QUEUE, next_index: 0, history: [] }
}

function saveState(s) { fs.writeFileSync(STATE_PATH, JSON.stringify(s, null, 2)) }

function run(cmd, args) {
  console.log(`\n$ ${cmd} ${args.join(' ')}`)
  const r = spawnSync(cmd, args, { stdio: 'inherit' })
  if (r.status !== 0) { console.error(`Failed: ${cmd}`); process.exit(r.status || 1) }
}

async function main() {
  const args = parseArgs()
  const state = loadState()

  const promiseId = args.only || state.queue[state.next_index]
  if (!promiseId) {
    console.log('Queue exhausted. Add more promises to generate-script.mjs PROMISES table.')
    return
  }
  const today = new Date().toISOString().slice(0, 10)
  // Build dir tagged by date + slug so re-runs same day go to same place
  const buildDir = path.join(BUILD_ROOT, `${today}-${promiseId}`)
  console.log(`[daily] ${today} → ${promiseId} → ${buildDir}`)

  // 1. Generate
  if (!fs.existsSync(path.join(buildDir, 'metadata.json'))) {
    run('node', [path.join(__dirname, 'generate-script.mjs'),
      '--promise-id', promiseId, '--out', buildDir])
  } else {
    console.log('[daily] script already generated — reusing.')
  }

  // 2. Produce (skip-tts if vo.mp3 already present)
  const produceArgs = [path.join(__dirname, 'produce-short.mjs'), '--build', buildDir]
  if (fs.existsSync(path.join(buildDir, 'vo.mp3'))) produceArgs.push('--skip-tts')
  if (!fs.existsSync(path.join(buildDir, 'master.mp4'))) {
    run('node', produceArgs)
  } else {
    console.log('[daily] master.mp4 already produced — reusing.')
  }

  // 3. Upload
  const uploadArgs = [path.join(__dirname, 'upload-to-youtube.mjs'), '--build', buildDir]
  if (args.flags.has('dry-run')) uploadArgs.push('--dry-run')
  if (args.privacy) uploadArgs.push('--privacy', args.privacy)
  run('node', uploadArgs)

  // 4. Update state (only on real upload, not dry-run, and not --only override)
  if (!args.only && !args.flags.has('dry-run')) {
    let youtubeId = null
    const ytResult = path.join(buildDir, 'youtube-result.json')
    if (fs.existsSync(ytResult)) youtubeId = JSON.parse(fs.readFileSync(ytResult, 'utf8')).id
    state.history.push({ date: today, promise_id: promiseId, status: 'uploaded', build_dir: buildDir, youtube_video_id: youtubeId })
    state.next_index += 1
    saveState(state)
    console.log(`[daily] state advanced. next_index=${state.next_index}`)
  } else {
    console.log('[daily] dry-run or --only: state NOT advanced.')
  }
}

main().catch(e => { console.error(e); process.exit(1) })
