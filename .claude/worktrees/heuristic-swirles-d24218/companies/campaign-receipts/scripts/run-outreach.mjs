#!/usr/bin/env node
// 7-day cold-outreach sequencer.
//
// Each day pulls a different cohort from cr_outreach_targets, mints a
// unique trial code, embeds it in a templated email/DM, sends via
// Gmail SMTP (preferred) or Resend (fallback), and logs to
// cr_outreach_log.
//
// SEND STRATEGY (per founder rev-6 decision):
//   Option B — send from already-warm antonioualfred@gmail.com via
//   Gmail SMTP with a Send-Mail-As alias of alex@campaignreceipts.com.
//   This avoids the 2-week domain warm-up problem that would put a
//   new @campaignreceipts.com domain at 30-50% spam rate on Monday.
//
//   Set CR_GMAIL_USER + CR_GMAIL_APP_PASSWORD (App Password from
//   the antonioualfred@gmail.com account) to use Gmail SMTP. The
//   "From" header still shows alex@campaignreceipts.com to recipients.
//
//   If RESEND_API_KEY is set and CR_GMAIL_APP_PASSWORD is NOT, the
//   script falls back to Resend (legacy path). Reversal is one env
//   var flip away.
//
// Designed to run as a Render cron at 09:00 ET daily, --day picks the
// schedule slot. Manual usage:
//   node scripts/run-outreach.mjs --day=1
//   node scripts/run-outreach.mjs --day=1 --dry-run
//   node scripts/run-outreach.mjs --day=7  (follow-up to D1+D2 non-openers)
//
// Cohort schedule (matches plan WS6b):
//   D1 → journalist     (email)
//   D2 → youtuber       (email)
//   D3 → substack       (email)
//   D4 → reply_bait     (X DM queue file — script writes file, no autosend)
//   D5 → reddit         (manual-trigger: outputs the post template)
//   D6 → podcast        (email)
//   D7 → follow-up D1+D2 non-openers (email)

import { createClient } from '@supabase/supabase-js'
import { randomBytes, randomUUID } from 'crypto'
import { writeFileSync } from 'fs'
import nodemailer from 'nodemailer'

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

// Gmail SMTP credentials — preferred send path. CR_GMAIL_USER should be
// the WARM Google account that owns the App Password (antonioualfred@
// gmail.com). The from-address shown to recipients
// (alex@campaignreceipts.com) is set independently via the FROM constant
// below and must be added to the Google account as a verified
// "Send mail as" alias in Gmail Settings → Accounts.
const CR_GMAIL_USER = process.env.CR_GMAIL_USER || process.env.COS_GMAIL_ADDRESS
const CR_GMAIL_APP_PASSWORD = process.env.CR_GMAIL_APP_PASSWORD || process.env.COS_GMAIL_APP_PASSWORD

// Resend (legacy fallback). Only used if Gmail credentials are missing.
const RESEND_KEY = process.env.RESEND_API_KEY

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://campaignreceipts.com'

/**
 * Build a UTM-tagged URL so the founder dashboard can tell which cohort
 * (and which day) drove traffic + conversions. Per engagement panel
 * R2 ask: "UTM-tagged links for the 25 cold emails — otherwise you
 * can't tell which subject line worked."
 *
 * Convention:
 *   utm_source = cold-email
 *   utm_medium = email
 *   utm_campaign = d{N}-{cohort}            // e.g. d1-journalist
 *   utm_content = {targetId or code}        // unique per recipient
 */
function utmUrl(path, { campaign, content }) {
  const u = new URL(path, SITE)
  u.searchParams.set('utm_source', 'cold-email')
  u.searchParams.set('utm_medium', 'email')
  if (campaign) u.searchParams.set('utm_campaign', campaign)
  if (content) u.searchParams.set('utm_content', content)
  return u.toString()
}
const FROM = 'CampaignReceipts <alex@campaignreceipts.com>'
// Replies route to founder's Gmail via the +campaignreceipts alias so they
// land in the regular inbox (filterable on the alias) without needing a
// separate mailbox. With Gmail SMTP, the Reply-To header is preserved
// even when sending via the antonioualfred@ account because Gmail honors
// the explicit replyTo on outgoing mail.
const REPLY_TO = 'antonioualfred+campaignreceipts@gmail.com'

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing SUPABASE env')
  process.exit(1)
}
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, { auth: { persistSession: false } })

