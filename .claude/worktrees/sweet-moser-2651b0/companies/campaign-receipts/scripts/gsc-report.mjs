#!/usr/bin/env node
//
// scripts/gsc-report.mjs — Google Search Console automation for CampaignReceipts.
//
// Implements the measurable steps from eng/SEO-MEASUREMENT-RUNBOOK.md against
// the Search Console API, with ZERO npm dependencies (service-account JWT signed
// with Node's built-in crypto, called over global fetch). Runs on Render's node
// image as-is.
//
// ─── Subcommands ──────────────────────────────────────────────────────────
//   node scripts/gsc-report.mjs submit-sitemap   # PUT the sitemap (one-time/idempotent)
//   node scripts/gsc-report.mjs indexation        # sitemap contents + Pages coverage signal
//   node scripts/gsc-report.mjs queries           # query-template scorecard (last 28d)
//   node scripts/gsc-report.mjs check             # creds + property-access preflight only
//
// ─── Credential setup (one-time, by the founder — see runbook §1) ──────────
//   1. GCP → CampaignReceipts project → create a Service Account, download its
//      JSON key. (GSC API is already enabled.)
//   2. Search Console → verify campaignreceipts.com (if not already) →
//      Settings → Users and permissions → add the service-account email as a
//      Full/Owner user. (API returns data for verified users only.)
//   3. Put the key in the monorepo root .env, EITHER as a path or inline JSON:
//        CR_GSC_SERVICE_ACCOUNT_JSON=/abs/path/to/key.json
//      or
//        CR_GSC_SERVICE_ACCOUNT_JSON={"type":"service_account",...}
//   Optional: CR_GSC_PROPERTY (defaults to the https://campaignreceipts.com/
//   URL-prefix property; set to "sc-domain:campaignreceipts.com" for a Domain
//   property).
//
// Until that credential exists every subcommand exits 0 with a clear "not
// configured yet" message (so a cron wiring this up never hard-fails).

import { createSign } from 'node:crypto'
import { readFileSync } from 'node:fs'

const SITE = 'https://campaignreceipts.com'
const PROPERTY = process.env.CR_GSC_PROPERTY || `${SITE}/`
const SITEMAP_URL = `${SITE}/sitemap.xml`
const TOKEN_URL = 'https://oauth2.googleapis.com/token'
const SCOPE = 'https://www.googleapis.com/auth/webmasters.readonly'
// webmasters (read-write) is needed to SUBMIT a sitemap; readonly suffices for
// reporting. We request the broader scope only for the submit subcommand.
const SCOPE_RW = 'https://www.googleapis.com/auth/webmasters'

// The page templates we measure, mapped to the entity-intent queries CR owns.
// Keep in sync with eng/SEO-MEASUREMENT-RUNBOOK.md §2.
const TEMPLATES = [
  { key: 'politician', match: '/politician/' },
  { key: 'bill', match: '/bill/' },
  { key: 'race', match: '/race/' },
  { key: 'articles', match: '/articles/' },
  { key: 'state', match: '/state/' },
  { key: 'leaderboard', match: '/leaderboard' },
  { key: 'directory', match: '/directory' },
]

function base64url(buf) {
  return Buffer.from(buf).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

// Load the service-account key from CR_GSC_SERVICE_ACCOUNT_JSON (path OR inline).
// Returns null (not throw) when unset, so callers can print a friendly notice.
function loadServiceAccount() {
  const raw = process.env.CR_GSC_SERVICE_ACCOUNT_JSON
  if (!raw || !raw.trim()) return null
  const text = raw.trim().startsWith('{') ? raw : readFileSync(raw.trim(), 'utf8')
  const key = JSON.parse(text)
  if (!key.client_email || !key.private_key) {
    throw new Error('CR_GSC_SERVICE_ACCOUNT_JSON is missing client_email/private_key — not a valid service-account key.')
  }
  return key
}

// Mint a Google OAuth2 access token from the service-account key via the
// signed-JWT grant. No googleapis dependency.
async function getAccessToken(key, scope) {
  // now is passed in by the caller's clock; Date.now() is fine for a runtime
  // script (this isn't a resumable workflow).
  const iat = Math.floor(Date.now() / 1000)
  const exp = iat + 3600
  const header = base64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
  const claim = base64url(
    JSON.stringify({ iss: key.client_email, scope, aud: TOKEN_URL, iat, exp }),
  )
  const signer = createSign('RSA-SHA256')
  signer.update(`${header}.${claim}`)
  const sig = base64url(signer.sign(key.private_key))
  const assertion = `${header}.${claim}.${sig}`

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
  })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`token exchange failed (${res.status}): ${body.slice(0, 300)}`)
  }
  return (await res.json()).access_token
}

