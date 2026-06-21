#!/usr/bin/env node
//
// scripts/generate-weekly-stories.mjs  —  Stage E of the Friday Receipts engine.
//
// Consumes this week's cr_story_candidates (ranked, by branch) and generates a
// blog article for each with Claude Opus, writing to cr_articles (kind='weekly_story').
// The newsletter build (Stage F) then groups these by branch into Friday Receipts.
//
// Guardrails (mirrors generate-race-funding-article.mjs, which is battle-tested):
//   - Every figure traces to the candidate's source_refs (FEC-derived). The prompt
//     forbids inventing numbers; if it's not in the data, it doesn't run.
//   - NO predictions, NO claims of intent/quid-pro-quo. State facts: who gave what,
//     who they fund, and (when present) the vote. Timing may be reported, never
//     asserted as cause. This is the libel firewall.
//   - Nonpartisan voice, paper-warm tone, plain markdown.
//
// Idempotent: stable slug per (week, branch, candidate). If an article already
// exists 'published' for that slug, SKIP the Opus call (no double-spend). Stamps
// cr_story_candidates.article_slug/article_status and cr_weekly_runs.stage_generate.
//
// Usage:
//   node scripts/generate-weekly-stories.mjs            # generate this week's slate
//   node scripts/generate-weekly-stories.mjs --dry-run  # no Opus calls, no writes
//   node scripts/generate-weekly-stories.mjs --week-of=YYYY-MM-DD
//   node scripts/generate-weekly-stories.mjs --limit=6  # cap successes (default 6)
//
// Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ANTHROPIC_API_KEY (unless --dry-run)

import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'
import { appendFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

// Switched Opus→Haiku (founder 2026-06-21): the job is constrained summarization of
// STRUCTURED, pre-verified facts (not open reasoning), so Haiku is the right tool —
// ~12x cheaper for 6+ articles/week, and the deterministic facts + checklist do the
// heavy lifting on accuracy. The prompt forbids inventing any number.
const GENERATOR_VERSION = 'haiku-weekly-story-v2'
const STORY_MODEL = 'claude-haiku-4-5'      // adjust if Anthropic model id changes
const DEK_MODEL = 'claude-haiku-4-5'

const __dirname = dirname(fileURLToPath(import.meta.url))
const COST_LOG = join(__dirname, '.external-costs.jsonl')

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY
if (!SUPABASE_URL || !SUPABASE_KEY) { console.error('Missing Supabase env'); process.exit(1) }

const args = process.argv.slice(2)
const DRY = args.includes('--dry-run')
const weekArg = args.find((a) => a.startsWith('--week-of='))?.split('=')[1]
const LIMIT = Number(args.find((a) => a.startsWith('--limit='))?.split('=')[1] ?? 6)
if (!DRY && !ANTHROPIC_KEY) { console.error('Missing ANTHROPIC_API_KEY (unless --dry-run)'); process.exit(1) }

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } })
const anthropic = DRY ? null : new Anthropic({ apiKey: ANTHROPIC_KEY })
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

function isoMonday(d = new Date()) {
  const x = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
  const dow = (x.getUTCDay() + 6) % 7
  x.setUTCDate(x.getUTCDate() - dow)
  return x.toISOString().slice(0, 10)
}
const WEEK_OF = weekArg || isoMonday()
const fmtMoney = (n) => {
  const num = Number(n) || 0
  if (num >= 1e6) return `$${(num / 1e6).toFixed(1)}M`
  if (num >= 1e3) return `$${Math.round(num / 1e3).toLocaleString()}K`
  return `$${num.toLocaleString()}`
}
function logCost(note, usd = 0) {
  try { appendFileSync(COST_LOG, JSON.stringify({ ts: new Date().toISOString(), issueId: 'generate-weekly-stories', vendor: 'anthropic/haiku', cost_usd: usd, note }) + '\n') } catch {}
}