const args = process.argv.slice(2)
const argVal = (k) => {
  const a = args.find((s) => s.startsWith(`--${k}=`))
  return a ? a.split('=')[1] : null
}
const DAY = Number(argVal('day') || '1')
const DRY_RUN = args.includes('--dry-run')
const LIMIT = Number(argVal('limit') || '40')

const COHORT_BY_DAY = {
  1: 'journalist',
  2: 'youtuber',
  3: 'substack',
  4: 'reply_bait',
  5: 'reddit',
  6: 'podcast',
  7: 'follow-up',
}

const DAYS_GRANTED_BY_COHORT = {
  journalist: 30,
  substack: 30,
  podcast: 30,
  youtuber: 90,
  reply_bait: 90,
}

const REQUIRES_MENTION_BY_COHORT = {
  youtuber: true, // influencer comps require one public mention
  reply_bait: true,
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

function genCode(prefix) {
  const alphabet = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
  const bytes = randomBytes(8)
  let out = ''
  for (let i = 0; i < 8; i++) out += alphabet[bytes[i] % alphabet.length]
  return `${prefix}-${out}`
}

async function mintCodeFor(target) {
  const days = DAYS_GRANTED_BY_COHORT[target.cohort] || 30
  const prefix =
    target.cohort === 'journalist' || target.cohort === 'substack' || target.cohort === 'podcast'
      ? 'CR-JOURN'
      : target.cohort === 'youtuber' || target.cohort === 'reply_bait'
        ? 'CR-CREATE'
        : 'CR-PRO'
  const code = genCode(prefix)
  const expiresAt = new Date(Date.now() + 7 * 86_400_000).toISOString()
  const { error } = await supabase.from('cr_trial_codes').insert({
    code,
    intended_email: target.email,
    days_granted: days,
    source_campaign: `d${DAY}-${target.cohort}`,
    requires_public_mention: !!REQUIRES_MENTION_BY_COHORT[target.cohort],
    expires_at: expiresAt,
  })
  if (error) throw new Error(`code insert: ${error.message}`)
  return { code, days }
}

function emailJournalist({ name, code, days }) {
  const cohortKey = 'journalist'
  const first = (name || 'there').split(/\s+/)[0]
  // We carry `code` + `days` so the on-reply auto-responder can append
  // them when the recipient actually engages. Cold pitch is paywall-free
  // (debug-agent critique: mid-email comp pivot reads as spam-bait).
  return {
    subject: "Trump's deleted 2024 platform — preserved + citable",
    text:
`Hi ${first},

After the 2024 election, the Trump campaign deleted the 15 issues pages, Agenda47, and the full RNC platform PDF from donaldjtrump.com.

We mirrored all of it — 25 documents, every URL with Wayback Machine redundancy + a fresh Internet Archive save. Free, no paywall, citable for the current term:

${SITE}/sources

If you're covering Trump promises against actual administration actions and want a citation chain that won't rot, this is built for that. We did the same for Biden 2020, Bernie 2020, Cruz 2016, DeSantis 2024, JD Vance 2022, and a handful of others — all free.

No asks.

— Alex (founder)
${SITE}`,
    html:
`<p>Hi ${first},</p>
<p>After the 2024 election, the Trump campaign deleted the 15 issues pages, Agenda47, and the full RNC platform PDF from donaldjtrump.com.</p>
<p>We mirrored all of it — 25 documents, every URL with Wayback Machine redundancy + a fresh Internet Archive save. Free, no paywall, citable for the current term:</p>
<p><a href="${SITE}/sources">${SITE}/sources</a></p>
<p>If you're covering Trump promises against actual administration actions and want a citation chain that won't rot, this is built for that. We did the same for Biden 2020, Bernie 2020, Cruz 2016, DeSantis 2024, JD Vance 2022, and a handful of others — all free.</p>
<p>No asks.</p>
<p>— Alex (founder)<br><a href="${SITE}">${SITE}</a></p>`,
  }
}

function emailYoutuber({ name, code }) {
  const cohortKey = 'youtuber'
  const first = (name || 'there').split(/\s+/)[0]
  const redeem = utmUrl(`/redeem/${code}`, { campaign: `d${DAY}-${cohortKey}`, content: code })
  return {
    subject: 'Free B-roll: politician scorecards with primary-source receipts',
    text:
`Hi ${first},

I built CampaignReceipts.com — free directory of every federal politician with term-scoped kept/broken/partial verdicts on their campaign promises, sourced to Congress.gov roll calls + Public Laws. Plus FEC donor data on 310 of them.

A few hooks from the data: Trump kept 24.8% of his 2016 promises. 61 Republicans + 60 Democrats are both "corporate-funded" by donor profile — bipartisan capture. AOC's top employer-donor is NOT EMPLOYED (true grassroots).

90-day Pro comp for you — full donor-to-vote alignments, CSV exports, commercial-use license to use this in videos:

${redeem}

If you do make something with it, a quick on-screen credit ("via campaignreceipts.com") is all I ask.

— Alex (founder)`,
    html:
`<p>Hi ${first},</p>
<p>I built <strong>CampaignReceipts.com</strong> — free directory of every federal politician with term-scoped kept/broken/partial verdicts on their campaign promises, sourced to Congress.gov roll calls + Public Laws. Plus FEC donor data on 310 of them.</p>
<p>A few hooks from the data:</p>
<ul>
<li>Trump kept 24.8% of his 2016 promises.</li>
<li>61 Republicans + 60 Democrats are both "corporate-funded" by donor profile — <strong>bipartisan capture</strong>.</li>
<li>AOC's top employer-donor is NOT EMPLOYED (true grassroots).</li>
</ul>
<p><strong>90-day Pro comp for you</strong> — full donor-to-vote alignments, CSV exports, commercial-use license to use this in videos:</p>
<p><a href="${redeem}" style="display:inline-block;background:#f59e0b;color:#0a0a0a;text-decoration:none;font-weight:600;padding:10px 18px;border-radius:8px">${redeem}</a></p>
<p>If you do make something with it, a quick on-screen credit ("via campaignreceipts.com") is all I ask.</p>
<p>— Alex (founder)</p>`,
  }
}

function emailSubstack({ name, code }) {
  const cohortKey = 'substack'
  const first = (name || 'there').split(/\s+/)[0]
  const redeem = utmUrl(`/redeem/${code}`, { campaign: `d${DAY}-${cohortKey}`, content: code })
  return {
    subject: 'Cross-post data slice for your beat',
    text:
`Hi ${first},

I built CampaignReceipts.com — primary-source promise tracker on 583 federal + state politicians + FEC donor data + verdicts. I noticed your work covers ${'{beat}'} closely, so this is probably useful to you.

30-day Pro comp here (full data, CSV, commercial-use license):
${redeem}

If you want a custom data pull for a piece (e.g. "every Senator who voted with pharma donors on Bill X"), just reply and I'll run it for you.

— Alex (founder)`,
    html:
`<p>Hi ${first},</p>
<p>I built <strong>CampaignReceipts.com</strong> — primary-source promise tracker on 583 federal + state politicians + FEC donor data + verdicts.</p>
<p>30-day Pro comp here (full data, CSV, commercial-use license):</p>
<p><a href="${redeem}">${redeem}</a></p>
<p>If you want a custom data pull for a piece, just reply and I'll run it for you.</p>
<p>— Alex (founder)</p>`,
  }
}

function emailPodcast({ name, code }) {
  const cohortKey = 'podcast'
  const first = (name || 'there').split(/\s+/)[0]
  const redeem = utmUrl(`/redeem/${code}`, { campaign: `d${DAY}-${cohortKey}`, content: code })
  return {
    subject: 'Data source for your next politics episode',
    text:
`Hi ${first},

I built CampaignReceipts.com. Free promise tracker on 583 federal + state politicians with clean FEC donor data. Happy to come on as a guest or just be a data source you cite — whichever's useful.

30-day Pro comp: ${redeem}

— Alex (founder)`,
    html:
`<p>Hi ${first},</p>
<p>I built <strong>CampaignReceipts.com</strong>. Free promise tracker on 583 federal + state politicians with clean FEC donor data. Happy to come on as a guest or just be a data source you cite.</p>
<p>30-day Pro comp: <a href="${redeem}">${redeem}</a></p>
<p>— Alex (founder)</p>`,
  }
}

function emailFollowup({ name, code }) {
  const cohortKey = 'followup'
  const first = (name || 'there').split(/\s+/)[0]
  const redeem = utmUrl(`/redeem/${code}`, { campaign: `d${DAY}-${cohortKey}`, content: code })
  return {
    subject: 'Re: CampaignReceipts (didn\'t want to nag, but...)',
    text:
`Hi ${first},

Quick bump on the comp code — wanted to make sure it didn't get lost. New since I last wrote: per-politician donor-to-vote alignment is live, full data set with primary-source citations.

If this isn't useful, just reply "no thanks" and I'll stop. If it is, the code below is good for another week:
${redeem}

— Alex`,
    html:
`<p>Hi ${first},</p>
<p>Quick bump on the comp code — wanted to make sure it didn't get lost.</p>
<p>If this isn't useful, just reply "no thanks" and I'll stop. If it is, the code below is good for another week:</p>
<p><a href="${redeem}">${redeem}</a></p>
<p>— Alex</p>`,
  }
}

const TEMPLATE_FOR = {
  journalist: emailJournalist,
  youtuber: emailYoutuber,
  substack: emailSubstack,
  podcast: emailPodcast,
  'follow-up': emailFollowup,
}

// Per founder rev-7 (2026-05-19): outreach now flows through Instantly
// (the same Instantly account that warmed antonioualfred@gmail.com to
// 100% health) rather than raw Gmail SMTP. CR keeps cohort selection,
// trial-code minting, and per-recipient body rendering; Instantly
// handles delivery, warmup-respecting cadence, reply tracking.
//
// A2 architecture: CR pushes leads with the rendered subject/body as
// custom variables ("cr_subject_line" / "cr_body_html"). The
// campaign's email template is a thin pass-through {{cr_body_html}}
// so the editor still owns copy.

const INSTANTLY_API = 'https://api.instantly.ai/api/v2'
const INSTANTLY_KEY = process.env.INSTANTLY_API_KEY

// Cohort -> Instantly campaign ID. Populated from env vars set after
// scripts/instantly-create-campaign.mjs runs. If a cohort's env var is
// missing, sendEmail() throws with a clear message so it's visible
// during dry-run.
function campaignIdForCohort(cohort) {
  const key = `INSTANTLY_CAMPAIGN_${cohort.toUpperCase().replace(/-/g, '_')}`
  return process.env[key] || null
}

async function sendEmail(to, tmpl) {
  if (!INSTANTLY_KEY) {
    throw new Error('Missing INSTANTLY_API_KEY')
  }
  const cohort = tmpl.cohort || 'journalist'
  const campaignId = campaignIdForCohort(cohort)
  if (!campaignId) {
    throw new Error(
      `No Instantly campaign id for cohort "${cohort}". Set INSTANTLY_CAMPAIGN_${cohort.toUpperCase().replace(/-/g, '_')} env var after running scripts/instantly-create-campaign.mjs.`,
    )
  }

  // Push a lead with the personalized subject/body baked in as custom
  // variables. Instantly will fire on its own send window per the
  // campaign's schedule, never bypassing warmup.
  const resp = await fetch(`${INSTANTLY_API}/leads`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${INSTANTLY_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: to,
      campaign: campaignId,
      first_name: tmpl.firstName || '',
      // Custom variables — these get rendered into the campaign's
      // {{cr_subject_line}} / {{cr_body_html}} template.
      custom_variables: {
        cr_subject_line: tmpl.subject,
        cr_body_html: tmpl.html,
        cr_campaign_day: `d${DAY}`,
        cr_cohort: cohort,
      },
    }),
  })
  if (!resp.ok) {
    const body = await resp.text().catch(() => '')
    throw new Error(`Instantly ${resp.status}: ${body.slice(0, 240)}`)
  }
  const json = await resp.json()
  // Return the lead id as a stand-in for messageId — that's what gets
  // recorded in cr_outreach_log. Reply attribution flows back via
  // Instantly's webhook (or polling), not via messageId match.
  return json.id || `instantly-${Date.now()}`
}

