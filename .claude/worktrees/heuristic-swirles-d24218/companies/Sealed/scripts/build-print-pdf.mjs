/**
 * SEALED v1 — Print Interior PDF Generator (Lulu Direct paperback)
 *
 * Differences vs build-retail-pdf.mjs:
 *   - 6.25 × 9.25 in trim+bleed page (0.125" bleed on a 6×9 trim, all sides)
 *   - No per-page watermark (Lulu does not stamp; per-buyer name goes on the
 *     colophon page via colophon-stamper.mjs at fulfillment time)
 *   - Inserts a four-portrait frontispiece as the FIRST interior page
 *     (before half-title) — Trump 2016/2023/2024/2026 stacked vertically,
 *     full 9" page height, with mono-caps caption at base.
 *   - Adjusts @page size + bleed-respecting safe area.
 *
 * Approach: re-exec the same buildBook() composition from build-retail-pdf.mjs
 * by importing its module functions is not viable (it's a script, not a lib),
 * so this script re-renders the manuscript by SHELLING out via dynamic import
 * of the HTML it would have written, then overriding page styles + injecting
 * the frontispiece. We accomplish this by writing a minimal wrapper that
 * imports build-retail-pdf.mjs's HTML pipeline through monkey-patching its
 * puppeteer call.
 *
 * Simpler path taken: we re-run the build-retail-pdf entry, intercept its
 * generated HTML file (`artifacts/SEALED-v1-retail.html` is always written),
 * then re-render through Puppeteer with print-specific @page CSS overrides.
 *
 * Usage:  node scripts/build-print-pdf.mjs
 * Output: artifacts/SEALED-v1-print.pdf  (and artifacts/SEALED-v1-print.html)
 */

import fs from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { spawnSync } from "node:child_process"
import puppeteer from "puppeteer"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, "..")
const ARTIFACTS = path.join(ROOT, "artifacts")
const PUBLIC = path.join(ROOT, "public")
const RETAIL_HTML = path.join(ARTIFACTS, "SEALED-v1-retail.html")
const OUTPUT_PDF = path.join(ARTIFACTS, "SEALED-v1-print.pdf")
const OUTPUT_HTML = path.join(ARTIFACTS, "SEALED-v1-print.html")

async function imgDataUri(name) {
  const data = await fs.readFile(path.join(PUBLIC, name))
  const ext = path.extname(name).slice(1).toLowerCase()
  const mime = ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg"
  return `data:${mime};base64,${data.toString("base64")}`
}

async function ensureRetailHtml() {
  // Always regen so the print interior reflects current manuscript text.
  console.log("→ Regenerating retail HTML/PDF (so print build is in sync)...")
  const res = spawnSync(
    "node",
    [path.join(__dirname, "build-retail-pdf.mjs")],
    { stdio: "inherit", cwd: ROOT }
  )
  if (res.status !== 0) throw new Error("build-retail-pdf.mjs failed; cannot continue")
  try {
    await fs.access(RETAIL_HTML)
  } catch {
    throw new Error(`Expected ${RETAIL_HTML} but it was not written`)
  }
}

function frontispieceHtml(portraits) {
  // Four portraits stacked vertically, filling the 9" page height.
  // Each portrait occupies ~1.9" tall × full text width, with thin civic-navy hairlines.
  // Caption sits at the base in small mono caps, ink-navy.
  const rows = portraits
    .map(
      (p) => `
    <div class="fp-row">
      <img src="${p.dataUri}" alt=""/>
      <div class="fp-meta">
        <div class="fp-year">${p.year}</div>
        <div class="fp-cap">${p.caption}</div>
      </div>
    </div>`
    )
    .join("")
  return `
<div class="frontispiece">
  ${rows}
  <p class="fp-caption">The promise. The pivot. The platform. The receipt.</p>
</div>`
}

