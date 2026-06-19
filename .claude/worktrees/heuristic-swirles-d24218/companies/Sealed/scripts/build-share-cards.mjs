/**
 * SEALED — 9:16 verdict-card creator pack (1080×1920).
 *
 * Renders 12 PNG cards via Puppeteer. Each card = one verdict moment:
 * verbatim promise quote + verdict stamp + receipt + source URL + brand bar.
 *
 * All quotes & receipts pulled verbatim from the book corpus:
 *  - lib/landing-content.ts (AIPAC sampleReceipt)
 *  - scripts/build-retail-pdf.mjs (chapter verbatim quotes)
 *  - artifacts/sealed-ch10-2024-commitments.json (2024 platform)
 *
 * Also writes public/share-cards/v1/index.html — a downloadable grid index.
 *
 * Usage:  node scripts/build-share-cards.mjs
 */

import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import puppeteer from 'puppeteer'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')
const OUT_DIR = path.join(ROOT, 'public', 'share-cards', 'v1')

const WIDTH = 1080
const HEIGHT = 1920

// Civic-trust palette (matches tailwind.config.js + sealed2016.com)
const TOKENS = {
  parchment: '#faf7ef',
  parchmentDeep: '#f4ede0',
  ink: '#0f1f3a',
  ink700: '#2a3656',
  ink500: '#6b7896',
  civicRed: '#a4243b',
  civicGold: '#b08a3e',
  civicBlue: '#2a4d7c',
  vKept: '#2f6a48',
  vPartial: '#a86b1a',
  vBroken: '#a4243b',
  vReader: '#6b3a78',
}

