#!/usr/bin/env node
/**
 * upload-to-youtube.mjs — upload a finished Short to YouTube via OAuth.
 *
 * Supports --dry-run end-to-end (prints the exact API request body and exits
 * without hitting Google). Real upload requires founder to complete the
 * one-time OAuth flow (see scripts/shorts/README.md).
 *
 * Env (in monorepo root .env):
 *   CR_YOUTUBE_CLIENT_ID
 *   CR_YOUTUBE_CLIENT_SECRET
 *   CR_YOUTUBE_REFRESH_TOKEN     (after one-time --auth flow)
 *   CR_YOUTUBE_CHANNEL_ID=UC4NINNbjaoy2PTKxbY5an-g
 *
 * Usage:
 *   # one-time founder action (browser opens, sign in, paste code)
 *   node scripts/shorts/upload-to-youtube.mjs --auth
 *
 *   # dry-run (no creds needed)
 *   node scripts/shorts/upload-to-youtube.mjs --build scripts/shorts/_build/001 --dry-run
 *
 *   # real upload (privacy: public | unlisted | private)
 *   node scripts/shorts/upload-to-youtube.mjs --build scripts/shorts/_build/001 --privacy unlisted
 */

import fs from 'node:fs'
import path from 'node:path'
import http from 'node:http'
import { URL } from 'node:url'
import { spawnSync } from 'node:child_process'

const REPO = '/Applications/DrAntoniou Projects/AgentCompanies'
const ENV_PATH = `${REPO}/.env`
const TOKEN_STORE = `${REPO}/companies/campaign-receipts/scripts/shorts/.youtube-token.json`
const SCOPES = 'https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube'

function loadEnv() {
  const env = {}
  if (fs.existsSync(ENV_PATH)) {
    for (const line of fs.readFileSync(ENV_PATH, 'utf8').split('\n')) {
      const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
      if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '')
    }
  }
  return env
}

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

async function authFlow() {
  const env = loadEnv()
  const clientId = env.CR_YOUTUBE_CLIENT_ID
  const clientSecret = env.CR_YOUTUBE_CLIENT_SECRET
  if (!clientId || !clientSecret) {
    console.error('Missing CR_YOUTUBE_CLIENT_ID / CR_YOUTUBE_CLIENT_SECRET in .env')
    console.error('See scripts/shorts/README.md for one-time setup.')
    process.exit(1)
  }
  const redirect = 'http://localhost:8766/callback'
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirect,
    response_type: 'code',
    scope: SCOPES,
    access_type: 'offline',
    prompt: 'consent',
  })
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params}`
  console.log(`\nOpen this URL in a browser (signed in as the channel owner):\n${authUrl}\n`)
  spawnSync('open', [authUrl])
  const code = await new Promise(resolve => {
    const srv = http.createServer((req, res) => {
      const u = new URL(req.url, 'http://localhost:8766')
      const c = u.searchParams.get('code')
      if (c) {
        res.end('<h1>OK — close this tab.</h1>')
        srv.close()
        resolve(c)
      } else {
        res.statusCode = 400; res.end('no code')
      }
    }).listen(8766)
  })
  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code, client_id: clientId, client_secret: clientSecret,
      redirect_uri: redirect, grant_type: 'authorization_code',
    }),
  })
  const tokens = await tokenRes.json()
  if (!tokens.refresh_token) {
    console.error('No refresh_token in response. Full response:', tokens)
    process.exit(1)
  }
  fs.mkdirSync(path.dirname(TOKEN_STORE), { recursive: true })
  fs.writeFileSync(TOKEN_STORE, JSON.stringify(tokens, null, 2))
  console.log(`\nSaved refresh token to ${TOKEN_STORE}`)
  console.log(`Add this line to .env:`)
  console.log(`CR_YOUTUBE_REFRESH_TOKEN=${tokens.refresh_token}`)
}

async function getAccessToken(env) {
  const refresh = env.CR_YOUTUBE_REFRESH_TOKEN ||
    (fs.existsSync(TOKEN_STORE) && JSON.parse(fs.readFileSync(TOKEN_STORE, 'utf8')).refresh_token)
  if (!refresh) {
    console.error('No CR_YOUTUBE_REFRESH_TOKEN. Run: --auth')
    process.exit(1)
  }
  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: env.CR_YOUTUBE_CLIENT_ID,
      client_secret: env.CR_YOUTUBE_CLIENT_SECRET,
      refresh_token: refresh,
      grant_type: 'refresh_token',
    }),
  })
  const j = await r.json()
  if (!j.access_token) { console.error('No access_token. Response:', j); process.exit(1) }
  return j.access_token
}

async function uploadVideo(videoPath, metadata, accessToken) {
  const stat = fs.statSync(videoPath)
  // Initiate resumable upload
  const initRes = await fetch('https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      'X-Upload-Content-Type': 'video/mp4',
      'X-Upload-Content-Length': String(stat.size),
    },
    body: JSON.stringify(metadata),
  })
  if (!initRes.ok) {
    const t = await initRes.text()
    console.error(`Init failed: HTTP ${initRes.status} ${t}`); process.exit(1)
  }
  const uploadUrl = initRes.headers.get('location')
  console.log(`[upload] initiated; uploading ${(stat.size / 1024 / 1024).toFixed(2)} MB…`)
  const body = fs.readFileSync(videoPath)
  const put = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': 'video/mp4', 'Content-Length': String(stat.size) },
    body,
  })
  const j = await put.json()
  if (!put.ok) { console.error(`Upload failed: ${JSON.stringify(j)}`); process.exit(1) }
  return j
}

async function setThumbnail(videoId, thumbPath, accessToken) {
  const stat = fs.statSync(thumbPath)
  const body = fs.readFileSync(thumbPath)
  const r = await fetch(`https://www.googleapis.com/upload/youtube/v3/thumbnails/set?videoId=${videoId}`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'image/jpeg', 'Content-Length': String(stat.size) },
    body,
  })
  const j = await r.json()
  if (!r.ok) { console.warn(`Thumbnail set failed: ${JSON.stringify(j)} — video already uploaded; set manually if needed.`); return }
  console.log(`[thumbnail] set.`)
}

