/**
 * Build the Chapter 1 proof PDF (M5) from the canonical manuscript plus
 * the Chapter 1 illustration plates that landed in `public/`.
 * Output: `artifacts/SEALED-ch1-proof.pdf`
 */
import fs from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { PDFDocument, StandardFonts, rgb } from "pdf-lib"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, "..")
const ARTIFACTS = path.join(ROOT, "artifacts")
const CONTENT_MD = path.join(ARTIFACTS, "sealed-v1-content.md")
const OUTPUT_PDF = path.join(ARTIFACTS, "SEALED-ch1-proof.pdf")
const PUBLIC = path.join(ROOT, "public")
const PLATES = {
  context: path.join(PUBLIC, "sealed-ch1-context-rail.jpg"),
  margin: path.join(PUBLIC, "sealed-ch1-margin-rail.jpg"),
  grade: path.join(PUBLIC, "sealed-ch1-grade-key.jpg"),
}

const PAGE_W = 612
const PAGE_H = 792
const MARGIN = 54
const TEXT_WIDTH = PAGE_W - 2 * MARGIN
const PAPER = rgb(0.96, 0.95, 0.92)
const INK = rgb(0.08, 0.06, 0.04)
const INK_MUTED = rgb(0.36, 0.33, 0.30)

function wrap(text, maxChars) {
  const words = String(text).split(/\s+/).filter(Boolean)
  const lines = []
  let line = ""
  for (const word of words) {
    const test = line ? `${line} ${word}` : word
    if (test.length > maxChars && line) {
      lines.push(line)
      line = word
      continue
    }
    line = test
  }
  if (line) {
    lines.push(line)
  }
  return lines
}

