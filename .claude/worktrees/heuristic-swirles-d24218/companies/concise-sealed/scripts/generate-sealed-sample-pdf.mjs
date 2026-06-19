/**
 * Canonical 5-page SEALED sample — ONE full section of ONE chapter (demo layout).
 * Part I · Ch.3 · Sec.A — trade frame; margin rail (time / place / audience); verbatim block;
 * body paragraphs are comparison-to-record first (not teaser-before-meat).
 * Lineage: Grab It Nation quotation-archive tradition.
 * Content is hand-curated for this sample (Ch.3 §A trade section) and is held
 * substantively consistent with the canonical manuscript at
 * `scripts/build-retail-pdf.mjs` → `artifacts/SEALED-v1-retail.pdf`. If you
 * change facts/dates/figures in the retail manuscript, audit this file too.
 * Optional embed: public/sealed-typewriter-quote.jpg (small plate on last content page).
 * Run: npm run generate:sample-pdf  ->  public/sample/sealed-sample-preview.pdf
 */
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const outDir = path.join(root, 'public', 'sample')
const outPath = path.join(outDir, 'sealed-sample-preview.pdf')
const SAMPLE_ILLUSTRATION = path.join(root, 'public', 'sealed-typewriter-quote.jpg')

const PAGE_W = 612
const PAGE_H = 792
const M = 54
const RAIL_W = 82
const RAIL_GAP = 10
const MAIN_X = M + RAIL_W + RAIL_GAP
const LW = PAGE_W - 2 * M
const MAIN_W = PAGE_W - MAIN_X - M
const TOTAL = 5
/** Body text must stay above this y (pdf-lib: origin bottom-left; keep clear of footer rule + folio). */
const FOOTER_SAFE_Y = 96

const paper = rgb(0.99, 0.978, 0.965)
const ink = rgb(0.14, 0.13, 0.12)
const inkMuted = rgb(0.42, 0.4, 0.38)
const ruleGold = rgb(0.62, 0.48, 0.22)
const quoteBar = rgb(0.55, 0.42, 0.18)
const quoteBg = rgb(0.97, 0.965, 0.955)

/** @param {number} maxChars */
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

function drawPaper(page) {
  page.drawRectangle({ x: 0, y: 0, width: PAGE_W, height: PAGE_H, color: paper })
  page.drawLine({
    start: { x: M, y: PAGE_H - 48 },
    end: { x: PAGE_W - M, y: PAGE_H - 48 },
    thickness: 0.35,
    color: ruleGold,
    opacity: 0.55,
  })
}

/** @param {{ label: string, value: string }[]} fields */
function drawContextRail(page, startY, fields, helvBold, helv, railMaxChars) {
  let y = startY
  const labelSize = 6.5
  const valSize = 7.5
  const labelGap = 8
  const blockGap = 10
  const x = M
  for (const { label, value } of fields) {
    page.drawText(`${label}:`, { x, y, size: labelSize, font: helvBold, color: inkMuted })
    y -= labelGap
    for (const ln of wrap(value, railMaxChars)) {
      page.drawText(ln, { x, y, size: valSize, font: helv, color: ink })
      y -= 9
    }
    y -= blockGap
  }
  return y
}

function railVerticalRule(page, topY, bottomY) {
  const rx = M + RAIL_W + 5
  page.drawLine({
    start: { x: rx, y: topY },
    end: { x: rx, y: bottomY },
    thickness: 0.45,
    color: ruleGold,
    opacity: 0.45,
  })
}

function runningHead(page, fontLabel, text) {
  const size = 7.5
  const w = fontLabel.widthOfTextAtSize(text, size)
  page.drawText(text, { x: PAGE_W - M - w, y: PAGE_H - 38, size, font: fontLabel, color: inkMuted })
}

function horizontalRule(page, y, widthScale = 1) {
  const w = LW * widthScale
  const x = M + (LW - w) / 2
  page.drawLine({
    start: { x, y },
    end: { x: x + w, y },
    thickness: 0.5,
    color: ruleGold,
    opacity: 0.65,
  })
}

