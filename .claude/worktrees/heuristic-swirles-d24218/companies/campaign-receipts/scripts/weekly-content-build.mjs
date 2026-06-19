#!/usr/bin/env node
//
// scripts/weekly-content-build.mjs  —  PHASE 1 of the weekly content engine.
//
// Runs once a week (Render cron, Thursday ~18:00 ET / 22:00 UTC). Quality-
// sensitive, runs ONCE/week (not per-user), so it spends on Sonnet for the
// journalist synthesis. Steps:
//
//   1. Gather the last 7 days of DB additions/changes from cr_recent_activity
//      + the underlying money-trail / alignment / pac / race tables.
//      Dedup + rank by significance (dollar size, named PAC, vote flip).
//   2. POLITICAL-JOURNALIST persona (Sonnet) synthesizes the week into a
//      sourced storytelling narrative; picks the TOP 3 stories. The rest
//      become one-line "transactional receipts".
//   3. VIRAL-STORY persona writes title + hook description for the big ones.
//   4. 1-2 brand-correct illustrations via the Higgsfield gen-router
//      (NO AI faces of real politicians — atmosphere/symbolic only).
//   5. Create cr_articles rows (kind='weekly_story') for the top stories,
//      with hero_image_url + source_refs. Each lands at /articles/[slug].
//   6. Queue a video handoff (cr_video_queue) for the top story so the CR
//      pipeline / founder produces a video; the blog embeds it once a
//      youtube_id lands (reusing the video_companion embed mechanism).
//   7. Persist the assembled newsletter into cr_newsletter_issues
//      (status='built') so Phase 2 just sends it.
//
// Every dollar / donor / vote / bill cited traces to a DB row. The journalist
// prompt is forbidden to invent figures — it is handed the rows and may only
// narrate what it is given.
//
// Usage:
//   node scripts/weekly-content-build.mjs            # build + persist + gen images
//   node scripts/weekly-content-build.mjs --dry-run  # assemble + print, NO writes, NO AI image spend
//                                                    #   (still calls the text LLM unless --no-llm)
//   node scripts/weekly-content-build.mjs --dry-run --no-llm  # fully offline, deterministic stub
//
// Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ANTHROPIC_API_KEY.

import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'
import { spawnSync } from 'node:child_process'
import { randomBytes } from 'node:crypto'
import { appendFileSync, existsSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const REPO_DIR = join(__dirname, '..') // companies/campaign-receipts

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY

const DRY = process.argv.includes('--dry-run')
const NO_LLM = process.argv.includes('--no-llm')
const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://campaignreceipts.com'

// Sonnet — quality-sensitive weekly synthesis, runs once/week.
const JOURNALIST_MODEL = 'claude-sonnet-4-5'
const COST_LOG = join(__dirname, '.external-costs.jsonl')

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('FATAL: SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY missing')
  process.exit(1)
}
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } })
const anthropic = NO_LLM || !ANTHROPIC_KEY ? null : new Anthropic({ apiKey: ANTHROPIC_KEY })

// Brand palette (parchment / navy / civic-red).
const C = { paper: '#f5efdf', paper2: '#efe7d2', ink: '#1f2a44', ink2: '#475063', red: '#b3271e', line: '#d8cdb0' }

// ── Time helpers ───────────────────────────────────────────
function isoMonday(d = new Date()) {
  // Monday of the ISO week containing d (UTC).
  const x = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
  const dow = (x.getUTCDay() + 6) % 7 // 0 = Monday
  x.setUTCDate(x.getUTCDate() - dow)
  return x.toISOString().slice(0, 10)
}
function fmtUsd(n) {
  const v = Number(n || 0)
  if (v >= 1_000_000) return '$' + (v / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M'
  if (v >= 1_000) return '$' + (v / 1_000).toFixed(0) + 'K'
  return '$' + Math.round(v).toLocaleString('en-US')
}
function slugify(s) {
  return String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 70)
}
function logCost(vendor, costUsd, note) {
  try {
    appendFileSync(
      COST_LOG,
      JSON.stringify({ ts: new Date().toISOString(), issueId: 'weekly-content-build', vendor, cost_usd: costUsd, note }) + '\n',
    )
  } catch {}
}

// ── STEP 1: gather + rank PAC-money story candidates ───────
//
// The STRONG SPINE is PAC money, not vote-alignment. Two PAC sources lead:
//   A. cr_races.top_pacs — named PAC "spent $X to support/beat candidate Z".
//      This is the signature, most-defensible story (support/oppose is the
//      strongest framing), so it earns the biggest rank bonus.
//   B. cr_pac_contributions (8k+ FEC edges) aggregated per committee → the
//      biggest named PAC flows + cross-politician reach ("this PAC funds N
//      members"). Joins cr_committees for the human name + industry.
// Vote-alignment is demoted to SUPPORTING receipts only (see gatherAlignmentReceipts)
// and NEVER framed as "voted against their donor".
//
// Conduit / party / leadership committees (ActBlue, WinRed, DCCC, NRCC, party
// committees, leadership PACs) are down-weighted: they are pass-throughs, not
// the "interested money buying access" story the channel is built on.

