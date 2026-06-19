// Cite-image endpoint — returns a 1080×1350 verdict-card PNG for the
// "Cite this promise" clipboard-copy flow.
//
// Slug format: `{chapter-slug}__{promise-slug}` (double underscore
// separator so the segment stays one URL piece). The slug pair maps
// back to a SealedPromise via lib/sealed-promises.ts.
//
// Renders via Puppeteer (already in devDependencies) — same pattern as
// companies/concise-sealed/scripts/watermark-share-images.mjs.

import { NextRequest, NextResponse } from 'next/server'
import { launchBrowser } from '@/lib/puppeteer-launcher'
import {
  getPromiseBySlug,
  VERDICT_HEX,
  VERDICT_LABEL,
} from '@/lib/sealed-promises'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 30

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function cardHtml({
  promiseText,
  receipt,
  chapter,
  promiseNumber,
  verdictHex,
  verdictLabel,
  permalink,
}: {
  promiseText: string
  receipt: string
  chapter: string
  promiseNumber: number
  verdictHex: string
  verdictLabel: string
  permalink: string
}) {
  // 1080x1350 portrait — Instagram/X share dimensions
  return `<!doctype html><html><head><style>
  @import url('https://fonts.googleapis.com/css2?family=Source+Serif+4:ital,wght@0,400;0,600;0,700;1,400&family=JetBrains+Mono:wght@500;700&display=swap');
  * { box-sizing: border-box; }
  body { margin: 0; background: #FBF9F4; font-family: 'Source Serif 4', Georgia, serif; color: #2a2a2a; }
  .card { width: 1080px; height: 1350px; padding: 80px 72px; display: flex; flex-direction: column; position: relative; }
  .top-row { display: flex; justify-content: space-between; align-items: flex-start; }
  .eyebrow { font-family: 'JetBrains Mono', monospace; font-size: 18px; letter-spacing: 0.18em; text-transform: uppercase; color: #3A4E78; font-weight: 700; }
  .number { font-family: 'JetBrains Mono', monospace; font-size: 16px; color: #71717A; letter-spacing: 0.08em; }
  .stamp { border: 5px solid ${verdictHex}; color: ${verdictHex}; padding: 22px 28px; border-radius: 12px; font-family: 'JetBrains Mono', monospace; font-weight: 700; font-size: ${verdictLabel.length > 8 ? 26 : 30}px; letter-spacing: 0.14em; text-transform: uppercase; transform: rotate(-5deg); background: #FBF9F4; text-align: center; line-height: 1.05; }
  .promise { margin-top: 64px; font-size: 70px; line-height: 1.06; font-weight: 600; color: #09090B; letter-spacing: -0.02em; }
  .quote-rule { margin-top: 56px; border-left: 5px solid #9b1c1c; padding-left: 28px; }
  .quote { font-style: italic; font-size: 30px; line-height: 1.4; color: #18181B; }
  .receipt-label { margin-top: 56px; font-family: 'JetBrains Mono', monospace; font-size: 16px; letter-spacing: 0.18em; text-transform: uppercase; color: #3A4E78; font-weight: 700; }
  .receipt { margin-top: 14px; font-size: 26px; line-height: 1.45; color: #27272A; }
  .footer { margin-top: auto; display: flex; justify-content: space-between; align-items: flex-end; padding-top: 40px; border-top: 1px solid #EAE3D2; }
  .footer .brand { font-family: 'JetBrains Mono', monospace; font-size: 18px; font-weight: 700; letter-spacing: 0.12em; color: #09090B; text-transform: uppercase; }
  .footer .brand span { color: #9b1c1c; }
  .footer .url { font-family: 'JetBrains Mono', monospace; font-size: 14px; color: #52525B; letter-spacing: 0.04em; text-align: right; }
  </style></head><body>
  <div class="card">
    <div class="top-row">
      <div>
        <div class="eyebrow">Trump 2016 · ${escapeHtml(chapter)}</div>
        <div class="number">Promise #${String(promiseNumber).padStart(3, '0')}</div>
      </div>
      <div class="stamp">${escapeHtml(verdictLabel).split(' ').map(w => `<div>${w}</div>`).join('')}</div>
    </div>

    <div class="promise">${escapeHtml(promiseText)}</div>

    <div class="quote-rule">
      <div class="quote">"${escapeHtml(promiseText)}"<br/><span style="font-style:normal;font-size:20px;color:#52525B;">— Donald Trump, 2016 campaign</span></div>
    </div>

    <div class="receipt-label">What happened</div>
    <div class="receipt">${escapeHtml(receipt)}</div>

    <div class="footer">
      <div class="brand">Campaign<span>Receipts</span>.com</div>
      <div class="url">${escapeHtml(permalink)}</div>
    </div>
  </div>
  </body></html>`
}

export async function GET(req: NextRequest, ctx: { params: { slug: string } }) {
  const combined = decodeURIComponent(ctx.params.slug)
  const [chapterSlug, ...rest] = combined.split('__')
  const promiseSlug = rest.join('__')
  if (!chapterSlug || !promiseSlug) {
    return NextResponse.json({ error: 'Invalid slug format' }, { status: 400 })
  }

  const promise = getPromiseBySlug(chapterSlug, promiseSlug)
  if (!promise) {
    return NextResponse.json({ error: 'Promise not found' }, { status: 404 })
  }

  const verdictHex = VERDICT_HEX[promise.verdict]
  const verdictLabel = VERDICT_LABEL[promise.verdict]
  const receipt =
    promise.verdict_reasoning?.replace(/Full receipts in the book.*$/, '').trim() ||
    `Graded ${verdictLabel} against the public record. Sourced on campaignreceipts.com.`

  const html = cardHtml({
    promiseText: promise.promise_text,
    receipt: receipt.length > 280 ? receipt.slice(0, 277) + '…' : receipt,
    chapter: promise.chapter_short,
    promiseNumber: promise.promise_number,
    verdictHex,
    verdictLabel,
    permalink: `campaignreceipts.com${promise.permalink}`,
  })

  let browser
  try {
    browser = await launchBrowser()
    const page = await browser.newPage()
    await page.setViewport({ width: 1080, height: 1350, deviceScaleFactor: 1 })
    await page.setContent(html, { waitUntil: 'load' })
    const png = await page.screenshot({ type: 'png', omitBackground: false })
    return new NextResponse(new Uint8Array(png as Buffer), {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': `inline; filename="trump-${chapterSlug}-${promiseSlug}.png"`,
        'Cache-Control': 'public, max-age=86400, s-maxage=86400',
      },
    })
  } catch (err) {
    console.error('cite-image render failed', err)
    // Surface the error detail so production failures are diagnosable.
    // (Safe — no PII or secret keys ever surface from a Puppeteer launch
    // failure; the messages are runtime/library complaints.)
    const message = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: 'render failed', detail: message }, { status: 500 })
  } finally {
    if (browser) await browser.close()
  }
}