async function main() {
  const args = parseArgs()
  if (args.flags.has('auth')) { await authFlow(); return }

  const buildDir = args.build
  if (!buildDir) { console.error('--build <dir> required'); process.exit(1) }
  const meta = JSON.parse(fs.readFileSync(path.join(buildDir, 'metadata.json'), 'utf8'))
  const videoPath = path.join(buildDir, 'master.mp4')
  const thumbPath = path.join(buildDir, 'thumbnail.jpg')
  if (!fs.existsSync(videoPath)) { console.error(`Missing ${videoPath}`); process.exit(1) }

  const privacy = args.privacy || 'private'
  const ytMeta = {
    snippet: {
      title: meta.title.slice(0, 100),
      description: meta.description.slice(0, 5000),
      tags: meta.tags,
      categoryId: '25',  // News & Politics
      defaultLanguage: 'en',
    },
    status: {
      privacyStatus: privacy,
      selfDeclaredMadeForKids: false,
      madeForKids: false,
    },
  }

  if (args.flags.has('dry-run')) {
    console.log('═════ DRY RUN — no upload ═════')
    console.log(`Channel: UC4NINNbjaoy2PTKxbY5an-g (handle: 4NINNbjaoy2PTKxbY5an-g)`)
    console.log(`Video: ${videoPath} (${(fs.statSync(videoPath).size / 1024 / 1024).toFixed(2)} MB)`)
    console.log(`Thumbnail: ${thumbPath}`)
    console.log(`Privacy: ${privacy}`)
    console.log(`Title: ${ytMeta.snippet.title}`)
    console.log(`Tags: ${ytMeta.snippet.tags.join(', ')}`)
    console.log('Description:')
    console.log(ytMeta.snippet.description.split('\n').map(l => '  ' + l).join('\n'))
    console.log('\nAPI request body that WOULD be sent:')
    console.log(JSON.stringify(ytMeta, null, 2))
    console.log('\nTo actually upload: drop --dry-run after founder completes OAuth.')
    return
  }

  const env = loadEnv()
  const token = await getAccessToken(env)
  const res = await uploadVideo(videoPath, ytMeta, token)
  console.log(`[upload] uploaded — videoId=${res.id}`)
  console.log(`         https://www.youtube.com/watch?v=${res.id}`)
  if (fs.existsSync(thumbPath)) await setThumbnail(res.id, thumbPath, token)
  // Persist upload result for run-daily orchestrator
  fs.writeFileSync(path.join(buildDir, 'youtube-result.json'), JSON.stringify(res, null, 2))
}

main().catch(e => { console.error(e); process.exit(1) })
