#!/usr/bin/env node
//
// scripts/weekly-newsletter-build.mjs  —  PHASE 1 of the weekly newsletter.
//
// Builds the donor-influence weekly issue and writes it to cr_newsletter_issues
// (status='built'). Phase 2 (weekly-newsletter-send.mjs) then sends that issue to
// paid newsletter subscribers at their local Friday 05:00.
//
// MODEL (founder 2026-06-20): the donor-influence DATA is 100% FREE on the site.
// The PAID newsletter is a CONVENIENCE layer — it ALERTS subscribers each week and
// gives them one-click links into the free donor-map / connections landing pages.
// So this builder's job is: pick the week's most notable money-trail stories and
// format an email that is mostly "here's what's new — tap to see the map."
//
// Content source: cr_weekly (the existing donor/promise "Receipt of the Week"
// engine populated by pick-weekly.mjs / snapshot-weekly.mjs). We take the most
// recent picks and link each to its public landing page.
//
// Idempotent: upserts on week_of. Re-running rebuilds this week's issue. Will not
// overwrite an issue already marked 'sent' (so a rebuild can't double-send).
//
// Usage:
//   node scripts/weekly-newsletter-build.mjs              # build + upsert
//   node scripts/weekly-newsletter-build.mjs --dry-run    # print, no write
//   node scripts/weekly-newsletter-build.mjs --week-of=YYYY-MM-DD
//
// Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY. SITE optional (default prod).

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const SITE = (process.env.SITE || 'https://campaignreceipts.com').replace(/\/$/, '')

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('FATAL: SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY missing')
  process.exit(1)
}
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } })

const args = process.argv.slice(2)
const DRY = args.includes('--dry-run')
const weekArg = args.find((a) => a.startsWith('--week-of='))?.split('=')[1]

// ── Time helpers ────────────────────────────────────────────
/** Monday (UTC) of the ISO week containing `d`. Matches send script's isoMonday. */
function isoMonday(d = new Date()) {
  const x = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
  const dow = (x.getUTCDay() + 6) % 7
  x.setUTCDate(x.getUTCDate() - dow)
  return x.toISOString().slice(0, 10)
}
function fmtWeek(iso) {
  const d = new Date(iso + 'T00:00:00Z')
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
}
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))

// ── Content selection ───────────────────────────────────────
// Pull the most recent donor/promise picks. cr_weekly is the canonical "Receipt of
// the Week" table (headline, blurb, politician_id). Each story links to that
// politician's FREE donor page — the donor-influence map the newsletter alerts you to.
async function recentStories(limit = 4) {
  const { data, error } = await supabase
    .from('cr_weekly')
    .select('headline, blurb, share_image_url, picked_at, politician_id')
    .order('picked_at', { ascending: false })
    .limit(limit)
  if (error) { console.error('cr_weekly read error:', error.message); return [] }
  const rows = data || []

  // Resolve politician slugs in one query for the click-through links.
  const ids = [...new Set(rows.map((r) => r.politician_id).filter(Boolean))]
  const slugById = {}
  if (ids.length) {
    const { data: pols } = await supabase
      .from('cr_politicians')
      .select('id, slug')
      .in('id', ids)
    for (const p of pols || []) slugById[p.id] = p.slug
  }
  return rows.map((r) => ({ ...r, _slug: slugById[r.politician_id] || null }))
}

// Landing-page URL: the politician's free donor page (the influence map). Falls
// back to /leaderboard if the slug is missing.
function storyUrl(s) {
  if (s._slug) return `${SITE}/politician/${encodeURIComponent(s._slug)}`
  return `${SITE}/leaderboard`
}

