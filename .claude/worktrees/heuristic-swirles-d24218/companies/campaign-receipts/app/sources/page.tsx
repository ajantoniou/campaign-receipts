import { FileText, ExternalLink, Archive, ShieldCheck, Camera } from 'lucide-react'
import Image from 'next/image'
import type { Metadata } from 'next'
import TrustSurface from '@/app/components/TrustSurface'

export const metadata: Metadata = {
  title: 'Primary Sources — CampaignReceipts',
  description:
    'Canonical archive of primary-source documents that ground every verdict on CampaignReceipts.com. Free, mirrored, citable, durable.',
  openGraph: {
    title: 'Primary Sources — CampaignReceipts',
    description:
      'Canonical archive of primary-source documents that ground every verdict on CampaignReceipts.com.',
    type: 'website',
  },
}

type Source = {
  title: string
  date: string
  venue: string
  description: string
  localPath?: string
  subLinks?: { label: string; slug: string; path: string; screenshot?: string }[]
  originalUrl: string
  originalHost: string
  mirrors: { url: string; host: string }[]
  notes?: string
}

const sources: Source[] = [
  {
    title: 'Contract with the American Voter',
    date: '2016-10-22',
    venue: 'Gettysburg, Pennsylvania',
    description:
      "Donald Trump's signed 28-point campaign document, presented as a 'pledge to the American Voter'. Covers six ethics actions, seven worker-protection actions, five security/rule-of-law actions, and a ten-bill '100-day action plan'.",
    localPath: '/sources/CONTRACT_FOR_THE_AMERICAN_VOTER.pdf',
    originalUrl: 'https://cdn.factcheck.org/UploadedFiles/CONTRACT_FOR_THE_VOTER.pdf',
    originalHost: 'cdn.factcheck.org',
    mirrors: [
      {
        url: 'https://www.documentcloud.org/documents/3675384-Trump-Contract-with-the-American-Voter/',
        host: 'documentcloud.org',
      },
      {
        url: 'https://www.scribd.com/document/328525555/Donald-J-Trump-Contract-for-the-American-Voter',
        host: 'scribd.com',
      },
    ],
    notes:
      'The original campaign-site PDF (assets.donaldjtrump.com/CONTRACT_FOR_THE_AMERICAN_VOTER.pdf) was never crawled by the Internet Archive. FactCheck.org hosts the canonical copy. We mirror it here against the small risk that any single third-party CDN takes the file down.',
  },
  {
    title: 'Trump Campaign Policy Pages — 2016 Election Day Snapshots',
    date: '2016-11-07',
    venue: 'donaldjtrump.com',
    description:
      'Five policy pages from the official 2016 Trump campaign website, archived via the Wayback Machine closest to Election Day (2016-11-07). Seven requested policy pages (healthcare, immigration-reform, second-amendment, veterans-affairs, childcare, lobbying-reform, cyber-policy) were never crawled by the Internet Archive and are not available.',
    subLinks: [
      { label: 'Trade', slug: 'trade', path: '/sources/policy-trade-2016-snapshot.html', screenshot: '/sources/policy-trade-2016-screenshot.png' },
      { label: 'Economy', slug: 'economy', path: '/sources/policy-economy-2016-snapshot.html', screenshot: '/sources/policy-economy-2016-screenshot.png' },
      { label: 'Regulations', slug: 'regulations', path: '/sources/policy-regulations-2016-snapshot.html', screenshot: '/sources/policy-regulations-2016-screenshot.png' },
      { label: 'Tax Plan', slug: 'tax-plan', path: '/sources/policy-tax-plan-2016-snapshot.html', screenshot: '/sources/policy-tax-plan-2016-screenshot.png' },
      { label: 'National Defense', slug: 'national-defense', path: '/sources/policy-national-defense-2016-snapshot.html', screenshot: '/sources/policy-national-defense-2016-screenshot.png' },
    ],
    originalUrl: 'https://web.archive.org/web/20161107000000*/https://www.donaldjtrump.com/policies/',
    originalHost: 'web.archive.org',
    mirrors: [
      {
        url: 'https://www.donaldjtrump.com/policies/',
        host: 'donaldjtrump.com (redirect)',
      },
    ],
    notes:
      'Snapshots fetched with the id_/ infix to retrieve raw archived content without Wayback Machine wrapper chrome. The 2016-11-07 timestamp is a nearest-match request; Internet Archive serves the closest available crawl for each URL.',
  },
  {
    title: 'Trump 2024 Campaign Platform — Issues Pages (Currently Being Graded)',
    date: '2024-11-05',
    venue: 'donaldjtrump.com/issues',
    description:
      'Fifteen policy/issues pages from the official Trump-Vance 2024 campaign website, mirrored here on 2026-05-14 — while the current term is actively being graded. The live campaign site removed these policy pages after the election; they are preserved here via Wayback Machine snapshots (archived 2026-02-21). This is the receipt for the receipts: the exact policy commitments the 2024 campaign made, preserved before edits or deletions. Covers economy, trade, energy, borders, immigration, healthcare, education, veterans, safety, speech, rights, strength, integrity, cartels, and dismantling the deep state.',
    subLinks: [
      { label: 'Issues Index', slug: 'issues-index', path: '/sources/trump-2024-issues-index-snapshot.html', screenshot: '/sources/policy-issues-index-2024-screenshot.png' },
      { label: 'Economy', slug: 'economy', path: '/sources/trump-2024-issues-economy-snapshot.html', screenshot: '/sources/policy-economy-2024-screenshot.png' },
      { label: 'Trade', slug: 'trade', path: '/sources/trump-2024-issues-trade-snapshot.html', screenshot: '/sources/policy-trade-2024-screenshot.png' },
      { label: 'Borders', slug: 'borders', path: '/sources/trump-2024-issues-borders-snapshot.html', screenshot: '/sources/policy-borders-2024-screenshot.png' },
      { label: 'Immigration', slug: 'immigration', path: '/sources/trump-2024-issues-immigration-snapshot.html', screenshot: '/sources/policy-immigration-2024-screenshot.png' },
      { label: 'Veterans', slug: 'veterans', path: '/sources/trump-2024-issues-veterans-snapshot.html', screenshot: '/sources/policy-veterans-2024-screenshot.png' },
      { label: 'Safety', slug: 'safety', path: '/sources/trump-2024-issues-safety-snapshot.html', screenshot: '/sources/policy-safety-2024-screenshot.png' },
      { label: 'Speech', slug: 'speech', path: '/sources/trump-2024-issues-speech-snapshot.html', screenshot: '/sources/policy-speech-2024-screenshot.png' },
      { label: 'Rights', slug: 'rights', path: '/sources/trump-2024-issues-rights-snapshot.html', screenshot: '/sources/policy-rights-2024-screenshot.png' },
      { label: 'Strength', slug: 'strength', path: '/sources/trump-2024-issues-strength-snapshot.html', screenshot: '/sources/policy-strength-2024-screenshot.png' },
      { label: 'Cartels', slug: 'cartels', path: '/sources/trump-2024-issues-cartels-snapshot.html', screenshot: '/sources/policy-cartels-2024-screenshot.png' },
      // HTML mirror only — Wayback's crawls of these 5 pages didn't capture
      // full policy content (the snapshots returned the Wayback "not
      // available" wrapper at every available timestamp). We host the HTML
      // mirror so the citation chain doesn't 404, but we can't show a
      // screenshot of content that was never archived.
      { label: 'Energy', slug: 'energy', path: '/sources/trump-2024-issues-energy-snapshot.html' },
      { label: 'Healthcare', slug: 'healthcare', path: '/sources/trump-2024-issues-healthcare-snapshot.html' },
      { label: 'Education', slug: 'education', path: '/sources/trump-2024-issues-education-snapshot.html' },
      { label: 'Integrity', slug: 'integrity', path: '/sources/trump-2024-issues-integrity-snapshot.html' },
      { label: 'Dismantle Deep State', slug: 'dismantle', path: '/sources/trump-2024-issues-dismantle-snapshot.html' },
    ],
    originalUrl: 'https://www.donaldjtrump.com/issues',
    originalHost: 'donaldjtrump.com',
    mirrors: [
      { url: 'https://web.archive.org/web/20260221222030/https://www.donaldjtrump.com/issues', host: 'web.archive.org (2026-02-21)' },
    ],
    notes:
      'The live donaldjtrump.com site as of May 2026 is a donate-only page with no policy content. All 15 issues sub-pages were removed post-election. HTML mirrors for all 15 pages are preserved here from Wayback snapshots dated 2026-02-21. Visual screenshots (Wayback wrapper + page body) were renderable for 10 pages; the other 5 (Energy, Healthcare, Education, Integrity, Dismantle Deep State) have HTML mirrors only — Wayback never captured their full policy bodies at any available timestamp. A fresh Wayback save was triggered on 2026-05-14 for every URL.',
  },
  {
    title: 'Trump-Vance Agenda47 — Policy Video Archive (Currently Being Graded)',
    date: '2023-01-01',
    venue: 'donaldjtrump.com/agenda47',
    description:
      'The Agenda47 series was the Trump campaign\'s primary 2024 policy announcement vehicle — 30+ short videos covering every major platform commitment. This is the index page, preserved from the Wayback Machine (archived 2026-02-16). Topics include: ending birthright citizenship, the American Academy, no welfare for illegal aliens, veteran homelessness, fighting cartels, dismantling the deep state, reciprocal trade, energy dominance, military rebuilding, and more. Each video title is a campaign promise now being tracked and graded on CampaignReceipts.com.',
    localPath: '/sources/trump-2024-agenda47-snapshot.html',
    subLinks: [
      { label: 'Agenda47 — Page Screenshot', slug: 'agenda47-screenshot', path: '/sources/policy-agenda47-2024-screenshot.png', screenshot: '/sources/policy-agenda47-2024-screenshot.png' },
    ],
    originalUrl: 'https://www.donaldjtrump.com/agenda47',
    originalHost: 'donaldjtrump.com',
    mirrors: [
      { url: 'https://web.archive.org/web/20260216061601/https://www.donaldjtrump.com/agenda47', host: 'web.archive.org (2026-02-16)' },
    ],
    notes:
      'The live donaldjtrump.com no longer hosts Agenda47 content as of May 2026. Mirrored from Wayback Machine snapshot 20260216061601. A fresh Wayback save was triggered on 2026-05-14. The full-page screenshot (7.5MB, captured at 2× device-scale) preserves the visual record of the Agenda47 video index as it appeared in February 2026.',
  },
  {
    title: '2024 Republican Party Platform — "Make America Great Again" (Currently Being Graded)',
    date: '2024-07-08',
    venue: 'rncplatform.donaldjtrump.com',
    description:
      'The official 20-promise, 10-chapter Republican Party platform adopted at the 2024 Republican National Convention, July 8 2024. This is the canonical written policy document for the term currently being graded. Chapters cover: defeating inflation, sealing the border, building the greatest economy, the American Dream, protecting workers and farmers, protecting seniors, K-12 education, renewing American civilization, government of the people, and peace through strength. The platform opens with 20 specific promises — this PDF is the baseline for every promise verdict on CampaignReceipts.com.',
    localPath: '/sources/trump-2024-rnc-platform.pdf',
    subLinks: [
      { label: 'Platform — Page Screenshot', slug: 'platform-screenshot', path: '/sources/policy-platform-2024-screenshot.png', screenshot: '/sources/policy-platform-2024-screenshot.png' },
    ],
    originalUrl: 'https://rncplatform.donaldjtrump.com/',
    originalHost: 'rncplatform.donaldjtrump.com',
    mirrors: [
      { url: 'https://web.archive.org/web/20260515013654/https://rncplatform.donaldjtrump.com/', host: 'web.archive.org (2026-05-15)' },
    ],
    notes:
      'The rncplatform.donaldjtrump.com URL serves the PDF directly. A fresh Wayback save was triggered on 2026-05-14 (saved as timestamp 20260515013654). The PDF is 146KB, 16 pages. Visual screenshot of the platform landing page is also preserved.',
  },
  {
    title: 'Bernie Sanders 2020 Presidential Campaign — Issues Pages',
    date: '2020-03-01',
    venue: 'berniesanders.com/issues',
    description:
      "Six policy pages from Bernie Sanders' 2020 presidential primary campaign website, preserved from the Wayback Machine (nearest snapshot 2020-03-01, peak primary season). The 2020 berniesanders.com platform documented ~40 issue commitments — we mirror the index plus five marquee planks: Medicare for All, the Green New Deal, College for All / Cancel Student Debt, Housing for All, and Workplace Democracy. The original site has since been restructured; these snapshots are the durable record of the policy commitments the campaign ran on.",
    subLinks: [
      { label: 'Issues Index', slug: 'bernie-2020-issues-index', path: '/sources/bernie-sanders-2020-issues-index-snapshot.html' },
      { label: 'Medicare for All', slug: 'bernie-2020-m4a', path: '/sources/bernie-sanders-2020-medicare-for-all-snapshot.html' },
      { label: 'Green New Deal', slug: 'bernie-2020-gnd', path: '/sources/bernie-sanders-2020-green-new-deal-snapshot.html' },
      { label: 'College for All', slug: 'bernie-2020-college', path: '/sources/bernie-sanders-2020-college-for-all-snapshot.html' },
      { label: 'Housing for All', slug: 'bernie-2020-housing', path: '/sources/bernie-sanders-2020-housing-all-snapshot.html' },
      { label: 'Workplace Democracy', slug: 'bernie-2020-workplace', path: '/sources/bernie-sanders-2020-workplace-democracy-snapshot.html' },
    ],
    originalUrl: 'https://berniesanders.com/issues/',
    originalHost: 'berniesanders.com',
    mirrors: [
      { url: 'https://web.archive.org/web/20200301000000*/berniesanders.com/issues', host: 'web.archive.org' },
    ],
    notes:
      'Snapshots fetched via the Wayback id_/ infix at the 2020-03-01 timestamp (closest available crawl per URL). A fresh Wayback save was attempted for each URL on 2026-05-14 (anonymous IA Save Page Now endpoint, partial success due to IA rate limiting; existing Wayback snapshots used as source data remain durably preserved by the Internet Archive). HTML-only mirror — no Puppeteer screenshots in this pass.',
  },
  {
    title: 'Ted Cruz 2016 Presidential Campaign — Issues Pages',
    date: '2016-03-01',
    venue: 'tedcruz.org/issues',
    description:
      "Nine policy pillars from Ted Cruz's 2016 presidential primary campaign website (tedcruz.org), preserved from the Wayback Machine (nearest snapshot 2016-03-01, Super Tuesday window). Covers: Jobs and Opportunity, Secure the Border, Religious Liberty, Defend our Nation, Life Marriage and Family, Second Amendment Rights, Rein In Washington, Restore the Constitution, and Stand with Israel. These are the platform commitments Cruz ran on as a sitting senator — the same senator currently graded on CampaignReceipts.com.",
    subLinks: [
      { label: 'Issues Index', slug: 'cruz-2016-index', path: '/sources/ted-cruz-2016-issues-index-snapshot.html' },
      { label: 'Jobs & Opportunity', slug: 'cruz-2016-jobs', path: '/sources/ted-cruz-2016-jobs-and-opportunity-snapshot.html' },
      { label: 'Secure the Border', slug: 'cruz-2016-border', path: '/sources/ted-cruz-2016-secure-the-border-snapshot.html' },
      { label: 'Religious Liberty', slug: 'cruz-2016-religious', path: '/sources/ted-cruz-2016-religious-liberty-snapshot.html' },
      { label: 'Defend our Nation', slug: 'cruz-2016-defense', path: '/sources/ted-cruz-2016-defend-our-nation-snapshot.html' },
      { label: 'Life, Marriage, Family', slug: 'cruz-2016-life', path: '/sources/ted-cruz-2016-life-marriage-and-family-snapshot.html' },
      { label: 'Second Amendment', slug: 'cruz-2016-2a', path: '/sources/ted-cruz-2016-second-amendment-rights-snapshot.html' },
      { label: 'Rein In Washington', slug: 'cruz-2016-rein', path: '/sources/ted-cruz-2016-rein-in-washington-snapshot.html' },
      { label: 'Restore the Constitution', slug: 'cruz-2016-constitution', path: '/sources/ted-cruz-2016-restore-the-constitution-snapshot.html' },
      { label: 'Stand with Israel', slug: 'cruz-2016-israel', path: '/sources/ted-cruz-2016-stand-with-israel-snapshot.html' },
    ],
    originalUrl: 'https://www.tedcruz.org/issues/',
    originalHost: 'tedcruz.org',
    mirrors: [
      { url: 'https://web.archive.org/web/20160301000000*/tedcruz.org/issues', host: 'web.archive.org' },
    ],
    notes:
      'Full coverage of the tedcruz.org/issues sub-tree at the nearest-to-Super-Tuesday timestamp. HTML mirrors via the Wayback id_/ infix. A fresh Wayback save was attempted for each URL on 2026-05-14 (anonymous IA Save Page Now endpoint, partial success due to IA rate limiting; existing Wayback snapshots used as source data remain durably preserved by the Internet Archive).',
  },
  {
    title: 'Joe Biden 2020 Presidential Campaign — Joe\'s Vision & Platform Pages',
    date: '2020-06-01',
    venue: 'joebiden.com',
    description:
      "Ten platform pages from Joe Biden's 2020 presidential campaign website, preserved from the Wayback Machine (nearest snapshot 2020-06-01, post-primary unity period). Includes the master 'Joe's Vision' index plus nine marquee policy pages: climate, healthcare, immigration, justice, education, housing, infrastructure, empowering workers, and gun safety. These are the explicit campaign commitments that became the baseline for the Biden administration's term — preserved here for accountability.",
    subLinks: [
      { label: "Joe's Vision (Index)", slug: 'biden-2020-vision', path: '/sources/joe-biden-2020-vision-snapshot.html' },
      { label: 'Climate', slug: 'biden-2020-climate', path: '/sources/joe-biden-2020-climate-snapshot.html' },
      { label: 'Healthcare', slug: 'biden-2020-healthcare', path: '/sources/joe-biden-2020-healthcare-snapshot.html' },
      { label: 'Immigration', slug: 'biden-2020-immigration', path: '/sources/joe-biden-2020-immigration-snapshot.html' },
      { label: 'Criminal Justice', slug: 'biden-2020-justice', path: '/sources/joe-biden-2020-justice-snapshot.html' },
      { label: 'Education', slug: 'biden-2020-education', path: '/sources/joe-biden-2020-education-snapshot.html' },
      { label: 'Housing', slug: 'biden-2020-housing', path: '/sources/joe-biden-2020-housing-snapshot.html' },
      { label: 'Infrastructure', slug: 'biden-2020-infrastructure', path: '/sources/joe-biden-2020-infrastructure-snapshot.html' },
      { label: 'Empower Workers', slug: 'biden-2020-workers', path: '/sources/joe-biden-2020-empowerworkers-snapshot.html' },
      { label: 'Gun Safety', slug: 'biden-2020-guns', path: '/sources/joe-biden-2020-gunsafety-snapshot.html' },
    ],
    originalUrl: 'https://joebiden.com/joes-vision/',
    originalHost: 'joebiden.com',
    mirrors: [
      { url: 'https://web.archive.org/web/20200601000000*/joebiden.com', host: 'web.archive.org' },
    ],
    notes:
      'joebiden.com redirected to the White House site during the Biden administration and the campaign-era policy URLs no longer resolve to original content. HTML mirrors preserved via the Wayback id_/ infix. A fresh Wayback save was attempted for each URL on 2026-05-14 (anonymous IA Save Page Now endpoint, partial success due to IA rate limiting; existing Wayback snapshots used as source data remain durably preserved by the Internet Archive).',
  },
  {
    title: 'Marco Rubio 2016 Presidential Campaign — Issues',
    date: '2016-03-01',
    venue: 'marcorubio.com/issues',
    description:
      "Marco Rubio's 2016 presidential primary campaign issues hub and one detail page (Protecting Life at Every Stage), preserved from the Wayback Machine (nearest snapshot 2016-03-01). The marcorubio.com issues sub-tree was sparse compared to peer campaigns — the index page is the substantive policy document; only one issue sub-page (Protecting Life) was independently crawled by the Wayback Machine in the primary cycle window.",
    subLinks: [
      { label: 'Issues Index', slug: 'rubio-2016-index', path: '/sources/marco-rubio-2016-issues-index-snapshot.html' },
      { label: 'Protecting Life', slug: 'rubio-2016-life', path: '/sources/marco-rubio-2016-protecting-life-snapshot.html' },
    ],
    originalUrl: 'https://marcorubio.com/issues/',
    originalHost: 'marcorubio.com',
    mirrors: [
      { url: 'https://web.archive.org/web/20160301000000*/marcorubio.com/issues', host: 'web.archive.org' },
    ],
    notes:
      'Other policy detail URLs (e.g. tax-reform, defense, immigration) were not independently crawled by the Wayback Machine in the 2015-2016 cycle window — Rubio\'s campaign site was thinner than peers. A fresh Wayback save was attempted on 2026-05-14 (anonymous IA Save Page Now endpoint, partial success due to IA rate limiting).',
  },
  {
    title: 'JD Vance 2022 Ohio Senate Campaign — Home & Issues',
    date: '2022-08-01',
    venue: 'jdvance.com',
    description:
      "JD Vance's 2022 Ohio Senate campaign website — homepage and the consolidated issues page — preserved from the Wayback Machine (nearest snapshot 2022-08-01, peak general-election window). The jdvance.com issues page documented 14 policy commitments on a single page (no sub-URLs): protect conservative values, restore manufacturing, energy independence, defend small business, dismantle big tech, traditional families, end abortion, southern border, drugs/opioids, second amendment, COVID-19, foreign policy, spending/inflation, election integrity. These are the campaign commitments Vance ran on before becoming Vice President.",
    subLinks: [
      { label: 'Home', slug: 'vance-2022-home', path: '/sources/jd-vance-2022-home-snapshot.html' },
      { label: 'Issues', slug: 'vance-2022-issues', path: '/sources/jd-vance-2022-issues-snapshot.html' },
    ],
    originalUrl: 'https://jdvance.com/issues/',
    originalHost: 'jdvance.com',
    mirrors: [
      { url: 'https://web.archive.org/web/20220801000000*/jdvance.com', host: 'web.archive.org' },
    ],
    notes:
      'All 14 issue planks were presented on a single page rather than as individual sub-URLs, so a single HTML mirror preserves the complete campaign-era platform. A fresh Wayback save was attempted on 2026-05-14 (anonymous IA Save Page Now endpoint, partial success due to IA rate limiting).',
  },
  {
    title: 'Sherrod Brown 2024 Senate Campaign — Issues Pages',
    date: '2024-09-01',
    venue: 'sherrodbrown.com/issues',
    description:
      "Four policy pages from Sherrod Brown's 2024 Ohio Senate re-election campaign website, preserved from the Wayback Machine (nearest snapshot 2024-09-01, peak general-election window). Covers the issues index plus three marquee planks: standing up for American workers, agricultural and rural communities, and the African American community. Brown lost the 2024 race; the campaign site no longer hosts active policy content.",
    subLinks: [
      { label: 'Issues Index', slug: 'brown-2024-index', path: '/sources/sherrod-brown-2024-issues-index-snapshot.html' },
      { label: 'American Workers', slug: 'brown-2024-workers', path: '/sources/sherrod-brown-2024-american-workers-snapshot.html' },
      { label: 'Agriculture & Rural', slug: 'brown-2024-agriculture', path: '/sources/sherrod-brown-2024-agricultural-and-rural-communities-snapshot.html' },
      { label: 'African American Community', slug: 'brown-2024-aac', path: '/sources/sherrod-brown-2024-african-american-community-snapshot.html' },
    ],
    originalUrl: 'https://www.sherrodbrown.com/issues/',
    originalHost: 'sherrodbrown.com',
    mirrors: [
      { url: 'https://web.archive.org/web/20240901000000*/sherrodbrown.com/issues', host: 'web.archive.org' },
    ],
    notes:
      'A fresh Wayback save was attempted on 2026-05-14 (anonymous IA Save Page Now endpoint, partial success due to IA rate limiting). Additional issue sub-pages (e.g. fiscal-responsibility, energy, national-security under /issues-old/) exist in earlier Wayback crawls and can be added in a future pass if a verdict cites them.',
  },
  {
    title: 'Ron DeSantis 2024 Presidential Campaign — Home & "Stop the Invasion"',
    date: '2023-07-01',
    venue: 'rondesantis.com',
    description:
      "Ron DeSantis's short-lived 2024 presidential campaign website, preserved from the Wayback Machine (nearest snapshot 2023-07-01, near campaign launch). The rondesantis.com site favored a single-page narrative layout over a traditional issues sub-tree; the homepage and the campaign's flagship 'Stop the Invasion' border mission page are mirrored here. DeSantis ended his presidential bid in January 2024 — these snapshots are the durable record of the campaign-era commitments he ran on before returning to his Florida gubernatorial role.",
    subLinks: [
      { label: 'Home', slug: 'desantis-2024-home', path: '/sources/ron-desantis-2024-home-snapshot.html' },
      { label: 'Stop the Invasion', slug: 'desantis-2024-border', path: '/sources/ron-desantis-2024-stop-the-invasion-snapshot.html' },
    ],
    originalUrl: 'https://rondesantis.com/',
    originalHost: 'rondesantis.com',
    mirrors: [
      { url: 'https://web.archive.org/web/20230701000000*/rondesantis.com', host: 'web.archive.org' },
    ],
    notes:
      'rondesantis.com used a SPA-style layout rather than a discoverable /issues/ sub-tree, so additional policy detail pages are not separately crawled by the Wayback Machine. The homepage and the one explicit mission sub-page are the primary policy artifacts. A fresh Wayback save was attempted on 2026-05-14 (anonymous IA Save Page Now endpoint, partial success due to IA rate limiting).',
  },
  {
    title: 'Gavin Newsom 2018 Gubernatorial Campaign — Policy Pages',
    date: '2018-10-01',
    venue: 'gavinnewsom.com',
    description:
      "Seven pages from Gavin Newsom's 2018 California gubernatorial campaign website, preserved from the Wayback Machine (nearest snapshot 2018-10-01, peak general-election window). Includes the 'California Values' platform statement plus six policy pages: education, environment, housing, economic development, child poverty, and the candidate biography page. These are the campaign commitments Newsom ran on before winning the 2018 governorship he still holds.",
    subLinks: [
      { label: 'California Values', slug: 'newsom-2018-values', path: '/sources/gavin-newsom-2018-california-values-snapshot.html' },
      { label: 'Education', slug: 'newsom-2018-education', path: '/sources/gavin-newsom-2018-education-snapshot.html' },
      { label: 'Environment', slug: 'newsom-2018-environment', path: '/sources/gavin-newsom-2018-environment-snapshot.html' },
      { label: 'Housing', slug: 'newsom-2018-housing', path: '/sources/gavin-newsom-2018-housing-snapshot.html' },
      { label: 'Economic Development', slug: 'newsom-2018-economy', path: '/sources/gavin-newsom-2018-economic-development-snapshot.html' },
      { label: 'Child Poverty', slug: 'newsom-2018-child-poverty', path: '/sources/gavin-newsom-2018-child-poverty-snapshot.html' },
      { label: 'About', slug: 'newsom-2018-about', path: '/sources/gavin-newsom-2018-about-snapshot.html' },
    ],
    originalUrl: 'https://gavinnewsom.com/california_values',
    originalHost: 'gavinnewsom.com',
    mirrors: [
      { url: 'https://web.archive.org/web/20181001000000*/gavinnewsom.com', host: 'web.archive.org' },
    ],
    notes:
      'gavinnewsom.com used flat (non-trailing-slash) URLs for each policy page (e.g. /education, /housing). HTML mirrors preserved via the Wayback id_/ infix. A fresh Wayback save was attempted on 2026-05-14 (anonymous IA Save Page Now endpoint, partial success due to IA rate limiting).',
  },
  {
    title: 'Joe Manchin 2018 Senate Re-election Campaign — Home & The Issues',
    date: '2018-06-01',
    venue: 'joemanchinwv.com',
    description:
      "Joe Manchin's 2018 West Virginia Senate re-election campaign website — homepage and the consolidated 'The Issues' page — preserved from the Wayback Machine (nearest snapshot 2018-06-01, peak re-election window). The campaign site used a tabbed single-page layout for issues rather than discrete sub-URLs. This is the platform Manchin ran on for the term that ended in January 2025 — the same term currently graded on CampaignReceipts.com (17 graded promises).",
    subLinks: [
      { label: 'Home', slug: 'manchin-2018-home', path: '/sources/joe-manchin-2018-home-snapshot.html' },
      { label: 'The Issues', slug: 'manchin-2018-issues', path: '/sources/joe-manchin-2018-the-issues-snapshot.html' },
    ],
    originalUrl: 'https://joemanchinwv.com/the-issues/',
    originalHost: 'joemanchinwv.com',
    mirrors: [
      { url: 'https://web.archive.org/web/20180601000000*/joemanchinwv.com', host: 'web.archive.org' },
    ],
    notes:
      'The issues page used in-page tabs (e.g. /the-issues/#tabs_desc_696_4) rather than separate URLs for each policy area, so a single HTML mirror preserves the complete campaign-era platform. A fresh Wayback save was attempted on 2026-05-14 (anonymous IA Save Page Now endpoint, partial success due to IA rate limiting).',
  },
  {
    title: 'Gettysburg Speech — Full Transcript, 2016-10-22',
    date: '2016-10-22',
    venue: 'Gettysburg, Pennsylvania',
    description:
      "Full transcript of Donald Trump's \"Gettysburg Address\" campaign speech delivered October 22, 2016, in which he presented the Contract with the American Voter and outlined his 100-day action plan. Archived from HuffPost Contributor via Wayback Machine (2016-10-23 snapshot).",
    localPath: '/sources/trump-gettysburg-speech-2016-10-22.html',
    originalUrl: 'https://www.huffpost.com/entry/trumps-gettysburg-address-full-transcript_b_580dbc6de4b099c434319901',
    originalHost: 'huffpost.com',
    mirrors: [
      {
        url: 'https://web.archive.org/web/20161023000000/https://www.huffpost.com/entry/trumps-gettysburg-address-full-transcript_b_580dbc6de4b099c434319901',
        host: 'web.archive.org',
      },
      {
        url: 'https://historymusings.wordpress.com/2016/10/22/full-text-campaign-buzz-2016-october-22-2016-donald-trumps-gettysburg-address-speech/',
        host: 'historymusings.wordpress.com',
      },
    ],
    notes:
      'HuffPost blocks direct curl access in 2026; archived via Wayback Machine snapshot from 2016-10-23 (the day after delivery). The WordPress mirror at historymusings.wordpress.com also hosts a full-text copy.',
  },
]