// FEC committee_type codes that are party / candidate committees (not the
// interest-group "bought access" story we lead with).
const PARTY_CANDIDATE_TYPES = new Set(['H', 'S', 'X', 'Y', 'P'])
// Known conduit committees (pass-through small-donor platforms).
const CONDUIT_COMMITTEE_IDS = new Set(['C00401224', 'C00694323']) // ActBlue, WinRed
function isConduitName(name) {
  return /\b(ACTBLUE|WINRED|DCCC|NRCC|DSCC|NRSC|VICTORY FUND|JOINT FUNDRAIS|NEW DEM(OCRAT)? COALITION)\b/i.test(name || '')
}

async function gatherCandidates() {
  const candidates = []

  // ── Source A: cr_races.top_pacs — named PAC support/oppose spending ──
  // Strongest story: "PAC X spent $Y to beat/back candidate Z (FEC id)".
  const { data: races } = await supabase
    .from('cr_races')
    .select('slug, headline, state, district, cycle, total_ie_usd, total_spend_usd, top_pacs, is_active')
    .eq('is_active', true)
  for (const r of races || []) {
    const pacs = Array.isArray(r.top_pacs) ? r.top_pacs : []
    for (const pac of pacs) {
      const amt = Number(pac.total_usd || 0)
      if (!pac.name || amt <= 0) continue
      const target = pac.target_candidate || 'a candidate'
      const so = String(pac.support_oppose || '')
      const verb = /against|oppos|beat/i.test(so) ? 'to beat' : /for|support/i.test(so) ? 'to back' : 'on'
      const affil = pac.affiliation ? ` (${pac.affiliation})` : ''
      candidates.push({
        kind: 'race_pac',
        key: `rp:${r.slug}:${slugify(pac.name)}:${slugify(target)}`,
        subject: `pac:${slugify(pac.name)}`, // de-dupe Big Three by PAC
        headline: `${pac.name} spent ${fmtUsd(amt)} ${verb} ${target}`,
        dollars: amt,
        named_pac: true,
        support_oppose: true,
        detail: `${pac.name}${affil} spent ${fmtUsd(amt)} ${verb === 'to beat' ? 'to defeat' : verb === 'to back' ? 'to support' : 'on'} ${target} in the ${r.headline || r.slug}.`,
        source: { publication: 'FEC independent expenditures (Campaign Receipts race file)', label: r.headline || r.slug, kind: 'race_pac', race_slug: r.slug, pac_name: pac.name },
      })
    }
  }

  // ── Source B: cr_pac_contributions — biggest named PAC→member flows + reach ──
  // Pull all 2024-cycle edges, join committee names + politician names, then
  // aggregate per committee for the "this PAC also funds A, B, C" web.
  const { data: edges } = await supabase
    .from('cr_pac_contributions')
    .select('committee_id, cycle, total_amount, contribution_count, last_contribution_date, cr_committees!inner(name, committee_type, industry_label, connected_org_name, is_leadership_pac), cr_politicians!inner(name, slug, party, state, bioguide)')
    .gt('total_amount', 0)
    .order('total_amount', { ascending: false })
    .limit(2000)

  // Group edges by committee. Within a committee, DEDUP funded members on
  // bioguide (the authoritative FEC/Congress id) — cr_politicians still carries
  // near-duplicate rows for a few members, and counting both double-counts a
  // donor's reach (AIPAC counted Pat Ryan twice). This mirrors the deterministic
  // dedup in lib/dossier.ts assembleDonorBundle. Members with no bioguide stay
  // distinct (keyed by slug).
  const byCommittee = new Map()
  for (const e of edges || []) {
    const c = e.cr_committees
    const p = e.cr_politicians
    if (!c || !p) continue
    let g = byCommittee.get(e.committee_id)
    if (!g) {
      g = { committee_id: e.committee_id, name: c.name, committee_type: c.committee_type, industry_label: c.industry_label, connected_org_name: c.connected_org_name, is_leadership_pac: c.is_leadership_pac, total: 0, byMember: new Map() }
      byCommittee.set(e.committee_id, g)
    }
    const amt = Number(e.total_amount || 0)
    const key = p.bioguide || `slug:${p.slug}`
    const ex = g.byMember.get(key)
    if (ex) {
      ex.amount += amt
      if (e.cycle) ex.cycles.add(e.cycle)
    } else {
      g.byMember.set(key, { name: p.name, slug: p.slug, party: p.party, state: p.state, amount: amt, cycles: new Set(e.cycle ? [e.cycle] : []) })
    }
  }

  for (const g of byCommittee.values()) {
    const conduit = CONDUIT_COMMITTEE_IDS.has(g.committee_id) || isConduitName(g.name) || isConduitName(g.connected_org_name)
    const partyCandidate = PARTY_CANDIDATE_TYPES.has(g.committee_type)
    // Skip pure conduits/party committees as Big-Three candidates (they are
    // not "interested money"); they can still surface as plain receipts below.
    const recipients = [...g.byMember.values()]
      .map((m) => ({ name: m.name, slug: m.slug, party: m.party, state: m.state, amount: m.amount, cycle: [...m.cycles][0] || '' }))
      .sort((a, b) => b.amount - a.amount)
    g.total = recipients.reduce((s, r) => s + r.amount, 0)
    const cycles = [...new Set(recipients.map((r) => r.cycle).filter(Boolean))]
    const nPols = recipients.length
    const top = recipients.slice(0, 3)
    const industry = g.industry_label && g.industry_label !== 'Political organizations' ? g.industry_label : null
    const who = g.name + (industry ? ` (${industry})` : '')
    const reachClause = nPols > 1
      ? ` The same PAC funds ${nPols} sitting members, including ${top.map((r) => `${r.name} (${fmtUsd(r.amount)})`).join(', ')}.`
      : ''
    // Deterministic, fully-sourced PATTERN layer (the so-what), computed in JS
    // from the deduped rows — mirrors lib/dossier.ts computeDonorThemes. The LLM
    // NARRATES these; it never recomputes them or invents figures.
    const themes = computeDonorThemes(g.name, recipients, g.total, industry, cycles)
    candidates.push({
      kind: 'pac_contrib',
      key: `pc:${g.committee_id}`,
      subject: `pac:${slugify(g.name)}`,
      headline: nPols > 1
        ? `${g.name} put ${fmtUsd(g.total)} into ${nPols} members of Congress`
        : `${g.name} gave ${fmtUsd(g.total)} to ${top[0]?.name || 'a member'}`,
      dollars: g.total,
      named_pac: true,
      reach: nPols,
      conduit,
      party_candidate: partyCandidate,
      themes,
      recipients: top,
      committee_id: g.committee_id,
      detail: `${who} (FEC ${g.committee_id}) gave ${fmtUsd(g.total)} across the 2024 cycle.` + reachClause,
      source: { publication: 'FEC committee contributions (Campaign Receipts PAC file)', label: g.name, kind: 'pac_contrib', committee_id: g.committee_id, pac_name: g.name },
    })
  }

  // Dedup by key.
  const seen = new Set()
  const deduped = candidates.filter((c) => (seen.has(c.key) ? false : (seen.add(c.key), true)))

  // Significance score (PAC-money-first):
  //   log-dollars (base) + support/oppose bonus (strongest) + cross-politician
  //   reach bonus + named-PAC bonus − conduit/party penalty.
  for (const c of deduped) {
    let s = Math.log10(Math.max(c.dollars, 1))
    if (c.support_oppose) s += 3.0              // "spent $X to beat Z" — the signature
    if (c.reach > 1) s += Math.log10(c.reach) * 1.5 // cross-politician web
    if (c.named_pac) s += 1.0
    if (c.conduit) s -= 4.0                     // pass-through, not interested money
    if (c.party_candidate) s -= 3.0             // party/candidate committee, not interest group
    c.score = s
  }
  deduped.sort((a, b) => b.score - a.score)

  // Diversity pass: the Big Three must be 3 DISTINCT subjects (distinct PAC).
  const featured = []
  const featuredSubjects = new Set()
  const overflow = []
  for (const c of deduped) {
    const k = c.subject || c.key
    if (featured.length < 3 && !featuredSubjects.has(k)) {
      featured.push(c)
      featuredSubjects.add(k)
    } else {
      overflow.push(c)
    }
  }
  return [...featured, ...overflow]
}