// Pull fresh sourced figures for a candidate at generation time (so the article
// quotes current numbers, not a stale snapshot).
async function enrich(cand) {
  const ref = (cand.source_refs && cand.source_refs[0]) || {}
  const out = { ...ref, branch: cand.branch, headline: cand.headline }
  if (ref.politician_id) {
    // Top donors + PAC money for this politician.
    const { data: donors } = await supabase
      .from('cr_top_donors')
      .select('donor_name, donor_employer, industry_label, total_contributed, is_pac')
      .eq('politician_id', ref.politician_id)
      .order('total_contributed', { ascending: false })
      .limit(8)
    out.top_donors = (donors || []).map((d) => ({
      name: d.donor_name, employer: d.donor_employer, industry: d.industry_label,
      amount: Number(d.total_contributed), is_pac: d.is_pac,
    }))
    // Vote-alignment signals (facts: how their votes line up with donor industries).
    const { data: align } = await supabase
      .from('cr_donor_vote_alignment')
      .select('industry_label, alignment_score, vote')
      .eq('politician_id', ref.politician_id)
      .order('alignment_score', { ascending: false })
      .limit(5)
    out.alignments = align || []

    // Committee seats + role (the "gatekeeper of jurisdiction" archetype). Needs
    // the politician's bioguide.
    const { data: pol } = await supabase
      .from('cr_politicians').select('bioguide').eq('id', ref.politician_id).maybeSingle()
    if (pol?.bioguide) {
      const { data: seats } = await supabase
        .from('cr_committee_assignments')
        .select('thomas_id, role, party')
        .eq('bioguide', pol.bioguide)
      const codes = (seats || []).map((s) => s.thomas_id)
      const nameByCode = {}
      if (codes.length) {
        const { data: cs } = await supabase.from('cr_congress_committees').select('thomas_id, name, chamber').in('thomas_id', codes)
        for (const c of cs || []) nameByCode[c.thomas_id] = { name: c.name, chamber: c.chamber }
      }
      // Only surface full (non-subcommittee) committees + any leadership role — that's
      // the newsworthy "gatekeeper" signal, not every minor subcommittee seat.
      out.committee_seats = (seats || [])
        .map((s) => ({ committee: nameByCode[s.thomas_id]?.name || s.thomas_id, chamber: nameByCode[s.thomas_id]?.chamber, role: s.role }))
        .filter((s) => s.role !== 'member' || !/:/.test(s.committee)) // keep full committees + any leadership
        .slice(0, 8)
      out.chair_or_ranking = out.committee_seats.filter((s) => /Chair|Ranking|Vice/.test(s.role))
    }
  }
  if (ref.bill_id) {
    const { data: bill } = await supabase.from('cr_bills')
      .select('title, short_title, bill_type, bill_number, congress').eq('id', ref.bill_id).maybeSingle()
    out.bill = bill || null
    const { data: trail } = await supabase.from('cr_bill_money_trail')
      .select('industry_label, total_from_industry, n_sponsors_funded')
      .eq('bill_id', ref.bill_id).order('total_from_industry', { ascending: false }).limit(6)
    out.bill_money = trail || []
  }
  return out
}

