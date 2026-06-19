#!/usr/bin/env node
// Generate trial codes for cold-outreach campaigns.
//
// Usage:
//   node scripts/generate-trial-codes.mjs --count=25 --days=30 --campaign=d1-journalists
//   node scripts/generate-trial-codes.mjs --count=1 --days=30 --campaign=manual --email=alice@example.com
//   node scripts/generate-trial-codes.mjs --count=80 --days=90 --campaign=influencer --require-mention
//
// Codes are written to public.cr_trial_codes with a 7-day redemption
// window (expires_at). Days_granted is the access duration once
// redeemed. requires_public_mention is the influencer comp condition.

import { createClient } from '@supabase/supabase-js'
import { randomBytes } from 'crypto'

const args = Object.fromEntries(
  process.argv.slice(2).map((arg) => {
    const [k, ...rest] = arg.replace(/^--/, '').split('=')
    return [k, rest.length ? rest.join('=') : true]
  }),
)

const COUNT = Number(args.count || 1)
const DAYS = Number(args.days || 30)
const CAMPAIGN = String(args.campaign || 'manual')
const EMAIL = args.email ? String(args.email).toLowerCase() : null
const REQUIRE_MENTION = Boolean(args['require-mention'])
const REDEMPTION_WINDOW_DAYS = 7

if (!process.env.SUPABASE_SERVICE_ROLE_KEY || !process.env.SUPABASE_URL) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

function codeFor(prefix) {
  // 8 chars base32 — readable + short. 32^8 ≈ 1 trillion.
  const alphabet = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
  const bytes = randomBytes(8)
  let out = ''
  for (let i = 0; i < 8; i++) out += alphabet[bytes[i] % alphabet.length]
  return `${prefix}-${out}`
}

const prefix =
  CAMPAIGN.startsWith('d1-') || CAMPAIGN.startsWith('journ') ? 'CR-JOURN' :
  CAMPAIGN.includes('influ') || CAMPAIGN.includes('yt') ? 'CR-CREATE' :
  CAMPAIGN.includes('sub') ? 'CR-SUB' :
  'CR-PRO'

const expiresAt = new Date(Date.now() + REDEMPTION_WINDOW_DAYS * 86_400_000).toISOString()

const rows = []
for (let i = 0; i < COUNT; i++) {
  rows.push({
    code: codeFor(prefix),
    intended_email: EMAIL,
    days_granted: DAYS,
    source_campaign: CAMPAIGN,
    requires_public_mention: REQUIRE_MENTION,
    expires_at: expiresAt,
  })
}

const { data, error } = await supabase
  .from('cr_trial_codes')
  .insert(rows)
  .select('code, days_granted, expires_at')

if (error) {
  console.error('Insert failed:', error.message)
  process.exit(1)
}

console.log(`✓ Generated ${data.length} code(s) — campaign: ${CAMPAIGN}, ${DAYS} days, expires ${expiresAt}`)
console.log('')
for (const row of data) {
  console.log(`  ${row.code}  →  https://campaignreceipts.com/redeem/${row.code}`)
}
