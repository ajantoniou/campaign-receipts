/**
 * Homepage funnel copy — edit here vs scattered JSX.
 */

/** Main H1 — narrative arc, not academic.
 *
 *  Rewritten 2026-05-16 for the chapter-10 launch (preserved 2024 platform).
 *  The book now delivers BOTH halves: graded 2016 receipts AND verbatim 2024
 *  commitments captured before donaldjtrump.com deleted them. The headline
 *  surfaces both — the deletion is the hook, the grading is the proof. */
export const heroTitle =
  'They deleted the 2024 platform.\nWe kept the receipts — and graded the 2016 ones.'

/** One-line verdict stamp shown directly under the headline.
 *  Civic-red, mono, ~14px. Sits between H1 and the subhead. */
export const heroVerdictStamp =
  '145 promises graded. 46 kept. 51 partial. 40 broken. 8 reader-decides. Plus 52 commitments preserved from the 2024 platform — before the campaign deleted them.'

/** One sentence under the four-portraits. */
export const heroSubhead =
  'An outsider with zero political experience promised to break the system. A decade later, the receipts tell a different story than memory does.'

/** Near-top product promise — short, sharp. */
export const readerPromise =
  '145 verbatim promises, every receipt, the full paper trail — and a blank column for your own verdict.'

/** Captions under the 4 portraits in the hero. */
export const heroPortraits = [
  { src: '/cover-2016.jpg', year: '2016', caption: 'The outsider. The promise.' },
  { src: '/cover-2020.jpg', year: '2023', caption: 'The indictment. 91 counts.' },
  { src: '/cover-2024.jpg', year: '2024', caption: 'The bullet. The fist.' },
  { src: '/cover-2026.jpg', year: '2026', caption: 'The doctor?' },
] as const

/** "Why this book exists" — the emotional spine. */
export const whyThisExists = {
  eyebrow: 'Why this book exists',
  title: 'Memory protects the vote you cast.',
  paragraphs: [
    'If you voted for him, memory remembers the wins. If you voted against him, memory remembers the losses. Both versions are real. Neither is complete.',
    'SEALED preserves the exact words — 145 of them — verbatim, dated, and sourced. Then it pairs each promise with the official paper trail: the filings, the votes, the data, the actual record.',
    'You don’t have to agree with the verdicts. You don’t even have to agree with each other. The book includes a blank column so every reader writes their own scorecard.',
    'And along the way, the paper trail does something most political books can’t: it shows you the donors, the lobbies, the outside pressure shaping policy in plain sight. We all know that influence exists. SEALED is the receipt.',
  ],
} as const

/**
 * Sample receipt — campaign promises BROKEN, AIPAC wishlist DELIVERED instead.
 *
 * Card shape is intentionally TIGHT: a one-line campaign promise (≤14 words),
 * a one-line receipt (≤18 words, with date + concrete number where possible),
 * a verdict stamp, and a compact "magnitude" indicator (the dollar / people /
 * days figure that gives the receipt its punch). Long-form context lives in
 * the book; the storefront card is the stop-scroll moment.
 */
export const sampleReceipt = {
  eyebrow: 'One receipt',
  title: 'What he promised voters.\nWhat he delivered to AIPAC.',
  context:
    'Campaign: no nation-building. AIPAC: kill the Iran deal, move the embassy, expand the antisemitism definition. He delivered all three.',
  promises: [
    {
      campaignPromise: 'No regime change. The Iran deal stays — preserved or renegotiated.',
      campaignVerdict: 'BROKEN',
      aipacAsk: 'Kill the Iran nuclear deal entirely.',
      receipt:
        'May 8, 2018 — US withdrew from the JCPOA. Iran enrichment past pre-deal levels by 2021.',
      magnitudeLabel: 'Enrichment vs pre-deal cap',
      magnitudeValue: '+400%',
    },
    {
      campaignPromise: 'America First. End the endless wars. Bring troops home.',
      campaignVerdict: 'BROKEN',
      aipacAsk: 'Move the US embassy from Tel Aviv to Jerusalem.',
      receipt:
        'May 14, 2018 — Embassy opened in Jerusalem. 60 Palestinians killed at the Gaza border that day.',
      magnitudeLabel: 'Presidents who had refused this move',
      magnitudeValue: '4 in a row',
    },
    {
      campaignPromise: 'Protect free speech on campus from federal overreach.',
      campaignVerdict: 'BROKEN',
      aipacAsk: 'Expand the federal antisemitism definition to cover Israel criticism.',
      receipt:
        'Dec 11, 2019 — Executive Order 13899 applied IHRA to Title VI on campuses.',
      magnitudeLabel: 'Universities now subject to federal investigation for speech',
      magnitudeValue: 'All Title VI institutions',
    },
  ],
  funded: {
    label: 'Who paid for it?',
    body:
      'Sheldon & Miriam Adelson — among the largest individual political donors of the 2010s. ~$82M to Republican committees in 2016 alone (FEC). ~$218M lifetime. Their stated demands: neutralize Iran, move the embassy, shield Israel from campus criticism. Three for three.',
    metric: { value: '$82M', label: '2016 cycle donations (FEC)' },
  },
  closing:
    'Three campaign promises broken. Three donor wishes granted. One chapter, one funder. 144 more receipts in the book.',
} as const