function buildPrompt(data) {
  const subject = data.politician_name || (data.bill ? `${(data.bill.bill_type||'').toUpperCase()} ${data.bill.bill_number}` : 'this money trail')
  return `You are an editor at CampaignReceipts, a nonpartisan U.S. campaign-finance accountability site. Write a 450-750 word money-trail article from the structured DATA below. Your job is faithful SUMMARY of facts that are already verified — add nothing.

HARD RULES (violating any invalidates the article):
1. ONLY use figures, names, donors, committees, and votes present in the DATA. NEVER invent, estimate, round differently, or infer a number/donor/date. If it's not in the DATA, it does not appear in the article.
2. NO PREDICTIONS, NO MOTIVE, NO CAUSATION. Report the relationship and (if present) the timeline as FACTS. You may NOT assert money caused a vote or seat. BANNED words/phrases: "bought," "paid for," "bribe," "kickback," "in exchange for," "quid pro quo," "corrupt," "in the pocket of," "puppet," "voted because of," "rewarded donors," "sold out." Let the juxtaposition speak.
3. THE GATEKEEPER FRAME (use only if committee_seats present): it is fully factual to state "X sponsored this bill AND sits on / chairs [Committee], which has jurisdiction" and "X received \$Y from [industry] PACs." State both facts; never assert one explains the other.
4. INNOCENT EXPLANATIONS REQUIRED: include that contributions are legal and disclosed, and that donors often back lawmakers already aligned with them (money follows alignment). Note the member was not reached for comment (this is an automated brief).
5. NONPARTISAN. Identical scrutiny regardless of party.
6. PAPER-WARM TONE. Plain English, short sentences, active verbs. A receipt, not a rant. No "shocking," "fiery," "bombshell."
7. STRUCTURE (plain markdown, no frontmatter/HTML, no title line):
   - Lead: the single most concrete verifiable fact (a dollar figure + the role/seat or the ranking).
   - "## Who's paying" — donors/PACs and amounts, largest first. If an industry label is "?" or missing, say "industry not classified" rather than guessing.
   - "## The committee" — ONLY if committee_seats present: the seat(s)/role and that it's the relevant chamber. Skip this section entirely if absent.
   - "## The record" — votes / donor-vote alignment IF present; else a neutral line on what the money funds.
   - "## What we don't know" — REQUIRED: name the data's limits (e.g. no contribution dates, no bill-benefit linkage, individual-donor identity not verified), and the innocent explanations from rule 4.
8. End EXACTLY with: "Campaign contributions are legal and disclosed. Correlation between donations and legislative action does not establish that one caused the other. Figures are from public FEC filings and official congressional records."

DATA (subject: ${subject}; branch: ${data.branch}):
${JSON.stringify(data, null, 2)}

Write the article now. Start directly with the lead paragraph.`
}

// Deterministic post-check: reject a draft that smuggled in a banned causation
// phrase despite the prompt. Cheap libel firewall independent of the model.
const BANNED = [
  /\bbought\b/i, /\bpaid for\b/i, /\bbrib/i, /\bkickback/i, /in exchange for/i,
  /quid pro quo/i, /\bcorrupt/i, /in the pocket of/i, /\bpuppet\b/i,
  /voted because of/i, /rewarded (his|her|their) donors/i, /\bsold out\b/i,
]
function bannedPhraseIn(text) {
  for (const re of BANNED) if (re.test(text)) return re.source
  return null
}

async function generateBody(data) {
  if (DRY) return `[DRY RUN] article for ${data.politician_name || data.headline}. donors:${(data.top_donors||[]).length} seats:${(data.committee_seats||[]).length} chair/ranking:${(data.chair_or_ranking||[]).length}`
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const resp = await anthropic.messages.create({ model: STORY_MODEL, max_tokens: 1800, messages: [{ role: 'user', content: buildPrompt(data) }] })
      const text = resp.content[0]?.type === 'text' ? resp.content[0].text.trim() : ''
      if (!text) continue
      // Deterministic libel firewall: reject + retry if a banned phrase slipped in.
      const bad = bannedPhraseIn(text)
      if (bad) { console.log(`    (retry: banned phrase /${bad}/)`); continue }
      logCost(`article:${data.politician_slug || data.headline}`)
      return text
    } catch (e) {
      if (attempt === 2) throw e
      await sleep(2000 * (attempt + 1))
    }
  }
  throw new Error('empty/failed/banned response after retries')
}

