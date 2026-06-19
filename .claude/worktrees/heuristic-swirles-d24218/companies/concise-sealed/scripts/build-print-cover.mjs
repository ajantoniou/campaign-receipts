/**
 * SEALED v1 — Print Wraparound Cover PDF (Lulu Direct paperback)
 *
 * Pipeline:
 *   1. Generate front-cover illustration via fal.ai (Flux dev) — NO text
 *      rendered by the model (avoids the typo trap). Saved as PNG to
 *      public/sealed-cover-art.jpg (skipped if file already exists).
 *   2. Query Lulu /cover-dimensions/ for spine width + total wrap width.
 *   3. Composite a full-bleed wraparound HTML page via Puppeteer:
 *      - back cover (left), spine (center), front cover (right)
 *      - all text (title, author, jacket pitch, scorecard chip, ISBN box)
 *        rendered by Puppeteer (full type fidelity, no model typos)
 *   4. Export to artifacts/SEALED-v1-print-cover.pdf.
 *
 * Usage:  node --env-file=../../.env scripts/build-print-cover.mjs
 * Output: artifacts/SEALED-v1-print-cover.pdf
 *
 * Env:    FAL_KEY (only required if cover art not yet downloaded)
 */

import fs from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import puppeteer from "puppeteer"
import bwipjs from "bwip-js"
import { getCoverDimensions } from "../lib/lulu-client.mjs"
import { PDFDocument } from "pdf-lib"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, "..")
const PUBLIC = path.join(ROOT, "public")
const ARTIFACTS = path.join(ROOT, "artifacts")
const COVER_ART = path.join(PUBLIC, "sealed-cover-art.jpg")
const OUTPUT = path.join(ARTIFACTS, "SEALED-v1-print-cover.pdf")

// Real ISBN issued by Lulu Bookstore 2026-05-18.
const ISBN_DISPLAY = "978-1-105-29182-1"

// Use Lulu's official pre-validated barcode PNG (downloaded from the publish
// wizard, saved to public/isbn-barcode.png). Their print pipeline expects
// the exact barcode they issued; using a self-generated one risks a strict-
// match preflight failure. Read the file at build time, return data URI.
async function isbnBarcodeDataUri() {
  const png = await fs.readFile(path.join(PUBLIC, "isbn-barcode.png"))
  return `data:image/png;base64,${png.toString("base64")}`
}

const POD_PACKAGE_ID = "0600X0900BWSTDPB080CW444GXX" // verified SKU
const PRINT_PDF = path.join(ARTIFACTS, "SEALED-v1-print.pdf")
// PAGE_COUNT is read at runtime from the rendered print PDF (see main()).
// DO NOT hardcode — the spine math depends on it.

const FAL_KEY = process.env.FAL_KEY || process.env.FAL_API_KEY

const COVER_PROMPT =
  "Editorial political illustration in pencil-and-ink style. The Statue of Liberty mid-collapse, falling forward at a dramatic angle, with a large tattered American flag rippling behind her against a stormy sky. Muted civic-red, parchment-cream, and ink-navy palette. Heavy shadow, somber mood. No text. No watermarks. 2:3 aspect ratio for book cover front. Magazine-illustration quality, not photorealistic."

const FAL_BASE = "https://queue.fal.run"
const FAL_MODEL = "fal-ai/flux/dev"

