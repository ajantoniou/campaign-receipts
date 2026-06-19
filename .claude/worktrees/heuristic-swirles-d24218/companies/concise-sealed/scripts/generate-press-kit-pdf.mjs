/**
 * Converts the marketing press kit markdown into a share-ready PDF.
 * Added for CON-79 so the Brand Design + Literary Agent team can hand off a
 * clean artifact without installing pandoc or extra tool chains.
 */
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const inputPath = path.join(root, 'marketing', 'press-kit-one-pager-v1.md')
const outputDir = path.join(root, 'marketing')
const outputPath = path.join(outputDir, 'press-kit-one-pager-v1.pdf')

const PAGE_SIZE = [612, 792]
const MARGIN = 72
const LINE_GAP = 4
const BULLET_INDENT = 18
const BASIC_COLOR = rgb(0.06, 0.06, 0.12)
const SYMBOL_MAP = {
  '≤': '<=',
  '≥': '>=',
  '—': ' - ',
  '–': '-',
  '…': '...',
  '‘': "'",
  '’': "'",
  '“': '"',
  '”': '"',
}

async function loadMarkdown() {
  const raw = await fs.readFile(inputPath, 'utf8')
  const lines = raw.split(/\r?\n/)
  const tokens = []
  let frontMatter = 0
  let reading = false

  for (const rawLine of lines) {
    const trimmed = rawLine.trimEnd()
    if (trimmed === '---') {
      frontMatter += 1
      if (frontMatter >= 2) {
        reading = true
      }
      continue
    }
    if (!reading) {
      continue
    }
    if (!trimmed) {
      tokens.push({ type: 'spacer' })
      continue
    }
    if (trimmed.startsWith('# ')) {
      tokens.push({ type: 'title', text: cleanInline(trimmed.slice(2)) })
      continue
    }
    if (trimmed.startsWith('## ')) {
      tokens.push({ type: 'heading', text: cleanInline(trimmed.slice(3)) })
      continue
    }
    if (trimmed.startsWith('- ')) {
      tokens.push({ type: 'bullet', text: cleanInline(trimmed.slice(2)) })
      continue
    }
    if (trimmed.startsWith('> ')) {
      tokens.push({ type: 'quote', text: cleanInline(trimmed.slice(2)) })
      continue
    }
    tokens.push({ type: 'paragraph', text: cleanInline(trimmed) })
  }

  return tokens
}

function cleanInline(value) {
  const normalized = value
    .replace(/`([^`]+)`/g, '$1')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '$1 ($2)')
    .replace(/[*_~]/g, '')
    .replace(/\s{2,}/g, ' ')
  return replaceSymbols(normalized).trim()
}

function replaceSymbols(text) {
  return text.replace(/[\u2264\u2265\u2014\u2013\u2026\u2018\u2019\u201C\u201D]/g, (char) => SYMBOL_MAP[char] ?? char)
}

function wrapText(font, size, text, maxWidth) {
  if (!text) {
    return []
  }
  const words = text.split(/\s+/)
  const lines = []
  let current = ''

  for (const word of words) {
    if (!word) {
      continue
    }
    const candidate = current ? `${current} ${word}` : word
    if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
      current = candidate
      continue
    }
    if (current) {
      lines.push(current)
    }
    current = word
  }

  if (current) {
    lines.push(current)
  }

  return lines
}

async function main() {
  const tokens = await loadMarkdown()
  const doc = await PDFDocument.create()
  const font = await doc.embedFont(StandardFonts.Helvetica)
  const bold = await doc.embedFont(StandardFonts.HelveticaBold)
  await fs.mkdir(outputDir, { recursive: true })

  let page = doc.addPage(PAGE_SIZE)
  let cursorY = page.getHeight() - MARGIN
  const maxWidth = page.getWidth() - MARGIN * 2

  const newPage = () => {
    page = doc.addPage(PAGE_SIZE)
    cursorY = page.getHeight() - MARGIN
  }

  const ensureSpace = (needed) => {
    if (cursorY - needed < MARGIN) {
      newPage()
    }
  }

  const drawLines = (lines, drawingFont, size, x, color = BASIC_COLOR) => {
    if (!lines.length) {
      return
    }
    const height = lines.length * (size + LINE_GAP)
    ensureSpace(height)
    for (const line of lines) {
      page.drawText(line, { x, y: cursorY, size, font: drawingFont, color })
      cursorY -= size + LINE_GAP
    }
  }

  const drawParagraph = (text) => {
    const lines = wrapText(font, 11, text, maxWidth)
    drawLines(lines, font, 11, MARGIN)
    cursorY -= 8
  }

  const drawQuote = (text) => {
    const lines = wrapText(font, 11, text, maxWidth - 22)
    drawLines(lines, font, 11, MARGIN + 22, rgb(0.28, 0.28, 0.32))
    cursorY -= 6
  }

  const drawHeading = (text, size) => {
    const lines = wrapText(bold, size, text, maxWidth)
    drawLines(lines, bold, size, MARGIN)
    cursorY -= 6
  }

  const drawBullet = (text) => {
    const lines = wrapText(font, 11, text, maxWidth - BULLET_INDENT)
    const height = lines.length * (11 + LINE_GAP)
    ensureSpace(height)
    page.drawText('•', { x: MARGIN, y: cursorY, size: 11, font: bold, color: BASIC_COLOR })
    for (const line of lines) {
      page.drawText(line, { x: MARGIN + BULLET_INDENT, y: cursorY, size: 11, font, color: BASIC_COLOR })
      cursorY -= 11 + LINE_GAP
    }
    cursorY -= 2
  }

  for (const token of tokens) {
    switch (token.type) {
      case 'title':
        drawHeading(token.text, 28)
        break
      case 'heading':
        drawHeading(token.text, 18)
        break
      case 'bullet':
        drawBullet(token.text)
        break
      case 'quote':
        drawQuote(token.text)
        break
      case 'paragraph':
        drawParagraph(token.text)
        break
      case 'spacer':
        cursorY -= 10
        break
      default:
        break
    }
  }

  const pdfBytes = await doc.save()
  await fs.writeFile(outputPath, pdfBytes)
  console.error('Wrote', outputPath)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