async function api(token, method, path, body) {
  const res = await fetch(`https://www.googleapis.com/webmasters/v3${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  })
  const txt = await res.text()
  let json = null
  try {
    json = txt ? JSON.parse(txt) : null
  } catch {
    /* sitemap PUT returns empty body on success */
  }
  if (!res.ok) {
    throw new Error(`GSC API ${method} ${path} → ${res.status}: ${txt.slice(0, 400)}`)
  }
  return json
}

const enc = (s) => encodeURIComponent(s)

// ─── Subcommand handlers ────────────────────────────────────────────────────

async function cmdCheck(key) {
  const token = await getAccessToken(key, SCOPE)
  const sites = await api(token, 'GET', '/sites')
  const mine = (sites?.siteEntry || []).find((s) => s.siteUrl === PROPERTY)
  console.log(`Service account: ${key.client_email}`)
  console.log(`Looking for property: ${PROPERTY}`)
  if (!mine) {
    console.log('✗ This service account is NOT a verified user on that property.')
    console.log('  → In Search Console: Settings → Users and permissions → add')
    console.log(`    ${key.client_email} as Owner/Full, and verify the domain if needed.`)
    console.log('  Properties this account CAN see:')
    for (const s of sites?.siteEntry || []) console.log(`    - ${s.siteUrl} (${s.permissionLevel})`)
    process.exitCode = 0 // informational, not a hard failure
    return false
  }
  console.log(`✓ Verified access (${mine.permissionLevel}). Ready to report.`)
  return true
}

async function cmdSubmitSitemap(key) {
  const token = await getAccessToken(key, SCOPE_RW)
  await api(token, 'PUT', `/sites/${enc(PROPERTY)}/sitemaps/${enc(SITEMAP_URL)}`)
  console.log(`✓ Submitted sitemap ${SITEMAP_URL} to ${PROPERTY}`)
}

async function cmdIndexation(key) {
  const token = await getAccessToken(key, SCOPE)
  // Sitemap-level coverage: GSC reports submitted vs indexed counts per sitemap.
  const sm = await api(token, 'GET', `/sites/${enc(PROPERTY)}/sitemaps/${enc(SITEMAP_URL)}`)
  console.log(`Sitemap: ${SITEMAP_URL}`)
  console.log(`  last submitted: ${sm?.lastSubmitted || '—'}   last downloaded: ${sm?.lastDownloaded || '—'}`)
  console.log(`  warnings: ${sm?.warnings ?? '—'}   errors: ${sm?.errors ?? '—'}`)
  for (const c of sm?.contents || []) {
    console.log(`  type=${c.type}  submitted=${c.submitted}  indexed=${c.indexed ?? 'n/a'}`)
  }
  console.log(
    '\nNote: per-URL "Indexed vs Discovered" lives in the GSC UI Pages report — the API\n' +
      'exposes sitemap submitted/indexed totals (above) + per-query performance (queries cmd).',
  )
}

async function cmdQueries(key) {
  const token = await getAccessToken(key, SCOPE)
  // Last 28 days, one Search Analytics query per template (filter by page).
  const end = new Date(Date.now() - 2 * 86400000).toISOString().slice(0, 10) // GSC lags ~2d
  const start = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10)
  console.log(`Query-template scorecard · ${start} → ${end} (property ${PROPERTY})\n`)
  console.log('template      clicks  impr   ctr%   avgPos   top query')
  console.log('────────────────────────────────────────────────────────────')
  for (const t of TEMPLATES) {
    const data = await api(token, 'POST', `/sites/${enc(PROPERTY)}/searchAnalytics/query`, {
      startDate: start,
      endDate: end,
      dimensions: ['query'],
      dimensionFilterGroups: [
        { filters: [{ dimension: 'page', operator: 'contains', expression: t.match }] },
      ],
      rowLimit: 1,
      dataState: 'all',
    })
    // Aggregate totals for the template (separate call without query dim).
    const agg = await api(token, 'POST', `/sites/${enc(PROPERTY)}/searchAnalytics/query`, {
      startDate: start,
      endDate: end,
      dimensionFilterGroups: [
        { filters: [{ dimension: 'page', operator: 'contains', expression: t.match }] },
      ],
      dataState: 'all',
    })
    const r = agg?.rows?.[0]
    const topQ = data?.rows?.[0]?.keys?.[0] || '—'
    if (!r) {
      console.log(`${t.key.padEnd(13)} —      —      —      —       (no impressions yet)`)
    } else {
      console.log(
        `${t.key.padEnd(13)} ${String(Math.round(r.clicks)).padEnd(7)} ${String(Math.round(r.impressions)).padEnd(6)} ` +
          `${(r.ctr * 100).toFixed(1).padEnd(6)} ${r.position.toFixed(1).padEnd(8)} ${topQ}`,
      )
    }
  }
  console.log('\nThis is the real KPI: watch politician/bill impressions on "[name] donors"-class queries climb.')
}

// ─── Main ────────────────────────────────────────────────────────────────────

const cmd = process.argv[2] || 'check'

let key
try {
  key = loadServiceAccount()
} catch (e) {
  console.error(`✗ ${e.message}`)
  process.exit(1)
}

if (!key) {
  console.log('GSC not configured yet — set CR_GSC_SERVICE_ACCOUNT_JSON in the root .env.')
  console.log('See the credential-setup steps at the top of this file (or runbook §1).')
  console.log('Once set: node scripts/gsc-report.mjs check   # verify access, then submit-sitemap / indexation / queries')
  process.exit(0)
}

const handlers = {
  check: cmdCheck,
  'submit-sitemap': cmdSubmitSitemap,
  indexation: cmdIndexation,
  queries: cmdQueries,
}
const handler = handlers[cmd]
if (!handler) {
  console.error(`Unknown subcommand "${cmd}". Use: check | submit-sitemap | indexation | queries`)
  process.exit(1)
}

try {
  // Always confirm access first for the data commands; submit/check do their own.
  await handler(key)
} catch (e) {
  console.error(`✗ ${e.message}`)
  process.exit(1)
}
