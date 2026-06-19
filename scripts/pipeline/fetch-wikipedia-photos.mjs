#!/usr/bin/env node
/**
 * Fetch Wikimedia portraits for politicians referenced in storyboards.
 *
 * Saves:
 *   public/photos/wikipedia/<slug>.jpg
 *   public/photos/wikipedia/<slug>.attribution.json
 *
 * Strategy: hit Wikipedia pageimages API for the article title, follow the
 * thumbnail URL, download the JPG. For attribution metadata, hit the
 * Commons imageinfo API on the underlying file.
 *
 * Run:
 *   node scripts/pipeline/fetch-wikipedia-photos.mjs
 *
 * Output: prints per-politician hit / miss / error + a final summary. Misses
 * are appended to eng/photo-cache-gaps.md for the FLUX-Pro fallback path.
 */
import fs from 'node:fs/promises'
import path from 'node:path'

const CR = '/Applications/DrAntoniou Projects/AgentCompanies/companies/campaign-receipts'
const OUT_DIR = path.join(CR, 'public/photos/wikipedia')
const GAPS_MD = path.join(CR, 'eng/photo-cache-gaps.md')
const UA = 'CampaignReceipts/1.0 (https://campaignreceipts.com; ops@campaignreceipts.com)'
const THUMB_SIZE = 800

// Politicians needed for storyboards (Iran LF + CR new-news MO-1).
const TARGETS = [
  { slug: 'donald-trump-2016',     title: 'Donald_Trump' },
  { slug: 'barack-obama-2015',     title: 'Barack_Obama' },
  { slug: 'sheldon-adelson',       title: 'Sheldon_Adelson' },
  { slug: 'benjamin-netanyahu',    title: 'Benjamin_Netanyahu' },
  { slug: 'john-kerry',            title: 'John_Kerry' },
  { slug: 'mohammad-javad-zarif',  title: 'Mohammad_Javad_Zarif' },
  { slug: 'cori-bush',             title: 'Cori_Bush' },
  { slug: 'wesley-bell',           title: 'Wesley_Bell' },
  { slug: 'thomas-massie',         title: 'Thomas_Massie' },
  { slug: 'miriam-adelson',        title: 'Miriam_Adelson' },
  // Ed Gallrein has no Wikipedia page yet (newly elected) — caricature only
  // Rabb PA-3 episode (2026-05-25):
  { slug: 'chris-rabb',            title: 'Chris_Rabb' },
  { slug: 'sharif-street',         title: 'Sharif_Street' },
  { slug: 'ala-stanford',          title: 'Ala_Stanford' },
  { slug: 'dwight-evans',          title: 'Dwight_Evans_(politician)' },
  { slug: 'aoc',                   title: 'Alexandria_Ocasio-Cortez' },
  { slug: 'hasan-piker',           title: 'Hasan_Piker' },
]

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function fetchThumb(title) {
  const url = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=pageimages&format=json&pithumbsize=${THUMB_SIZE}&piprop=thumbnail|name&redirects=1`
  const r = await fetch(url, { headers: { 'User-Agent': UA } })
  if (!r.ok) throw new Error(`HTTP ${r.status} (pageimages)`)
  const j = await r.json()
  const pages = j?.query?.pages || {}
  for (const id of Object.keys(pages)) {
    if (id === '-1') continue
    const p = pages[id]
    if (p?.thumbnail?.source) {
      return { thumb_url: p.thumbnail.source, filename: p.pageimage }
    }
  }
  return null
}

async function fetchAttribution(filename) {
  if (!filename) return null
  const fileTitle = `File:${filename}`
  const url = `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent(fileTitle)}&prop=imageinfo&iiprop=url|extmetadata&format=json`
  const r = await fetch(url, { headers: { 'User-Agent': UA } })
  if (!r.ok) return null
  const j = await r.json()
  const pages = j?.query?.pages || {}
  for (const id of Object.keys(pages)) {
    const info = pages[id]?.imageinfo?.[0]
    if (!info) continue
    const meta = info.extmetadata || {}
    return {
      source_url: info.descriptionurl || info.url,
      file_url: info.url,
      creator: meta.Artist?.value?.replace(/<[^>]+>/g, '').trim() || null,
      license: meta.LicenseShortName?.value || meta.License?.value || 'unknown',
      license_url: meta.LicenseUrl?.value || null,
      credit: meta.Credit?.value?.replace(/<[^>]+>/g, '').trim() || null,
      fetched_at: new Date().toISOString(),
    }
  }
  return null
}

async function download(url, destPath) {
  const r = await fetch(url, { headers: { 'User-Agent': UA } })
  if (!r.ok) throw new Error(`HTTP ${r.status} (download)`)
  const buf = Buffer.from(await r.arrayBuffer())
  await fs.writeFile(destPath, buf)
  return buf.length
}

async function main() {
  await fs.mkdir(OUT_DIR, { recursive: true })
  const gaps = []
  let hits = 0
  let misses = 0
  let errors = 0

  for (const t of TARGETS) {
    const jpg = path.join(OUT_DIR, `${t.slug}.jpg`)
    const attr = path.join(OUT_DIR, `${t.slug}.attribution.json`)
    try {
      // Skip if already cached
      try {
        await fs.access(jpg)
        console.log(`  [skip] ${t.slug} already cached`)
        hits += 1
        continue
      } catch {}

      const result = await fetchThumb(t.title)
      if (!result) {
        console.log(`  [miss] ${t.slug}: no pageimage on ${t.title}`)
        gaps.push(t)
        misses += 1
        await sleep(150)
        continue
      }
      const bytes = await download(result.thumb_url, jpg)
      const attribution = await fetchAttribution(result.filename) || {
        source_url: `https://en.wikipedia.org/wiki/${t.title}`,
        file_url: result.thumb_url,
        license: 'unknown',
        fetched_at: new Date().toISOString(),
      }
      await fs.writeFile(attr, JSON.stringify(attribution, null, 2))
      console.log(`  [hit]  ${t.slug}  ${(bytes/1024).toFixed(1)} KB  (${attribution.license})`)
      hits += 1
      await sleep(200)
    } catch (e) {
      console.error(`  [err]  ${t.slug}: ${e.message}`)
      errors += 1
      gaps.push({ ...t, error: e.message })
      await sleep(200)
    }
  }

  if (gaps.length > 0) {
    const md = [
      '# CR — Wikimedia photo-cache gaps',
      '',
      `_Generated ${new Date().toISOString()} by scripts/pipeline/fetch-wikipedia-photos.mjs_`,
      '',
      '| slug | wiki title | error | fallback |',
      '|---|---|---|---|',
      ...gaps.map(g => `| ${g.slug} | ${g.title} | ${g.error || 'no pageimage'} | FLUX-Pro stylized editorial portrait |`),
      '',
      '## Recommended FLUX-Pro fallback prompt',
      '',
      '> stylized editorial illustration of an older American male senator in business suit, pencil-and-ink documentary aesthetic, NOT photorealistic',
      '',
    ].join('\n')
    await fs.mkdir(path.dirname(GAPS_MD), { recursive: true })
    await fs.writeFile(GAPS_MD, md)
    console.log(`  wrote gap list → ${GAPS_MD}`)
  }

  console.log(`\nDONE  hits=${hits}  misses=${misses}  errors=${errors}  total=${TARGETS.length}`)
}

main().catch((e) => { console.error(e); process.exit(1) })
