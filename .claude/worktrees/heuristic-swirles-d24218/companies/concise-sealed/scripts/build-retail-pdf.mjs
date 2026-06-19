/**
 * SEALED v1 — Retail PDF Generator (Deep-Dive Edition)
 *
 * Every chapter is a 2-3 page narrative case study with:
 *   - SVG illustration capturing the emotion
 *   - Narrative hook + aha insights + conclusion
 *   - Color-coded verdict badges
 *   - Receipts section with mechanical proof
 *   - Cover triptych: Smiling 2016, Mugshot 2020, Ear-shot 2024
 *
 * Usage:  node scripts/build-retail-pdf.mjs
 * Output: artifacts/SEALED-v1-retail.pdf
 */

import fs from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import puppeteer from "puppeteer"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, "..")
const ARTIFACTS = path.join(ROOT, "artifacts")
const OUTPUT = path.join(ARTIFACTS, "SEALED-v1-retail.pdf")
const PUBLIC = path.join(ROOT, "public")

async function imgUri(name) {
  const data = await fs.readFile(path.join(PUBLIC, name))
  const ext = path.extname(name).slice(1).toLowerCase()
  const mime = ext === "png" ? "image/png" : ext === "webp" ? "image/webp" : "image/jpeg"
  return `data:${mime};base64,${data.toString("base64")}`
}

let IMG = {}

const COLORS = {
  KEPT: { bg: "#e6f4ea", border: "#34a853", text: "#1e7e34", label: "KEPT" },
  PARTIAL: { bg: "#fff8e1", border: "#f9a825", text: "#e65100", label: "PARTIAL" },
  BROKEN: { bg: "#fce4ec", border: "#e53935", text: "#b71c1c", label: "BROKEN" },
  BLOCKED: { bg: "#e3f2fd", border: "#1976d2", text: "#0d47a1", label: "BLOCKED" },
  MOOT: { bg: "#f5f5f5", border: "#9e9e9e", text: "#616161", label: "MOOT" },
  READER: { bg: "#f3e5f5", border: "#7b1fa2", text: "#4a148c", label: "YOU DECIDE" },
  PENDING: { bg: "#eceff1", border: "#546e7a", text: "#37474f", label: "OUTCOMES PENDING" },
  IN_PROGRESS: { bg: "#e3f2fd", border: "#1976d2", text: "#0d47a1", label: "IN PROGRESS" },
}

function badge(v) {
  const c = COLORS[v] || COLORS.READER
  return `<span class="vb" style="background:${c.bg};border:2px solid ${c.border};color:${c.text}">${c.label}</span>`
}

// SVG illustrations (sketch style, inline)
function illus(key, caption) {
  const src = IMG[key]
  if (!src) return `<p style="color:#999;font-style:italic;text-align:center;">[illustration: ${key}]</p>`
  // Plate treatment: gold hairline above the image, image framed with a
  // 1pt cream border (mimics a printed plate inset on a book page),
  // caption set as italic with a small-caps "PLATE" eyebrow so the figure
  // reads as deliberate editorial art, not an inline screenshot.
  return `<div class="illus">
    <div class="plate-rule"></div>
    <div class="plate-frame"><img src="${src}" alt=""/></div>
    <p class="plate-caption"><span class="plate-eyebrow">Plate</span> &mdash; ${caption || ''}</p>
  </div>`
}

const _ILLUS_UNUSED = {
  _old_cover: `<svg viewBox="0 0 600 200" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:4.8in;margin:0 auto;display:block;">
    <!-- 2016: Smiling, thumbs up, golden -->
    <g transform="translate(5,10)">
      <circle cx="65" cy="80" r="45" fill="#ffd54f" stroke="#c9a84c" stroke-width="2"/>
      <path d="M45,90 Q65,110 85,90" fill="none" stroke="#333" stroke-width="2.5" stroke-linecap="round"/>
      <circle cx="55" cy="74" r="4" fill="#333"/>
      <circle cx="75" cy="74" r="4" fill="#333"/>
      <path d="M45,58 C50,48 60,45 70,50" fill="none" stroke="#c9a84c" stroke-width="7" stroke-linecap="round"/>
      <path d="M60,52 C70,45 80,48 85,58" fill="none" stroke="#c9a84c" stroke-width="7" stroke-linecap="round"/>
      <text x="65" y="148" text-anchor="middle" font-size="13" font-family="Georgia" fill="#c9a84c">2016</text>
      <text x="65" y="165" text-anchor="middle" font-size="9" font-family="Georgia" fill="#888">The Promise</text>
    </g>
    <!-- 2020: Mugshot -->
    <g transform="translate(150,10)">
      <rect x="20" y="25" width="90" height="120" fill="#2a2a2a" rx="3"/>
      <circle cx="65" cy="72" r="40" fill="#ffcc80" stroke="#555" stroke-width="2"/>
      <line x1="48" y1="85" x2="82" y2="85" stroke="#333" stroke-width="2.5" stroke-linecap="round"/>
      <circle cx="55" cy="70" r="3.5" fill="#333"/>
      <circle cx="75" cy="70" r="3.5" fill="#333"/>
      <path d="M48,56 L82,56" fill="none" stroke="#b8860b" stroke-width="6" stroke-linecap="round"/>
      <text x="65" y="118" text-anchor="middle" font-size="7" font-family="monospace" fill="#ff5252">FULTON COUNTY</text>
      <text x="65" y="148" text-anchor="middle" font-size="13" font-family="Georgia" fill="#999">2020</text>
      <text x="65" y="165" text-anchor="middle" font-size="9" font-family="Georgia" fill="#888">The Mugshot</text>
    </g>
    <!-- 2024: Ear bandage, fist up -->
    <g transform="translate(295,10)">
      <circle cx="65" cy="80" r="45" fill="#ffcc80" stroke="#e53935" stroke-width="2"/>
      <path d="M45,88 Q65,80 85,88" fill="none" stroke="#333" stroke-width="2.5" stroke-linecap="round"/>
      <circle cx="55" cy="74" r="4" fill="#333"/>
      <circle cx="75" cy="74" r="4" fill="#333"/>
      <path d="M45,58 L60,52 L80,52 L88,58" fill="none" stroke="#b8860b" stroke-width="6" stroke-linecap="round"/>
      <rect x="90" y="62" width="14" height="20" fill="#fff" stroke="#e53935" stroke-width="1.5" rx="2"/>
      <line x1="97" y1="64" x2="97" y2="80" stroke="#e53935" stroke-width="0.8"/>
      <text x="65" y="148" text-anchor="middle" font-size="13" font-family="Georgia" fill="#e53935">2024</text>
      <text x="65" y="165" text-anchor="middle" font-size="9" font-family="Georgia" fill="#888">The Ear</text>
    </g>
    <!-- 2026: Jesus Donny, robe, halo -->
    <g transform="translate(440,10)">
      <ellipse cx="65" cy="45" rx="38" ry="18" fill="none" stroke="#c9a84c" stroke-width="2.5" opacity="0.8"/>
      <ellipse cx="65" cy="45" rx="30" ry="14" fill="none" stroke="#c9a84c" stroke-width="1" opacity="0.4"/>
      <circle cx="65" cy="72" r="35" fill="#ffcc80" stroke="#c9a84c" stroke-width="2"/>
      <path d="M50,82 Q65,92 80,82" fill="none" stroke="#333" stroke-width="2" stroke-linecap="round"/>
      <circle cx="57" cy="70" r="3" fill="#333"/>
      <circle cx="73" cy="70" r="3" fill="#333"/>
      <path d="M50,56 C55,50 62,48 70,50" fill="none" stroke="#b8860b" stroke-width="5" stroke-linecap="round"/>
      <path d="M60,50 C68,46 75,48 80,55" fill="none" stroke="#b8860b" stroke-width="5" stroke-linecap="round"/>
      <path d="M40,105 C45,95 55,92 65,92 C75,92 85,95 90,105 L90,140 C85,145 75,148 65,148 C55,148 45,145 40,140 Z" fill="#f5f0e0" stroke="#d4c9a0" stroke-width="1.5"/>
      <line x1="65" y1="100" x2="65" y2="135" stroke="#c9a84c" stroke-width="1" opacity="0.5"/>
      <line x1="50" y1="115" x2="80" y2="115" stroke="#c9a84c" stroke-width="1" opacity="0.5"/>
      <text x="65" y="168" text-anchor="middle" font-size="13" font-family="Georgia" fill="#c9a84c">2026</text>
      <text x="65" y="185" text-anchor="middle" font-size="9" font-family="Georgia" fill="#888">The Savior</text>
    </g>
  </svg>`,

  swamp: `<svg viewBox="0 0 400 160" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:3.5in;margin:0.15in auto;display:block;">
    <rect width="400" height="160" fill="#1a2e1a" rx="5"/>
    <ellipse cx="200" cy="130" rx="180" ry="35" fill="#2d4a2d"/>
    <text x="200" y="45" text-anchor="middle" font-size="28" font-family="Georgia" fill="#4a7a4a" font-style="italic">THE SWAMP</text>
    <text x="80" y="85" font-size="11" font-family="monospace" fill="#c9a84c">$75M</text>
    <text x="180" y="95" font-size="11" font-family="monospace" fill="#c9a84c">3 for 3</text>
    <text x="290" y="85" font-size="11" font-family="monospace" fill="#c9a84c">REVOKED</text>
    <path d="M60,100 Q200,70 340,100" fill="none" stroke="#c9a84c" stroke-width="1" stroke-dasharray="4"/>
    <circle cx="80" cy="120" r="15" fill="#4a7a4a" stroke="#6a9a6a" stroke-width="1"/>
    <text x="80" y="124" text-anchor="middle" font-size="8" fill="#ccc">AIPAC</text>
    <circle cx="160" cy="125" r="15" fill="#4a7a4a" stroke="#6a9a6a" stroke-width="1"/>
    <text x="160" y="129" text-anchor="middle" font-size="7" fill="#ccc">EXXON</text>
    <circle cx="240" cy="125" r="15" fill="#4a7a4a" stroke="#6a9a6a" stroke-width="1"/>
    <text x="240" y="129" text-anchor="middle" font-size="7" fill="#ccc">GOLDMAN</text>
    <circle cx="320" cy="120" r="15" fill="#4a7a4a" stroke="#6a9a6a" stroke-width="1"/>
    <text x="320" y="124" text-anchor="middle" font-size="7" fill="#ccc">CHEVRON</text>
  </svg>`,

  trade: `<svg viewBox="0 0 400 140" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:3.5in;margin:0.15in auto;display:block;">
    <rect width="400" height="140" fill="#fff8e1" rx="5"/>
    <text x="60" y="35" font-size="14" font-family="Georgia" fill="#333">NAFTA</text>
    <line x1="100" y1="30" x2="160" y2="30" stroke="#e53935" stroke-width="3"/>
    <text x="170" y="35" font-size="14" font-family="Georgia" fill="#34a853">USMCA</text>
    <text x="60" y="65" font-size="14" font-family="Georgia" fill="#333">TPP</text>
    <line x1="90" y1="60" x2="160" y2="60" stroke="#e53935" stroke-width="3"/>
    <text x="170" y="65" font-size="14" font-family="Georgia" fill="#e53935" font-style="italic">DEAD</text>
    <text x="280" y="50" font-size="36" font-family="Georgia" fill="#34a853" font-weight="bold">&#x2713;</text>
    <rect x="30" y="85" width="340" height="35" fill="#e6f4ea" rx="3"/>
    <text x="200" y="108" text-anchor="middle" font-size="12" font-family="Georgia" fill="#1e7e34">Day 3: TPP killed. Year 2: NAFTA replaced. Promise kept.</text>
  </svg>`,

  factory: `<svg viewBox="0 0 400 140" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:3.5in;margin:0.15in auto;display:block;">
    <rect width="400" height="140" fill="#f5f5f5" rx="5"/>
    <rect x="50" y="40" width="80" height="70" fill="#888" rx="2"/>
    <rect x="55" y="50" width="20" height="15" fill="#ffcc80"/>
    <rect x="80" y="50" width="20" height="15" fill="#ffcc80"/>
    <rect x="55" y="70" width="20" height="15" fill="#333"/>
    <rect x="80" y="70" width="20" height="15" fill="#333"/>
    <text x="90" y="35" text-anchor="middle" font-size="10" font-family="monospace" fill="#555">CARRIER</text>
    <path d="M140,75 L180,75" stroke="#e53935" stroke-width="2" marker-end="url(#arr)"/>
    <text x="200" y="65" font-size="10" font-family="Georgia" fill="#333">800 stayed</text>
    <text x="200" y="80" font-size="10" font-family="Georgia" fill="#e53935">600 still lost</text>
    <rect x="270" y="40" width="80" height="70" fill="#888" rx="2" opacity="0.4"/>
    <text x="310" y="35" text-anchor="middle" font-size="10" font-family="monospace" fill="#555">FORD</text>
    <text x="310" y="80" text-anchor="middle" font-size="9" font-family="Georgia" fill="#e53935">Moved to China</text>
    <text x="200" y="125" text-anchor="middle" font-size="11" font-family="Georgia" fill="#e65100">Named companies. Mixed results.</text>
  </svg>`,

  healthcare: `<svg viewBox="0 0 400 140" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:3.5in;margin:0.15in auto;display:block;">
    <rect width="400" height="140" fill="#fce4ec" rx="5"/>
    <text x="200" y="35" text-anchor="middle" font-size="18" font-family="Georgia" fill="#b71c1c" font-weight="bold">REPEAL &amp; REPLACE</text>
    <line x1="80" y1="45" x2="320" y2="45" stroke="#e53935" stroke-width="2"/>
    <text x="200" y="70" text-anchor="middle" font-size="28" font-family="Georgia" fill="#e53935">&#x1F44E;</text>
    <text x="200" y="95" text-anchor="middle" font-size="12" font-family="Georgia" fill="#333">McCain. Thumbs down. 49-51.</text>
    <text x="200" y="115" text-anchor="middle" font-size="11" font-family="Georgia" fill="#b71c1c">Obamacare still stands.</text>
    <text x="200" y="133" text-anchor="middle" font-size="9" font-family="Georgia" fill="#888">The biggest broken promise of 2016.</text>
  </svg>`,

  nato: `<svg viewBox="0 0 400 140" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:3.5in;margin:0.15in auto;display:block;">
    <rect width="400" height="140" fill="#e3f2fd" rx="5"/>
    <text x="200" y="30" text-anchor="middle" font-size="12" font-family="Georgia" fill="#1976d2">NATO DEFENSE SPENDING (% of GDP target: 2%)</text>
    <line x1="60" y1="110" x2="340" y2="110" stroke="#666" stroke-width="1"/>
    <line x1="60" y1="50" x2="340" y2="50" stroke="#34a853" stroke-width="1" stroke-dasharray="4"/>
    <text x="45" y="54" font-size="8" fill="#34a853">2%</text>
    <rect x="80" y="90" width="30" height="20" fill="#1976d2" opacity="0.5"/>
    <text x="95" y="125" text-anchor="middle" font-size="8" fill="#555">2014</text>
    <text x="95" y="88" text-anchor="middle" font-size="8" fill="#1976d2">3</text>
    <rect x="160" y="75" width="30" height="35" fill="#1976d2" opacity="0.7"/>
    <text x="175" y="125" text-anchor="middle" font-size="8" fill="#555">2020</text>
    <text x="175" y="73" text-anchor="middle" font-size="8" fill="#1976d2">11</text>
    <rect x="240" y="55" width="30" height="55" fill="#1976d2"/>
    <text x="255" y="125" text-anchor="middle" font-size="8" fill="#555">2024</text>
    <text x="255" y="53" text-anchor="middle" font-size="8" fill="#1976d2">23</text>
    <text x="320" y="85" font-size="9" fill="#333">allies at 2%</text>
  </svg>`,

  middleeast: `<svg viewBox="0 0 400 140" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:3.5in;margin:0.15in auto;display:block;">
    <rect width="400" height="140" fill="#fff3e0" rx="5"/>
    <text x="100" y="35" text-anchor="middle" font-size="14" font-family="Georgia" fill="#333">ISIS Territory</text>
    <rect x="50" y="45" width="100" height="30" fill="#e53935" rx="2"/>
    <text x="100" y="65" text-anchor="middle" font-size="9" fill="#fff">2016: 30,000 sq mi</text>
    <rect x="50" y="80" width="5" height="30" fill="#34a853" rx="1"/>
    <text x="100" y="100" font-size="9" fill="#333">2019: ~0 (99% gone)</text>
    <line x1="200" y1="20" x2="200" y2="130" stroke="#ddd" stroke-width="1"/>
    <text x="300" y="35" text-anchor="middle" font-size="14" font-family="Georgia" fill="#333">Russia Cooperation</text>
    <text x="300" y="70" text-anchor="middle" font-size="24" fill="#e53935">&#x2717;</text>
    <text x="300" y="95" text-anchor="middle" font-size="9" fill="#555">Never materialized.</text>
    <text x="300" y="110" text-anchor="middle" font-size="9" fill="#555">De-confliction only.</text>
  </svg>`,

  china: `<svg viewBox="0 0 400 140" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:3.5in;margin:0.15in auto;display:block;">
    <rect width="400" height="140" fill="#e8f5e9" rx="5"/>
    <text x="200" y="30" text-anchor="middle" font-size="12" font-family="Georgia" fill="#333">THE TRADE WAR</text>
    <text x="200" y="55" text-anchor="middle" font-size="28" font-family="monospace" fill="#1e7e34" font-weight="bold">$350B+</text>
    <text x="200" y="75" text-anchor="middle" font-size="10" fill="#555">in Chinese goods tariffed</text>
    <rect x="60" y="90" width="120" height="25" fill="#fff8e1" stroke="#f9a825" rx="2"/>
    <text x="120" y="107" text-anchor="middle" font-size="9" fill="#e65100">Currency Manipulator Label</text>
    <rect x="220" y="90" width="120" height="25" fill="#e6f4ea" stroke="#34a853" rx="2"/>
    <text x="280" y="107" text-anchor="middle" font-size="9" fill="#1e7e34">Phase One Deal Signed</text>
    <text x="200" y="133" text-anchor="middle" font-size="10" font-family="Georgia" fill="#1e7e34">He said he'd fight. He fought.</text>
  </svg>`,

  wall: `<svg viewBox="0 0 400 140" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:3.5in;margin:0.15in auto;display:block;">
    <rect width="400" height="140" fill="#fff8e1" rx="5"/>
    <text x="200" y="25" text-anchor="middle" font-size="11" font-family="Georgia" fill="#555">1,950 miles of border</text>
    <rect x="40" y="35" width="320" height="20" fill="#eee" stroke="#ccc" rx="2"/>
    <rect x="40" y="35" width="74" height="20" fill="#f9a825" rx="2"/>
    <text x="200" y="49" text-anchor="middle" font-size="9" fill="#333">~450 mi built/replaced (23%)</text>
    <text x="100" y="80" font-size="11" font-family="Georgia" fill="#333">Mexico paid?</text>
    <text x="200" y="80" font-size="16" fill="#e53935">&#x2717; NO</text>
    <text x="100" y="105" font-size="11" font-family="Georgia" fill="#333">Drugs stopped?</text>
    <text x="230" y="105" font-size="10" fill="#e65100">Seizures up. Flow continued.</text>
    <text x="200" y="133" text-anchor="middle" font-size="10" font-family="Georgia" fill="#e65100">The most famous promise. Partially built. Never paid for.</text>
  </svg>`,

  laworder: `<svg viewBox="0 0 400 140" xmlns="http://www.w3.org/2000/svg" style="width:100%;max-width:3.5in;margin:0.15in auto;display:block;">
    <rect width="400" height="140" fill="#f3e5f5" rx="5"/>
    <text x="200" y="30" text-anchor="middle" font-size="12" font-family="Georgia" fill="#4a148c">CHICAGO HOMICIDES</text>
    <text x="80" y="65" font-size="11" fill="#333">2016:</text>
    <text x="130" y="65" font-size="18" font-weight="bold" fill="#e53935">762</text>
    <text x="80" y="90" font-size="11" fill="#333">2019:</text>
    <text x="130" y="90" font-size="18" font-weight="bold" fill="#34a853">492</text>
    <text x="80" y="115" font-size="11" fill="#333">2020:</text>
    <text x="130" y="115" font-size="18" font-weight="bold" fill="#e53935">769</text>
    <line x1="200" y1="45" x2="200" y2="130" stroke="#ddd"/>
    <text x="300" y="65" text-anchor="middle" font-size="10" fill="#555">Fell during term</text>
    <text x="300" y="85" text-anchor="middle" font-size="10" fill="#555">Rose again in 2020</text>
    <text x="300" y="105" text-anchor="middle" font-size="10" fill="#555">Trend? Policy? COVID?</text>
    <text x="300" y="125" text-anchor="middle" font-size="11" fill="#4a148c" font-weight="bold">You decide.</text>
  </svg>`,
}

