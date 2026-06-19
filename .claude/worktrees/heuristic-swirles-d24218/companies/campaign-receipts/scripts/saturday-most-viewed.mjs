#!/usr/bin/env node
//
// scripts/saturday-most-viewed.mjs  —  the Saturday "make a video on this one" email.
//
// Closes the weekly loop the founder asked for:
//   Thu  weekly-content-build  → writes 3 juicy blog articles + builds the issue
//   Fri  weekly-newsletter-send → sends the Friday newsletter (tracked links)
//   Sat  THIS SCRIPT            → ranks the week's articles by REAL pageviews
//                                (Plausible) + newsletter clicks, emails the
//                                founder the winner + a paste-ready $9 YouTube
//                                description/pinned-comment block + the video
//                                brief, so he makes a YouTube video on the
//                                winner and the description drives $9 signups
//                                through OUR LemonSqueezy checkout.
//
// Ranking (architect spec): normalize each metric to a 0–1 share within the
// week's articles, then score = 0.65*pv_share + 0.35*click_share. Pageviews
// weighted higher because they capture all SEO/organic discovery (the founder's
// stated goal); newsletter clicks are a smaller but strong intent signal.
//
// HONEST FAILURE: if total signal (pageviews + clicks) < MIN_SIGNAL, we DO NOT
// crown a winner — the email says "not enough traffic yet" and falls back to
// the build script's own significance pick (cr_video_queue priority) as the
// suggested default, clearly labeled.
//
// Idempotent: a cr_founder_digest_log row per week_of guards against the daily
// cron re-sending. Pass --force to re-send, --dry-run to print without sending.
//
// Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY,
//      FOUNDER_DIGEST_EMAIL, (optional) PLAUSIBLE_API_KEY / PLAUSIBLE_SITE_ID.

import { createClient } from '@supabase/supabase-js'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { articlePageviews } from '../lib/plausible.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const RESEND_KEY = process.env.RESEND_API_KEY
const FROM = process.env.NEWSLETTER_FROM || 'Campaign Receipts <hello@campaignreceipts.com>'
const FOUNDER_EMAIL = process.env.FOUNDER_DIGEST_EMAIL || 'alex@antoniou.net'
const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://campaignreceipts.com'

const DRY = process.argv.includes('--dry-run')
const FORCE = process.argv.includes('--force')

// Ranking constants.
const PV_WEIGHT = 0.65
const CLICK_WEIGHT = 0.35
const MIN_SIGNAL = 20 // total pageviews+clicks across the week below which we don't call a winner

// The $9 newsletter checkout — routes through OUR LemonSqueezy (keeps ~95%,
// captures the email so they actually get the newsletter). NOT YouTube Membership.
const CHECKOUT_9 = `${SITE}/api/checkout?product=newsletter`

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('FATAL: SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY missing')
  process.exit(1)
}
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } })

