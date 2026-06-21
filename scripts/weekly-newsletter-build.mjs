#!/usr/bin/env node
//
// scripts/weekly-newsletter-build.mjs  —  Stage F: build "Friday Receipts".
//
// Builds the weekly newsletter issue (cr_newsletter_issues, status='built') from
// this week's published weekly_story articles, ORGANIZED BY BRANCH OF GOVERNMENT.
// Stage G (weekly-newsletter-send.mjs) then sends it Friday morning, timezone-aware.
//
// Structure (per the viral-newsletter spec):
//   - Receipt of the Week (the top-ranked story) — lead, above the fold.
//   - The Ledger, grouped by branch: Executive / House / Senate / States.
//     Each story = headline + summary (dek) + a CLICK-TRACKED "Read the receipt" link.
//   - Click links go through /c/[token] so the Saturday digest can rank by clicks.
//
// Free vs paid: this builder produces ONE issue body. The free/paid split is a
// future refinement at send time; for now every subscriber gets the full Ledger
// (we have a tiny list). The architecture (cr_newsletter_links) is in place to
// gate later.
//
// Fallback: if NO weekly_story articles exist for the week, fall back to the
// legacy cr_weekly recent-picks so subscribers still get something; if that's also
// empty, mark the issue 'skipped' (send script exits cleanly on 'skipped').
//
// Idempotent: upsert on week_of; never clobbers a 'sent' issue. Rewrites
// cr_newsletter_links for the issue on each build.
//
// Usage:
//   node scripts/weekly-newsletter-build.mjs [--dry-run] [--week-of=YYYY-MM-DD]

import { createClient } from '@supabase/supabase-js'
import { nanoid } from 'nanoid'

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const SITE = (process.env.SITE || process.env.NEXT_PUBLIC_SITE_URL || 'https://campaignreceipts.com').replace(/\/$/, '')
if (!SUPABASE_URL || !SUPABASE_KEY) { console.error('Missing Supabase env'); process.exit(1) }
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } })

const args = process.argv.slice(2)
const DRY = args.includes('--dry-run')
const weekArg = args.find((a) => a.startsWith('--week-of='))?.split('=')[1]

function isoMonday(d = new Date()) {
  const x = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
  const dow = (x.getUTCDay() + 6) % 7
  x.setUTCDate(x.getUTCDate() - dow)
  return x.toISOString().slice(0, 10)
}
const WEEK_OF = weekArg || isoMonday()
function fmtWeek(iso) {
  return new Date(iso + 'T00:00:00Z').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
}
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))

const BRANCH_ORDER = ['Executive', 'House', 'Senate', 'States']
const BRANCH_LABEL = { Executive: 'The Executive', House: 'The House', Senate: 'The Senate', States: 'The States' }

// ── Content selection: this week's published weekly_story articles ──
async function weeklyArticles() {
  const { data, error } = await supabase
    .from('cr_articles')
    .select('slug, title, dek, source_refs, published_at')
    .eq('kind', 'weekly_story')
    .like('slug', `friday-receipts-${WEEK_OF}-%`)
    .eq('status', 'published')
    .order('published_at', { ascending: false })
  if (error) { console.error('articles read error:', error.message); return [] }
  const articles = (data || []).map((a) => {
    const ref = Array.isArray(a.source_refs) && a.source_refs[0] ? a.source_refs[0] : {}
    return { slug: a.slug, title: a.title, dek: a.dek, branch: ref.branch || 'States', amount: ref.amount || 0 }
  })

  // Attach any related live Kalshi market (set by match-kalshi-markets.mjs) by
  // joining on the candidate's article_slug. Only stories with a real match get one.
  const { data: cands } = await supabase
    .from('cr_story_candidates')
    .select('article_slug, kalshi_match')
    .eq('week_of', WEEK_OF)
  // Only attach matches whose YES price ROUNDS to >=1¢. A "YES 0¢" line reads as
  // broken (a 0.4¢ longshot rounds to 0¢), so require >=0.5% to display.
  const matchBySlug = new Map(
    (cands || [])
      .filter((c) => c.article_slug && c.kalshi_match && Math.round(Number(c.kalshi_match.yes_bid) * 100) >= 1)
      .map((c) => [c.article_slug, c.kalshi_match]))
  for (const a of articles) a.kalshi = matchBySlug.get(a.slug) || null
  return articles
}

