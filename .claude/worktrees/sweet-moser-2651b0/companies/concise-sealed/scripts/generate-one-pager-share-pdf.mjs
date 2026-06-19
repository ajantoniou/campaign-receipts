/**
 * Press / merchant one-pager (single Letter page, pdf-lib).
 * Embeds brand JPG + structured layout — regenerate after cover/messaging updates.
 * Copy uses ASCII only (pdf-lib standard fonts / WinAnsi); swap to embedded fonts if you need curly quotes.
 *
 * Run: node scripts/generate-one-pager-share-pdf.mjs
 * Output: public/sample/sealed-one-pager-share.pdf
 */
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const outPath = path.join(root, 'public', 'sample', 'sealed-one-pager-share.pdf')
const coverPath = path.join(root, 'public', 'product-images', 'cover-mockup-v1.jpg')

const PAGE_W = 612
const PAGE_H = 792
const M = 44

/** PDF coords: bottom-left origin — distance down from top edge */
function fromTop(down) {
  return PAGE_H - down
}

function wrap(text, maxChars) {
  const words = text.split(/\s+/).filter(Boolean)
  const lines = []
  let line = ''
  for (const w of words) {
    const next = line ? `${line} ${w}` : w
    if (next.length > maxChars && line) {
      lines.push(line)
      line = w
    } else {
      line = next
    }
  }
  if (line) lines.push(line)
  return lines
}