/**
 * "Share it" section — visual-first, prose-light.
 *
 * The illustration carries the meaning: two neighbors of opposite political
 * camps meeting at a backyard fence covered with handmade signs that both
 * sides agree on. The headline is the only copy. Tagline ties the verdict-
 * scorecard mechanic to the share use case.
 */
export const shareItContent = {
  eyebrow: 'Built to be shared',
  title: 'Share it with your neighbor.',
  tagline: 'Built for the people both parties forgot.',
  /** Secondary, quieter sub-line — sits below the main tagline. The original
   *  blank-column line still earns its keep but in a smaller register. */
  subTagline:
    'The blank column is your verdict. Your kid’s. Your parent’s. The neighbor you stopped talking to in 2020.',
  imageSrc: '/share-with-your-neighbor.jpg',
  imageAlt:
    'Editorial illustration: two neighbors — one in a red cap, one in a navy fleece — shaking hands over a backyard fence covered in handmade signs reading "No AIPAC money," "No more wars," "Seniors can\'t afford medicine," "Students buried in debt."',
} as const

/** @deprecated Use `readerPromise` — internal alias retained for historical imports. */
export const buyerPromise = readerPromise

/** @deprecated Use `heroSubhead` — internal alias retained for historical imports. */
export const heroHookLine = heroSubhead

/** Short bullets beside hero CTAs — aligned to simplified Lemon-ready offer. */
export const heroCredibilityBullets = [
  '145 verbatim promises from rallies, debates, interviews — sourced and dated.',
  'Every promise graded against the record — 46 kept, 51 partial, 40 broken, 8 reader-decides. Receipts shown; override our calls.',
  'Delivered as a watermarked PDF — your name on every page, no resale, no DRM theater.',
] as const

/** Stat bar (below hero). */
export const heroStatBar = [
  { label: '145 documented promises', detail: 'Campaign-era ledger' },
  { label: 'Illustrated reference', detail: 'Plates per cluster' },
  { label: 'Debates · rallies · interviews', detail: 'Source mix' },
  { label: 'PDF · ePub · toolkit tier', detail: 'Standard or bundle' },
] as const

/** Elevated early — why the archive exists now (reader-forward, not editorial). */
export const whyBookExists = {
  title: 'Memory loses. Receipts don’t.',
  paras: [
    '2015 and 2016 were a flood of promises — drain the swamp, fair trade not free trade, end forever wars, fix healthcare. A decade later, most readers can’t cleanly recall who promised what, when, or where.',
    'SEALED preserves those exact words — 145 of them — verbatim, dated, and sourced. Then it pairs each one with the official paper trail: the filings, votes, and documents that show what actually happened.',
    'And it doesn’t stop at the receipt. Each entry also tells you **what shaped the promise** — the rally, the audience, the donor and primary-season pressure that made it land — and **what likely made the campaign backtrack** once the keys were handed over.',
    'Use it to win an argument with sources, prep for a debate, ground a piece of journalism, or just check your own memory against the public record.',
  ],
} as const

