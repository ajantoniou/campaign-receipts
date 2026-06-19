/**
 * Watermark Editorial Illustrations for Free Share — v2 (editorial poster).
 *
 * Each chapter's base illustration is composited with:
 *   - Top-right: rotated verdict stamp (KEPT / PARTIAL / BROKEN / READER)
 *     in the canonical verdict color, looking like an ink stamp.
 *   - Bottom 30%: parchment-cream strip with the chapter headline burned in,
 *     big serif (Lora-style fallback Palatino), one-liner takeaway.
 *   - Bottom-right corner: SEALED2016.COM wordmark.
 *   - Bottom-left corner (tiny): Receipts at campaignreceipts.com.
 *
 * The headline+stamp+URL all travel with the PNG when shared. No external
 * caption needed for the image to communicate.
 *
 * Usage:  node scripts/watermark-share-images.mjs
 * Output: public/free-shares/sealed-{slug}.png  (9 files, 1408×1760, 9.5:12 ish)
 */

import fs from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import puppeteer from "puppeteer"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, "..")
const PUBLIC = path.join(ROOT, "public")
const OUT = path.join(PUBLIC, "free-shares")

/**
 * Per-chapter spec. The `verdict` matches the canonical chapter verdict in
 * the book TOC. The `headline` is the punchline burned into the parchment
 * strip — tight, factual, one-line.
 */
const ILLUSTRATIONS = [
  {
    slug: "swamp",
    file: "ch1-swamp.jpg",
    verdict: "BROKEN",
    eyebrow: "Drain the swamp",
    headline: "It didn’t drain. It got new tenants.",
  },
  {
    slug: "trade",
    file: "ch2-trade.jpg",
    verdict: "KEPT",
    eyebrow: "Trade",
    headline: "TPP killed Day 3. $350B in China tariffs across four rounds.",
  },
  {
    slug: "jobs",
    file: "ch3-jobs.jpg",
    verdict: "PARTIAL",
    eyebrow: "Jobs & the economy",
    headline: "Unemployment 4.7% → 3.5%. The trend started in 2010.",
  },
  {
    slug: "healthcare",
    file: "ch4-healthcare.jpg",
    verdict: "BROKEN",
    eyebrow: "Healthcare",
    headline: "Seven years of “repeal and replace.” No replacement.",
  },
  {
    slug: "nato",
    file: "ch5-nato.jpg",
    verdict: "PARTIAL",
    eyebrow: "NATO",
    headline: "3 allies at 2% in 2014. 10 by 2020.",
  },
  {
    slug: "middleeast",
    file: "ch6-middleeast.jpg",
    verdict: "PARTIAL",
    eyebrow: "Middle East",
    headline: "Embassy moved. ISIS rolled back. Iran deal scrapped. Russia, no.",
  },
  {
    slug: "china",
    file: "ch7-china.jpg",
    verdict: "KEPT",
    eyebrow: "China",
    headline: "$350B in tariffs. Biden kept them. The fight was real.",
  },
  {
    slug: "wall",
    file: "ch8-wall.jpg",
    verdict: "PARTIAL",
    eyebrow: "The wall",
    headline: "450 miles built. Mexico didn’t pay. The Pentagon did.",
  },
  {
    slug: "laworder",
    file: "ch9-laworder.jpg",
    verdict: "READER",
    eyebrow: "Law & order",
    headline: "Crime fell, then spiked. Which presidency owned which?",
  },
]

/** Verdict color tokens — mirror the in-book + on-site palette. */
const VERDICT = {
  KEPT:    { fg: "#1e7e34", bg: "#e6f4ea", border: "#34a853", label: "KEPT" },
  PARTIAL: { fg: "#e65100", bg: "#fff8e1", border: "#f9a825", label: "PARTIAL" },
  BROKEN:  { fg: "#b71c1c", bg: "#fce4ec", border: "#e53935", label: "BROKEN" },
  BLOCKED: { fg: "#616161", bg: "#f5f5f5", border: "#9e9e9e", label: "BLOCKED" },
  READER:  { fg: "#4a148c", bg: "#f3e5f5", border: "#7b1fa2", label: "READER DECIDES" },
}

async function fileToDataUri(absPath) {
  const data = await fs.readFile(absPath)
  return `data:image/jpeg;base64,${data.toString("base64")}`
}

/**
 * Composition: 1408×1760 total.
 *   - 0…1180 → illustration (cropped from the 1408×768 source, scaled up)
 *   - 1180…1760 → parchment strip (height 580px) with stamp/headline/wordmark
 *
 * 1408×1760 is approximately 4:5 aspect ratio — strong for Instagram and X
 * vertical preview crops.
 */
