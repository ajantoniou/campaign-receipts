#!/usr/bin/env node
//
// scripts/generate-race-funding-article.mjs
//
// Auto-generates a "who's funding the [district] race" article for an
// active cr_races row. Per founder rev-7 batch C+ (2026-05-17):
//   - Quality bar (b): Haiku-rewritten from structured FEC data.
//   - Guardrails: sources-mandatory (refuses to publish without source
//     refs on the race), no predictions, first-time generations land
//     in status='pending_review' for human approval, regenerations
//     update the same article in place (same slug).
//
// Usage:
//   node scripts/generate-race-funding-article.mjs --slug=ky-04-2026-r-primary [--dry-run] [--force-publish]
//   node scripts/generate-race-funding-article.mjs --all-active [--dry-run]
//
// Env:
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY -- required
//   ANTHROPIC_API_KEY                       -- required unless --dry-run
//
// Generator version is stamped on each article so future improvements
// can target specific generations for regeneration.

import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'

const GENERATOR_VERSION = 'haiku-race-funding-v1'
const HAIKU_MODEL = 'claude-haiku-4-5'  // adjust if Anthropic model id changes

// ── Env + flags ──────────────────────────────────────────────

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const args = process.argv.slice(2)
const DRY = args.includes('--dry-run')
const ALL = args.includes('--all-active')
const FORCE_PUBLISH = args.includes('--force-publish')
const slugArg = args.find((a) => a.startsWith('--slug='))?.split('=')[1]

if (!DRY && !ANTHROPIC_KEY) {
  console.error('Missing ANTHROPIC_API_KEY (required unless --dry-run)')
  process.exit(1)
}
if (!slugArg && !ALL) {
  console.error('Usage: --slug=<race-slug> | --all-active  [--dry-run] [--force-publish]')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } })
const anthropic = DRY ? null : new Anthropic({ apiKey: ANTHROPIC_KEY })

// ── Helpers ─────────────────────────────────────────────────

function fmtMoney(n) {
  if (n == null) return '—'
  const num = Number(n)
  if (num >= 1_000_000) return `$${(num / 1_000_000).toFixed(1)}M`
  if (num >= 1_000) return `$${Math.round(num / 1_000).toLocaleString()}K`
  return `$${num.toLocaleString()}`
}

function articleSlugForRace(race) {
  // Stable mapping: race slug -> article slug. Lets us regenerate in
  // place because the same input produces the same output URL.
  return `who-is-funding-${race.slug}`
}

// Prompt template. We feed the LLM structured data + explicit rules
// so it can't drift into prediction territory. Tone reference: a CR
// staff editor (paper-warm, primary-sourced, party-blind).
function buildPrompt(race) {
  const candidatesJson = JSON.stringify(race.candidates, null, 2)
  const pacsJson = JSON.stringify(race.top_pacs, null, 2)
  const sourcesJson = JSON.stringify(race.primary_sources, null, 2)

  return `You are an editor at CampaignReceipts, a nonpartisan U.S. campaign-finance accountability site. Write a 600-900 word article titled exactly:

"Who's funding the ${race.district || race.state} ${race.cycle} ${race.race_type.replace(/_/g, ' ')}"

Editorial constraints (HARD RULES — violation invalidates the article):

1. NO PREDICTIONS. Never write that a candidate "will win" or "is likely to lose." You can cite polling that has been reported (when included in the data below), but only as reported, not as forecast.
2. PRIMARY-SOURCE DISCIPLINE. Cite each publication by name (e.g. "according to Axios" or "as Ballotpedia reported"). Use only publications and URLs listed in the SOURCES array below. Do not invent sources.
3. NONPARTISAN VOICE. Apply the same scrutiny to every candidate and every super PAC. If the structure is intra-Republican (e.g. Trump-aligned PACs against an incumbent Republican), say so neutrally. Don't moralize.
4. MONEY FLOWS ONLY. Explain who is spending what, on whom, and where the money originates. Do not editorialize on policy.
5. PAPER-WARM TONE. Plain English. Short sentences. Active verbs. Avoid clichés like "rocked," "fiery," "showdown." This is a receipt, not a recap.
6. STRUCTURE:
   - Open with the headline number (largest IE figure or total spend) and what makes the race notable.
   - Section heading "## The candidates" — one paragraph per candidate covering their own campaign cash, IE supporting them, IE attacking them, and any noteworthy endorsement.
   - Section heading "## The outside money" — rank the top super PACs by spend, attribute each one's affiliation, name the target candidate.
   - Section heading "## What we don't know yet" — one short paragraph naming open questions (e.g. final spend report not in yet, no public polling).
7. NO HERO IMAGE PROMPT. The article ships text-only.
8. Output is plain markdown. No frontmatter, no YAML, no HTML.

DATA:

Race headline: ${race.headline}
District: ${race.district || race.state}
Primary date: ${race.primary_date || race.election_date}
Race type: ${race.race_type}
Cycle: ${race.cycle}
Total race spend: ${fmtMoney(race.total_spend_usd)}
Total super PAC IE: ${fmtMoney(race.total_ie_usd)}
Blurb (CR editorial summary, may quote): ${race.blurb || '(none)'}

Candidates (JSON):
${candidatesJson}

Top super PACs (JSON):
${pacsJson}

Sources (JSON — cite these by publication name only):
${sourcesJson}

Write the article now. Start directly with the opening paragraph — no preamble.`
}

