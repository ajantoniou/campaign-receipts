/**
 * 2024 Deleted Promises - companion PDF builder.
 *
 * Reads the literary prose at eng/2024-deleted-promises-prose-v1.md and
 * renders it as a designed PDF (parchment + gold + ink) via puppeteer.
 *
 * Output: artifacts/2024-deleted-promises/2024-deleted-promises-v1.pdf
 *         (NEVER public/ — this is the PAID $5 LS product; anything under
 *         public/ is served free by Next. Upload the PDF to Lemon Squeezy
 *         product 1043612 by hand after regenerating.)
 * Usage:  node scripts/build-2024-deleted-pdf.mjs
 *
 * Design tokens match the SEALED retail PDF (parchment, ink, civic gold).
 * 6x9 trade book trim. Georgia serif body. Helvetica display + caps.
 *
 * 2026-05-25 (founder lock):
 *   - 3rd-grade reading level prose (Hemingway 4-5)
 *   - Disappointment-not-rage tone
 *   - 3 featured verbatim 2024 promises + 52-row appendix
 *   - 3 [needs source] flags remain in prose for founder to fill pre-release
 */

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const PROSE_MD = path.join(ROOT, "eng", "2024-deleted-promises-prose-v1.md");
const OUTPUT_PDF = path.join(ROOT, "artifacts", "2024-deleted-promises", "2024-deleted-promises-v1.pdf");
const OUTPUT_HTML = path.join(ROOT, "artifacts", "2024-deleted-promises", "2024-deleted-promises-v1.html");
const COMMITMENTS_JSON = path.join(
  ROOT,
  "..",
  "campaign-receipts",
  "app",
  "2024-trump-campaign-promises",
  "commitments.json",
);

const T = {
  parchment: "#faf7ef",
  parchmentDeep: "#f3eedf",
  ink: "#0f1f3a",
  inkSoft: "#2a3a5a",
  inkMuted: "#5b6478",
  gold: "#b08a3e",
  goldDark: "#8a6c2f",
  civicRed: "#a4243b",
  civicBlue: "#2a4d7c",
};

