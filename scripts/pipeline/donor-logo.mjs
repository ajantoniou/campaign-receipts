// scripts/pipeline/donor-logo.mjs — resolve a donor company → a logo image URL.
//
// Founder 2026-06-25: "when you talk about companies giving money, put their LOGO on
// screen." Maps a donor name → company domain → Clearbit Logo API (free, no key,
// returns a PNG). A curated map covers the big recurring donors exactly; everything
// else falls back to a domain guess. Returns null for names with no resolvable logo
// (PACs, local businesses) so callers can skip gracefully — never a broken image.

// Curated name → domain for the donors we see most (exact, avoids bad guesses).
const DOMAIN = {
  'blackstone': 'blackstone.com', 'apollo': 'apollo.com', 'apollo global management': 'apollo.com',
  'kkr': 'kkr.com', 'blackrock': 'blackrock.com', 'carlyle': 'carlyle.com', 'bain capital': 'baincapital.com',
  'wells fargo': 'wellsfargo.com', 'goldman sachs': 'goldmansachs.com', 'morgan stanley': 'morganstanley.com',
  'jpmorgan': 'jpmorganchase.com', 'jpmorgan chase': 'jpmorganchase.com', 'citigroup': 'citigroup.com',
  'bank of new york mellon': 'bny.com', 'bny mellon': 'bny.com', 'capital group': 'capitalgroup.com',
  'google': 'google.com', 'alphabet': 'abc.xyz', 'meta': 'meta.com', 'facebook': 'meta.com',
  'microsoft': 'microsoft.com', 'amazon': 'amazon.com', 'apple': 'apple.com', 'apple inc': 'apple.com',
  'nvidia': 'nvidia.com', 'oracle': 'oracle.com', 'qualcomm': 'qualcomm.com', 'salesforce': 'salesforce.com',
  'palantir': 'palantir.com',
  'coinbase': 'coinbase.com', 'ripple': 'ripple.com', 'kraken': 'kraken.com',
  'lockheed martin': 'lockheedmartin.com', 'raytheon': 'rtx.com', 'northrop grumman': 'northropgrumman.com',
  'boeing': 'boeing.com', 'general dynamics': 'gd.com', 'general atomics': 'ga.com', 'anduril': 'anduril.com',
  'anduril industries': 'anduril.com', 'l3harris': 'l3harris.com',
  'at&t': 'att.com', 'verizon': 'verizon.com', 'comcast': 'comcast.com', 't-mobile': 't-mobile.com',
  'charter communications': 'corporate.charter.com',
  'american airlines': 'aa.com', 'delta air lines': 'delta.com', 'united airlines': 'united.com',
  'southwest airlines': 'southwest.com', 'union pacific': 'up.com', 'fedex': 'fedex.com',
  'pfizer': 'pfizer.com', 'merck': 'merck.com', 'amgen': 'amgen.com', 'abbvie': 'abbvie.com',
  'eli lilly': 'lilly.com', 'johnson & johnson': 'jnj.com',
  'exxon': 'exxonmobil.com', 'chevron': 'chevron.com', 'conocophillips': 'conocophillips.com',
  'marathon oil corp': 'marathonoil.com', 'diamondback energy': 'diamondbackenergy.com',
  'related companies': 'related.com', 'camden property trust': 'camdenliving.com',
}

// Domains worth a guess even without a curated entry: a clean single-word brand.
function guessDomain(name) {
  const n = String(name || '').trim().toLowerCase()
  if (!n) return null
  // skip obvious non-companies / occupation codes / generic
  if (/\b(self|retired|homemaker|individual|llc|inc\b|n\/a|requested|pac|for congress|for senate|committee)\b/.test(n)) return null
  const cleaned = n.replace(/[^a-z0-9 ]/g, '').trim()
  const words = cleaned.split(/\s+/)
  if (words.length === 1 && words[0].length >= 4) return `${words[0]}.com` // single clean brand
  return null
}

export function logoUrlFor(donorName) {
  const key = String(donorName || '').trim().toLowerCase()
  const domain = DOMAIN[key] || guessDomain(key)
  if (!domain) return null
  return `https://logo.clearbit.com/${domain}?size=256&format=png`
}

// Download + validate a logo to dest. Returns true if a real image landed.
export async function fetchLogo(donorName, dest) {
  const url = logoUrlFor(donorName)
  if (!url) return false
  try {
    const res = await fetch(url, { headers: { 'User-Agent': 'CampaignReceipts/1.0 (contact@campaignreceipts.com)' } })
    if (!res.ok) return false
    if (!/^image\//.test(res.headers.get('content-type') || '')) return false
    const buf = Buffer.from(await res.arrayBuffer())
    if (buf.length < 800) return false
    const { writeFileSync } = await import('node:fs')
    writeFileSync(dest, buf)
    return true
  } catch { return false }
}