async function main() {
  await fs.mkdir(path.dirname(outPath), { recursive: true })

  const doc = await PDFDocument.create()
  const page = doc.addPage([PAGE_W, PAGE_H])

  const regular = await doc.embedFont(StandardFonts.Helvetica)
  const bold = await doc.embedFont(StandardFonts.HelveticaBold)
  const italic = await doc.embedFont(StandardFonts.HelveticaOblique)

  const ink = rgb(0.12, 0.13, 0.16)
  const muted = rgb(0.38, 0.4, 0.44)
  const gold = rgb(0.82, 0.62, 0.14)
  const goldDark = rgb(0.52, 0.38, 0.08)
  const panelBg = rgb(0.06, 0.06, 0.08)
  const quoteBg = rgb(0.09, 0.08, 0.06)

  // --- Top brand bar ---
  const barH = 78
  page.drawRectangle({
    x: 0,
    y: PAGE_H - barH,
    width: PAGE_W,
    height: barH,
    color: rgb(0.02, 0.02, 0.03),
  })
  page.drawRectangle({
    x: 0,
    y: PAGE_H - barH - 3,
    width: PAGE_W,
    height: 3,
    color: gold,
  })

  page.drawText('SEALED', {
    x: M,
    y: fromTop(52),
    size: 28,
    font: bold,
    color: rgb(0.98, 0.98, 0.99),
  })
  page.drawText('The 2016 Promises — Before the Deals', {
    x: M,
    y: fromTop(78),
    size: 11,
    font: regular,
    color: rgb(0.72, 0.74, 0.78),
  })
  page.drawText('Digital edition | Primary-source archive', {
    x: PAGE_W - M - 220,
    y: fromTop(56),
    size: 9,
    font: bold,
    color: rgb(0.85, 0.68, 0.22),
  })

  // --- Hero row: cover + positioning ---
  const coverBytes = await fs.readFile(coverPath)
  const coverImg = await doc.embedJpg(coverBytes)
  const imgW = 210
  const scale = imgW / coverImg.width
  const imgH = coverImg.height * scale
  const rowTop = 118
  const imgBottom = fromTop(rowTop + imgH)

  page.drawImage(coverImg, {
    x: M,
    y: imgBottom,
    width: imgW,
    height: imgH,
  })

  const colX = M + imgW + 22
  const colW = PAGE_W - colX - M
  let ty = fromTop(rowTop)

  page.drawText('What it is', {
    x: colX,
    y: ty,
    size: 10,
    font: bold,
    color: goldDark,
  })
  ty -= 16

  for (const ln of wrap(
    'Verbatim 2015-2016 campaign record: debates, rallies, interviews, so readers compare the "before" to the public record that followed. Not a scorecard from us; methodology stays neutral.',
    52
  )) {
    page.drawText(ln, { x: colX, y: ty, size: 9, font: regular, color: ink, maxWidth: colW })
    ty -= 11
  }
  ty -= 8

  page.drawText('Formats', {
    x: colX,
    y: ty,
    size: 10,
    font: bold,
    color: goldDark,
  })
  ty -= 14
  const bullets = [
    'PDF + ePub at purchase',
    'Audiobook files on the same Lemon Squeezy order when mastering completes',
    'Toolkit tier adds tracking sheet, worksheets & share graphics (site)',
  ]
  for (const b of bullets) {
    page.drawText(`- ${b}`, {
      x: colX,
      y: ty,
      size: 8.5,
      font: regular,
      color: ink,
      maxWidth: colW,
    })
    ty -= 12
  }

  // --- Quote panel (full width below hero row) ---
  const quoteTop = rowTop + imgH + 28
  const quotePad = 14
  const quoteLines = wrap(
    '"I know the lobbyists better than anybody. Because I\'ve used them. But when I become president, I\'m not going to let them control our country anymore."',
    76
  )
  const citeLine = '-- Campaign interview, 2015 | verbatim excerpt'
  const quoteBlockH = quotePad * 2 + quoteLines.length * 13 + 22 + 12

  page.drawRectangle({
    x: M - 2,
    y: fromTop(quoteTop + quoteBlockH),
    width: PAGE_W - (M - 2) * 2,
    height: quoteBlockH,
    borderColor: gold,
    borderWidth: 1,
    color: quoteBg,
  })

  let qy = fromTop(quoteTop + quotePad + 10)
  page.drawText('Anchor excerpt', {
    x: M + quotePad,
    y: qy,
    size: 8,
    font: bold,
    color: rgb(0.75, 0.58, 0.15),
  })
  qy -= 16
  for (const ln of quoteLines) {
    page.drawText(ln, {
      x: M + quotePad,
      y: qy,
      size: 10.5,
      font: italic,
      color: rgb(0.92, 0.88, 0.78),
      maxWidth: PAGE_W - 2 * M - 2 * quotePad,
    })
    qy -= 13
  }
  qy -= 4
  page.drawText(citeLine, {
    x: M + quotePad,
    y: qy,
    size: 8,
    font: regular,
    color: muted,
  })

  // --- Method strip ---
  let my = fromTop(quoteTop + quoteBlockH + 24)
  page.drawText('Method (one line)', {
    x: M,
    y: my,
    size: 9,
    font: bold,
    color: ink,
  })
  my -= 13
  for (const ln of wrap(
    'Primary sources first; official documents as verification hooks; no partisan scorecards in our voice -- readers judge promise vs outcome.',
    92
  )) {
    page.drawText(ln, { x: M, y: my, size: 8.5, font: regular, color: muted })
    my -= 11
  }

  my -= 10
  page.drawRectangle({
    x: M,
    y: my - 52,
    width: PAGE_W - 2 * M,
    height: 52,
    color: panelBg,
    borderColor: rgb(0.18, 0.18, 0.2),
    borderWidth: 0.5,
  })
  page.drawText('Interior voice sample', {
    x: M + 10,
    y: my - 14,
    size: 8,
    font: bold,
    color: rgb(0.65, 0.67, 0.72),
  })
  page.drawText(
    'Case study framing in the manuscript: verbatim block -> what the archive captures -> neutral hooks (where to look). Example section title: "Drain the swamp" / lobbyist influence.',
    {
      x: M + 10,
      y: my - 30,
      size: 8,
      font: italic,
      color: rgb(0.78, 0.8, 0.84),
      maxWidth: PAGE_W - 2 * M - 20,
    }
  )

  // --- Footer ---
  const fy = 42
  page.drawText('sealed-press.onrender.com  |  /sample', {
    x: M,
    y: fy + 14,
    size: 10,
    font: bold,
    color: goldDark,
  })
  page.drawText('SEALED Press | (c) 2026 | Merchant / press one-pager | Personal license terms at purchase', {
    x: M,
    y: fy,
    size: 7.5,
    font: regular,
    color: rgb(0.45, 0.46, 0.48),
  })

  const bytes = await doc.save()
  await fs.writeFile(outPath, bytes)
  console.error('Wrote', outPath)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
