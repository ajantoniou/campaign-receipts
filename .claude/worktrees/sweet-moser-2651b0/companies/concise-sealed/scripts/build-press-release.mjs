/**
 * SEALED — Press launch assets.
 *
 *  1. public/press/sealed-press-release.pdf — 1-page letter-size press
 *     release any journalist can lift verbatim. Civic-trust palette,
 *     perforated-receipt motif on the bottom edge.
 *  2. public/press/og-press-launch.png — 1200×630 OG card for press-launch
 *     tweet/post. Book cover left, headline + scorecard right.
 *  3. public/press/press-release-preview.png — 1024px-wide screenshot of
 *     the press release HTML for layout verification.
 *
 * Usage:  node scripts/build-press-release.mjs
 */

import fs from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import puppeteer from "puppeteer"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, "..")
const PUBLIC = path.join(ROOT, "public")
const PRESS = path.join(PUBLIC, "press")
const COVER = path.join(PUBLIC, "sealed-cover-hero.png")

const PDF_OUT = path.join(PRESS, "sealed-press-release.pdf")
const OG_OUT = path.join(PRESS, "og-press-launch.png")
const PREVIEW_OUT = path.join(PRESS, "press-release-preview.png")

// Civic-trust palette (matches storefront)
const CREAM = "#f5ecd6"
const PARCHMENT = "#faf5e6"
const NAVY = "#1a2744"
const CIVIC_RED = "#a32638"
const GOLD = "#c8a02e"
const INK = "#1a1a1a"

async function imgDataUri(filepath) {
  const data = await fs.readFile(filepath)
  const ext = path.extname(filepath).slice(1).toLowerCase()
  const mime = ext === "png" ? "image/png" : "image/jpeg"
  return `data:${mime};base64,${data.toString("base64")}`
}

