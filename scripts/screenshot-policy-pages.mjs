/**
 * Render archived (Wayback) or live policy pages to full-page PNG screenshots.
 *
 * Lives under CampaignReceipts so paths resolve cleanly and Puppeteer is a
 * CR-local devDependency rather than a cross-package borrow.
 *
 * Two preset target sets:
 *   - 2016 — Wayback snapshots of donaldjtrump.com policy pages (5 we have,
 *            7 lost). Wayback wrapper is preserved on purpose; the visible
 *            "Saved from the Wayback Machine on [date]" banner IS the
 *            citation receipt.
 *   - 2024 — Currently-live policy pages on the 2024 campaign infrastructure.
 *            URLs to be filled in once the parallel 2024-mirror agent
 *            confirms which slugs are live.
 *
 * Usage:
 *   node scripts/screenshot-policy-pages.mjs            # default = 2016 preset
 *   node scripts/screenshot-policy-pages.mjs --year 2024
 *   node scripts/screenshot-policy-pages.mjs --url https://... --slug agenda47
 *
 * Output:
 *   public/sources/policy-{slug}-{year}-screenshot.png
 */
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { mkdir } from 'node:fs/promises'
import puppeteer from 'puppeteer'

const __dirname = dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = join(__dirname, '..')
const OUT_DIR = join(REPO_ROOT, 'public', 'sources')

/** @type {Record<string, { slug: string; url: string }[]>} */
const PRESETS = {
  '2016': [
    { slug: 'trade', url: 'https://web.archive.org/web/20161107000000/https://www.donaldjtrump.com/policies/trade' },
    { slug: 'economy', url: 'https://web.archive.org/web/20161107000000/https://www.donaldjtrump.com/policies/economy' },
    { slug: 'regulations', url: 'https://web.archive.org/web/20161107000000/https://www.donaldjtrump.com/policies/regulations' },
    { slug: 'tax-plan', url: 'https://web.archive.org/web/20161107000000/https://www.donaldjtrump.com/policies/tax-plan' },
    { slug: 'national-defense', url: 'https://web.archive.org/web/20161107000000/https://www.donaldjtrump.com/policies/national-defense' },
  ],
  // The live Trump 2024 campaign site removed its policy pages after the
  // election; the donaldjtrump.com domain now serves only a donate-only
  // shell. All 18 assets below were preserved from Wayback Machine snapshots
  // (~Feb 21, 2026) by the parallel mirror agent on 2026-05-14, with fresh
  // Internet Archive saves submitted at the same time.
  //
  // We screenshot the Wayback wrapper on purpose — the visible "Saved from
  // the Wayback Machine on [date]" banner IS the citation receipt and proves
  // the content predates any post-election edits.
  '2024': [
    { slug: 'platform', url: 'https://web.archive.org/web/20260221222030/https://www.donaldjtrump.com/platform' },
    { slug: 'agenda47', url: 'https://web.archive.org/web/20260216061601/https://www.donaldjtrump.com/agenda47' },
    { slug: 'issues-index', url: 'https://web.archive.org/web/20260221222030/https://www.donaldjtrump.com/issues' },
    { slug: 'economy', url: 'https://web.archive.org/web/20260221222030/https://www.donaldjtrump.com/issues/economy' },
    { slug: 'trade', url: 'https://web.archive.org/web/20260221222030/https://www.donaldjtrump.com/issues/trade' },
    { slug: 'energy', url: 'https://web.archive.org/web/20260221222030/https://www.donaldjtrump.com/issues/energy' },
    { slug: 'borders', url: 'https://web.archive.org/web/20260221222030/https://www.donaldjtrump.com/issues/borders' },
    { slug: 'immigration', url: 'https://web.archive.org/web/20260221222030/https://www.donaldjtrump.com/issues/immigration' },
    { slug: 'healthcare', url: 'https://web.archive.org/web/20260221222030/https://www.donaldjtrump.com/issues/healthcare' },
    { slug: 'education', url: 'https://web.archive.org/web/20260221222030/https://www.donaldjtrump.com/issues/education' },
    { slug: 'veterans', url: 'https://web.archive.org/web/20260221222030/https://www.donaldjtrump.com/issues/veterans' },
    { slug: 'safety', url: 'https://web.archive.org/web/20260221222030/https://www.donaldjtrump.com/issues/safety' },
    { slug: 'speech', url: 'https://web.archive.org/web/20260221222030/https://www.donaldjtrump.com/issues/speech' },
    { slug: 'rights', url: 'https://web.archive.org/web/20260221222030/https://www.donaldjtrump.com/issues/rights' },
    { slug: 'strength', url: 'https://web.archive.org/web/20260221222030/https://www.donaldjtrump.com/issues/strength' },
    { slug: 'integrity', url: 'https://web.archive.org/web/20260221222030/https://www.donaldjtrump.com/issues/integrity' },
    { slug: 'cartels', url: 'https://web.archive.org/web/20260221222030/https://www.donaldjtrump.com/issues/cartels' },
    { slug: 'dismantle', url: 'https://web.archive.org/web/20260221222030/https://www.donaldjtrump.com/issues/dismantle-deep-state' },
  ],
}

function parseArgs(argv) {
  const out = { year: '2016', url: null, slug: null }
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i]
    if (a === '--year') out.year = argv[++i]
    else if (a === '--url') out.url = argv[++i]
    else if (a === '--slug') out.slug = argv[++i]
  }
  return out
}

async function renderOne(browser, target, year) {
  console.log(`Rendering ${target.slug} (${year}) …`)
  const page = await browser.newPage()
  await page.setViewport({ width: 1280, height: 800, deviceScaleFactor: 2 })
  try {
    await page.goto(target.url, { waitUntil: 'networkidle2', timeout: 45000 })
  } catch {
    console.warn('  ↳ networkidle2 timeout — falling back to domcontentloaded')
    await page.goto(target.url, { waitUntil: 'domcontentloaded', timeout: 30000 })
  }
  // Some pages inject content after first paint. Give it a beat.
  await new Promise((r) => setTimeout(r, 2500))
  const out = join(OUT_DIR, `policy-${target.slug}-${year}-screenshot.png`)
  await page.screenshot({ path: out, fullPage: true })
  const h = await page.evaluate(() => document.body.scrollHeight)
  console.log(`  ↳ ${out}  (page height ${h}px)`)
  await page.close()
}

async function main() {
  const args = parseArgs(process.argv)
  await mkdir(OUT_DIR, { recursive: true })

  let targets
  if (args.url && args.slug) {
    targets = [{ slug: args.slug, url: args.url }]
  } else {
    targets = PRESETS[args.year] || []
    if (targets.length === 0) {
      console.error(`No targets for year ${args.year}. Available presets: ${Object.keys(PRESETS).join(', ')}`)
      console.error('Or pass --url <URL> --slug <slug> for a one-off render.')
      process.exit(1)
    }
  }

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  })
  try {
    for (const t of targets) {
      await renderOne(browser, t, args.year)
    }
  } finally {
    await browser.close()
  }
  console.log(`\nDone. PNGs in ${OUT_DIR}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