export const productPreviewCards = [
  {
    title: '145 verbatim promises',
    body: 'Every quote dated, sourced, and pulled from rallies, debates, and interviews — not paraphrased.',
  },
  {
    title: 'Color-coded verdicts',
    body: 'Kept · partial · broken · blocked · you decide. Visual scorecard you can scan in seconds.',
  },
  {
    title: 'Receipts on every page',
    body: 'Each promise paired with the official filings, votes, and documents that test it. No editorial scoring imposed.',
  },
  {
    title: 'Why-it-mattered context',
    body: 'For each promise: the rally and audience that produced it, plus what likely made the campaign backtrack later.',
  },
  {
    title: 'Watermarked PDF, instant delivery',
    body: 'Each copy is individually licensed: your name and checkout email watermarked on every page, plus order number and personal-use notice. Real email — that’s the deterrent. Delivered in minutes.',
  },
] as const

export const whyReadersBuy = [
  'Settle arguments with the actual quote — not a paraphrase, not a clip.',
  'Compare promises to the public record — every line is paired with official paper trails.',
  'Read what shaped each promise — and what likely made the campaign backtrack after the election.',
  'Use it as debate prep, journalism backup, classroom material, or your own read on delivery — the optional one-pager is only there if you still want that layer.',
] as const

export const audiencePositioningLine =
  'For journalists, researchers, students, debaters, supporters, critics, and anyone who’d rather argue from the record than around it.'

export const methodologySteps = [
  { title: 'Sourced', body: 'Every quote is pulled from a 2015–2016 debate, rally, televised interview, or campaign-published document — citation included.' },
  { title: 'Verbatim', body: 'No paraphrase, no editing for tone. If we couldn’t quote it cleanly, it didn’t make the book.' },
  { title: 'Context', body: 'What shaped each promise — the rally, the audience, the donor and primary-season pressure — drawn from contemporaneous coverage so the line lands the way it landed then.' },
  { title: 'Receipts', body: 'Each promise is paired with the official paper trail — filings, votes, and documents — plus a plain-English read on what likely made the campaign backtrack after the election.' },
] as const

/** Editorial-context pitch — sits between the sample preview and verification cards. */
export const editorialContext = {
  eyebrow: 'Why this beats Googling the quote',
  title: 'We show you what shaped each promise — and what made them backtrack.',
  intro:
    'Verbatim quotes are step one. SEALED also walks you through the rally context, the audience in the room, the donor and primary-season pressure shaping the line — and the post-election reality that often pulled the campaign back from it.',
  cards: [
    {
      id: 'shaped',
      glyph: 'magnifier' as const,
      label: 'What shaped it',
      body: 'The time, place, audience, and pressure surrounding the promise — drawn from contemporaneous coverage and the campaign’s own published materials. So the line reads the way it read then.',
    },
    {
      id: 'paper-trail',
      glyph: 'paper-trail' as const,
      label: 'The paper trail and the backtrack',
      body: 'What followed once the votes were counted: USTR notices, LD-2 filings, budget tables, votes, executive orders — plus a plain-English note on the constraints that likely made the campaign retreat from the original line.',
    },
  ],
} as const

/** Reader-facing verification paths — mirrors `artifacts/sealed-v1-content.md`. */
export const verificationPathCards = [
  {
    id: 'trade',
    label: 'Trade — promise vs paper trail',
    lead:
      'Want to know whether “fair trade, not free trade” actually became policy? Read the rally line in SEALED, then open the official paper trail paired right next to it: USTR releases, the USMCA text, and the tariff schedules.',
    support:
      'You aren’t handed our verdict — you’re handed the documents that decide it. Plus a plain-English note on what likely made the campaign retreat from the original line.',
  },
  {
    id: 'lobbyists',
    label: 'Drain the swamp — promise vs paper trail',
    lead:
      'Test “I’m not going to let them control our country anymore” against the Senate LD-2 lobbying filings and the revolving-door hires that followed. SEALED puts the pledge and its paper trail on the same page.',
    support:
      'Filings don’t argue. Match them to the promise — read why the line landed in 2016 and what shifted after the election — and the score is yours, not ours.',
  },
] as const

/** @deprecated Use `verificationPathCards` */
export const verificationHookCards = verificationPathCards

export type TocItem = { title: string; blurb: string }