function pressReleaseHtml() {
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><style>
  @page { size: letter; margin: 0; }
  html, body { margin:0; padding:0; background:#ffffff; color:${INK}; }
  body {
    width: 8.5in; height: 11in;
    font-family: Palatino, 'Palatino Linotype', Georgia, 'Times New Roman', serif;
    position: relative;
    box-sizing: border-box;
  }
  .top-band {
    background: ${CIVIC_RED};
    color: ${CREAM};
    height: 0.6in;
    display: flex; align-items: center; justify-content: center;
    font-family: 'Courier New', ui-monospace, monospace;
    font-size: 11pt;
    letter-spacing: 0.28em;
    text-transform: uppercase;
    font-weight: 700;
  }
  .gold-rule { height: 2px; background: ${GOLD}; }
  .body-wrap {
    padding: 0.45in 0.7in 0.5in;
    box-sizing: border-box;
  }
  h1.headline {
    font-family: 'Instrument Serif', 'Palatino Linotype', Palatino, Georgia, serif;
    font-weight: 400;
    font-size: 28pt;
    line-height: 1.12;
    color: ${NAVY};
    margin: 0 0 14px 0;
    letter-spacing: -0.005em;
  }
  .dateline {
    font-family: 'Courier New', ui-monospace, monospace;
    font-size: 9.5pt;
    color: ${INK};
    margin-bottom: 10px;
    letter-spacing: 0.04em;
  }
  .dateline strong { color: ${CIVIC_RED}; }
  p.body {
    font-size: 11pt;
    line-height: 1.45;
    text-align: justify;
    margin: 0 0 9px 0;
    color: ${INK};
  }
  .pull-quote {
    margin: 14px 0 14px 0;
    padding: 10px 18px;
    border-left: 3px solid ${GOLD};
    color: ${NAVY};
    font-style: italic;
    font-size: 12pt;
    line-height: 1.4;
  }
  .pull-quote .attrib {
    display: block;
    margin-top: 6px;
    font-style: normal;
    font-family: 'Courier New', ui-monospace, monospace;
    font-size: 9pt;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: ${INK};
  }
  .facts {
    display: grid;
    grid-template-columns: 1fr 1fr;
    column-gap: 24px;
    row-gap: 4px;
    margin: 10px 0 0 0;
    font-family: 'Courier New', ui-monospace, monospace;
    font-size: 9pt;
    line-height: 1.5;
    color: ${INK};
    padding: 10px 12px;
    border-top: 1px solid ${NAVY};
    border-bottom: 1px solid ${NAVY};
  }
  .facts b { color: ${CIVIC_RED}; font-weight: 700; }
  .bottom-band {
    position: absolute;
    bottom: 0; left: 0; right: 0;
  }
  .perf {
    height: 14px;
    background-image: radial-gradient(circle, #fff 2.5px, transparent 3px);
    background-size: 14px 14px;
    background-position: 0 -7px;
    background-repeat: repeat-x;
    background-color: ${CREAM};
    border-top: 1px dashed ${NAVY};
  }
  .urls {
    background: ${CREAM};
    border-top: 2px solid ${GOLD};
    padding: 10px 0.7in 14px;
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 10px;
    font-family: 'Courier New', ui-monospace, monospace;
    font-size: 9pt;
    color: ${NAVY};
  }
  .urls b { display:block; color: ${CIVIC_RED}; font-size: 8pt; letter-spacing: 0.18em; text-transform: uppercase; margin-bottom: 2px; }
</style></head>
<body>
  <div class="top-band">SEALED Press · For Immediate Release · May 17, 2026</div>
  <div class="gold-rule"></div>
  <div class="body-wrap">
    <h1 class="headline">The 2024 Trump platform was removed from donaldjtrump.com. SEALED Press preserved every word — and graded all 145 of his 2016 promises.</h1>
    <div class="dateline"><strong>WASHINGTON — May 17, 2026 —</strong></div>
    <p class="body">In January 2025, donaldjtrump.com removed its policy platform from the live site. The 17 issue pages, the Agenda47 program, and the full RNC 2024 platform vanished — the URLs now redirect to a donate-only shell. Before they went dark, the Internet Archive captured them. SEALED Press preserved every word: 52 specific commitments with their original Wayback URLs, dated capture timestamps, and issue category.</p>
    <p class="body">Beyond preservation, the book — SEALED: The 2016 Promises, Before the Deals — grades all 145 of Trump's 2016 campaign promises against the 2017–2021 first term. Each verdict — KEPT, PARTIAL, BROKEN, or READER-DECIDES — sits next to the verbatim promise, the date it was made, and a paper trail in primary sources. 81 of 145 promises link directly to a primary-source URL; the remaining 64 cite two contemporaneous independent reports. The AIPAC chapter documents three commitments graded BROKEN against three donor-traceable receipts.</p>
    <p class="body">Of 145 promises: 46 KEPT · 51 PARTIAL · 40 BROKEN · 8 READER-DECIDES. Of the 52 preserved 2024 commitments, 7 are already KEPT via Day-1 executive orders, 20 are IN PROGRESS, 25 are PENDING. The book invites readers to grade the second term in real time at CampaignReceipts.com/trump. SEALED is available as a $15 PDF + ePub at sealed2016.com and as a $25 paperback drop-shipped from Lulu.</p>

    <div class="pull-quote">
      &ldquo;Memory loses. Receipts don't. SEALED is what happens when you grade nine years of promises against the actual paper trail — and watch how easily a person voted in as an outsider becomes the insider.&rdquo;
      <span class="attrib">— Peter Oliver, SEALED Press</span>
    </div>

    <div class="facts">
      <div><b>Pages</b> 144</div>
      <div><b>Author</b> Peter Oliver (pseudonym)</div>
      <div><b>Format</b> $15 PDF + ePub · $25 paperback (drop-shipped, 5–8 days)</div>
      <div><b>Imprint</b> SEALED Press · 2026</div>
      <div><b>ISBN</b> forthcoming</div>
      <div><b>Citation archive</b> CampaignReceipts.com/trump</div>
      <div style="grid-column: 1 / -1;"><b>Preserved platform</b> CampaignReceipts.com/2024-trump-campaign-promises</div>
    </div>
  </div>

  <div class="bottom-band">
    <div class="perf"></div>
    <div class="urls">
      <div><b>Book</b>sealed2016.com</div>
      <div><b>Free archive</b>campaignreceipts.com/2024-trump-campaign-promises</div>
      <div><b>Press contact</b>press@sealed2016.com</div>
    </div>
  </div>
</body></html>`
}

function ogHtml(coverUri) {
  const W = 1200, H = 630
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><style>
  @page { size: ${W}px ${H}px; margin: 0; }
  html, body { margin:0; padding:0; }
  body {
    width: ${W}px; height: ${H}px;
    background: ${PARCHMENT};
    font-family: Palatino, 'Palatino Linotype', Georgia, serif;
    position: relative;
    color: ${INK};
  }
  .top-band {
    position: absolute; top: 0; left: 0; right: 0;
    height: 16px;
    background: ${CIVIC_RED};
  }
  .wrap {
    position: absolute; inset: 16px 0 0 0;
    display: flex; align-items: center;
    padding: 36px 56px;
    box-sizing: border-box;
    gap: 44px;
  }
  .cover-col {
    width: 38%;
    display: flex; align-items: center; justify-content: center;
  }
  .cover-col img {
    max-height: 520px;
    box-shadow: 0 18px 40px rgba(26,39,68,0.35), 0 4px 10px rgba(0,0,0,0.18);
    border-radius: 2px;
  }
  .text-col {
    flex: 1;
    display: flex; flex-direction: column;
    justify-content: center;
    border-left: 2px solid ${GOLD};
    padding-left: 36px;
    min-height: 480px;
  }
  .kicker {
    font-family: 'Courier New', ui-monospace, monospace;
    font-size: 12pt;
    letter-spacing: 0.28em;
    text-transform: uppercase;
    color: ${CIVIC_RED};
    margin-bottom: 14px;
    font-weight: 700;
  }
  .headline {
    font-family: 'Instrument Serif', 'Palatino Linotype', Palatino, Georgia, serif;
    font-size: 44pt;
    line-height: 1.08;
    color: ${NAVY};
    margin: 0 0 18px 0;
    font-weight: 400;
    letter-spacing: -0.01em;
  }
  .subline {
    font-family: -apple-system, 'Helvetica Neue', Arial, sans-serif;
    font-size: 18pt;
    line-height: 1.35;
    color: ${INK};
    margin: 0 0 22px 0;
    opacity: 0.88;
  }
  .scorecard {
    font-family: 'Courier New', ui-monospace, monospace;
    font-size: 15pt;
    color: ${CIVIC_RED};
    font-weight: 700;
    letter-spacing: 0.06em;
    padding: 8px 0;
    border-top: 1px solid ${NAVY};
    border-bottom: 1px solid ${NAVY};
    margin-bottom: 18px;
  }
  .url {
    font-family: 'Courier New', ui-monospace, monospace;
    font-size: 13pt;
    letter-spacing: 0.22em;
    color: ${NAVY};
    font-weight: 700;
  }
</style></head>
<body>
  <div class="top-band"></div>
  <div class="wrap">
    <div class="cover-col">
      <img src="${coverUri}" alt="SEALED book cover" />
    </div>
    <div class="text-col">
      <div class="kicker">SEALED Press · May 17, 2026</div>
      <h1 class="headline">The 2024 Trump platform was removed.<br/>We saved every word.</h1>
      <div class="subline">145 Trump 2016 promises, graded against the receipts. 52 commitments preserved from the deleted 2024 platform.</div>
      <div class="scorecard">46 KEPT · 51 PARTIAL · 40 BROKEN · 8 READER-DECIDES</div>
      <div class="url">SEALED2016.COM</div>
    </div>
  </div>
</body></html>`
}

async function main() {
  await fs.mkdir(PRESS, { recursive: true })
  const coverUri = await imgDataUri(COVER)

  const browser = await puppeteer.launch({ headless: "shell", args: ["--no-sandbox"] })

  // --- Press release PDF ---
  console.log("→ Rendering press release PDF (letter)...")
  {
    const page = await browser.newPage()
    await page.setViewport({ width: 816, height: 1056, deviceScaleFactor: 2 })
    await page.setContent(pressReleaseHtml(), { waitUntil: "networkidle0" })
    await page.pdf({
      path: PDF_OUT,
      format: "letter",
      printBackground: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
    })
    // Preview screenshot at 1024px-wide for visual verification
    await page.setViewport({ width: 1024, height: Math.round(1024 * 11 / 8.5), deviceScaleFactor: 1 })
    await page.screenshot({ path: PREVIEW_OUT, type: "png", fullPage: true })
    await page.close()
  }

  // --- OG card 1200×630 ---
  console.log("→ Rendering OG card 1200×630...")
  {
    const page = await browser.newPage()
    await page.setViewport({ width: 1200, height: 630, deviceScaleFactor: 1 })
    await page.setContent(ogHtml(coverUri), { waitUntil: "networkidle0" })
    await page.screenshot({
      path: OG_OUT,
      type: "png",
      clip: { x: 0, y: 0, width: 1200, height: 630 },
    })
    await page.close()
  }

  await browser.close()

  for (const f of [PDF_OUT, OG_OUT, PREVIEW_OUT]) {
    const s = await fs.stat(f)
    console.log(`✓ ${path.relative(ROOT, f)} (${(s.size / 1024).toFixed(0)} KB)`)
  }
}

main().catch((err) => { console.error("build-press-release failed:", err); process.exitCode = 1 })