// Legacy fallback: recent cr_weekly picks linked to politician pages.
async function legacyStories() {
  const { data } = await supabase
    .from('cr_weekly').select('headline, blurb, politician_id')
    .order('picked_at', { ascending: false }).limit(4)
  const rows = data || []
  const ids = [...new Set(rows.map((r) => r.politician_id).filter(Boolean))]
  const slugById = {}
  if (ids.length) {
    const { data: pols } = await supabase.from('cr_politicians').select('id, slug').in('id', ids)
    for (const p of pols || []) slugById[p.id] = p.slug
  }
  return rows.map((r) => ({
    slug: null, title: r.headline, dek: r.blurb, branch: 'States', amount: 0,
    _legacyUrl: slugById[r.politician_id] ? `${SITE}/politician/${slugById[r.politician_id]}` : `${SITE}/leaderboard`,
  }))
}

// Create a tracked /c/[token] link row for an article and return the token URL.
async function trackedLink(issueId, story, links) {
  const token = nanoid(10)
  const target = story.slug ? `${SITE}/articles/${encodeURIComponent(story.slug)}` : (story._legacyUrl || `${SITE}/leaderboard`)
  // Matches the existing cr_newsletter_links schema:
  //   token, issue_id, week_of, article_slug, destination
  links.push({ token, issue_id: issueId, week_of: WEEK_OF, article_slug: story.slug || `legacy-${token}`, destination: target })
  return `${SITE}/c/${token}`
}

// ── Email rendering ──
function renderHtml(weekOf, lead, byBranch, linkFor) {
  const C = { ink: '#1a1a1a', muted: '#666', line: '#e5e5e5', accent: '#0b5', paper: '#faf8f4' }
  const kalshiLine = (s) => s.kalshi ? `
      <div style="margin:12px 0 0 0;padding:10px 12px;background:${C.paper};border-radius:8px;font:400 13px Helvetica,Arial,sans-serif;color:${C.muted}">
        📊 Related market: <a href="${esc(s.kalshi.url)}" style="color:${C.ink};font-weight:700;text-decoration:none">${esc(s.kalshi.event_title)}</a>
        — Kalshi has YES at <strong>${Math.round(Number(s.kalshi.yes_bid) * 100)}¢</strong>.
      </div>` : ''
  const card = (s) => `
    <div style="border:1px solid ${C.line};border-radius:10px;padding:18px;margin:0 0 14px 0;background:#fff">
      <div style="font:700 17px Helvetica,Arial,sans-serif;color:${C.ink};margin:0 0 6px 0;line-height:1.25">${esc(s.title)}</div>
      ${s.dek ? `<div style="font:400 14px Helvetica,Arial,sans-serif;color:${C.muted};margin:0 0 12px 0;line-height:1.5">${esc(s.dek)}</div>` : ''}
      <a href="${linkFor(s)}" style="display:inline-block;font:700 13px Helvetica,Arial,sans-serif;color:#fff;background:${C.ink};text-decoration:none;padding:9px 16px;border-radius:999px">Read the receipt →</a>
      ${kalshiLine(s)}
    </div>`

  const ledger = BRANCH_ORDER.filter((b) => byBranch[b]?.length).map((b) => `
    <div style="margin:26px 0 0 0">
      <div style="font:700 13px monospace;color:${C.accent};text-transform:uppercase;letter-spacing:1.5px;border-bottom:2px solid ${C.line};padding-bottom:6px;margin-bottom:14px">${esc(BRANCH_LABEL[b])}</div>
      ${byBranch[b].map(card).join('')}
    </div>`).join('')

  return `<!doctype html><html><body style="margin:0;padding:0;background:${C.paper}">
  <div style="max-width:600px;margin:0 auto;padding:32px 20px;font-family:Helvetica,Arial,sans-serif">
    <div style="text-align:center;margin:0 0 8px 0">
      <div style="font:800 24px Helvetica,Arial,sans-serif;color:${C.ink};letter-spacing:-.5px">💰 Friday Receipts</div>
      <div style="font:600 12px monospace;color:${C.muted};text-transform:uppercase;letter-spacing:1px;margin-top:4px">Campaign Receipts · ${esc(fmtWeek(weekOf))}</div>
    </div>
    ${lead ? `
    <div style="margin:24px 0 8px 0;padding:20px;background:#fff;border:2px solid ${C.ink};border-radius:12px">
      <div style="font:700 11px monospace;color:${C.accent};text-transform:uppercase;letter-spacing:1.5px;margin-bottom:8px">Receipt of the Week</div>
      <div style="font:800 21px Helvetica,Arial,sans-serif;color:${C.ink};line-height:1.2;margin-bottom:8px">${esc(lead.title)}</div>
      ${lead.dek ? `<div style="font:400 15px Helvetica,Arial,sans-serif;color:${C.muted};line-height:1.5;margin-bottom:14px">${esc(lead.dek)}</div>` : ''}
      <a href="${linkFor(lead)}" style="display:inline-block;font:700 14px Helvetica,Arial,sans-serif;color:#fff;background:${C.accent};text-decoration:none;padding:11px 20px;border-radius:999px">See the full receipt →</a>
      ${kalshiLine(lead)}
    </div>` : ''}
    <p style="font:400 14px Helvetica,Arial,sans-serif;color:${C.muted};line-height:1.55;margin:22px 0 0">The Ledger — new money connections this week, by branch of government. Every figure is from public FEC filings.</p>
    ${ledger}
    <div style="border-top:1px solid ${C.line};margin-top:28px;padding-top:20px;text-align:center">
      <a href="${SITE}/leaderboard" style="font:700 14px Helvetica,Arial,sans-serif;color:${C.ink}">Explore the full donor database →</a>
      <p style="font:400 12px Helvetica,Arial,sans-serif;color:${C.muted};line-height:1.5;margin:20px 0 0 0">
        You get Friday Receipts because you subscribed at campaignreceipts.com.<br/>
        All data is from public FEC filings. Timing does not prove causation. <a href="${SITE}/dashboard" style="color:${C.muted}">Manage</a>.
      </p>
    </div>
  </div></body></html>`
}

