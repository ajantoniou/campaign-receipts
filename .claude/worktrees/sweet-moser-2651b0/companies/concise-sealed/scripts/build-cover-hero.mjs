/**
 * SEALED v1 — Landing-page hero cover image (800×1200 PNG).
 *
 * Reuses the front-cover composition from build-print-cover.mjs (same photo
 * asset at public/sealed-cover-art.jpg, same wordmark + subtitle + author
 * byline) but as a flat 2:3 book-front PNG suitable for use as a hero image.
 *
 * Usage:  node scripts/build-cover-hero.mjs
 * Output: public/sealed-cover-hero.png  (~250-500 KB)
 */

import fs from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import puppeteer from "puppeteer"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, "..")
const PUBLIC = path.join(ROOT, "public")
const COVER_ART = path.join(PUBLIC, "sealed-cover-art.jpg")
const OUTPUT = path.join(PUBLIC, "sealed-cover-hero.png")

const WIDTH = 800
const HEIGHT = 1200

async function imgDataUri(filepath) {
  const data = await fs.readFile(filepath)
  const ext = path.extname(filepath).slice(1).toLowerCase()
  const mime = ext === "png" ? "image/png" : "image/jpeg"
  return `data:${mime};base64,${data.toString("base64")}`
}

function buildHtml(coverArtUri) {
  // Mirrors the .front section of build-print-cover.mjs, retuned for
  // 800×1200 px (vs 6.25"×9.25" in print). All scalar values scaled so
  // the visual rhythm reads identical to the paperback front cover.
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><style>
  @page { size: ${WIDTH}px ${HEIGHT}px; margin: 0; }
  html, body { margin:0; padding:0; background: transparent; }
  body {
    width: ${WIDTH}px; height: ${HEIGHT}px;
    font-family: Palatino, 'Palatino Linotype', Georgia, 'Times New Roman', serif;
  }
  .front {
    width: ${WIDTH}px; height: ${HEIGHT}px;
    position: relative; overflow: hidden;
    background: #1a2744;
  }
  .front-art {
    position: absolute; inset: 0;
    background-image: url('${coverArtUri}');
    background-size: cover;
    background-position: center 30%;
  }
  .front-overlay {
    position: absolute; inset: 0;
    background:
      linear-gradient(to bottom,
        rgba(26,39,68,0.55) 0%,
        rgba(26,39,68,0.05) 35%,
        rgba(26,39,68,0.05) 60%,
        rgba(26,39,68,0.78) 100%);
  }
  .front-content {
    position: absolute; inset: 0;
    padding: 110px 64px 96px;
    box-sizing: border-box;
    display: flex; flex-direction: column; justify-content: space-between;
    color: #f5ecd6;
    text-align: center;
  }
  .front-title {
    font-family: Palatino, Georgia, serif;
    font-size: 130px; font-weight: 700; letter-spacing: 0.18em;
    color: #d4a82e;
    margin: 0;
    line-height: 1.0;
    text-shadow: 0 4px 22px rgba(0,0,0,0.6);
  }
  .front-rule {
    width: 180px; height: 2.5px;
    background: #d4a82e;
    margin: 22px auto;
  }
  .front-sub {
    font-family: Palatino, Georgia, serif;
    font-size: 22px; font-style: italic;
    color: #1a2744;
    background: rgba(245,236,214,0.94);
    padding: 10px 26px;
    display: inline-block;
    align-self: center;
    border-radius: 2px;
  }
  .front-tagline {
    font-family: 'Courier New', ui-monospace, monospace;
    font-size: 13px;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: #f5ecd6;
    opacity: 0.92;
    margin-top: 18px;
    text-shadow: 0 1px 6px rgba(0,0,0,0.7);
  }
  .front-author {
    font-family: Palatino, Georgia, serif;
    font-size: 26px; font-variant: small-caps; letter-spacing: 0.32em;
    color: #f5ecd6;
    margin: 0;
    text-shadow: 0 2px 6px rgba(0,0,0,0.55);
  }
  .front-imprint {
    font-family: 'Courier New', ui-monospace, monospace;
    font-size: 10px;
    letter-spacing: 0.28em;
    text-transform: uppercase;
    color: #d4a82e;
    margin-top: 10px;
    opacity: 0.88;
  }
</style></head>
<body>
  <div class="front">
    <div class="front-art"></div>
    <div class="front-overlay"></div>
    <div class="front-content">
      <div>
        <h1 class="front-title">SEALED</h1>
        <div class="front-rule"></div>
        <div class="front-sub">The 2016 Promises &middot; Before the Deals</div>
        <div class="front-tagline">145 promises &middot; every receipt &middot; you decide</div>
      </div>
      <div>
        <div class="front-author">Peter Oliver</div>
        <div class="front-imprint">SEALED Press &middot; 2026</div>
      </div>
    </div>
  </div>
</body></html>`
}

async function main() {
  const coverArtUri = await imgDataUri(COVER_ART)
  const html = buildHtml(coverArtUri)

  console.log("→ Rendering 800×1200 cover hero PNG via Puppeteer...")
  const browser = await puppeteer.launch({ headless: "shell", args: ["--no-sandbox"] })
  const page = await browser.newPage()
  await page.setViewport({ width: WIDTH, height: HEIGHT, deviceScaleFactor: 1 })
  await page.setContent(html, { waitUntil: "networkidle0" })
  await page.screenshot({
    path: OUTPUT,
    type: "png",
    fullPage: false,
    omitBackground: false,
    clip: { x: 0, y: 0, width: WIDTH, height: HEIGHT },
  })
  await browser.close()
  const stat = await fs.stat(OUTPUT)
  console.log(`✓ Wrote ${OUTPUT} (${(stat.size / 1024).toFixed(0)} KB)`)
}

main().catch((err) => {
  console.error("build-cover-hero failed:", err)
  process.exitCode = 1
})
