// HMAC-signed "this POST came from our signin page" token. Bots that POST
// directly to /api/auth/start (the June 2026 abuse wave sent harvested
// emails in same-second batches every ~20 minutes) never load the form,
// so they can't present one. Not a CAPTCHA — a bot that fetches the form
// first will pass — but combined with the per-email/per-IP caps in
// /api/auth/start it removes the cheap path. Domain-separated from the
// newsletter confirm HMAC via the SCOPE prefix.

import { createHmac, timingSafeEqual } from 'crypto'

const SCOPE = 'cr-signin-form-v1'
const MIN_AGE_MS = 1_500 // instant-POST tripwire; autofill+Enter stays above this
const MAX_AGE_MS = 30 * 60_000 // matches the magic-link TTL

function secret() {
  return process.env.NEWSLETTER_CONFIRM_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || ''
}

function sign(ts: string) {
  return createHmac('sha256', secret()).update(`${SCOPE}|${ts}`).digest('base64url')
}

export function mintFormToken(now = Date.now()): string {
  const ts = String(now)
  return `${ts}.${sign(ts)}`
}

export function verifyFormToken(token: string | null | undefined, now = Date.now()): boolean {
  if (!token) return false
  const dot = token.indexOf('.')
  if (dot < 1) return false
  const ts = token.slice(0, dot)
  const mac = Buffer.from(token.slice(dot + 1))
  const expected = Buffer.from(sign(ts))
  if (mac.length !== expected.length || !timingSafeEqual(mac, expected)) return false
  const age = now - Number(ts) // NaN age fails both bounds below
  return age >= MIN_AGE_MS && age <= MAX_AGE_MS
}