// ── Email rendering ─────────────────────────────────────────
function buildHtml(weekOf, stories) {
  const C = { ink: '#1a1a1a', muted: '#666', line: '#e5e5e5', accent: '#0b5', paper: '#faf8f4' }
  const storyBlocks = stories.map((s) => `
    <div style="border:1px solid ${C.line};border-radius:10px;padding:20px;margin:0 0 16px 0;background:#fff">
      <div style="font:600 11px monospace;color:${C.accent};text-transform:uppercase;letter-spacing:1px;margin:0 0 8px 0">Money Trail</div>
      <div style="font:700 19px Helvetica,Arial,sans-serif;color:${C.ink};margin:0 0 8px 0;line-height:1.25">${esc(s.headline || 'New donor-influence finding')}</div>
      ${s.blurb ? `<div style="font:400 14px Helvetica,Arial,sans-serif;color:${C.muted};margin:0 0 14px 0;line-height:1.5">${esc(s.blurb)}</div>` : ''}
      <a href="${storyUrl(s)}" style="display:inline-block;font:700 13px Helvetica,Arial,sans-serif;color:#fff;background:${C.ink};text-decoration:none;padding:9px 16px;border-radius:999px">See the donor map →</a>
    </div>`).join('')

  return `<!doctype html><html><body style="margin:0;padding:0;background:${C.paper}">
  <div style="max-width:600px;margin:0 auto;padding:32px 20px;font-family:Helvetica,Arial,sans-serif">
    <div style="text-align:center;margin:0 0 8px 0">
      <div style="font:800 24px Helvetica,Arial,sans-serif;color:${C.ink};letter-spacing:-.5px">💰 Campaign Receipts</div>
      <div style="font:600 12px monospace;color:${C.muted};text-transform:uppercase;letter-spacing:1px;margin-top:4px">The Weekly Receipt · ${esc(fmtWeek(weekOf))}</div>
    </div>
    <p style="font:400 15px Helvetica,Arial,sans-serif;color:${C.ink};line-height:1.55;margin:24px 0">
      This week's money trails — who funded whom, and the votes that followed. Tap any story to open its donor-influence map (always free to view).
    </p>
    ${storyBlocks || `<p style="color:${C.muted}">No new money-trail stories this week. The full database is always live at <a href="${SITE}/leaderboard">${SITE}/leaderboard</a>.</p>`}
    <div style="border-top:1px solid ${C.line};margin-top:24px;padding-top:20px;text-align:center">
      <a href="${SITE}/leaderboard" style="font:700 14px Helvetica,Arial,sans-serif;color:${C.ink}">Explore the full donor leaderboard →</a>
      <p style="font:400 12px Helvetica,Arial,sans-serif;color:${C.muted};line-height:1.5;margin:20px 0 0 0">
        You get this because you subscribed to the Campaign Receipts weekly newsletter.<br/>
        All donor data is sourced from public FEC filings. <a href="${SITE}/dashboard" style="color:${C.muted}">Manage subscription</a>.
      </p>
    </div>
  </div></body></html>`
}

function buildText(weekOf, stories) {
  const lines = [
    `CAMPAIGN RECEIPTS — The Weekly Receipt — ${fmtWeek(weekOf)}`,
    ``,
    `This week's money trails. Tap any link to open its donor-influence map (free).`,
    ``,
  ]
  if (stories.length === 0) {
    lines.push(`No new money-trail stories this week. Full database: ${SITE}/leaderboard`)
  } else {
    for (const s of stories) {
      lines.push(`• ${s.headline || 'New donor-influence finding'}`)
      if (s.blurb) lines.push(`  ${s.blurb}`)
      lines.push(`  See the map: ${storyUrl(s)}`)
      lines.push(``)
    }
  }
  lines.push(`Explore the full leaderboard: ${SITE}/leaderboard`)
  lines.push(``)
  lines.push(`You subscribed to the Campaign Receipts weekly newsletter. Manage: ${SITE}/dashboard`)
  return lines.join('\n')
}

async function main() {
  const weekOf = weekArg || isoMonday()
  console.log(`Building Weekly Receipt for week_of=${weekOf}${DRY ? ' (DRY RUN)' : ''}`)

  const stories = await recentStories(4)
  console.log(`Selected ${stories.length} donor-influence stories.`)

  const subject = stories[0]?.headline
    ? `💰 ${stories[0].headline}`
    : `💰 The Weekly Receipt — ${fmtWeek(weekOf)}`
  const html = buildHtml(weekOf, stories)
  const text = buildText(weekOf, stories)
  const slugs = stories.map((s) => s._slug).filter(Boolean)

  if (DRY) {
    console.log(`\nSubject: ${subject}`)
    console.log(`Stories: ${slugs.join(', ') || '(none)'}`)
    console.log(`\n--- TEXT BODY ---\n${text}\n`)
    console.log('DRY RUN — nothing written.')
    return
  }

  // Don't clobber an already-sent issue (prevents accidental double-send).
  const { data: existing } = await supabase
    .from('cr_newsletter_issues')
    .select('status')
    .eq('week_of', weekOf)
    .maybeSingle()
  if (existing && existing.status === 'sent') {
    console.log(`Issue for ${weekOf} is already 'sent' — not rebuilding. Done.`)
    return
  }

  const { error } = await supabase
    .from('cr_newsletter_issues')
    .upsert({
      week_of: weekOf,
      subject,
      html,
      text_body: text,
      top_story_slugs: slugs,
      receipts_count: stories.length,
      status: 'built',
      updated_at: new Date().toISOString(),
    }, { onConflict: 'week_of' })

  if (error) { console.error('upsert error:', error.message); process.exit(1) }
  console.log(`Built issue for ${weekOf} (${stories.length} stories). Ready for Phase 2 send.`)
}

main().catch((e) => { console.error('FATAL:', e.message); process.exit(1) })