function renderText(weekOf, lead, byBranch, linkFor) {
  const L = [`FRIDAY RECEIPTS — ${fmtWeek(weekOf)}`, ``]
  const kTxt = (s) => s.kalshi ? `  📊 Related market: ${s.kalshi.event_title} — Kalshi YES ${Math.round(Number(s.kalshi.yes_bid) * 100)}¢ · ${s.kalshi.url}` : null
  if (lead) {
    L.push(`** RECEIPT OF THE WEEK **`, lead.title)
    if (lead.dek) L.push(lead.dek)
    L.push(`→ ${linkFor(lead)}`)
    const k = kTxt(lead); if (k) L.push(k)
    L.push(``)
  }
  L.push(`THE LEDGER — new money connections by branch:`, ``)
  for (const b of BRANCH_ORDER) {
    if (!byBranch[b]?.length) continue
    L.push(`— ${BRANCH_LABEL[b].toUpperCase()} —`)
    for (const s of byBranch[b]) {
      L.push(`• ${s.title}`)
      if (s.dek) L.push(`  ${s.dek}`)
      L.push(`  → ${linkFor(s)}`)
      const k = kTxt(s); if (k) L.push(k)
      L.push(``)
    }
  }
  L.push(`Explore the full database: ${SITE}/leaderboard`)
  L.push(``, `Manage your subscription: ${SITE}/dashboard · All data from public FEC filings.`)
  return L.join('\n')
}