export const tocPreview: readonly TocItem[] = [
  { title: 'Foreword (2026)', blurb: 'Why the “before” still matters once the record is in.' },
  { title: 'How to use this book', blurb: 'Promise → quote → receipts → your verdict.' },
  { title: 'Sourcing notes', blurb: 'Where every quote comes from — and what was excluded.' },
  { title: 'Promise-to-reality lanes', blurb: 'Verbatim 2015–2016 lines paired with the filings that test them.' },
  {
    title: 'Delivery snapshot (one page)',
    blurb: 'Kept vs not kept — and whether you care — for readers still weighing rhetoric against outcomes. Everyone else can skip it.',
  },
  { title: 'Case studies', blurb: 'Lobbyists · trade · military · healthcare (sampled).' },
  { title: 'Appendices', blurb: 'License notes · scope · how citations are formatted.' },
] as const

/** Chapter teaser — 10 chapters, with the 3 strongest-hook chapters surfaced
 *  by default and the remaining 7 hidden behind a <details> expander on the
 *  storefront. Chapter 10 (the deleted 2024 platform) is intentionally one
 *  of the three "above the fold" cards: it's the new hook the headline
 *  rewrites around. Each entry carries the verdict-stamp tag so readers can
 *  scan kept/partial/broken/you-decide at a glance. */
export type ChapterTeaserCard = {
  number: string
  title: string
  verdict: 'KEPT' | 'PARTIAL' | 'BROKEN' | 'YOU DECIDE' | 'OUTCOMES PENDING'
  hook: string
  highlight?: boolean
}

export const chapterTeaserPrimary: readonly ChapterTeaserCard[] = [
  {
    number: 'Chapter 6',
    title: 'Middle East',
    verdict: 'PARTIAL',
    hook: 'Iran deal killed. Embassy moved. IHRA on every campus. The cleanest donor-to-policy paper trail in the book.',
  },
  {
    number: 'Chapter 4',
    title: 'Healthcare',
    verdict: 'BROKEN',
    hook: 'Seven years of "repeal and replace" — no replacement. Premiums kept climbing. The killing vote came from inside the party.',
  },
  {
    number: 'Chapter 10',
    title: 'What was promised in 2024',
    verdict: 'OUTCOMES PENDING',
    hook: 'NEW — 52 commitments preserved from the deleted 2024 platform. 7 already Day-1 EOs. 20 in progress.',
    highlight: true,
  },
] as const

export const chapterTeaserRemaining: readonly ChapterTeaserCard[] = [
  {
    number: 'Chapter 1',
    title: 'Trade',
    verdict: 'KEPT',
    hook: 'TPP killed Day 3. NAFTA torn up. $350B in China tariffs. The rare chapter where promise matches outcome.',
  },
  {
    number: 'Chapter 2',
    title: 'Drain the Swamp',
    verdict: 'BROKEN',
    hook: 'New tenants moved in. K Street\'s revolving door spun faster, not slower. The LD-2 filings tell it.',
  },
  {
    number: 'Chapter 3',
    title: 'Jobs & Factories',
    verdict: 'PARTIAL',
    hook: 'Carrier in Indianapolis: a bet with names. We check them — and the 2017–2019 line — against BLS data.',
  },
  {
    number: 'Chapter 5',
    title: 'NATO & Burden-Sharing',
    verdict: 'PARTIAL',
    hook: 'Three allies met 2% in 2014. Ten by 2020. He took credit; the trend started before him.',
  },
  {
    number: 'Chapter 7',
    title: 'China',
    verdict: 'KEPT',
    hook: 'Biden kept almost every Trump-era China tariff. Bipartisan shift hiding inside a partisan fight.',
  },
  {
    number: 'Chapter 8',
    title: 'The Wall',
    verdict: 'PARTIAL',
    hook: '450 miles built. Mexico didn\'t pay. The Pentagon did — via emergency-declaration DOD reallocations.',
  },
  {
    number: 'Chapter 9',
    title: 'Law & Order',
    verdict: 'YOU DECIDE',
    hook: 'Crime fell 2017–2019, spiked in 2020 — as it did everywhere. Policy, trend, or COVID? You pick.',
  },
] as const

/** Single explicit neutrality line — use once on-page (author strip + FAQ). */
export const neutralityStatement =
  'Primary-source reference work — not a party endorsement. We grade every promise (46 kept · 51 partial · 40 broken · 8 reader-decides) and show every receipt so you can override our calls.'