// ── Deterministic donor THEME computation (the so-what) ────
// Ported from lib/dossier.ts computeDonorThemes. Pure JS over the deduped
// funded-member rows. Every figure traces to a source string; a pattern that
// can't be computed from the real rows is simply not produced. The LLM narrates
// these — it never recomputes them or adds figures.
function computeDonorThemes(committeeName, members, total, industry, cycles) {
  const themes = []
  const n = members.length
  if (n === 0) return themes
  const src = 'cr_pac_contributions (funded-member rows, deduped on bioguide)'

  // 1. PARTY SKEW
  const rep = members.filter((m) => m.party === 'Republican')
  const dem = members.filter((m) => m.party === 'Democratic')
  const ind = members.filter((m) => m.party === 'Independent')
  const repAmt = rep.reduce((s, m) => s + m.amount, 0)
  const demAmt = dem.reduce((s, m) => s + m.amount, 0)
  const maj = rep.length >= dem.length ? { label: 'Republican', count: rep.length } : { label: 'Democratic', count: dem.length }
  if (maj.count / n >= 0.65 && n >= 4) {
    themes.push({
      kind: 'party_skew',
      headline: `${maj.count} of the ${n} members ${committeeName} funds are ${maj.label}.`,
      detail: `Of ${n} tracked members funded, ${rep.length} are Republican (${fmtUsd(repAmt)}), ${dem.length} are Democratic (${fmtUsd(demAmt)})${ind.length ? `, ${ind.length} Independent` : ''}. The money leans ${maj.label}.`,
      sources: [src, 'cr_politicians.party'],
    })
  } else if (n >= 4) {
    themes.push({
      kind: 'party_skew',
      headline: `${committeeName} funds both parties — ${rep.length} Republicans and ${dem.length} Democrats.`,
      detail: `Of ${n} tracked members funded, ${rep.length} are Republican (${fmtUsd(repAmt)}) and ${dem.length} are Democratic (${fmtUsd(demAmt)})${ind.length ? `, plus ${ind.length} Independent` : ''}. The split is close, not lopsided.`,
      sources: [src, 'cr_politicians.party'],
    })
  }

  // 4. CONCENTRATION — top-5 share
  if (n >= 6 && total > 0) {
    const top5 = members.slice(0, 5)
    const top5Amt = top5.reduce((s, m) => s + m.amount, 0)
    const share = top5Amt / total
    if (share >= 0.4) {
      themes.push({
        kind: 'concentration',
        headline: `${Math.round(share * 100)}% of the ${fmtUsd(total)} went to just ${top5.length} members.`,
        detail: `Top recipients: ${top5.map((m) => `${m.name} (${fmtUsd(m.amount)})`).join(', ')}. The rest is spread thin across ${n - top5.length} more members.`,
        sources: [src],
      })
    }
  }

  // 2. MULTI-CYCLE PERSISTENCE — honest about single-cycle data.
  if (cycles.length <= 1) {
    themes.push({
      kind: 'multi_cycle',
      headline: `This is one cycle of giving (${cycles[0] || 'current'}) — we can't yet show multi-year loyalty.`,
      detail: `All ${n} of these contributions are from the ${cycles[0] || 'current'} cycle. We do not have earlier cycles loaded for ${committeeName}, so we make no claim about repeat funding across years.`,
      sources: [src, 'cr_pac_contributions.cycle'],
    })
  }

  return themes
}

