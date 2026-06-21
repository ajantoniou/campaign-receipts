#!/usr/bin/env node
//
// scripts/weekly-viral-digest.mjs  —  Stage H: the Saturday "YouTube candidate" email.
//
// Runs Saturday (after every timezone has received Friday Receipts). Rolls up the
// week's newsletter clicks per article, picks the MOST-CLICKED title — the story
// the audience voted for — and emails the founder so they can make a YouTube video
// about it. Also pushes the winner into cr_video_queue for the production pipeline.
//
// "Come Saturday morning I get an email of the most clicked title so I can make a
//  video on youtube about it." — founder.
//
// Idempotent: cr_weekly_runs.week_of guards re-send; cr_video_queue upserts on
// (article_slug, week_of). Degrades honestly: if no clicks, emails "no clear
// winner yet" rather than crashing.
//
// Usage:
//   node scripts/weekly-viral-digest.mjs [--dry-run] [--week-of=YYYY-MM-DD]
//
// Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY, FOUNDER_DIGEST_EMAIL

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const RESEND_KEY = process.env.RESEND_API_KEY
const TO = process.env.FOUNDER_DIGEST_EMAIL || 'alex@antoniou.net'
const FROM = 'CR Viral <hello@campaignreceipts.com>'
const SITE = (process.env.NEXT_PUBLIC_SITE_URL || 'https://campaignreceipts.com').replace(/\/$/, '')
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

async function sendEmail(subject, text, html) {
  if (DRY) { console.log(`[dry] would email ${TO}: "${subject}"`); return 'dry' }
  if (!RESEND_KEY) throw new Error('RESEND_API_KEY missing')
  const resp = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: FROM, to: [TO], subject, text, html }),
  })
  if (!resp.ok) throw new Error(`Resend ${resp.status}: ${(await resp.text()).slice(0, 160)}`)
  return (await resp.json()).id
}

async function main() {
  console.log(`[${new Date().toISOString()}] Viral digest for week_of=${WEEK_OF}${DRY ? ' (DRY RUN)' : ''}`)

  // Already sent this week?
  const { data: run } = await supabase.from('cr_weekly_runs').select('digest_sent_at').eq('week_of', WEEK_OF).maybeSingle()
  if (run?.digest_sent_at && !DRY) { console.log(`Digest already sent ${run.digest_sent_at}. Done.`); return }

  // This week's issue + click roll-up.
  const { data: issue } = await supabase.from('cr_newsletter_issues').select('id, subject').eq('week_of', WEEK_OF).maybeSingle()
  if (!issue) { console.log('No issue for this week — nothing to rank.'); return }

  const { data: counts } = await supabase
    .from('cr_article_click_counts').select('article_slug, clicks, unique_clicks')
    .eq('issue_id', issue.id).order('clicks', { ascending: false })
  const ranked = counts || []

  // Resolve titles.
  const slugs = ranked.map((r) => r.article_slug)
  const titleBySlug = {}
  if (slugs.length) {
    const { data: arts } = await supabase.from('cr_articles').select('slug, title').in('slug', slugs)
    for (const a of arts || []) titleBySlug[a.slug] = a.title
  }

  const top = ranked[0]
  const leaderboard = ranked.slice(0, 5).map((r, i) =>
    `${i + 1}. ${titleBySlug[r.article_slug] || r.article_slug} — ${r.clicks} clicks`).join('\n')

  let subject, text, html
  if (!top || top.clicks === 0) {
    subject = `🎬 Friday Receipts: no clear click winner yet (${WEEK_OF})`
    text = `No clicks recorded yet for this week's Friday Receipts.\n\nThe issue went out; give it the weekend. Full database: ${SITE}/leaderboard`
    html = `<p>No clicks recorded yet for this week's Friday Receipts. Give it the weekend.</p>`
  } else {
    const title = titleBySlug[top.article_slug] || top.article_slug
    subject = `🎬 YouTube candidate: ${title} (${top.clicks} clicks)`
    text = `Your most-clicked Friday Receipt this week — the story the audience voted for. Make the video.\n\n` +
      `WINNER: ${title}\n${top.clicks} clicks (${top.unique_clicks} unique)\nArticle: ${SITE}/articles/${top.article_slug}\n\n` +
      `TOP 5 THIS WEEK:\n${leaderboard}\n`
    html = `<div style="font-family:Helvetica,Arial,sans-serif;max-width:560px">
      <p style="font:600 12px monospace;color:#0b5;text-transform:uppercase;letter-spacing:1px">YouTube candidate · week of ${WEEK_OF}</p>
      <h2 style="font-size:20px;color:#1a1a1a;margin:6px 0">${title}</h2>
      <p style="color:#666">${top.clicks} clicks (${top.unique_clicks} unique) — the most-clicked story this week. The audience already voted. Make the video.</p>
      <p><a href="${SITE}/articles/${top.article_slug}" style="color:#1a1a1a;font-weight:700">Open the article →</a></p>
      <hr style="border:none;border-top:1px solid #e5e5e5;margin:18px 0"/>
      <p style="font:600 11px monospace;color:#666;text-transform:uppercase">Top 5 this week</p>
      <pre style="font:13px monospace;color:#444;white-space:pre-wrap">${leaderboard}</pre>
    </div>`
  }

  await sendEmail(subject, text, html)

  if (!DRY) {
    if (top && top.clicks > 0) {
      const title = titleBySlug[top.article_slug] || top.article_slug
      // Feed the YouTube production queue.
      await supabase.from('cr_video_queue').upsert(
        { article_slug: top.article_slug, week_of: WEEK_OF, title, click_count: top.clicks, selected_as_viral: true, status: 'queued', updated_at: new Date().toISOString() },
        { onConflict: 'article_slug,week_of' })
    }
    await supabase.from('cr_weekly_runs').upsert(
      { week_of: WEEK_OF, viral_winner_slug: top?.article_slug || null, viral_winner_title: top ? (titleBySlug[top.article_slug] || top.article_slug) : null, viral_winner_clicks: top?.clicks || 0, digest_sent_at: new Date().toISOString(), updated_at: new Date().toISOString() },
      { onConflict: 'week_of' })
  }
  console.log(DRY ? 'DRY RUN complete.' : `Digest sent to ${TO}.`)
}

main().catch((e) => { console.error('FATAL:', e.message); process.exit(1) })