const CARDS = [
  {
    n: 1,
    slug: 'aipac-iran-deal',
    chapter: 'AIPAC · Receipt 1 of 3',
    promise:
      'No regime change. The Iran deal stays — preserved or renegotiated.',
    attribution: 'Donald Trump, AIPAC speech · March 21, 2016 · Washington DC',
    verdict: 'BROKEN',
    receipt:
      'May 8, 2018 — US withdrew from the JCPOA. Iran enrichment past pre-deal levels by 2021 (+400% above cap).',
    source: 'state.gov/iran-jcpoa-withdrawal',
  },
  {
    n: 2,
    slug: 'aipac-embassy',
    chapter: 'AIPAC · Receipt 2 of 3',
    promise:
      'America First. End the endless wars. Bring troops home.',
    attribution: 'Donald Trump, campaign trail · 2016',
    verdict: 'KEPT',
    receipt:
      'May 14, 2018 — US Embassy opened in Jerusalem after 4 presidents in a row had refused. 60 Palestinians killed at the Gaza border that day.',
    source: 'state.gov · Proclamation 9683 (Dec 6, 2017)',
    note: 'Verdict applies to the AIPAC ask (move embassy), not the campaign promise.',
  },
  {
    n: 3,
    slug: 'aipac-campus-shield',
    chapter: 'AIPAC · Receipt 3 of 3',
    promise: 'Protect free speech on campus from federal overreach.',
    attribution: 'Donald Trump, 2016 campaign',
    verdict: 'BROKEN',
    receipt:
      'Dec 11, 2019 — Executive Order 13899 applied the IHRA antisemitism definition to Title VI. Every Title VI institution now subject to federal investigation over Israel criticism.',
    source: 'federalregister.gov/EO-13899',
  },
  {
    n: 4,
    slug: 'drain-the-swamp',
    chapter: 'Ch. 2 — Drain the Swamp',
    promise:
      'I will impose a five year ban on executive branch officials becoming lobbyists, and a lifetime ban on officials becoming lobbyists for a foreign government.',
    attribution: 'Donald Trump · Oct 17, 2016 · Gettysburg "Contract" speech',
    verdict: 'BROKEN',
    receipt:
      'EO 13770 (Jan 28, 2017) imposed the ban — then EO 13983 (Jan 19, 2021) revoked it on the way out the door. Net effect: zero.',
    source: 'federalregister.gov/EO-13770 + EO-13983',
  },
  {
    n: 5,
    slug: 'china-tariffs',
    chapter: 'Ch. 7 — Trade · China',
    promise:
      "They're using our country as a piggy bank to rebuild China.",
    attribution: 'Donald Trump · 2016 campaign',
    verdict: 'KEPT',
    receipt:
      '$350B+ in Section 301 tariffs across 4 rounds (2018–2019). Phase One deal signed Jan 15, 2020. Biden kept almost every tariff — proof the shift was bipartisan, not showmanship.',
    source: 'ustr.gov/section-301-investigations',
  },
  {
    n: 6,
    slug: 'repeal-obamacare',
    chapter: 'Ch. 4 — Healthcare',
    promise:
      'We have to repeal it and replace it with something absolutely much less expensive and something that works.',
    attribution: 'Donald Trump · 2016 campaign',
    verdict: 'BROKEN',
    receipt:
      'July 28, 2017 — "Skinny repeal" (H.R. 1628) failed in the Senate 49–51. McCain, Collins, Murkowski voted NO. Seven years of "repeal and replace" produced no replacement bill.',
    source: 'senate.gov/legislative/votes',
  },
  {
    n: 7,
    slug: 'mexico-pays-for-wall',
    chapter: 'Ch. 9 — The Wall',
    promise:
      'Now, I want to build the wall. We need the wall. And the Border Patrol, ICE, they all want the wall.',
    attribution: 'Donald Trump · Oct 19, 2016 · 3rd Las Vegas debate',
    verdict: 'BROKEN',
    receipt:
      "450 miles built — 23% of the 1,954-mile border. Mexico paid $0. The Pentagon paid, via emergency-declaration DOD reallocations. Fentanyl still comes through legal ports.",
    source: 'cbp.gov/border-wall-status + dhs.gov',
  },
  {
    n: 8,
    slug: 'syria-end-wars',
    chapter: 'Ch. 6 — No More Wars',
    promise: 'We will stop racing to topple foreign regimes.',
    attribution: 'Donald Trump · April 27, 2016 · Foreign-policy address',
    verdict: 'PARTIAL',
    receipt:
      'No new major ground deployments. But troops remained in Syria, Iraq, and Africa throughout. Afghanistan ~14,000 through 2019. Doha Agreement (Feb 2020) set the timeline — Biden executed the withdrawal.',
    source: 'state.gov/doha-agreement',
  },
  {
    n: 9,
    slug: 'nato-pay-up',
    chapter: 'Ch. 5 — NATO',
    promise: "I'm a big fan of NATO. But they have to pay up.",
    attribution: 'Donald Trump · 2016 campaign',
    verdict: 'PARTIAL',
    receipt:
      'NATO 2% target was set at the 2014 Wales Summit (pre-Trump). 3 allies met it in 2014 → 10 by 2020 → 23 by 2024. He amplified pressure. Russia\'s 2022 Ukraine invasion was the bigger driver.',
    source: 'nato.int/defence-expenditure-2024',
  },
  {
    n: 10,
    slug: 'chicago-guns',
    chapter: 'Ch. 8 — Law & Order',
    promise:
      'In Chicago, which has the toughest gun laws in the United States, probably you could say by far, they have more gun violence than any other city.',
    attribution: 'Donald Trump · Oct 19, 2016 · 3rd Las Vegas debate',
    verdict: 'READER',
    receipt:
      'ATF trace data shows 60%+ of Chicago crime guns come from out of state — Indiana, Mississippi, Wisconsin. "Strict laws cause violence" is contradicted by where the guns originate. Crime fell 2017–2019, spiked 2020 like everywhere.',
    source: 'atf.gov/firearms-trace-data + fbi.gov/ucr',
  },
  {
    n: 11,
    slug: 'platform-deportation',
    chapter: 'Ch. 10 — 2024 Platform',
    promise:
      'Carry out the largest deportation operation in American history.',
    attribution: 'RNC 2024 platform · "20 Core Promises" · captured Feb 2026',
    verdict: 'KEPT',
    receipt:
      'EO 14159 "Protecting the American People Against Invasion" (Jan 20, 2025) + EO 14157 designating cartels as Foreign Terrorist Organizations initiated mass interior enforcement on day one.',
    source: 'whitehouse.gov/presidential-actions/2025/01',
  },
  {
    n: 12,
    slug: 'platform-who-withdraw',
    chapter: 'Ch. 10 — 2024 Platform',
    promise:
      'Restore Healthcare Freedom. Withdraw the United States from the World Health Organization.',
    attribution: 'RNC 2024 platform · captured Feb 2026 · deleted Jan 20, 2025',
    verdict: 'KEPT',
    receipt:
      'EO 14155 (Jan 20, 2025) — "Withdrawing the United States from the World Health Organization." Signed day one of the second term. Platform text was deleted from the RNC site the same day.',
    source: 'whitehouse.gov/presidential-actions/2025/01/withdrawing-from-who',
  },
]