// Vote-alignment is SUPPORTING ONLY — never a Big-Three headline, never framed
// as a "voted against their donor" gotcha. We surface a small number of
// accurately-framed transactional receipts (money + how they voted), and only
// when the money figure is genuinely sourced.
async function gatherAlignmentReceipts() {
  const out = []
  const { data: aligns } = await supabase
    .from('cr_donor_vote_alignment')
    .select('politician_id, bill_id, industry_label, industry_position, vote, total_from_industry, cr_politicians!inner(name, slug, party, state), cr_bills(short_title, title)')
    .gt('total_from_industry', 0)
    .order('total_from_industry', { ascending: false, nullsFirst: false })
    .limit(8)
  for (const a of aligns || []) {
    const p = a.cr_politicians
    const b = a.cr_bills
    const billLabel = b ? (b.short_title || b.title || 'a bill') : 'a bill'
    // Accurate framing only: states the money, the industry's stance, and the
    // recorded vote. No "betrayed/against their donor" gotcha framing.
    out.push({
      line: `${p.name} (${p.party || '?'}-${p.state || '?'}) received ${fmtUsd(a.total_from_industry)} from ${a.industry_label}, which ${a.industry_position}s ${billLabel}; recorded vote: ${a.vote}.`,
      source: { publication: 'FEC contributions + roll-call vote (Campaign Receipts alignment)', label: `${p.name} / ${billLabel}`, kind: 'donor_vote_alignment', politician_slug: p.slug },
    })
  }
  return out
}

// ── STEP 2 + 3: journalist + viral-story personas ─────────
function journalistSystem() {
  return `You are a meticulous political-finance journalist for Campaign Receipts. Neutral, plain-English, 3rd-grade reading level. ` +
    `HARD RULE: you may ONLY state dollar figures, donor names, votes, and bills that appear in the data rows you are given. ` +
    `Never invent or estimate a figure. Never name a person not in the rows. If you cannot source a claim, omit it. ` +
    `Every paragraph must trace to a row. No predictions, no opinion, no metaphors.`
}

// Deterministic blog body that LEADS WITH THE THEMES (the pattern / so-what),
// then supports with the line-item receipt. Used for the --no-llm path and as
// the fallback when the LLM omits a body. Themes carry the deduped truth.
function buildThemedBody(c) {
  const themes = Array.isArray(c.themes) ? c.themes : []
  const parts = [`## ${c.headline}`, '']
  if (themes.length) {
    // Lead: the strongest patterns first, in plain English.
    for (const t of themes) {
      parts.push(`**${t.headline}** ${t.detail}`)
      parts.push('')
    }
    parts.push('### The receipts')
  }
  parts.push(c.detail)
  parts.push('')
  parts.push('Every figure above traces to a public FEC or Congress.gov record indexed by Campaign Receipts.')
  return parts.join('\n')
}

