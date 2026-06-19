#!/usr/bin/env node
//
// scripts/instantly-create-campaign.mjs
//
// Creates the per-cohort Instantly campaigns for CR's influencer
// outreach. Per founder rev-7 (2026-05-19): we hand transport +
// warmup + reply tracking to Instantly. CR's run-outreach.mjs script
// just pushes leads (with subject/body as personalization variables)
// into the cohort's campaign. Instantly handles send.
//
// We use A2 architecture (per founder confirmation): CR renders the
// full subject/body per recipient and pushes them to Instantly via
// custom variables. Instantly's campaign body is a thin pass-through
// of {{cr_subject_line}} / {{cr_body_html}}, which lets CR keep all
// editorial control without re-implementing template logic in
// Instantly's UI.
//
// Usage:
//   node scripts/instantly-create-campaign.mjs --cohort=journalist [--dry-run]
//   node scripts/instantly-create-campaign.mjs --all-cohorts
//
// Writes campaign IDs to /tmp/instantly-campaigns.json so the founder
// can copy them into Render env vars or anchor-cards.

import { writeFileSync, readFileSync, existsSync } from 'fs'

const INSTANTLY_API_KEY = process.env.INSTANTLY_API_KEY
if (!INSTANTLY_API_KEY) {
  console.error('Missing INSTANTLY_API_KEY')
  process.exit(1)
}

const API = 'https://api.instantly.ai/api/v2'
const args = process.argv.slice(2)
const DRY = args.includes('--dry-run')
const ALL = args.includes('--all-cohorts')
const cohortArg = args.find((a) => a.startsWith('--cohort='))?.split('=')[1]

// Sending account — the warmed antonioualfred@gmail.com (per the
// existing Instantly Email Accounts view, 100% health score).
const SENDING_ACCOUNT = 'antonioualfred@gmail.com'

// One campaign per cohort. CR's run-outreach.mjs picks the campaign
// id by cohort tag.
const COHORTS = {
  journalist: {
    name: 'CR · D1 Journalists · cold outreach',
    schedule_name: 'Weekdays AM ET',
  },
  youtuber: {
    name: 'CR · D2 YouTubers · creator comp',
    schedule_name: 'Weekdays AM ET',
  },
  substack: {
    name: 'CR · D3 Substack · cross-post offer',
    schedule_name: 'Weekdays AM ET',
  },
  podcast: {
    name: 'CR · D6 Podcasts · data-source pitch',
    schedule_name: 'Weekdays AM ET',
  },
  'follow-up': {
    name: 'CR · D7 Follow-up · non-openers',
    schedule_name: 'Weekdays AM ET',
  },
}

function buildBodyTemplate() {
  // Thin pass-through. CR renders the full body and pushes it as the
  // `cr_body_html` custom variable; Instantly drops it inline.
  return '{{cr_body_html}}'
}

function buildSubjectTemplate() {
  return '{{cr_subject_line}}'
}

async function createCampaign(cohort) {
  const meta = COHORTS[cohort]
  if (!meta) {
    console.error(`Unknown cohort: ${cohort}`)
    return null
  }

  const payload = {
    name: meta.name,
    // M-F 9am-5pm America/New_York
    campaign_schedule: {
      schedules: [
        {
          name: meta.schedule_name,
          timing: { from: '09:00', to: '11:00' }, // narrow morning window — feels personal
          days: { '0': false, '1': true, '2': true, '3': true, '4': true, '5': true, '6': false },
          // Instantly's timezone enum is restrictive; America/Detroit
          // is in the allowlist and shares ET offset.
          timezone: 'America/Detroit',
        },
      ],
    },
    // Single-step sequence — CR scripts push fresh leads per day, so
    // we don't need Instantly's multi-step drip. (Follow-ups handled
    // by the D7 cohort's separate campaign.)
    sequences: [
      {
        steps: [
          {
            type: 'email',
            delay: 0,
            variants: [
              {
                subject: buildSubjectTemplate(),
                body: buildBodyTemplate(),
              },
            ],
            delay_unit: 'days',
            pre_delay_unit: 'days',
          },
        ],
      },
    ],
    email_list: [SENDING_ACCOUNT],
    // Spacing between sends inside the campaign window. 30s avoids
    // Gmail's burst-rate triggers.
    daily_max_leads: 30,
    pl_value: 0,
    text_only: false,
    stop_on_reply: true,
    stop_on_auto_reply: true,
  }

  if (DRY) {
    console.log(`[dry-run] would POST /campaigns:`)
    console.log(JSON.stringify({ ...payload, sequences: '(template)' }, null, 2))
    return { id: `dry-${cohort}`, name: meta.name }
  }

  const resp = await fetch(`${API}/campaigns`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${INSTANTLY_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })
  if (!resp.ok) {
    const text = await resp.text().catch(() => '')
    throw new Error(`Instantly ${resp.status}: ${text.slice(0, 400)}`)
  }
  const data = await resp.json()
  console.log(`✓ Created campaign for ${cohort}: ${data.id} (${data.name})`)
  return { id: data.id, name: data.name }
}

async function main() {
  const cohorts = ALL ? Object.keys(COHORTS) : cohortArg ? [cohortArg] : []
  if (cohorts.length === 0) {
    console.error('Usage: --cohort=<journalist|youtuber|substack|podcast|follow-up> | --all-cohorts')
    process.exit(1)
  }

  // Read existing campaign-id map (so we don't double-create).
  const mapPath = '/tmp/instantly-campaigns.json'
  let map = {}
  if (existsSync(mapPath)) {
    try {
      map = JSON.parse(readFileSync(mapPath, 'utf-8'))
    } catch {
      map = {}
    }
  }

  for (const cohort of cohorts) {
    if (map[cohort] && !DRY) {
      console.log(`↷ ${cohort} already has campaign ${map[cohort].id} — skipping`)
      continue
    }
    try {
      const result = await createCampaign(cohort)
      if (result) map[cohort] = result
    } catch (e) {
      console.error(`! ${cohort} failed: ${e.message}`)
    }
  }

  if (!DRY) {
    writeFileSync(mapPath, JSON.stringify(map, null, 2))
    console.log(`\nWrote campaign-id map to ${mapPath}`)
  }
  console.log('\nSet these as Render env vars to make CR run-outreach.mjs find them:')
  for (const [cohort, info] of Object.entries(map)) {
    const envName = `INSTANTLY_CAMPAIGN_${cohort.toUpperCase().replace(/-/g, '_')}`
    console.log(`  ${envName}=${info.id}`)
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
