#!/usr/bin/env node
//
// scripts/longform/cut-cr-shorts.mjs — NATIVE 9:16 (1080x1920) VIRAL YouTube Shorts.
//
// REBUILT 2026-07-01 (short-form expert playbook, Crayo founder / Jack Neel pod
// RCu9Hlpmoi0). The old cutter revealed everything at once and reused the master's VO.
// The retention formula that actually goes viral:
//   HOOK (withholds the payoff) → CONTEXT (build) → PAYOFF (the reveal) → LOOP-BACK
//   (repeat the opening line so viewers re-watch the first 3s → 150-200% intro retention
//    → the algorithm blows it up). Target ~45s (longer shorts get pushed harder than 25s).
// Each short gets its OWN scripted VO (not the long-form audio) + big burned subtitles +
// a card sequence that reveals progressively. SVG+rsvg+ffmpeg + TTS (ElevenLabs→Gemini).
//
// Reads scenes.json (from produce-cr-weekly.mjs): person, actionLabel, billLine, money,
// industry, donorNames, portrait. SVG+rsvg+ffmpeg only (worker-compatible).
//
// Output: scripts/longform/_build/<WEEK>/short-01.mp4, short-02.mp4
// Usage: node scripts/longform/cut-cr-shorts.mjs --week-of=YYYY-MM-DD [--count=2]
// Env: ELEVENLABS_API_KEY (TTS primary), GEMINI_API_KEY (TTS fallback), CR_LONGFORM_VOICE_ID.

import fs from 'node:fs'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..', '..')
const env = process.env
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
function probeDur(f) { const r = spawnSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=nw=1:nk=1', f], { encoding: 'utf8' }); return parseFloat((r.stdout || '').trim()) || 0 }
const xml = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
const clamp = (s, n) => (String(s).length > n ? String(s).slice(0, n - 1).trimEnd() + '…' : String(s))
function wrap(text, per) { const w = String(text).split(/\s+/); const out = []; let cur = ''; for (const x of w) { if ((cur + ' ' + x).trim().length > per) { out.push(cur.trim()); cur = x } else cur += ' ' + x } if (cur.trim()) out.push(cur.trim()); return out }
function svgToPng(svg, png) { const p = png.replace(/\.png$/, '.svg'); fs.writeFileSync(p, svg); sh('rsvg-convert', ['-w', String(SW), '-h', String(SH), p, '-o', png]) }

// ── TTS: ElevenLabs primary → Gemini fallback (same pattern as produce-cr-weekly). ──
function normalizeSpoken(t) {
  return String(t)
    .replace(/\bRep\.\s/g, 'Representative ').replace(/\bSen\.\s/g, 'Senator ').replace(/\bGov\.\s/g, 'Governor ')
    .replace(/\bU\.S\./g, 'U S').replace(/\bD-([A-Z]{2})\b/g, 'Democrat').replace(/\bR-([A-Z]{2})\b/g, 'Republican')
}
async function elevenLabsVo(text, out) {
  const key = env.ELEVENLABS_API_KEY || env.CR_ELEVENLABS_API_KEY
  if (!key) return false
  const voiceId = env.CR_LONGFORM_VOICE_ID || 'EXAVITQu4vr4xnSDxMaL'
  try {
    const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST', headers: { 'xi-api-key': key, 'Content-Type': 'application/json', Accept: 'audio/mpeg' },
      body: JSON.stringify({ text, model_id: 'eleven_multilingual_v2', voice_settings: { stability: 0.5, similarity_boost: 0.75, style: 0.30, use_speaker_boost: true } }),
    })
    if (!r.ok) { console.error(`ElevenLabs ${r.status}`); return false }
    fs.writeFileSync(out, Buffer.from(await r.arrayBuffer())); return true
  } catch (e) { console.error(`ElevenLabs err ${e.message}`); return false }
}
async function geminiVo(text, out) {
  const key = env.GEMINI_API_KEY || env.GOOGLE_API_KEY
  if (!key) return false
  try {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${env.CR_GEMINI_TTS_MODEL || 'gemini-2.5-flash-preview-tts'}:generateContent?key=${key}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text }] }], generationConfig: { responseModalities: ['AUDIO'], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: env.CR_GEMINI_VOICE || 'Kore' } } } } }),
    })
    if (!r.ok) { console.error(`Gemini TTS ${r.status}`); return false }
    const b64 = (await r.json())?.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data
    if (!b64) return false
    const pcm = out.replace(/\.mp3$/, '.pcm'); fs.writeFileSync(pcm, Buffer.from(b64, 'base64'))
    sh('ffmpeg', ['-y', '-f', 's16le', '-ar', '24000', '-ac', '1', '-i', pcm, '-c:a', 'libmp3lame', '-b:a', '192k', out]); fs.rmSync(pcm, { force: true })
    return true
  } catch (e) { console.error(`Gemini TTS err ${e.message}`); return false }
}
async function tts(text, out) {
  const t = normalizeSpoken(text)
  if (await elevenLabsVo(t, out)) return true
  console.log('  ↳ ElevenLabs down — Gemini TTS fallback')
  return geminiVo(t, out)
}