async function synthesize(candidates, weekOf, alignmentReceipts = []) {
  const top = candidates.slice(0, 3)
  // Receipts = remaining PAC-money items first, then a few accurately-framed
  // vote-alignment receipts (supporting, never dominant).
  const pacReceipts = candidates.slice(3, 15).map((c) => ({ line: c.detail, source: c.source }))
  const rest = [...pacReceipts, ...alignmentReceipts].slice(0, 18)

  if (NO_LLM || !anthropic) {
    // Deterministic offline stub so --dry-run --no-llm proves assembly.
    // LEAD WITH THE THEMES (the pattern / so-what), THEN the receipt detail.
    return {
      stories: top.map((c, i) => ({
        rank: i + 1,
        title: c.headline,
        hook: (c.themes && c.themes[0] ? c.themes[0].headline : c.detail).slice(0, 140),
        body_md: buildThemedBody(c),
        source: c.source,
        candidate: c,
      })),
      receipts: rest,
      llm_used: false,
    }
  }

  // One Sonnet call: synthesize top-3 narratives + viral title/hook each.
  // Each item carries a pre-computed THEMES array (the deterministic so-what
  // patterns) plus the flat receipt detail. The model NARRATES the themes — it
  // must NOT invent or recompute any figure.
  const rows = top.map((c, i) => ({
    n: i + 1,
    headline: c.headline,
    themes: Array.isArray(c.themes) ? c.themes.map((t) => ({ headline: t.headline, detail: t.detail })) : [],
    receipt_detail: c.detail,
    dollars: c.dollars,
    kind: c.kind,
  }))
  const prompt = `Week of ${weekOf}. Below are the THREE most significant follow-the-money items found in the Campaign Receipts database this week. Each item carries:\n` +
    `  - "themes": pre-computed PATTERNS (the so-what) — party skew, money concentration, one-cycle honesty — already sourced to FEC / Congress.gov rows. These numbers were computed in code, NOT by you. Do NOT recompute or second-guess them.\n` +
    `  - "receipt_detail": the flat line-item receipt that supports the patterns.\n\n` +
    `For EACH item produce a JSON object with:\n` +
    `  "title": a viral-but-honest headline (<=12 words, no clickbait lie, no name not in the data),\n` +
    `  "hook": one-sentence description for a newsletter / social card (<=25 words) — lead with the PATTERN, not a raw dollar figure,\n` +
    `  "body_md": a 3-5 paragraph storytelling article in Markdown. LEAD WITH THE THEMES — the reader must learn the PATTERN first (which party the money leans, how concentrated it is, that it is one cycle so we claim no multi-year loyalty), and ONLY THEN the line-item receipts that support it. Use each theme's headline and detail. Close with a flat line. Every dollar figure, count, and name MUST already appear in this item's themes or receipt_detail — DO NOT add, estimate, or invent any new number or name. 3rd-grade reading level, <=18 words/sentence.\n\n` +
    `Return ONLY a JSON array of 3 objects, in order. Items:\n${JSON.stringify(rows, null, 2)}`

  const resp = await anthropic.messages.create({
    model: JOURNALIST_MODEL,
    max_tokens: 4000,
    system: journalistSystem(),
    messages: [{ role: 'user', content: prompt }],
  })
  const usage = resp.usage || {}
  // Sonnet 4.5 pricing: $3/M in, $15/M out.
  const cost = ((usage.input_tokens || 0) * 3 + (usage.output_tokens || 0) * 15) / 1_000_000
  logCost('anthropic/' + JOURNALIST_MODEL, Number(cost.toFixed(4)), `weekly synthesis ${weekOf}`)

  let raw = resp.content[0]?.type === 'text' ? resp.content[0].text.trim() : '[]'
  raw = raw.replace(/^```json\s*/i, '').replace(/```$/i, '').trim()
  let parsed
  try {
    parsed = JSON.parse(raw)
  } catch {
    const m = raw.match(/\[[\s\S]*\]/)
    parsed = m ? JSON.parse(m[0]) : []
  }

  const stories = top.map((c, i) => {
    const g = parsed[i] || {}
    return {
      rank: i + 1,
      title: (g.title || c.headline).trim(),
      hook: (g.hook || (c.themes && c.themes[0] ? c.themes[0].headline : c.detail)).trim(),
      body_md: (g.body_md || buildThemedBody(c)).trim(),
      source: c.source,
      candidate: c,
    }
  })
  return {
    stories,
    receipts: rest,
    llm_used: true,
  }
}

// ── STEP 4: illustration via gen-router (no real faces) ────
function illustrationPrompt(story) {
  // Symbolic / atmospheric only — explicitly NO faces, NO real people.
  return `Editorial illustration, symbolic and atmospheric. Theme: follow-the-money in American politics — ${story.candidate.kind === 'race_pac' ? 'PAC spending in a contested election' : 'a political action committee funding members of Congress'}. ` +
    `Aged parchment texture, deep navy ink, a single civic-red accent. Composition of paper documents, faint dollar figures, a ledger, an envelope, a rubber stamp. ` +
    `Muted, archival, newsprint feel. ABSOLUTELY NO human faces, NO real people, NO portraits, NO recognizable politicians. No text overlays. 16:9.`
}

