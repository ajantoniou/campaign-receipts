// lib/plausible.mjs — read pageviews from the Plausible Stats API v2.
//
// Used by scripts/saturday-most-viewed.mjs to rank this week's articles by
// real organic pageviews. Works identically against Plausible Cloud or a
// self-hosted CE instance (same Stats API).
//
// Env (root .env):
//   PLAUSIBLE_API_KEY   — Stats API key (Bearer)
//   PLAUSIBLE_SITE_ID   — e.g. "campaignreceipts.com"
//   PLAUSIBLE_HOST      — default https://plausible.io (override for self-host)
//
// Graceful degradation: if PLAUSIBLE_API_KEY is unset or the call fails, this
// returns an empty map and a `ok:false` flag. The caller then ranks on
// newsletter clicks alone and SAYS SO — it never fabricates pageviews.

const HOST = (process.env.PLAUSIBLE_HOST || 'https://plausible.io').replace(/\/$/, '')
const API_KEY = process.env.PLAUSIBLE_API_KEY || ''
const SITE_ID = process.env.PLAUSIBLE_SITE_ID || process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN || ''

// Returns { ok, bySlug: { <slug>: pageviews }, total, reason }.
// Pulls trailing `days`-day pageviews per /articles/<slug> page.
export async function articlePageviews(days = 7) {
  if (!API_KEY || !SITE_ID) {
    return { ok: false, bySlug: {}, total: 0, reason: 'PLAUSIBLE_API_KEY/SITE_ID not set' }
  }
  try {
    const resp = await fetch(`${HOST}/api/v2/query`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        site_id: SITE_ID,
        metrics: ['pageviews', 'visitors'],
        date_range: `${days}d`,
        dimensions: ['event:page'],
        filters: [['contains', 'event:page', ['/articles/']]],
      }),
    })
    if (!resp.ok) {
      const body = await resp.text().catch(() => '')
      return { ok: false, bySlug: {}, total: 0, reason: `Plausible ${resp.status}: ${body.slice(0, 160)}` }
    }
    const json = await resp.json().catch(() => ({}))
    const bySlug = {}
    let total = 0
    for (const row of json.results || []) {
      const page = row.dimensions?.[0] || ''
      const m = page.match(/\/articles\/([^/?#]+)/)
      if (!m) continue
      const pv = Number(row.metrics?.[0] || 0)
      bySlug[m[1]] = (bySlug[m[1]] || 0) + pv
      total += pv
    }
    return { ok: true, bySlug, total, reason: null }
  } catch (e) {
    return { ok: false, bySlug: {}, total: 0, reason: `Plausible fetch failed: ${e.message}` }
  }
}