function verdictColor(v) {
  switch (v) {
    case 'KEPT':
      return TOKENS.vKept
    case 'PARTIAL':
      return TOKENS.vPartial
    case 'BROKEN':
      return TOKENS.vBroken
    case 'READER':
      return TOKENS.vReader
    default:
      return TOKENS.ink
  }
}

function verdictLabel(v) {
  return v === 'READER' ? 'YOU DECIDE' : v
}

function cardHtml(c) {
  const vColor = verdictColor(c.verdict)
  const vLabel = verdictLabel(c.verdict)
  const noteBlock = c.note
    ? `<div class="note">${escapeHtml(c.note)}</div>`
    : ''
  return `<!doctype html>
<html><head><meta charset="utf-8"><style>
  @page { size: ${WIDTH}px ${HEIGHT}px; margin: 0; }
  html, body { margin:0; padding:0; }
  body {
    width: ${WIDTH}px; height: ${HEIGHT}px;
    background: ${TOKENS.parchment};
    font-family: 'Source Serif Pro', 'Source Serif', Georgia, 'Times New Roman', serif;
    color: ${TOKENS.ink};
    position: relative;
    overflow: hidden;
  }
  .topbar {
    position: absolute; top: 0; left: 0; right: 0;
    height: 80px;
    background: ${TOKENS.civicRed};
    color: #faf7ef;
    display: flex; align-items: center; justify-content: space-between;
    padding: 0 56px;
    font-family: 'Source Sans 3', 'Helvetica Neue', Arial, sans-serif;
    font-size: 26px;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    font-weight: 700;
  }
  .topbar .right { font-family: 'Courier New', monospace; letter-spacing: 0.14em; font-size: 22px; opacity: 0.92; }
  .gold-rule {
    position: absolute; top: 80px; left: 0; right: 0;
    height: 3px; background: ${TOKENS.civicGold};
  }
  .chapter-eyebrow {
    position: absolute; top: 130px; left: 64px; right: 64px;
    font-family: 'Source Sans 3', 'Helvetica Neue', Arial, sans-serif;
    font-size: 24px;
    letter-spacing: 0.32em;
    text-transform: uppercase;
    color: ${TOKENS.civicBlue};
    font-weight: 700;
  }
  .promise {
    position: absolute; top: 200px; left: 64px; right: 64px;
    font-family: 'Lora', 'Palatino', Georgia, serif;
    font-style: italic;
    font-size: 56px;
    line-height: 1.22;
    color: ${TOKENS.ink};
    letter-spacing: -0.005em;
  }
  .promise::before { content: '\\201C'; color: ${TOKENS.civicRed}; }
  .promise::after { content: '\\201D'; color: ${TOKENS.civicRed}; }
  .attribution {
    position: absolute; left: 64px; right: 64px;
    top: 720px;
    font-family: 'Source Sans 3', Arial, sans-serif;
    font-size: 24px;
    color: ${TOKENS.ink700};
    letter-spacing: 0.04em;
  }
  .stamp-wrap {
    position: absolute;
    top: 820px;
    left: 50%;
    transform: translateX(-50%) rotate(-5deg);
  }
  .stamp {
    border: 8px solid ${vColor};
    color: ${vColor};
    padding: 22px 60px 18px;
    font-family: 'Source Sans 3', 'Helvetica Neue', Arial, sans-serif;
    font-size: 110px;
    font-weight: 900;
    letter-spacing: 0.06em;
    background: rgba(255,255,255,0.4);
    text-transform: uppercase;
    line-height: 1;
    box-shadow: inset 0 0 0 2px ${vColor};
  }
  .stamp-sub {
    text-align: center;
    margin-top: 6px;
    font-family: 'Courier New', monospace;
    font-size: 16px;
    letter-spacing: 0.32em;
    color: ${vColor};
    text-transform: uppercase;
  }
  .receipt-eyebrow {
    position: absolute; left: 64px; right: 64px;
    top: 1130px;
    font-family: 'Source Sans 3', Arial, sans-serif;
    font-size: 22px;
    letter-spacing: 0.32em;
    text-transform: uppercase;
    color: ${TOKENS.civicRed};
    font-weight: 700;
  }
  .receipt {
    position: absolute; left: 64px; right: 64px;
    top: 1180px;
    font-family: 'Source Sans 3', 'Helvetica Neue', Arial, sans-serif;
    font-size: 36px;
    line-height: 1.4;
    color: ${TOKENS.ink};
    font-weight: 400;
  }
  .note {
    position: absolute; left: 64px; right: 64px;
    top: 1500px;
    font-family: 'Source Sans 3', Arial, sans-serif;
    font-size: 20px;
    color: ${TOKENS.ink500};
    font-style: italic;
  }
  .source {
    position: absolute; left: 64px; right: 64px;
    top: 1570px;
    font-family: 'Courier New', monospace;
    font-size: 22px;
    color: ${TOKENS.civicBlue};
    letter-spacing: 0.02em;
    word-break: break-all;
  }
  .perf {
    position: absolute; bottom: 200px; left: 32px; right: 32px;
    border-top: 4px dashed ${TOKENS.ink500};
    opacity: 0.5;
  }
  .bottom-band {
    position: absolute; bottom: 0; left: 0; right: 0;
    height: 180px;
    background: ${TOKENS.ink};
    color: ${TOKENS.parchment};
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    padding: 0 56px;
    text-align: center;
  }
  .brand {
    font-family: 'Source Sans 3', 'Helvetica Neue', Arial, sans-serif;
    font-size: 44px;
    font-weight: 900;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    color: #faf7ef;
  }
  .scorecard {
    font-family: 'Courier New', monospace;
    font-size: 22px;
    color: ${TOKENS.civicGold};
    letter-spacing: 0.12em;
    margin-top: 10px;
  }
  .scorecard .kept { color: #6bbd8c; }
  .scorecard .partial { color: #e0a25a; }
  .scorecard .broken { color: #e58197; }
  .scorecard .reader { color: #c39ad1; }
</style></head>
<body>
  <div class="topbar">
    <span>SEALED · 2016</span>
    <span class="right">№ ${String(c.n).padStart(2, '0')} / 12</span>
  </div>
  <div class="gold-rule"></div>
  <div class="chapter-eyebrow">${escapeHtml(c.chapter)}</div>
  <div class="promise">${escapeHtml(c.promise)}</div>
  <div class="attribution">— ${escapeHtml(c.attribution)}</div>
  <div class="stamp-wrap">
    <div class="stamp">${vLabel}</div>
    <div class="stamp-sub">SEALED verdict</div>
  </div>
  <div class="receipt-eyebrow">The receipt</div>
  <div class="receipt">${escapeHtml(c.receipt)}</div>
  ${noteBlock}
  <div class="source">source: ${escapeHtml(c.source)}</div>
  <div class="perf"></div>
  <div class="bottom-band">
    <div class="brand">SEALED2016.COM</div>
    <div class="scorecard">
      145 promises · <span class="kept">46 KEPT</span> · <span class="partial">51 PARTIAL</span> · <span class="broken">40 BROKEN</span> · <span class="reader">8 YOU DECIDE</span>
    </div>
  </div>
</body></html>`
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

async function main() {
  await fs.mkdir(OUT_DIR, { recursive: true })
  const browser = await puppeteer.launch({
    headless: 'shell',
    args: ['--no-sandbox'],
  })
  const page = await browser.newPage()
  await page.setViewport({ width: WIDTH, height: HEIGHT, deviceScaleFactor: 1 })

  const written = []
  for (const c of CARDS) {
    const filename = `share-${String(c.n).padStart(2, '0')}-${c.slug}.png`
    const outPath = path.join(OUT_DIR, filename)
    // Use domcontentloaded + explicit fonts.ready. networkidle0 hangs on
    // rapid sequential setContent calls in some puppeteer versions.
    await page.setContent(cardHtml(c), { waitUntil: 'domcontentloaded' })
    await page.evaluate(() => document.fonts ? document.fonts.ready : Promise.resolve())
    await page.screenshot({
      path: outPath,
      type: 'png',
      omitBackground: false,
      clip: { x: 0, y: 0, width: WIDTH, height: HEIGHT },
    })
    const stat = await fs.stat(outPath)
    console.log(`✓ ${filename} (${(stat.size / 1024).toFixed(0)} KB)`)
    written.push({ ...c, filename })
  }
  await browser.close()

  // Build a static index.html with thumbnail grid for quick visual review.
  const indexHtml = `<!doctype html>
<html><head><meta charset="utf-8"><title>SEALED — Share Cards v1</title>
<style>
  body { font-family: -apple-system, system-ui, sans-serif; background:${TOKENS.parchment}; color:${TOKENS.ink}; margin:0; padding:48px; }
  h1 { font-family: Lora, Georgia, serif; font-size:36px; margin:0 0 8px; }
  p  { color:${TOKENS.ink700}; max-width:640px; }
  .grid { display:grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap:24px; margin-top:32px; }
  .card { background:#fff; border:1px solid #e3dac4; border-radius:6px; overflow:hidden; }
  .card img { width:100%; display:block; }
  .card-meta { padding:12px 14px; font-size:13px; }
  .card-meta a { color:${TOKENS.civicRed}; text-decoration:none; font-weight:600; }
</style></head><body>
<h1>SEALED — Share Cards v1</h1>
<p>12 cards, 1080×1920. Right-click → "Save image as…" or click Download. CC0.</p>
<div class="grid">
${written
  .map(
    (c) => `<div class="card">
  <a href="./${c.filename}" download><img src="./${c.filename}" alt="${escapeHtml(c.chapter)}"></a>
  <div class="card-meta">
    <div><strong>#${String(c.n).padStart(2, '0')}</strong> · ${escapeHtml(c.chapter)} · ${c.verdict}</div>
    <a href="./${c.filename}" download>Download PNG</a>
  </div>
</div>`,
  )
  .join('\n')}
</div>
</body></html>`
  await fs.writeFile(path.join(OUT_DIR, 'index.html'), indexHtml, 'utf8')
  console.log(`✓ index.html`)

  // Manifest for the /share route.
  await fs.writeFile(
    path.join(OUT_DIR, 'manifest.json'),
    JSON.stringify(
      written.map((c) => ({
        n: c.n,
        slug: c.slug,
        chapter: c.chapter,
        verdict: c.verdict,
        filename: c.filename,
      })),
      null,
      2,
    ),
    'utf8',
  )
  console.log(`✓ manifest.json`)
  console.log(`\nDone — ${written.length} cards in ${OUT_DIR}`)
}

main().catch((err) => {
  console.error('build-share-cards failed:', err)
  process.exitCode = 1
})