function footer(page, n, fontFolio, fontSans) {
  horizontalRule(page, 56, 1)
  const y = 38
  page.drawText(`SEALED  |  sample section  |  ${n} / ${TOTAL}`, {
    x: M,
    y,
    size: 7.5,
    font: fontFolio,
    color: inkMuted,
  })
  const right = 'Not for resale'
  const rw = fontSans.widthOfTextAtSize(right, 7.5)
  page.drawText(right, { x: PAGE_W - M - rw, y, size: 7.5, font: fontSans, color: inkMuted })
}

function drawQuoteBlock(page, fontItalic, fontRoman, startY, quoteLines, attribution, blockWidth, blockX) {
  const pad = 12
  const lineH = 13
  const attrSize = 8.5
  const quoteSize = 10
  const quoteHeight = quoteLines.length * lineH + pad * 2 + (attribution ? 16 : 0)
  const bottomY = startY - quoteHeight
  page.drawRectangle({
    x: blockX,
    y: bottomY,
    width: blockWidth,
    height: quoteHeight,
    color: quoteBg,
    borderColor: rgb(0.88, 0.84, 0.76),
    borderWidth: 0.5,
  })
  page.drawRectangle({ x: blockX, y: bottomY, width: 4, height: quoteHeight, color: quoteBar })
  let y = startY - pad - quoteSize
  for (const ln of quoteLines) {
    page.drawText(ln, {
      x: blockX + pad + 6,
      y,
      size: quoteSize,
      font: fontItalic,
      color: ink,
      maxWidth: blockWidth - pad * 2 - 10,
    })
    y -= lineH
  }
  if (attribution) {
    y -= 4
    page.drawText(attribution, {
      x: blockX + pad + 6,
      y,
      size: attrSize,
      font: fontRoman,
      color: inkMuted,
    })
  }
  return bottomY - 14
}

/** @param {import('pdf-lib').PDFPage} page */
function drawBodyParas(page, paras, startY, font, maxChars, lineH = 13) {
  let y = startY
  for (const p of paras) {
    for (const ln of wrap(p, maxChars)) {
      page.drawText(ln, { x: MAIN_X, y, size: 10.5, font, color: ink })
      y -= lineH
    }
    y -= 9
  }
  return y
}

/**
 * Two-column comparison wireframe ("THEN vs NOW", "PROMISED vs DELIVERED").
 * Renders side-by-side boxes with a header strip and bullet lines.
 * Returns the y just below the diagram (caller can keep stacking content).
 */
function drawComparisonBoxes(page, opts) {
  const { x, y, w, leftHeader, leftLines, rightHeader, rightLines, fonts } = opts
  const { helvBold, helv } = fonts
  const gap = 14
  const colW = (w - gap) / 2
  const headerH = 22
  const lineH = 13
  const padX = 10
  const padY = 12
  const bodyLines = Math.max(leftLines.length, rightLines.length)
  const bodyH = padY + bodyLines * lineH + padY
  const totalH = headerH + bodyH
  const top = y
  const bottom = y - totalH
  for (let i = 0; i < 2; i++) {
    const colX = x + i * (colW + gap)
    page.drawRectangle({
      x: colX,
      y: bottom,
      width: colW,
      height: totalH,
      borderColor: rgb(0.7, 0.62, 0.42),
      borderWidth: 0.55,
      color: rgb(0.985, 0.975, 0.96),
    })
    page.drawRectangle({
      x: colX,
      y: top - headerH,
      width: colW,
      height: headerH,
      color: rgb(0.92, 0.86, 0.7),
    })
    const header = i === 0 ? leftHeader : rightHeader
    const lines = i === 0 ? leftLines : rightLines
    page.drawText(header, {
      x: colX + padX,
      y: top - 14,
      size: 8.5,
      font: helvBold,
      color: rgb(0.34, 0.26, 0.1),
    })
    let ly = top - headerH - padY - 9
    for (const ln of lines) {
      page.drawText('\u2022', { x: colX + padX, y: ly, size: 10, font: helv, color: ruleGold })
      page.drawText(ln, {
        x: colX + padX + 10,
        y: ly,
        size: 9,
        font: helv,
        color: rgb(0.16, 0.15, 0.13),
      })
      ly -= lineH
    }
  }
  return bottom - 6
}

/**
 * Horizontal timeline with date markers + short labels above and below.
 * `milestones` = [{ date: 'Mar 2018', label: 'Steel & aluminum tariffs' }, ...]
 */