function pageHtml({ src, verdict, eyebrow, headline }) {
  const v = VERDICT[verdict] || VERDICT.READER
  return `<!doctype html><html><head><style>
    body { margin: 0; background: #faf7ef; font-family: 'Lora', 'Palatino Linotype', Palatino, Georgia, serif; }
    .frame { position: relative; width: 1408px; height: 1760px; overflow: hidden; background: #faf7ef; }

    /* Illustration block (top): inherits 1408×768 source, scaled to 1408×1180 */
    .illus { position: absolute; left: 0; top: 0; width: 1408px; height: 1180px; overflow: hidden; }
    .illus img { display: block; width: 100%; height: 100%; object-fit: cover; }
    /* Faint dark gradient on the bottom of the illustration so the stamp + parchment
       boundary feels intentional, not abrupt. */
    .illus::after {
      content: "";
      position: absolute; left: 0; right: 0; bottom: 0; height: 120px;
      background: linear-gradient(to bottom, rgba(0,0,0,0) 0%, rgba(15,31,58,0.18) 100%);
      pointer-events: none;
    }

    /* Verdict stamp — top-right of the illustration */
    .stamp {
      position: absolute; top: 60px; right: 60px; transform: rotate(-5deg);
      border: 4px solid ${v.fg};
      color: ${v.fg};
      background: ${v.bg};
      padding: 18px 32px;
      font-family: 'Geist Mono', 'Source Code Pro', 'Menlo', monospace;
      font-size: 44px;
      font-weight: 800;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      box-shadow: 0 8px 18px rgba(15,31,58,0.22);
      z-index: 4;
    }
    /* Slight ink-stamp texture: outer faded ring */
    .stamp::before {
      content: "";
      position: absolute; inset: -8px;
      border: 1.5px solid ${v.fg};
      opacity: 0.4;
      pointer-events: none;
    }

    /* Parchment strip (bottom 580px) */
    .strip {
      position: absolute; left: 0; bottom: 0; width: 1408px; height: 580px;
      background: #faf7ef;
      border-top: 1px solid rgba(15,31,58,0.18);
      box-sizing: border-box;
      padding: 60px 80px 70px 80px;
      display: flex; flex-direction: column; justify-content: space-between;
    }
    .gold-rule {
      position: absolute; left: 80px; right: 80px; top: 0;
      height: 2px;
      background: linear-gradient(to right, transparent, #b08a3e 30%, #b08a3e 70%, transparent);
    }

    .eyebrow {
      font-family: 'Geist Mono', 'Source Code Pro', 'Menlo', monospace;
      font-size: 22px; font-weight: 700;
      letter-spacing: 0.30em;
      text-transform: uppercase;
      color: #2a4d7c; /* civic-blue */
    }
    .headline {
      font-family: 'Lora', 'Palatino Linotype', Palatino, Georgia, serif;
      font-size: 64px;
      line-height: 1.18;
      font-weight: 700;
      color: #0f1f3a; /* ink-900 */
      letter-spacing: -0.005em;
      margin-top: 28px;
      max-width: 1100px;
    }

    /* Bottom row: SEALED2016.COM + Receipts at campaignreceipts.com */
    .footer-row {
      display: flex; align-items: flex-end; justify-content: space-between;
      margin-top: 36px;
      padding-top: 28px;
      border-top: 1px solid rgba(15,31,58,0.12);
    }
    .wordmark {
      font-family: 'Geist Mono', 'Source Code Pro', 'Menlo', monospace;
      font-size: 28px;
      font-weight: 800;
      color: #0f1f3a;
      letter-spacing: 0.28em;
      text-transform: uppercase;
    }
    .receipts {
      font-family: 'Geist Mono', 'Source Code Pro', 'Menlo', monospace;
      font-size: 16px;
      font-weight: 600;
      color: #2a4d7c;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      text-align: right;
    }
    .receipts .domain {
      color: #0f1f3a;
    }
  </style></head><body>
    <div class="frame">
      <div class="illus">
        <img src="${src}" alt=""/>
      </div>

      <div class="stamp">${v.label}</div>

      <div class="strip">
        <div class="gold-rule"></div>
        <div>
          <p class="eyebrow">${eyebrow}</p>
          <p class="headline">${headline}</p>
        </div>
        <div class="footer-row">
          <p class="wordmark">SEALED2016.COM</p>
          <p class="receipts">Receipts at <span class="domain">campaignreceipts.com</span></p>
        </div>
      </div>
    </div>
  </body></html>`
}

async function main() {
  await fs.mkdir(OUT, { recursive: true })

  const browser = await puppeteer.launch({ headless: "new" })
  const page = await browser.newPage()
  await page.setViewport({ width: 1408, height: 1760, deviceScaleFactor: 1 })

  for (const it of ILLUSTRATIONS) {
    const src = await fileToDataUri(path.join(PUBLIC, it.file))
    await page.setContent(pageHtml({ src, ...it }), { waitUntil: "load" })
    // Small pause so background images and webfonts settle (we use system
    // serif so font-loading isn't critical, but keep it safe).
    await new Promise((r) => setTimeout(r, 200))
    const outPath = path.join(OUT, `sealed-${it.slug}.png`)
    await page.screenshot({
      path: outPath,
      type: "png",
      clip: { x: 0, y: 0, width: 1408, height: 1760 },
      omitBackground: false,
    })
    console.log(`wrote ${outPath}`)
  }

  await browser.close()
  console.log(`\nDone — ${ILLUSTRATIONS.length} editorial-poster PNGs in public/free-shares/`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
