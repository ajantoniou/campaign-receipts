#!/usr/bin/env node
/**
 * generate-script.mjs — per-promise CR Shorts script generator.
 *
 * Editorial guardrails (LOAD-BEARING):
 *   - VERBATIM quotes only from the source corpus (no paraphrase of the promise).
 *   - Exactly one primary-source URL per script, named on screen.
 *   - 60-second hard cap on rendered VO (we target ~150 spoken words ≈ 55s @ ElevenLabs default rate).
 *   - Title format: "{VERDICT}: {short promise} | SEALED"
 *
 * Inputs:
 *   --promise-id <id>     e.g. drain-the-swamp-aipac-iran
 *   --out <dir>           output directory; writes script.md + metadata.json
 *
 * Curated promise pack — sourced verbatim from:
 *   companies/concise-sealed/scripts/build-retail-pdf.mjs (manuscript prose)
 *   companies/campaign-receipts/scripts/seed-trump-2016-cycle.json (verdict + source url)
 *
 * Adding a new promise: append to PROMISES below. Every entry must include
 *   - verbatim_promise   (exact quote from the corpus)
 *   - verdict            (KEPT | BROKEN | PARTIAL | YOU_DECIDE)
 *   - primary_source     (url + name; one only)
 *   - receipt_lines      (≤4 short lines, each verbatim-able from manuscript)
 *
 * Usage:
 *   node scripts/shorts/generate-script.mjs --promise-id drain-the-swamp-aipac-iran --out scripts/shorts/_build/001
 */

import fs from 'node:fs'
import path from 'node:path'

const PROMISES = {
  'drain-the-swamp-aipac-iran': {
    cycle: 2016,
    short_promise: 'The Iran deal that wasn’t dismantled',
    verbatim_promise: 'Drain the swamp',
    verdict: 'BROKEN',
    short_promise_for_title: 'Drain the swamp',
    receipt_headline: 'AIPAC went three for three on its wish list.',
    receipt_lines: [
      'Priority one: kill the Iran nuclear deal. Done. May 8, 2018. The U.S. withdrew from the JCPOA.',
      'Priority two: move the U.S. embassy to Jerusalem. Done. May 14, 2018.',
      'Priority three: expand the antisemitism definition. Done. December 11, 2019. Executive Order 13899.',
      'Sheldon Adelson gave roughly eighty-two million dollars in the 2016 cycle.',
      'He got everything he asked for. Three for three. The swamp got bigger, not smaller.',
    ],
    primary_source: {
      name: 'Federal Register, May 8 2018 — JCPOA withdrawal',
      url: 'https://www.federalregister.gov/documents/2018/05/08',
    },
    cta: 'sealed2016.com',
    share_card: '/Applications/DrAntoniou Projects/AgentCompanies/companies/concise-sealed/public/share-cards/v1/share-01-aipac-iran-deal.png',
    slug: 'sealed-001-aipac-iran-deal',
    episode_no: 1,
  },
  // Future entries: drain-the-swamp-embassy, drain-the-swamp-campus-shield, etc.
}

function parseArgs() {
  const out = {}
  const a = process.argv.slice(2)
  for (let i = 0; i < a.length; i++) {
    if (a[i].startsWith('--')) { out[a[i].slice(2)] = a[i + 1]; i++ }
  }
  return out
}

function buildVoScript(p) {
  // Strict structure: hook (≤8s) → receipt (≤40s) → verdict + CTA (≤10s).
  // Every claim is verbatim from the corpus. No paraphrase.
  const lines = [
    `${p.verdict}.`,
    `They said: ${p.verbatim_promise}.`,
    p.receipt_headline,
    ...p.receipt_lines,
    `Source: ${p.primary_source.name}.`,
    `Full receipts at ${p.cta}.`,
  ]
  return lines.join(' ')
}