// ── Time helpers ───────────────────────────────────────────
function isoMonday(d = new Date()) {
  const x = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
  const dow = (x.getUTCDay() + 6) % 7
  x.setUTCDate(x.getUTCDate() - dow)
  return x.toISOString().slice(0, 10)
}
function esc(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

// ── Gather + rank ──────────────────────────────────────────
async function gather(weekOf) {
  // This week's articles (the 3 the build script wrote).
  const { data: issue } = await supabase
    .from('cr_newsletter_issues')
    .select('id, week_of, top_story_slugs, subject')
    .eq('week_of', weekOf)
    .maybeSingle()
  const slugs = (issue?.top_story_slugs || []).filter(Boolean)
  if (slugs.length === 0) return { issue: null, articles: [] }

  // Titles/hooks for those slugs.
  const { data: arts } = await supabase
    .from('cr_articles')
    .select('slug, title, dek')
    .in('slug', slugs)
  const bySlug = Object.fromEntries((arts || []).map((a) => [a.slug, a]))

  // Newsletter clicks this week, per article.
  const { data: clicks } = await supabase
    .from('cr_newsletter_clicks')
    .select('article_slug')
    .eq('week_of', weekOf)
  const clicksBySlug = {}
  for (const c of clicks || []) clicksBySlug[c.article_slug] = (clicksBySlug[c.article_slug] || 0) + 1

  // Pageviews from Plausible (graceful if unavailable).
  const pv = await articlePageviews(7)

  const articles = slugs.map((slug) => ({
    slug,
    title: bySlug[slug]?.title || slug,
    hook: bySlug[slug]?.dek || '',
    pageviews: pv.bySlug[slug] || 0,
    clicks: clicksBySlug[slug] || 0,
  }))

  // Share-normalize each metric within the week, then weighted score.
  const pvTotal = articles.reduce((s, a) => s + a.pageviews, 0)
  const clickTotal = articles.reduce((s, a) => s + a.clicks, 0)
  for (const a of articles) {
    const pvShare = pvTotal ? a.pageviews / pvTotal : 0
    const clickShare = clickTotal ? a.clicks / clickTotal : 0
    a.score = PV_WEIGHT * pvShare + CLICK_WEIGHT * clickShare
  }
  articles.sort((a, b) => b.score - a.score)

  return {
    issue,
    articles,
    pvOk: pv.ok,
    pvReason: pv.reason,
    totalSignal: pvTotal + clickTotal,
    pvTotal,
    clickTotal,
  }
}

// The build script's own significance pick (the fallback "default" winner).
async function buildScriptDefault(weekOf) {
  const { data } = await supabase
    .from('cr_video_queue')
    .select('article_slug, title, brief')
    .eq('week_of', weekOf)
    .order('priority', { ascending: false })
    .limit(1)
    .maybeSingle()
  return data || null
}

// ── Email body ─────────────────────────────────────────────
function pasteBlock(title) {
  return [
    '── PASTE INTO VIDEO DESCRIPTION ──',
    '👉 Get the Friday Receipts newsletter — $9/mo, cancel anytime:',
    CHECKOUT_9,
    '',
    '── PINNED COMMENT (paste as the first comment, then pin it) ──',
    'The full money trail is in Friday Receipts. One email every Friday.',
    'Every number traces to an FEC record. $9 a month, cancel anytime:',
    CHECKOUT_9,
  ].join('\n')
}

function buildHtml({ weekOf, articles, winner, hasWinner, pvOk, pvReason, totalSignal, videoBrief, fallback }) {
  const C = { paper: '#f5efdf', paper2: '#efe7d2', ink: '#1f2a44', ink2: '#475063', red: '#b3271e', line: '#d8cdb0' }
  const rows = articles
    .map(
      (a, i) => `<tr>
        <td style="padding:8px 10px;font:600 13px Arial;color:${C.ink}">${i + 1}</td>
        <td style="padding:8px 10px;font:400 13px Arial;color:${C.ink}">${esc(a.title)}</td>
        <td style="padding:8px 10px;font:600 13px Arial;color:${C.ink2};text-align:right">${a.pageviews}</td>
        <td style="padding:8px 10px;font:600 13px Arial;color:${C.ink2};text-align:right">${a.clicks}</td>
        <td style="padding:8px 10px;font:600 13px Arial;color:${C.red};text-align:right">${a.score.toFixed(3)}</td>
      </tr>`,
    )
    .join('')

  const verdict = hasWinner
    ? `<div style="font:700 18px Georgia,serif;color:${C.ink}">Winner: ${esc(winner.title)}</div>
       <div style="font:400 13px Arial;color:${C.ink2};margin-top:4px">Combined score ${winner.score.toFixed(3)} · ${winner.pageviews} pageviews · ${winner.clicks} newsletter clicks (7d)</div>`
    : `<div style="font:700 18px Georgia,serif;color:${C.red}">No clear winner yet</div>
       <div style="font:400 13px Arial;color:${C.ink2};margin-top:4px">Only ${totalSignal} total signals this week (need ${MIN_SIGNAL}). Suggested default below is the build script's significance pick — not a traffic winner.</div>`

  const pick = hasWinner ? winner : fallback
  const winnerCard = pick
    ? `<div style="background:${C.paper2};border:1px solid ${C.line};border-left:3px solid ${C.red};border-radius:8px;padding:14px 16px;margin:14px 0">
         <div style="font:700 15px Georgia,serif;color:${C.ink}">${esc(pick.title)}</div>
         ${pick.hook ? `<div style="font:400 13px Arial;color:${C.ink2};margin-top:4px">${esc(pick.hook)}</div>` : ''}
         ${pick.slug ? `<div style="margin-top:8px"><a href="${SITE}/articles/${pick.slug}" style="font:600 13px Arial;color:${C.red}">${SITE}/articles/${pick.slug}</a></div>` : ''}
       </div>`
    : ''

  return `<!doctype html><html><body style="margin:0;background:${C.paper2};padding:0">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.paper2}"><tr><td align="center" style="padding:24px 12px">
  <table role="presentation" width="640" cellpadding="0" cellspacing="0" style="background:${C.paper};border:1px solid ${C.line};border-radius:10px;max-width:640px">
    <tr><td style="padding:22px 26px 10px;border-bottom:2px solid ${C.ink}">
      <div style="font:700 12px Arial;color:${C.red};text-transform:uppercase;letter-spacing:1px">Saturday · make this week's video</div>
      <div style="font:700 20px Georgia,serif;color:${C.ink};margin-top:2px">Week of ${weekOf}</div>
    </td></tr>
    <tr><td style="padding:16px 26px 4px">${verdict}</td></tr>
    <tr><td style="padding:6px 26px">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid ${C.line};border-radius:8px;border-collapse:separate">
        <tr style="background:${C.paper2}">
          <td style="padding:8px 10px;font:600 11px Arial;color:${C.ink2};text-transform:uppercase">#</td>
          <td style="padding:8px 10px;font:600 11px Arial;color:${C.ink2};text-transform:uppercase">Article</td>
          <td style="padding:8px 10px;font:600 11px Arial;color:${C.ink2};text-transform:uppercase;text-align:right">Views</td>
          <td style="padding:8px 10px;font:600 11px Arial;color:${C.ink2};text-transform:uppercase;text-align:right">Clicks</td>
          <td style="padding:8px 10px;font:600 11px Arial;color:${C.ink2};text-transform:uppercase;text-align:right">Score</td>
        </tr>
        ${rows}
      </table>
      <div style="font:400 11px Arial;color:${C.ink2};margin:6px 2px 0">Score = ${PV_WEIGHT}·view-share + ${CLICK_WEIGHT}·click-share, 7-day window. ${pvOk ? 'Pageviews: Plausible.' : `Pageviews unavailable (${esc(pvReason || 'no Plausible key')}) — ranked on clicks only.`}</div>
    </td></tr>
    <tr><td style="padding:14px 26px 4px"><div style="font:600 12px Arial;color:${C.ink2};text-transform:uppercase;letter-spacing:.5px">The pick</div>${winnerCard}</td></tr>
    <tr><td style="padding:8px 26px"><div style="font:600 12px Arial;color:${C.ink2};text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px">Paste into the YouTube video</div>
      <pre style="white-space:pre-wrap;background:${C.ink};color:${C.paper};border-radius:8px;padding:14px 16px;font:400 12px/1.5 Menlo,Consolas,monospace;margin:0">${esc(pasteBlock(pick?.title || ''))}</pre>
    </td></tr>
    ${videoBrief ? `<tr><td style="padding:14px 26px 4px"><div style="font:600 12px Arial;color:${C.ink2};text-transform:uppercase;letter-spacing:.5px">Video brief (from the build script)</div>
      <pre style="white-space:pre-wrap;background:${C.paper2};border:1px solid ${C.line};border-radius:8px;padding:12px 14px;font:400 12px/1.5 Georgia,serif;color:${C.ink2};margin:8px 0 0">${esc(videoBrief)}</pre>
    </td></tr>` : ''}
    <tr><td style="padding:14px 26px 22px;border-top:1px solid ${C.line}">
      <div style="font:400 11px Arial;color:${C.ink2}">Pageviews via Plausible (privacy-first), clicks via tracked /r/ links. The $9 link routes through our LemonSqueezy — we keep ~95% and capture the email.</div>
    </td></tr>
  </table></td></tr></table></body></html>`
}

function buildText({ weekOf, articles, winner, hasWinner, totalSignal, pick, videoBrief }) {
  return [
    `CAMPAIGN RECEIPTS — Saturday digest · week of ${weekOf}`,
    '',
    hasWinner ? `WINNER: ${winner.title} (score ${winner.score.toFixed(3)}, ${winner.pageviews} views, ${winner.clicks} clicks)` : `NO CLEAR WINNER YET — only ${totalSignal} signals (need ${MIN_SIGNAL}). Suggested default below.`,
    '',
    'RANKING (views / clicks / score):',
    ...articles.map((a, i) => `  ${i + 1}. ${a.title} — ${a.pageviews} / ${a.clicks} / ${a.score.toFixed(3)}`),
    '',
    pick ? `MAKE THE VIDEO ON: ${pick.title}\n${pick.slug ? `${SITE}/articles/${pick.slug}` : ''}` : '',
    '',
    pasteBlock(pick?.title || ''),
    '',
    videoBrief ? `VIDEO BRIEF:\n${videoBrief}` : '',
  ].join('\n')
}

// ── Send ───────────────────────────────────────────────────
async function sendEmail(subject, html, text) {
  const resp = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: FROM, to: [FOUNDER_EMAIL], subject, html, text }),
  })
  if (!resp.ok) {
    const body = await resp.text().catch(() => '')
    throw new Error(`Resend ${resp.status}: ${body.slice(0, 200)}`)
  }
  const j = await resp.json().catch(() => ({}))
  return j.id || null
}