function cleanText(text) {
  return String(text)
    .replace(/\*\*/g, "")
    .replace(/\*/g, "")
    .replace(/`/g, "")
    .replace(/\[(.+?)\]\((.+?)\)/g, "$1 ($2)")
    .replace(/→/g, "->")
    .trim()
}

function parseChapterOne(raw) {
  const start = raw.indexOf("### Chapter 1")
  if (start === -1) {
    throw new Error("Chapter 1 heading missing in sealed-v1-content.md")
  }
  const tail = raw.slice(start)
  const end = tail.indexOf("### Chapter 2")
  return end === -1 ? tail : tail.slice(0, end)
}

function buildFlow(chunk) {
  return chunk
    .split(/\n\s*\n/)
    .map((segment) => segment.trim())
    .filter(Boolean)
    .map((segment) => {
      if (segment.startsWith("### ")) {
        return { type: "heading1", text: segment.replace(/^###\s*/, "") }
      }
      if (segment.startsWith("#### ")) {
        return { type: "heading2", text: segment.replace(/^####\s*/, "") }
      }
      if (segment.startsWith("##### ")) {
        return { type: "heading3", text: segment.replace(/^#####\s*/, "") }
      }
      if (segment.startsWith("```")) {
        return { type: "code", text: segment.replace(/```/g, "").trim() }
      }
      if (segment === "---") {
        return { type: "rule" }
      }
      return { type: "body", text: segment }
    })
}

async function embedPlate(doc, platePath) {
  const bytes = await fs.readFile(platePath)
  return doc.embedJpg(bytes)
}

function titlePage(doc, fonts) {
  const page = doc.addPage([PAGE_W, PAGE_H])
  page.drawRectangle({ x: 0, y: 0, width: PAGE_W, height: PAGE_H, color: PAPER })
  const titleY = PAGE_H - MARGIN - 40
  page.drawText("SEALED", {
    x: MARGIN,
    y: titleY,
    size: 40,
    font: fonts.helvBold,
    color: INK,
  })
  page.drawText("Chapter 1 — Trail mechanics", {
    x: MARGIN,
    y: titleY - 50,
    size: 18,
    font: fonts.helvBold,
    color: INK,
  })
  page.drawText("Proof PDF · M5 milestone · internal overview of rails + ledger", {
    x: MARGIN,
    y: titleY - 85,
    size: 10.5,
    font: fonts.helv,
    color: INK_MUTED,
  })
  const snapshot = new Date().toISOString().split("T")[0]
  page.drawText(`Generated ${snapshot}`, {
    x: MARGIN,
    y: titleY - 115,
    size: 9,
    font: fonts.helv,
    color: INK_MUTED,
  })
}

function addPlatePage(doc, fonts, image, caption) {
  const page = doc.addPage([PAGE_W, PAGE_H])
  page.drawRectangle({ x: 0, y: 0, width: PAGE_W, height: PAGE_H, color: PAPER })
  const maxWidth = PAGE_W - 2 * MARGIN
  const maxHeight = PAGE_H - 2 * MARGIN - 40
  const scale = Math.min(maxWidth / image.width, maxHeight / image.height, 1)
  const width = image.width * scale
  const height = image.height * scale
  const x = (PAGE_W - width) / 2
  const y = (PAGE_H - height) / 2 + 10
  page.drawImage(image, { x, y, width, height })
  if (caption) {
    page.drawText(caption, {
      x: MARGIN,
      y: MARGIN + 18,
      size: 9,
      font: fonts.helv,
      color: INK_MUTED,
    })
  }
}

export async function build() {
  const raw = await fs.readFile(CONTENT_MD, "utf-8")
  const chapter = parseChapterOne(raw)
  const flow = buildFlow(chapter)
  await fs.mkdir(ARTIFACTS, { recursive: true })

  const doc = await PDFDocument.create()
  const fonts = {
    helv: await doc.embedFont(StandardFonts.Helvetica),
    helvBold: await doc.embedFont(StandardFonts.HelveticaBold),
    courier: await doc.embedFont(StandardFonts.Courier),
  }
  const contextImage = await embedPlate(doc, PLATES.context)
  const marginImage = await embedPlate(doc, PLATES.margin)
  const gradeImage = await embedPlate(doc, PLATES.grade)

  titlePage(doc, fonts)
  addPlatePage(doc, fonts, contextImage, "Trail mechanics context rail ledger — Section A reader primer")

  let currentPage = null
  let cursorY = 0
  const startNewTextPage = () => {
    currentPage = doc.addPage([PAGE_W, PAGE_H])
    currentPage.drawRectangle({ x: 0, y: 0, width: PAGE_W, height: PAGE_H, color: PAPER })
    cursorY = PAGE_H - MARGIN
  }
  startNewTextPage()

  const ensure = (height) => {
    if (cursorY - height < MARGIN) {
      startNewTextPage()
    }
  }

  const drawHeading = (text, size, font) => {
    const safeText = cleanText(text)
    ensure(size + 12)
    currentPage.drawText(safeText, { x: MARGIN, y: cursorY, size, font, color: INK })
    cursorY -= size + 10
  }

  const drawBodyText = (text, size = 10, lineHeight = 14, font = fonts.helv) => {
    const lines = text.split("\n").map((ln) => ln.trim()).filter(Boolean)
    for (const line of lines) {
      const cleaned = cleanText(line)
      if (!cleaned) continue
      const maxChars = Math.max(40, Math.floor(TEXT_WIDTH / (size * 0.55)))
      for (const wrapped of wrap(cleaned, maxChars)) {
        ensure(lineHeight)
        currentPage.drawText(wrapped, {
          x: MARGIN,
          y: cursorY,
          size,
          font,
          color: INK,
        })
        cursorY -= lineHeight
      }
      cursorY -= 4
    }
  }

  const drawRule = () => {
    const thickness = 0.4
    ensure(12)
    currentPage.drawLine({
      start: { x: MARGIN, y: cursorY },
      end: { x: PAGE_W - MARGIN, y: cursorY },
      thickness,
      color: INK_MUTED,
    })
    cursorY -= 14
  }

  const drawCodeBlock = (code) => {
    const lines = code.split("\n").map((ln) => ln.trim()).filter(Boolean)
    for (const line of lines) {
      const cleaned = cleanText(line)
      if (!cleaned) continue
      const maxChars = Math.max(40, Math.floor(TEXT_WIDTH / 7))
      for (const wrapped of wrap(cleaned, maxChars)) {
        ensure(12)
        currentPage.drawText(wrapped, {
          x: MARGIN,
          y: cursorY,
          size: 9.5,
          font: fonts.courier,
          color: INK,
        })
        cursorY -= 12
      }
      cursorY -= 4
    }
  }

  let marginInserted = false
  let gradeInserted = false

  for (const entry of flow) {
    if (entry.type === "heading1" && entry.text.startsWith("Ledger entries") && !gradeInserted) {
      addPlatePage(doc, fonts, gradeImage, "Grade key plaque — Section C scorecard")
      startNewTextPage()
      gradeInserted = true
    }
    if (entry.type === "heading2" && entry.text.startsWith("Section C") && !marginInserted) {
    addPlatePage(doc, fonts, marginImage, "Margin rails decoded graphic — Section B -> C transition")
      startNewTextPage()
      marginInserted = true
    }

    switch (entry.type) {
      case "heading1":
        drawHeading(entry.text, 18, fonts.helvBold)
        break
      case "heading2":
        drawHeading(entry.text, 16, fonts.helvBold)
        break
      case "heading3":
        drawHeading(entry.text, 14, fonts.helvBold)
        break
      case "body":
        drawBodyText(entry.text)
        break
      case "code":
        drawCodeBlock(entry.text)
        break
      case "rule":
        drawRule()
        break
      default:
        drawBodyText(entry.text)
        break
    }
  }

  const pdfBytes = await doc.save()
  await fs.writeFile(OUTPUT_PDF, pdfBytes)
  console.log(`Wrote ${OUTPUT_PDF}`)
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  build().catch((err) => {
    console.error("Failed to build Chapter 1 proof PDF:", err)
    process.exitCode = 1
  })
}