// ── The viral SCRIPT (hook withholds payoff → context → payoff → loop-back line). ──
// Written from scene fields, deterministic, no LLM/Gemini call. Non-causal (juxtapose).
function shortScript(s) {
  const who = normalizeSpoken(s.person || 'This lawmaker')
  const ind = (s.industry || 'this industry').toLowerCase()
  const money = s.money || 'thousands'
  const act = /VOTED/.test(s.actionLabel || '') ? 'voted for' : /SPONSOR/.test(s.actionLabel || '') ? 'sponsored'
    : 'backed'
  const bill = s.billLine || 'the bill'
  const bloc = (s.blocSize && s.blocSize > 1) ? s.blocSize : null
  // HOOK — a question that names the recognizable thing but withholds the punchline.
  const hook = bloc
    ? `${bloc} lawmakers all took money from the ${ind} industry. And then they all did the exact same thing. Watch.`
    : `${who} took ${money} from the ${ind} industry. And then ${who.split(' ').slice(-1)[0]} did something you should see.`
  // CONTEXT — build, still not the full payoff (~15s of spoken words → longer short).
  const context = bloc
    ? `Here's the money trail. The ${ind} industry wrote the checks — donation after donation, all of it public, all of it filed with the Federal Election Commission. Nobody's hiding it. It's just that nobody connects it.`
    : `Here's the money trail. The ${ind} industry sent the checks — ${money} of it, all public, all filed with the Federal Election Commission. Legal. Disclosed. And almost never reported together.`
  // PAYOFF — the reveal they came for.
  const payoff = bloc
    ? `Then every single one of them ${act} ${bill}. The exact same industry that had been funding their campaigns. All of it, on the record.`
    : `Then ${who.split(' ').slice(-1)[0]} ${act} ${bill} — the bill the ${ind} industry was waiting for. We're not saying it's why. We're just showing you the receipts.`
  // LOOP — repeat the opening beat so it seams back to the hook (200% intro retention).
  const loop = `So who's really writing the laws in Washington? Follow the money. Every Friday.`
  return { hook, context, payoff, loop, phases: [
    { key: 'hook', text: hook }, { key: 'context', text: context }, { key: 'payoff', text: payoff }, { key: 'loop', text: loop },
  ] }
}