function buildCaptionCues(p) {
  // Caption cues map to the spoken structure. Times are estimated at
  // ~155 wpm; produce-short.mjs will re-time against actual VO duration.
  // Each cue is a short, glance-readable summary of the corresponding VO segment.
  const headerCues = [
    { t: 0.0, dur: 1.8, text: p.verdict },
    { t: 1.8, dur: 3.2, text: `They said:\n“${p.verbatim_promise}”` },
    { t: 5.0, dur: 3.5, text: p.receipt_headline },
  ]
  // Compress each receipt_line into a glance-readable chyron (≤ ~70 chars).
  // We prefer the FIRST sentence (often the headline claim) plus a short tail.
  const chyron = (line) => {
    const firstSentence = line.split(/(?<=[.!?])\s+/)[0]
    return firstSentence.length <= 80
      ? firstSentence
      : firstSentence.slice(0, 77).trim() + '…'
  }
  const nLines = p.receipt_lines.length
  const startT = 8.5
  const endT = 50.0
  const perLine = (endT - startT) / nLines
  const lineCues = p.receipt_lines.map((line, i) => ({
    t: +(startT + i * perLine).toFixed(2),
    dur: +perLine.toFixed(2),
    text: chyron(line),
  }))
  const tailCues = [
    { t: 50.0, dur: 5.0, text: `Source:\n${p.primary_source.name}` },
    { t: 55.0, dur: 5.0, text: `Full receipts:\n${p.cta}` },
  ]
  return [...headerCues, ...lineCues, ...tailCues]
}

function buildTitleAndDescription(p) {
  const title = `${p.verdict}: ${p.short_promise} | SEALED`
  const utm = `?utm_source=youtube&utm_medium=shorts&utm_campaign=${p.slug}`
  const description = [
    `${p.verdict}: “${p.verbatim_promise}”`,
    '',
    p.receipt_headline,
    ...p.receipt_lines.map(l => `• ${l}`),
    '',
    `Source: ${p.primary_source.name}`,
    p.primary_source.url,
    '',
    `Full 145-promise scorecard with receipts: https://${p.cta}${utm}`,
    '',
    '#politics #fact-check #trump #2016 #sealedpress',
  ].join('\n')
  const tags = ['politics', 'fact check', 'trump', '2016', 'campaign promises', 'sealed press', 'iran deal', 'jcpoa', 'aipac']
  return { title, description, tags }
}

function main() {
  const args = parseArgs()
  const id = args['promise-id']
  const outDir = args.out
  if (!id || !outDir) {
    console.error('Usage: --promise-id <id> --out <dir>')
    process.exit(1)
  }
  const p = PROMISES[id]
  if (!p) {
    console.error(`Unknown promise-id: ${id}. Known: ${Object.keys(PROMISES).join(', ')}`)
    process.exit(1)
  }
  fs.mkdirSync(outDir, { recursive: true })
  const vo = buildVoScript(p)
  const cues = buildCaptionCues(p)
  const meta = buildTitleAndDescription(p)
  const utm = `?utm_source=youtube&utm_medium=shorts&utm_campaign=${p.slug}`
  const cta_url = `https://${p.cta}${utm}`

  fs.writeFileSync(path.join(outDir, 'script.md'), `# ${meta.title}\n\n## VO (verbatim corpus only)\n\n${vo}\n\n## Word count\n\n${vo.split(/\s+/).length} words\n`)
  fs.writeFileSync(path.join(outDir, 'vo.txt'), vo)
  fs.writeFileSync(path.join(outDir, 'captions.json'), JSON.stringify(cues, null, 2))
  fs.writeFileSync(path.join(outDir, 'metadata.json'), JSON.stringify({
    promise_id: id,
    slug: p.slug,
    cycle: p.cycle,
    verdict: p.verdict,
    verbatim_promise: p.verbatim_promise,
    receipt_headline: p.receipt_headline,
    receipt_lines: p.receipt_lines,
    primary_source: p.primary_source,
    cta: p.cta,
    cta_url,
    share_card: p.share_card,
    episode_no: p.episode_no,
    title: meta.title,
    description: meta.description,
    tags: meta.tags,
  }, null, 2))
  console.log(`Wrote ${outDir}/{script.md,vo.txt,captions.json,metadata.json}`)
  console.log(`VO word count: ${vo.split(/\s+/).length}`)
  console.log(`Title: ${meta.title}`)
}

main()