async function pickD7FollowupTargets() {
  // D1 + D2 non-openers (sent but opened_at is null). Re-mint a fresh
  // code (the original may have already expired).
  const { data } = await supabase
    .from('cr_outreach_log')
    .select('target_id, cr_outreach_targets!inner(email, display_name, cohort, channel)')
    .in('day_in_sequence', [1, 2])
    .is('opened_at', null)
    .limit(LIMIT)
  return (data || []).map((row) => ({
    id: row.target_id,
    email: row.cr_outreach_targets.email,
    display_name: row.cr_outreach_targets.display_name,
    cohort: 'follow-up',
    channel: 'email',
  }))
}

async function pickCohortTargets(cohort) {
  // Skip anyone we've already touched on a prior day to avoid double-send.
  const { data: alreadySent } = await supabase
    .from('cr_outreach_log')
    .select('target_id')
  const sentIds = new Set((alreadySent || []).map((r) => r.target_id))

  const { data } = await supabase
    .from('cr_outreach_targets')
    .select('id, email, handle, display_name, cohort, channel, outlet, beat_tags')
    .eq('cohort', cohort)
    .limit(LIMIT * 2)

  return (data || []).filter((t) => !sentIds.has(t.id) && (t.channel !== 'email' || t.email)).slice(0, LIMIT)
}