function drawTimeline(page, opts) {
  const { x, y, w, milestones, fonts } = opts
  const { helvBold, helv } = fonts
  const lineY = y - 28
  const tickH = 8
  page.drawLine({
    start: { x, y: lineY },
    end: { x: x + w, y: lineY },
    thickness: 1.2,
    color: rgb(0.42, 0.32, 0.12),
  })
  page.drawCircle({ x, y: lineY, size: 2.5, color: ruleGold })
  page.drawCircle({ x: x + w, y: lineY, size: 2.5, color: ruleGold })
  const n = milestones.length
  const step = w / (n - 1)
  for (let i = 0; i < n; i++) {
    const tx = x + i * step
    page.drawLine({
      start: { x: tx, y: lineY - tickH },
      end: { x: tx, y: lineY + tickH },
      thickness: 0.9,
      color: rgb(0.42, 0.32, 0.12),
    })
    const m = milestones[i]
    const dateW = helvBold.widthOfTextAtSize(m.date, 7.5)
    page.drawText(m.date, {
      x: tx - dateW / 2,
      y: lineY + tickH + 4,
      size: 7.5,
      font: helvBold,
      color: rgb(0.34, 0.26, 0.1),
    })
    const labelLines = wrap(m.label, 18)
    let ly = lineY - tickH - 11
    for (const ln of labelLines) {
      const lw = helv.widthOfTextAtSize(ln, 7.5)
      page.drawText(ln, {
        x: tx - lw / 2,
        y: ly,
        size: 7.5,
        font: helv,
        color: rgb(0.16, 0.15, 0.13),
      })
      ly -= 9
    }
  }
  return lineY - tickH - 11 - 9 * 3
}

/**
 * Cause-effect chain — one or more rows of [trigger] -> [step] -> [step] -> [outcome].
 * `rows` = [{ label: '1. China hit back', steps: ['Tariffs on US farm goods', 'Farmers hurt', 'Govt sent billions in aid'] }, ...]
 */
function drawCauseChain(page, opts) {
  const { x, y, w, rows, fonts } = opts
  const { helvBold, helv } = fonts
  const rowGap = 14
  const labelW = 110
  const arrowW = 18
  let cy = y
  for (const row of rows) {
    const stepW = (w - labelW - row.steps.length * arrowW) / row.steps.length
    const blockH = 30
    page.drawRectangle({
      x,
      y: cy - blockH,
      width: labelW,
      height: blockH,
      color: rgb(0.92, 0.86, 0.7),
      borderColor: rgb(0.7, 0.62, 0.42),
      borderWidth: 0.55,
    })
    const labelLines = wrap(row.label, 20)
    let ly = cy - 12
    for (const ln of labelLines) {
      page.drawText(ln, {
        x: x + 8,
        y: ly,
        size: 8.5,
        font: helvBold,
        color: rgb(0.28, 0.22, 0.08),
      })
      ly -= 10
    }
    let sx = x + labelW
    for (let i = 0; i < row.steps.length; i++) {
      const ax = sx
      const ay = cy - blockH / 2
      page.drawLine({
        start: { x: ax + 3, y: ay },
        end: { x: ax + arrowW - 5, y: ay },
        thickness: 0.7,
        color: rgb(0.42, 0.32, 0.12),
      })
      page.drawLine({
        start: { x: ax + arrowW - 8, y: ay + 3 },
        end: { x: ax + arrowW - 5, y: ay },
        thickness: 0.7,
        color: rgb(0.42, 0.32, 0.12),
      })
      page.drawLine({
        start: { x: ax + arrowW - 8, y: ay - 3 },
        end: { x: ax + arrowW - 5, y: ay },
        thickness: 0.7,
        color: rgb(0.42, 0.32, 0.12),
      })
      sx += arrowW
      page.drawRectangle({
        x: sx,
        y: cy - blockH,
        width: stepW,
        height: blockH,
        color: rgb(0.985, 0.975, 0.96),
        borderColor: rgb(0.7, 0.62, 0.42),
        borderWidth: 0.45,
      })
      const stepLines = wrap(row.steps[i], Math.max(14, Math.floor(stepW / 5)))
      let sy = cy - 12
      for (const ln of stepLines) {
        page.drawText(ln, {
          x: sx + 6,
          y: sy,
          size: 8,
          font: helv,
          color: rgb(0.16, 0.15, 0.13),
        })
        sy -= 10
      }
      sx += stepW
    }
    cy -= blockH + rowGap
  }
  return cy
}