const FRONTISPIECE_STYLES = `
/* Print-only frontispiece (first interior page) */
.frontispiece {
  page-break-after: always;
  width: 100%;
  height: 9in;                 /* trim height; bleed handled by @page */
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 0.55in 0.65in 0.4in;
  box-sizing: border-box;
}
.frontispiece .fp-row {
  display: flex;
  align-items: center;
  gap: 0.18in;
  border-top: 0.4pt solid #1a2744;
  padding: 0.05in 0;
  height: 1.7in;
}
.frontispiece .fp-row:last-of-type { border-bottom: 0.4pt solid #1a2744; }
.frontispiece .fp-row img {
  height: 1.55in;
  width: 1.15in;
  object-fit: cover;
  filter: grayscale(0.15) contrast(1.05);
  border: 0.4pt solid #1a2744;
}
.frontispiece .fp-meta {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.06in;
}
.frontispiece .fp-year {
  font-family: 'Courier New', ui-monospace, monospace;
  font-size: 9pt;
  letter-spacing: 0.18em;
  color: #1a2744;
  text-transform: uppercase;
}
.frontispiece .fp-cap {
  font-family: 'Palatino', Georgia, serif;
  font-size: 11pt;
  font-style: italic;
  color: #2a2a2a;
}
.frontispiece .fp-caption {
  margin-top: 0.25in;
  text-align: center;
  font-family: 'Courier New', ui-monospace, monospace;
  font-size: 8.5pt;
  letter-spacing: 0.22em;
  color: #1a2744;
  text-transform: uppercase;
}
`

const PRINT_PAGE_OVERRIDES = `
/* ─── Print-edition overrides ─── */
/* 6.25 × 9.25 page = 6×9 trim + 0.125" bleed on all four sides.
   Cover/text content remains within the original 6×9 safe area;
   the bleed margin gives Lulu room for trimming variance.        */
@page { size: 6.25in 9.25in; margin: 0; }
html, body { margin: 0; padding: 0; }
/* Push retail page-content's safe-area in by 0.125" on all sides so any
   bleed-aware backgrounds (.cover with negative margins) still hit the
   trim edge without underrunning. */
body > .page-content { padding-top: 0.725in; padding-right: 0.825in; padding-bottom: 0.975in; padding-left: 0.875in; }
/* No interior cover anymore — the wraparound cover (build-print-cover.mjs)
   is the only place the cover image renders. Page 1 of the interior is the
   half-title. */
`

async function main() {
  await fs.mkdir(ARTIFACTS, { recursive: true })
  await ensureRetailHtml()

  console.log("→ Loading retail HTML...")
  let html = await fs.readFile(RETAIL_HTML, "utf-8")

  // The interior frontmatter (half-title, frontispiece, verso, copyright,
  // dedication, TOC) is now baked into the retail HTML directly — see
  // build-retail-pdf.mjs::buildBook(). The print build only needs to
  // overlay 6.25×9.25 page geometry on top of that single source.
  void frontispieceHtml // retained for back-compat callers; no longer invoked
  html = html.replace("</style>", `${PRINT_PAGE_OVERRIDES}\n</style>`)

  await fs.writeFile(OUTPUT_HTML, html, "utf-8")

  console.log("→ Rendering print interior PDF (6.25 × 9.25 in)...")
  const browser = await puppeteer.launch({ headless: true })
  const page = await browser.newPage()
  await page.setContent(html, { waitUntil: "networkidle0" })
  await page.pdf({
    path: OUTPUT_PDF,
    width: "6.25in",
    height: "9.25in",
    printBackground: true,
    displayHeaderFooter: false,
    margin: { top: 0, bottom: 0, left: 0, right: 0 },
    preferCSSPageSize: false,
  })
  await browser.close()

  const stat = await fs.stat(OUTPUT_PDF)
  console.log(`✓ Wrote ${OUTPUT_PDF} (${(stat.size / 1024 / 1024).toFixed(1)} MB)`)
}

main().catch((err) => {
  console.error("build-print-pdf failed:", err)
  process.exitCode = 1
})