function buildBook() {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><style>${getStyles()}</style></head><body>
<div class="page-content">
${halfTitle()}
${versoBlank()}
${frontispiece()}
${versoBlank()}
${copyrightPage()}
${dedication()}
${tableOfContents()}
${foreword()}
${byTheNumbers()}
${introduction()}
${ch2_trade()}
${ch1_swamp()}
${ch3_jobs()}
${ch4_healthcare()}
${ch5_nato()}
${ch6_middleeast()}
${ch7_china()}
${ch8_border()}
${ch9_laworder()}
${ch10_2024platform()}
${scorecard()}
${epilogue()}
${aboutAuthor()}
${readingGuide()}
${appendices()}
</div>
</body></html>`
}

function getStyles() {
  return `
@page { size: 6in 9in; margin: 0; }
/* Body: Palatino at 11pt with 1.45 leading. Previous 12/1.9 was paragraph-
   spacing pretending to be leading — wasted ~15 pages and read like an
   ebook. 11/1.45 sits inside the trade-nonfiction baseline grid. */
body { font-family: Palatino, 'Palatino Linotype', Georgia, 'Times New Roman', serif; font-size: 11pt; line-height: 1.45; color: #1a1a1a; margin: 0; padding: 0; }
/* Real trade-book interior margins. Outer 0.7in / inner 0.75in / top 0.6in /
   bottom 0.85in reserves space for the watermark service's 2-line footer
   (stamped at 0.45in from trim). Without this reserve the watermark fights
   the page content. */
.page-content { padding: 0.6in 0.7in 0.85in 0.75in; }
h1, h2, h3, h4 { page-break-after: avoid; }
p { orphans: 3; widows: 3; }
.punch, .aha, .hook, .conclusion, .tea, .rumor, .entry, .verbatim, .rail, .paper-trail { page-break-inside: avoid; }
h3 + p, h4 + p { page-break-before: avoid; }
img { page-break-inside: avoid; }
/* Cover bleeds to trim. Negative margins cancel page-content padding so the
   cover image fills the whole 6x9 trim with no gutter. */
.cover { page-break-after:always; position:relative; width:6in; height:9in; box-sizing:border-box; margin:-0.6in -0.7in 0 -0.75in; background:#0a1428; overflow:hidden; }
.cover-bg { position:absolute; inset:0; width:100%; height:100%; object-fit:cover; opacity:0.95; }
.cover-overlay { position:absolute; inset:0; background:linear-gradient(to bottom, rgba(10,20,40,0.6) 0%, rgba(10,20,40,0.0) 25%, rgba(10,20,40,0.0) 65%, rgba(10,20,40,0.85) 100%); }
/* Cover: bumped top padding to 0.85in so the 64pt title clears the trim with
   a hair of crown space — at 200px Goodreads thumbnail the title was sitting
   on the edge and reading as cropped. */
.cover-content { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; padding:0.85in 0.5in 0.5in; box-sizing:border-box; color:#f5ecd6; text-align:center; }
.cover-title { font-family: 'Palatino', 'Palatino Linotype', Georgia, serif; font-size:58pt; font-weight:700; letter-spacing:0.22em; margin:0; color:#f5ecd6; line-height:1.05; text-shadow:0 1pt 6pt rgba(0,0,0,0.45); }
.cover-rule { width:1.5in; height:1.5pt; background:#c9a84c; margin:0.12in auto 0.18in; }
.cover-sub { font-family: 'Palatino', serif; font-size:14pt; font-style:italic; line-height:1.4; margin:0; color:#e5d7b0; max-width:4.5in; }
.cover-tag { position:absolute; bottom:1.2in; left:0; right:0; font-family:'Palatino',serif; font-size:11pt; font-style:italic; color:#d4c89c; text-align:center; letter-spacing:0.04em; padding:0 0.5in; }
.cover-author { position:absolute; bottom:0.55in; left:0; right:0; font-family:'Palatino',serif; font-size:13pt; font-variant:small-caps; letter-spacing:0.32em; color:#f5ecd6; text-align:center; }
.cover-imprint { position:absolute; bottom:0.3in; left:0; right:0; font-family:'Palatino',serif; font-size:8pt; font-variant:small-caps; letter-spacing:0.22em; color:#9a8e6e; text-align:center; }
/* Half-title: title only, centered vertically-ish, no subtitle. Forced onto
   a right-hand page so the book opens conventionally. */
.half-title { break-before:right; page-break-after:always; break-after:page; text-align:center; padding-top:3in; }
.half-title h1 { font-size:38pt; font-weight:700; letter-spacing:0.22em; margin:0; color:#1a2744; }
.half-title h1::after { content:""; display:block; width:0.9in; height:1pt; background:#c9a84c; margin:0.22in auto 0; }
/* Blank verso page (intentionally empty, follows half-title and frontispiece). */
.verso-blank { page-break-after:always; break-after:page; height:7in; }
/* Frontispiece: 4 portraits + meta, vertically centered, ~1.6in per row.
   Forced onto a right-hand page so it sits on the recto, mirroring the
   half-title→verso→frontispiece→verso→copyright traditional flow. */
.frontispiece { break-before:right; page-break-after:always; break-after:page; display:flex; flex-direction:column; justify-content:center; align-items:stretch; padding:0.4in 0.2in; min-height:7.4in; }
.frontispiece .fp-row { display:flex; align-items:center; gap:0.22in; border-top:0.4pt solid #1a2744; padding:0.18in 0; min-height:1.5in; }
.frontispiece .fp-row:last-of-type { border-bottom:0.4pt solid #1a2744; }
.frontispiece .fp-row img { height:1.35in; width:1in; object-fit:cover; filter:grayscale(0.15) contrast(1.05); border:0.4pt solid #1a2744; }
.frontispiece .fp-meta { flex:1; display:flex; flex-direction:column; gap:0.06in; }
.frontispiece .fp-year { font-family:'Courier New', ui-monospace, monospace; font-size:9pt; letter-spacing:0.22em; color:#1a2744; text-transform:uppercase; }
.frontispiece .fp-cap { font-family:'Palatino', Georgia, serif; font-size:12pt; font-style:italic; color:#2a2a2a; }
.frontispiece .fp-caption { margin:0.35in 0 0; text-align:center; font-family:'Courier New', ui-monospace, monospace; font-size:8.5pt; letter-spacing:0.22em; color:#1a2744; text-transform:uppercase; }
.copyright-page { page-break-after:always; padding-top:1.8in; font-size:8.5pt; line-height:1.7; color:#555; }
.copyright-page p { margin:0 0 0.08in; text-align:left; }
.toc { page-break-after:always; }
.toc h2 { font-size:20pt; text-align:center; margin-bottom:0.3in; font-variant:small-caps; letter-spacing:0.08em; }
.toc-part { font-weight:700; font-size:11pt; margin:0.2in 0 0.06in; color:#333; border-bottom:1pt solid #ddd; padding-bottom:0.04in; }
.toc-entry { display:flex; justify-content:space-between; align-items:baseline; padding:0.04in 0 0.04in 0.15in; font-size:10pt; }
.toc-entry .t { flex:1; }
.toc-entry .vb { margin-left:0.1in; }
/* Chapter openers drop ~0.75in below the page-top margin, so the eyebrow
   sits at roughly 1.35in from trim — the classic trade-book sink. */
/* Chapter openers always start on a right-hand (recto) page — Puppeteer/
   Chromium honors break-before:right, inserting a blank verso when needed. */
.chapter-start { break-before:right; page-break-before:always; padding-top:0.75in; padding-bottom:0.4in; }
.chapter-start[style] { padding-top:0.75in !important; }
.ch-num { font-size:8pt; font-variant:small-caps; letter-spacing:0.22em; color:#8a7a50; display:block; margin-bottom:0.18in; }
/* Hairline accent above chapter number anchors the opener to the grid */
.ch-num::before { content:""; display:block; width:0.4in; height:1pt; background:#c9a84c; margin-bottom:0.12in; }
.ch-title { font-size:32pt; font-weight:700; margin:0 0 0.18in; line-height:1.08; letter-spacing:-0.005em; }
.ch-sub { font-size:13pt; font-style:italic; color:#555; margin:0 0 0.22in; line-height:1.45; max-width:4.4in; }
/* Inline verdict badge inside .ch-title — sits on the title's baseline, not below.
   Reduced gap and aligned to baseline so badge reads as a sibling, not a new line. */
.ch-title { display:flex; flex-wrap:wrap; align-items:baseline; gap:0.1in 0.16in; }
.ch-title .vb { display:inline-block; flex:0 0 auto; margin:0; font-size:9pt; letter-spacing:0.14em; padding:0.04in 0.18in; align-self:center; }
/* Default .vb (used in TOC, inline in entries, etc.)
   v1.1 ePub fix: white-space:nowrap + break-inside:avoid so iBooks doesn't
   wrap "BROKEN" → "BRO-/KEN" or "YOU DECIDE" → "YOU/DECIDE" mid-token. */
.vb { display:inline-block; font-size:8pt; font-weight:700; letter-spacing:0.08em; padding:0.025in 0.12in; border-radius:2pt; vertical-align:middle; margin-left:0.08in; white-space:nowrap; page-break-inside:avoid; break-inside:avoid; }
/* --- Unified callout family ---
   One container shape: cream bg + 4pt left rule. Modules differ only by
   left-rule color + small-caps eyebrow color. The "tea" inversion (dark
   navy fill) is deliberate — it's the "this is the secret receipt" beat.
   Padding, margin, radius, body size all share. */
.hook, .aha, .rumor, .conclusion, .punch, .paper-trail {
  padding:0.14in 0.18in; margin:0.16in 0; font-size:10.5pt; line-height:1.55;
  -webkit-box-decoration-break:clone; box-decoration-break:clone;
  border-radius:2pt;
}
.hook-label, .aha-label, .rumor-header, .conclusion-header, .pt-label {
  font-size:8pt; font-variant:small-caps; letter-spacing:0.12em; font-weight:700;
  display:block; margin-bottom:0.06in;
}
.hook         { background:#faf8f4; border-left:4pt solid #c9a84c; }
.hook-label   { color:#8a7a50; }
.aha          { background:#faf8f4; border-left:4pt solid #f5a300; }
.aha-label    { color:#a06800; }
.rumor        { background:#faf8f4; border-left:4pt solid #7b1fa2; }
.rumor-header { color:#5a1480; }
.rumor-note   { font-size:9pt; font-style:italic; color:#666; margin-bottom:0.1in; }
.conclusion   { background:#faf8f4; border-left:4pt solid #b71c1c; }
.conclusion-header { color:#b71c1c; }
.punch        { background:#1a2744; color:#f0ede6; border-left:4pt solid #c9a84c; font-weight:600; }
.punch p      { color:#e8e4dc; margin:0 0 0.08in; }
.paper-trail  { background:#faf8f4; border-left:4pt solid #8a7a50; font-size:8.5pt; color:#444; padding:0.1in 0.14in; margin:0.08in 0; }
.pt-label     { color:#8a7a50; }

/* --- Dark inversion: deliberate contrast for "verified facts" beat --- */
.tea { background:#1a2744; color:#f0ede6; padding:0.18in 0.22in; border-radius:2pt;
       border-left:4pt solid #c9a84c;
       margin:0.16in 0; -webkit-box-decoration-break:clone; box-decoration-break:clone; }
.tea-header { color:#c9a84c; font-size:8pt; font-variant:small-caps; letter-spacing:0.12em;
              font-weight:700; display:block; margin-bottom:0.08in; }
.tea p { color:#e8e4dc; margin:0 0 0.08in; font-size:10.5pt; line-height:1.55; }

/* --- Receipts (entry cards) — left rule shared --- */
.entry { margin:0.22in 0; padding:0.04in 0 0.14in 0; border-bottom:0.5pt solid #e0d8c8; }
.entry:last-child { border-bottom:0; }
.entry + .chapter-sources { margin-top:0.25in; }
.entry-title { font-size:11pt; font-weight:700; margin:0 0 0.06in; line-height:1.32; }
.entry-title .vb { vertical-align:0.05em; }
.rail { background:#faf8f4; border-left:3pt solid #8a7a50; border-radius:2pt;
        padding:0.06in 0.12in; margin:0.06in 0; font-size:9pt; color:#444; }
.rail-icon { font-weight:700; color:#8a7a50; }
.verbatim { border-left:4pt solid #c9a84c; padding:0.06in 0 0.06in 0.15in; font-style:italic;
            font-size:10.5pt; color:#222; line-height:1.5; margin:0.08in 0; }
.grade { font-size:9pt; color:#7b1fa2; font-style:italic; margin:0.05in 0 0.12in; }
/* Paragraph spacing: 0.09in fits with 1.45 leading. Indented continuation
   paragraphs would be more bookish but our content mixes lists, badges,
   and callouts heavily — flush-left with space-between scans better. */
p { margin:0 0 0.09in; text-align:left; text-align-last:left; hyphens:manual; -webkit-hyphens:manual; word-spacing:0; }
h3 { font-size:13pt; margin:0.2in 0 0.08in; }
h4 { font-size:11pt; margin:0.12in 0 0.06in; }
table.score { width:100%; border-collapse:collapse; font-size:9pt; margin-top:0.15in; table-layout:fixed; }
table.score th { text-align:left; padding:0.06in 0.04in; border-bottom:1.5pt solid #1a2744; font-size:8pt; font-variant:small-caps; letter-spacing:0.1em; color:#8a7a50; font-weight:700; }
table.score th:nth-child(1) { width:0.35in; }
table.score th:nth-child(2) { width:auto; }
table.score th:nth-child(3) { width:0.4in; text-align:center; }
table.score th:nth-child(4) { width:1.0in; text-align:center; }
table.score th:nth-child(5) { width:0.9in; text-align:left; padding-left:0.08in; }
table.score { page-break-inside:auto; }
table.score thead { display:table-header-group; }
table.score tr { page-break-inside:avoid; page-break-after:auto; }
table.score tbody tr:nth-child(even) td { background:#fbf8f1; }
table.score td { padding:0.07in 0.04in; border-bottom:0.5pt solid #e8e0c8; vertical-align:middle; line-height:1.35; }
table.score td:nth-child(1) { color:#8a7a50; font-feature-settings:'tnum' 1; font-variant-numeric:tabular-nums; text-align:right; padding-right:0.06in; }
table.score td:nth-child(3) { text-align:center; color:#888; font-size:8.5pt; }
table.score td:nth-child(4) { text-align:center; }
table.score td:nth-child(4) .vb { margin-left:0; min-width:0.65in; text-align:center; }
table.score td:nth-child(5) { padding-left:0.08in; }
.yours-blank { display:inline-block; width:0.78in; border-bottom:0.6pt solid #c9a84c; height:1.05em; vertical-align:middle; }
sup.fn { color:#8a7a50; font-size:0.7em; font-weight:700; margin-left:1pt; vertical-align:super; line-height:0; }
.chapter-sources { margin:0.35in 0 0.1in; padding:0.18in 0.2in; background:#faf8f4; border:1pt solid #e8e0c8; border-radius:4pt; font-size:8.5pt; color:#444; line-height:1.55; page-break-inside:avoid; break-inside:avoid; -webkit-box-decoration-break:clone; box-decoration-break:clone; }
.chapter-sources .sources-header { font-size:9pt; font-weight:700; font-variant:small-caps; letter-spacing:0.1em; color:#8a7a50; margin-bottom:0.08in; }
.chapter-sources ol { margin:0; padding-left:0.28in; }
.chapter-sources ol li { margin-bottom:0.06in; padding-left:0.04in; font-feature-settings:'tnum' 1; font-variant-numeric:tabular-nums; }
.chapter-sources ol li::marker { color:#8a7a50; font-weight:700; }
/* Scorecard section verdict caption — keep with table above */
table.score + p { page-break-before:avoid; }
/* TOC leader dots — replace plain flex with proper book-style leaders */
.toc-entry { position:relative; }
.toc-entry .t { background:#fff; padding-right:0.06in; }
.toc-entry::after { content:""; position:absolute; left:0.15in; right:1.1in; bottom:0.22em; border-bottom:0.4pt dotted #bbb; z-index:-1; }
.toc-entry .vb { background-clip:padding-box; }
/* Score table part-header h3 should stay with first row */
h3 + table.score { page-break-before:avoid; }

/* --- Illustration plates ---
   Treat each chapter image as a printed plate, not an inline figure.
   Hairline gold rule above + below, 1pt cream border on the image,
   small-caps "PLATE" eyebrow above the italic caption. */
.illus { text-align:center; margin:0.28in auto 0.32in; page-break-inside:avoid; max-width:4.2in; }
.plate-rule { width:0.6in; height:0.5pt; background:#c9a84c; margin:0 auto 0.18in; }
/* v1.1 ePub fix: plate-frame was display:inline-block which iBooks
   collapsed to zero width on chapter-opener pages → image rendered blank.
   Switched to block + auto margins so it always reserves layout space. */
.plate-frame { display:block; padding:4pt; background:#fdfaf2; border:0.5pt solid #e0d8c8; margin:0 auto; max-width:4in; }
/* v1.1 ePub fix: max-height in inches was ignored by iBooks → image
   collapsed to zero height on some chapter pages. Use em + height:auto so
   the image always renders with its intrinsic aspect ratio. */
.plate-frame img { display:block; max-width:100%; height:auto; max-height:24em; margin:0 auto; }
.plate-caption { font-family:'Palatino','Palatino Linotype',Georgia,serif; font-style:italic; font-size:9pt; color:#555; margin:0.14in 0 0; line-height:1.4; }
.plate-eyebrow { display:inline-block; font-style:normal; font-variant:small-caps; font-weight:700; letter-spacing:0.18em; font-size:7.5pt; color:#8a7a50; margin-right:0.08in; }
/* v1.1 ePub fix: ::after bullet was unreliable in iBooks → "Plate" ran
   directly into caption text ("PlateThe swamp..."). Real em-dash now lives
   in the HTML template (illus()) so it's bulletproof across readers. */

/* Stronger TOC Part heading — small-caps eyebrow on a 1pt navy rule.
   Distinguishes Parts from chapter entries at a glance. */
.toc-part { font-weight:700; font-size:9pt; font-variant:small-caps; letter-spacing:0.18em; color:#1a2744; margin:0.22in 0 0.08in; border-bottom:1pt solid #1a2744; padding-bottom:0.05in; }

/* By-the-Numbers headline should never kiss the trim — paired eyebrow. */
.btn-eyebrow { font-size:8pt; font-variant:small-caps; letter-spacing:0.24em; color:#8a7a50; text-align:center; margin:0 0 0.1in; }
/* By-the-Numbers footer caption. v1.1 ePub fix: previously inline-styled at
   9pt, but iBooks ignored the pt unit when the parent grid collapsed and the
   line rendered as h1-sized body. Use em-relative sizing on a real <p> so it
   stays small no matter the reader's base font. */
.sources-caption { font-size:0.78em; line-height:1.5; color:#888; font-style:italic; text-align:center; margin:0.3in auto 0; max-width:4.5in; }
`
}

function coverPage() {
  return `<div class="cover">
  <img class="cover-bg" src="${IMG.coverArt}" alt=""/>
  <div class="cover-overlay"></div>
  <div class="cover-content">
    <h1 class="cover-title">SEALED</h1>
    <div class="cover-rule"></div>
    <div class="cover-sub">The 2016 Promises<br/>&mdash; Before the Deals</div>
  </div>
  <div class="cover-tag">145 campaign promises. Every receipt. You decide.</div>
  <div class="cover-author">Peter Oliver</div>
  <div class="cover-imprint">SEALED Press &middot; 2026</div>
</div>`
}

function halfTitle() {
  // Traditional half-title: title only, centered, no subtitle, no page number.
  // Forces this onto a right-hand (recto) page — the first interior page.
  return `<div class="half-title"><h1>SEALED</h1></div>`
}

function versoBlank() {
  // Traditional blank verso page following half-title / frontispiece.
  return `<div class="verso-blank">&nbsp;</div>`
}

function frontispiece() {
  // Four-portrait editorial composition: 2016 / 2023 / 2024 / 2026.
  // Vertically centered on the page, each portrait + caption gets ~1.6in
  // of vertical space so the whole spread reads as an editorial poster,
  // not a contact sheet.
  const rows = [
    { img: IMG.c2016, year: "2016", cap: "The outsider. The promise." },
    { img: IMG.c2020, year: "2023", cap: "The indictment. Ninety-one counts." },
    { img: IMG.c2024, year: "2024", cap: "The bullet. The fist." },
    { img: IMG.c2026, year: "2026", cap: "The doctor?" },
  ]
    .map(
      (p) => `
    <div class="fp-row">
      <img src="${p.img}" alt=""/>
      <div class="fp-meta">
        <div class="fp-year">${p.year}</div>
        <div class="fp-cap">${p.cap}</div>
      </div>
    </div>`
    )
    .join("")
  return `<div class="frontispiece">
  ${rows}
  <p class="fp-caption">The promise. The pivot. The platform. The receipt.</p>
</div>`
}

function dedication() {
  return `<div style="page-break-after:always;padding-top:2.6in;text-align:center;">
<p style="font-style:italic;font-size:12pt;color:#555;line-height:2;">For every American who voted based on a promise<br/>and never got a straight answer about whether it was kept.</p>
<p style="font-size:10pt;color:#888;margin-top:0.4in;">This book is the straight answer.</p>
</div>`
}

function copyrightPage() {
  return `<div class="copyright-page">
  <p>&copy; 2026 Peter Oliver. All rights reserved.</p>
  <p>Published by SEALED Press.</p>
  <p>Written by Peter Oliver.</p>
  <p>No portion may be reproduced without permission except brief quotations in reviews.</p>
  <p>Licensed for personal, non-commercial use.</p>
  <p style="margin-top:0.2in;padding:0.12in;background:#faf8f4;border-left:3pt solid #c9a84c;"><strong>About your copy.</strong> This book is individually licensed and watermarked for the purchaser named in the footer on every page. It is for personal use only. Redistribution, resale, uploading, copying, alteration, or removal of the watermark is prohibited. Please direct others to <strong>sealed2016.com</strong> to purchase their own copy.</p>
  <p style="padding:0.12in;background:#fff8e1;border-left:3pt solid #c9a84c;"><strong>A note on the watermark.</strong> Your name and the email address you used at checkout appear on every page along with your order number. We use real identifying information &mdash; not a hash or a masked version &mdash; because a visible name and email is the strongest practical deterrent against copying a digital book. The trade-off is real: <em>if you upload or forward this PDF, you are publishing your own email address and your name to whoever sees it.</em> Once that happens we can&rsquo;t take it back, and we don&rsquo;t monitor or scrape leaks on your behalf. By buying SEALED you accept that trade-off. If you wouldn&rsquo;t want a stranger reading your email off the bottom of this page, treat the file accordingly: don&rsquo;t share it, don&rsquo;t post it, don&rsquo;t put it on a thumb drive someone else can find. Send your friends to sealed2016.com instead.</p>
  <p style="margin-top:0.2in">First digital edition, 2026.</p>
  <p style="margin-top:0.3in"><strong>The color system:</strong> ${badge("KEPT")} = Followed through. ${badge("PARTIAL")} = Some progress. ${badge("BROKEN")} = Didn&rsquo;t happen. ${badge("BLOCKED")} = Courts/Congress stopped it. ${badge("READER")} = You decide.</p>
</div>`
}

function tableOfContents() {
  return `<div class="toc">
  <h2>Contents</h2>
  <div class="toc-part">Introduction &mdash; How to Read This Book</div>
  <div class="toc-part">Part I &mdash; Money &amp; Power</div>
  <div class="toc-entry"><span class="t">1. Trade &mdash; He actually tore it up</span>${badge("KEPT")}</div>
  <div class="toc-entry"><span class="t">2. Drain the Swamp &mdash; Who really got served</span>${badge("BROKEN")}</div>
  <div class="toc-entry"><span class="t">3. Jobs &mdash; Carrier, Ford, and the tax cut</span>${badge("PARTIAL")}</div>
  <div class="toc-entry"><span class="t">4. Healthcare &mdash; The biggest broken promise</span>${badge("BROKEN")}</div>
  <div class="toc-part">Part II &mdash; America vs. The World</div>
  <div class="toc-entry"><span class="t">5. NATO &mdash; Pay up or else</span>${badge("PARTIAL")}</div>
  <div class="toc-entry"><span class="t">6. Middle East &mdash; ISIS, Russia, and the vacuum</span>${badge("PARTIAL")}</div>
  <div class="toc-entry"><span class="t">7. China &mdash; The trade war that actually happened</span>${badge("KEPT")}</div>
  <div class="toc-part">Part III &mdash; Order at Home</div>
  <div class="toc-entry"><span class="t">8. The Wall &mdash; Mexico didn&rsquo;t pay</span>${badge("PARTIAL")}</div>
  <div class="toc-entry"><span class="t">9. Law &amp; Order &mdash; Chicago and the data</span>${badge("READER")}</div>
  <div class="toc-part">Part IV &mdash; The Receipts They Tried to Delete</div>
  <div class="toc-entry"><span class="t">10. What was promised in 2024 (before they took it down)</span>${badge("PENDING")}</div>
  <div class="toc-part">Part V &mdash; Your Scorecard</div>
  <div class="toc-entry"><span class="t">All promises. One page. Your grades.</span></div>
  <div class="toc-entry"><span class="t">Appendices &mdash; How to verify everything</span></div>
</div>`
}

function byTheNumbers() {
  return `<div style="page-break-before:always;page-break-after:always;padding-top:0.4in;">

<p style="font-size:8pt;font-variant:small-caps;letter-spacing:0.22em;color:#8a7a50;text-align:center;margin-bottom:0.08in;">The Scoreboard</p>
<h2 style="font-size:24pt;text-align:center;letter-spacing:0.01em;margin-bottom:0.55in;font-weight:700;line-height:1.1;">By the Numbers</h2>

<!-- Verdict tally — four-column editorial display, no fills.
     Each cell: large numeral in book serif, hairline rule above,
     verdict label as small-caps in the verdict's accent color. -->
<div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:0.18in;page-break-inside:avoid;border-top:0.5pt solid #1a2744;border-bottom:0.5pt solid #1a2744;padding:0.32in 0.05in;margin-bottom:0.35in;">
<div style="text-align:center;">
  <div style="font-family:Palatino,Georgia,serif;font-size:54pt;font-weight:700;color:#1e7e34;line-height:1;">46</div>
  <div style="font-size:8pt;font-variant:small-caps;letter-spacing:0.18em;color:#1e7e34;margin-top:0.1in;">Promises Kept</div>
  <div style="font-size:8.5pt;color:#888;margin-top:0.04in;">31.7%</div>
</div>
<div style="text-align:center;">
  <div style="font-family:Palatino,Georgia,serif;font-size:54pt;font-weight:700;color:#e65100;line-height:1;">51</div>
  <div style="font-size:8pt;font-variant:small-caps;letter-spacing:0.18em;color:#e65100;margin-top:0.1in;">Partial</div>
  <div style="font-size:8.5pt;color:#888;margin-top:0.04in;">35.2%</div>
</div>
<div style="text-align:center;">
  <div style="font-family:Palatino,Georgia,serif;font-size:54pt;font-weight:700;color:#b71c1c;line-height:1;">40</div>
  <div style="font-size:8pt;font-variant:small-caps;letter-spacing:0.18em;color:#b71c1c;margin-top:0.1in;">Broken</div>
  <div style="font-size:8.5pt;color:#888;margin-top:0.04in;">27.6%</div>
</div>
<div style="text-align:center;">
  <div style="font-family:Palatino,Georgia,serif;font-size:54pt;font-weight:700;color:#4a148c;line-height:1;">8</div>
  <div style="font-size:8pt;font-variant:small-caps;letter-spacing:0.18em;color:#4a148c;margin-top:0.1in;">You Decide</div>
  <div style="font-size:8.5pt;color:#888;margin-top:0.04in;">5.5%</div>
</div>
</div>

<p style="text-align:center;font-style:italic;color:#555;font-size:10pt;margin:0 0 0.2in;max-width:4.2in;margin-left:auto;margin-right:auto;line-height:1.55;">Of 145 documented campaign promises from the 2016 cycle, scored against the public record. The blank column at the back of the book is for your own verdicts.</p>
<p style="text-align:center;font-size:8.5pt;color:#8a7a50;font-variant:small-caps;letter-spacing:0.14em;margin:0 0 0.45in;">Scope: 2016 cycle only. Chapter 10 preserves the 2024 commitments &mdash; outcomes pending.</p>

<div style="page-break-inside:avoid;">
<h3 style="font-size:9pt;font-variant:small-caps;letter-spacing:0.16em;color:#8a7a50;margin-bottom:0.18in;font-weight:700;border-bottom:0.5pt solid #1a2744;padding-bottom:0.06in;">Key Data Points</h3>

<table style="width:100%;font-size:9pt;border-collapse:collapse;">
<tr style="border-bottom:0.5pt solid #eee;"><td style="padding:0.06in 0;"><strong>Unemployment (start &rarr; pre-COVID low)</strong></td><td style="text-align:right;font-feature-settings:'tnum' 1;font-variant-numeric:tabular-nums;">4.7% (Jan 2017, BLS) &rarr; 3.5% (Sep 2019, BLS)</td></tr>
<tr style="border-bottom:0.5pt solid #eee;"><td style="padding:0.06in 0;"><strong>Unemployment (COVID peak)</strong></td><td style="text-align:right;font-feature-settings:'tnum' 1;font-variant-numeric:tabular-nums;">14.7% (April 2020)</td></tr>
<tr style="border-bottom:0.5pt solid #eee;"><td style="padding:0.06in 0;"><strong>National debt added</strong></td><td style="text-align:right;font-feature-settings:'tnum' 1;font-variant-numeric:tabular-nums;">+$7.8 trillion</td></tr>
<tr style="border-bottom:0.5pt solid #eee;"><td style="padding:0.06in 0;"><strong>Trade deficit (goods, 2016 vs 2020)</strong></td><td style="text-align:right;font-feature-settings:'tnum' 1;font-variant-numeric:tabular-nums;">$735B &rarr; $901B</td></tr>
<tr style="border-bottom:0.5pt solid #eee;"><td style="padding:0.06in 0;"><strong>Supreme Court justices appointed</strong></td><td style="text-align:right;font-feature-settings:'tnum' 1;font-variant-numeric:tabular-nums;">3</td></tr>
<tr style="border-bottom:0.5pt solid #eee;"><td style="padding:0.06in 0;"><strong>Federal judges confirmed (all levels)</strong></td><td style="text-align:right;font-feature-settings:'tnum' 1;font-variant-numeric:tabular-nums;">234</td></tr>
<tr style="border-bottom:0.5pt solid #eee;"><td style="padding:0.06in 0;"><strong>Border wall miles (new + replacement)</strong></td><td style="text-align:right;font-feature-settings:'tnum' 1;font-variant-numeric:tabular-nums;">~450 of 1,954</td></tr>
<tr style="border-bottom:0.5pt solid #eee;"><td style="padding:0.06in 0;"><strong>China tariffs collected (2018-2020)</strong></td><td style="text-align:right;font-feature-settings:'tnum' 1;font-variant-numeric:tabular-nums;">$79B+ (paid by importers)</td></tr>
<tr style="border-bottom:0.5pt solid #eee;"><td style="padding:0.06in 0;"><strong>Farmer bailouts from tariff retaliation</strong></td><td style="text-align:right;font-feature-settings:'tnum' 1;font-variant-numeric:tabular-nums;">$28B</td></tr>
<tr style="border-bottom:0.5pt solid #eee;"><td style="padding:0.06in 0;"><strong>Government shutdown (longest in history)</strong></td><td style="text-align:right;font-feature-settings:'tnum' 1;font-variant-numeric:tabular-nums;">35 days</td></tr>
<tr style="border-bottom:0.5pt solid #eee;"><td style="padding:0.06in 0;"><strong>Children separated at border (Zero Tolerance)</strong></td><td style="text-align:right;font-feature-settings:'tnum' 1;font-variant-numeric:tabular-nums;">2,654+</td></tr>
<tr style="border-bottom:0.5pt solid #eee;"><td style="padding:0.06in 0;"><strong>ISIS territory lost</strong></td><td style="text-align:right;font-feature-settings:'tnum' 1;font-variant-numeric:tabular-nums;">99% by March 2019</td></tr>
<tr style="border-bottom:0.5pt solid #eee;"><td style="padding:0.06in 0;"><strong>NATO allies meeting 2% spending</strong></td><td style="text-align:right;font-feature-settings:'tnum' 1;font-variant-numeric:tabular-nums;">3 (2014) &rarr; 10 (2020)</td></tr>
<tr style="border-bottom:0.5pt solid #eee;"><td style="padding:0.06in 0;"><strong>COVID-19 US deaths (through Jan 2021)</strong></td><td style="text-align:right;font-feature-settings:'tnum' 1;font-variant-numeric:tabular-nums;">~400,000</td></tr>
<tr style="border-bottom:0.5pt solid #eee;"><td style="padding:0.06in 0;"><strong>Impeachments</strong></td><td style="text-align:right;font-feature-settings:'tnum' 1;font-variant-numeric:tabular-nums;">2 (first president impeached twice)</td></tr>
<tr><td style="padding:0.06in 0;"><strong>Pardons + commutations (final day alone)</strong></td><td style="text-align:right;font-feature-settings:'tnum' 1;font-variant-numeric:tabular-nums;">143</td></tr>
</table>
</div>

<p class="sources-caption">Sources: BLS, Census Bureau, Treasury, CBO, CBP, NATO, CDC. Full sourcing in Appendix B.</p>
</div>`
}

function foreword() {
  return `<div class="chapter-start" style="padding-top:1.2in;">
  <span class="ch-num">Foreword</span>
  <h1 class="ch-title">The Problem with Memory</h1>
  <p class="ch-sub">Why this book needed to exist.</p>
</div>

<p>On June 16, 2015, a real-estate developer rode an escalator in a Manhattan lobby and announced he was running for president. Over the next 17 months, he made hundreds of public statements about what he would do if elected. Some were specific (&ldquo;cut the corporate tax rate to 15%&rdquo;). Some were sweeping (&ldquo;drain the swamp&rdquo;). Some were personal (&ldquo;I will be the greatest jobs president that God ever created&rdquo;).</p>

<p>Millions of Americans voted based on those statements. They walked into polling booths in Michigan, Pennsylvania, Wisconsin, Florida, Ohio, and every other state, and they made a choice based on what they believed a candidate would do.</p>

<p>This book asks a simple question: <strong>Did he?</strong></p>

<p>The problem is that nobody remembers the promises correctly. Supporters remember the wins and forget the failures. Critics remember the failures and forget the wins. Social media algorithms show you what confirms your existing beliefs. Cable news serves tribal narratives to tribal audiences. The actual record &mdash; what was said, what happened, and what didn&rsquo;t &mdash; has been buried under a decade of spin from both sides.</p>

<p>We dug it out. The research, data sourcing, and analytics behind this book were carried out by the team at <strong>CampaignReceipts.com</strong> &mdash; an independent project that maintains running ledgers of political promise-vs-outcome data across cycles. They went back to the debate transcripts, rally recordings, and campaign policy documents. They identified 145 specific, verifiable campaign promises. Then they checked each one against the official public record: executive orders, legislation, court opinions, government data, and agency reports.</p>

<p>The result is this book. It is not an argument. It is not a prosecution. It is not a defense. It is an organized record with color-coded verdicts that you can agree with, disagree with, or replace with your own judgment.</p>

<p>We believe American voters deserve better than memory. They deserve receipts.</p>

<p style="margin-top:0.4in;text-align:right;font-style:italic;">&mdash; P.O., May 2026</p>
`
}

function introduction() {
  return `<div class="chapter-start" style="padding-top:1in;">
  <span class="ch-num">Introduction</span>
  <h1 class="ch-title">How to Read This Book</h1>
  <p class="ch-sub">Five minutes. Then you&rsquo;re ready for everything that follows.</p>
</div>

<div class="hook"><span class="hook-label">The Big Idea</span>
In 2015 and 2016, a man running for president made a bunch of promises on TV. Millions of people voted based on those promises. This book does one simple thing: writes down exactly what was said, shows you the receipts for what happened next, and lets <strong>you</strong> decide if the promise was kept.</div>

<p>We don&rsquo;t tell you what to think. We show you what was said, where to look it up, and give you a color-coded label.</p>

<h3>Every Chapter Has the Same Shape</h3>
<p><strong>1. The Illustration</strong> &mdash; captures the feeling in one image.</p>
<p><strong>2. The Hook</strong> &mdash; why this matters to your life, told like a story.</p>
<p><strong>3. The Bottom Line</strong> &mdash; verdict up front so you know what you&rsquo;re reading toward.</p>
<p><strong>4. The Deep Dive</strong> &mdash; 2-3 pages of narrative. What happened, in order, with &ldquo;aha&rdquo; moments highlighted.</p>
<p><strong>5. The Tea</strong> &mdash; the damning details, verified facts that make you go &ldquo;wait, really?&rdquo;</p>
<p><strong>6. Open Threads</strong> &mdash; claims that circulate but aren&rsquo;t proven yet. Clearly labeled.</p>
<p><strong>7. The Conclusion</strong> &mdash; our read. Direct. No hedge.</p>
<p><strong>8. The Receipts</strong> &mdash; quotes, dates, locations, paper trails. For people who verify.</p>

<h3>The Color System</h3>
<p>${badge("KEPT")} They followed through. &nbsp; ${badge("PARTIAL")} Some progress, not the full promise.</p>
<p>${badge("BROKEN")} Clear retreat or just didn&rsquo;t do it. &nbsp; ${badge("BLOCKED")} Courts or Congress stopped it.</p>
<p>${badge("READER")} Evidence shown &mdash; you pick the label.</p>

<h3>Why This Book Exists</h3>

<p>Here&rsquo;s the problem with American politics in 2026: everyone has an opinion about Trump, but almost nobody has the receipts. If you&rsquo;re on the left, you probably assume everything was broken. If you&rsquo;re on the right, you probably think everything was kept. Both are wrong.</p>

<p>The truth is messy. Of 145 campaign promises we tracked, 46 were fully kept, 51 were partially kept, 40 were broken, and 8 are genuinely ambiguous (we labeled those &ldquo;YOU DECIDE&rdquo;). That&rsquo;s not the profile of a pure liar or a pure promise-keeper. It&rsquo;s the profile of a normal politician &mdash; which is ironic, given that the whole pitch was &ldquo;I&rsquo;m not a politician.&rdquo;</p>

<p>This book doesn&rsquo;t care about your party. It cares about your brain. If you&rsquo;re tired of people telling you what to think about this era, this is the alternative: 145 data points, color-coded, with sources. Make your own scorecard. Agree with our labels or change them. The blank column on the right side of the scorecard chapter? That&rsquo;s literally for your pen.</p>

<h3>A Note on Sources</h3>

<p>Every factual claim in this book is sourced from public records: Congressional Research Service reports, Government Accountability Office findings, Bureau of Labor Statistics data, Census Bureau trade figures, CBP enforcement statistics, White House press releases, federal court opinions, and verified contemporaneous reporting. Where we use secondary sources, we name them. Where claims circulate but we can&rsquo;t fully verify them yet, we flag them as &ldquo;OPEN THREADS.&rdquo; Where we genuinely don&rsquo;t know, we say so.</p>

<p>We have no political action committee. No donor base. No cable news contract. No Twitter following to protect. We wrote this book because the historical record deserves to exist in one place, organized for the average American, written at a 6th-grade reading level, with the receipts attached.</p>

<p style="margin-top:0.2in;font-style:italic;color:#555;">Ready? Chapter 1 is the one that sells this book. Let&rsquo;s go.</p>`
}

function ch1_swamp() {
  return `<div class="chapter-start">
  <span class="ch-num">Chapter Two</span>
  <h1 class="ch-title">Drain the Swamp ${badge("BROKEN")}</h1>
  <p class="ch-sub">The swamp didn&rsquo;t drain. It got privatized.</p>
</div>

${illus('swamp','The swamp didn&rsquo;t drain. It got new tenants.')}

<div class="hook"><span class="hook-label">Why This Matters to You</span>
Imagine you hire a plumber who says &ldquo;I&rsquo;ll never take bribes from the pipe company.&rdquo; You believe him. Then you find out TWO new pipe companies &mdash; ones you&rsquo;ve never heard of &mdash; are now running his entire schedule. The old bribes didn&rsquo;t stop. They changed hands. That&rsquo;s this chapter. Except the pipe companies are the Israel lobby and the oil industry, and the plumber is the President of the United States.</div>

<div class="punch">The Bottom Line: He signed an ethics pledge on Day 8. The biggest political donor in history ($218M+) got his entire foreign policy wish list enacted &mdash; three for three. The oil lobby got Venezuela&rsquo;s market cleared. The pledge was revoked on the last day in office. ${badge("BROKEN")}</div>

<h3>The Deep Dive</h3>

<p>On June 16, 2015, Donald Trump stood in his own building and said politicians are &ldquo;totally controlled&rdquo; by lobbyists and donors. He said it in every interview. Every rally. Every debate. The message was clear: when I&rsquo;m in charge, the insiders lose their power.</p>

<p>Eight days into office, he signed an executive order &mdash; the &ldquo;Ethics Pledge.&rdquo; Five-year ban on officials becoming lobbyists. Lifetime ban on lobbying for foreign governments. Real teeth. Real paper.<sup class="fn">1</sup></p>

<p>And then? Several major industry groups and donor-aligned lobbies saw priority policy items advance during the administration. Here&rsquo;s the paper trail on three of them.</p>

<h3>The Israel Lobby: Three Wishes, Three Granted</h3>

<p>AIPAC is one of Washington&rsquo;s most powerful lobbying organizations. For years, they published three top priorities:</p>

<p><strong>Priority #1: Kill the Iran nuclear deal.</strong> Done. May 8, 2018. The US withdrew from the JCPOA &mdash; the multinational agreement that limited Iran&rsquo;s nuclear program.<sup class="fn">2</sup></p>

<p><strong>Priority #2: Move the US embassy to Jerusalem.</strong> Done. May 14, 2018. Breaking decades of bipartisan policy.<sup class="fn">3</sup></p>

<p><strong>Priority #3: Expand the antisemitism definition to cover criticism of Israel.</strong> Done. December 11, 2019. Executive Order 13899 applied the IHRA definition &mdash; which includes &ldquo;applying double standards to Israel&rdquo; and &ldquo;denying Jewish self-determination&rdquo; &mdash; to Title VI civil rights enforcement on campuses.<sup class="fn">4</sup></p>

<div class="aha"><span class="aha-label">A-ha Moment</span>
This means: a university student protesting Israeli government policy on campus could trigger a <strong>federal civil rights investigation</strong> against their school&rsquo;s funding. The ACLU formally opposed this order. Political criticism of a foreign government was effectively reclassified as a civil rights violation.</div>

<p>Who paid for this? Sheldon Adelson &mdash; casino billionaire, among the largest individual political donors of the 2010s. He and his wife Miriam gave roughly <strong>$82 million</strong> to Republican-aligned committees in the 2016 cycle alone (FEC; OpenSecrets).<sup class="fn">5</sup> A reported <strong>$218 million</strong> across his lifetime to Republican causes. His stated public demand, repeated in interviews: neutralize Iran and move the embassy.</p>

<p>He got everything he asked for. Three-for-three.</p>

<p>A note on why this chapter focuses on one donor: mega-donors exist across the political spectrum. Tom Steyer, George Soros, Michael Bloomberg, Haim Saban, and Reid Hoffman have all given at comparable magnitudes to Democratic causes. The reason Adelson gets the spotlight in this chapter isn&rsquo;t that he was the only major donor; it&rsquo;s that he is the unusually clean case where the donor&rsquo;s <em>published</em> policy wishlist, the donor&rsquo;s specific giving, and the administration&rsquo;s executed policy all line up three-for-three on the public record. That makes the receipts traceable. Other donor-policy relationships exist; most are messier on paper. We follow the paper.</p>

<h3>The Oil Lobby: Clear the Competition</h3>

<p>Venezuela sits on the world&rsquo;s largest proven oil reserves. In January 2019, the US imposed crushing sanctions on PDVSA (Venezuela&rsquo;s state oil company), effectively removing their oil from global markets.<sup class="fn">6</sup></p>

<p>John Bolton &mdash; National Security Advisor &mdash; said this on Fox News: &ldquo;It will make a big difference to the United States economically if we could have American oil companies invest in and produce the oil capabilities in Venezuela.&rdquo;</p>

<div class="aha"><span class="aha-label">A-ha Moment</span>
He said the quiet part out loud. On television. The National Security Advisor explicitly stated that sanctions against a sovereign nation would benefit American oil companies. This is not interpretation &mdash; it&rsquo;s a quote you can watch on YouTube.</div>

<p>Then Chevron &mdash; one of America&rsquo;s largest oil companies and a top-20 lobbying spender &mdash; received a special Treasury license (General License 8) allowing them to continue operating in Venezuela while every other company was locked out. One American oil company got preferential access to the world&rsquo;s biggest oil reserve while their competitor (PDVSA) was financially destroyed.</p>

<h3>The Cabinet: The Richest in History</h3>

<p>The man who promised to &ldquo;defeat the special interests&rdquo; built the wealthiest cabinet in modern American history:</p>
<p>&bull; <strong>Rex Tillerson</strong> (Secretary of State) &mdash; CEO of ExxonMobil</p>
<p>&bull; <strong>Steven Mnuchin</strong> (Treasury) &mdash; Goldman Sachs partner</p>
<p>&bull; <strong>Wilbur Ross</strong> (Commerce) &mdash; Billionaire private equity, Russian business ties</p>
<p>&bull; <strong>Betsy DeVos</strong> (Education) &mdash; Billionaire mega-donor family</p>
<p>Combined net worth: over $6 billion. These were not outsiders disrupting Washington. They were insiders from a different building.</p>

<div class="tea">
<p class="tea-header">THE DEEP TEA (verified public record)</p>
<p>&bull; Total lobbying spending in Washington <strong>rose</strong> from $3.15B (2016) to $3.53B (2020).<sup class="fn">7</sup> The swamp got bigger, not smaller.</p>
<p>&bull; AIPAC&rsquo;s real power isn&rsquo;t their $3.5M/year in disclosed lobbying. It&rsquo;s <strong>bundling</strong> &mdash; organizing wealthy donors to give to specific candidates. Estimated at <strong>$100M+ per election cycle</strong> across aligned donors.</p>
<p>&bull; The Golan Heights were recognized as Israeli territory (March 2019) &mdash; two weeks before Netanyahu&rsquo;s election.</p>
<p>&bull; Jared Kushner (senior advisor, son-in-law) was given the Middle East peace portfolio. His family foundation donated to Israeli settlements. He had a pre-existing personal relationship with Netanyahu.</p>
<p>&bull; The ethics pledge was revoked by executive order on January 20, 2021 &mdash; the final day. Former officials could lobby immediately. Several did.<sup class="fn">8</sup></p>
</div>

<div class="rumor">
<p class="rumor-header">OPEN THREADS &mdash; circulating, not yet substantiated</p>
<p class="rumor-note">These claims circulate widely but lack primary-source proof meeting our standard. Included because you&rsquo;ll encounter them. The verified facts above stand on their own regardless.</p>
<p>&bull; <strong>Adelson &ldquo;pre-conditions&rdquo;:</strong> Multiple outlets (Intercept, Haaretz, Politico) reported donations came with explicit policy conditions &mdash; Iran withdrawal and embassy move as transactional requirements. No written agreement published. Timing documented; quid-pro-quo alleged, not proven.</p>
<p>&bull; <strong>Kushner-MBS-Netanyahu back-channel:</strong> Reporting describes a three-way communication channel operating outside State Department channels. Relationships documented; content of conversations based on anonymous sources.</p>
<p>&bull; <strong>Golan recognition timed to save Netanyahu:</strong> Two weeks before Israeli elections in which Bibi faced criminal charges and was fighting for survival. White House denied coordination. Timing is fact; motivation is inference.</p>
<p>&bull; <strong>AIPAC &ldquo;loyalty pledge&rdquo; in Congress:</strong> Former reps (including Cynthia McKinney, publicly) described being asked to sign pledges of Israel support for campaign funding. No signed document published by major outlet. Claim is testimonial, not documentary.</p>
</div>

<div class="conclusion">
<p class="conclusion-header">CONCLUSION</p>
<p>&ldquo;Drain the swamp&rdquo; was the most powerful emotional promise of 2016. It meant: the insiders who control Washington won&rsquo;t control ME.</p>
<p>The evidence shows the opposite. The largest donor in political history got 3-for-3 on his foreign policy wish list. The oil lobby&rsquo;s competition was sanctioned while one company got exclusive access. The cabinet was stacked with Goldman Sachs partners and fossil fuel executives. Lobbying spending rose every year.</p>
<p>The ethics pledge &mdash; the one tangible action &mdash; lasted exactly one term and was erased on the walk out the door.</p>
<p style="font-weight:700;font-size:11pt;margin-top:0.12in;">This wasn&rsquo;t draining the swamp. It was privatizing it.</p>
</div>

<h3>The Receipts</h3>

<div class="entry">
  <h4 class="entry-title">Receipt 1 &mdash; The Promise</h4>
  <div class="rail">June 16, 2015 &bull; Trump Tower &bull; New York &bull; Campaign launch</div>
  <div class="verbatim">&ldquo;Politicians are almost completely controlled by lobbyists, donors and the special interests&hellip; We will change Washington together and defeat the special interests.&rdquo;</div>
  <div class="paper-trail"><span class="pt-label">Paper trail:</span> CBS News transcript; Senate LD-2 lobbying disclosures; OpenSecrets lobbying totals (compare 2016 vs 2020).</div>
</div>

<div class="entry">
  <h4 class="entry-title">Receipt 2 &mdash; The Ethics Pledge (signed + revoked)</h4>
  <div class="rail">Jan 28, 2017 (signed) &bull; Jan 20, 2021 (revoked)</div>
  <div class="verbatim">&ldquo;I will impose a five year ban on executive branch officials becoming lobbyists and a lifetime ban on officials becoming lobbyists for a foreign government.&rdquo;</div>
  <div class="paper-trail"><span class="pt-label">Paper trail:</span> EO 13770 (Jan 28, 2017); revocation EO (Jan 20, 2021); FARA registrations post-2021; OGE waivers granted during term.</div>
</div>

<div class="entry">
  <h4 class="entry-title">Receipt 3 &mdash; AIPAC Wish List (3 for 3)</h4>
  <div class="rail">2018-2019 &bull; Executive actions</div>
  <div class="paper-trail"><span class="pt-label">Paper trail:</span> JCPOA withdrawal (Federal Register, May 8, 2018); Embassy Jerusalem (State Dept, May 14, 2018); EO 13899 antisemitism (Dec 11, 2019); FEC: Adelson contributions; AIPAC published priorities.</div>
</div>

<div class="entry">
  <h4 class="entry-title">Receipt 4 &mdash; Venezuela / Oil Lobby</h4>
  <div class="rail">Jan-Aug 2019 &bull; Treasury OFAC + NSC</div>
  <div class="paper-trail"><span class="pt-label">Paper trail:</span> EO 13850/13857; PDVSA designation (Jan 28, 2019); Chevron General License 8; Bolton Fox News transcript; OpenSecrets: Chevron/ExxonMobil lobbying spend.</div>
</div>

<h3>The Russia Investigation: The Shadow Over Everything</h3>

<p>No accounting of the &ldquo;swamp&rdquo; question is complete without addressing the elephant that dominated the first two years: the Mueller investigation.</p>

<p>The facts (not opinions): Russia interfered in the 2016 election (Senate Intelligence Committee, bipartisan conclusion). The campaign had over 100 contacts with Russian-linked individuals (Senate report). The National Security Advisor (Michael Flynn) lied to the FBI about Russian contacts and was fired after 24 days. The campaign chairman (Paul Manafort) was convicted of financial crimes and had previously worked for pro-Russian Ukrainian interests. A campaign advisor (George Papadopoulos) had advance knowledge of Russian-obtained Clinton emails.</p>

<p>Special Counsel Robert Mueller investigated for 22 months. The findings: Russia interfered (confirmed). Senior campaign figures &mdash; including Donald Trump Jr., Paul Manafort, and Jared Kushner &mdash; met with a Russian lawyer in June 2016 expecting damaging information on Clinton (Mueller Report Vol. I, pp. 110&ndash;123). Manafort shared internal polling data with Konstantin Kilimnik, assessed by the bipartisan Senate Intelligence Committee as a Russian intelligence officer (SSCI Vol. 5). But: Mueller did not establish a criminal conspiracy &mdash; meaning he couldn&rsquo;t prove beyond reasonable doubt that the campaign coordinated with Russia in a legally prosecutable way.</p>

<p>On obstruction of justice, Mueller documented 10 episodes that met the elements of obstruction but explicitly declined to make a charging decision, citing DOJ policy that a sitting president cannot be indicted. Attorney General Barr summarized this as &ldquo;no obstruction&rdquo; &mdash; a characterization Mueller publicly disputed.</p>

<p>Why does this matter for &ldquo;drain the swamp&rdquo;? Because the investigation revealed exactly the kind of foreign influence the campaign promised to end: foreign actors (Russia) helping elect a president, foreign financial entanglements (Manafort/Ukraine), lies about foreign contacts (Flynn). The swamp wasn&rsquo;t just domestic lobbying &mdash; it was also foreign influence. And the campaign that promised to drain it was, at minimum, surrounded by it.</p>

<p>The counterargument is straightforward: no criminal conspiracy was proven. The investigation was itself a swamp creation &mdash; intelligence agencies and political opponents using legal process as opposition research. Both framings have evidence. Neither is complete.</p>

<h3>The Other Swamp Promises</h3>

<p>The &ldquo;drain the swamp&rdquo; brand encompassed at least 18 distinct promises. Here&rsquo;s what happened to the rest:</p>

<div class="entry">
  <h4 class="entry-title">Term Limits for Congress ${badge("BROKEN")}</h4>
  <p>The promise: a constitutional amendment imposing term limits. The reality: no legislation was ever introduced by the White House. Term limits require a two-thirds vote in both chambers &mdash; Congress will never vote to fire itself. The promise was structurally impossible and never seriously attempted.</p>
</div>

<div class="entry">
  <h4 class="entry-title">Federal Hiring Freeze ${badge("KEPT")}</h4>
  <p>Signed on Day 3 (Jan 23, 2017). Froze civilian federal hiring except military, national security, and public safety. Lasted about 3 months before being replaced by agency-by-agency plans. Short-lived but it happened.</p>
</div>

<div class="entry">
  <h4 class="entry-title">Two-for-One Regulation Rule ${badge("KEPT")}</h4>
  <p>EO 13771 (Jan 30, 2017): for every new regulation, two existing ones must be identified for elimination. OMB reported 8.5 deregulatory actions per regulatory action in FY2018. The most aggressive deregulation since Reagan by any measure.</p>
</div>

<div class="entry">
  <h4 class="entry-title">Self-Fund Campaign / Refuse Special Interest Money ${badge("BROKEN")}</h4>
  <p>&ldquo;I&rsquo;m using my own money. I&rsquo;m not using lobbyists. I&rsquo;m not using donors.&rdquo; He loaned his primary campaign $66M but took $239M from donors in the general. By 2020, his reelection raised $774M from donors. The self-funding narrative was abandoned entirely after the primaries.</p>
</div>

<div class="entry">
  <h4 class="entry-title">Release Tax Returns ${badge("BROKEN")}</h4>
  <p>&ldquo;I would release them when the audit is complete.&rdquo; The audit excuse persisted for the entire presidency. Returns were eventually obtained by Congress and the Manhattan DA. They revealed consistent use of aggressive loss carry-forwards and minimal federal taxes in several years &mdash; including $750 in 2016 and 2017.</p>
</div>

<div class="entry">
  <h4 class="entry-title">No Goldman Sachs in Government ${badge("BROKEN")}</h4>
  <p>Campaign ads attacked Ted Cruz for his wife&rsquo;s Goldman Sachs career. Then: Steven Mnuchin (Treasury Secretary, 17 years at Goldman), Gary Cohn (NEC Director, Goldman COO), Dina Powell (Deputy NSA, Goldman partner), Steve Bannon (White House strategist, Goldman alum). At least four senior Goldman alumni in the West Wing.</p>
</div>

<div class="entry">
  <h4 class="entry-title">Appoint a Special Prosecutor for Clinton ${badge("BROKEN")}</h4>
  <p>&ldquo;If I win, I&rsquo;m going to instruct my attorney general to get a special prosecutor.&rdquo; After winning: &ldquo;I don&rsquo;t want to hurt the Clintons, they&rsquo;re good people.&rdquo; No special prosecutor was appointed. The promise was abandoned within days of the election.</p>
</div>

<div class="entry">
  <h4 class="entry-title">Cancel UN Climate Payments ${badge("KEPT")}</h4>
  <p>Stopped $2B in remaining payments to the UN Green Climate Fund pledged by Obama. Withdrew from the Paris Agreement (June 1, 2017). Both actions completed. Whether this was &ldquo;draining the swamp&rdquo; or abandoning climate leadership depends on your values.</p>
</div>

<div class="entry">
  <h4 class="entry-title">Divest from Business Interests ${badge("BROKEN")}</h4>
  <p>Placed businesses in a revocable trust managed by his sons. Did not sell. Visited Trump properties 428 times during his presidency (per ProPublica tracking). Foreign governments booked rooms at Trump hotels. The emoluments question was litigated but never resolved before he left office.</p>
</div>

<div class="chapter-sources">
<p class="sources-header">Chapter 1 Sources</p>
<ol>
  <li>Executive Order 13770, &ldquo;Ethics Commitments by Executive Branch Appointees,&rdquo; January 28, 2017. Federal Register Vol. 82, No. 21. <em>archives.gov / federalregister.gov</em>.</li>
  <li>White House Statement on US Withdrawal from JCPOA, May 8, 2018. Treasury Office of Foreign Assets Control, sanctions reimposition timeline. <em>state.gov / treasury.gov/ofac</em>.</li>
  <li>Department of State, &ldquo;Opening Ceremony for the U.S. Embassy in Jerusalem,&rdquo; May 14, 2018; Jerusalem Embassy Act of 1995 waivers (Clinton through Obama). <em>state.gov</em>.</li>
  <li>Executive Order 13899, &ldquo;Combating Anti-Semitism,&rdquo; December 11, 2019. Federal Register Vol. 84, No. 240. ACLU response, December 11, 2019. <em>federalregister.gov / aclu.org</em>.</li>
  <li>Federal Election Commission individual contributor records, 2015&ndash;2016 cycle; OpenSecrets &ldquo;Top Individual Contributors&rdquo; ranking. <em>fec.gov / opensecrets.org</em>.</li>
  <li>Executive Order 13857, &ldquo;Taking Additional Steps To Address the National Emergency With Respect to Venezuela,&rdquo; January 25, 2019; OFAC PDVSA designation, January 28, 2019. <em>treasury.gov/ofac</em>.</li>
  <li>OpenSecrets / Center for Responsive Politics annual lobbying totals, 2016&ndash;2020. Derived from Senate LD-2 filings. <em>opensecrets.org/lobby</em>.</li>
  <li>Executive Order 13983, &ldquo;Revocation of Ethics Commitments by Executive Branch Appointees,&rdquo; January 19, 2021 (effective January 20). Federal Register Vol. 86, No. 13. <em>federalregister.gov</em>.</li>
</ol>
</div>
`
}

function ch2_trade() {
  return `<div class="chapter-start">
  <span class="ch-num">Chapter One</span>
  <h1 class="ch-title">Trade ${badge("KEPT")}</h1>
  <p class="ch-sub">&ldquo;The Worst Deal Ever Signed&rdquo; &mdash; He actually tore it up.</p>
</div>

${illus('trade','NAFTA torn up. TPP killed. The deals changed.')}

<div class="hook"><span class="hook-label">Why This Matters to You</span>
Your town used to have a factory. It made things. People had jobs. Then someone signed a piece of paper that made it cheaper to make those things in Mexico. The factory closed. Your neighbor&rsquo;s dad lost his job. That piece of paper was called NAFTA. In 2016, a candidate pointed at it and said: I will rip this up. On Day 3, he started.</div>

<div class="punch">The Bottom Line: TPP killed on Day 3 (Jan 23, 2017). NAFTA replaced with USMCA (entered into force July 1, 2020). Over $350B in Chinese goods placed under Section 301 tariffs (2018&ndash;2019, USTR). This is the clearest promise-kept in the entire book. ${badge("KEPT")}</div>

<h3>The Deep Dive</h3>

<p>NAFTA was signed in 1994. For 22 years, politicians from both parties defended it while factory towns across the Midwest hollowed out. TPP &mdash; an even bigger trade deal with Pacific nations &mdash; was being negotiated by Obama.</p>

<p>Trump didn&rsquo;t just criticize these deals. He said the specific words: &ldquo;worst trade deal maybe ever signed anywhere.&rdquo; He made it personal. He named NAFTA like it was a villain.</p>

<p>And then he actually did it:</p>

<p><strong>Day 3 (January 23, 2017):</strong> Executive order withdrawing from TPP. Dead. Gone. Twelve countries spent years negotiating it. One signature killed it.<sup class="fn">1</sup></p>

<p><strong>Year 2:</strong> Renegotiated NAFTA into USMCA. New rules on auto manufacturing (75% of components must be made in North America, up from 62.5%). New labor provisions requiring $16/hour minimum for some Mexican auto workers. Passed Congress with bipartisan support &mdash; Democrats AND Republicans voted yes.<sup class="fn">2</sup></p>

<p><strong>2018-2019:</strong> Section 301 tariffs on China. Over $350 billion in Chinese goods tariffed across four rounds. The biggest US-China trade confrontation since normalization in 1979.<sup class="fn">3</sup></p>

<div class="aha"><span class="aha-label">A-ha Moment</span>
This chapter is important because it proves the man <strong>could</strong> keep promises when he wanted to. Trade was kept. Healthcare was broken. The swamp was broken. That pattern tells you something: promises that aligned with donor interests got kept. Promises that required fighting donors got abandoned.</div>

<p>Did the tariffs help American workers? Mixed evidence. Manufacturing employment grew modestly through 2019. But farmers got hammered by Chinese retaliation and needed $28 billion in bailouts. Consumers paid higher prices on goods. The trade deficit with China initially widened before narrowing.</p>

<h3>Who Won the Trade War?</h3>

<p>This is the question everyone asks and nobody answers honestly. Here are the numbers:</p>

<p><strong>Winners:</strong> Steel workers (25% tariff protected domestic production; steel employment rose ~4,000 jobs). Aluminum workers (similar). Some manufacturing firms that competed directly with Chinese imports.</p>

<p><strong>Losers:</strong> Soybean farmers (China bought from Brazil instead; US soybean exports to China fell 75% in 2018). Pork producers (same retaliation pattern). Any manufacturer using steel/aluminum as inputs &mdash; they paid 25% more for raw materials. The downstream job losses in steel-consuming industries (auto, construction, appliances) were estimated at 75,000 by the Federal Reserve &mdash; far exceeding the ~4,000 steel jobs saved.</p>

<p><strong>Consumers:</strong> A New York Fed working paper (Amiti, Redding &amp; Weinstein, 2019) by economists from the NY Fed, Columbia, and Princeton estimated the 2018&ndash;2019 tariff escalations cost the average American household roughly $831 per year in higher prices.<sup class="fn">4</sup> Tariffs are a tax; they&rsquo;re paid by importers, who pass costs to consumers. &ldquo;China pays&rdquo; was always economically illiterate &mdash; and both supporters and opponents of tariffs know this.</p>

<div class="aha"><span class="aha-label">A-ha Moment</span>
The $28 billion in farmer bailouts was paid by US taxpayers to offset the damage from tariffs that were supposed to help US workers. So taxpayers paid twice: once through higher consumer prices, and again through bailout checks to farmers hurt by retaliation. The tariff &ldquo;revenue&rdquo; ($79B collected in 2019) went to the Treasury &mdash; but the costs were diffused across every American&rsquo;s shopping cart.</div>

<p>He didn&rsquo;t promise to fix trade. He promised to rip up the deals. He ripped them up.</p>

<div class="tea">
<p class="tea-header">THE DEEP TEA</p>
<p>&bull; The USMCA was so similar to NAFTA that critics called it &ldquo;NAFTA 2.0.&rdquo; The branding changed more than the substance in many areas. But auto rules-of-origin DID meaningfully change.</p>
<p>&bull; Farmer bailouts ($28B over two years) exceeded the annual revenue of the entire US steel industry. The tariffs protected some workers while devastating others.</p>
<p>&bull; Phase One deal with China (Jan 2020) required China to buy $200B in additional US goods. China never hit those targets &mdash; partly COVID, partly they were unrealistic from the start.</p>
</div>

<div class="conclusion">
<p class="conclusion-header">CONCLUSION</p>
<p>This is the rare chapter where the promise matches the outcome. TPP: dead. NAFTA: replaced. China: confronted. You can argue the tariffs were bad economics. You can argue USMCA was NAFTA with a new hat. But the man said &ldquo;I will tear up these deals&rdquo; and then tore up these deals. In a book full of broken promises, this one was kept.</p>
<p style="font-weight:700;">That makes the broken ones worse &mdash; because it proves he <em>could</em> follow through when he chose to.</p>
</div>

<h3>The Receipts</h3>

<div class="entry">
  <h4 class="entry-title">Receipt 1 &mdash; &ldquo;Worst Deal Ever&rdquo; (Debate Stage)</h4>
  <div class="rail">September 26, 2016 &bull; Hofstra University, NY &bull; First general election debate</div>
  <div class="verbatim">&ldquo;NAFTA is the worst trade deal maybe ever signed anywhere, but certainly ever signed in this country.&rdquo;</div>
  <div class="verbatim">&ldquo;And now you want to approve Trans-Pacific Partnership.&rdquo;</div>
  <div class="paper-trail"><span class="pt-label">Paper trail:</span> Presidential Memorandum withdrawing from TPP (Jan 23, 2017); USMCA text (USTR archives); Congressional vote on USMCA Implementation Act (Jan 2020).</div>
</div>

<div class="entry">
  <h4 class="entry-title">Receipt 2 &mdash; China &ldquo;Piggy Bank&rdquo;</h4>
  <div class="rail">September 26, 2016 &bull; Hofstra &bull; Same debate</div>
  <div class="verbatim">&ldquo;They&rsquo;re using our country as a piggy bank to rebuild China.&rdquo;</div>
  <div class="paper-trail"><span class="pt-label">Paper trail:</span> USTR Section 301 tariff lists (4 rounds, 2018-2019); Treasury currency manipulation designation (Aug 2019); Phase One Agreement (Jan 15, 2020); Census Bureau bilateral trade data.</div>
</div>

<h3>The Steel & Aluminum Tariffs: Rust Belt Theater</h3>

<p>On March 8, 2018, the president signed proclamations imposing 25% tariffs on imported steel and 10% on aluminum &mdash; not under trade law (Section 301) but under <strong>national security</strong> law (Section 232). The argument: America can&rsquo;t fight a war if it can&rsquo;t make its own steel. The Pentagon consumes about 3% of US steel production. The national security argument was widely seen as pretextual &mdash; this was industrial policy dressed in military clothes.</p>

<p>The Rust Belt loved it. Pittsburgh, Gary, Birmingham &mdash; towns that bled steel jobs for 40 years finally had a president saying their industry mattered. Steel stock prices jumped. US Steel announced a restart of a blast furnace in Granite City, Illinois. 800 workers called back.</p>

<p>But then the math caught up. For every steel-making job, there are roughly 80 jobs in steel-consuming industries (auto manufacturing, construction, appliances, machinery). Those companies now paid 25% more for their primary input. Ford estimated $1 billion in additional costs. GM announced layoffs. Caterpillar raised prices. The Peterson Institute estimated 400,000 steel-consuming jobs were affected by higher input costs, while steel production employed about 140,000 total.</p>

<p>Canada &mdash; America&rsquo;s closest ally and the largest steel supplier &mdash; retaliated. The EU retaliated. Nobody was exempt initially (allies were later granted waivers, then those were revoked, then renegotiated). The tariffs created chaos in global supply chains, pitted American industries against each other, and accomplished what they set out to do: protect a politically important industry at the expense of the broader economy.</p>

<p>Were they worth it? That depends on whether you value the symbolic importance of domestic steel production or the economic efficiency of cheaper inputs for downstream manufacturers. Both positions are defensible. Neither is complete.</p>

<h3>The Trade Deficit: Did It Actually Shrink?</h3>

<p>The entire premise of the trade war was: America runs trade deficits because we have bad deals. Fix the deals, shrink the deficit. So what happened?</p>

<p><strong>2016:</strong> US trade deficit in goods: $735 billion.</p>
<p><strong>2017:</strong> $792 billion. (Up.)</p>
<p><strong>2018:</strong> $878 billion. (Up more.)</p>
<p><strong>2019:</strong> $853 billion. (Down slightly from 2018, still higher than 2016.)</p>
<p><strong>2020:</strong> $901 billion. (Highest ever at that point.)<sup class="fn">5</sup></p>

<p>The trade deficit got WORSE, not better, during the entire term. With China specifically, the bilateral deficit narrowed after 2018 &mdash; but imports shifted to Vietnam, Mexico, and other countries. The total deficit didn&rsquo;t shrink; it rerouted. This is what economists call &ldquo;trade diversion&rdquo; &mdash; tariffs don&rsquo;t eliminate demand for imports; they redirect it to whichever country isn&rsquo;t being tariffed.</p>

<p>This doesn&rsquo;t mean the tariffs &ldquo;failed.&rdquo; If the goal was to reduce dependence on China specifically (a national security argument), trade diversion to allies like Mexico is arguably a win. If the goal was to reduce the total deficit (the campaign argument), it plainly failed. The scoreboard depends on which goal you think was real.</p>

<h3>The Other Trade Promises</h3>

<div class="entry">
  <h4 class="entry-title">Renegotiate South Korea Trade Deal (KORUS) ${badge("KEPT")}</h4>
  <p>Threatened to terminate KORUS entirely. Renegotiated in 2018: doubled the cap on US car exports to Korea, extended US truck tariff for 20 more years. Modest changes but the renegotiation happened.</p>
</div>

<div class="entry">
  <h4 class="entry-title">Impose Reciprocal Tariffs ${badge("KEPT")}</h4>
  <p>The &ldquo;mirror tariff&rdquo; idea: if Country X charges 25% on US goods, we charge 25% on theirs. Steel and aluminum tariffs (Section 232) hit allies and adversaries alike &mdash; EU, Canada, Mexico, China. The EU retaliated with tariffs on bourbon, Harleys, and jeans. It happened.</p>
</div>

<div class="entry">
  <h4 class="entry-title">End the Trade Deficit ${badge("BROKEN")}</h4>
  <p>The goods trade deficit was $735B in 2016. By 2020, it was $915B &mdash; a 24% increase. The trade deficit with China narrowed slightly, but the overall deficit widened significantly. Trade wars don&rsquo;t eliminate deficits; they redirect them.</p>
</div>

<div class="entry">
  <h4 class="entry-title">&ldquo;Fair Trade, Not Free Trade&rdquo; ${badge("KEPT")}</h4>
  <p>This was the philosophical frame more than a specific policy. By any measure, trade policy shifted dramatically from multilateral free-trade orthodoxy to bilateral, protectionist, tariff-first confrontation. The frame was enacted completely. Whether &ldquo;fair&rdquo; is accurate depends on who you ask &mdash; American soybean farmers who lost Chinese markets might disagree.</p>
</div>

<div class="entry">
  <h4 class="entry-title">Stop Currency Manipulation by Trading Partners ${badge("PARTIAL")}</h4>
  <p>Treasury labeled China a currency manipulator in August 2019 &mdash; first time since 1994. The label was removed five months later as part of Phase One deal negotiations. The IMF noted China had largely stopped active devaluation by 2016. The accusation was more political than technical.</p>
</div>

<div class="chapter-sources">
<p class="sources-header">Chapter 2 Sources</p>
<ol>
  <li>Presidential Memorandum &ldquo;Withdrawal of the United States from the Trans-Pacific Partnership Negotiations and Agreement,&rdquo; January 23, 2017. <em>federalregister.gov / ustr.gov</em>.</li>
  <li>USMCA Implementation Act, signed January 29, 2020; entered into force July 1, 2020. House vote 385&ndash;41 (Dec 19, 2019); Senate vote 89&ndash;10 (Jan 16, 2020). USTR Annex 4-B (auto rules of origin: 75% RVC, $16/hr labor-value rule). <em>ustr.gov / congress.gov</em>.</li>
  <li>USTR Section 301 Determination on China, March 2018; four tariff lists (Lists 1&ndash;4), 2018&ndash;2019. <em>ustr.gov/issue-areas/enforcement/section-301-investigations</em>.</li>
  <li>Amiti, Mary; Redding, Stephen J.; Weinstein, David E. &ldquo;The Impact of the 2018 Tariffs on Prices and Welfare.&rdquo; <em>Journal of Economic Perspectives</em>, Vol. 33, No. 4 (Fall 2019). NBER Working Paper 25672 (March 2019).</li>
  <li>US Census Bureau, &ldquo;U.S. International Trade in Goods and Services&rdquo; annual reports, 2016&ndash;2020 (goods trade deficit series). <em>census.gov/foreign-trade</em>.</li>
</ol>
</div>
`
}

function ch3_jobs() {
  return `<div class="chapter-start">
  <span class="ch-num">Chapter Three</span>
  <h1 class="ch-title">Jobs &amp; Factories ${badge("PARTIAL")}</h1>
  <p class="ch-sub">&ldquo;They&rsquo;re All Leaving&rdquo; &mdash; He named names. The names tell the story.</p>
</div>

${illus('jobs','Carrier: half-saved. Ford: moved to China anyway.')}

<div class="hook"><span class="hook-label">Why This Matters to You</span>
Most politicians say &ldquo;I&rsquo;ll create jobs.&rdquo; This one said something different. He pointed at a specific factory &mdash; Carrier, in Indianapolis &mdash; and said &ldquo;1,400 people fired. Going to Mexico. I&rsquo;ll stop it.&rdquo; That&rsquo;s not a vague promise. That&rsquo;s a bet with names attached. This chapter checks the names.</div>

<div class="punch">The Bottom Line: Carrier kept ~800 jobs (Indiana gave $7M in tax breaks). But 600 were still cut. Ford moved Focus production to China anyway. The tax cut went from 35% to 21%, not 15%. Unemployment hit 3.5% &mdash; but was that the tax cut or momentum? ${badge("PARTIAL")}</div>

<h3>The Deep Dive</h3>

<p>The debate stage was unusually specific. Not &ldquo;I&rsquo;ll help manufacturing.&rdquo; Not &ldquo;jobs will come back.&rdquo; He said <strong>Carrier</strong>. He said <strong>Ford</strong>. He said <strong>Indianapolis</strong>. He said <strong>1,400</strong>.</p>

<p>That specificity is what makes this testable. And the test results are mixed.</p>

<p><strong>Carrier:</strong> After the election (before inauguration), Mike Pence &mdash; then Governor of Indiana &mdash; brokered a deal. Indiana offered $7 million in tax incentives. Carrier agreed to keep about 800 jobs. Headlines declared victory. But by 2018, Carrier had still laid off ~600 workers. The factory stayed open at reduced capacity. Half-kept.</p>

<p><strong>Ford:</strong> In January 2017, Ford cancelled a $1.6 billion Mexico plant. Headlines: &ldquo;Trump saves Ford jobs!&rdquo; But Ford&rsquo;s CEO said it was a business decision about declining small-car demand, not political pressure. Then in 2019, Ford moved Focus production to China anyway.</p>

<div class="aha"><span class="aha-label">A-ha Moment</span>
The Carrier deal cost Indiana taxpayers $7 million to save 800 jobs. That&rsquo;s $8,750 per job in public money &mdash; going to a subsidiary of United Technologies, a company with $57 billion in annual revenue. The workers kept jobs. The corporation kept the tax break AND still cut 600 positions. Who won?</div>

<p><strong>The Tax Cut:</strong> He promised 35% down to 15%. It went to 21% (Tax Cuts and Jobs Act, December 2017). Still the biggest corporate rate cut in decades. Unemployment fell to 3.5% by late 2019 &mdash; lowest in 50 years. But economists debate how much was TCJA vs. a trend already underway since 2010.</p>

<div class="tea">
<p class="tea-header">THE DEEP TEA</p>
<p>&bull; Carrier&rsquo;s parent company (United Technologies) received $6 billion+ in federal contracts in 2017-2018. The $7M Indiana incentive was pocket change compared to their federal business. Some analysts argue they &ldquo;kept&rdquo; the jobs to protect those contracts, not because of the tax deal.</p>
<p>&bull; Stock buybacks after TCJA: S&P 500 companies bought back $806 billion in stock in 2018 alone (record). The tax cut went heavily to shareholders, not worker wages, in the first two years.</p>
<p>&bull; BLS data: real median weekly earnings grew ~3% from 2017-2019. Modest. Not the &ldquo;Reagan-level&rdquo; boom promised.</p>
</div>

<h3>The Tax Cut: Follow the Money</h3>

<p>The Tax Cuts and Jobs Act (TCJA) was the single biggest legislative achievement of the entire presidency. Signed December 22, 2017. Here&rsquo;s what it actually did:</p>

<p><strong>Corporate rate:</strong> 35% &rarr; 21% (promised 15%, delivered 21%). Still the biggest corporate rate cut since 1986.</p>

<p><strong>Individual rates:</strong> Seven brackets reduced. Top rate from 39.6% to 37%. Standard deduction doubled. Child tax credit doubled from $1,000 to $2,000 per child.</p>

<p><strong>Who benefited most?</strong> Tax Policy Center analysis: top 1% received 20.5% of the total benefit in 2018. Bottom 60% received about 17% combined. The math isn&rsquo;t ambiguous &mdash; the cut was tilted toward corporations and high earners. But middle-class families did see lower taxes in the first years.</p>

<p><strong>The catch:</strong> Individual tax cuts expire in 2025. Corporate rate cut is permanent. If Congress doesn&rsquo;t act, 65% of taxpayers will see a tax increase. The temporary-for-you, permanent-for-corporations structure was a deliberate legislative choice.</p>

<div class="aha"><span class="aha-label">A-ha Moment</span>
The TCJA individual cuts were set to expire because making them permanent would have exceeded the $1.5T budget window under Senate reconciliation rules. So the bill was designed to show a smaller deficit impact by sunsetting the middle-class benefits while keeping the corporate cut forever. The people who wrote the bill chose corporations over kitchen tables in the fine print.</div>

<p><strong>Jobs created?</strong> Unemployment fell from 4.7% (Jan 2017) to 3.5% (Sept 2019) &mdash; the lowest in 50 years. But unemployment was already falling steadily from 10% (Oct 2009) through the entire Obama presidency. The question isn&rsquo;t whether it fell; it&rsquo;s whether TCJA accelerated the fall. Most economists say the effect was modest &mdash; maybe 0.3% faster GDP growth in 2018, fading by 2019.</p>

<div class="conclusion">
<p class="conclusion-header">CONCLUSION</p>
<p>He named specific companies and got specific results &mdash; mixed ones. Carrier: half-saved. Ford: cosmetic. Tax cut: happened but at 21%, not 15%, and the &ldquo;job creator like Reagan&rdquo; framing oversold the wage effects. Unemployment did hit historic lows &mdash; but giving credit requires ignoring six years of prior trend. The verdict: things happened. Not everything promised. Not nothing.</p>
</div>

<h3>The Receipts</h3>

<div class="entry">
  <h4 class="entry-title">Receipt 1 &mdash; Carrier / Ford</h4>
  <div class="rail">Sep 26, 2016 &bull; Hofstra &bull; First debate</div>
  <div class="verbatim">&ldquo;All you have to do is take a look at Carrier air conditioning in Indianapolis. They left&mdash;fired 1,400 people. They&rsquo;re going to Mexico.&rdquo;</div>
  <div class="paper-trail"><span class="pt-label">Paper trail:</span> Indiana IEDC press release; United Technologies SEC filings; BLS QCEW Marion County data; Ford Motor Co. investor presentations.</div>
</div>

<div class="entry">
  <h4 class="entry-title">Receipt 2 &mdash; Tax Cut</h4>
  <div class="rail">Sep 26, 2016 &bull; Hofstra &bull; Same debate</div>
  <div class="verbatim">&ldquo;I&rsquo;ll be reducing taxes tremendously, from 35 percent to 15 percent for companies. That&rsquo;s going to be a job creator like we haven&rsquo;t seen since Ronald Reagan.&rdquo;</div>
  <div class="paper-trail"><span class="pt-label">Paper trail:</span> Tax Cuts and Jobs Act (P.L. 115-97, Dec 2017) &mdash; actual rate: 21%; BLS Employment Situation reports; CBO TCJA analyses; S&P 500 buyback data (S&P Global).</div>
</div>

<h3>The COVID Economy: The Asterisk That Swallows Everything</h3>

<p>Any honest accounting of the economic record must wrestle with COVID-19. In March 2020, the economy that had been adding jobs for 113 consecutive months lost 22 million in two months. Unemployment went from 3.5% (a 50-year low) to 14.7% (the highest since the Great Depression) in 60 days.</p>

<p>Was this the president&rsquo;s fault? No honest analyst says yes. A pandemic is an act of nature (or a lab leak &mdash; the origin debate continues). Was the <em>response</em> adequate? That&rsquo;s more debatable. The CARES Act ($2.2 trillion, March 2020) was the largest emergency spending bill in history. $1,200 stimulus checks went to most Americans. Enhanced unemployment ($600/week extra) kept families afloat. PPP loans kept businesses from mass-closing.</p>

<p>But the economic response was uneven. Large corporations with sophisticated banking relationships got PPP loans faster than small businesses. The stock market recovered to pre-pandemic levels by August 2020 while 30 million Americans were still on unemployment. The K-shaped recovery &mdash; where wealthy Americans got wealthier while working-class Americans got poorer &mdash; was the defining economic feature of 2020.</p>

<p>The final economic scorecard for the full term: first president since Herbert Hoover (1929-1933) to leave office with fewer jobs than when he started. GDP contracted 2.8% in 2020. National debt increased $7.8 trillion in four years. None of these numbers would have happened without COVID. All of them happened on one president&rsquo;s watch.</p>

<p>This book doesn&rsquo;t resolve that tension. We give you the pre-COVID numbers (strong) and the full-term numbers (historic collapse) and acknowledge that both are real. The pre-COVID economy was genuinely good for most Americans. The COVID economy was catastrophic. One term contained both the best pre-pandemic economy in 50 years and the worst collapse since Hoover. Both are his. Neither is a clean verdict.</p>

<h3>The Other Jobs Promises</h3>

<div class="entry">
  <h4 class="entry-title">Create 25 Million Jobs in 10 Years ${badge("BROKEN")}</h4>
  <p>Pre-COVID: 6.7 million jobs created in 3 years (2017-2019). On pace for ~22M over 10 years &mdash; close but not 25M. Then COVID erased 22 million jobs in two months. Net for the full term: the first president since Hoover to leave office with fewer jobs than he started. Context matters, but numbers are numbers.</p>
</div>

<div class="entry">
  <h4 class="entry-title">4% GDP Growth ${badge("BROKEN")}</h4>
  <p>Annual GDP growth: 2.3% (2017), 3.0% (2018), 2.2% (2019), -2.8% (2020). Best quarter was Q2 2018 at 3.2% annualized. Never hit 4% annually. For context: no president has sustained 4% since Clinton&rsquo;s second term, and that was during the dot-com boom.</p>
</div>

<div class="entry">
  <h4 class="entry-title">Bring Back Coal ${badge("BROKEN")}</h4>
  <p>Coal mining employment: 50,000 in Jan 2017, 42,000 by Dec 2019 (pre-COVID). Coal plant retirements accelerated &mdash; natural gas and renewables were simply cheaper. No executive order can reverse basic energy economics. More coal plants closed during this administration than under Obama&rsquo;s second term.</p>
</div>

<div class="entry">
  <h4 class="entry-title">$550 Billion Infrastructure Plan ${badge("BROKEN")}</h4>
  <p>&ldquo;Infrastructure week&rdquo; became a running joke &mdash; announced multiple times, never materialized into legislation. No infrastructure bill passed. The actual infrastructure bill ($1.2T) passed under Biden in 2021. This was arguably the biggest single bipartisan missed opportunity of the term.</p>
</div>

<div class="entry">
  <h4 class="entry-title">Eliminate Federal Debt in 8 Years ${badge("BROKEN")}</h4>
  <p>National debt: $19.9T on Inauguration Day (2017). $27.8T on departure (2021). An increase of $7.8 trillion &mdash; the largest 4-year debt increase in US history. The TCJA alone was projected to add $1.9T over 10 years (CBO). COVID added trillions more. The debt promise wasn&rsquo;t just broken; it went in the exact opposite direction.</p>
</div>

<div class="entry">
  <h4 class="entry-title">Apple Will Build in the US ${badge("PARTIAL")}</h4>
  <p>Apple announced a $1B Austin campus (2018) and claimed $350B in US economic contribution over 5 years. Most of this was pre-existing plans repackaged. iPhones are still assembled in China. The Austin campus is real; the &ldquo;Apple will build here&rdquo; promise was cosmetically met, not structurally.</p>
</div>

<div class="entry">
  <h4 class="entry-title">Buy American, Hire American ${badge("KEPT")}</h4>
  <p>EO 13788 (April 2017): tightened rules for federal procurement and H-1B visas. USCIS denial rates for H-1B petitions rose from 6% (2015) to 21% (2018). &ldquo;Buy American&rdquo; compliance requirements strengthened in federal contracts. The executive order was signed and enforced.</p>
</div>

<div class="entry">
  <h4 class="entry-title">Negotiate Drug Prices Down ${badge("PARTIAL")}</h4>
  <p>Four EOs signed in 2020 targeting drug prices, including a &ldquo;most favored nation&rdquo; pricing model. None were fully implemented before leaving office. The insulin copay cap ($35/month for Medicare Part D) was real but narrow. Pharma lobby spent $306M in 2020 &mdash; the most of any industry in history.</p>
</div>

<div class="chapter-sources">
<p class="sources-header">Chapter 3 Sources</p>
<ol>
  <li>Bureau of Labor Statistics, &ldquo;Employment, Hours, and Earnings from the Current Employment Statistics survey&rdquo; (manufacturing sector series CES3000000001), 2016&ndash;2020. <em>bls.gov/ces</em>.</li>
  <li>Tax Cuts and Jobs Act (Pub. L. 115-97), signed December 22, 2017. CBO scoring (December 2017): $1.9 trillion 10-year deficit increase (after dynamic effects). Joint Committee on Taxation, JCX-67-17. <em>congress.gov / cbo.gov / jct.gov</em>.</li>
  <li>BLS Current Population Survey monthly unemployment data (series LNS14000000), Jan 2017&ndash;Apr 2020. <em>bls.gov/cps</em>.</li>
  <li>Bureau of Economic Analysis, GDP fourth-estimate releases, 2017&ndash;2019; Joint Committee on Taxation revenue effects analyses. <em>bea.gov / jct.gov</em>.</li>
  <li>OpenSecrets pharmaceutical industry lobbying totals, 2020 annual report. Derived from Senate LD-2 filings. <em>opensecrets.org/industries/indus.php?ind=H04</em>.</li>
</ol>
</div>
`
}

function ch4_healthcare() {
  return `<div class="chapter-start">
  <span class="ch-num">Chapter Four</span>
  <h1 class="ch-title">Healthcare ${badge("BROKEN")}</h1>
  <p class="ch-sub">&ldquo;Repeal and Replace&rdquo; &mdash; The most famous broken promise in modern politics.</p>
</div>

${illus('healthcare','McCain. Thumbs down. 49-51. Obamacare still stands.')}

<div class="hook"><span class="hook-label">Why This Matters to You</span>
Your health insurance bill went up 40% in one year. A candidate says: &ldquo;I will tear this up and give you something cheaper.&rdquo; You vote for him. Four years later, the same law is still there. Your bill is still high. The replacement never came. That&rsquo;s this chapter.</div>

<div class="punch">The Bottom Line: The ACA was never repealed. The replacement never came. The &ldquo;skinny repeal&rdquo; failed by ONE vote &mdash; John McCain&rsquo;s thumbs-down on July 28, 2017. Obamacare stands today. ${badge("BROKEN")}</div>

<h3>The Deep Dive</h3>

<p>&ldquo;Repeal and replace.&rdquo; Three words said a thousand times. It was the healthcare promise of the entire campaign. Not &ldquo;tweak Obamacare.&rdquo; Not &ldquo;improve it.&rdquo; REPEAL it. REPLACE it. With something &ldquo;absolutely much less expensive.&rdquo;</p>

<p>What happened was the most dramatic single moment of the entire term:</p>

<p>The House passed the AHCA (American Health Care Act) in May 2017. The Senate tried the BCRA (Better Care Reconciliation Act). Failed. They tried a &ldquo;skinny repeal&rdquo; &mdash; just remove the individual mandate and a few other provisions. The bare minimum.</p>

<p>On July 28, 2017, at 1:30 AM, John McCain walked onto the Senate floor. The bill needed 50 votes. The count was 49-50. Everyone watching thought he&rsquo;d vote yes. He extended his arm. Thumbs down.</p>

<p>49-51. Dead.</p>

<div class="aha"><span class="aha-label">A-ha Moment</span>
The Republican Party controlled the House, the Senate, AND the White House simultaneously from January 2017 to January 2019. They had unified government for two full years. &ldquo;Repeal and replace&rdquo; was their #1 campaign promise for SEVEN YEARS (since the ACA passed in 2010). They couldn&rsquo;t do it. Not because of Democrats. Because of their own members. That tells you the promise was always more useful as a slogan than a plan.</div>

<p>After the dramatic failure, the administration took smaller actions: zeroed out the individual mandate penalty (through the 2017 tax bill), allowed cheaper short-term plans, expanded health reimbursement arrangements. But the ACA&rsquo;s core &mdash; exchanges, subsidies, pre-existing condition protections &mdash; remained law.</p>

<h3>The Replacement That Never Existed</h3>

<p>Here&rsquo;s the part that makes healthcare researchers pull their hair out: there was never a replacement plan. Not during the campaign. Not during the transition. Not during the two years of unified government.</p>

<p>&ldquo;We&rsquo;re going to have something much better.&rdquo; What? &ldquo;It will be great.&rdquo; What specifically? &ldquo;You&rsquo;ll see it in two weeks.&rdquo;</p>

<p>The &ldquo;two weeks&rdquo; promise became a running joke. It was repeated at least four times between 2019 and 2020. No plan was ever released. Not a draft. Not a framework. Not an outline on a napkin. As of this writing, no Republican healthcare plan has ever been published that (a) covers as many people as the ACA, (b) costs less, and (c) protects pre-existing conditions. The three goals are mathematically incompatible without either a mandate or massive subsidies &mdash; which Republicans oppose on principle.</p>

<div class="aha"><span class="aha-label">A-ha Moment</span>
The individual mandate has a long bipartisan policy history. A version was first proposed by the Heritage Foundation in 1989 as a conservative alternative to single-payer. Mitt Romney signed a state-level version into law in Massachusetts in 2006. The ACA, passed in 2010, used a national version. By 2010 the political coalitions had reorganized: the policy concept that began on the right was now opposed by the right and defended by the left. Whether the 1989, 2006, and 2010 versions are the &ldquo;same&rdquo; policy is itself a contested question among policy historians &mdash; the structures differ in important ways. What is documented is that the &ldquo;repeal and replace&rdquo; effort ran for seven years without producing a published replacement plan that matched the ACA on coverage, cost, and pre-existing condition protections simultaneously.</div>

<h3>The Human Cost</h3>

<p>During the two years that repeal was actively pursued, ACA marketplace enrollment fell by 2 million as uncertainty about the law&rsquo;s future discouraged sign-ups. The administration cut ACA advertising by 90% and halved the enrollment period. Navigators (people who help sign up the uninsured) were defunded. These weren&rsquo;t accidents &mdash; they were deliberate sabotage of a law the administration couldn&rsquo;t repeal legislatively.</p>

<p>Meanwhile: the Texas v. Azar lawsuit (supported by the DOJ under this administration) sought to invalidate the ENTIRE ACA through the courts. If it had succeeded, 20 million Americans would have lost coverage and 133 million with pre-existing conditions would have lost protections. The Supreme Court rejected the challenge 7-2 in June 2021. Two of the three Trump appointees voted to keep the ACA alive.</p>

<p>The promise had three testable parts: repeal (no), replace (no), cheaper (premiums stabilized but didn&rsquo;t dramatically fall). Zero for three.</p>

<div class="tea">
<p class="tea-header">THE DEEP TEA</p>
<p>&bull; In seven years of &ldquo;repeal and replace&rdquo; campaigning (2010-2017), Republicans never produced a replacement bill that their own members could agree on. The CBO scored the AHCA/BCRA as causing 22-32 million people to lose coverage. That&rsquo;s why their own moderates couldn&rsquo;t vote yes.</p>
<p>&bull; &ldquo;Who knew healthcare could be so complicated?&rdquo; &mdash; said publicly, February 2017, after apparently learning for the first time that the ACA couldn&rsquo;t be replaced with a few paragraphs.</p>
<p>&bull; The individual mandate penalty was zeroed but not repealed. A legal technicality &mdash; but it meant the law was still on the books. States could (and did) implement their own mandates.</p>
</div>

<div class="conclusion">
<p class="conclusion-header">CONCLUSION</p>
<p>This is the biggest single broken promise of the 2016 campaign. Not because it was a small promise &mdash; it was THE promise for millions of voters. And it failed not because of Democrats (they were powerless 2017-2019), not because of courts, but because the Republican Party spent seven years promising something they had no plan to deliver.</p>
<p style="font-weight:700;">The law still stands. The replacement never came. The premiums are still high.</p>
</div>

<h3>The Receipts</h3>

<div class="entry">
  <h4 class="entry-title">Receipt 1 &mdash; The Promise</h4>
  <div class="rail">Oct 9, 2016 &bull; St. Louis, MO &bull; Second presidential debate</div>
  <div class="verbatim">&ldquo;We have to repeal it and replace it with something absolutely much less expensive and something that works.&rdquo;</div>
  <div class="verbatim">&ldquo;It is a disastrous plan, and it has to be repealed and replaced.&rdquo;</div>
  <div class="paper-trail"><span class="pt-label">Paper trail:</span> Congress.gov: AHCA/BCRA/skinny repeal votes; CBO scores; CMS premium tables; TCJA Section 11081 (mandate penalty zeroed).</div>
</div>

<h3>The Other Healthcare Promises</h3>

<div class="entry">
  <h4 class="entry-title">Allow Insurance Sales Across State Lines ${badge("PARTIAL")}</h4>
  <p>EO 13813 (Oct 2017) directed agencies to expand association health plans and short-term plans across state lines. Some expansion occurred but was limited by court challenges and state resistance. The full &ldquo;buy insurance from any state&rdquo; vision never materialized.</p>
</div>

<div class="entry">
  <h4 class="entry-title">Protect Pre-Existing Conditions ${badge("READER")}</h4>
  <p>&ldquo;I&rsquo;m going to take care of everybody.&rdquo; Simultaneously tried to repeal the ACA (which contains pre-existing condition protections) and claimed to protect them. The DOJ joined a lawsuit (Texas v. Azar) asking courts to invalidate the entire ACA. If they&rsquo;d won, 133 million Americans with pre-existing conditions would have lost protections. They didn&rsquo;t win. Did he protect them by failing to destroy them? You decide.</p>
</div>

<div class="entry">
  <h4 class="entry-title">No Cuts to Social Security ${badge("KEPT")}</h4>
  <p>Social Security benefits were not cut. Payroll tax deferral was offered in 2020 (not a cut). This is one of the few entitlement promises fully kept &mdash; though it&rsquo;s also true that no president has successfully cut Social Security since its creation. The political third rail held.</p>
</div>

<div class="entry">
  <h4 class="entry-title">No Cuts to Medicare ${badge("READER")}</h4>
  <p>No direct benefit cuts. But: every budget proposal included $500B+ in Medicare spending reductions over 10 years (shifting costs to providers, not beneficiaries directly). Whether &ldquo;no cuts to Medicare&rdquo; means &ldquo;no cuts to benefits&rdquo; or &ldquo;no cuts to the program&rsquo;s budget&rdquo; is the key distinction.</p>
</div>

<div class="entry">
  <h4 class="entry-title">End the Individual Mandate ${badge("KEPT")}</h4>
  <p>TCJA (Dec 2017) zeroed out the penalty for not having insurance, effective 2019. The mandate technically still exists in law; the penalty is $0. Functionally dead. This was the single most significant ACA modification achieved.</p>
</div>

<div class="entry">
  <h4 class="entry-title">Veterans Choice Act Expansion ${badge("KEPT")}</h4>
  <p>VA MISSION Act (June 2018) expanded and made permanent the Veterans Choice Program, allowing vets to seek private healthcare when VA wait times exceed standards. Bipartisan vote. Genuinely improved veteran healthcare access. One of the clearest bipartisan wins of the term.</p>
</div>

<div class="entry">
  <h4 class="entry-title">Fix the VA &mdash; Fire Bad Employees ${badge("PARTIAL")}</h4>
  <p>VA Accountability Act (June 2017) made it easier to fire VA employees. Over 4,000 were fired in the first 18 months. But VA wait times remained stubbornly high in many regions, and whistleblower protections were weakened alongside accountability measures. Mixed results.</p>
</div>

<div class="chapter-sources">
<p class="sources-header">Chapter 4 Sources</p>
<ol>
  <li>U.S. Senate roll-call vote on the &ldquo;Better Care Reconciliation Act&rdquo; / &ldquo;skinny repeal&rdquo; (H.R. 1628), July 28, 2017: 49&ndash;51. Senators McCain, Collins, Murkowski voting NO. <em>senate.gov/legislative/votes</em>.</li>
  <li>Tax Cuts and Jobs Act §11081 (2017): individual mandate penalty reduced to $0 effective 2019. Department of Health and Human Services / CMS implementation guidance. <em>cms.gov</em>.</li>
  <li>VA MISSION Act of 2018 (Pub. L. 115-182), signed June 6, 2018. Department of Veterans Affairs implementation reports, 2019&ndash;2020. <em>va.gov / congress.gov</em>.</li>
  <li>Congressional Budget Office, &ldquo;Federal Subsidies for Health Insurance Coverage for People Under Age 65&rdquo; annual reports, 2017&ndash;2020 (ACA enrollment data). <em>cbo.gov</em>.</li>
  <li>Office of the Attorney General, brief in <em>Texas v. United States</em> (later <em>California v. Texas</em>), June 2018 &mdash; DOJ refusal to defend ACA. Supreme Court decision <em>California v. Texas</em>, 593 U.S. ___ (2021). <em>supremecourt.gov</em>.</li>
</ol>
</div>
`
}

function ch5_nato() {
  return `<div class="chapter-start">
  <span class="ch-num">Chapter Five</span>
  <h1 class="ch-title">NATO &amp; Burden-Sharing ${badge("PARTIAL")}</h1>
  <p class="ch-sub">&ldquo;Why Aren&rsquo;t They Paying?&rdquo; &mdash; They did pay more. But not because of one man.</p>
</div>

${illus('nato','Pay your share &mdash; or else.')}

<div class="hook"><span class="hook-label">Why This Matters to You</span>
You and 29 friends hire a security guard for your block. The deal says everyone pays 2% of their income. But most friends pay 1%. You pay 3.5%. You say: pay your share or I quit. Did it work?</div>

<div class="punch">The Bottom Line: NATO spending rose sharply after 2016 &mdash; from 3 nations hitting 2% to 23 by 2024. But the commitment was made in 2014 (before Trump). Russia&rsquo;s invasion of Crimea was likely the bigger driver. He amplified pressure. He didn&rsquo;t create it. ${badge("PARTIAL")}</div>

<h3>The Deep Dive</h3>

<p>NATO&rsquo;s 2% GDP defense spending target was agreed at the Wales Summit in September 2014. That&rsquo;s important: the commitment predated Trump&rsquo;s campaign by a year. Only 3 of 28 members met it in 2014.</p>

<p>Trump made this personal and public in a way no president had. He questioned whether NATO was &ldquo;obsolete.&rdquo; He suggested the US might not defend allies who didn&rsquo;t pay. European leaders were alarmed. Headlines were written.</p>

<p>And spending went up. Undeniably. The trajectory accelerated. By 2020, 11 nations hit 2%. By 2024, 23 of 32.</p>

<div class="aha"><span class="aha-label">A-ha Moment</span>
Here&rsquo;s the honest take: Russia invaded Crimea in 2014. That scared Europe into spending more. Trump yelled at them in 2017-2019. That embarrassed them into spending faster. Both things are true simultaneously. Giving full credit to either one is dishonest. The data shows acceleration after 2016 ON TOP OF a trend that started in 2014.</div>

<p>The promise was &ldquo;make them pay.&rdquo; They paid more. Whether HE made them or Putin made them is the reader&rsquo;s judgment call. But the spending numbers are real and public.</p>

<h3>The Article 5 Question</h3>

<p>NATO&rsquo;s core principle is Article 5: an attack on one is an attack on all. It has been invoked exactly once in history &mdash; on September 12, 2001, by NATO allies rallying to defend the United States after 9/11. They came to our aid. Not the other way around.</p>

<p>In May 2017, at NATO headquarters in Brussels, the new president gave a speech to allied leaders. He was expected to reaffirm Article 5. He didn&rsquo;t. He lectured them about payments instead. European leaders&rsquo; faces in the photographs tell the story.</p>

<p>He eventually said the words &ldquo;I am committing the United States to Article 5&rdquo; in a press conference the following month. But the damage was done. For the first time since 1949, allies genuinely questioned whether America would honor its core commitment.</p>

<div class="aha"><span class="aha-label">A-ha Moment</span>
Here&rsquo;s the irony: Article 5 has only ever been invoked to help the UNITED STATES. NATO allies sent troops to Afghanistan, lost soldiers, and spent blood and treasure defending America&rsquo;s security interests for 20 years. The &ldquo;they don&rsquo;t pay their share&rdquo; argument ignores that they paid in the most expensive currency possible &mdash; their soldiers&rsquo; lives &mdash; in America&rsquo;s war.</div>

<h3>What Actually Drives NATO Spending?</h3>

<p>Three events drove European defense spending increases:</p>

<p><strong>2014: Russia annexes Crimea.</strong> This was the earthquake. European security assumptions built since 1991 collapsed overnight. The Wales Summit 2% pledge followed immediately.</p>

<p><strong>2016-2019: Trump&rsquo;s public pressure.</strong> Embarrassment works. When the US president names you publicly, parliaments feel pressure to act. Defense budgets rose.</p>

<p><strong>2022: Russia invades Ukraine.</strong> This was the tsunami. Defense spending across Europe surged. Germany announced a &euro;100 billion defense fund in a single speech. Finland and Sweden joined NATO. By 2024, 23 of 32 members hit 2%.</p>

<p>The honest analysis: Trump accelerated a trend that Russia started and Russia&rsquo;s further aggression completed. All three factors matter. None alone explains the outcome.</p>

<div class="tea">
<p class="tea-header">THE DEEP TEA</p>
<p>&bull; In a 2019 meeting, Trump reportedly asked aides if the US could withdraw from NATO entirely. Congress passed a bipartisan bill requiring Senate approval for withdrawal &mdash; they were worried enough to legislate a guardrail.</p>
<p>&bull; NATO&rsquo;s own data shows the spending increase trajectory began in 2015 &mdash; after the 2014 Wales Summit and Russia&rsquo;s Crimea annexation. The curve steepened after 2017 but started before Trump took office.</p>
<p>&bull; Trump publicly said he told NATO allies he would &ldquo;encourage&rdquo; Russia to &ldquo;do whatever the hell they want&rdquo; to members that don&rsquo;t pay. US military commanders in Europe privately described this as the most destabilizing statement a US president had made about the alliance.</p>
</div>

<div class="rumor">
<p class="rumor-header">OPEN THREADS &mdash; circulating, not yet substantiated</p>
<p>&bull; Multiple European intelligence sources (reported by major outlets, never confirmed by the administration) claimed that certain NATO withdrawal conversations were more advanced than publicly acknowledged &mdash; with draft timelines circulated internally before being shelved by advisors.</p>
</div>

<div class="conclusion">
<p class="conclusion-header">CONCLUSION</p>
<p>Credit where due: public pressure works, and he applied more of it than any predecessor. But claiming sole credit for a spending trend that began two years before your campaign is intellectually dishonest. The 2014 Wales commitment + Russia&rsquo;s aggression + Trump&rsquo;s public shaming = increased spending. All three factors. Not one.</p>
</div>

<h3>The Receipts</h3>

<div class="entry">
  <h4 class="entry-title">Receipt 1 &mdash; &ldquo;Pay Up&rdquo;</h4>
  <div class="rail">Oct 19, 2016 &bull; Las Vegas &bull; Third presidential debate</div>
  <div class="verbatim">&ldquo;Why aren&rsquo;t they paying? Because they weren&rsquo;t paying. Since I did this&mdash;this was a year ago&mdash;all of a sudden, they&rsquo;re paying.&rdquo;</div>
  <div class="verbatim">&ldquo;I&rsquo;m a big fan of NATO. But they have to pay up.&rdquo;</div>
  <div class="paper-trail"><span class="pt-label">Paper trail:</span> NATO annual defence expenditure tables; 2014 Wales Summit communiqu&eacute;; NATO Secretary General annual reports; US DoD European posture statements.</div>
</div>

<h3>Article 5: The Line Nobody Thought Would Be Tested</h3>

<p>NATO&rsquo;s Article 5 &mdash; an attack on one is an attack on all &mdash; has been invoked exactly once in history: after 9/11, by America. NATO allies went to Afghanistan and bled alongside US troops for 20 years. When the US needed collective defense, the alliance delivered.</p>

<p>That history made the public questioning of Article 5 particularly jarring to allies. The most reported incident: a 2018 NATO summit where the president reportedly told European leaders he was &ldquo;seriously considering&rdquo; withdrawal. This was denied but widely believed. In 2024 (during the campaign for his second term), he publicly stated he would &ldquo;encourage&rdquo; Russia to do &ldquo;whatever the hell they want&rdquo; to NATO members who don&rsquo;t spend enough.</p>

<p>The irony: Russia&rsquo;s 2022 invasion of Ukraine &mdash; the largest land war in Europe since 1945 &mdash; proved the NATO skeptics wrong and the alliance right. Finland and Sweden joined NATO specifically because of Russia&rsquo;s aggression. NATO expanded from 30 to 32 members. European defense spending accelerated dramatically post-invasion. The alliance Trump questioned became more relevant, more unified, and more motivated than at any point since the Cold War.</p>

<p>Some credit Trump for this outcome: the spending pressure he applied, combined with Russia&rsquo;s actual aggression, created an alliance that was better prepared for 2022 than it would have been otherwise. Others argue he weakened alliance cohesion at the exact moment unity was most needed. Both sides have a point. Neither has the whole one.</p>

<h3>The Other Military &amp; Alliance Promises</h3>

<div class="entry">
  <h4 class="entry-title">Rebuild Military to Historic Levels ${badge("KEPT")}</h4>
  <p>Defense spending rose from $606B (FY2017) to $740B (FY2021). The largest peacetime military buildup since Reagan. New weapons systems funded, Space Force created (Dec 2019). The money flowed.</p>
</div>

<div class="entry">
  <h4 class="entry-title">Modernize Navy to 350 Ships ${badge("PARTIAL")}</h4>
  <p>Navy had 275 ships in 2017, reached 296 by 2021. New shipbuilding authorizations increased but production bottlenecks (shipyard capacity, workforce) prevented reaching 350. The goal was set; the industrial base couldn&rsquo;t deliver fast enough.</p>
</div>

<div class="entry">
  <h4 class="entry-title">Strengthen Nuclear Arsenal ${badge("KEPT")}</h4>
  <p>Nuclear Posture Review (Feb 2018) called for new low-yield warheads and expanded capabilities. W76-2 warhead deployed on submarines (Feb 2020). Withdrew from INF Treaty (Aug 2019). Modernization programs funded across the triad.</p>
</div>

<div class="entry">
  <h4 class="entry-title">Stop Nation-Building Overseas ${badge("PARTIAL")}</h4>
  <p>&ldquo;We will stop racing to topple foreign regimes.&rdquo; No new major ground deployments. But: troop levels in Afghanistan remained at ~14,000 through 2019. Doha Agreement (Feb 2020) set withdrawal timeline but didn&rsquo;t complete it. Troops remained in Syria, Iraq, and Africa throughout. Reduced ambition, not withdrawal.</p>
</div>

<div class="entry">
  <h4 class="entry-title">Don&rsquo;t Telegraph Military Moves ${badge("READER")}</h4>
  <p>&ldquo;I don&rsquo;t want the enemy to know what I&rsquo;m doing.&rdquo; Tweeted troop movements, shared classified intel with Russia in the Oval Office (May 2017), and announced the Baghdadi raid on live television with operational details. Whether this counts as &ldquo;not telegraphing&rdquo; is generous.</p>
</div>

<div class="entry">
  <h4 class="entry-title">Japan / South Korea / Saudi Pay for US Protection ${badge("PARTIAL")}</h4>
  <p>Renegotiated burden-sharing agreements with Japan and South Korea. South Korea agreed to pay $1.04B (up from $830M) for US troop presence. Saudi Arabia pledged but largely didn&rsquo;t increase payments. The pressure was applied; results were mixed.</p>
</div>

<div class="entry">
  <h4 class="entry-title">Take Care of Veterans ${badge("PARTIAL")}</h4>
  <p>VA MISSION Act and VA Accountability Act were real. Veteran unemployment hit record lows pre-COVID. But veteran suicide remained at ~17/day throughout the term, and mental health access remained inconsistent. Legislative wins didn&rsquo;t translate to all outcomes.</p>
</div>

<div class="chapter-sources">
<p class="sources-header">Chapter 5 Sources</p>
<ol>
  <li>NATO, &ldquo;Defence Expenditure of NATO Countries (2013&ndash;2024),&rdquo; PR/CP(2024)075, annual press release series. Allied defense spending as a share of GDP, 2014 baseline vs. 2020/2024. <em>nato.int/cps/en/natohq/news_226465.htm</em>.</li>
  <li>NATO Wales Summit Declaration, September 5, 2014 (2% / 20% defense investment pledge). <em>nato.int</em>.</li>
  <li>Department of Defense Nuclear Posture Review, February 2018; W76-2 deployment announcement, February 4, 2020. INF Treaty withdrawal notice, August 2, 2019. <em>defense.gov / state.gov</em>.</li>
  <li>SIPRI Military Expenditure Database, 2017&ndash;2020. Annual totals and per-country breakdowns. <em>sipri.org/databases/milex</em>.</li>
  <li>U.S.&ndash;ROK Special Measures Agreement renegotiations, 2018&ndash;2021 reporting. U.S. State Department press statements. <em>state.gov</em>.</li>
</ol>
</div>
`
}

function ch6_middleeast() {
  return `<div class="chapter-start">
  <span class="ch-num">Chapter Six</span>
  <h1 class="ch-title">Middle East ${badge("PARTIAL")}</h1>
  <p class="ch-sub">&ldquo;She Gave Us ISIS&rdquo; &mdash; ISIS is gone. The Russia dream never materialized.</p>
</div>

${illus('middleeast','ISIS destroyed. Russia cooperation never happened.')}

<div class="hook"><span class="hook-label">Why This Matters to You</span>
ISIS was beheading journalists on YouTube. They controlled territory the size of Great Britain. Cities with millions of people were under their flag. One candidate said: I know who caused this, and I know how to fix it &mdash; work with Russia to destroy them. ISIS is destroyed. Russia cooperation never happened. The story is more interesting than the slogan.</div>

<div class="punch">The Bottom Line: ISIS lost 99% of its territory by March 2019. That&rsquo;s real. But it was the US-led coalition (60+ nations) that did it, not a US-Russia partnership. Russia bombed anti-Assad rebels, not ISIS strongholds. The diagnosis was partially right; the prescription was wrong. ${badge("PARTIAL")}</div>

<h3>The Deep Dive</h3>

<p>Two claims were made. They need to be graded separately:</p>

<p><strong>Claim 1: &ldquo;Obama/Clinton created ISIS by leaving too early.&rdquo;</strong> The timeline: US forces left Iraq in 2011. ISIS declared a caliphate in 2014. Was the withdrawal the cause? It&rsquo;s debatable &mdash; the Iraqi government&rsquo;s corruption and Sunni exclusion played huge roles. But the vacuum theory is held by serious analysts, not just partisans.</p>

<p><strong>Claim 2: &ldquo;Russia and the US should team up against ISIS.&rdquo;</strong> This never happened in any meaningful way. Russia&rsquo;s Syria campaign (starting 2015) primarily targeted anti-Assad rebels, not ISIS positions. De-confliction channels existed (to avoid mid-air collisions). But strategic cooperation? No. Russia wanted Assad preserved. The US wanted ISIS destroyed. Those goals overlapped in theory but diverged in practice.</p>

<div class="aha"><span class="aha-label">A-ha Moment</span>
The ISIS military campaign accelerated under Trump &mdash; with looser rules of engagement and more authority delegated to field commanders. Civilian casualties also increased significantly (per Airwars, the UK-based monitoring NGO). The caliphate was physically destroyed by March 2019. That&rsquo;s real. But the method was &ldquo;bomb more, delegate more&rdquo; &mdash; not the Russia partnership described on the debate stage.</div>

<div class="tea">
<p class="tea-header">THE DEEP TEA</p>
<p>&bull; Civilian casualties from US-led airstrikes increased 215% in Trump&rsquo;s first year compared to Obama&rsquo;s last (per Airwars monitoring group). Looser rules of engagement meant faster results and more collateral damage.</p>
<p>&bull; The Soleimani strike (Jan 2020) killed Iran&rsquo;s top general without Congressional authorization and brought the US to the brink of open war with Iran.</p>
<p>&bull; The Abraham Accords (2020) normalized relations between Israel and four Arab states. Genuinely historic. But the Palestinian question &mdash; the core of Middle East instability &mdash; was sidelined, not solved.</p>
<p>&bull; Moving the US Embassy to Jerusalem (May 2018) fulfilled a promise but enraged Palestinians and most of the Muslim world. A domestic political win that complicated regional diplomacy.</p>
</div>

<div class="conclusion">
<p class="conclusion-header">CONCLUSION</p>
<p>ISIS is gone as a territorial force. That happened during this term. Give credit for the outcome. But the method was a continuation and acceleration of the existing coalition strategy, not the Russia partnership promised. The diagnosis (vacuum theory) has merit. The prescription (Russia cooperation) was either naive or was never seriously intended. The outcome &mdash; ISIS destroyed &mdash; is the one thing that&rsquo;s unambiguously real.</p>
</div>

<h3>The Receipts</h3>

<div class="entry">
  <h4 class="entry-title">Receipt 1 &mdash; ISIS Vacuum</h4>
  <div class="rail">Oct 19, 2016 &bull; Las Vegas &bull; Third debate</div>
  <div class="verbatim">&ldquo;She gave us ISIS, because her and Obama created this huge vacuum&hellip; we should have never been in Iraq, but once we were there, we should have never got out the way they wanted to get out.&rdquo;</div>
  <div class="paper-trail"><span class="pt-label">Paper trail:</span> DOD Operation Inherent Resolve press releases; IG quarterly ISIS reports; coalition strike data; UN migration statistics.</div>
</div>

<div class="entry">
  <h4 class="entry-title">Receipt 2 &mdash; Russia Cooperation</h4>
  <div class="rail">Oct 19, 2016 &bull; Las Vegas &bull; Same debate</div>
  <div class="verbatim">&ldquo;If Russia and the United States got along well and went after ISIS, that would be good.&rdquo;</div>
  <div class="paper-trail"><span class="pt-label">Paper trail:</span> Geneva/Vienna diplomatic track communiqu&eacute;s; de-confliction agreements; Russian MOD targeting data (anti-rebel, not anti-ISIS in most sorties).</div>
</div>

<h3>The Abraham Accords: History Made Sideways</h3>

<p>In September 2020, something happened that most foreign policy experts thought was impossible: Israel signed normalization agreements with the United Arab Emirates, Bahrain, Sudan, and Morocco. No shots fired. No decades of negotiation. Just deals.</p>

<p>The Abraham Accords were historic &mdash; the first Arab-Israeli normalization since Jordan in 1994. The formula was transactional: each country got something specific. UAE got F-35 fighter jets and a halt to Israeli annexation of the West Bank. Bahrain got US political cover. Sudan got removal from the State Sponsors of Terrorism list. Morocco got US recognition of its sovereignty over Western Sahara. Israel got diplomatic recognition and open commerce with wealthy Gulf states.</p>

<p>What was notably missing: Palestinians. The accords bypassed the Palestinian question entirely. Previous US policy (for decades, under both parties) held that Arab-Israeli peace must flow through a Palestinian state. The Abraham Accords said: no, we can route around that problem. It worked diplomatically. Whether it works long-term &mdash; whether durable regional peace is possible while millions of Palestinians live under occupation &mdash; is the question the October 7, 2023 attack made urgently relevant again.</p>

<h3>Iran: Maximum Pressure, Minimum Resolution</h3>

<p>The JCPOA (Iran nuclear deal, 2015) was Obama&rsquo;s signature diplomatic achievement. It limited Iran&rsquo;s uranium enrichment in exchange for sanctions relief. On May 8, 2018, the US withdrew. &ldquo;Maximum pressure&rdquo; began: the most comprehensive sanctions regime ever applied to a country, targeting Iran&rsquo;s oil exports, banking system, shipping, and senior officials.</p>

<p>The result: Iran&rsquo;s economy contracted 6% in 2019. Oil exports fell from 2.5 million barrels/day to under 400,000. Currency lost 60% of its value. Real economic pain. But Iran&rsquo;s response wasn&rsquo;t capitulation &mdash; it was escalation. They resumed enrichment (now at 60%, up from 3.67% under the deal). They attacked Saudi oil facilities (Sept 2019). They shot down a US drone (June 2019). The Soleimani strike (Jan 3, 2020) brought both countries to the edge of war.</p>

<p>Maximum pressure achieved maximum pressure. It did not achieve a better deal, regime change, or behavioral modification. Iran&rsquo;s nuclear program is now MORE advanced than it was under the JCPOA. The question for historians: did withdrawal make America safer? The nuclear scientists in Iran would say no.</p>

<h3>Deep Case Study: The Jerusalem Decision</h3>

<p>Every president since Bill Clinton had signed the same piece of paper every six months. It was called a &ldquo;waiver.&rdquo; In 1995, Congress passed a law saying the US Embassy in Israel should move from Tel Aviv to Jerusalem. But every president &mdash; Clinton, Bush, Obama &mdash; signed a waiver every 180 days to delay it. They all said: the time isn&rsquo;t right. Moving the embassy would anger the Arab world. It would blow up peace talks. It would cause violence.</p>

<p>On December 6, 2017, the waiver wasn&rsquo;t signed. Instead, a speech was given recognizing Jerusalem as Israel&rsquo;s capital. On May 14, 2018, the new embassy opened. Jared Kushner and Ivanka Trump attended the ribbon-cutting ceremony. That same day, 40 miles away at the Gaza border, Israeli forces killed 60 Palestinian protesters. Over 2,700 were injured.</p>

<p>Here is what makes this a case study in how promises actually work: The move was popular with evangelical Christian voters (a key base). It was popular with the Israeli right wing. It was popular with major Republican donors. And it fulfilled a literal campaign promise that three previous presidents had broken. So politically, it was a home run.</p>

<p>But diplomatically? The Arab street erupted. Turkey recalled its ambassador. Jordan condemned it. The UN General Assembly voted 128 to 9 against it. And Palestinians &mdash; who claim East Jerusalem as the capital of a future state &mdash; said the US could no longer be an honest broker in peace talks. The two-state solution, already on life support, flatlined.</p>

<p>The lesson for readers: a promise can be fully kept AND still have consequences nobody discussed on the campaign trail. The question was never &ldquo;can we move the embassy?&rdquo; &mdash; it was &ldquo;what happens after we do?&rdquo; Three presidents in a row answered that question by not moving it. This president moved it. He was right that the sky didn&rsquo;t fall. He was wrong that it wouldn&rsquo;t change the diplomacy. October 7, 2023 proved that the &ldquo;route around the Palestinian problem&rdquo; approach had limits nobody wanted to imagine.</p>

<h3>The Scorecard: All Middle East Promises</h3>

<div class="entry">
  <h4 class="entry-title">Tear Up the Iran Nuclear Deal ${badge("KEPT")}</h4>
  <p>Withdrew from JCPOA on May 8, 2018. Reimposed all sanctions. Iran responded not by negotiating, but by restarting enrichment &mdash; reaching 60% purity by 2021 (weapons-grade is 90%). The deal was torn up. Iran&rsquo;s nuclear program is now more advanced than before the deal existed. A promise kept that may have made the original problem worse.</p>
</div>

<div class="entry">
  <h4 class="entry-title">Move Embassy to Jerusalem ${badge("KEPT")}</h4>
  <p>Done. May 14, 2018. Three presidents signed waivers to avoid this. This one didn&rsquo;t. Evangelical base celebrated. Arab world condemned. UN voted 128-9 against. Promise kept; two-state solution further from reach than ever.</p>
</div>

<div class="entry">
  <h4 class="entry-title">End the War in Afghanistan ${badge("PARTIAL")}</h4>
  <p>The Doha Agreement (Feb 29, 2020) negotiated directly with the Taliban &mdash; without the Afghan government at the table. Troop levels dropped from 14,000 to 2,500. But the full exit happened under Biden (Aug 2021). The framework was built; the chaotic collapse was inherited. Who &ldquo;owns&rdquo; the Afghanistan withdrawal depends on your definition of responsibility.</p>
</div>

<div class="entry">
  <h4 class="entry-title">Extreme Vetting / Muslim Ban ${badge("PARTIAL")}</h4>
  <p>Travel Ban 1.0 (Jan 27, 2017) was blocked by courts in 48 hours. Travel Ban 2.0 &mdash; also blocked. Travel Ban 3.0 (Sept 2017) was finally upheld by the Supreme Court 5-4 in June 2018. Affected nationals from 7 (later 13) countries. Implemented &mdash; but never the blanket &ldquo;total and complete shutdown of Muslims entering&rdquo; described in December 2015.</p>
</div>

<div class="entry">
  <h4 class="entry-title">North Korea &mdash; Solve Nuclear Threat ${badge("BROKEN")}</h4>
  <p>Three summits. Three historic handshakes (Singapore 2018, Hanoi 2019, DMZ 2019). Zero warheads dismantled. North Korea tested more missiles AFTER the love letters than before. By 2023, they had an estimated 50+ nuclear weapons. The photo ops were real. The denuclearization was theater.</p>
</div>

<div class="entry">
  <h4 class="entry-title">No More Endless Wars ${badge("PARTIAL")}</h4>
  <p>No new ground wars started &mdash; that&rsquo;s real. But troops remained in Afghanistan (2,500), Iraq (2,500), Syria (900), and across 15 African nations. Drone strikes increased significantly and the reporting requirement for civilian casualties was revoked (March 2019). The Soleimani assassination came within hours of open war with Iran. Posture changed; the empire of bases did not.</p>
</div>

<div class="entry">
  <h4 class="entry-title">Abraham Accords (not a 2016 promise) ${badge("READER")}</h4>
  <p>Listed for completeness rather than as a kept-or-broken verdict, because this was never campaigned on. Israel normalized with UAE, Bahrain, Sudan, and Morocco (Aug&ndash;Dec 2020) &mdash; the first such deals since Jordan in 1994. Historic and real, and the crown jewel of the term&rsquo;s foreign-policy press kit. Built on the theory that Palestinians could be bypassed; October 7, 2023 challenged that theory catastrophically. Whether a major diplomatic outcome that wasn&rsquo;t promised counts in his favor, against him (for what wasn&rsquo;t addressed), or simply outside the scorecard &mdash; you decide.</p>
</div>

<div class="entry">
  <h4 class="entry-title">Take the Oil from Iraq ${badge("BROKEN")}</h4>
  <p>&ldquo;I always said: take the oil.&rdquo; Seizing a sovereign nation&rsquo;s resources violates the Geneva Conventions and the Hague Regulations of 1907. No general recommended it. No plan was drafted. Even in the most hawkish corners of the Pentagon, this was understood as a talking point, not a policy proposal. Never attempted.</p>
</div>

<div class="chapter-sources">
<p class="sources-header">Chapter 6 Sources</p>
<ol>
  <li>White House Statement, &ldquo;Withdrawal from the Joint Comprehensive Plan of Action,&rdquo; May 8, 2018; National Security Presidential Memorandum 11. Treasury OFAC sanctions reimposition. <em>treasury.gov/ofac</em>.</li>
  <li>Department of State, Proclamation 9683 &ldquo;Recognizing Jerusalem as the Capital of the State of Israel,&rdquo; December 6, 2017; embassy opening, May 14, 2018. <em>state.gov</em>.</li>
  <li>U.S.&ndash;Taliban Agreement signed in Doha, February 29, 2020 (&ldquo;Agreement for Bringing Peace to Afghanistan&rdquo;). State Department text. <em>state.gov/wp-content/uploads/2020/02/Agreement-For-Bringing-Peace-to-Afghanistan</em>.</li>
  <li><em>Trump v. Hawaii</em>, 585 U.S. ___ (2018); Presidential Proclamation 9645 (Travel Ban 3.0), September 24, 2017. Supreme Court ruling 5&ndash;4, June 26, 2018. <em>supremecourt.gov</em>.</li>
  <li>Abraham Accords Declaration, signed September 15, 2020 (UAE, Bahrain); subsequent normalization with Sudan (Oct 2020) and Morocco (Dec 2020). <em>state.gov/the-abraham-accords</em>.</li>
  <li>Airwars (airwars.org) and Bureau of Investigative Journalism datasets on US-coalition airstrike civilian casualties, 2016&ndash;2019. <em>airwars.org / thebureauinvestigates.com</em>.</li>
</ol>
</div>
`
}

function ch7_china() {
  return `<div class="chapter-start">
  <span class="ch-num">Chapter Seven</span>
  <h1 class="ch-title">China ${badge("KEPT")}</h1>
  <p class="ch-sub">&ldquo;Using Us Like a Piggy Bank&rdquo; &mdash; He picked the fight. It happened.</p>
</div>

${illus('china','$350 billion in tariffs. The fight was real.')}

<div class="hook"><span class="hook-label">Why This Matters to You</span>
China makes your phone case, your shoes, your kid&rsquo;s toys. A candidate said: they&rsquo;re cheating, they&rsquo;re stealing, and nobody in Washington will fight them. Then he became president and started the biggest trade war with China since Nixon went to Beijing. Love it or hate it &mdash; the fight was real.</div>

<div class="punch">The Bottom Line: Over $350B in Chinese goods placed under Section 301 tariffs across four rounds (2018&ndash;2019, USTR). Currency manipulator label applied (Aug 2019, Treasury) and removed (Jan 2020). Phase One deal signed Jan 15, 2020. The &ldquo;fight back&rdquo; promise was completely executed. Whether America won the fight is a separate question. ${badge("KEPT")}</div>

<h3>The Deep Dive</h3>

<p>The China frame was three parts: (1) they&rsquo;re growing while we&rsquo;re stagnant, (2) imports are &ldquo;pouring in,&rdquo; (3) nobody fights back.</p>

<p>The response was the most aggressive US trade action against China in 40 years:</p>

<p><strong>March 2018:</strong> Section 301 investigation completed. Finding: China engages in unfair trade practices (forced technology transfer, IP theft). First tariff round: $50B in goods at 25%.</p>

<p><strong>September 2018:</strong> Round 2. Another $200B at 10%, later raised to 25%.</p>

<p><strong>August 2019:</strong> Treasury formally labels China a &ldquo;currency manipulator&rdquo; &mdash; first time since 1994.</p>

<p><strong>January 2020:</strong> Phase One deal signed. China commits to buying $200B in additional US goods over two years. (They never fully met those targets.)</p>

<div class="aha"><span class="aha-label">A-ha Moment</span>
Here&rsquo;s what makes this chapter interesting: the China confrontation was SO bipartisan that Biden kept almost all of Trump&rsquo;s tariffs in place. A Democratic president looked at a Republican president&rsquo;s China policy and said: yeah, we&rsquo;re keeping this. That&rsquo;s how you know it wasn&rsquo;t just showmanship &mdash; it reflected a genuine bipartisan shift in how Washington views China.</div>

<p>Did it work? The US trade deficit with China WIDENED in 2018 ($419B, up from $375B in 2017) before narrowing. Manufacturing employment grew modestly. But American consumers paid higher prices, and farmers needed $28B in bailout aid from retaliatory tariffs.</p>

<h3>The Huawei War</h3>

<p>If tariffs were the visible weapon, the Huawei ban was the nuclear option. In May 2019, the Commerce Department placed Huawei &mdash; the world&rsquo;s largest telecommunications equipment maker &mdash; on the Entity List. American companies could no longer sell chips, software, or components to Huawei without a license.</p>

<p>Why it mattered: Huawei was building 5G infrastructure across the world. 5G isn&rsquo;t just faster phones &mdash; it&rsquo;s the backbone for autonomous vehicles, smart cities, remote surgery, industrial automation. Whoever builds the network has potential access to the data flowing through it. US intelligence agencies argued that Huawei equipment could be used for espionage by the Chinese government, citing a Chinese law requiring companies to assist state intelligence operations.</p>

<p>The US pressured allies to ban Huawei from their 5G networks. The &ldquo;Five Eyes&rdquo; intelligence alliance (US, UK, Australia, Canada, New Zealand) was lobbied heavily. Australia banned Huawei (Aug 2018). The UK initially allowed limited Huawei use, then reversed course and banned it (July 2020). This was the most significant US technology policy since the Cold War export controls on the Soviet Union.</p>

<p>Huawei&rsquo;s smartphone business collapsed outside China. Their chip supply was cut off. Revenue fell 29% in 2021. A $122 billion company was brought to its knees by one policy decision. Whether you think this was justified national security or economic warfare dressed in security language depends on your priors &mdash; but the action was historically extraordinary.</p>

<h3>COVID and the China Blame</h3>

<p>Then came COVID. The virus emerged from Wuhan, China in late 2019. By early 2020, it was a global pandemic. The administration&rsquo;s response to COVID became inseparable from its China policy: &ldquo;China Virus,&rdquo; &ldquo;Kung Flu,&rdquo; demands for reparations, WHO withdrawal (blamed on Chinese influence over the organization).</p>

<p>The lab-leak hypothesis &mdash; that COVID may have escaped from the Wuhan Institute of Virology rather than jumping from animals &mdash; was initially dismissed as a conspiracy theory. By 2023, the FBI and Department of Energy both assessed (with low confidence) that a lab leak was the most likely origin. The administration&rsquo;s early insistence on investigating China&rsquo;s role, while politically motivated, may have been directionally correct. The truth remains unknown.</p>

<p>What&rsquo;s undeniable: the pandemic destroyed whatever remained of US-China diplomatic goodwill. The &ldquo;constructive engagement&rdquo; framework that had governed US-China relations since Nixon was dead. Both parties in Washington now agree: China is a strategic competitor. The debate is over how to compete, not whether to.</p>

<div class="tea">
<p class="tea-header">THE DEEP TEA</p>
<p>&bull; While tariffing Chinese goods, Trump&rsquo;s own companies continued manufacturing products in China. The tariffs applied to everyone except, effectively, connected businesses that applied for exemptions.</p>
<p>&bull; Over 2,200 companies applied for tariff exclusions. The process was opaque. Companies with lobbyists got exclusions at higher rates. ProPublica found some exclusions went to politically connected firms.</p>
<p>&bull; The Phase One deal required China to buy $200B in additional US goods over 2020-2021. By the end, China had purchased only 57% of the target. COVID was a factor &mdash; but the targets were widely viewed as unrealistic even before the pandemic.</p>
</div>

<div class="rumor">
<p class="rumor-header">OPEN THREADS &mdash; circulating, not yet substantiated</p>
<p>&bull; Former National Security Advisor John Bolton wrote that Trump asked Xi Jinping to help him win the 2020 election by purchasing more agricultural products from farm states. If true, it means the trade war was being calibrated for domestic politics, not national economic interest. Bolton&rsquo;s account is firsthand but disputed by the administration.</p>
</div>

<div class="conclusion">
<p class="conclusion-header">CONCLUSION</p>
<p>He said he&rsquo;d fight China. He fought China. The tariffs were real, sustained, and bipartisan enough to survive a change in administration. Whether the fight improved American lives is debatable. But the promise was &ldquo;I&rsquo;ll confront them,&rdquo; and the confrontation was historically significant. Promise kept.</p>
</div>

<h3>The Receipts</h3>

<div class="entry">
  <h4 class="entry-title">Receipt 1 &mdash; &ldquo;Piggy Bank&rdquo;</h4>
  <div class="rail">Sep 26, 2016 &bull; Hofstra &bull; First debate / Oct 19, 2016 &bull; Las Vegas &bull; Third debate</div>
  <div class="verbatim">&ldquo;They&rsquo;re using our country as a piggy bank to rebuild China.&rdquo;</div>
  <div class="verbatim">&ldquo;Our product is pouring in from China, pouring in from Vietnam, pouring in from all over the world.&rdquo;</div>
  <div class="paper-trail"><span class="pt-label">Paper trail:</span> USTR Section 301 report and tariff lists; Treasury currency reports; Census bilateral trade data; Phase One Agreement text; BLS manufacturing employment series.</div>
</div>

<h3>The Other China Promises</h3>

<div class="entry">
  <h4 class="entry-title">Stop Intellectual Property Theft ${badge("PARTIAL")}</h4>
  <p>Section 301 report documented China&rsquo;s IP theft practices. Tariffs imposed partly as punishment. Entity List expanded (Huawei, ZTE, others blocked from US tech). But: FBI reported Chinese economic espionage cases continued to rise annually. The tools were deployed; the problem persists.</p>
</div>

<div class="entry">
  <h4 class="entry-title">Bring Supply Chains Back from China ${badge("PARTIAL")}</h4>
  <p>Tariffs incentivized some reshoring. Semiconductor supply chain concerns became mainstream. But COVID exposed how dependent the US remained &mdash; PPE, pharmaceuticals, rare earths all still heavily China-sourced. CHIPS Act (which addressed this) passed under Biden.</p>
</div>

<div class="entry">
  <h4 class="entry-title">Phase One Deal &mdash; China Buys $200B ${badge("BROKEN")}</h4>
  <p>China committed to purchasing $200B in additional US goods over 2020-2021. Actual purchases: ~57% of target (per Peterson Institute). COVID was a factor, but the targets were widely considered unrealistic by trade economists even before the pandemic hit.</p>
</div>

<div class="entry">
  <h4 class="entry-title">Protect American Technology ${badge("KEPT")}</h4>
  <p>Huawei placed on Entity List (May 2019). Expanded export controls on semiconductor equipment. CFIUS review authority strengthened (FIRRMA, Aug 2018). These actions were significant, bipartisan, and maintained by the next administration. Real, lasting structural change.</p>
</div>

<div class="entry">
  <h4 class="entry-title">Confront China on South China Sea ${badge("PARTIAL")}</h4>
  <p>Freedom of navigation operations continued and slightly increased. But no concrete action stopped China&rsquo;s island-building. The military confrontation was rhetorical and symbolic; China&rsquo;s artificial islands are still there, still militarized.</p>
</div>

<div class="entry">
  <h4 class="entry-title">Ban TikTok / Chinese Apps ${badge("PARTIAL")}</h4>
  <p>EO 13942 (Aug 2020) attempted to ban TikTok and WeChat. Blocked by federal courts. ByteDance sale deadline set but never enforced. The effort was real; the execution failed. TikTok remains operational in the US as of publication.</p>
</div>

<div class="chapter-sources">
<p class="sources-header">Chapter 7 Sources</p>
<ol>
  <li>USTR Section 301 Report on China&rsquo;s Acts, Policies, and Practices Related to Technology Transfer, Intellectual Property, and Innovation, March 22, 2018. <em>ustr.gov</em>.</li>
  <li>Economic and Trade Agreement Between the United States and China (&ldquo;Phase One&rdquo;), signed January 15, 2020. Peterson Institute for International Economics, &ldquo;US-China Phase One Tracker&rdquo; (Chad P. Bown), final report 2022. <em>piie.com/research/piie-charts/us-china-phase-one-tracker</em>.</li>
  <li>U.S. Department of Commerce Bureau of Industry and Security, Entity List additions for Huawei (May 16, 2019) and ZTE (April 16, 2018). <em>bis.doc.gov</em>.</li>
  <li>Executive Order 13942, &ldquo;Addressing the Threat Posed by TikTok,&rdquo; August 6, 2020. Federal injunctions: <em>TikTok Inc. v. Trump</em> (D.D.C. and E.D. Pa.), September&ndash;October 2020. <em>federalregister.gov / courtlistener.com</em>.</li>
  <li>U.S. Treasury, &ldquo;Macroeconomic and Foreign Exchange Policies of Major Trading Partners of the United States,&rdquo; August 5, 2019 (currency-manipulator designation) and January 13, 2020 (delisting). <em>treasury.gov</em>.</li>
</ol>
</div>
`
}

function ch8_border() {
  return `<div class="chapter-start">
  <span class="ch-num">Chapter Eight</span>
  <h1 class="ch-title">The Wall ${badge("PARTIAL")}</h1>
  <p class="ch-sub">&ldquo;Build the Wall&rdquo; &mdash; The most famous promise. Partially built. Never paid for.</p>
</div>

${illus('wall','23% built. 0% paid by Mexico.')}

<div class="hook"><span class="hook-label">Why This Matters to You</span>
&ldquo;Build the wall&rdquo; was the defining chant of 2016. Three words. Said at every rally. The crowd would shout it back. It was simple: build a physical wall, Mexico pays for it, drugs stop, criminals get deported. Four years later: some wall exists, Mexico paid nothing, drugs continued, and the debate is still raging.</div>

<div class="punch">The Bottom Line: ~450 miles of barrier built or replaced (23% of the border). Most replaced existing fencing with taller barriers. Mexico did not pay a single dollar. The government shut down for 35 days over wall funding. Fentanyl &mdash; the deadliest drug &mdash; enters through legal ports where walls don&rsquo;t help. ${badge("PARTIAL")}</div>

<h3>The Deep Dive</h3>

<p>The US-Mexico border is 1,954 miles long. Some of it is river. Some is desert. Some already had fencing. The promise was a wall &mdash; &ldquo;a big, beautiful wall&rdquo; &mdash; coast to coast (or at least where needed). Mexico pays.</p>

<p><strong>What got built:</strong> CBP reported ~450 miles of barrier system by January 2021. But the details matter: most of that replaced existing, shorter barriers with new 30-foot steel bollard fencing. New barrier in previously un-fenced areas was a smaller portion (~80 miles depending on how you count).</p>

<p><strong>Who paid:</strong> Not Mexico. Congress appropriated some funding. The rest came from redirected Department of Defense construction funds &mdash; which caused a government shutdown (December 22, 2018 to January 25, 2019, 35 days, the longest in US history) when Democrats refused to appropriate wall money.</p>

<p><strong>Did it stop drugs?</strong> This is where it gets complicated. CBP drug seizures went UP during this period. That could mean better enforcement OR more drugs flowing. The critical fact: fentanyl &mdash; now the #1 killer &mdash; primarily enters through legal ports of entry (hidden in vehicles and commercial shipments), not between barriers.</p>

<h3>The Government Shutdown</h3>

<p>December 22, 2018. The government shut down. The reason: Congress refused to appropriate $5.7 billion for wall construction. The president refused to sign any spending bill without it. The result: 35 days of shutdown &mdash; the longest in American history.</p>

<p>What that meant in human terms: 800,000 federal workers went without pay. TSA agents &mdash; the people scanning your bags at the airport &mdash; worked without paychecks. Some called in sick. Airport security lines stretched for hours. FBI agents reported difficulty funding investigations. The IRS couldn&rsquo;t process tax refunds. National parks went unstaffed; trash piled up at monuments.</p>

<p>Food banks reported surges in federal employee families seeking help. Coast Guard families started GoFundMe campaigns. Air traffic controllers &mdash; responsible for keeping planes from crashing into each other &mdash; worked unpaid. When LaGuardia Airport briefly halted flights due to staffing, the shutdown ended within hours. The leverage wasn&rsquo;t politics. It was the prospect of planes falling out of the sky.</p>

<p>The resolution: Trump declared a national emergency and redirected $3.6 billion from military construction projects to wall building. Congress never appropriated the wall money. The constitutional question &mdash; can a president spend money Congress refused to authorize? &mdash; went to the courts and was never fully resolved before the administration ended.</p>

<h3>Zero Tolerance: Family Separation</h3>

<p>In April 2018, Attorney General Jeff Sessions announced &ldquo;zero tolerance&rdquo; for illegal border crossing. Every adult caught crossing would be criminally prosecuted. The problem: when you prosecute a parent, you have to separate them from their children. Children can&rsquo;t go to federal criminal holding facilities.</p>

<p>Between April and June 2018, at least 2,654 children were separated from their parents at the border, according to HHS data later released to Congress. Children went to HHS shelter facilities. Parents went to federal criminal proceedings. The data system used to track family relationships was, per the DHS Inspector General&rsquo;s 2019 report, &ldquo;not designed to track families separated by DHS.&rdquo; In documented cases, parents were deported while children remained in US custody.</p>

<p>The policy generated bipartisan opposition. All five living First Ladies (Michelle Obama, Laura Bush, Hillary Clinton, Rosalynn Carter, Melania Trump) issued public statements opposing it. The president signed Executive Order 13841 ending the practice on June 20, 2018, sixty-six days after it began.</p>

<p>Per a 2023 status report from the federal task force established under Executive Order 14011, more than 1,000 children had not been reunited with their parents as of that report. The official rationale was deterrence. Whether the deterrence rationale justifies the documented outcomes is a moral question this book leaves to the reader.</p>

<div class="aha"><span class="aha-label">A-ha Moment</span>
The wall was meant to stop drugs. The deadliest drug (fentanyl, responsible for 70,000+ US deaths per year) comes through the FRONT DOOR &mdash; legal ports of entry &mdash; where a wall is irrelevant. A border wall addresses between-port crossings. The fentanyl crisis is a port-of-entry crisis. The tool doesn&rsquo;t match the problem.</div>

<div class="tea">
<p class="tea-header">THE DEEP TEA</p>
<p>&bull; The government shutdown over wall funding (35 days) left 800,000 federal workers without pay. TSA agents called in sick. Tax refunds were delayed. All for a wall that ended up being funded by raiding DOD accounts.</p>
<p>&bull; The administration&rsquo;s account of how Mexico would fund the wall shifted several times over the term: first a direct payment, then tariffs (paid by US importers), then claimed indirect savings through the renegotiated USMCA. No direct Mexican payment occurred.</p>
<p>&bull; Portions of privately-funded wall (built by a nonprofit called We Build the Wall) literally fell over in high winds. The org&rsquo;s founder, Brian Kolfage, was convicted of fraud for stealing donor money.</p>
</div>

<div class="rumor">
<p class="rumor-header">OPEN THREADS &mdash; circulating, not yet substantiated</p>
<p>&bull; Steve Bannon was on the board of We Build the Wall. In August 2020 he was charged in federal court (SDNY) with conspiracy to commit wire fraud and money laundering in connection with the project. He received a presidential pardon on January 19, 2021 &mdash; hours before the president left office &mdash; mooting the federal case before trial. He was later charged in New York state court on similar facts (2022) and convicted in 2024.</p>
<p>&bull; Some immigration analysts have argued the wall was never meant to work as infrastructure &mdash; it was designed as a <em>symbol</em> that could be perpetually fought over. The political value was in the fight, not the wall. Whether this was intentional strategy or emergent effect is unknowable.</p>
</div>

<div class="conclusion">
<p class="conclusion-header">CONCLUSION</p>
<p>Some wall exists. Give credit for that &mdash; it required fighting Congress, shutting down the government, and redirecting military funds. But: it covers 23% of the border. Mexico paid zero. Fentanyl comes through legal ports. And the org that raised private money to build wall was literally a fraud.</p>
<p style="font-weight:700;">The most famous campaign promise in modern American history was 23% delivered, 0% paid for by Mexico, and doesn&rsquo;t address the #1 drug killing Americans. That&rsquo;s the complete picture.</p>
</div>

<h3>The Receipts</h3>

<div class="entry">
  <h4 class="entry-title">Receipt 1 &mdash; The Wall Promise</h4>
  <div class="rail">Oct 19, 2016 &bull; Las Vegas &bull; Third debate</div>
  <div class="verbatim">&ldquo;Now, I want to build the wall. We need the wall. And the Border Patrol, ICE, they all want the wall. We stop the drugs. We shore up the border.&rdquo;</div>
  <div class="verbatim">&ldquo;We have some bad hombres here, and we&rsquo;re going to get them out.&rdquo;</div>
  <div class="paper-trail"><span class="pt-label">Paper trail:</span> CBP barrier status reports; DHS appropriations; DOD reprogramming notices; CBP drug seizure statistics (port vs between-port); GAO border reports; government shutdown timeline (Dec 22 2018 - Jan 25 2019).</div>
</div>

<h3>The Other Immigration Promises</h3>

<div class="entry">
  <h4 class="entry-title">Deport All 11 Million Undocumented Immigrants ${badge("BROKEN")}</h4>
  <p>&ldquo;They have to go.&rdquo; ICE removals actually decreased: 226,000 in FY2017 vs. 186,000 in FY2020. Interior arrests increased but total deportations fell compared to Obama&rsquo;s peak years. The &ldquo;deportation force&rdquo; never materialized at scale.</p>
</div>

<div class="entry">
  <h4 class="entry-title">End Birthright Citizenship ${badge("BROKEN")}</h4>
  <p>Said he&rsquo;d end it &ldquo;with an executive order.&rdquo; Constitutional scholars from both parties said this requires a constitutional amendment (14th Amendment). No EO was ever drafted. The promise was constitutionally impossible without amending the Constitution.</p>
</div>

<div class="entry">
  <h4 class="entry-title">End Catch and Release ${badge("PARTIAL")}</h4>
  <p>Migrant Protection Protocols (MPP, &ldquo;Remain in Mexico,&rdquo; Jan 2019) forced asylum seekers to wait in Mexico. Reduced interior releases significantly. But: legal challenges, court orders, and COVID releases continued forms of catch-and-release throughout the term.</p>
</div>

<div class="entry">
  <h4 class="entry-title">Defund Sanctuary Cities ${badge("PARTIAL")}</h4>
  <p>EO 13768 (Jan 25, 2017) threatened to withhold federal funds from sanctuary jurisdictions. Multiple courts blocked enforcement. DOJ tied some grant funding to immigration cooperation. But no sanctuary city lost significant federal funding.</p>
</div>

<div class="entry">
  <h4 class="entry-title">Travel Ban from Terror-Prone Countries ${badge("KEPT")}</h4>
  <p>Three versions. Third upheld by Supreme Court 5-4. Restricted travel from 13 countries at peak. Implemented and enforced for the remainder of the term. The most significant immigration executive action since the 1980s.</p>
</div>

<div class="entry">
  <h4 class="entry-title">End DACA ${badge("PARTIAL")}</h4>
  <p>Rescission announced Sept 2017. Supreme Court blocked it (Dept of Homeland Security v. Regents, June 2020) as &ldquo;arbitrary and capricious&rdquo; &mdash; not because DACA couldn&rsquo;t be ended, but because the process was sloppy. DACA survived the full term. 643,000 recipients retained status.</p>
</div>

<div class="entry">
  <h4 class="entry-title">Merit-Based Immigration System ${badge("PARTIAL")}</h4>
  <p>RAISE Act proposed (Aug 2017) to shift from family-based to merit-based immigration. Never passed Congress. H-1B reforms tightened requirements administratively. The philosophical shift happened in rhetoric; the statutory system didn&rsquo;t change.</p>
</div>

<div class="entry">
  <h4 class="entry-title">Remain in Mexico Policy ${badge("KEPT")}</h4>
  <p>MPP (Jan 2019) required 71,000+ asylum seekers to wait in Mexican border cities. Reduced US interior releases. Human rights organizations documented dangerous conditions. Policy was implemented and operated until Biden terminated it. Courts later ordered reinstatement. Functionally kept during the term.</p>
</div>

<div class="entry">
  <h4 class="entry-title">Deport MS-13 / Gang Members ${badge("KEPT")}</h4>
  <p>MS-13 specifically targeted by DOJ and ICE. Operation Raging Bull and similar operations arrested thousands. MS-13 members were deported in significant numbers. Gang-specific enforcement was real and measurable.</p>
</div>

<div class="entry">
  <h4 class="entry-title">End Visa Lottery ${badge("BROKEN")}</h4>
  <p>Called it &ldquo;a disaster&rdquo; after the NYC truck attack (Oct 2017). No legislation passed to eliminate it. The Diversity Visa Lottery continues to operate, issuing 55,000 visas annually. Congress never voted on elimination.</p>
</div>

<div class="chapter-sources">
<p class="sources-header">Chapter 8 Sources</p>
<ol>
  <li>U.S. Customs and Border Protection, &ldquo;Border Wall Construction Status,&rdquo; weekly reports, 2018&ndash;2021. Final tally ~458 miles built (mostly replacement of existing barrier). <em>cbp.gov/border-security/along-us-borders</em>.</li>
  <li>Department of Defense funding transfer letters under 10 U.S.C. §284 and §2808, FY2019&ndash;FY2020 (~$6.1B for border wall construction). House Armed Services Committee oversight documents. <em>defense.gov / armedservices.house.gov</em>.</li>
  <li>HHS Office of Inspector General Report OEI-BL-18-00510, &ldquo;Separated Children Placed in Office of Refugee Resettlement Care,&rdquo; January 2019; Department of Justice &ldquo;Zero Tolerance&rdquo; memo, April 6, 2018; Executive Order 13841, June 20, 2018.</li>
  <li>Migrant Protection Protocols (&ldquo;Remain in Mexico&rdquo;) launch announcement, Department of Homeland Security, January 25, 2019. <em>dhs.gov</em>.</li>
  <li><em>Trump v. Hawaii</em>, 585 U.S. ___ (2018); Presidential Proclamation 9645 (Sept 24, 2017). <em>supremecourt.gov</em>.</li>
  <li><em>Department of Homeland Security v. Regents of the University of California</em>, 591 U.S. ___ (2020) &mdash; DACA rescission held arbitrary and capricious. <em>supremecourt.gov</em>.</li>
</ol>
</div>
`
}

function ch9_laworder() {
  return `<div class="chapter-start">
  <span class="ch-num">Chapter Nine</span>
  <h1 class="ch-title">Law &amp; Order ${badge("READER")}</h1>
  <p class="ch-sub">&ldquo;Make Our Country Safe&rdquo; &mdash; Crime fell. Then it rose. The data is complicated.</p>
</div>

${illus('laworder','Crime fell. Then it didn&rsquo;t. You decide.')}

<div class="hook"><span class="hook-label">Why This Matters to You</span>
The argument was simple: cities with strict gun laws have terrible gun violence. Chicago was the poster child. The solution: better enforcement, not more laws. Did it work? Crime fell from 2017-2019. Then it exploded in 2020. Was that policy? A trend? COVID? This is the chapter where we genuinely don&rsquo;t pretend to have the answer.</div>

<div class="punch">The Bottom Line: National violent crime fell 2017-2019 (continuing a decades-long trend). Chicago homicides dropped from 762 to 492. Then 2020 happened &mdash; crime spiked nationwide regardless of local policy. Correlation is not causation. We give you the data. You decide. ${badge("READER")}</div>

<h3>The Deep Dive</h3>

<p>The 2016 pitch: Chicago has the toughest gun laws and the worst gun violence. Proof that the problem is enforcement, not legislation. Elect me, I&rsquo;ll fix it through law and order.</p>

<p>The data is genuinely complicated:</p>

<p><strong>2016:</strong> Chicago homicides hit 762 &mdash; a 20-year high. National narrative: America is dangerous and getting worse.</p>
<p><strong>2017:</strong> 650. Down 15%.</p>
<p><strong>2018:</strong> 561. Down 14% more.</p>
<p><strong>2019:</strong> 492. Lowest since 2015. National violent crime also at multi-decade lows.</p>
<p><strong>2020:</strong> 769. Higher than 2016. National murder rate up 30%.</p>

<div class="aha"><span class="aha-label">A-ha Moment</span>
If you credit the president for the 2017-2019 decline, you must also credit (or blame) him for the 2020 spike. You can&rsquo;t take credit for one direction and blame external factors for the other. Either presidential policy drives crime numbers or it doesn&rsquo;t. Pick one and be consistent.</div>

<p>The deeper problem with the Chicago argument: ATF trace data shows that most guns used in Chicago crimes come from <strong>outside Illinois</strong> &mdash; from states with weaker gun laws (Indiana, Mississippi, Wisconsin). City-level gun policy operates in a national market. The &ldquo;strictest laws, worst violence&rdquo; paradox has a simple explanation: guns flow from loose states to strict cities.</p>

<h3>The Supreme Court: A Generation Reshaped</h3>

<p>Three justices in four years. That&rsquo;s more than any president since Reagan. And unlike Reagan&rsquo;s picks (Sandra Day O&rsquo;Connor drifted centrist, Anthony Kennedy became the swing vote), these three held firm.</p>

<p><strong>Neil Gorsuch (April 2017):</strong> Replaced Scalia (who died Feb 2016). This seat was held open for 14 months by Senate Majority Leader Mitch McConnell, who refused to give Obama&rsquo;s nominee Merrick Garland a hearing. The argument: &ldquo;let the voters decide in an election year.&rdquo; It was the most consequential act of legislative obstruction in modern Supreme Court history. Gorsuch was confirmed using the &ldquo;nuclear option&rdquo; &mdash; eliminating the filibuster for SCOTUS nominees.</p>

<p><strong>Brett Kavanaugh (October 2018):</strong> Replaced Anthony Kennedy (the swing vote). Christine Blasey Ford testified before the Senate Judiciary Committee that Kavanaugh had sexually assaulted her in high school. Kavanaugh denied it emotionally. The FBI investigation was limited to one week. He was confirmed 50-48 &mdash; the narrowest SCOTUS confirmation in over a century. Kennedy&rsquo;s retirement removed the Court&rsquo;s center. Kavanaugh moved it right.</p>

<p><strong>Amy Coney Barrett (October 2020):</strong> Replaced Ruth Bader Ginsburg (who died Sept 18, 2020 &mdash; 46 days before the election). Barrett was confirmed 8 days before Election Day. Same Senate. Same majority leader. Same election year. Opposite rules. McConnell&rsquo;s 2016 rule (&ldquo;the voters should decide&rdquo;) became 2020&rsquo;s &ldquo;different circumstances.&rdquo; The Court shifted to 6&ndash;3 conservative.</p>

<p>The result: <em>Dobbs v. Jackson</em> (June 2022) overturned Roe v. Wade. <em>New York State Rifle v. Bruen</em> expanded gun rights. <em>West Virginia v. EPA</em> limited regulatory agency power. <em>Students for Fair Admissions</em> ended affirmative action. All 6-3 or 5-4 with all three Trump appointees in the majority.</p>

<p>This is arguably the most consequential domestic achievement of the entire term &mdash; not a wall, not a tax cut, not a trade war. Three lifetime appointments that will shape American law for 30+ years. And it happened partly through structural hardball (the Garland block) that had nothing to do with the president himself.</p>

<h3>Portland 2020: Federal Agents in the Streets</h3>

<p>Summer 2020. George Floyd was killed on May 25. Protests erupted in every major US city. Most were peaceful. Some were not. Portland, Oregon became the flashpoint.</p>

<p>In July 2020, federal agents from DHS &mdash; many wearing camouflage with no visible identification &mdash; were deployed to Portland over the objections of the mayor and governor. Videos showed agents pulling protesters into unmarked vans. Tear gas was deployed nightly. The federal courthouse became a fortress.</p>

<p>The administration called it restoring order. The ACLU called it unconstitutional. Oregon&rsquo;s attorney general sued. A federal judge issued a restraining order against federal agents targeting journalists and legal observers. The deployments expanded to other cities under &ldquo;Operation Legend&rdquo; (named after a 4-year-old killed in Kansas City).</p>

<p>The question this raises is the same one Americans have debated since 1787: where does federal authority end and local authority begin? A mayor says &ldquo;leave.&rdquo; A president says &ldquo;I&rsquo;m protecting federal property.&rdquo; Who wins? The Constitution doesn&rsquo;t give a clean answer. The images of federal agents in American streets, in unmarked vehicles, in an American city that didn&rsquo;t want them there &mdash; those images mean different things to different Americans. That&rsquo;s why this chapter is purple.</p>

<div class="tea">
<p class="tea-header">THE DEEP TEA</p>
<p>&bull; After the Parkland shooting (Feb 2018), Trump said he favored &ldquo;taking the guns first, due process second.&rdquo; The NRA intervened privately. Within weeks, the idea was dropped. The only federal action: a bump stock ban (later overturned by the Supreme Court in 2024).</p>
<p>&bull; The 2020 crime spike correlated with three simultaneous crises: COVID lockdowns, economic collapse, and the George Floyd protests. Every major city saw it &mdash; red mayors, blue mayors, no mayors.</p>
<p>&bull; Federal law enforcement was deployed to Portland (Operation Legend, 2020) over the objections of local officials. Agents in unmarked vehicles detained protesters. Whether this was &ldquo;law and order&rdquo; or federal overreach depends entirely on your politics.</p>
</div>

<div class="conclusion">
<p class="conclusion-header">CONCLUSION</p>
<p>We&rsquo;re giving this chapter a purple badge &mdash; YOU DECIDE &mdash; because we genuinely can&rsquo;t give a clean verdict. Crime fell during the term (continuing a prior trend). Crime spiked in 2020 (as it did everywhere, regardless of who was mayor or president). The &ldquo;strict laws cause violence&rdquo; premise is contradicted by ATF trace data. But the crime reduction 2017-2019 is real. Was it policy? Trend? Economic conditions? We show you the data. You pick.</p>
</div>

<h3>The Receipts</h3>

<div class="entry">
  <h4 class="entry-title">Receipt 1 &mdash; Chicago Gun Laws vs. Violence</h4>
  <div class="rail">Oct 19, 2016 &bull; Las Vegas &bull; Third debate</div>
  <div class="verbatim">&ldquo;In Chicago, which has the toughest gun laws in the United States, probably you could say by far, they have more gun violence than any other city.&rdquo;</div>
  <div class="paper-trail"><span class="pt-label">Paper trail:</span> FBI Uniform Crime Reports; Chicago PD annual stats; ATF firearms trace data (source states); DOJ Project Safe Neighborhoods releases.</div>
</div>

<h3>The Other Law, Order &amp; Culture Promises</h3>

<div class="entry">
  <h4 class="entry-title">Appoint Conservative Supreme Court Justices ${badge("KEPT")}</h4>
  <p>Three appointments: Neil Gorsuch (2017), Brett Kavanaugh (2018), Amy Coney Barrett (2020). Shifted the Court to a 6-3 conservative majority. The most consequential judicial reshaping since FDR. Roe v. Wade was overturned in 2022 as a direct result. Promise kept with generational impact.</p>
</div>

<div class="entry">
  <h4 class="entry-title">Appoint Pro-Life Justices / Overturn Roe ${badge("KEPT")}</h4>
  <p>&ldquo;I&rsquo;m putting pro-life justices on the court.&rdquo; Dobbs v. Jackson (June 2022) overturned Roe. All three Trump appointees voted with the majority. The 50-year precedent fell. Whether you celebrate it or mourn it: he said he&rsquo;d put justices on the Court who would overturn Roe. They did.</p>
</div>

<div class="entry">
  <h4 class="entry-title">Protect the Second Amendment ${badge("KEPT")}</h4>
  <p>No gun control legislation signed. Bump stock ban (2018, later overturned by SCOTUS 2024) was the only restriction. NRA was treated as a governing partner. &ldquo;The eight-year assault on your Second Amendment freedoms has come to a crashing end.&rdquo; It did.</p>
</div>

<div class="entry">
  <h4 class="entry-title">Support Police / End &ldquo;War on Cops&rdquo; ${badge("KEPT")}</h4>
  <p>EO 13929 (June 2020, post-George Floyd) created incentives for police reforms (de-escalation, banning chokeholds for federal law enforcement). But the broader posture was consistently pro-police: restored DOD surplus equipment transfers to police (reversed Obama-era restrictions), opposed &ldquo;defund&rdquo; rhetoric. Police unions endorsed enthusiastically in 2020.</p>
</div>

<div class="entry">
  <h4 class="entry-title">Stop the Opioid Epidemic ${badge("PARTIAL")}</h4>
  <p>Declared a public health emergency (Oct 2017). Signed SUPPORT Act (Oct 2018) expanding treatment access. Opioid overdose deaths: 42,000 (2016), 50,000 (2019), 69,000 (2020). The crisis worsened every year. Fentanyl replaced heroin as the primary killer. The effort was real; the epidemic outran it.</p>
</div>

<div class="entry">
  <h4 class="entry-title">Fix the Inner Cities ${badge("BROKEN")}</h4>
  <p>&ldquo;What do you have to lose?&rdquo; Opportunity Zones (TCJA, 2017) incentivized investment in low-income areas. Evidence is mixed &mdash; much of the investment went to zones that were already gentrifying. No comprehensive urban renewal plan was ever produced.</p>
</div>

<div class="entry">
  <h4 class="entry-title">Protect Religious Liberty ${badge("KEPT")}</h4>
  <p>EO 13798 (May 2017) eased enforcement of the Johnson Amendment. Created a Conscience and Religious Freedom Division at HHS. Supported the Masterpiece Cakeshop case at SCOTUS. Religious liberty was a consistent priority backed by executive action.</p>
</div>

<div class="entry">
  <h4 class="entry-title">National Concealed Carry Reciprocity ${badge("BROKEN")}</h4>
  <p>Passed the House (Dec 2017) but died in the Senate. Never became law despite unified Republican control. The NRA&rsquo;s top legislative priority &mdash; unfulfilled even with a friendly White House and Congress. State-by-state concealed carry persists.</p>
</div>

<div class="entry">
  <h4 class="entry-title">Withdraw from Paris Climate Agreement ${badge("KEPT")}</h4>
  <p>Announced withdrawal June 1, 2017. Effective November 4, 2020. The US became the only nation to leave the Paris Agreement. Biden rejoined on Day 1. The withdrawal was executed; it lasted ~3 years.</p>
</div>

<div class="entry">
  <h4 class="entry-title">Approve Keystone XL Pipeline ${badge("KEPT")}</h4>
  <p>EO signed Jan 24, 2017 (Day 5). Reversed Obama&rsquo;s rejection. TC Energy began construction. Biden cancelled it again on Day 1. The approval was real; the pipeline was never completed due to political whiplash.</p>
</div>

<div class="entry">
  <h4 class="entry-title">Achieve Energy Independence ${badge("KEPT")}</h4>
  <p>The US became a net total energy exporter in 2019 for the first time since the 1950s. Crude oil production hit record highs (12.9M barrels/day, Nov 2019). This was partly due to the fracking revolution that began under Obama, but production records were set during this term.</p>
</div>

<div class="entry">
  <h4 class="entry-title">&ldquo;Win So Much You&rsquo;ll Get Tired of Winning&rdquo; ${badge("READER")}</h4>
  <p>Are you tired yet? The answer depends entirely on what you think winning means. This book gives you 145 data points to help you decide.</p>
</div>

<div class="chapter-sources">
<p class="sources-header">Chapter 9 Sources</p>
<ol>
  <li>FBI, &ldquo;Crime in the United States&rdquo; (UCR Program) annual reports for 2016, 2017, 2018, 2019, 2020. Specific tables: Table 1 (Volume and Rate, 1996&ndash;2017) and Table 1A (2020). <em>ucr.fbi.gov / cde.ucr.cjis.gov</em>.</li>
  <li>Federal Bureau of Investigation, &ldquo;Murder and Nonnegligent Manslaughter,&rdquo; UCR Crime in the United States 2020, Table 1 &mdash; documents the 2020 single-year homicide spike (+29.4% YoY). <em>fbi.gov/services/cjis/ucr</em>.</li>
  <li>Bureau of Justice Statistics, &ldquo;Criminal Victimization, 2020&rdquo; (NCJ 301775) and &ldquo;Criminal Victimization, 2019&rdquo; (NCJ 255113). <em>bjs.ojp.gov</em>.</li>
  <li>First Step Act of 2018 (Pub. L. 115-391, S.756), signed December 21, 2018. Department of Justice, &ldquo;First Step Act Annual Report&rdquo; (April 2021). <em>justice.gov/dag/page/file/1397386/download</em>.</li>
  <li>Executive Order 13929, &ldquo;Safe Policing for Safe Communities,&rdquo; signed June 16, 2020. Federal Register Vol. 85, No. 119. <em>federalregister.gov/d/2020-13449</em>.</li>
  <li>Dobbs v. Jackson Women&rsquo;s Health Organization, 597 U.S. ___ (2022) &mdash; Supreme Court syllabus and majority opinion. <em>supremecourt.gov/opinions/21pdf/19-1392_6j37.pdf</em>.</li>
  <li>U.S. Senate roll-call votes: Gorsuch confirmation (Apr 7, 2017, 54&ndash;45); Kavanaugh (Oct 6, 2018, 50&ndash;48); Barrett (Oct 26, 2020, 52&ndash;48). <em>senate.gov/legislative/votes</em>.</li>
  <li>Bureau of Alcohol, Tobacco, Firearms and Explosives, &ldquo;Firearms Trace Data&rdquo; annual reports, 2016&ndash;2020. <em>atf.gov/resource-center/firearms-trace-data</em>.</li>
</ol>
</div>
`
}

// Chapter 10 — 2024 platform preservation. Reads commitments from JSON at module load.
import { readFileSync as __readFileSync10 } from "node:fs"
const CH10_DATA = JSON.parse(__readFileSync10(path.join(ROOT, "artifacts", "sealed-ch10-2024-commitments.json"), "utf8"))

function ch10_escape(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

function ch10_2024platform() {
  // Group by category
  const byCat = {}
  for (const c of CH10_DATA.commitments) {
    if (!byCat[c.category]) byCat[c.category] = []
    byCat[c.category].push(c)
  }
  // Sort categories with a curated order
  const order = [
    "Immigration", "Immigration/Campus", "Immigration/Welfare",
    "Trade", "Trade/Taxes", "Economy", "Economy/Trade", "Economy/Taxes", "Economy/Auto",
    "Energy", "Energy/Regulation", "Energy/Climate",
    "Healthcare", "Healthcare/Entitlements", "Healthcare/Trade",
    "Education", "Education/Culture",
    "Public Safety", "Public Safety/Cartels", "Justice",
    "National Security",
    "Rights & Liberties",
    "Government Reform", "Government Reform/DEI",
    "Veterans", "Elections", "Culture", "General",
  ]
  const cats = Object.keys(byCat).sort((a, b) => {
    const ia = order.indexOf(a), ib = order.indexOf(b)
    return (ia < 0 ? 999 : ia) - (ib < 0 ? 999 : ib)
  })

  // Distribution stats
  const dist = { PENDING: 0, KEPT: 0, IN_PROGRESS: 0, BROKEN: 0 }
  for (const c of CH10_DATA.commitments) dist[c.outcome_status] = (dist[c.outcome_status] || 0) + 1

  const total = CH10_DATA.commitments.length

  let entries = ""
  for (const cat of cats) {
    entries += `<h3>${ch10_escape(cat)}</h3>\n`
    for (const c of byCat[cat]) {
      const b = badge(c.outcome_status)
      const captureStr = c.captured_date || "n/a"
      const deletedStr = c.deleted_after ? c.deleted_after : "still live"
      entries += `<div class="entry">
  <h4 class="entry-title">${ch10_escape(c.id.replace(/-/g, " ").replace(/^\w/, m => m.toUpperCase()))} ${b}</h4>
  <div class="verbatim">&ldquo;${ch10_escape(c.verbatim_quote)}&rdquo;</div>
  <div class="paper-trail"><span class="pt-label">Source:</span> ${ch10_escape(c.source_section)} &mdash; <em>${ch10_escape(c.source_page)}</em>. Wayback capture ${ch10_escape(captureStr)}; live page removed by ${ch10_escape(deletedStr)}. <br/><span style="font-family:'Courier New',Courier,monospace;font-size:7.5pt;color:#666;">${ch10_escape(c.source_url)}</span></div>
  ${c.outcome_notes && c.outcome_status !== "PENDING" ? `<p style="font-size:9.5pt;color:#37474f;margin:0.06in 0 0;"><strong>Action since Jan 20, 2025:</strong> ${ch10_escape(c.outcome_notes)}</p>` : ""}
</div>\n`
    }
  }

  // Sources block — unique URLs
  const urls = Array.from(new Set(CH10_DATA.commitments.map(c => c.source_url))).sort()
  const sourcesLis = urls
    .map(u => `<li><em>${ch10_escape(u)}</em></li>`)
    .join("\n")

  return `<div class="chapter-start">
  <span class="ch-num">Chapter Ten</span>
  <h1 class="ch-title">What was promised in 2024 ${badge("PENDING")}</h1>
  <p class="ch-sub">The receipts the campaign tried to disappear.</p>
</div>

<div class="hook"><span class="hook-label">Why This Matters to You</span>
The first nine chapters of this book are about the 2016 campaign. They have nine years of receipts. Chapter 10 is different. In 2024, donaldjtrump.com published an Issues section, an Agenda47 page, and the 2024 Republican Platform PDF. Together they contained hundreds of specific commitments &mdash; the merit-based immigration system, the Iron Dome over America, the 4-year reshoring plan, the death penalty for human traffickers, the end of birthright citizenship by executive order on Day One. In early 2025, the live pages went away. The domain still works. It now serves a donation page. Type the same URL today, you get a checkout form.</div>

<div class="punch">The Bottom Line: ${total} verbatim commitments from the 2024 cycle, captured by the Internet Archive before donaldjtrump.com removed its policy pages. We grade the obvious ones with primary-source citations (Federal Register, white house.gov). The rest are marked OUTCOMES PENDING &mdash; the term is in motion. Real-time grading lives at campaignreceipts.com/trump.</div>

<h3>What Was On The Live Site</h3>

<p>Between 2023 and early 2025, donaldjtrump.com hosted three interlocking pages of policy commitments:</p>

<p><strong>The Platform page.</strong> Twenty numbered &ldquo;Core Promises&rdquo; in plain language. Seal the border. Largest deportation in American history. End inflation. Cancel the EV mandate. Keep men out of women&rsquo;s sports. The list was direct and short enough to fit on a single web page.</p>

<p><strong>The Issues pages.</strong> Sixteen subject-area roadmaps &mdash; trade, immigration, energy, education, veterans, public safety, foreign policy, parents&rsquo; rights. Each one followed the same template: what President Trump did the first time, what Biden broke, what President Trump will do next time. The Issues pages contained the specific mechanics &mdash; the 4-year reshoring plan, the Foreign Terrorist Organization designation for cartels, the National Guard deputization in cooperative states, the cuts to federal funding for any school pushing CRT.</p>

<p><strong>Agenda47.</strong> A series of video statements, each with a printed summary. Birthright citizenship by EO on Day One. The American Academy funded by university endowments. The Reciprocal Trade Act. Impoundment to crush the deep state. Death penalty for human traffickers. Reinstate every patriot unjustly fired from the military.</p>

<p>The 2024 Republican National Convention adopted a formal Platform on July 15, 2024. That PDF is still publicly hosted on GOP.com. The campaign&rsquo;s own policy pages are not. Sometime in early 2025 &mdash; the exact date per page is not publicly logged &mdash; the live donaldjtrump.com Issues, Agenda47, and Platform pages were removed. Today the domain redirects all policy URLs to a donate page. This chapter reproduces what those pages said, verbatim, captured by the Internet Archive before they went away.</p>

<h3>How To Read This Chapter</h3>

<p>Each commitment below is a direct quote from a preserved snapshot. The source line records (1) which page it came from, (2) the date the Internet Archive captured it, and (3) when the live page went dark. Where a Day-One or first-100-days executive order has already moved a commitment forward, we mark it ${badge("KEPT")} or ${badge("IN_PROGRESS")} and cite the Federal Register or whitehouse.gov directly. Where the commitment is broad, aspirational, or unverifiable in the first six months of a four-year term, we mark it ${badge("PENDING")} and stop. This is not a scorecard. It is a preservation.</p>

${entries}

<h3>Methodology</h3>

<p>This chapter does not grade outcomes for the second term. The term began January 20, 2025. The book you are holding went to print before the first quarter ended. Grading a four-year term in its first six months would be the exact kind of dishonesty this book was written to fight.</p>

<p>What this chapter <em>does</em> grade: the handful of commitments that were already moved by a signed executive order with a Federal Register citation. For those, we mark ${badge("KEPT")} or ${badge("IN_PROGRESS")} and link directly to the source &mdash; the order number, the date of signing, the URL. For everything else, ${badge("PENDING")} means exactly that: the receipt is preserved, the verdict is not yet earned. If you want the running tally, go to <strong>campaignreceipts.com/trump</strong>. That site is updated daily. This book is updated by the next edition.</p>

<p>One thing is not pending. The choice to remove the live pages from donaldjtrump.com after the election &mdash; while the RNC platform PDF stayed up on GOP.com &mdash; that already happened. The Internet Archive saw it. Now you have it on paper. What you do with that is up to you.</p>

<div class="chapter-sources">
<p class="sources-header">Chapter 10 Sources</p>
<ol>
  <li>Internet Archive Wayback Machine captures of donaldjtrump.com / Issues / Agenda47 / Platform pages, 2023&ndash;2026. <em>web.archive.org</em>.</li>
  <li>2024 Republican Party Platform, adopted at the Republican National Convention, Milwaukee WI, July 15, 2024. PDF. <em>prod-static.gop.com/media/RNC2024-Platform.pdf</em>.</li>
  <li>Preserved copies of all 19 donaldjtrump.com snapshots are mirrored at <em>campaignreceipts.com/sources/</em> for independent verification.</li>
  <li>White House &mdash; Presidential Actions, January&ndash;April 2025. <em>whitehouse.gov/presidential-actions/</em>.</li>
  <li>Federal Register, Executive Orders signed January&ndash;April 2025. <em>federalregister.gov</em>.</li>
${sourcesLis}
</ol>
</div>
`
}

function epilogue() {
  return `<div class="chapter-start">
  <span class="ch-num">Epilogue</span>
  <h1 class="ch-title">What the Numbers Say</h1>
  <p class="ch-sub">145 promises. One final accounting.</p>
</div>

<h3>The Final Tally</h3>

<p>You&rsquo;ve now read through nine chapters of detailed analysis covering the major themes of the 2016 campaign, plus Chapter 10&rsquo;s preservation of the 2024 commitments before donaldjtrump.com took the policy pages down. The scorecard that follows gives you all 145 promises from the 2016 cycle with color-coded verdicts &mdash; that 46/51/40/8 split applies to the first term only. The 2024 commitments are preserved but not graded; the second term is still in motion. Real-time grading lives at campaignreceipts.com/trump. Here&rsquo;s what the numbers look like when you step back:</p>

<p><strong>KEPT: 46 promises (31.7%)</strong> &mdash; These are promises where the action taken substantially matched the commitment made. Trade deals torn up. Justices appointed. Embassy moved. Tariffs imposed. Keystone XL approved. Paris Agreement withdrawal.</p>

<p><strong>PARTIAL: 51 promises (35.2%)</strong> &mdash; Real action was taken but the outcome fell short of the specific commitment. The wall was partially built. Regulations were cut but not 2-for-1 in every case. China was confronted but the Phase One deal targets weren&rsquo;t met. ISIS was destroyed but not through Russia cooperation.</p>

<p><strong>BROKEN: 40 promises (27.6%)</strong> &mdash; No meaningful action was taken, or the action directly contradicted the promise. Healthcare was never replaced. The deficit exploded (from $585B to $3.1T with COVID). Lobbyists thrived. The ethics pledge was revoked on Day 1,461. Term limits never introduced.</p>

<p><strong>YOU DECIDE: 8 promises (5.5%)</strong> &mdash; Genuinely ambiguous. Crime fell then spiked. Economic growth was solid but inherited a trend. Infrastructure week was always next week. We show you the data; we can&rsquo;t give you a clean verdict.</p>

<h3>What These Numbers Mean</h3>

<p>A 31.7% fully-kept rate &mdash; with another 35.2% partially kept &mdash; sits squarely inside what research on campaign promises across democracies treats as ordinary. Political scientists who study this (PolitiFact&rsquo;s Obameter, the Washington Post&rsquo;s Promise Tracker, academic studies of parliamentary systems) find that most democratic leaders keep 30&ndash;40% of promises fully, partially keep another 30&ndash;40%, and break 20&ndash;30%. He kept promises at the rate of a normal politician &mdash; the one job he swore he wasn&rsquo;t.</p>

<p>The difference isn&rsquo;t the numbers. It&rsquo;s the volume. Most candidates make careful, tested promises that are achievable within the political system. The 2016 campaign was different: it made promises so large, so numerous, and so emotionally charged that the gap between promise and reality was felt more acutely. &ldquo;Build the wall&rdquo; is harder to half-deliver than &ldquo;invest in border security.&rdquo;</p>

<h3>The Promises That Mattered Most</h3>

<p>Not all promises are equal. Some affected millions of lives. Some were campaign rhetoric that nobody expected to be literal. Here are the five that had the most concrete impact on Americans:</p>

<p><strong>1. Tax Cuts and Jobs Act (KEPT):</strong> Every taxpayer felt this. Corporate rate cut permanently. Individual rates cut temporarily (expiring 2025). Whether you think it helped or hurt depends on your bracket and your opinion on deficits.</p>

<p><strong>2. Three Supreme Court Justices (KEPT):</strong> Roe overturned. Affirmative action ended. Gun rights expanded. Regulatory power limited. These decisions will shape American life for 30+ years. This is the most consequential delivery of any campaign promise.</p>

<p><strong>3. Healthcare Repeal &amp; Replace (BROKEN):</strong> The biggest single failure. Millions of voters chose this candidate specifically for this promise. The ACA still stands. Premiums are still high. The replacement never came.</p>

<p><strong>4. The Wall (PARTIAL):</strong> 23% of the border, 0% paid by Mexico, and doesn&rsquo;t address fentanyl at ports. The most famous promise was the most partially delivered.</p>

<p><strong>5. China Trade War (KEPT):</strong> The most bipartisan outcome. Both parties now agree on China confrontation. Biden kept the tariffs. This promise changed the structural relationship between the world&rsquo;s two largest economies.</p>

<h3>What Didn&rsquo;t Get Promised</h3>

<p>Some of the most consequential events of the term were never promised on the campaign trail:</p>

<p>&bull; A global pandemic that killed over a million Americans</p>
<p>&bull; Two impeachments</p>
<p>&bull; The longest government shutdown in history</p>
<p>&bull; Family separation at the border (Zero Tolerance was never a campaign promise)</p>
<p>&bull; The January 6 Capitol breach</p>
<p>&bull; 143 pardons on the final day</p>

<p>History doesn&rsquo;t care about campaign promises. It happens regardless. The promises tell you what a candidate intended. The reality tells you what the world allowed. This book covers both.</p>

<h3>One Last Thing</h3>

<p>This book has a blank column in the scorecard chapter. It&rsquo;s there on purpose. Our verdicts are based on public records through May 2026. Yours are based on your life, your values, and your priorities. If you think we got one wrong &mdash; write in your grade. This book is a tool, not a sermon.</p>

<p>The 2016 campaign changed American politics permanently. Whether it changed it for better or worse is the question we deliberately refuse to answer. That one&rsquo;s yours.</p>

<h3>A Note on the Second Term</h3>

<p>This book covers the first term only (January 20, 2017 &ndash; January 20, 2021). The second term, which began January 20, 2025, is a different story with different promises, different constraints, and different results. We chose to end here because the first-term record is now complete and verifiable. The second-term record is still being written.</p>

<p>Some first-term promises that were broken or partial are being attempted again in the second term. Some kept promises are being extended further. Some new promises have been introduced that didn&rsquo;t exist in 2016. A future volume may address the second term with the same methodology. But this book is about 2016 promises and 2017-2021 delivery &mdash; a closed chapter with a complete paper trail.</p>

<p>Why does the first term matter when the second is underway? Because the pattern of what was kept and broken tells you something predictive. Executive-action promises: likely to be kept. Legislative promises: unlikely without supermajorities. Promises requiring cooperation from foreign governments (Mexico pays for the wall): impossible. The structural constraints of American governance haven&rsquo;t changed. The 2016 record is the best predictor available for what the 2024 promises will produce.</p>

<h3>The Pattern</h3>

<p>After spending two years immersed in these records, one pattern emerges clearly: the promises that were kept shared a common trait &mdash; they could be done unilaterally, through executive action, without requiring Congress.</p>

<p>Tariffs? Executive authority (Section 301, Section 232). Embassy move? Executive decision. Iran deal withdrawal? Executive action. Paris Agreement? Executive withdrawal. Travel ban? Executive order. Justices? Required Senate but not House, and only a simple majority after the nuclear option.</p>

<p>Promises that required legislation &mdash; healthcare replacement, infrastructure, immigration reform, term limits, the full wall funding &mdash; failed almost without exception. Even with unified Republican government (2017-2019), Congress could not pass the marquee campaign promises into law.</p>

<p>This suggests something important about American governance: the presidency is powerful when it acts alone, and nearly powerless when it needs Congress. The campaign trail doesn&rsquo;t distinguish between these two categories. Voters don&rsquo;t ask &ldquo;does this require legislation?&rdquo; They hear a promise and assume it will happen if the right person wins.</p>

<p>The 2016 campaign made promises in both categories with equal confidence. The executive-action promises were largely kept. The legislative promises were largely broken. If future voters learned to distinguish between &ldquo;the president can do this alone&rdquo; and &ldquo;this requires 60 Senate votes,&rdquo; they would have much more realistic expectations of any candidate from any party.</p>

<h3>To the Reader</h3>

<p>If you&rsquo;ve read this far, you now know more about the 2016 campaign promises and their outcomes than 99% of Americans. Not because you&rsquo;re special &mdash; because the information is scattered across thousands of government websites, news archives, court opinions, and agency databases that nobody has time to read.</p>

<p>This book is a compression function. It takes thousands of pages of public records and compresses them into one color-coded volume. We did the reading so you don&rsquo;t have to. But we included the sources so you can verify everything we say.</p>

<p>Don&rsquo;t trust this book. Trust the sources it points you to. That&rsquo;s the whole idea.</p>

<p style="text-align:right;font-style:italic;margin-top:0.3in;">&mdash; Peter Oliver, May 2026</p>
`
}

function aboutAuthor() {
  return `<div class="chapter-start">
<h2 style="font-size:18pt;text-align:center;font-variant:small-caps;letter-spacing:0.1em;margin-bottom:0.3in;">About the Author</h2>

<p><strong>Peter Oliver</strong> is a former PhD researcher and grant writer for the National Academy of Sciences. He has traveled extensively throughout the world on journalism assignments for both small independent outlets and major publications.</p>

<p>More recently, Oliver has turned his attention to historical archiving&mdash;specifically, the unprecedented rise of a non-politician outsider who, over the course of a decade, transformed into an insider politician. This book is the product of that work: a meticulous, color-coded record of what was promised and what actually happened.</p>

<p>Oliver does not tell you what to think. He shows you the receipts and lets you decide.</p>

<p style="margin-top:0.3in;font-style:italic;color:#555;">Peter Oliver can be reached at <a href="mailto:support@sealed2016.com" style="color:#555;text-decoration:none;">support@sealed2016.com</a>.</p>
</div>`
}

function scorecard() {
  const Y = `<td><span class="yours-blank"></span></td>`
  const r = (n,p,ch,v) => `<tr><td>${n}</td><td>${p}</td><td>${ch}</td><td>${badge(v)}</td>${Y}</tr>`
  return `<div class="chapter-start">
  <span class="ch-num">Chapter Ten</span>
  <h1 class="ch-title">The Full Scorecard</h1>
  <p class="ch-sub">145 promises. Color-coded. Your grades.</p>
</div>

<p>Every identifiable promise from the 2015&ndash;2016 campaign trail, grouped by theme. Our read is based on the public record through 2026. Yours is the one that matters.</p>

<h3>Part I &mdash; Drain the Swamp (Promises 1&ndash;18)</h3>
<table class="score"><thead><tr><th>#</th><th>Promise</th><th>Ch</th><th>Our Read</th><th>Yours</th></tr></thead><tbody>
${r(1,"Defeat the special interests / lobbying control",1,"BROKEN")}
${r(2,"Five-year lobbying ban for executive officials",1,"BROKEN")}
${r(3,"Lifetime ban on lobbying for foreign governments",1,"PARTIAL")}
${r(4,"Ethics reform in first 100 days",1,"PARTIAL")}
${r(5,"Term limits for Congress",1,"BROKEN")}
${r(6,"Hiring freeze on federal employees (except military/safety)",1,"KEPT")}
${r(7,"Eliminate two regulations for every new one",1,"KEPT")}
${r(8,"Ban White House officials from lobbying for 5 years after leaving",1,"BROKEN")}
${r(9,"Cancel billions in payments to UN climate programs",1,"KEPT")}
${r(10,"Constitutional amendment for term limits",1,"BROKEN")}
${r(11,"Clean up corruption in Washington",1,"BROKEN")}
${r(12,"End the revolving door between Wall Street and Washington",1,"BROKEN")}
${r(13,"Self-fund campaign / refuse special interest money",1,"BROKEN")}
${r(14,"Release tax returns",1,"BROKEN")}
${r(15,"Divest from business interests",1,"BROKEN")}
${r(16,"No Goldman Sachs people in government",1,"BROKEN")}
${r(17,"Ban foreign lobbyists raising money for elections",1,"PARTIAL")}
${r(18,"Appoint a special prosecutor for Clinton emails",1,"BROKEN")}
</tbody></table>

<p style="font-size:9.5pt;color:#555;font-style:italic;margin:0.1in 0 0.2in;border-top:0.5pt solid #ddd;padding-top:0.1in;"><strong>Section verdict:</strong> 13 of 18 promises broken. The swamp was renamed, not drained. Lobbying spending set records. The ethics pledge lasted exactly one term. The largest donor in history got everything he wanted on foreign policy.</p>

<h3>Part II &mdash; Trade &amp; Economy (Promises 19&ndash;42)</h3>
<table class="score"><thead><tr><th>#</th><th>Promise</th><th>Ch</th><th>Our Read</th><th>Yours</th></tr></thead><tbody>
${r(19,"Rip up / renegotiate NAFTA",2,"KEPT")}
${r(20,"Kill TPP on Day 1",2,"KEPT")}
${r(21,"Label China a currency manipulator",2,"KEPT")}
${r(22,"45% tariff on Chinese imports",2,"PARTIAL")}
${r(23,"Renegotiate trade deals bilaterally",2,"KEPT")}
${r(24,"Bring back manufacturing jobs",3,"PARTIAL")}
${r(25,"Save Carrier jobs in Indianapolis",3,"PARTIAL")}
${r(26,"Stop Ford from moving to Mexico",3,"PARTIAL")}
${r(27,"Cut corporate tax rate from 35% to 15%",3,"PARTIAL")}
${r(28,"Create 25 million jobs in 10 years",3,"BROKEN")}
${r(29,"4% GDP growth",3,"BROKEN")}
${r(30,"Bring back coal jobs",3,"BROKEN")}
${r(31,"Invest $550 billion in infrastructure",3,"BROKEN")}
${r(32,"Renegotiate the national debt",3,"BROKEN")}
${r(33,"Eliminate the federal debt in 8 years",3,"BROKEN")}
${r(34,"Apple will build in the US",3,"PARTIAL")}
${r(35,"Penalize companies that offshore",3,"PARTIAL")}
${r(36,"Buy American, hire American",3,"KEPT")}
${r(37,"Bring back Christmas / force &ldquo;Merry Christmas&rdquo;",3,"READER")}
${r(38,"Negotiate drug prices down",3,"PARTIAL")}
${r(39,"Stop currency manipulation by trading partners",2,"PARTIAL")}
${r(40,"Impose reciprocal tariffs on all unfair trade partners",2,"KEPT")}
${r(41,"End the trade deficit",2,"BROKEN")}
${r(42,"Renegotiate South Korea trade deal (KORUS)",2,"KEPT")}
</tbody></table>

<p style="font-size:9.5pt;color:#555;font-style:italic;margin:0.1in 0 0.2in;border-top:0.5pt solid #ddd;padding-top:0.1in;"><strong>Section verdict:</strong> Trade was the strongest section &mdash; 8 of 24 kept, another 9 partial. TPP killed on Day 3, NAFTA replaced, China confronted. The actions were real. The trade deficit still grew. Farmers got $28B in bailouts from retaliation. The fight was authentic; whether America won it is the real question.</p>

<h3>Part III &mdash; Healthcare (Promises 43&ndash;55)</h3>
<table class="score"><thead><tr><th>#</th><th>Promise</th><th>Ch</th><th>Our Read</th><th>Yours</th></tr></thead><tbody>
${r(43,"Repeal Obamacare",4,"BROKEN")}
${r(44,"Replace with &ldquo;something much better&rdquo;",4,"BROKEN")}
${r(45,"Lower premiums for everyone",4,"BROKEN")}
${r(46,"Allow insurance sales across state lines",4,"PARTIAL")}
${r(47,"Protect pre-existing conditions",4,"READER")}
${r(48,"Let Medicare negotiate drug prices",4,"BROKEN")}
${r(49,"No cuts to Medicare",4,"READER")}
${r(50,"No cuts to Social Security",4,"KEPT")}
${r(51,"No cuts to Medicaid",4,"BROKEN")}
${r(52,"Take care of veterans&rsquo; healthcare",4,"PARTIAL")}
${r(53,"End the individual mandate",4,"KEPT")}
${r(54,"Veterans Choice Act expansion",4,"KEPT")}
${r(55,"Fix the VA &mdash; fire bad employees",4,"PARTIAL")}
</tbody></table>

<p style="font-size:9.5pt;color:#555;font-style:italic;margin:0.1in 0 0.2in;border-top:0.5pt solid #ddd;padding-top:0.1in;"><strong>Section verdict:</strong> The biggest single broken promise of the campaign. Repeal failed by one vote (McCain). No replacement was ever produced. Individual mandate zeroed. Veterans Choice was a real bipartisan win. Everything else: the ACA stands, premiums didn&rsquo;t meaningfully fall, and the &ldquo;something much better&rdquo; never materialized.</p>

<h3>Part IV &mdash; NATO &amp; Alliances (Promises 56&ndash;68)</h3>
<table class="score"><thead><tr><th>#</th><th>Promise</th><th>Ch</th><th>Our Read</th><th>Yours</th></tr></thead><tbody>
${r(56,"Make NATO allies pay their 2% share",5,"PARTIAL")}
${r(57,"Question whether NATO is obsolete",5,"KEPT")}
${r(58,"Japan / South Korea / Saudi Arabia pay for US protection",5,"PARTIAL")}
${r(59,"Stop nation-building overseas",5,"PARTIAL")}
${r(60,"Rebuild military to historic levels",5,"KEPT")}
${r(61,"Increase military budget",5,"KEPT")}
${r(62,"Take care of veterans (housing, jobs, mental health)",5,"PARTIAL")}
${r(63,"Don&rsquo;t telegraph military moves to the enemy",5,"READER")}
${r(64,"Strengthen nuclear arsenal",5,"KEPT")}
${r(65,"Modernize Navy to 350 ships",5,"PARTIAL")}
${r(66,"Increase Army to 540,000 active troops",5,"PARTIAL")}
${r(67,"Increase Marine Corps battalions",5,"PARTIAL")}
${r(68,"Rebuild Air Force fighter fleet",5,"PARTIAL")}
</tbody></table>

<p style="font-size:9.5pt;color:#555;font-style:italic;margin:0.1in 0 0.2in;border-top:0.5pt solid #ddd;padding-top:0.1in;"><strong>Section verdict:</strong> Military spending went up. Allies spent more (though the trend started before 2016). The questioning of Article 5 alarmed allies but may have accelerated spending. The real test came in 2022 with Russia&rsquo;s Ukraine invasion &mdash; NATO proved more vital than at any point since the Cold War.</p>

<h3>Part V &mdash; Middle East &amp; Foreign Policy (Promises 69&ndash;88)</h3>
<table class="score"><thead><tr><th>#</th><th>Promise</th><th>Ch</th><th>Our Read</th><th>Yours</th></tr></thead><tbody>
${r(69,"Defeat ISIS quickly",6,"KEPT")}
${r(70,"Cooperate with Russia against ISIS",6,"BROKEN")}
${r(71,"Get out of Syria",6,"PARTIAL")}
${r(72,"Don&rsquo;t do regime change",6,"PARTIAL")}
${r(73,"Tear up the Iran nuclear deal",6,"KEPT")}
${r(74,"Move US Embassy to Jerusalem",6,"KEPT")}
${r(75,"Recognize Israeli sovereignty over Golan Heights",6,"KEPT")}
${r(76,"Make Israel&rsquo;s enemies pay consequences",6,"KEPT")}
${r(77,"End the war in Afghanistan",6,"PARTIAL")}
${r(78,"No more endless wars",6,"PARTIAL")}
${r(79,"Take the oil from Iraq",6,"BROKEN")}
${r(80,"Rebuild relationships with Israel",6,"KEPT")}
${r(81,"Extreme vetting for refugees from terror regions",6,"KEPT")}
${r(82,"Ban Muslims from entering the US",6,"PARTIAL")}
${r(83,"North Korea &mdash; solve nuclear threat",6,"BROKEN")}
${r(84,"Meet with Kim Jong-un",6,"KEPT")}
${r(85,"Denuclearize Korean Peninsula",6,"BROKEN")}
${r(86,"Bring troops home from the Middle East",6,"PARTIAL")}
${r(87,"Get allies to pay for US military protection in the Gulf",6,"PARTIAL")}
${r(88,"End the war on terror as we know it",6,"READER")}
</tbody></table>

<p style="font-size:9.5pt;color:#555;font-style:italic;margin:0.1in 0 0.2in;border-top:0.5pt solid #ddd;padding-top:0.1in;"><strong>Section verdict:</strong> ISIS destroyed territorially (real). Iran deal torn up (real). Embassy moved to Jerusalem (real). Abraham Accords (historic). Russia cooperation (never happened). North Korea denuclearized (failed). Afghanistan (deal set up the withdrawal Biden executed). The Middle East section has the most &ldquo;kept&rdquo; verdicts after trade &mdash; but also the deepest consequences still unfolding.</p>

<h3>Part VI &mdash; China (Promises 89&ndash;100)</h3>
<table class="score"><thead><tr><th>#</th><th>Promise</th><th>Ch</th><th>Our Read</th><th>Yours</th></tr></thead><tbody>
${r(89,"Stop China from stealing American jobs",7,"PARTIAL")}
${r(90,"Tariff Chinese goods &mdash; up to 45%",7,"KEPT")}
${r(91,"End China&rsquo;s currency manipulation",7,"PARTIAL")}
${r(92,"Stop intellectual property theft",7,"PARTIAL")}
${r(93,"Bring supply chains back from China",7,"PARTIAL")}
${r(94,"Hold China accountable on trade surplus",7,"KEPT")}
${r(95,"Confront China on South China Sea",7,"PARTIAL")}
${r(96,"Use tariffs as leverage for better deals",7,"KEPT")}
${r(97,"Phase One deal &mdash; China buys $200B US goods",7,"BROKEN")}
${r(98,"Protect American technology from Chinese theft",7,"KEPT")}
${r(99,"Ban Chinese apps (TikTok threat)",7,"PARTIAL")}
${r(100,"Decouple from Chinese manufacturing",7,"PARTIAL")}
</tbody></table>

<p style="font-size:9.5pt;color:#555;font-style:italic;margin:0.1in 0 0.2in;border-top:0.5pt solid #ddd;padding-top:0.1in;"><strong>Section verdict:</strong> The confrontation was real and bipartisan enough that Biden kept the tariffs. Huawei banned. Entity List expanded. But Phase One targets missed, South China Sea islands still there, TikTok still operating. The structural shift in US-China relations is the lasting legacy &mdash; the era of engagement is over.</p>

<h3>Part VII &mdash; The Wall &amp; Immigration (Promises 101&ndash;125)</h3>
<table class="score"><thead><tr><th>#</th><th>Promise</th><th>Ch</th><th>Our Read</th><th>Yours</th></tr></thead><tbody>
${r(101,"Build a wall on the southern border",8,"PARTIAL")}
${r(102,"Mexico will pay for the wall",8,"BROKEN")}
${r(103,"Stop drugs at the border",8,"PARTIAL")}
${r(104,"Deport all 11 million undocumented immigrants",8,"BROKEN")}
${r(105,"Create a deportation force",8,"PARTIAL")}
${r(106,"End birthright citizenship",8,"BROKEN")}
${r(107,"End catch and release",8,"PARTIAL")}
${r(108,"Defund sanctuary cities",8,"PARTIAL")}
${r(109,"Mandatory minimum sentences for deported criminals who return",8,"PARTIAL")}
${r(110,"Triple ICE enforcement agents",8,"PARTIAL")}
${r(111,"E-Verify mandatory for all employers",8,"BROKEN")}
${r(112,"End DACA (Deferred Action for Childhood Arrivals)",8,"PARTIAL")}
${r(113,"Extreme vetting for all immigration",8,"KEPT")}
${r(114,"Travel ban from terror-prone countries",8,"KEPT")}
${r(115,"End visa lottery program",8,"BROKEN")}
${r(116,"Merit-based immigration system",8,"PARTIAL")}
${r(117,"Hire 5,000 additional Border Patrol agents",8,"PARTIAL")}
${r(118,"End visa overstays (biometric tracking)",8,"PARTIAL")}
${r(119,"Mandatory return of criminal aliens",8,"PARTIAL")}
${r(120,"Deport gang members / MS-13",8,"KEPT")}
${r(121,"Kate&rsquo;s Law &mdash; mandatory minimums for deported felons who return",8,"BROKEN")}
${r(122,"Stop refugee resettlement from Syria",8,"KEPT")}
${r(123,"Build detention facilities for illegal crossers",8,"KEPT")}
${r(124,"Remain in Mexico policy for asylum seekers",8,"KEPT")}
${r(125,"End chain migration / family-based immigration",8,"BROKEN")}
</tbody></table>

<p style="font-size:9.5pt;color:#555;font-style:italic;margin:0.1in 0 0.2in;border-top:0.5pt solid #ddd;padding-top:0.1in;"><strong>Section verdict:</strong> The most action-heavy section. Travel ban (three versions, third upheld by SCOTUS). Wall (23% built). Remain in Mexico (implemented). MS-13 targeted. DACA (survived in court). But: 11 million not deported. Birthright citizenship unchanged. Visa lottery intact. The famous chant was 23% delivered.</p>

<h3>Part VIII &mdash; Law &amp; Order (Promises 126&ndash;138)</h3>
<table class="score"><thead><tr><th>#</th><th>Promise</th><th>Ch</th><th>Our Read</th><th>Yours</th></tr></thead><tbody>
${r(126,"Reduce violent crime in inner cities",9,"READER")}
${r(127,"Support police / end the &ldquo;war on cops&rdquo;",9,"KEPT")}
${r(128,"Appoint law-and-order Supreme Court justices",9,"KEPT")}
${r(129,"Protect the Second Amendment",9,"KEPT")}
${r(130,"Appoint pro-life justices to overturn Roe v. Wade",9,"KEPT")}
${r(131,"National concealed carry reciprocity",9,"BROKEN")}
${r(132,"Fix the inner cities / urban renewal",9,"BROKEN")}
${r(133,"Stop the opioid epidemic",9,"PARTIAL")}
${r(134,"Death penalty for drug dealers",9,"BROKEN")}
${r(135,"Protect religious liberty",9,"KEPT")}
${r(136,"End the Johnson Amendment (churches &amp; politics)",9,"PARTIAL")}
${r(137,"Appoint conservative judges at all levels",9,"KEPT")}
${r(138,"Defend due process and constitutional rights",9,"READER")}
</tbody></table>

<p style="font-size:9.5pt;color:#555;font-style:italic;margin:0.1in 0 0.2in;border-top:0.5pt solid #ddd;padding-top:0.1in;"><strong>Section verdict:</strong> Three Supreme Court justices. That&rsquo;s the headline. Roe overturned. 6-3 conservative majority for a generation. Police supported. Opioid epidemic: effort real, crisis worsened anyway. Crime data genuinely ambiguous (fell 2017-2019, spiked 2020). The judicial legacy is the most consequential domestic achievement of the entire term.</p>

<h3>Part IX &mdash; Miscellaneous &amp; Culture War (Promises 139&ndash;145)</h3>
<table class="score"><thead><tr><th>#</th><th>Promise</th><th>Ch</th><th>Our Read</th><th>Yours</th></tr></thead><tbody>
${r(139,"Withdraw from Paris Climate Agreement","-","KEPT")}
${r(140,"Cancel Clean Power Plan","-","KEPT")}
${r(141,"Approve Keystone XL pipeline","-","KEPT")}
${r(142,"Achieve energy independence","-","KEPT")}
${r(143,"Open up federal land for energy exploration","-","KEPT")}
${r(144,"Defund Planned Parenthood","-","BROKEN")}
${r(145,"Win so much you&rsquo;ll get tired of winning","-","READER")}
</tbody></table>

<div style="margin-top:0.3in;padding:0.15in;background:#f8f6f2;border-radius:4pt;">
<p style="font-size:10pt;font-weight:700;margin-bottom:0.08in;">FINAL TALLY (Our Read)</p>
<p style="font-size:9pt;margin:0;">
${badge("KEPT")} <strong>46</strong> promises kept &bull;
${badge("PARTIAL")} <strong>51</strong> partial &bull;
${badge("BROKEN")} <strong>40</strong> broken &bull;
${badge("BLOCKED")} <strong>0</strong> blocked &bull;
${badge("READER")} <strong>8</strong> you decide
</p>
<p style="font-size:8.5pt;color:#666;margin-top:0.08in;font-style:italic;">The math: 32% kept, 35% partial, 28% broken, 6% your call. The most kept promises were in trade, energy, and judicial appointments. The most broken were ethics, healthcare, and fiscal discipline. Draw your own conclusions.</p>
</div>
`
}

function readingGuide() {
  return `<div class="chapter-start">
  <h2 style="font-size:18pt;text-align:center;font-variant:small-caps;letter-spacing:0.1em;margin-bottom:0.3in;">Reading Group Guide</h2>
  <p class="ch-sub">For book clubs, classrooms, and kitchen-table conversations.</p>
</div>

<h3>General Discussion Questions</h3>

<p><strong>1.</strong> Before reading this book, how many of the 145 promises were you aware of? Did any surprise you &mdash; either as promises that were kept or promises that were broken?</p>

<p><strong>2.</strong> The book assigns color-coded verdicts. Pick one you disagree with. What verdict would you give instead, and why? What evidence would change your mind?</p>

<p><strong>3.</strong> The author argues that executive-action promises were mostly kept while legislative promises were mostly broken. Does this pattern change how you evaluate campaign promises from ANY candidate?</p>

<p><strong>4.</strong> The &ldquo;drain the swamp&rdquo; chapter shows that lobbying spending increased during the term while the largest donor in history got 3-for-3 on foreign policy. Can ANY president truly reduce the influence of money in politics, or is the system designed to prevent that?</p>

<p><strong>5.</strong> COVID-19 makes economic evaluation nearly impossible. Is it fair to include 2020 in the economic scorecard? How would you separate pandemic impact from policy impact?</p>

<h3>Chapter-Specific Questions</h3>

<p><strong>Chapter 1 (Swamp):</strong> The ethics pledge was signed and then revoked on the final day. Is a temporary ethics pledge better than none at all, or does revoking it retroactively erase its value?</p>

<p><strong>Chapter 2 (Trade):</strong> Tariffs were paid by American importers (and ultimately consumers), not China. Does it matter who pays if the policy achieves its strategic goals? When is economic pain justified for national interests?</p>

<p><strong>Chapter 3 (Jobs):</strong> The TCJA&rsquo;s corporate rate cut is permanent while the individual rate cuts expire in 2025. What does this structural choice say about legislative priorities? If you were writing the bill, which would you make permanent?</p>

<p><strong>Chapter 4 (Healthcare):</strong> Seven years of &ldquo;repeal and replace&rdquo; produced no replacement plan. What does it mean when a party campaigns on opposition but has no governing alternative? Is this unique to healthcare or a broader pattern?</p>

<p><strong>Chapter 5 (NATO):</strong> Public shaming increased allied spending. But it also weakened alliance trust. Is the tradeoff worth it? Can you get allies to spend more without making them doubt your commitment?</p>

<p><strong>Chapter 6 (Middle East):</strong> The Abraham Accords bypassed Palestinians. The Iran deal withdrawal increased Iran&rsquo;s nuclear capacity. Are these connected? Can you have regional peace while ignoring the Palestinian question?</p>

<p><strong>Chapter 7 (China):</strong> Biden kept Trump&rsquo;s China tariffs. What does bipartisan continuation say about whether a policy was correct vs. whether it&rsquo;s politically impossible to reverse?</p>

<p><strong>Chapter 8 (Border):</strong> Zero Tolerance separated 2,654+ children from parents. Over 1,000 were never reunited. When does &ldquo;deterrence&rdquo; cross a moral line? Who decides where that line is?</p>

<p><strong>Chapter 9 (Law &amp; Order):</strong> Three Supreme Court justices will serve for 30+ years. The Garland block and Barrett confirmation used opposite standards. Does the end (a reshaped Court) justify the means (inconsistent rules)? Would you feel the same if the other party did it?</p>

<h3>The Big Question</h3>

<p><strong>After reading all 145 promises and their outcomes:</strong> Is a 31.7% fully-kept rate (with another 35% partially kept) acceptable for a democracy? What rate would you expect? Does it matter more WHICH promises are kept (consequential ones like SCOTUS) or HOW MANY are kept (the raw percentage)?</p>

<p style="font-style:italic;color:#555;margin-top:0.3in;">These questions have no correct answers. That&rsquo;s the point.</p>
`
}

function appendices() {
  return `<div class="chapter-start">
  <span class="ch-num">Appendices</span>
  <h1 class="ch-title">How to Verify Everything</h1>
  <p class="ch-sub">Don&rsquo;t trust us. Check the sources yourself.</p>
</div>

<h3>Appendix A: What This Book Is</h3>
<p><strong>IS:</strong> A primary-source comparison tool. Campaign quotes paired with official records.</p>
<p><strong>ISN&rsquo;T:</strong> A campaign for or against anyone. Not legal or financial advice.</p>

<h3>Appendix B: Source Tiers</h3>
<p><strong>Tier 1 (gold standard):</strong> Official debate transcripts (CPD), C-SPAN rally transcripts, Federal Register, Congress.gov.</p>
<p><strong>Tier 2 (navigation):</strong> Government agency data (BLS, Census, CBP, DOD, CMS). We point you there; we don&rsquo;t interpret for you.</p>
<p><strong>Tier 3 (excluded):</strong> Partisan scorecards. Anonymous sources. Opinion columns. Cable chyrons.</p>

<h3>Appendix C: Where to Look Things Up</h3>
<p><strong>Debates:</strong> debates.org/voter-education/debate-transcripts/</p>
<p><strong>Lobbying:</strong> lda.senate.gov &bull; opensecrets.org</p>
<p><strong>Trade:</strong> census.gov/foreign-trade/ &bull; ustr.gov</p>
<p><strong>Crime:</strong> ucr.fbi.gov &bull; chicagopolice.org</p>
<p><strong>Healthcare:</strong> cms.gov &bull; congress.gov</p>
<p><strong>NATO:</strong> nato.int/cps/en/natohq/topics_49198.htm</p>
<p><strong>Border:</strong> cbp.gov &bull; ice.gov/ero</p>
<p><strong>Executive orders:</strong> federalregister.gov</p>
<p><strong>Donations:</strong> fec.gov &bull; opensecrets.org</p>

<h3>Appendix D: Methodology</h3>

<p><strong>How we identified 145 promises:</strong> We reviewed all three 2016 presidential debate transcripts (Commission on Presidential Debates), 47 rally transcripts from the C-SPAN archive (June 2015 &ndash; November 2016), the official campaign website policy positions (archived via Wayback Machine), and two published policy documents (&ldquo;Contract with the American Voter,&rdquo; Oct 2016; &ldquo;100-Day Action Plan&rdquo;).</p>

<p><strong>What counts as a &ldquo;promise&rdquo;:</strong> A statement made publicly during the campaign that (a) describes a specific future action, (b) was made more than once or appeared in a formal policy document, and (c) is verifiable against public records. We excluded vague aspiration (&ldquo;make America great&rdquo;) and focused on concrete commitments (&ldquo;build a wall,&rdquo; &ldquo;cut the corporate rate to 15%&rdquo;).</p>

<p><strong>How we assigned verdicts:</strong> Each promise was evaluated against official government data, executive orders, legislative records, and federal court opinions through May 2026. KEPT means the action was taken substantially as described. PARTIAL means real action was taken but fell short of the specific commitment. BROKEN means no meaningful action was taken or the action contradicted the promise. BLOCKED means courts or Congress prevented execution despite a good-faith attempt. YOU DECIDE means the evidence is genuinely ambiguous or the question is values-based rather than factual.</p>

<p><strong>What we didn&rsquo;t do:</strong> We did not interview administration officials. We did not use anonymous sources. We did not access classified material. We did not engage in investigative journalism (no FOIA requests, no confidential informants). Everything in this book comes from the public record that any American can access.</p>

<h3>Appendix E: Timeline of Key Events</h3>

<p><strong>2015</strong></p>
<p>Jun 16 &mdash; Campaign announcement (Trump Tower escalator). &bull; Aug 6 &mdash; First GOP debate (Fox News, 10 candidates). &bull; Dec 7 &mdash; &ldquo;Muslim ban&rdquo; proposal announced.</p>

<p><strong>2016</strong></p>
<p>May 3 &mdash; Last GOP rival drops out; nominee presumptive. &bull; Jul 18-21 &mdash; Republican National Convention. &bull; Sep 26 &mdash; First general election debate (Hofstra). &bull; Oct 7 &mdash; Access Hollywood tape released. &bull; Oct 9 &mdash; Second debate (Washington University). &bull; Oct 19 &mdash; Third debate (UNLV, Las Vegas). &bull; Nov 8 &mdash; Election Day: 304-227 Electoral College victory.</p>

<p><strong>2017</strong></p>
<p>Jan 20 &mdash; Inauguration. &bull; Jan 23 &mdash; TPP withdrawal (Day 3). &bull; Jan 25 &mdash; Border wall EO + sanctuary city EO. &bull; Jan 27 &mdash; Travel ban v1 (blocked by courts within days). &bull; Apr 7 &mdash; Syria strike (59 Tomahawks). &bull; Jun 1 &mdash; Paris Agreement withdrawal announced. &bull; Dec 22 &mdash; Tax Cuts and Jobs Act signed.</p>

<p><strong>2018</strong></p>
<p>Mar 8 &mdash; Steel/aluminum tariffs (Section 232). &bull; Apr 6 &mdash; Zero tolerance policy begins. &bull; May 8 &mdash; Iran deal withdrawal. &bull; Jun 12 &mdash; Singapore summit with Kim Jong-un. &bull; Jun 20 &mdash; Family separation EO (ending zero tolerance). &bull; Sep 30 &mdash; USMCA announced (replacing NAFTA). &bull; Dec 22 &mdash; Government shutdown begins.</p>

<p><strong>2019</strong></p>
<p>Jan 25 &mdash; Shutdown ends (35 days). &bull; Feb 15 &mdash; National emergency declared (border). &bull; May 10 &mdash; China tariffs escalated to 25%. &bull; May 15 &mdash; Huawei Entity List. &bull; Jun 30 &mdash; DMZ meeting with Kim Jong-un. &bull; Aug 5 &mdash; China labeled currency manipulator. &bull; Sep &mdash; Unemployment hits 3.5% (50-year low). &bull; Dec 18 &mdash; House impeaches (Ukraine phone call).</p>

<p><strong>2020</strong></p>
<p>Jan 15 &mdash; Phase One China deal signed. &bull; Feb 5 &mdash; Senate acquits. &bull; Mar 13 &mdash; COVID national emergency. &bull; May 25 &mdash; George Floyd killed. &bull; Jun 26 &mdash; SCOTUS blocks DACA rescission. &bull; Jul 4 &mdash; Federal agents deployed to Portland. &bull; Sep 18 &mdash; RBG dies. &bull; Oct 26 &mdash; Barrett confirmed (8 days before election). &bull; Nov 3 &mdash; Election Day: Biden wins 306-232. &bull; Dec 14 &mdash; Electoral College votes.</p>

<p><strong>2021</strong></p>
<p>Jan 6 &mdash; Capitol breach. &bull; Jan 13 &mdash; Second House impeachment. &bull; Jan 19 &mdash; 143 pardons/commutations (incl. Bannon). &bull; Jan 20 &mdash; Biden inaugurated. Term ends.</p>

<h3>Appendix F: Glossary</h3>

<p><strong>Section 301</strong> &mdash; Trade Act provision allowing the President to impose tariffs in response to unfair foreign trade practices.</p>
<p><strong>Section 232</strong> &mdash; Trade Expansion Act provision allowing tariffs on national security grounds.</p>
<p><strong>USMCA</strong> &mdash; United States-Mexico-Canada Agreement (replaced NAFTA, effective Jul 2020).</p>
<p><strong>TCJA</strong> &mdash; Tax Cuts and Jobs Act (P.L. 115-97, Dec 2017).</p>
<p><strong>MPP</strong> &mdash; Migrant Protection Protocols (&ldquo;Remain in Mexico,&rdquo; Jan 2019).</p>
<p><strong>EO</strong> &mdash; Executive Order (presidential directive, not legislation).</p>
<p><strong>Entity List</strong> &mdash; Commerce Dept list restricting export of US technology to named foreign entities.</p>
<p><strong>Reconciliation</strong> &mdash; Senate budget procedure allowing passage with 51 votes (no filibuster). Used for TCJA.</p>
<p><strong>JCPOA</strong> &mdash; Joint Comprehensive Plan of Action (Iran nuclear deal, 2015; US withdrew May 2018).</p>
<p><strong>CFIUS</strong> &mdash; Committee on Foreign Investment in the United States (reviews foreign acquisitions for national security).</p>
<p><strong>FIRRMA</strong> &mdash; Foreign Investment Risk Review Modernization Act (Aug 2018; expanded CFIUS authority).</p>
<p><strong>Dobbs</strong> &mdash; Dobbs v. Jackson Women&rsquo;s Health Organization (June 2022; overturned Roe v. Wade).</p>

<h3>Appendix G: License</h3>
<p>Personal, non-commercial use. No redistribution, resale, or LLM training on full text without permission.</p>

<p style="margin-top:0.5in;text-align:center;font-style:italic;color:#888;font-size:9pt;">End of SEALED v1 &mdash; The 2016 Promises: Before the Deals</p>
<p style="text-align:center;font-size:8pt;color:#aaa;">SEALED Press &bull; 2026</p>
`
}

async function main() {
  console.log("Loading illustrations...")
  IMG = {
    coverArt: await imgUri("product-images/cover-art-v2.png"),
    scroll: await imgUri("title-scroll-seal.jpg"),
    c2016: await imgUri("cover-2016.jpg"),
    c2020: await imgUri("cover-2020.jpg"),
    c2024: await imgUri("cover-2024.jpg"),
    c2026: await imgUri("cover-2026.jpg"),
    swamp: await imgUri("ch1-swamp.jpg"),
    trade: await imgUri("ch2-trade.jpg"),
    jobs: await imgUri("ch3-jobs.jpg"),
    healthcare: await imgUri("ch4-healthcare.jpg"),
    nato: await imgUri("ch5-nato.jpg"),
    middleeast: await imgUri("ch6-middleeast.jpg"),
    china: await imgUri("ch7-china.jpg"),
    wall: await imgUri("ch8-wall.jpg"),
    laworder: await imgUri("ch9-laworder.jpg"),
  }
  console.log(`Loaded ${Object.keys(IMG).length} images`)

  const html = buildBook()
  const htmlPath = path.join(ARTIFACTS, "SEALED-v1-retail.html")
  await fs.writeFile(htmlPath, html, "utf-8")

  const browser = await puppeteer.launch({ headless: true })
  const page = await browser.newPage()
  await page.setContent(html, { waitUntil: "networkidle0" })

  await page.pdf({
    path: OUTPUT,
    width: "6in",
    height: "9in",
    printBackground: true,
    displayHeaderFooter: false,
    margin: { top: "0.75in", bottom: "0.85in", left: "0.65in", right: "0.65in" },
  })

  await browser.close()
  const stat = await fs.stat(OUTPUT)
  console.log(`Wrote ${OUTPUT} (${(stat.size / 1024 / 1024).toFixed(1)} MB)`)
}

main().catch((err) => { console.error("Failed:", err); process.exitCode = 1 })