// Also generate a 1-2 sentence dek (subhead) in a second small Haiku call.
async function generateDek(race, body) {
  if (!anthropic) return null
  const resp = await anthropic.messages.create({
    model: HAIKU_MODEL,
    max_tokens: 200,
    messages: [
      {
        role: 'user',
        content: `Write a one-sentence subhead (max 25 words) for this article. Plain English, neutral voice, no predictions. Output only the sentence, no quotes.

Title: Who's funding the ${race.district} ${race.cycle} ${race.race_type.replace(/_/g, ' ')}
Opening paragraph: ${body.split('\n\n')[0]}`,
      },
    ],
  })
  return resp.content[0]?.type === 'text' ? resp.content[0].text.trim() : null
}

async function generateBody(race) {
  if (DRY) {
    return `[DRY RUN] Article body would generate here for ${race.slug}.\n\nHeadline: ${race.headline}\nCandidates: ${race.candidates.length}\nTop PACs: ${race.top_pacs.length}\nSources: ${race.primary_sources.length}`
  }
  const resp = await anthropic.messages.create({
    model: HAIKU_MODEL,
    max_tokens: 2000,
    messages: [{ role: 'user', content: buildPrompt(race) }],
  })
  const text = resp.content[0]?.type === 'text' ? resp.content[0].text.trim() : ''
  if (!text) throw new Error('Empty response from Haiku')
  return text
}

// ── Main per-race generator ────────────────────────────────

async function generateForRace(race) {
  // Guardrail 1: refuse to publish without primary sources.
  if (!Array.isArray(race.primary_sources) || race.primary_sources.length === 0) {
    console.warn(`[skip] ${race.slug}: no primary_sources on file`)
    return { skipped: true, reason: 'no_primary_sources' }
  }

  const articleSlug = articleSlugForRace(race)

  // Check if article already exists.
  const { data: existing } = await supabase
    .from('cr_articles')
    .select('slug, status, generator_version')
    .eq('slug', articleSlug)
    .maybeSingle()

  console.log(`[${race.slug}] -> ${articleSlug} (existing: ${existing ? existing.status : 'new'})`)

  // Generate body + dek.
  const body_md = await generateBody(race)
  const dek = DRY ? '(dry-run dek)' : await generateDek(race, body_md)

  const title = `Who's funding the ${race.district || race.state} ${race.cycle} ${race.race_type.replace(/_/g, ' ')}`

  // Decide status:
  //   - If existing row, preserve its status (regeneration in place).
  //   - If new, default to 'pending_review' UNLESS --force-publish.
  let status = 'pending_review'
  if (existing) {
    status = existing.status
  } else if (FORCE_PUBLISH) {
    status = 'published'
  }

  const payload = {
    slug: articleSlug,
    kind: 'race_funding',
    title,
    dek,
    body_md,
    source_refs: race.primary_sources,
    related_race_id: race.id,
    status,
    published_at: status === 'published' ? new Date().toISOString() : null,
    generator: 'haiku-race-funding',
    generator_version: GENERATOR_VERSION,
    last_regenerated_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }

  if (DRY) {
    console.log(`[dry-run] would upsert:`, {
      slug: payload.slug,
      title: payload.title,
      dek: payload.dek,
      body_chars: payload.body_md.length,
      sources: payload.source_refs.length,
      status: payload.status,
    })
    return { skipped: false, dry: true }
  }

  const { error } = await supabase
    .from('cr_articles')
    .upsert(payload, { onConflict: 'slug' })

  if (error) {
    console.error(`[error] upsert failed for ${articleSlug}:`, error)
    return { skipped: false, error }
  }

  console.log(`[ok] ${articleSlug} (${status}, ${body_md.length} chars, ${payload.source_refs.length} sources)`)
  return { skipped: false, ok: true, slug: articleSlug, status }
}

// ── Driver ──────────────────────────────────────────────────

async function main() {
  let races = []
  if (ALL) {
    const { data } = await supabase
      .from('cr_races')
      .select('*')
      .eq('is_active', true)
    races = data || []
  } else {
    const { data } = await supabase
      .from('cr_races')
      .select('*')
      .eq('slug', slugArg)
      .maybeSingle()
    if (data) races = [data]
  }

  if (races.length === 0) {
    console.error('No matching races found')
    process.exit(1)
  }

  console.log(`Generating for ${races.length} race(s)${DRY ? ' (DRY RUN)' : ''}...\n`)

  const results = []
  for (const race of races) {
    try {
      const r = await generateForRace(race)
      results.push({ race: race.slug, ...r })
    } catch (e) {
      console.error(`[fatal] ${race.slug}:`, e.message)
      results.push({ race: race.slug, error: e.message })
    }
  }

  console.log('\n── Summary ──')
  for (const r of results) {
    console.log(JSON.stringify(r))
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
