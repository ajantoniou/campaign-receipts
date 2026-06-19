/**
 * SEALED — colophon stamper (paperback fulfillment-time watermark).
 *
 * The print interior PDF (artifacts/SEALED-v1-print.pdf) is built WITHOUT
 * per-page watermarks. Instead, the colophon/copyright page carries a
 * per-buyer license stamp — buyer name + order number + email. This is the
 * paperback equivalent of the digital edition's per-page footer (the legal
 * deterrent surface) without contaminating every printed page.
 *
 * Usage:
 *   import { stampColophon } from "./colophon-stamper.mjs"
 *   const buf = await stampColophon(printPdfBytes, {
 *     name: "Alex Antoniou",
 *     email: "alex@antoniou.net",
 *     orderNumber: "LS-12345",
 *   })
 *
 * Heuristic for "the colophon page": the print interior has a fixed
 * frontmatter ordering — page 1 frontispiece, page 2 retail cover,
 * page 3 half-title, page 4 dedication, page 5 copyright/colophon.
 * We stamp page 5 (0-indexed: 4). The retail build can shift slightly;
 * the stamper accepts an explicit `colophonPageIndex` override.
 */

import { PDFDocument, StandardFonts, rgb } from "pdf-lib"

const DEFAULT_COLOPHON_PAGE_INDEX = 4 // 5th page (0-indexed)

/**
 * Overlay buyer name + order number on the colophon page of the print
 * interior PDF, in-memory. Returns a NEW Buffer (does not mutate input).
 *
 * @param {Uint8Array|Buffer} pdfBytes — print interior PDF
 * @param {object} buyer
 * @param {string} buyer.name
 * @param {string} buyer.email
 * @param {string|number} buyer.orderNumber
 * @param {number} [colophonPageIndex=4]
 * @returns {Promise<Buffer>}
 */
export async function stampColophon(pdfBytes, buyer, colophonPageIndex = DEFAULT_COLOPHON_PAGE_INDEX) {
  if (!pdfBytes) throw new Error("stampColophon: pdfBytes required")
  if (!buyer || !buyer.name || !buyer.orderNumber) {
    throw new Error("stampColophon: buyer.name and buyer.orderNumber required")
  }

  const pdfDoc = await PDFDocument.load(pdfBytes)
  const pages = pdfDoc.getPages()
  if (colophonPageIndex >= pages.length) {
    throw new Error(
      `stampColophon: colophon page index ${colophonPageIndex} out of range (pdf has ${pages.length} pages)`
    )
  }
  const page = pages[colophonPageIndex]
  const { width, height } = page.getSize()

  const helv = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const helvBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

  // Stamp block sits low on the colophon page, well below the existing
  // copyright body text. ~1.4" from bottom trim of a 9.25" page.
  const ink = rgb(0.10, 0.15, 0.27) // ink-navy
  const muted = rgb(0.45, 0.45, 0.45)
  const baseY = 1.4 * 72 // points from bottom

  const heading = "PERSONAL-USE LICENSE"
  const headingSize = 8
  const headingWidth = helvBold.widthOfTextAtSize(heading, headingSize)
  page.drawText(heading, {
    x: (width - headingWidth) / 2,
    y: baseY + 36,
    size: headingSize,
    font: helvBold,
    color: muted,
  })

  // Rule
  page.drawLine({
    start: { x: width / 2 - 70, y: baseY + 30 },
    end: { x: width / 2 + 70, y: baseY + 30 },
    thickness: 0.5,
    color: muted,
  })

  const lineA = `This copy is licensed to ${buyer.name}.`
  const lineASize = 11
  const lineAWidth = helvBold.widthOfTextAtSize(lineA, lineASize)
  page.drawText(lineA, {
    x: (width - lineAWidth) / 2,
    y: baseY + 12,
    size: lineASize,
    font: helvBold,
    color: ink,
  })

  const lineB = `Order #${buyer.orderNumber}${buyer.email ? `  ·  ${buyer.email}` : ""}`
  const lineBSize = 9
  const lineBWidth = helv.widthOfTextAtSize(lineB, lineBSize)
  page.drawText(lineB, {
    x: (width - lineBWidth) / 2,
    y: baseY - 4,
    size: lineBSize,
    font: helv,
    color: ink,
  })

  const lineC =
    "Personal, non-commercial use only. Not for resale. Redistribution prohibited."
  const lineCSize = 7.5
  const lineCWidth = helv.widthOfTextAtSize(lineC, lineCSize)
  page.drawText(lineC, {
    x: (width - lineCWidth) / 2,
    y: baseY - 18,
    size: lineCSize,
    font: helv,
    color: muted,
  })

  const out = await pdfDoc.save()
  return Buffer.from(out)
}