function escapeHtml(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Block-mode markdown to HTML. Token-based so escape doesn't kill <em>/<strong>.
function mdParagraphsToHtml(md) {
  // Extract fenced code blocks
  const codeBlocks = [];
  md = md.replace(/```([\s\S]*?)```/g, (_, code) => {
    codeBlocks.push(code.trim());
    return `\n\nCODEBLK${codeBlocks.length - 1}ENDBLK\n\n`;
  });

  // Tables: contiguous lines starting with `|`
  const tables = [];
  md = md.replace(/((?:^\|.*\n?)+)/gm, (block) => {
    const rows = block
      .trim()
      .split("\n")
      .map((r) => r.split("|").slice(1, -1).map((c) => c.trim()));
    if (rows.length < 2) return block;
    const [head, _sep, ...body] = rows;
    const thead = `<thead><tr>${head
      .map((c) => `<th>${escapeHtml(c)}</th>`)
      .join("")}</tr></thead>`;
    const tbody = `<tbody>${body
      .map(
        (r) =>
          `<tr>${r
            .map((c) => `<td>${escapeHtml(c)}</td>`)
            .join("")}</tr>`,
      )
      .join("")}</tbody>`;
    tables.push(`<table class="promise-table">${thead}${tbody}</table>`);
    return `\n\nTABLEBLK${tables.length - 1}ENDBLK\n\n`;
  });

  const out = md
    .split(/\n{2,}/)
    .map((rawBlock) => {
      const block = rawBlock.trim();
      if (!block) return "";

      // Code placeholder
      let m = /^CODEBLK(\d+)ENDBLK$/.exec(block);
      if (m) {
        return `<pre class="receipt-box">${escapeHtml(codeBlocks[+m[1]])}</pre>`;
      }
      // Table placeholder
      m = /^TABLEBLK(\d+)ENDBLK$/.exec(block);
      if (m) return tables[+m[1]];

      // Horizontal rule
      if (/^---+$/.test(block)) return '<hr class="goldrule" />';

      // Heading? (handled inline so we don't paragraph-wrap)
      m = /^####\s+(.+)$/.exec(block);
      if (m) return `<h4>${renderInline(m[1])}</h4>`;
      m = /^###\s+(.+)$/.exec(block);
      if (m) return `<h3>${renderInline(m[1])}</h3>`;
      m = /^##\s+(.+)$/.exec(block);
      if (m) return `<h2>${renderInline(m[1])}</h2>`;
      m = /^#\s+(.+)$/.exec(block);
      if (m) return `<h1>${renderInline(m[1])}</h1>`;

      // Blockquote (collapse multi-line)
      if (/^>\s+/.test(block)) {
        const inner = block
          .split("\n")
          .map((l) => l.replace(/^>\s+/, ""))
          .join(" ");
        return `<blockquote>${renderInline(inner)}</blockquote>`;
      }

      // Default paragraph (preserve hard line breaks)
      const para = block
        .split("\n")
        .map(renderInline)
        .join("<br/>");
      return `<p>${para}</p>`;
    })
    .filter(Boolean)
    .join("\n");

  return out;
}

// Inline emphasis: bold, italic, inline-code. Sentinel-then-escape so tags survive.
function renderInline(text) {
  let s = text;
  const tokens = [];
  const tok = (html) => {
    tokens.push(html);
    return `TOK${tokens.length - 1}`;
  };
  // Inline code first (won't be touched by bold/italic)
  s = s.replace(/`([^`]+)`/g, (_, c) => tok(`<code>${escapeHtml(c)}</code>`));
  // Bold first (so the italic regex doesn't eat it)
  s = s.replace(/\*\*([^*]+)\*\*/g, (_, c) => tok(`<strong>${escapeHtml(c)}</strong>`));
  // Italic
  s = s.replace(/\*([^*]+)\*/g, (_, c) => tok(`<em>${escapeHtml(c)}</em>`));
  // Escape the rest (sentinels survive escape since they contain no <,>,&)
  s = escapeHtml(s);
  // Re-substitute tokens
  s = s.replace(/TOK(\d+)/g, (_, i) => tokens[Number(i)]);
  return s;
}

// Section-aware split on `## ` markers. Skips FRONTMATTER (pre-cover preamble).
function splitSections(md) {
  const lines = md.split("\n");
  const sections = [];
  let current = { title: "_PREAMBLE_", body: [] };
  for (const line of lines) {
    const m = /^## (.+)$/.exec(line);
    if (m) {
      sections.push(current);
      current = { title: m[1].trim(), body: [] };
    } else {
      current.body.push(line);
    }
  }
  sections.push(current);
  return sections.filter(
    (s) => s.body.join("").trim() && s.title !== "_PREAMBLE_",
  );
}

function renderCoverSection(section) {
  const body = section.body.join("\n");
  const grab = (label) => {
    const re = new RegExp(`\\*\\*${label}:\\*\\*\\s*\\n([^\\n]+)`, "i");
    const m = re.exec(body);
    return m ? m[1].trim() : "";
  };
  const title = grab("Title") || "2024 DELETED PROMISES";
  const subtitle = grab("Subtitle");
  const authorTag = grab("Author tag");
  const teaser = grab("Bottom teaser");

  return `
<section class="cover">
  <div class="cover-eyebrow">SEALED 2016 — companion volume</div>
  <div class="cover-goldrule"></div>
  <h1 class="cover-title">${escapeHtml(title)}</h1>
  <div class="cover-goldrule narrow"></div>
  <p class="cover-subtitle">${escapeHtml(subtitle)}</p>
  <div class="cover-spacer"></div>
  <p class="cover-author">${escapeHtml(authorTag)}</p>
  <p class="cover-teaser">${escapeHtml(teaser)}</p>
</section>
`;
}

function renderEssaySection(title, html, sectionClass) {
  return `
<section class="${sectionClass}">
  <header class="section-head">
    <div class="goldrule"></div>
    <p class="section-eyebrow">${sectionClass === "chapter" ? "Chapter" : ""}</p>
    <h2 class="section-title">${escapeHtml(title)}</h2>
    <div class="goldrule narrow"></div>
  </header>
  <div class="section-body">${html}</div>
</section>
`;
}

async function buildAppendixHtml() {
  const data = JSON.parse(await fs.readFile(COMMITMENTS_JSON, "utf-8"));
  const rows = data.commitments
    .map((p, i) => {
      const quote =
        p.verbatim_quote.length > 140
          ? p.verbatim_quote.slice(0, 137) + "…"
          : p.verbatim_quote;
      const status = p.outcome_status || "—";
      const statusClass = status.toLowerCase().replace(/[^a-z]/g, "");
      const src = p.source_page || "—";
      const deleted = p.deleted_after || "—";
      return `<tr>
        <td class="num">${i + 1}</td>
        <td class="quote">"${escapeHtml(quote)}"</td>
        <td class="src">${escapeHtml(src)}</td>
        <td class="deleted">${escapeHtml(deleted)}</td>
        <td class="status status-${statusClass}">${escapeHtml(status)}</td>
      </tr>`;
    })
    .join("\n");

  return `
<section class="appendix">
  <header class="section-head">
    <div class="goldrule"></div>
    <p class="section-eyebrow">Appendix</p>
    <h2 class="section-title">All 52 deleted promises</h2>
    <div class="goldrule narrow"></div>
  </header>
  <p class="appendix-intro">
    Every promise preserved from the donaldjtrump.com 2024 platform pages
    before they were pulled on or about January 20, 2025. Each row links to
    the source page we captured. Read the originals at
    <code>web.archive.org/web/2025*/donaldjtrump.com/*</code>.
  </p>
  <table class="appendix-table">
    <thead>
      <tr><th>#</th><th>Verbatim promise</th><th>Source page</th><th>Deleted</th><th>Status</th></tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
</section>
`;
}

function shellHtml(bodyHtml) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>2024 Deleted Promises — SEALED Press</title>
<style>
  @page { size: 6in 9in; margin: 0.7in 0.65in 0.85in 0.65in; }
  html, body {
    background: ${T.parchment};
    color: ${T.ink};
    font-family: Georgia, "Times New Roman", serif;
    font-size: 11pt;
    line-height: 1.55;
    margin: 0; padding: 0;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  section.cover {
    page-break-after: always;
    text-align: center;
    padding: 1.4in 0.3in 0.6in 0.3in;
    min-height: 7in;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    background: ${T.parchment};
  }
  .cover-eyebrow {
    font-family: Helvetica, Arial, sans-serif;
    font-size: 9pt;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    color: ${T.civicBlue};
    margin-bottom: 0.4in;
  }
  .cover-goldrule {
    width: 60%; height: 1.2pt; margin: 0 auto;
    background: linear-gradient(to right, transparent, ${T.gold} 30%, ${T.gold} 70%, transparent);
  }
  .cover-goldrule.narrow { width: 30%; margin: 0.4in auto; }
  .cover-title {
    font-family: Georgia, serif;
    font-size: 34pt;
    font-weight: bold;
    line-height: 1.05;
    margin: 0.5in 0 0 0;
    color: ${T.ink};
    letter-spacing: -0.01em;
  }
  .cover-subtitle {
    font-family: Georgia, serif;
    font-size: 13pt;
    font-style: italic;
    color: ${T.inkSoft};
    max-width: 4in;
    margin: 0 auto;
    line-height: 1.4;
  }
  .cover-spacer { flex-grow: 1; min-height: 1.5in; }
  .cover-author {
    font-family: Helvetica, Arial, sans-serif;
    font-size: 8.5pt;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: ${T.gold};
    margin: 0 0 0.18in 0;
  }
  .cover-teaser {
    font-family: Georgia, serif;
    font-size: 10pt;
    font-style: italic;
    color: ${T.inkMuted};
    margin: 0;
  }

  section { page-break-before: always; }
  section.cover { page-break-before: auto; }
  .section-head { text-align: center; margin: 0.2in 0 0.4in 0; }
  .goldrule {
    width: 40%; height: 1pt; margin: 0.15in auto;
    background: linear-gradient(to right, transparent, ${T.gold} 30%, ${T.gold} 70%, transparent);
  }
  .goldrule.narrow { width: 22%; }
  .section-eyebrow {
    font-family: Helvetica, Arial, sans-serif;
    font-size: 8.5pt;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    color: ${T.gold};
    margin: 0 0 0.08in 0;
  }
  .section-title {
    font-family: Georgia, serif;
    font-size: 22pt;
    line-height: 1.2;
    color: ${T.ink};
    margin: 0 0 0.1in 0;
    font-weight: bold;
  }

  .section-body h3 {
    font-family: Georgia, serif;
    font-size: 14pt;
    font-style: italic;
    color: ${T.civicBlue};
    margin: 0.2in 0 0.18in 0;
    text-align: center;
    font-weight: normal;
  }
  .section-body h4 {
    font-family: Helvetica, Arial, sans-serif;
    font-size: 9.5pt;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: ${T.gold};
    margin: 0.3in 0 0.1in 0;
    font-weight: bold;
  }
  .section-body p { margin: 0 0 0.13in 0; text-align: justify; hyphens: auto; }
  .section-body blockquote {
    margin: 0.18in 0.3in;
    padding: 0.15in 0.2in;
    background: ${T.parchmentDeep};
    border-left: 3pt solid ${T.gold};
    font-family: Georgia, serif;
    font-size: 11.5pt;
    font-style: italic;
    color: ${T.inkSoft};
    line-height: 1.45;
  }
  hr.goldrule {
    border: 0;
    width: 30%; height: 1pt;
    margin: 0.3in auto;
    background: linear-gradient(to right, transparent, ${T.gold} 30%, ${T.gold} 70%, transparent);
  }
  .section-body code {
    font-family: "SF Mono", Menlo, monospace;
    font-size: 9pt;
    background: ${T.parchmentDeep};
    color: ${T.inkSoft};
    padding: 0 3pt;
    border-radius: 2pt;
  }
  pre.receipt-box {
    font-family: "SF Mono", Menlo, monospace;
    font-size: 9pt;
    line-height: 1.5;
    background: ${T.parchmentDeep};
    color: ${T.ink};
    border: 1.5pt solid ${T.civicRed};
    border-left: 4pt solid ${T.civicRed};
    padding: 0.14in 0.18in;
    margin: 0.25in 0;
    white-space: pre-wrap;
    page-break-inside: avoid;
  }

  .appendix-intro { margin: 0 0 0.18in 0; font-size: 10pt; color: ${T.inkSoft}; }
  .appendix-table { width: 100%; border-collapse: collapse; font-size: 8pt; margin-top: 0.1in; }
  .appendix-table thead th {
    font-family: Helvetica, Arial, sans-serif;
    font-size: 7.5pt;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: ${T.gold};
    text-align: left;
    border-bottom: 1pt solid ${T.gold};
    padding: 4pt 5pt;
    background: ${T.parchmentDeep};
  }
  .appendix-table tbody td {
    border-bottom: 0.5pt solid #d8cfb4;
    padding: 4pt 5pt;
    vertical-align: top;
  }
  .appendix-table td.num { width: 6%; color: ${T.gold}; font-weight: bold; }
  .appendix-table td.quote { width: 50%; font-style: italic; color: ${T.ink}; }
  .appendix-table td.src {
    width: 22%;
    font-family: "SF Mono", monospace;
    font-size: 7pt;
    color: ${T.inkSoft};
    word-break: break-all;
  }
  .appendix-table td.deleted {
    width: 10%;
    font-family: "SF Mono", monospace;
    font-size: 7pt;
    color: ${T.inkMuted};
  }
  .appendix-table td.status {
    width: 12%;
    font-family: Helvetica, Arial, sans-serif;
    font-size: 7pt;
    font-weight: bold;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }
  .appendix-table td.status-kept       { color: #1e7e34; }
  .appendix-table td.status-broken     { color: ${T.civicRed}; }
  .appendix-table td.status-partial    { color: #e65100; }
  .appendix-table td.status-inprogress { color: ${T.civicBlue}; }
  .appendix-table td.status-pending    { color: ${T.inkMuted}; }

  section.chapter .section-body p { margin-bottom: 0.14in; }
  section.essay .section-body p:first-of-type::first-letter {
    font-family: Georgia, serif;
    font-size: 22pt;
    font-weight: bold;
    color: ${T.gold};
    float: left;
    line-height: 0.85;
    margin: 4pt 6pt 0 0;
  }
</style>
</head>
<body>
${bodyHtml}
</body>
</html>`;
}

async function main() {
  console.log("Reading prose manuscript...");
  const md = await fs.readFile(PROSE_MD, "utf-8");

  console.log("Splitting sections...");
  const sections = splitSections(md);
  console.log(`  -> ${sections.length} sections: ${sections.map((s) => s.title.slice(0, 28)).join(" | ")}`);

  console.log("Rendering HTML...");
  const sectionsHtml = [];
  for (const s of sections) {
    const bodyMd = s.body.join("\n").trim();
    if (!bodyMd) continue;

    if (/^COVER PAGE/i.test(s.title)) {
      sectionsHtml.push(renderCoverSection(s));
    } else if (/^APPENDIX/i.test(s.title)) {
      sectionsHtml.push(await buildAppendixHtml());
    } else {
      const html = mdParagraphsToHtml(bodyMd);
      const cls = /^CHAPTER/i.test(s.title) ? "chapter" : "essay";
      sectionsHtml.push(renderEssaySection(s.title, html, cls));
    }
  }

  const fullHtml = shellHtml(sectionsHtml.join("\n"));

  console.log("Writing HTML preview...");
  await fs.mkdir(path.dirname(OUTPUT_HTML), { recursive: true });
  await fs.writeFile(OUTPUT_HTML, fullHtml, "utf-8");

  console.log("Launching puppeteer...");
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const page = await browser.newPage();
  await page.setContent(fullHtml, { waitUntil: "networkidle0" });

  console.log("Rendering PDF...");
  await page.pdf({
    path: OUTPUT_PDF,
    width: "6in",
    height: "9in",
    printBackground: true,
    displayHeaderFooter: false,
    margin: { top: "0in", bottom: "0in", left: "0in", right: "0in" },
  });
  await browser.close();

  const stat = await fs.stat(OUTPUT_PDF);
  console.log(`\nOK Wrote ${OUTPUT_PDF} (${(stat.size / 1024).toFixed(1)} KB)`);
  console.log(`   HTML preview: ${OUTPUT_HTML}`);
}

main().catch((err) => {
  console.error("Failed:", err);
  process.exitCode = 1;
});