async function generateIllustration(story, weekOf, idx) {
  const piece = `weekly-${weekOf}-${idx}`
  const outDir = join(REPO_DIR, 'public', 'weekly-illustrations')
  const outRel = `/weekly-illustrations/${piece}.png`
  const outAbs = join(outDir, `${piece}.png`)
  if (DRY) {
    console.log(`  [dry] illustration -> gen-router still --piece ${piece} (NO spend)`)
    return null
  }
  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true })
  const res = spawnSync(
    'python3',
    [join(REPO_DIR, 'scripts', 'pipeline', 'gen-router.py'), 'still',
     '--prompt', illustrationPrompt(story), '--out', outAbs, '--piece', piece, '--aspect', '16:9'],
    { cwd: REPO_DIR, encoding: 'utf8', timeout: 240_000 },
  )
  if (res.status !== 0 || !existsSync(outAbs)) {
    console.warn(`  [warn] illustration gen failed for ${piece}: ${(res.stderr || '').slice(0, 200)}`)
    return null
  }
  logCost('higgsfield/gen-router', 0, `illustration ${piece} (prepaid credit pool)`)
  return outRel
}

// ── STEP 5: create weekly_story blog posts ────────────────
async function upsertArticle(story, weekOf, heroUrl) {
  const slug = `weekly-${weekOf}-${slugify(story.title)}`
  const row = {
    slug,
    kind: 'weekly_story',
    title: story.title,
    dek: story.hook,
    body_md: story.body_md,
    hero_image_url: heroUrl,
    source_refs: [
      { publication: story.source.publication, url: storySourceUrl(story) },
    ],
    status: 'published',
    published_at: new Date().toISOString(),
    generator: 'weekly-content-build',
    generator_version: 'v1',
    updated_at: new Date().toISOString(),
  }
  if (DRY) {
    console.log(`  [dry] upsert article ${slug} (hero=${heroUrl || 'none'})`)
    return { slug, id: null }
  }
  const { data, error } = await supabase
    .from('cr_articles')
    .upsert(row, { onConflict: 'slug' })
    .select('id, slug')
    .single()
  if (error) throw new Error(`article upsert ${slug}: ${error.message}`)
  return data
}

function storySourceUrl(story) {
  const s = story.source
  if (s.race_slug) return `${SITE}/races/${s.race_slug}`
  if (s.politician_slug) return `${SITE}/p/${s.politician_slug}`
  return `${SITE}/leaderboard`
}

// ── STEP 6: queue video handoff for the top story ─────────
async function queueVideo(topStory, articleRow, weekOf) {
  const row = {
    article_slug: articleRow.slug,
    article_id: articleRow.id,
    week_of: weekOf,
    title: topStory.title,
    brief: `Produce a Campaign Receipts video from this week's top story.\n\nTITLE: ${topStory.title}\nHOOK: ${topStory.hook}\n\nSTORY (sourced — do not add figures):\n${topStory.body_md}\n\nSOURCE: ${topStory.source.publication}`,
    source_refs: [{ publication: topStory.source.publication, url: storySourceUrl(topStory) }],
    status: 'queued',
    priority: 1,
  }
  if (DRY) {
    console.log(`  [dry] queue video handoff for ${articleRow.slug}`)
    return
  }
  const { error } = await supabase.from('cr_video_queue').upsert(row, { onConflict: 'article_slug,week_of' })
  if (error) throw new Error(`video queue: ${error.message}`)
}

// ── STEP 6.5: mint tracked newsletter links ───────────────
// One opaque token per article per issue (user_id null — enough to answer
// "which article won"; per-recipient is a no-schema-change upgrade later).
// Returns slug → `${SITE}/c/<token>` (the tracked-redirect route; /c not /r
// because /r/[id] is the public share-receipt page). On any failure we return
// {} and the newsletter falls back to plain canonical links (never blocks).
async function mintTrackedLinks(issueId, weekOf, slugs) {
  const map = {}
  if (DRY) {
    for (const slug of slugs) map[slug] = `${SITE}/c/<token-${slug}>`
    console.log(`  [dry] would mint ${slugs.length} tracked /r/ links`)
    return map
  }
  if (!issueId) return map // issue not yet persisted; fall back to plain links
  for (const slug of slugs) {
    if (!slug) continue
    const token = randomBytes(16).toString('base64url')
    const { error } = await supabase.from('cr_newsletter_links').insert({
      token,
      issue_id: issueId,
      week_of: weekOf,
      article_slug: slug,
      user_id: null,
      destination: `${SITE}/articles/${slug}`,
    })
    if (error) {
      console.warn(`  [warn] tracked link mint failed for ${slug}: ${error.message}`)
      continue
    }
    map[slug] = `${SITE}/c/${token}`
  }
  return map
}