// ── Cards, one per phase. Progressive reveal: hook shows the QUESTION only; context adds
//    the photo + industry; payoff adds the vote + huge money; loop returns to the hook. ──
function baseCardOpen() {
  return `<rect width="${SW}" height="${SH}" fill="${PAPER}"/><rect x="0" y="0" width="${SW}" height="10" fill="${RED}"/>` +
    `<text x="${SW / 2}" y="150" text-anchor="middle" font-family="Menlo, monospace" font-weight="700" font-size="30" fill="${RED}" letter-spacing="6">CAMPAIGN RECEIPTS</text>`
}
function ctaBar() {
  return `<rect x="0" y="${SH - 120}" width="${SW}" height="120" fill="${NAVY}"/>` +
    `<text x="${SW / 2}" y="${SH - 68}" text-anchor="middle" font-family="Menlo, monospace" font-weight="700" font-size="34" fill="#fff" letter-spacing="3">CAMPAIGNRECEIPTS.COM</text>` +
    `<text x="${SW / 2}" y="${SH - 28}" text-anchor="middle" font-family="Helvetica, sans-serif" font-weight="600" font-size="26" fill="${GOLD}">follow the money · $9 weekly newsletter</text>`
}
function bigText(lines, y, size, fill, weight = 900) {
  return lines.map((ln, k) => `<text x="${SW / 2}" y="${y + k * (size + 14)}" text-anchor="middle" font-family="Helvetica, sans-serif" font-weight="${weight}" font-size="${size}" fill="${fill}">${xml(ln)}</text>`).join('')
}
function phaseCardSvg(phase, s) {
  let body = baseCardOpen()
  if (phase === 'hook' || phase === 'loop') {
    // Big curiosity question, NO answer shown. (loop reuses the same look → seams back.)
    const q = phase === 'loop' ? "WHO'S WRITING THE LAWS?" : (s.blocSize > 1 ? `${s.blocSize} LAWMAKERS. ONE INDUSTRY.` : `${clamp((s.person || '').toUpperCase(), 22)}`)
    body += bigText(wrap(q, 16).slice(0, 3), 640, 96, NAVY)
    body += `<text x="${SW / 2}" y="1080" text-anchor="middle" font-family="Georgia, serif" font-style="italic" font-size="52" fill="${MUTED}">${phase === 'loop' ? 'follow the money →' : 'watch what happened →'}</text>`
  } else if (phase === 'context') {
    // photo + industry, building. (photo composited by ffmpeg at y≈760)
    body += `<text x="${SW / 2}" y="520" text-anchor="middle" font-family="Menlo, monospace" font-weight="700" font-size="40" fill="${MUTED}" letter-spacing="5">TOOK MONEY FROM</text>`
    body += bigText(wrap(`${(s.industry || '').toUpperCase()} DONORS`, 16).slice(0, 2), 620, 72, RED)
    body += `<text x="${SW / 2}" y="${SH - 320}" text-anchor="middle" font-family="Menlo, monospace" font-size="30" fill="${MUTED}" letter-spacing="4">sourced to public FEC filings</text>`
  } else { // payoff — clean centered reveal: action → bill → FROM DONORS → huge money
    body += `<text x="${SW / 2}" y="620" text-anchor="middle" font-family="Menlo, monospace" font-weight="700" font-size="44" fill="${MUTED}" letter-spacing="6">${xml(s.actionLabel || 'THEN VOTED')}</text>`
    body += bigText(wrap(clamp(s.billLine || '', 60), 18).slice(0, 3), 760, 68, NAVY, 800)
    body += `<text x="${SW / 2}" y="1180" text-anchor="middle" font-family="Menlo, monospace" font-weight="700" font-size="32" fill="${MUTED}" letter-spacing="4">FROM ${xml((s.industry || '').toUpperCase())} DONORS</text>`
    body += `<text x="${SW / 2}" y="1400" text-anchor="middle" font-family="Helvetica, sans-serif" font-weight="900" font-size="200" fill="${RED}" letter-spacing="-4">${xml(s.money || '')}</text>`
  }
  body += ctaBar()
  return `<?xml version="1.0"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="${SW}" height="${SH}" viewBox="0 0 ${SW} ${SH}">${body}</svg>`
}