async function run() {
  const cohort = COHORT_BY_DAY[DAY]
  if (!cohort) {
    console.error(`No cohort defined for day ${DAY}`)
    process.exit(1)
  }
  const campaignId = campaignIdForCohort(cohort)
  const sendVia = INSTANTLY_KEY
    ? campaignId
      ? `instantly(campaign=${campaignId.slice(0, 8)}...)`
      : 'instantly(NO-CAMPAIGN-ID)'
    : 'NONE-CONFIGURED'
  console.log(`# CR outreach — Day ${DAY} · cohort=${cohort}${DRY_RUN ? ' (DRY RUN)' : ''}`)
  console.log(`# send=${sendVia} · sending-account=antonioualfred@gmail.com`)

  // X DM cohort: write a queue file for manual sending (no autopost API).
  if (cohort === 'reply_bait') {
    const targets = await pickCohortTargets('reply_bait')
    const lines = []
    for (const t of targets) {
      const { code } = DRY_RUN ? { code: 'DRYRUN-XXXXX' } : await mintCodeFor(t)
      const dm =
        `${t.handle} — built campaignreceipts.com. Free FEC + promise tracker on every fed pol. 61R/60D corporate-funded — bipartisan capture story. 90-day Pro comp: ${SITE}/redeem/${code}`
      lines.push(dm)
    }
    const out = `/tmp/cr-d${DAY}-dms.txt`
    writeFileSync(out, lines.join('\n\n'))
    console.log(`Wrote ${lines.length} DMs to ${out} (queue for manual send)`)
    return
  }

  // Reddit cohort: print the templated post for the founder to drop.
  if (cohort === 'reddit') {
    const post = `# CR — Reddit post for Day 5\n\nPost to: r/neutralpolitics, r/moderatepolitics, r/politicaldiscussion\n\n---\nTitle: I built a free directory tracking every federal politician's campaign promises with primary-source receipts\n\nBody: Spent the last two months building campaignreceipts.com — 583 federal + state politicians, 164 graded scorecards, 7,500+ promises with verdicts (KEPT/PARTIAL/BROKEN/YOU_DECIDE), each tied to a Congress.gov roll-call or Public Law citation.\n\nOne finding that surprised me: 61 Republicans and 60 Democrats both classify as "corporate-funded" by their donor profile. Bipartisan capture is the actual story, not a partisan one.\n\nMethodology at /methodology — 5% spot-audit, no editorial slant, both-sides reviews. Free forever.\n\nLooking for feedback on what's missing.\n`
    writeFileSync(`/tmp/cr-d${DAY}-reddit.md`, post)
    console.log(`Wrote Reddit post template to /tmp/cr-d${DAY}-reddit.md`)
    return
  }

  // Email cohorts (journalist/youtuber/substack/podcast/follow-up).
  const targets = cohort === 'follow-up' ? await pickD7FollowupTargets() : await pickCohortTargets(cohort)
  console.log(`Targets selected: ${targets.length}`)

  let sent = 0,
    failed = 0
  for (const t of targets) {
    if (!t.email) {
      console.log(`  ↷ no email for ${t.display_name || t.handle}`)
      continue
    }
    const tmplFn = TEMPLATE_FOR[t.cohort] || TEMPLATE_FOR[cohort]
    if (DRY_RUN) {
      const sample = tmplFn({ name: t.display_name, code: 'DRYRUN-XXXXX', days: 30 })
      console.log(`  [dry] ${t.email} | subject: ${sample.subject}`)
      continue
    }
    try {
      const { code, days } = await mintCodeFor(t)
      const tmpl = tmplFn({ name: t.display_name, code, days })
      // Augment with cohort + firstName for Instantly's custom variables.
      tmpl.cohort = t.cohort || cohort
      tmpl.firstName = (t.display_name || '').split(/\s+/)[0] || ''
      const messageId = await sendEmail(t.email, tmpl)
      await supabase.from('cr_outreach_log').insert({
        target_id: t.id,
        channel: 'email',
        day_in_sequence: DAY,
        code_id: code,
        message_id: messageId,
      })
      sent++
      console.log(`  ✓ ${t.email} · code=${code}`)
      await sleep(500) // pace
    } catch (err) {
      failed++
      console.log(`  ! ${t.email}: ${err.message}`)
    }
  }
  console.log(`\nDone. sent=${sent}, failed=${failed}, dry_run=${DRY_RUN}`)
}

run().catch((e) => {
  console.error(e)
  process.exit(1)
})
