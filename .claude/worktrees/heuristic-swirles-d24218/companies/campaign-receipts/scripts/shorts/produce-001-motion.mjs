#!/usr/bin/env node
/**
 * produce-001-motion.mjs — finish SEALED-001 short with fal i2v motion,
 * persistent SEALED2016.COM overlay band, and a final-card reveal.
 *
 * Reuses vo.mp3, captions.json, metadata.json from _build/001/.
 *
 * Outputs:
 *   _build/001/visual.mp4    (motion + persistent overlay + final card; no audio)
 *   _build/001/captioned.mp4 (visual + burned captions)
 *   _build/001/master.mp4    (final + ducked music)
 *   public/shorts/sealed-001-aipac-iran-deal.mp4
 *   public/shorts/sealed-001-aipac-iran-deal.jpg
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
const W = 1080, H = 1920, FPS = 30

const args = new Set(process.argv.slice(2))
const SKIP_FAL = args.has('--skip-fal')

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
process.env.FAL_KEY = process.env.FAL_KEY || env.FAL_KEY || ''

// ── shell helpers ──────────────────────────────────────────────────────────
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

// Persistent URL bar (bottom). Civic-red text on translucent parchment.
function svgUrlBar() {
  const barH = 100, w = W
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${barH}" viewBox="0 0 ${w} ${barH}">
  <rect width="${w}" height="${barH}" fill="rgb(250,247,239)" fill-opacity="0.85"/>
  <rect x="0" y="0" width="${w}" height="2" fill="#A11B1B" fill-opacity="0.5"/>
  <text x="${w/2}" y="62" text-anchor="middle"
    font-family="Menlo, Monaco, monospace" font-weight="700"
    font-size="36" fill="#A11B1B" letter-spacing="4">SEALED2016.COM  ·  145 PROMISES GRADED</text>
</svg>`
}

// Final-card full-frame SEALED reveal
function svgFinalCard() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="rgb(250,247,239)"/>
  <rect x="0" y="0" width="${W}" height="14" fill="#A11B1B"/>
  <rect x="0" y="${H-14}" width="${W}" height="14" fill="#A11B1B"/>
  <text x="${W/2}" y="780" text-anchor="middle"
    font-family="Georgia, 'Times New Roman', serif" font-weight="900"
    font-size="200" fill="#1a2b4a" letter-spacing="10">SEALED</text>
  <text x="${W/2}" y="880" text-anchor="middle"
    font-family="Georgia, serif" font-style="italic" font-weight="400"
    font-size="44" fill="#5a4a3a">the 2016 promises, on the record</text>
  <line x1="240" y1="980" x2="840" y2="980" stroke="#A11B1B" stroke-width="3"/>
  <text x="${W/2}" y="1100" text-anchor="middle"
    font-family="Helvetica, Arial, sans-serif" font-weight="800"
    font-size="58" fill="#1a2b4a" letter-spacing="3">145 PROMISES GRADED.</text>
  <text x="${W/2}" y="1180" text-anchor="middle"
    font-family="Helvetica, Arial, sans-serif" font-weight="800"
    font-size="58" fill="#1a2b4a" letter-spacing="3">EVERY RECEIPT.</text>
  <text x="${W/2}" y="1440" text-anchor="middle"
    font-family="Menlo, Monaco, monospace" font-weight="700"
    font-size="72" fill="#A11B1B" letter-spacing="2">SEALED2016.COM</text>
</svg>`
}

// Final-card URL-only variant (last 2s, biggest type)
function svgFinalUrlOnly() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="rgb(250,247,239)"/>
  <rect x="0" y="0" width="${W}" height="14" fill="#A11B1B"/>
  <rect x="0" y="${H-14}" width="${W}" height="14" fill="#A11B1B"/>
  <text x="${W/2}" y="960" text-anchor="middle"
    font-family="Menlo, Monaco, monospace" font-weight="900"
    font-size="96" fill="#A11B1B" letter-spacing="2">SEALED2016.COM</text>
  <text x="${W/2}" y="1080" text-anchor="middle"
    font-family="Helvetica, Arial, sans-serif" font-weight="600"
    font-size="46" fill="#1a2b4a" letter-spacing="4">EVERY RECEIPT. ON THE RECORD.</text>
</svg>`
}

// Caption box
function wrap(t, max) {
  const out = []
  for (const para of t.split('\n')) {
    const w = para.split(/\s+/); let line = ''
    for (const word of w) {
      if ((line+' '+word).trim().length > max) { out.push(line); line = word }
      else line = (line+' '+word).trim()
    }
    if (line) out.push(line)
  }
  return out
}
function svgCaption(text) {
  const fs_ = 56, lineH = 76, padX = 32, padY = 26
  const lines = wrap(text, 28)
  const boxW = 980, boxH = lines.length * lineH + padY * 2
  const tspans = lines.map((l,i)=>
    `<tspan x="${boxW/2}" dy="${i===0?lineH*0.78:lineH}">${xml(l)}</tspan>`
  ).join('')
  return { svg: `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${boxW}" height="${boxH}" viewBox="0 0 ${boxW} ${boxH}">
  <rect width="${boxW}" height="${boxH}" rx="18" fill="#000000" fill-opacity="0.80"/>
  <text x="${boxW/2}" y="${padY}" text-anchor="middle"
    font-family="Helvetica, Arial, sans-serif" font-weight="800"
    font-size="${fs_}" fill="#ffffff"
    stroke="#000000" stroke-width="2" paint-order="stroke fill">${tspans}</text>
</svg>`, w: boxW, h: boxH }
}

// ── fal.ai ─────────────────────────────────────────────────────────────────
async function falUpload(localPath, contentType='image/png') {
  const key = process.env.FAL_KEY
  if (!key) throw new Error('FAL_KEY not set')
  const init = await fetch('https://rest.alpha.fal.ai/storage/upload/initiate', {
    method:'POST',
    headers:{'Authorization':`Key ${key}`,'Content-Type':'application/json'},
    body: JSON.stringify({ content_type: contentType, file_name: path.basename(localPath) }),
  })
  if (!init.ok) throw new Error(`fal init ${init.status}: ${await init.text()}`)
  const { file_url, upload_url } = await init.json()
  const put = await fetch(upload_url, { method:'PUT', headers:{'Content-Type':contentType}, body: fs.readFileSync(localPath) })
  if (!put.ok) throw new Error(`fal PUT ${put.status}`)
  return file_url
}
async function falPoll(endpoint, body, timeoutMs = 6*60_000) {
  const key = process.env.FAL_KEY
  const submit = await fetch(`https://queue.fal.run/${endpoint}`, {
    method:'POST', headers:{'Authorization':`Key ${key}`,'Content-Type':'application/json'}, body: JSON.stringify(body),
  })
  if (!submit.ok) throw new Error(`fal submit ${submit.status}: ${(await submit.text()).slice(0,300)}`)
  const sub = await submit.json()
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    await new Promise(r=>setTimeout(r,3000))
    const s = await fetch(sub.status_url, { headers:{'Authorization':`Key ${key}`} })
    if (!s.ok) continue
    const sj = await s.json()
    console.log(`[fal] ${endpoint.split('/').pop()} status=${sj.status}`)
    if (sj.status === 'COMPLETED') break
    if (sj.status === 'FAILED' || sj.status === 'ERROR') throw new Error(`fal FAILED ${JSON.stringify(sj).slice(0,300)}`)
  }
  const r = await fetch(sub.response_url, { headers:{'Authorization':`Key ${key}`} })
  if (!r.ok) throw new Error(`fal result ${r.status}`)
  return await r.json()
}
async function falKlingI2V({ imagePath, prompt, outPath }) {
  const imgUrl = await falUpload(imagePath, 'image/png')
  const result = await falPoll('fal-ai/kling-video/v1.6/standard/image-to-video', {
    prompt, image_url: imgUrl, duration: '5', cfg_scale: 0.5,
  })
  const url = result.video?.url || result.url || result.output?.video?.url
  if (!url) throw new Error(`no video url: ${JSON.stringify(result).slice(0,200)}`)
  const v = await fetch(url); if (!v.ok) throw new Error(`dl ${v.status}`)
  fs.writeFileSync(outPath, Buffer.from(await v.arrayBuffer()))
  return fs.statSync(outPath).size
}

// ── ken-burns fallback on share card ───────────────────────────────────────
function kenBurnsClip({ image, duration, out, zoomDir='in', shake=true, seed=0 }) {
  const frames = Math.round(duration * FPS)
  const perFrameZ = 0.20 / frames
  const z = zoomDir === 'in'
    ? `zoompan=z='min(zoom+${perFrameZ.toFixed(6)},1.20)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${frames}:s=${W}x${H}:fps=${FPS}`
    : `zoompan=z='if(lte(zoom,1.0),1.20,max(1.001,zoom-${perFrameZ.toFixed(6)}))':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${frames}:s=${W}x${H}:fps=${FPS}`
  const shakeFx = shake
    ? `,crop=${W}:${H}:'6*sin(2*PI*t*0.7+${seed})':'4*cos(2*PI*t*0.5+${seed})'`
    : ''
  const filter = `[0:v]scale=${W*2}:${H*2}:force_original_aspect_ratio=increase,crop=${W*2}:${H*2},${z}${shakeFx},trim=duration=${duration},setpts=PTS-STARTPTS,format=yuv420p[v]`
  sh('ffmpeg', ['-y',
    '-framerate', String(FPS), '-loop','1','-t', String(duration), '-i', image,
    '-filter_complex', filter, '-map','[v]',
    '-r', String(FPS), '-c:v','libx264','-pix_fmt','yuv420p','-preset','fast','-crf','20','-an', out])
}

function normalizeClip({ input, duration, out }) {
  // Force into 1080x1920@30 with cover-crop. Re-encode strips bad moov.
  const vf = `scale=${W}:${H}:force_original_aspect_ratio=increase,crop=${W}:${H},trim=duration=${duration},setpts=PTS-STARTPTS,format=yuv420p`
  sh('ffmpeg', ['-y','-i', input, '-vf', vf, '-r', String(FPS),
    '-c:v','libx264','-pix_fmt','yuv420p','-preset','fast','-crf','20','-an', out])
}

function holdStatic({ image, duration, out }) {
  sh('ffmpeg', ['-y','-framerate',String(FPS),'-loop','1','-t',String(duration),'-i', image,
    '-vf', `scale=${W}:${H},format=yuv420p`, '-r', String(FPS),
    '-c:v','libx264','-pix_fmt','yuv420p','-preset','fast','-crf','20','-an', out])
}

function concatClips(list, out) {
  const listFile = path.join(BUILD, 'concat-list.txt')
  fs.writeFileSync(listFile, list.map(f=>`file '${f}'`).join('\n')+'\n')
  sh('ffmpeg', ['-y','-f','concat','-safe','0','-i', listFile,
    '-c:v','libx264','-pix_fmt','yuv420p','-preset','fast','-crf','20','-r',String(FPS),'-an', out])
}

// ── build pipeline ─────────────────────────────────────────────────────────
async function main() {
  const meta = JSON.parse(fs.readFileSync(`${BUILD}/metadata.json`,'utf8'))
  const cuesRaw = JSON.parse(fs.readFileSync(`${BUILD}/captions.json`,'utf8'))
  const voPath = `${BUILD}/vo.mp3`
  const voDur = probeDur(voPath)
  if (!isFinite(voDur) || voDur < 30) { console.error(`Bad vo: ${voDur}s`); process.exit(1) }
  const total = Math.min(60.0, voDur + 1.5)
  console.log(`[plan] voDur=${voDur.toFixed(2)}s total=${total.toFixed(2)}s`)

  const overlays = path.join(BUILD, '_overlays')
  fs.mkdirSync(overlays, { recursive: true })

  // Pre-render overlays
  const urlBarPng = path.join(overlays, 'url-bar.png')
  svgToPng(svgUrlBar(), urlBarPng, W, 100)
  const finalCardPng = path.join(overlays, 'final-card.png')
  svgToPng(svgFinalCard(), finalCardPng, W, H)
  const finalUrlPng = path.join(overlays, 'final-url.png')
  svgToPng(svgFinalUrlOnly(), finalUrlPng, W, H)

  // Phase A: build motion segments covering 0..50s
  // Plan: 3 fal clips × 5s = 15s (0-15), then ken-burns clips for 15-50s (35s split into 2 dynamic kb).
  // Final card: 50-53s (last 3s; URL-only for final 2s).
  const motionEnd = Math.min(50.0, voDur - 0.0)  // cards take final 3s
  const cardStart = motionEnd
  const cardEnd = total
  const cardUrlOnlyStart = cardEnd - 2.0

  const motion = { attempted: [], succeeded: [], failed: [] }
  const segments = []

  // 3 fal i2v attempts on the share card
  const falPrompts = [
    'subtle cinematic motion, slow dramatic camera dolly forward, atmospheric news documentary register, paper grain, no text distortion, no abrupt movement',
    'gentle parallax push-in, editorial newspaper aesthetic, dust motes catching light, archival film grain, no text deformation, slow restrained motion',
    'slow cinematic zoom-out reveal, tense political documentary mood, soft vignette breathing, ink on paper texture, no text distortion',
  ]
  if (!SKIP_FAL) {
    for (let i = 0; i < 3; i++) {
      const raw = path.join(BUILD, `i2v-${i+1}.mp4`)
      const seg = path.join(BUILD, `seg-${i+1}.mp4`)
      let ok = false
      if (fs.existsSync(raw) && fs.statSync(raw).size > 50_000) {
        console.log(`[fal] reusing ${raw}`)
        ok = true
      } else {
        motion.attempted.push({ idx: i+1, prompt: falPrompts[i].slice(0,80) })
        try {
          const sz = await falKlingI2V({
            imagePath: meta.share_card,
            prompt: falPrompts[i],
            outPath: raw,
          })
          logCost(meta.slug, 'fal-ai', 0.08, `kling-1.6-std 5s clip ${i+1}`)
          motion.succeeded.push({ idx: i+1, bytes: sz })
          ok = true
        } catch (e) {
          motion.failed.push({ idx: i+1, error: (e.message||'').slice(0,300) })
          console.warn(`[fal] clip ${i+1} failed: ${(e.message||'').slice(0,200)}`)
        }
      }
      if (ok) {
        normalizeClip({ input: raw, duration: 5.0, out: seg })
        segments.push({ file: seg, dur: 5.0, kind: 'fal' })
      } else {
        // ken-burns fallback for this 5s slot
        kenBurnsClip({
          image: meta.share_card, duration: 5.0, out: seg,
          zoomDir: i%2===0 ? 'in' : 'out', shake: true, seed: i*1.7,
        })
        segments.push({ file: seg, dur: 5.0, kind: 'kb-fallback' })
      }
    }
  } else {
    for (let i = 0; i < 3; i++) {
      const seg = path.join(BUILD, `seg-${i+1}.mp4`)
      kenBurnsClip({ image: meta.share_card, duration: 5.0, out: seg, zoomDir: i%2===0?'in':'out', shake: true, seed: i*1.7 })
      segments.push({ file: seg, dur: 5.0, kind: 'kb-skip' })
    }
  }

  // 15 → motionEnd: split into two ken-burns clips, aggressive shake
  const kbBlockDur = motionEnd - 15.0
  const kb1Dur = kbBlockDur / 2
  const kb2Dur = kbBlockDur - kb1Dur
  const seg4 = path.join(BUILD, 'seg-4.mp4')
  const seg5 = path.join(BUILD, 'seg-5.mp4')
  kenBurnsClip({ image: meta.share_card, duration: kb1Dur, out: seg4, zoomDir:'in', shake:true, seed: 3.1 })
  kenBurnsClip({ image: meta.share_card, duration: kb2Dur, out: seg5, zoomDir:'out', shake:true, seed: 4.3 })
  segments.push({ file: seg4, dur: kb1Dur, kind: 'kb' })
  segments.push({ file: seg5, dur: kb2Dur, kind: 'kb' })

  // Final-card hold (cardStart..cardUrlOnlyStart)
  const fcDur = cardUrlOnlyStart - cardStart
  const seg6 = path.join(BUILD, 'seg-6.mp4')
  holdStatic({ image: finalCardPng, duration: fcDur, out: seg6 })
  segments.push({ file: seg6, dur: fcDur, kind: 'final-card' })

  // URL-only hold (last 2s)
  const urlDur = cardEnd - cardUrlOnlyStart
  const seg7 = path.join(BUILD, 'seg-7.mp4')
  holdStatic({ image: finalUrlPng, duration: urlDur, out: seg7 })
  segments.push({ file: seg7, dur: urlDur, kind: 'final-url' })

  // Concat all into motion-base
  const motionBase = path.join(BUILD, 'motion-base.mp4')
  concatClips(segments.map(s=>s.file), motionBase)

  // Now: overlay the persistent URL bar (only during 0..motionEnd, fade out)
  const visualPath = path.join(BUILD, 'visual.mp4')
  // url-bar appears at bottom; fade out before final card so it doesn't double up
  const urlBarFadeOut = (motionEnd - 0.3).toFixed(2)
  sh('ffmpeg', ['-y',
    '-i', motionBase,
    '-loop','1','-t', String(motionEnd), '-i', urlBarPng,
    '-filter_complex',
      `[1:v]fade=t=out:st=${urlBarFadeOut}:d=0.3:alpha=1[bar];` +
      `[0:v][bar]overlay=0:${H-100}:enable='between(t,0,${motionEnd.toFixed(2)})'[vout]`,
    '-map','[vout]',
    '-c:v','libx264','-pix_fmt','yuv420p','-preset','fast','-crf','20','-r',String(FPS),'-an',
    visualPath,
  ])
  console.log(`[visual] wrote ${visualPath} (${(fs.statSync(visualPath).size/1024/1024).toFixed(2)} MB)`)

  // ── captions ─────────────────────────────────────────────────────────────
  // Re-time cues to voDur.
  const cuesTotalEnd = cuesRaw.reduce((m,c)=>Math.max(m, c.t+c.dur), 0)
  const scale = voDur / cuesTotalEnd
  const cues = cuesRaw.map(c => ({ t: c.t*scale, dur: c.dur*scale, text: c.text }))

  // Hide captions during the final card (last 3s) so the SEALED card isn't covered.
  const cuesForBurn = cues.filter(c => c.t < motionEnd - 0.2)
  const capsDir = path.join(overlays, 'captions')
  fs.mkdirSync(capsDir, { recursive: true })
  const rendered = cuesForBurn.map((c,i) => {
    const { svg, w, h } = svgCaption(c.text)
    const png = path.join(capsDir, `cue-${String(i).padStart(2,'0')}.png`)
    svgToPng(svg, png, w, h)
    return { ...c, png, w, h }
  })

  // Captions vertical: y center near 1180 (above URL bar at 1820). Caption box height ~150 → y=1180-h/2.
  // But URL bar starts at y=1820. So caption bottom <= 1810. Center at 1180 keeps bottom ~1255 — safe.
  const inputs = ['-i', visualPath]
  const ovlist = []
  let last = '[0:v]'
  rendered.forEach((c,i) => {
    inputs.push('-loop','1','-t', String(motionEnd+0.5), '-i', c.png)
    const yTop = 1180 - Math.floor(c.h/2)
    const next = `[c${i}]`
    ovlist.push(`${last}[${i+1}:v]overlay=(W-w)/2:${yTop}:enable='between(t,${c.t.toFixed(3)},${Math.min(c.t+c.dur, motionEnd-0.1).toFixed(3)})'${next}`)
    last = next
  })
  ovlist.push(`${last}null[vout]`)

  const captionedPath = path.join(BUILD, 'captioned.mp4')
  sh('ffmpeg', ['-y', ...inputs,
    '-filter_complex', ovlist.join(';'),
    '-map','[vout]',
    '-c:v','libx264','-pix_fmt','yuv420p','-preset','medium','-crf','20','-r',String(FPS),
    captionedPath,
  ])
  console.log(`[captions] wrote ${captionedPath}`)

  // ── audio mix ────────────────────────────────────────────────────────────
  const mixPath = path.join(BUILD, 'mix.m4a')
  const fadeOutStart = Math.max(0, total - 1.2)
  // Voice at -16 LUFS → boosted again to dominate. Music at -26 LUFS then volume 0.35
  // (≈ -35 LUFS bed level). Aggressive sidechain. Light final limiter only — no loudnorm
  // squash that pulls music back up.
  const aFilter =
    `[0:a]loudnorm=I=-16:TP=-1.5:LRA=7,volume=1.4,apad[voice];` +
    `[1:a]atrim=0:${total},aloop=loop=0:size=1,atrim=0:${total},` +
    `loudnorm=I=-26:TP=-3:LRA=11,volume=0.35,` +
    `afade=t=in:st=0:d=0.5,afade=t=out:st=${fadeOutStart.toFixed(2)}:d=1.2[mu];` +
    `[mu][voice]sidechaincompress=threshold=0.02:ratio=20:attack=80:release=400:level_sc=4[mud];` +
    `[voice][mud]amix=inputs=2:duration=longest:dropout_transition=0:weights=1.0 0.6,` +
    `alimiter=limit=0.95:level=disabled,atrim=0:${total}[aout]`
  sh('ffmpeg', ['-y','-i', voPath, '-i', MUSIC,
    '-filter_complex', aFilter, '-map','[aout]',
    '-c:a','aac','-b:a','192k', mixPath,
  ])

  const masterPath = path.join(BUILD, 'master.mp4')
  sh('ffmpeg', ['-y','-i', captionedPath, '-i', mixPath,
    '-t', String(total), '-c:v','copy','-c:a','copy','-shortest', masterPath,
  ])
  console.log(`[mix] wrote ${masterPath}`)

  // ── verify ───────────────────────────────────────────────────────────────
  const info = JSON.parse(shCap('ffprobe', ['-v','error','-show_format','-show_streams','-of','json', masterPath]).stdout)
  const v = info.streams.find(s=>s.codec_type==='video')
  const a = info.streams.find(s=>s.codec_type==='audio')
  const dur = parseFloat(info.format.duration)
  console.log(`[ffprobe] ${v?.width}x${v?.height} @ ${eval(v.r_frame_rate)}fps  ${dur.toFixed(2)}s  v=${!!v} a=${!!a}`)
  if (v.width !== W || v.height !== H) { console.error('DIMS FAIL'); process.exit(1) }
  if (dur > 60.05) { console.error(`DURATION FAIL ${dur}s`); process.exit(1) }

  // RMS scan
  function rmsDb(file, start, dur_) {
    const r = shCap('ffmpeg', ['-hide_banner','-nostats','-ss',String(start),'-i', file,'-t',String(dur_),
      '-af','astats=metadata=1:reset=0','-f','null','-'])
    const m = [...(r.stderr||'').matchAll(/RMS level dB:\s*(-?\d+(?:\.\d+)?)/g)]
    if (!m.length) return null
    return parseFloat(m[m.length-1][1])
  }
  // Honest RMS: render a music-only track with the same loudnorm chain (no voice),
  // measure RMS at speech windows. Then voice diff = master_speech_rms - music_only_speech_rms.
  // This isolates the sidechain ducking effect from VO loudness.
  const musicOnly = path.join(BUILD, 'music-only.m4a')
  sh('ffmpeg', ['-y','-i', MUSIC, '-filter_complex',
    `[0:a]atrim=0:${total},aloop=loop=0:size=1,atrim=0:${total},loudnorm=I=-26:TP=-3:LRA=11,volume=0.35,` +
    `afade=t=in:st=0:d=0.5,afade=t=out:st=${fadeOutStart.toFixed(2)}:d=1.2,atrim=0:${total}[a]`,
    '-map','[a]','-c:a','aac','-b:a','192k', musicOnly])
  const sorted = [...cues].sort((x,y)=>x.t-y.t)
  const rmsReport = { mode:'music-only-reference', windows: [], pass: true }
  for (const c of sorted.slice(0, 6)) {
    const winDur = Math.min(c.dur-0.2, 1.5)
    const masterR = rmsDb(masterPath, c.t+0.1, winDur)
    // Measure what music WOULD be at this window (un-ducked reference) AND what it actually is in master.
    const musicRefR = rmsDb(musicOnly, c.t+0.1, winDur)
    // For pass criterion: voice in master should be ≥8dB louder than music-only reference at same window.
    const diff = (masterR!=null && musicRefR!=null) ? (masterR - musicRefR) : null
    const pass = diff != null && diff >= 8.0
    rmsReport.windows.push({ t:c.t, master_rms_db: masterR, music_ref_rms_db: musicRefR, diff_vs_music_ref: diff, pass, text:c.text.slice(0,40) })
    if (!pass) rmsReport.pass = false
    console.log(`[rms] @${c.t.toFixed(2)}s "${c.text.slice(0,28)}…" master=${masterR}dB musRef=${musicRefR}dB diff=${diff?.toFixed(2)} ${pass?'PASS':'FAIL'}`)
  }
  fs.writeFileSync(path.join(BUILD,'rms-report.json'), JSON.stringify(rmsReport, null, 2))
  fs.writeFileSync(path.join(BUILD,'motion-report.json'), JSON.stringify(motion, null, 2))

  // ── publish ──────────────────────────────────────────────────────────────
  fs.mkdirSync(PUB_SHORTS, { recursive: true })
  const finalMp4 = path.join(PUB_SHORTS, `${meta.slug}.mp4`)
  fs.copyFileSync(masterPath, finalMp4)
  const thumb = path.join(PUB_SHORTS, `${meta.slug}.jpg`)
  // Thumbnail near verdict-stamp moment (t=1s)
  sh('ffmpeg', ['-y','-ss','1.0','-i', finalMp4, '-frames:v','1','-q:v','2', thumb])
  console.log(`\nDONE: ${finalMp4}`)
  console.log(`Thumb: ${thumb}`)

  const summary = {
    final_mp4: finalMp4, size_bytes: fs.statSync(finalMp4).size, duration_s: dur,
    width: v.width, height: v.height, fps: eval(v.r_frame_rate),
    fal_attempted: motion.attempted.length, fal_succeeded: motion.succeeded.length, fal_failed: motion.failed.length,
    rms_pass: rmsReport.pass, rms_worst_diff: Math.min(...rmsReport.windows.map(w=>w.diff_vs_music||999)),
    segments: segments.map(s=>({kind:s.kind, dur:s.dur})),
  }
  fs.writeFileSync(path.join(BUILD,'summary.json'), JSON.stringify(summary, null, 2))
  console.log(JSON.stringify(summary, null, 2))
}

main().catch(e => { console.error(e); process.exit(1) })