// ── MAIN ───────────────────────────────────────────────────
async function main() {
  const weekOf = isoMonday()
  console.log(`SATURDAY most-viewed · week of ${weekOf}${DRY ? ' · DRY-RUN' : ''}`)

  // Idempotency: skip if already sent this week (unless --force).
  if (!DRY && !FORCE) {
    const { data: log } = await supabase.from('cr_founder_digest_log').select('week_of').eq('week_of', weekOf).maybeSingle()
    if (log) {
      console.log(`Already sent the Saturday digest for ${weekOf}. Skipping (use --force to re-send).`)
      return
    }
  }

  const g = await gather(weekOf)
  if (!g.issue || g.articles.length === 0) {
    console.log(`No issue/articles built for week ${weekOf}. Nothing to rank — skipping cleanly.`)
    return
  }

  const hasWinner = g.totalSignal >= MIN_SIGNAL
  const winner = g.articles[0]
  const fallback = hasWinner ? null : await buildScriptDefault(weekOf)
  const pick = hasWinner ? winner : (fallback ? { title: fallback.title, slug: fallback.article_slug, hook: '' } : winner)

  // Video brief for the pick.
  const pickSlug = hasWinner ? winner.slug : fallback?.article_slug
  let videoBrief = ''
  if (pickSlug) {
    const { data: vq } = await supabase.from('cr_video_queue').select('brief').eq('week_of', weekOf).eq('article_slug', pickSlug).maybeSingle()
    videoBrief = vq?.brief || ''
  }

  const subject = hasWinner
    ? `📊 Make this week's video: "${winner.title}"`
    : `📊 This week's articles — not enough traffic to call a winner yet`

  const html = buildHtml({ weekOf, articles: g.articles, winner, hasWinner, pvOk: g.pvOk, pvReason: g.pvReason, totalSignal: g.totalSignal, videoBrief, fallback: pick })
  const text = buildText({ weekOf, articles: g.articles, winner, hasWinner, totalSignal: g.totalSignal, pick, videoBrief })

  if (DRY) {
    console.log(`\nsubject: ${subject}`)
    console.log(`pageviews ok: ${g.pvOk} (${g.pvReason || 'live'}) · total signal: ${g.totalSignal} · winner: ${hasWinner ? winner.slug : 'NONE (cold-start)'}`)
    console.log('\n--- text preview ---\n' + text.slice(0, 1400))
    console.log(`\n(no email sent; would go to ${FOUNDER_EMAIL})`)
    return
  }

  if (!RESEND_KEY) throw new Error('RESEND_API_KEY missing')
  const id = await sendEmail(subject, html, text)
  await supabase.from('cr_founder_digest_log').upsert(
    { week_of: weekOf, sent_at: new Date().toISOString(), winner_slug: hasWinner ? winner.slug : null, note: hasWinner ? `winner score ${winner.score.toFixed(3)}` : `cold-start (${g.totalSignal} signals)` },
    { onConflict: 'week_of' },
  )
  console.log(`\n✓ Saturday digest sent to ${FOUNDER_EMAIL} (resend ${id}). Winner: ${hasWinner ? winner.slug : 'cold-start, default suggested'}.`)
}

main().catch((e) => {
  // Non-fatal: log + exit 0 so the daily cron loop isn't broken by a transient error.
  console.error('ERROR (non-fatal):', e.message)
  process.exit(0)
})