export default function SourcesPage() {
  return (
    <TrustSurface>
      {/* Hero */}
      <section className="border-b border-parchment-200">
        <div className="section-shell pt-20 pb-12">
          <div className="text-[11px] uppercase tracking-[0.18em] font-semibold text-authority-600 mb-3">
            The Archive
          </div>
          <h1 className="font-editorial text-display-lg text-ink-950 text-balance">Primary Sources</h1>
          <p className="mt-5 text-lg text-ink-700 max-w-2xl leading-relaxed font-editorial">
            Every verdict on this site is grounded in a primary-source document. We host canonical
            copies of the most-cited ones here so the citation chain never breaks &mdash; even if a
            third-party host removes the original.
          </p>
          <p className="mt-3 text-sm text-ink-600 max-w-2xl leading-relaxed">
            Free. No paywall. No login. Cite freely.
          </p>
          <p className="mt-4 text-[14px] text-ink-700 max-w-2xl leading-relaxed">
            Citation archive — every primary source from the 2016 promise audit, preserved for
            durability and citeability.
          </p>
        </div>
      </section>

      {/* Why we host these */}
      <section className="border-b border-parchment-200 bg-parchment-100/60">
        <div className="section-shell py-10">
          <div className="grid gap-6 md:grid-cols-3">
            <div className="flex gap-3">
              <ShieldCheck className="h-5 w-5 shrink-0 text-authority-600 mt-0.5" aria-hidden />
              <div>
                <div className="text-sm font-semibold text-ink-900">Durability</div>
                <p className="mt-1 text-sm text-ink-700 leading-relaxed">
                  Citations point at URLs we control. When a Substack writer or LLM cites a verdict
                  page, the underlying document is still here in 2030.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <Archive className="h-5 w-5 shrink-0 text-authority-600 mt-0.5" aria-hidden />
              <div>
                <div className="text-sm font-semibold text-ink-900">Provenance</div>
                <p className="mt-1 text-sm text-ink-700 leading-relaxed">
                  Each mirror lists its original host and at least one additional public mirror so
                  anyone can verify our copy matches the canonical one.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <FileText className="h-5 w-5 shrink-0 text-authority-600 mt-0.5" aria-hidden />
              <div>
                <div className="text-sm font-semibold text-ink-900">Searchability</div>
                <p className="mt-1 text-sm text-ink-700 leading-relaxed">
                  Documents are hosted as direct files, not behind viewer chrome. Every page is
                  selectable, copyable, and indexable by search engines and LLM crawlers.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The archive */}
      <section>
        <div className="section-shell py-12">
          <ul className="space-y-8">
            {sources.map((src) => (
              <li
                key={src.localPath ?? src.title}
                className="rounded-lg ring-1 ring-parchment-200 bg-white p-6 shadow-sm"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-4">
                  <h2 className="font-editorial text-2xl font-semibold text-ink-950 leading-tight">
                    {src.title}
                  </h2>
                  <div className="text-xs font-mono uppercase tracking-wider text-ink-500">
                    {src.date} &middot; {src.venue}
                  </div>
                </div>
                <p className="mt-4 text-ink-700 leading-relaxed">{src.description}</p>

                <div className="mt-6 flex flex-wrap gap-3">
                  {src.localPath && (
                    <a
                      href={src.localPath}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-authority text-sm"
                    >
                      <FileText className="h-4 w-4" aria-hidden /> Read on CampaignReceipts
                    </a>
                  )}
                  {src.subLinks && src.subLinks.map((sub) => (
                    <a
                      key={sub.slug}
                      href={sub.path}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-authority text-sm"
                    >
                      <FileText className="h-4 w-4" aria-hidden /> {sub.label}
                    </a>
                  ))}
                  <a
                    href={src.originalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-authority-ghost text-sm"
                  >
                    <ExternalLink className="h-4 w-4" aria-hidden /> Original on {src.originalHost}
                  </a>
                  {src.mirrors.map((m) => (
                    <a
                      key={m.url}
                      href={m.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-md ring-1 ring-parchment-300 bg-white hover:bg-parchment-50 px-4 py-2 text-sm text-ink-700 hover:text-ink-900 transition"
                    >
                      <ExternalLink className="h-4 w-4" aria-hidden /> Mirror &middot; {m.host}
                    </a>
                  ))}
                </div>

                {src.subLinks && src.subLinks.some((s) => s.screenshot) && (
                  <div className="mt-6 border-t border-parchment-200 pt-5">
                    <div className="mb-3 flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-ink-600">
                      <Camera className="h-3.5 w-3.5" aria-hidden /> Page screenshots — receipts for the receipts
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                      {src.subLinks
                        .filter((sub) => sub.screenshot)
                        .map((sub) => (
                          <a
                            key={`shot-${sub.slug}`}
                            href={sub.screenshot}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group block ring-1 ring-parchment-300 rounded-md overflow-hidden bg-white hover:ring-authority-400 transition"
                            title={`${sub.label} — full-page screenshot`}
                          >
                            <div className="relative aspect-[3/4] bg-parchment-50">
                              <Image
                                src={sub.screenshot!}
                                alt={`donaldjtrump.com ${sub.label} policy page — 2016 Election Day archive`}
                                fill
                                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                                className="object-cover object-top"
                                unoptimized
                              />
                            </div>
                            <div className="px-2 py-1.5 text-[11px] font-mono uppercase tracking-wide text-ink-700 group-hover:text-authority-700 border-t border-parchment-200 text-center">
                              {sub.label}
                            </div>
                          </a>
                        ))}
                    </div>
                    <p className="mt-3 text-xs text-ink-500 leading-relaxed">
                      Full-page renders captured via Puppeteer at 2× device-scale, with the Wayback Machine wrapper visible — the timestamp banner is the citation receipt.
                    </p>
                  </div>
                )}

                {src.notes && (
                  <p className="mt-5 border-t border-parchment-200 pt-4 text-sm text-ink-600 leading-relaxed">
                    <span className="font-semibold text-ink-800">Note:</span> {src.notes}
                  </p>
                )}
              </li>
            ))}
          </ul>

          <p className="mt-12 text-sm text-ink-600 leading-relaxed max-w-2xl">
            More primary documents will be added as we publish more verdicts. If a document we cite
            is hosted only at a single fragile location, we will mirror it here. If you spot a
            citation on this site that points at a fragile or paywalled URL,{' '}
            <a href="mailto:support@campaignreceipts.com" className="text-authority-600 hover:text-authority-700 underline-offset-4 hover:underline font-medium">
              tell us
            </a>{' '}
            and we&rsquo;ll find a better one.
          </p>
        </div>
      </section>
    </TrustSurface>
  )
}