async function main() {
  console.log(`Building Friday Receipts for week_of=${WEEK_OF}${DRY ? ' (DRY RUN)' : ''}`)

  // Don't clobber a sent issue.
  const { data: existing } = await supabase
    .from('cr_newsletter_issues').select('id, status').eq('week_of', WEEK_OF).maybeSingle()
  if (existing && existing.status === 'sent') {
    console.log(`Issue for ${WEEK_OF} already 'sent' — not rebuilding.`); return
  }

  let stories = await weeklyArticles()
  let usingFallback = false
  if (stories.length === 0) {
    console.log('No weekly_story articles for this week — falling back to legacy cr_weekly picks.')
    stories = await legacyStories()
    usingFallback = true
  }
  console.log(`Stories: ${stories.length}${usingFallback ? ' (legacy fallback)' : ''}`)

  if (stories.length === 0) {
    console.log('Nothing to build. Marking issue skipped.')
    if (!DRY) await supabase.from('cr_newsletter_issues').upsert(
      { week_of: WEEK_OF, subject: `Friday Receipts — ${fmtWeek(WEEK_OF)}`, html: '', text_body: '', status: 'skipped', receipts_count: 0, updated_at: new Date().toISOString() },
      { onConflict: 'week_of' })
    return
  }

  // Sort: highest amount leads. Group the rest by branch.
  stories.sort((a, b) => Number(b.amount) - Number(a.amount))
  const lead = stories[0]
  const rest = stories.slice(1)
  const byBranch = {}
  for (const s of rest) (byBranch[s.branch] = byBranch[s.branch] || []).push(s)

  const branchStorySlugs = {}
  for (const s of stories) (branchStorySlugs[s.branch] = branchStorySlugs[s.branch] || []).push(s.slug || null)

  // We need the issue id to attach click links. Upsert a shell first to get the id
  // (skip in dry-run; use a placeholder so link URLs render).
  let issueId = existing?.id || null
  const links = []
  if (!DRY && !issueId) {
    const { data: shell, error: shellErr } = await supabase.from('cr_newsletter_issues')
      .upsert({ week_of: WEEK_OF, subject: 'building…', html: '', text_body: '', status: 'building', updated_at: new Date().toISOString() }, { onConflict: 'week_of' })
      .select('id').single()
    if (shellErr) { console.error('shell upsert error:', shellErr.message); process.exit(1) }
    issueId = shell.id
  }

  // Build a per-story tracked link map.
  const linkMap = new Map()
  for (const s of stories) {
    if (DRY) { linkMap.set(s, `${SITE}/c/<token>`); continue }
    linkMap.set(s, await trackedLink(issueId, s, links))
  }
  const linkFor = (s) => linkMap.get(s) || `${SITE}/leaderboard`

  const subject = `💰 ${lead.title}`
  const html = renderHtml(WEEK_OF, lead, byBranch, linkFor)
  const text = renderText(WEEK_OF, lead, byBranch, linkFor)

  if (DRY) {
    console.log(`\nSubject: ${subject}`)
    console.log(`Lead: ${lead.title} (${lead.branch})`)
    console.log(`Branches: ${Object.entries(byBranch).map(([b, a]) => `${b}:${a.length}`).join(' ')}`)
    console.log(`\n--- TEXT ---\n${text}\n`)
    console.log('DRY RUN — nothing written.')
    return
  }

  // Replace this issue's link rows, then finalize the issue.
  await supabase.from('cr_newsletter_links').delete().eq('issue_id', issueId)
  if (links.length) {
    const { error: linkErr } = await supabase.from('cr_newsletter_links').insert(links)
    if (linkErr) console.error('link insert error:', linkErr.message)
  }

  const { error } = await supabase.from('cr_newsletter_issues').upsert({
    week_of: WEEK_OF, subject, html, text_body: text,
    top_story_slugs: stories.map((s) => s.slug).filter(Boolean),
    branch_story_slugs: branchStorySlugs,
    receipts_count: stories.length,
    status: 'built',
    updated_at: new Date().toISOString(),
  }, { onConflict: 'week_of' })
  if (error) { console.error('upsert error:', error.message); process.exit(1) }

  await supabase.from('cr_weekly_runs').upsert(
    { week_of: WEEK_OF, stage_build: { issue_id: issueId, stories: stories.length, fallback: usingFallback, links: links.length }, updated_at: new Date().toISOString() },
    { onConflict: 'week_of' })

  console.log(`Built Friday Receipts for ${WEEK_OF}: ${stories.length} stories, ${links.length} tracked links. Ready to send.`)
}

main().catch((e) => { console.error('FATAL:', e.message); process.exit(1) })