async function main() {
  const scenesPath = path.join(BUILD, 'scenes.json')
  if (!fs.existsSync(scenesPath)) { console.error('No scenes.json — re-render long-form first.'); process.exit(1) }
  const scenes = JSON.parse(fs.readFileSync(scenesPath, 'utf8'))
  const partsDir = path.join(BUILD, 'short-parts'); fs.mkdirSync(partsDir, { recursive: true })

  // Pick the meatiest scenes (biggest money / bloc), must have a person + money.
  const withMoney = scenes.filter((s) => s.person && s.money)
  const picks = (withMoney.length ? withMoney : scenes).slice()
    .sort((a, b) => ((b.blocSize || 1) - (a.blocSize || 1)) || (b.hold || 0) - (a.hold || 0)).slice(0, COUNT)

  const out = []
  for (let n = 0; n < picks.length; n++) {
    const s = picks[n]
    const script = shortScript(s)

    // 1) TTS each phase → measure real durations so cards sync to the voice.
    const phaseClips = []
    for (const ph of script.phases) {
      const mp3 = path.join(partsDir, `s${n + 1}-${ph.key}.mp3`)
      const ok = await tts(ph.text, mp3)
      if (!ok || !fs.existsSync(mp3)) { console.error(`TTS failed for short ${n + 1} ${ph.key}`); process.exit(1) }
      phaseClips.push({ ...ph, mp3, dur: Math.max(1.2, probeDur(mp3)) })
    }

    // 2) Render a card per phase (composite photo on context/payoff).
    for (const ph of phaseClips) {
      const png = path.join(partsDir, `s${n + 1}-${ph.key}.png`); svgToPng(phaseCardSvg(ph.key, s), png)
      let composed = png
      // Photo on the CONTEXT card only. The payoff card is the bill + money reveal (kept
      // clean — stacking the 728px photo there collides with the FROM-DONORS + money rows).
      if (ph.key === 'context' && s.portrait && fs.existsSync(s.portrait)) {
        const framed = path.join(partsDir, `s${n + 1}-${ph.key}-ph.png`)
        sh('ffmpeg', ['-y', '-i', s.portrait, '-vf', 'scale=560:700:force_original_aspect_ratio=increase,crop=560:700,pad=580:728:10:14:color=0x16263D', '-frames:v', '1', framed])
        const c2 = path.join(partsDir, `s${n + 1}-${ph.key}-c.png`)
        sh('ffmpeg', ['-y', '-i', png, '-i', framed, '-filter_complex', `[0:v][1:v]overlay=(W-580)/2:800[o]`, '-map', '[o]', '-frames:v', '1', c2])
        composed = c2
      }
      ph.png = composed
    }

    // 3) Per-phase clip = still card + its VO, with a gentle push-in (motion, no loop).
    const clipList = []
    for (const ph of phaseClips) {
      const frames = Math.max(2, Math.round(ph.dur * FPS))
      const clip = path.join(partsDir, `s${n + 1}-${ph.key}.mp4`)
      sh('ffmpeg', ['-y',
        '-framerate', String(FPS), '-loop', '1', '-t', ph.dur.toFixed(2), '-i', ph.png,
        '-i', ph.mp3,
        '-filter_complex', `[0:v]scale=${SW}:${SH},zoompan=z='min(zoom+0.0005,1.05)':d=${frames}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=${SW}x${SH}:fps=${FPS},format=yuv420p[v]`,
        '-map', '[v]', '-map', '1:a', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-preset', 'fast', '-crf', '20', '-c:a', 'aac', '-b:a', '192k', '-shortest', clip])
      clipList.push(clip)
    }

    // 4) Concat the phases → the short. hook → context → payoff → loop (seams to hook).
    const listFile = path.join(partsDir, `s${n + 1}-concat.txt`)
    fs.writeFileSync(listFile, clipList.map((c) => `file '${c}'`).join('\n') + '\n')
    const outPath = path.join(BUILD, `short-${String(n + 1).padStart(2, '0')}.mp4`)
    sh('ffmpeg', ['-y', '-f', 'concat', '-safe', '0', '-i', listFile, '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-preset', 'fast', '-crf', '20', '-c:a', 'aac', '-b:a', '192k', outPath])
    const dur = probeDur(outPath)
    out.push({ short: n + 1, scene: s.idx + 1, dur: +dur.toFixed(2), file: outPath, structure: 'hook→context→payoff→loop' })
    console.log(`[short ${n + 1}] viral 9:16 · ${dur.toFixed(1)}s · hook→context→payoff→loop${s.portrait ? ' +photo' : ''}`)
  }

  fs.writeFileSync(path.join(BUILD, 'shorts.json'), JSON.stringify(out, null, 2))
  console.log(`Wrote ${out.length} viral vertical shorts.`)
}
main().catch((e) => { console.error('FATAL:', e.message); process.exit(1) })
