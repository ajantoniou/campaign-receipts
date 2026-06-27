#!/usr/bin/env node
//
// scripts/video-worker-server.mjs — tiny HTTP server for the Render video worker.
//
// The hourly cron (node runtime, no ffmpeg) POSTs here on Thursdays; this service
// (Docker, has ffmpeg/rsvg/python3) does the heavy render+upload by spawning
// scripts/produce-weekly-video.mjs. Async: returns 202 immediately, runs in bg
// (a render takes minutes; we don't hold the HTTP connection open).
//
// Endpoints:
//   GET  /health            → 200 "ok"
//   POST /produce-weekly     (header  x-cr-token: $VIDEO_WORKER_TOKEN)
//        body: { "week_of": "YYYY-MM-DD" (optional), "privacy": "public|unlisted" (optional) }
//        → 202 { started: true }  |  401 bad token  |  409 already running
//
// Env: VIDEO_WORKER_TOKEN (required for auth), PORT (default 10000), + all the
//      keys produce-weekly-video.mjs needs (SUPABASE/ANTHROPIC/ELEVENLABS/GEMINI/CR_YOUTUBE_*).

import http from 'node:http'
import path from 'node:path'
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const PORT = Number(process.env.PORT || 10000)
const TOKEN = process.env.VIDEO_WORKER_TOKEN || ''

let running = false

function runProducer(weekOf, privacy) {
  running = true
  const a = [path.join(ROOT, 'scripts', 'produce-weekly-video.mjs')]
  if (weekOf) a.push(`--week-of=${weekOf}`)
  if (privacy) a.push(`--privacy=${privacy}`)
  console.log(`[worker] spawning producer: ${a.join(' ')}`)
  const child = spawn('node', a, { stdio: 'inherit', env: process.env })
  child.on('exit', async (code) => {
    running = false
    console.log(`[worker] producer exited ${code}`)
    // Scale-to-zero: suspend self after the run so we don't bill while idle. The cron
    // resumes us next Thursday. Needs RENDER_API_KEY + RENDER_SERVICE_ID (own id).
    const key = process.env.RENDER_API_KEY, svc = process.env.RENDER_SERVICE_ID
    if (key && svc && process.env.WORKER_SELF_SUSPEND !== 'off') {
      try {
        await new Promise((r) => setTimeout(r, 5000)) // let logs flush
        await fetch(`https://api.render.com/v1/services/${svc}/suspend`, { method: 'POST', headers: { Authorization: `Bearer ${key}` } })
        console.log('[worker] self-suspended (scale to zero)')
      } catch (e) { console.error(`[worker] self-suspend failed: ${e.message}`) }
    }
  })
}

const server = http.createServer((req, res) => {
  if (req.method === 'GET' && req.url === '/health') { res.writeHead(200); return res.end('ok') }

  if (req.method === 'POST' && req.url === '/produce-weekly') {
    if (!TOKEN || req.headers['x-cr-token'] !== TOKEN) { res.writeHead(401); return res.end(JSON.stringify({ error: 'unauthorized' })) }
    if (running) { res.writeHead(409); return res.end(JSON.stringify({ error: 'already running' })) }
    let body = ''
    req.on('data', (c) => { body += c; if (body.length > 1e5) req.destroy() })
    req.on('end', () => {
      let opts = {}; try { opts = body ? JSON.parse(body) : {} } catch { /* ignore */ }
      runProducer(opts.week_of, opts.privacy)
      res.writeHead(202, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ started: true, week_of: opts.week_of || 'current' }))
    })
    return
  }
  res.writeHead(404); res.end('not found')
})

server.listen(PORT, () => console.log(`[worker] listening on :${PORT} (token ${TOKEN ? 'set' : 'MISSING — all requests 401'})`))
