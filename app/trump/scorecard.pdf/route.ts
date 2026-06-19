// /trump/scorecard.pdf — Puppeteer-rendered print scorecard PDF.
// One-page verdict table for the gift use-case.
// Renders the 9 chapter overviews + book-canonical totals.

import { NextResponse } from 'next/server'
import { launchBrowser } from '@/lib/puppeteer-launcher'
import {
  CHAPTERS,
  SCORECARD_TOTALS,
  VERDICT_HEX,
  VERDICT_LABEL,
} from '@/lib/sealed-promises'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 30

function pdfHtml() {
  const rows = CHAPTERS.map(
    (c) => `
    <tr>
      <td class="num">${c.number}</td>
      <td class="title">${c.title}</td>
      <td class="verdict" style="color:${VERDICT_HEX[c.verdict]}; border-color:${VERDICT_HEX[c.verdict]}">${VERDICT_LABEL[c.verdict]}</td>
    </tr>`,
  ).join('')

  return `<!doctype html><html><head><style>
  @import url('https://fonts.googleapis.com/css2?family=Source+Serif+4:wght@400;600;700&family=JetBrains+Mono:wght@500;700&display=swap');
  * { box-sizing: border-box; }
  @page { size: Letter portrait; margin: 0; }
  body { margin: 0; background: #FBF9F4; font-family: 'Source Serif 4', Georgia, serif; color: #2a2a2a; }
  .page { width: 8.5in; min-height: 11in; padding: 0.75in 0.75in; }
  .eyebrow { font-family: 'JetBrains Mono', monospace; font-size: 10px; letter-spacing: 0.18em; text-transform: uppercase; color: #3A4E78; font-weight: 700; }
  h1 { font-size: 36px; margin: 8px 0 4px; font-weight: 600; letter-spacing: -0.02em; color: #09090B; }
  .sub { font-size: 13px; color: #52525B; max-width: 6in; line-height: 1.45; margin-top: 6px; }
  .totals { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-top: 22px; }
  .tile { border: 1px solid #EAE3D2; background: #fff; padding: 12px 14px; position: relative; border-radius: 4px; }
  .tile::before { content:''; position: absolute; left: 0; top: 0; bottom: 0; width: 4px; }
  .tile.kept::before    { background: ${VERDICT_HEX.KEPT}; }
  .tile.partial::before { background: ${VERDICT_HEX.PARTIAL}; }
  .tile.broken::before  { background: ${VERDICT_HEX.BROKEN}; }
  .tile.decide::before  { background: ${VERDICT_HEX.YOU_DECIDE}; }
  .tile .l { font-family: 'JetBrains Mono', monospace; font-size: 9px; letter-spacing: 0.16em; text-transform: uppercase; font-weight: 700; }
  .tile .n { font-size: 32px; font-weight: 600; color: #09090B; margin-top: 2px; }
  .tile .p { font-family: 'JetBrains Mono', monospace; font-size: 10px; color: #71717A; margin-left: 6px; }
  table { width: 100%; border-collapse: collapse; margin-top: 28px; }
  th { text-align: left; font-family: 'JetBrains Mono', monospace; font-size: 9px; letter-spacing: 0.16em; text-transform: uppercase; color: #3A4E78; padding-bottom: 8px; border-bottom: 1px solid #D8CDB3; }
  td { padding: 12px 0; border-bottom: 1px solid #EAE3D2; vertical-align: middle; }
  td.num { font-family: 'JetBrains Mono', monospace; font-size: 12px; color: #71717A; width: 32px; }
  td.title { font-size: 15px; color: #09090B; }
  td.verdict { width: 110px; text-align: center; font-family: 'JetBrains Mono', monospace; font-size: 10px; letter-spacing: 0.14em; font-weight: 700; padding: 6px 8px; border: 2px solid; border-radius: 4px; }
  .footer { margin-top: 32px; padding-top: 14px; border-top: 1px solid #D8CDB3; font-size: 10px; color: #52525B; line-height: 1.5; }
  .footer .brand { font-family: 'JetBrains Mono', monospace; font-weight: 700; color: #09090B; letter-spacing: 0.1em; text-transform: uppercase; }
  .footer .brand span { color: #9b1c1c; }
  .disclosure { font-style: italic; margin-top: 6px; }
  </style></head><body>
  <div class="page">
    <div class="eyebrow">From the SEALED Press book · 2016 cycle</div>
    <h1>Trump 2016 — Final Scorecard</h1>
    <div class="sub">145 promises from the 2016 campaign, graded against the 2017–2021 term.</div>

    <div class="totals">
      <div class="tile kept"><div class="l" style="color:${VERDICT_HEX.KEPT}">KEPT</div><div><span class="n">${SCORECARD_TOTALS.KEPT}</span><span class="p">${Math.round((SCORECARD_TOTALS.KEPT/SCORECARD_TOTALS.TOTAL)*100)}%</span></div></div>
      <div class="tile partial"><div class="l" style="color:${VERDICT_HEX.PARTIAL}">PARTIAL</div><div><span class="n">${SCORECARD_TOTALS.PARTIAL}</span><span class="p">${Math.round((SCORECARD_TOTALS.PARTIAL/SCORECARD_TOTALS.TOTAL)*100)}%</span></div></div>
      <div class="tile broken"><div class="l" style="color:${VERDICT_HEX.BROKEN}">BROKEN</div><div><span class="n">${SCORECARD_TOTALS.BROKEN}</span><span class="p">${Math.round((SCORECARD_TOTALS.BROKEN/SCORECARD_TOTALS.TOTAL)*100)}%</span></div></div>
      <div class="tile decide"><div class="l" style="color:${VERDICT_HEX.YOU_DECIDE}">YOU DECIDE</div><div><span class="n">${SCORECARD_TOTALS.YOU_DECIDE}</span><span class="p">${Math.round((SCORECARD_TOTALS.YOU_DECIDE/SCORECARD_TOTALS.TOTAL)*100)}%</span></div></div>
    </div>

    <table>
      <thead><tr><th>#</th><th>Chapter</th><th style="text-align:center">Verdict</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>

    <div class="footer">
      <div class="brand">Campaign<span>Receipts</span>.com / trump</div>
      <div class="disclosure">82% of 2016 promises link to a primary source; the remaining 18% link to two independent contemporaneous reports. Full case-study receipts in the SEALED Press book at sealed2016.com.</div>
    </div>
  </div>
  </body></html>`
}

export async function GET() {
  let browser
  try {
    browser = await launchBrowser()
    const page = await browser.newPage()
    await page.setContent(pdfHtml(), { waitUntil: 'load' })
    const pdf = await page.pdf({
      format: 'Letter',
      printBackground: true,
      margin: { top: '0', right: '0', bottom: '0', left: '0' },
    })
    return new NextResponse(new Uint8Array(pdf as Buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline; filename="trump-2016-scorecard.pdf"',
        'Cache-Control': 'public, max-age=86400, s-maxage=86400',
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('scorecard.pdf render failed', err)
    return NextResponse.json({ error: 'render failed', detail: message }, { status: 500 })
  } finally {
    if (browser) await browser.close()
  }
}