export const faqItems = [
  {
    q: 'What is SEALED?',
    a: 'A digital book that preserves 145 of Donald Trump’s 2015–2016 campaign promises — verbatim, sourced, and dated — and pairs each one with the official filings, votes, and documents that show what actually happened. We grade every promise against the record (46 kept · 51 partial · 40 broken · 8 reader-decides) and we show every receipt so you can dispute our calls. No pundit middle layer. Editorial verdicts in plain sight, with the paper trail next to them.',
  },
  {
    q: 'Is this partisan?',
    a: `${neutralityStatement}`,
  },
  {
    q: 'What do I get for $25?',
    a: 'The 6×9 trade paperback (112 pages, 14 original illustrations), drop-shipped from Lulu — plus the complete illustrated PDF and ePub bundled the day you order, so you start reading immediately while the book ships. Inside: 145 campaign promises, color-coded verdicts (kept / partial / broken / blocked / you decide), every receipt with date, location, and source. The bundled PDF is individually licensed and watermarked with your name, the email you use at checkout, and your order number on every page, along with a personal-use notice. Note: the email is the real one, not a hash. That’s the deterrent — but it also means if you ever forward the PDF, you’re publishing your own email address with it. We don’t print your home address in the PDF.',
  },
  {
    q: 'How are payments handled?',
    a: 'See our Terms (linked in the footer) for the full purchase and delivery details.',
  },
  {
    q: 'Is there a refund policy?',
    a: 'Yes — full details in our Terms (linked in the footer).',
  },
] as const

export const authorAttributionLine =
  'Compiled by the CampaignReceipts.com research, data, and analytics team using publicly archived campaign records and primary-source transcripts.'

/** Free-share editorial illustrations — viral marketing loop. */
export const freeIllustrations = [
  {
    title: 'The Swamp Machine',
    caption: 'K Street, the lobbyist economy, and the “drained” swamp.',
    slug: 'swamp',
    shareText: 'The K Street swamp didn’t drain — it got new tenants. Free poster from SEALED.',
  },
  {
    title: 'Trade Wars, Tear-Up Edition',
    caption: 'TPP killed Day 3. NAFTA torn up. Tariffs launched.',
    slug: 'trade',
    shareText: 'TPP killed on Day 3. $350B in China tariffs launched. The clearest promise-kept of the term. Free poster from SEALED.',
  },
  {
    title: 'Jobs & The Numbers Game',
    caption: 'What the unemployment chart actually says — and doesn’t.',
    slug: 'jobs',
    shareText: 'Unemployment 4.7% → 3.5% — but the trend started in 2010. Free poster from SEALED.',
  },
  {
    title: 'The Healthcare Wreckage',
    caption: 'Repeal-and-replace, except there was no replace.',
    slug: 'healthcare',
    shareText: 'Seven years of “repeal and replace” without a replacement plan. Free poster from SEALED.',
  },
  {
    title: 'The NATO Bill',
    caption: 'Pay up — or else. Did they pay? Did it matter?',
    slug: 'nato',
    shareText: '3 NATO allies met the 2% target in 2014. 10 by 2020. Free poster from SEALED.',
  },
  {
    title: 'Middle East Pivot',
    caption: 'ISIS, Iran, the embassy, and the Russia dream that wasn’t.',
    slug: 'middleeast',
    shareText: 'The Middle East scorecard: what voters were promised vs. what got delivered. Free poster from SEALED.',
  },
  {
    title: 'The China Fight',
    caption: '$350B in tariffs. The fight was real. The result is debatable.',
    slug: 'china',
    shareText: 'The China trade war: $350B in tariffs across four rounds. Free poster from SEALED.',
  },
  {
    title: 'The Wall Receipt',
    caption: '450 miles built. Mexico didn’t pay. Funded by DOD raids.',
    slug: 'wall',
    shareText: '450 miles of wall built. Mexico didn’t pay. The Pentagon did. Free poster from SEALED.',
  },
  {
    title: 'Law, Order, and the Data',
    caption: 'Crime fell, then spiked. Which presidency owned which?',
    slug: 'laworder',
    shareText: 'The Law & Order chapter — the data is messier than either party claims. Free poster from SEALED.',
  },
] as const