async function generateDek(title, body) {
  if (DRY || !anthropic) return '(dek)'
  try {
    const resp = await anthropic.messages.create({ model: DEK_MODEL, max_tokens: 120, messages: [{ role: 'user', content: `One-sentence subhead (max 25 words), neutral, no predictions, no quotes. Title: ${title}\nOpening: ${body.split('\n\n')[0]}` }] })
    return resp.content[0]?.type === 'text' ? resp.content[0].text.trim() : null
  } catch { return null }
}

const branchSlug = (b) => b.toLowerCase()
function slugFor(cand) {
  const ref = (cand.source_refs && cand.source_refs[0]) || {}
  const base = ref.politician_slug || (ref.bill_id ? `bill-${String(ref.bill_id).slice(0, 8)}` : `c${cand.rank}`)
  return `friday-receipts-${WEEK_OF}-${branchSlug(cand.branch)}-${base}`
}

async function main() {
  console.log(`[${new Date().toISOString()}] Generating weekly stories for ${WEEK_OF}${DRY ? ' (DRY RUN)' : ''} (limit ${LIMIT})`)
  const { data: cands, error } = await supabase
    .from('cr_story_candidates').select('*').eq('week_of', WEEK_OF).order('rank')
  if (error) { console.error(error.message); process.exit(1) }
  if (!cands?.length) { console.log('No candidates for this week — run detect-new-connections first.'); return }

  let succeeded = 0, failed = 0, skipped = 0
  const slugs = []
  for (const cand of cands) {
    if (succeeded >= LIMIT) break
    const slug = slugFor(cand)
    // Idempotency: skip if already published.
    const { data: existing } = await supabase.from('cr_articles').select('slug, status').eq('slug', slug).maybeSingle()
    if (existing && existing.status === 'published') {
      console.log(`  [skip] ${slug} already published`)
      await supabase.from('cr_story_candidates').update({ article_slug: slug, article_status: 'published' }).eq('id', cand.id)
      slugs.push(slug); succeeded++; skipped++; continue
    }

    try {
      const data = await enrich(cand)
      const body_md = await generateBody(data)
      const title = cand.headline
      const dek = await generateDek(title, body_md)
      // Guardrail: must have at least one source ref.
      const refs = cand.source_refs && cand.source_refs.length ? cand.source_refs : []
      if (refs.length === 0) { console.log(`  [skip] ${slug}: no source refs`); failed++; continue }

      if (DRY) {
        console.log(`  [dry] would write ${slug} (${body_md.length} chars, branch ${cand.branch})`)
        slugs.push(slug); succeeded++; continue
      }
      const payload = {
        slug, kind: 'weekly_story', title, dek, body_md,
        source_refs: refs.map((r) => ({ ...r, branch: cand.branch })),
        related_weekly_id: null,
        status: 'published',
        published_at: new Date().toISOString(),
        generator: 'haiku-weekly-story',
        generator_version: GENERATOR_VERSION,
        last_regenerated_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        politician_ids: refs[0]?.politician_id ? [refs[0].politician_id] : null,
      }
      const { error: upErr } = await supabase.from('cr_articles').upsert(payload, { onConflict: 'slug' })
      if (upErr) { console.error(`  [err] ${slug}: ${upErr.message}`); failed++; continue }
      await supabase.from('cr_story_candidates').update({ article_slug: slug, article_status: 'published' }).eq('id', cand.id)
      console.log(`  [ok] ${slug} (${cand.branch}, ${body_md.length} chars)`)
      slugs.push(slug); succeeded++
      await sleep(1000)
    } catch (e) {
      console.error(`  [fail] ${slug}: ${e.message}`); failed++
    }
  }

  console.log(`\nGenerated ${succeeded} (incl ${skipped} already-published), ${failed} failed.`)
  if (!DRY) {
    await supabase.from('cr_weekly_runs').upsert(
      { week_of: WEEK_OF, stage_generate: { requested: cands.length, succeeded, failed, skipped, slugs }, updated_at: new Date().toISOString() },
      { onConflict: 'week_of' })
  }
}

main().catch((e) => { console.error('FATAL:', e.message); process.exit(1) })