async function main() {
  await fs.mkdir(outDir, { recursive: true })
  const doc = await PDFDocument.create()

  const times = await doc.embedFont(StandardFonts.TimesRoman)
  const timesBold = await doc.embedFont(StandardFonts.TimesRomanBold)
  const timesItalic = await doc.embedFont(StandardFonts.TimesRomanItalic)
  const helv = await doc.embedFont(StandardFonts.Helvetica)
  const helvBold = await doc.embedFont(StandardFonts.HelveticaBold)

  let illustrationJpg = null
  try {
    const imgBytes = await fs.readFile(SAMPLE_ILLUSTRATION)
    illustrationJpg = await doc.embedJpg(imgBytes)
  } catch {
    console.error('Warning: could not embed illustration JPG at', SAMPLE_ILLUSTRATION)
  }

  // --- Page 1: Section opener — reads as the first page of a real book section. ---
  {
    const page = doc.addPage([PAGE_W, PAGE_H])
    drawPaper(page)

    // Top: chapter/section path label, no marketing chrome.
    let y = PAGE_H - M - 18
    const path = 'PART I  ·  CHAPTER 3  ·  TRADE & RECIPROCITY'
    const pw = helvBold.widthOfTextAtSize(path, 8.5)
    page.drawText(path, {
      x: (PAGE_W - pw) / 2,
      y,
      size: 8.5,
      font: helvBold,
      color: rgb(0.42, 0.36, 0.22),
    })
    y -= 18
    horizontalRule(page, y, 0.32)

    // Section title (display).
    y -= 56
    const sectionLine1 = 'Section A.'
    const w1 = timesItalic.widthOfTextAtSize(sectionLine1, 16)
    page.drawText(sectionLine1, {
      x: (PAGE_W - w1) / 2,
      y,
      size: 16,
      font: timesItalic,
      color: rgb(0.45, 0.4, 0.32),
    })
    y -= 34
    const titleBig = 'Fair trade, not free trade.'
    const tw = timesBold.widthOfTextAtSize(titleBig, 26)
    page.drawText(titleBig, {
      x: (PAGE_W - tw) / 2,
      y,
      size: 26,
      font: timesBold,
      color: rgb(0.08, 0.07, 0.06),
    })
    y -= 22
    const dateline = 'Manchester, New Hampshire  ·  2016'
    const dw = timesItalic.widthOfTextAtSize(dateline, 11.5)
    page.drawText(dateline, { x: (PAGE_W - dw) / 2, y, size: 11.5, font: timesItalic, color: inkMuted })
    y -= 38

    // Lede — 6th-grade reading level. Short sentences, common words, one idea each.
    const lede = [
      'In 2016, Donald Trump went to a packed rally in Manchester, New Hampshire. He told the crowd that the days of "free trade" were over. He promised something he called "fair trade" instead.',
      'This part of the book shows you four things in plain English. What he said that night. Why he said it. What actually happened over the next four years. And where he had to back off the promise.',
      'We don\u2019t tell you whether he kept it or broke it. The book gives you the words, the documents, and the story. The score is yours.',
    ]
    for (const p of lede) {
      for (const ln of wrap(p, 64)) {
        const lw = times.widthOfTextAtSize(ln, 10.5)
        page.drawText(ln, { x: (PAGE_W - lw) / 2, y, size: 10.5, font: times, color: ink })
        y -= 14
      }
      y -= 8
    }

    // Imprint line at bottom (no SKUs, no checkout URLs).
    if (y < 130) y = 130
    y = 110
    horizontalRule(page, y + 14, 0.28)
    const imprint1 = 'PART I  \u00b7  CH.3  \u00b7  \u00a7A'
    const iw1 = helvBold.widthOfTextAtSize(imprint1, 7.5)
    page.drawText(imprint1, {
      x: (PAGE_W - iw1) / 2,
      y,
      size: 7.5,
      font: helvBold,
      color: rgb(0.55, 0.48, 0.32),
    })
    y -= 12
    const imprint2 = 'From SEALED \u2014 A Primary-Source Archive of Trump\u2019s 2015\u20132016 Campaign Promises.'
    const iw2 = timesItalic.widthOfTextAtSize(imprint2, 9)
    page.drawText(imprint2, { x: (PAGE_W - iw2) / 2, y, size: 9, font: timesItalic, color: inkMuted })

    footer(page, 1, times, helv)
  }

  const railFieldsA = [
    { label: 'TIME', value: 'Evening · general-election phase' },
    { label: 'PLACE', value: 'Manchester, New Hampshire' },
    { label: 'SETTING', value: 'Arena rally · post-primary campaign push' },
    { label: 'AUDIENCE', value: 'Battleground crowd · ~thousands (broadcast + floor)' },
  ]

  const quoteText =
    '"We are going to make America rich again... It starts with trade \u2014 fair trade, not free trade."'

  // What shaped the promise (Page 2 body) — 6th-grade level, plain English.
  const whatShapedIt = [
    'The crowd that night was full of people whose old factory jobs were gone. For decades, both parties had told them that was just how the world worked. Trump said something different. He told them the rules of trade were rigged against American workers, and he would change them.',
    'He was also picking a fight inside his own party. Big Republican donors had backed "free trade" for years. By saying "fair, not free," Trump made it harder for anyone in the party to walk the promise back later.',
  ]

  // The paper trail (Page 3 body) — plain English with concrete dates and dollars.
  const paperTrail = [
    'Once Trump took office, his team did three big things you can read in the official record.',
    'First, in March 2018, the White House put tariffs on imported steel and aluminum. Most countries had to pay them.',
    'Second, between July 2018 and September 2019, the U.S. put tariffs on about $370 billion worth of goods from China. That was the biggest tariff push by any U.S. president since the 1930s.',
    'Third, the team replaced NAFTA \u2014 the trade deal Trump had attacked by name \u2014 with a new deal called USMCA. It was signed in November 2018 and went into effect on July 1, 2020.',
  ]

  // What shifted after the election (Page 4 body) — plain English, named pressures.
  const whatShifted = [
    'Two big things forced the promise to bend.',
    'China hit back. They put their own tariffs on American soybeans, pork, and corn. American farmers got hurt fast. To keep them in business, the U.S. government paid out billions in emergency farm aid \u2014 money the original promise didn\u2019t plan for.',
    'Congress pushed back. The new USMCA didn\u2019t pass right away. House Democrats added stronger worker protections first. Only then did it pass \u2014 385 to 41 in the House, 89 to 10 in the Senate.',
    'The 2016 promise didn\u2019t disappear. The tariffs and the new deal are still on the books. But the working idea of "fair" got smaller \u2014 fewer countries, smaller fights \u2014 than the rally line suggested.',
  ]

  const fonts = { times, timesBold, timesItalic, helv, helvBold }

  // --- Page 2: Verbatim block + "What shaped the promise" + comparison wireframe. ---
  {
    const page = doc.addPage([PAGE_W, PAGE_H])
    drawPaper(page)
    runningHead(page, helv, 'SEALED  \u00b7  Ch.3 \u00b7 \u00a7A  \u00b7  Manchester, NH \u00b7 2016')

    const railTop = PAGE_H - M - 8
    const railBottom = drawContextRail(page, railTop, railFieldsA, helvBold, helv, 11)

    page.drawText('Verbatim', { x: MAIN_X, y: railTop, size: 8, font: helvBold, color: inkMuted })
    let yMain = railTop - 14
    yMain = drawQuoteBlock(
      page,
      timesItalic,
      times,
      yMain,
      wrap(quoteText, 52),
      'Campaign rally  \u00b7  Manchester, NH  \u00b7  2016 (verbatim excerpt)',
      MAIN_W,
      MAIN_X
    )

    yMain -= 4
    page.drawText('What shaped the promise', { x: MAIN_X, y: yMain, size: 8.5, font: helvBold, color: inkMuted })
    yMain -= 14
    yMain = drawBodyParas(page, whatShapedIt, yMain, times, 58)

    yMain -= 6
    page.drawText('At a glance: two ways to think about trade', {
      x: MAIN_X,
      y: yMain,
      size: 8.5,
      font: helvBold,
      color: inkMuted,
    })
    yMain -= 12
    yMain = drawComparisonBoxes(page, {
      x: MAIN_X,
      y: yMain,
      w: MAIN_W,
      leftHeader: 'FREE TRADE  \u2014  the way it was',
      leftLines: ['Lower tariffs', 'Big multi-country deals', 'Markets decide'],
      rightHeader: 'FAIR TRADE  \u2014  what 2016 promised',
      rightLines: ['Higher tariffs on rivals', 'One-on-one country deals', 'America pushes for better terms'],
      fonts,
    })

    const ruleBottom = Math.min(railBottom, yMain + 24)
    railVerticalRule(page, railTop + 2, ruleBottom)

    footer(page, 2, times, helv)
  }

  // --- Page 3: "The paper trail" body + horizontal timeline of trade actions. ---
  {
    const page = doc.addPage([PAGE_W, PAGE_H])
    drawPaper(page)
    runningHead(page, helv, 'SEALED  \u00b7  Ch.3 \u00b7 \u00a7A  \u00b7  what actually happened')

    const railTop = PAGE_H - M - 8
    const railBottom = drawContextRail(page, railTop, railFieldsA, helvBold, helv, 11)
    railVerticalRule(page, railTop + 4, railBottom + 8)

    let yMain = PAGE_H - M - 8
    page.drawText('What actually happened', { x: MAIN_X, y: yMain, size: 8.5, font: helvBold, color: inkMuted })
    yMain -= 14
    yMain = drawBodyParas(page, paperTrail, yMain, times, 58)

    yMain -= 6
    page.drawText('Timeline: trade actions, 2018 \u2013 2020', {
      x: MAIN_X,
      y: yMain,
      size: 8.5,
      font: helvBold,
      color: inkMuted,
    })
    yMain -= 8
    yMain = drawTimeline(page, {
      x: MAIN_X,
      y: yMain,
      w: MAIN_W,
      milestones: [
        { date: 'Mar 2018', label: 'Steel & aluminum tariffs' },
        { date: 'Jul 2018', label: 'China tariffs Round 1' },
        { date: 'Nov 2018', label: 'USMCA signed' },
        { date: 'Sep 2019', label: 'China tariffs ~$370B total' },
        { date: 'Jul 2020', label: 'USMCA goes live' },
      ],
      fonts,
    })

    footer(page, 3, times, helv)
  }

  // --- Page 4: "Where the promise had to bend" body + cause-effect chains + plate. ---
  {
    const page = doc.addPage([PAGE_W, PAGE_H])
    drawPaper(page)
    runningHead(page, helv, 'SEALED  \u00b7  Ch.3 \u00b7 \u00a7A  \u00b7  where it bent')

    const railTop = PAGE_H - M - 8
    const railBottom = drawContextRail(page, railTop, railFieldsA, helvBold, helv, 11)
    railVerticalRule(page, railTop + 4, railBottom + 8)

    let yMain = PAGE_H - M - 8
    page.drawText('Where the promise had to bend', { x: MAIN_X, y: yMain, size: 8.5, font: helvBold, color: inkMuted })
    yMain -= 14
    yMain = drawBodyParas(page, whatShifted, yMain, times, 58)

    yMain -= 4
    page.drawText('Two pressures, in pictures', {
      x: MAIN_X,
      y: yMain,
      size: 8.5,
      font: helvBold,
      color: inkMuted,
    })
    yMain -= 8
    yMain = drawCauseChain(page, {
      x: MAIN_X,
      y: yMain,
      w: MAIN_W,
      rows: [
        {
          label: '1. China hit back',
          steps: ['Tariffs on US farm goods', 'Farmers hurt', 'Govt sent billions in farm aid'],
        },
        {
          label: '2. Congress pushed back',
          steps: ['House Dems added worker rules', 'Then USMCA passed', '385\u201341 House  \u00b7  89\u201310 Senate'],
        },
      ],
      fonts,
    })

    if (illustrationJpg) {
      yMain -= 6
      const maxW = MAIN_W * 0.78
      const maxH = Math.min(120, Math.max(60, yMain - FOOTER_SAFE_Y - 18))
      const scale = Math.min(maxW / illustrationJpg.width, maxH / illustrationJpg.height)
      const iw = illustrationJpg.width * scale
      const ih = illustrationJpg.height * scale
      if (ih >= 48 && yMain - ih > FOOTER_SAFE_Y) {
        page.drawImage(illustrationJpg, { x: MAIN_X, y: yMain - ih, width: iw, height: ih })
        yMain -= ih + 6
      }
    }

    footer(page, 4, times, helv)
  }

  // --- Page 5: Section close — pull quote + "Read alongside" + imprint. No SKUs, no checkout. ---
  {
    const page = doc.addPage([PAGE_W, PAGE_H])
    drawPaper(page)
    runningHead(page, helv, 'SEALED  \u00b7  Ch.3 \u00b7 \u00a7A  \u00b7  end of section')

    let y = PAGE_H - M - 24
    const eosLabel = 'END OF SECTION'
    const ew = helvBold.widthOfTextAtSize(eosLabel, 8.5)
    page.drawText(eosLabel, {
      x: (PAGE_W - ew) / 2,
      y,
      size: 8.5,
      font: helvBold,
      color: rgb(0.55, 0.48, 0.32),
    })
    y -= 18
    horizontalRule(page, y, 0.32)
    y -= 70

    // Pull quote — the section's gravitational center, reset on the close.
    const pq = '"Fair trade, not free trade."'
    const pqSize = 22
    const pqW = timesItalic.widthOfTextAtSize(pq, pqSize)
    page.drawText(pq, {
      x: (PAGE_W - pqW) / 2,
      y,
      size: pqSize,
      font: timesItalic,
      color: rgb(0.12, 0.11, 0.1),
    })
    y -= 26
    const pqAttr = '\u2014 Manchester, New Hampshire  \u00b7  2016'
    const pqAw = times.widthOfTextAtSize(pqAttr, 10.5)
    page.drawText(pqAttr, { x: (PAGE_W - pqAw) / 2, y, size: 10.5, font: times, color: inkMuted })
    y -= 50

    // "What's next" — plain-English transition into Chapter 3, §B and §C.
    const raTitle = 'What\u2019s next'
    const raW = timesBold.widthOfTextAtSize(raTitle, 13)
    page.drawText(raTitle, { x: (PAGE_W - raW) / 2, y, size: 13, font: timesBold, color: rgb(0.1, 0.09, 0.08) })
    y -= 22

    const close = [
      'This is one of three sections in Chapter 3 about trade. The next two sections do the same thing for two more promises. \u00a7B covers what Trump said about China. \u00a7C covers what he said about bringing factory jobs back to America.',
      'Each section follows the same simple pattern. The promise. The room it was made in. What really happened. Where it had to bend. And a blank line for your own grade.',
      'Read together, Chapter 3 is one trade argument told three ways \u2014 the way it was promised, and the way it landed.',
    ]
    for (const para of close) {
      for (const ln of wrap(para, 64)) {
        const lw = times.widthOfTextAtSize(ln, 10.5)
        page.drawText(ln, { x: (PAGE_W - lw) / 2, y, size: 10.5, font: times, color: ink })
        y -= 14
      }
      y -= 8
    }

    // Imprint footer block — no SKUs, no URLs, no merchant chrome.
    if (y < 130) y = 130
    y = 110
    horizontalRule(page, y + 18, 0.28)
    const fooLabel = 'PART I  \u00b7  CH.3  \u00b7  \u00a7A  \u00b7  sample'
    const flw = helvBold.widthOfTextAtSize(fooLabel, 7.5)
    page.drawText(fooLabel, {
      x: (PAGE_W - flw) / 2,
      y,
      size: 7.5,
      font: helvBold,
      color: rgb(0.55, 0.48, 0.32),
    })
    y -= 12
    const fooImprint = 'SEALED Press  \u00b7  Demiurgic Labs imprint  \u00b7  2026'
    const fiw = timesItalic.widthOfTextAtSize(fooImprint, 9)
    page.drawText(fooImprint, { x: (PAGE_W - fiw) / 2, y, size: 9, font: timesItalic, color: inkMuted })

    footer(page, 5, times, helv)
  }

  const bytes = await doc.save()
  await fs.writeFile(outPath, bytes)
  const stat = await fs.stat(outPath)
  console.error('Wrote', outPath, `(${stat.size} bytes)`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