async function falSubmit(model, input) {
  const res = await fetch(`${FAL_BASE}/${model}`, {
    method: "POST",
    headers: { Authorization: `Key ${FAL_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify(input),
  })
  if (!res.ok) throw new Error(`fal submit ${model}: HTTP ${res.status} ${await res.text()}`)
  const j = await res.json()
  if (!j.request_id) throw new Error("fal submit: no request_id")
  return j.request_id
}
async function falPoll(model, requestId, { intervalMs = 4000, timeoutMs = 240_000 } = {}) {
  // Status/result endpoints use the model-GROUP path (e.g. `fal-ai/flux`),
  // not the full model path (`fal-ai/flux/dev`). The model path is only for
  // submission; once queued, the request lives under the group namespace.
  const modelGroup = model.split("/").slice(0, 2).join("/")
  const statusUrl = `${FAL_BASE}/${modelGroup}/requests/${requestId}/status`
  const resultUrl = `${FAL_BASE}/${modelGroup}/requests/${requestId}`
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    const sres = await fetch(statusUrl, { headers: { Authorization: `Key ${FAL_KEY}` } })
    if (!sres.ok) throw new Error(`fal status: ${sres.status}`)
    const status = await sres.json()
    if (status.status === "COMPLETED") {
      const rres = await fetch(resultUrl, { headers: { Authorization: `Key ${FAL_KEY}` } })
      return await rres.json()
    }
    if (status.status === "FAILED" || status.status === "CANCELLED") {
      throw new Error(`fal ${status.status}: ${JSON.stringify(status)}`)
    }
    await new Promise((r) => setTimeout(r, intervalMs))
  }
  throw new Error("fal poll timeout")
}

async function generateCoverArt() {
  try {
    await fs.access(COVER_ART)
    console.log(`→ Cover art already exists at ${COVER_ART} — skipping fal.ai call`)
    return
  } catch {}
  if (!FAL_KEY) throw new Error("FAL_KEY missing — required to generate cover art")
  console.log("→ Generating cover art via fal.ai (Flux dev, ~$0.05 expected)...")
  const reqId = await falSubmit(FAL_MODEL, {
    prompt: COVER_PROMPT,
    image_size: "portrait_4_3", // closest available to 2:3 book cover; we crop in CSS
    num_inference_steps: 32,
    guidance_scale: 4.0,
  })
  console.log(`  request_id=${reqId}, polling...`)
  const result = await falPoll(FAL_MODEL, reqId)
  const url = result.images?.[0]?.url
  if (!url) throw new Error(`no image url in fal result: ${JSON.stringify(result)}`)
  console.log(`  downloading ${url}`)
  const ir = await fetch(url)
  if (!ir.ok) throw new Error(`download cover art: HTTP ${ir.status}`)
  const buf = Buffer.from(await ir.arrayBuffer())
  await fs.writeFile(COVER_ART, buf)
  console.log(`✓ Saved ${COVER_ART} (${(buf.length / 1024).toFixed(0)} KB)`)
}

async function imgDataUri(filepath) {
  const data = await fs.readFile(filepath)
  const ext = path.extname(filepath).slice(1).toLowerCase()
  const mime = ext === "png" ? "image/png" : "image/jpeg"
  return `data:${mime};base64,${data.toString("base64")}`
}

function buildCoverHtml({ totalWidthIn, totalHeightIn, spineIn, coverArtUri, isbnBarcodeUri }) {
  // Layout: total = 0.125" bleed (back outer) + 6in back + spine + 6in front + 0.125" bleed (front outer)
  // Top/bottom: 0.125" bleed each = totalHeight - 0.25" trim region.
  const bleed = 0.125
  const trimW = 6
  const trimH = 9
  // sanity: totalWidthIn should equal 2*(trimW + bleed) + spineIn
  // but we use the value Lulu returned to be exact.
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><style>
  @page { size: ${totalWidthIn}in ${totalHeightIn}in; margin: 0; }
  html, body { margin:0; padding:0; }
  body {
    width: ${totalWidthIn}in; height: ${totalHeightIn}in;
    font-family: Palatino, 'Palatino Linotype', Georgia, 'Times New Roman', serif;
    color: #1a2744; background: #f5ecd6; /* parchment-cream fallback */
    position: relative; overflow: hidden;
  }
  /* Wraparound: back | spine | front, all full height. */
  .wrap { position:absolute; inset:0; display:flex; flex-direction:row; }
  .back  { width: calc(${bleed}in + ${trimW}in); height: 100%; position:relative; background:#f5ecd6; }
  .spine { width: ${spineIn}in; height: 100%; position:relative; background:#f5ecd6; border-left:0.4pt solid #d6c89c; border-right:0.4pt solid #d6c89c; }
  .front { width: calc(${trimW}in + ${bleed}in); height: 100%; position:relative; overflow:hidden; }

  /* ── FRONT COVER ── */
  .front-art {
    position:absolute; inset:0;
    background-image: url('${coverArtUri}');
    background-size: cover;
    background-position: center 30%;
  }
  /* Darken bottom for author readability, soft top vignette for title.    */
  .front-overlay {
    position:absolute; inset:0;
    background:
      linear-gradient(to bottom, rgba(26,39,68,0.55) 0%, rgba(26,39,68,0.05) 35%, rgba(26,39,68,0.05) 60%, rgba(26,39,68,0.75) 100%);
  }
  .front-content {
    position:absolute; inset:0;
    padding: 1.0in 0.6in 0.85in calc(0.6in + ${bleed}in);
    /* extra left pad = bleed, since the inner edge of the front cover meets the spine */
    box-sizing: border-box;
    display:flex; flex-direction:column; justify-content:space-between;
    color: #f5ecd6;
    text-align:center;
  }
  .front-title {
    font-family: Palatino, Georgia, serif;
    font-size: 78pt; font-weight: 700; letter-spacing: 0.18em;
    color: #d4a82e; /* civic-gold/cream */
    margin: 0;
    line-height: 1.0;
    text-shadow: 0 2pt 12pt rgba(0,0,0,0.55);
  }
  .front-rule { width: 1.6in; height: 1.6pt; background:#d4a82e; margin: 0.18in auto; }
  .front-sub {
    font-family: Palatino, Georgia, serif;
    font-size: 14pt; font-style: italic;
    color: #1a2744;
    background: rgba(245,236,214,0.92);
    padding: 0.10in 0.25in;
    display:inline-block;
    align-self:center;
    border-radius: 1pt;
  }
  .front-author {
    font-family: Palatino, Georgia, serif;
    font-size: 16pt; font-variant: small-caps; letter-spacing: 0.32em;
    color: #f5ecd6;
    margin: 0;
    text-shadow: 0 1pt 4pt rgba(0,0,0,0.55);
  }

  /* ── SPINE ── */
  .spine-content {
    position:absolute; inset:0;
    display:flex; flex-direction:column; justify-content:space-between;
    align-items:center;
    padding: 0.5in 0;
    color:#1a2744;
    writing-mode: vertical-rl;   /* text runs top→bottom along the spine */
    transform: rotate(180deg);   /* fix orientation so head=top of spine */
  }
  .spine-title {
    font-family: Palatino, Georgia, serif;
    font-weight: 700;
    font-size: ${spineIn < 0.35 ? 11 : 14}pt;
    letter-spacing: 0.22em;
    color:#1a2744;
  }
  .spine-foot {
    font-family: 'Courier New', ui-monospace, monospace;
    font-size: 6.5pt;
    letter-spacing: 0.18em;
    color:#1a2744;
    text-transform: uppercase;
  }

  /* ── BACK COVER ── */
  .back-content {
    position:absolute; inset:0;
    padding: 0.85in calc(0.55in + ${bleed}in) 0.55in 0.6in;
    /* extra right pad = bleed (back's right edge is the outer trim) — wait,
       actually the back's LEFT edge is the outer trim (left of book back),
       and its RIGHT edge meets the spine. Flip: */
    padding: 0.85in 0.55in 0.55in calc(0.6in + ${bleed}in);
    box-sizing: border-box;
    color:#1a2744;
    display:flex; flex-direction:column; gap: 0.18in;
  }
  .back-eyebrow {
    font-family: 'Courier New', monospace;
    font-size: 8pt; letter-spacing: 0.22em; text-transform:uppercase;
    color: #8a7a50;
  }
  .back-pitch {
    font-family: Palatino, Georgia, serif;
    font-size: 11.5pt;
    line-height: 1.45;
    color: #1a2744;
  }
  .back-pitch strong { color:#7a1414; }
  .scorecard {
    margin-top: 0.15in;
    font-family: 'Courier New', monospace;
    font-size: 9.5pt;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    background: #1a2744;
    color: #f5ecd6;
    padding: 0.10in 0.18in;
    text-align: center;
    display: inline-block;
    align-self: flex-start;
    border-radius: 1pt;
  }
  .back-footer {
    margin-top: auto;
    display:flex; justify-content: space-between; align-items: flex-end; gap: 0.25in;
  }
  .isbn-box {
    width: 1.75in; height: auto;
    padding: 0.08in;
    background: #fff;
    display:flex; align-items:center; justify-content:center;
  }
  .isbn-box img {
    width: 100%; height: auto; display: block;
  }
  .isbn-stripes {
    width: 1.3in; height: 0.5in;
    background: repeating-linear-gradient(90deg, #1a2744 0, #1a2744 1px, transparent 1px, transparent 3px);
    margin-bottom: 0.05in;
  }
  .back-url {
    font-family: 'Courier New', monospace;
    font-size: 10pt; letter-spacing: 0.16em;
    color: #1a2744;
    text-transform: uppercase;
  }
  .back-imprint {
    font-family: 'Courier New', monospace;
    font-size: 7pt;
    letter-spacing: 0.18em;
    color: #8a7a50;
    text-transform: uppercase;
    margin-top: 0.1in;
  }
</style></head>
<body>
  <div class="wrap">
    <!-- BACK -->
    <div class="back">
      <div class="back-content">
        <div class="back-eyebrow">A SEALED Press archive — vol. 1</div>
        <div class="back-pitch">
          <strong>145 campaign promises. Color-coded verdicts. Every receipt.</strong>
          <br/><br/>
          The 2016 platform, graded against what actually happened. No spin, no party — just the record, with the source URL behind every claim.
          <br/><br/>
          Written at a sixth-grade reading level, with 14 original illustrations. The companion citation archive lives at <strong>SEALED2016.COM</strong> — every receipt searchable.
          <br/><br/>
          <em>&ldquo;Memory loses. Receipts don&rsquo;t.&rdquo;</em>
        </div>
        <div class="scorecard">46 KEPT · 51 PARTIAL · 40 BROKEN · 8 READER-DECIDES</div>
        <div class="back-footer">
          <div>
            <div class="back-url">SEALED2016.COM</div>
            <div class="back-imprint">SEALED Press · 2026</div>
          </div>
          <div class="isbn-box">
            <img src="${isbnBarcodeUri}" alt="ISBN ${ISBN_DISPLAY}" />
          </div>
        </div>
      </div>
    </div>

    <!-- SPINE -->
    <div class="spine">
      <div class="spine-content">
        <div class="spine-title">SEALED · The 2016 Promises — Before the Deals</div>
        <div class="spine-foot">P. OLIVER · SEALED2016.COM</div>
      </div>
    </div>

    <!-- FRONT -->
    <div class="front">
      <div class="front-art"></div>
      <div class="front-overlay"></div>
      <div class="front-content">
        <div>
          <h1 class="front-title">SEALED</h1>
          <div class="front-rule"></div>
          <div class="front-sub">The 2016 Promises &middot; Before the Deals</div>
        </div>
        <div class="front-author">P. Oliver</div>
      </div>
    </div>
  </div>
</body></html>`
}

async function main() {
  await fs.mkdir(ARTIFACTS, { recursive: true })

  // 1) cover art
  await generateCoverArt()
  const coverArtUri = await imgDataUri(COVER_ART)

  // 2) Read actual rendered page count from the print PDF
  const printBytes = await fs.readFile(PRINT_PDF)
  const printDoc = await PDFDocument.load(printBytes)
  const PAGE_COUNT = printDoc.getPageCount()
  console.log(`→ Print PDF page count (from ${path.basename(PRINT_PDF)}): ${PAGE_COUNT}`)

  // 3) spine width from Lulu
  console.log("→ Querying Lulu /cover-dimensions/ for spine width...")
  const dims = await getCoverDimensions({
    podPackageId: POD_PACKAGE_ID,
    pageCount: PAGE_COUNT,
    unit: "inch",
  })
  const totalWidth = parseFloat(dims.width)
  const totalHeight = parseFloat(dims.height)
  // total = 2*(6 + 0.125 bleed) + spine = 12.25 + spine
  const spine = +(totalWidth - 12.25).toFixed(3)
  console.log(`  total wrap: ${totalWidth} × ${totalHeight} in, spine: ${spine} in`)

  // 3) generate the EAN-13 ISBN barcode as a base64 PNG data URI
  console.log(`→ Generating ISBN barcode (${ISBN_DISPLAY})...`)
  const isbnBarcodeUri = await isbnBarcodeDataUri()

  // 4) composite HTML
  const html = buildCoverHtml({
    totalWidthIn: totalWidth,
    totalHeightIn: totalHeight,
    spineIn: spine,
    coverArtUri,
    isbnBarcodeUri,
  })
  const htmlPath = path.join(ARTIFACTS, "SEALED-v1-print-cover.html")
  await fs.writeFile(htmlPath, html, "utf-8")

  // 4) render PDF
  console.log("→ Rendering cover PDF via Puppeteer...")
  const browser = await puppeteer.launch({ headless: true })
  const page = await browser.newPage()
  await page.setContent(html, { waitUntil: "networkidle0" })
  await page.pdf({
    path: OUTPUT,
    width: `${totalWidth}in`,
    height: `${totalHeight}in`,
    printBackground: true,
    displayHeaderFooter: false,
    margin: { top: 0, bottom: 0, left: 0, right: 0 },
  })
  await browser.close()
  const stat = await fs.stat(OUTPUT)
  console.log(`✓ Wrote ${OUTPUT} (${(stat.size / 1024 / 1024).toFixed(2)} MB)`)

  // emit dims for downstream consumers
  await fs.writeFile(
    path.join(ARTIFACTS, "SEALED-v1-print-cover.dims.json"),
    JSON.stringify({ totalWidth, totalHeight, spine, podPackageId: POD_PACKAGE_ID, pageCount: PAGE_COUNT }, null, 2)
  )
}

main().catch((err) => {
  console.error("build-print-cover failed:", err)
  process.exitCode = 1
})