// ── STEP 7: assemble + persist newsletter HTML ────────────
// linkFor(slug) returns the TRACKED /r/<token> url for an article (or null,
// in which case we fall back to the plain canonical url). Click logging
// happens server-side at /r/[token]; the token carries no identity.
function buildHtml(weekOf, stories, receipts, articleBySlug, linkFor = () => null) {
  const storyBlocks = stories
    .map((s) => {
      const slug = articleBySlug[s.title]
      const url = (slug && linkFor(slug)) || (slug ? `${SITE}/articles/${slug}` : SITE)
      const img = s.heroUrl
        ? `<img src="${SITE}${s.heroUrl}" alt="" width="100%" style="border-radius:8px;border:1px solid ${C.line};margin:0 0 12px 0" />`
        : ''
      return `<tr><td style="padding:18px 0;border-bottom:1px solid ${C.line}">
        ${img}
        <a href="${url}" style="color:${C.ink};text-decoration:none">
          <div style="font:700 19px Georgia,serif;color:${C.ink};margin:0 0 6px 0">${esc(s.title)}</div>
        </a>
        <div style="font:400 15px/1.5 Georgia,serif;color:${C.ink2};margin:0 0 8px 0">${esc(s.hook)}</div>
        <a href="${url}" style="font:600 13px Arial,sans-serif;color:${C.red};text-decoration:none">Read the receipt &rarr;</a>
      </td></tr>`
    })
    .join('')

  const receiptLines = receipts
    .map((r) => `<li style="font:400 14px/1.5 Arial,sans-serif;color:${C.ink2};margin:0 0 8px 0">${esc(r.line)}</li>`)
    .join('')

  return `<!doctype html><html><body style="margin:0;background:${C.paper2};padding:0">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.paper2}">
    <tr><td align="center" style="padding:24px 12px">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background:${C.paper};border:1px solid ${C.line};border-radius:10px;max-width:600px">
        <tr><td style="padding:24px 28px 8px 28px;border-bottom:2px solid ${C.ink}">
          <div style="font:700 22px Georgia,serif;color:${C.ink};letter-spacing:-.5px">Campaign Receipts</div>
          <div style="font:600 12px Arial,sans-serif;color:${C.red};text-transform:uppercase;letter-spacing:1px">Weekly receipt &middot; week of ${weekOf}</div>
        </td></tr>
        <tr><td style="padding:8px 28px 0 28px">
          <div style="font:600 13px Arial,sans-serif;color:${C.ink2};text-transform:uppercase;letter-spacing:.5px;margin:14px 0 0 0">The big three</div>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${storyBlocks}</table>
        </td></tr>
        ${receipts.length ? `<tr><td style="padding:18px 28px 8px 28px">
          <div style="font:600 13px Arial,sans-serif;color:${C.ink2};text-transform:uppercase;letter-spacing:.5px;margin:0 0 8px 0">This week's receipts</div>
          <ul style="margin:0;padding:0 0 0 18px">${receiptLines}</ul>
        </td></tr>` : ''}
        <tr><td style="padding:18px 28px 4px 28px">
          <div style="background:${C.paper2};border:1px solid ${C.line};border-left:3px solid ${C.red};border-radius:8px;padding:14px 16px">
            <div style="font:600 11px Arial,sans-serif;color:${C.red};text-transform:uppercase;letter-spacing:1px;margin:0 0 4px 0">Powered by Donor Intelligence AI Platform</div>
            <div style="font:400 13px/1.5 Arial,sans-serif;color:${C.ink2}">A paid subscription to investigate every connection between donor and vote. <a href="${SITE}/investigate" style="color:${C.red};font-weight:600">Investigate a donor &rarr;</a></div>
          </div>
        </td></tr>
        <tr><td style="padding:14px 28px 24px 28px;border-top:1px solid ${C.line}">
          <div style="font:400 12px/1.5 Arial,sans-serif;color:${C.ink2}">Every figure traces to a public FEC or Congress.gov record indexed by Campaign Receipts. <a href="${SITE}" style="color:${C.red}">campaignreceipts.com</a></div>
          <div style="font:400 11px/1.5 Arial,sans-serif;color:${C.ink2};margin:6px 0 0 0">Powered by the <a href="${SITE}/investigate" style="color:${C.red}">Donor Intelligence AI Platform</a> &mdash; a paid subscription to investigate every connection between donor and vote.</div>
        </td></tr>
      </table>
    </td></tr>
  </table></body></html>`
}
function esc(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

// ── MAIN ───────────────────────────────────────────────────
async function main() {
  const weekOf = isoMonday()
  console.log(`PHASE 1 — weekly-content-build · week of ${weekOf}${DRY ? ' · DRY-RUN' : ''}${NO_LLM ? ' · NO-LLM' : ''}`)

  // Idempotency: skip if already built (unless dry-run).
  if (!DRY) {
    const { data: existing } = await supabase.from('cr_newsletter_issues').select('id, status').eq('week_of', weekOf).maybeSingle()
    if (existing && existing.status !== 'skipped') {
      console.log(`Issue for ${weekOf} already exists (status=${existing.status}). Re-running re-assembles + overwrites.`)
    }
  }

  const candidates = await gatherCandidates()
  const alignmentReceipts = await gatherAlignmentReceipts()
  console.log(`Gathered ${candidates.length} ranked PAC-money candidates + ${alignmentReceipts.length} supporting alignment receipts.`)
  if (candidates.length === 0) {
    console.log('No PAC-money candidates found. Nothing to build (Phase 2 will find no issue and skip).')
    return
  }
  console.log('Top 5 by significance:')
  candidates.slice(0, 5).forEach((c, i) => console.log(`  ${i + 1}. [${c.score.toFixed(2)}] ${c.headline} (${fmtUsd(c.dollars)})`))

  const { stories, receipts, llm_used } = await synthesize(candidates, weekOf, alignmentReceipts)
  console.log(`\nSynthesized ${stories.length} top stories${llm_used ? ' (Sonnet)' : ' (offline stub)'}, ${receipts.length} transactional receipts.`)

  // Debug: --dump-bodies prints each story's full themed body_md (dry-run aid).
  if (DRY && process.argv.includes('--dump-bodies')) {
    for (const s of stories) {
      console.log(`\n──── BODY [${s.rank}] ${s.title} ────\n${s.body_md}\n`)
    }
  }

  // Step 4 — illustrations for up to the top 2 stories.
  for (let i = 0; i < Math.min(2, stories.length); i++) {
    stories[i].heroUrl = await generateIllustration(stories[i], weekOf, i + 1)
  }

  // Step 5 — blog posts.
  const articleBySlug = {}
  const articleRows = []
  for (const s of stories) {
    const row = await upsertArticle(s, weekOf, s.heroUrl || null)
    articleBySlug[s.title] = row.slug
    articleRows.push(row)
  }

  // Step 6 — video handoff for the top story.
  if (stories.length && articleRows.length) {
    await queueVideo(stories[0], articleRows[0], weekOf)
    console.log(`Video handoff queued for top story: ${articleRows[0].slug}`)
  }

  // Step 7 — assemble + persist newsletter.
  //
  // Tracked links need the issue id, but the HTML needs the tracked links —
  // so we persist the issue shell FIRST (gets the id), mint /r/ links against
  // it, build the HTML with those links, then update the row with the HTML.
  // Idempotent by week_of; a re-run re-mints fresh tokens (old ones still
  // resolve, harmless) and overwrites the HTML.
  const subject = `Campaign Receipts — ${stories[0]?.title || 'this week\'s receipts'}`
  const orderedSlugs = stories.map((s) => articleBySlug[s.title])
  const textBody = [
    `Campaign Receipts — week of ${weekOf}`,
    '',
    'THE BIG THREE',
    ...stories.map((s, i) => `${i + 1}. ${s.title}\n   ${s.hook}\n   ${SITE}/articles/${articleBySlug[s.title]}`),
    '',
    'THIS WEEK\'S RECEIPTS',
    ...receipts.map((r) => `- ${r.line}`),
    '',
    'Powered by the Donor Intelligence AI Platform — a paid subscription to',
    `investigate every connection between donor and vote. ${SITE}/investigate`,
  ].join('\n')

  if (DRY) {
    const linkMap = await mintTrackedLinks(null, weekOf, orderedSlugs)
    const html = buildHtml(weekOf, stories, receipts, articleBySlug, (slug) => linkMap[slug] || null)
    console.log('\n──── DRY-RUN: assembled issue ────')
    console.log(`subject: ${subject}`)
    console.log(`top_story_slugs: ${orderedSlugs.join(', ')}`)
    console.log(`receipts_count: ${receipts.length}`)
    console.log(`html bytes: ${html.length}`)
    console.log('\n--- text preview ---\n' + textBody.slice(0, 1200))
    console.log('\n(no DB writes, no image spend)')
    return
  }

  // 7a. Persist the issue shell (status='built') to obtain its id.
  const { data: issue, error: shellErr } = await supabase
    .from('cr_newsletter_issues')
    .upsert(
      {
        week_of: weekOf,
        subject,
        text_body: textBody,
        top_story_slugs: orderedSlugs,
        receipts_count: receipts.length,
        status: 'built',
        built_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'week_of' },
    )
    .select('id')
    .single()
  if (shellErr) throw new Error(`issue upsert: ${shellErr.message}`)

  // 7b. Mint tracked links against the issue, then build + store the HTML.
  const linkMap = await mintTrackedLinks(issue.id, weekOf, orderedSlugs)
  const html = buildHtml(weekOf, stories, receipts, articleBySlug, (slug) => linkMap[slug] || null)
  const { error: htmlErr } = await supabase
    .from('cr_newsletter_issues')
    .update({ html, updated_at: new Date().toISOString() })
    .eq('id', issue.id)
  if (htmlErr) throw new Error(`issue html update: ${htmlErr.message}`)
  console.log(`\n✓ Issue built + persisted for ${weekOf} (${Object.keys(linkMap).length} tracked links). Phase 2 (Friday) will send it.`)
}

main().catch((e) => {
  console.error('FATAL:', e.message)
  process.exit(1)
})
