'use client'

// Donor company logos for the article "players" block (founder 2026-06-25: "put their
// LOGO on the screen ... in our blog article too"). Renders each donor's logo via the
// Clearbit Logo API (free, no key) on a white chip; hides any that fail to load so
// there are never broken images. Domain mapping mirrors scripts/pipeline/donor-logo.mjs.

const DOMAIN: Record<string, string> = {
  'blackstone': 'blackstone.com', 'apollo': 'apollo.com', 'apollo global management': 'apollo.com',
  'kkr': 'kkr.com', 'blackrock': 'blackrock.com', 'carlyle': 'carlyle.com', 'bain capital': 'baincapital.com',
  'wells fargo': 'wellsfargo.com', 'goldman sachs': 'goldmansachs.com', 'morgan stanley': 'morganstanley.com',
  'jpmorgan': 'jpmorganchase.com', 'citigroup': 'citigroup.com', 'bank of new york mellon': 'bny.com',
  'capital group': 'capitalgroup.com',
  'google': 'google.com', 'meta': 'meta.com', 'facebook': 'meta.com', 'microsoft': 'microsoft.com',
  'amazon': 'amazon.com', 'apple': 'apple.com', 'apple inc': 'apple.com', 'nvidia': 'nvidia.com',
  'oracle': 'oracle.com', 'qualcomm': 'qualcomm.com', 'salesforce': 'salesforce.com', 'palantir': 'palantir.com',
  'coinbase': 'coinbase.com', 'ripple': 'ripple.com', 'kraken': 'kraken.com',
  'lockheed martin': 'lockheedmartin.com', 'raytheon': 'rtx.com', 'northrop grumman': 'northropgrumman.com',
  'boeing': 'boeing.com', 'general dynamics': 'gd.com', 'general atomics': 'ga.com', 'anduril': 'anduril.com',
  'anduril industries': 'anduril.com',
  'at&t': 'att.com', 'verizon': 'verizon.com', 'comcast': 'comcast.com', 't-mobile': 't-mobile.com',
  'american airlines': 'aa.com', 'delta air lines': 'delta.com', 'united airlines': 'united.com',
  'southwest airlines': 'southwest.com', 'union pacific': 'up.com', 'fedex': 'fedex.com',
  'pfizer': 'pfizer.com', 'merck': 'merck.com', 'amgen': 'amgen.com', 'abbvie': 'abbvie.com',
  'eli lilly': 'lilly.com', 'johnson & johnson': 'jnj.com',
  'exxon': 'exxonmobil.com', 'chevron': 'chevron.com', 'conocophillips': 'conocophillips.com',
  'related companies': 'related.com',
}

function domainFor(name: string): string | null {
  const n = name.trim().toLowerCase()
  if (DOMAIN[n]) return DOMAIN[n]
  if (/\b(self|retired|homemaker|individual|llc|inc|n\/a|requested|pac|for congress|for senate|committee)\b/.test(n)) return null
  const words = n.replace(/[^a-z0-9 ]/g, '').trim().split(/\s+/)
  return words.length === 1 && words[0].length >= 4 ? `${words[0]}.com` : null
}

export default function DonorLogos({ donors }: { donors: { name: string; amount?: number }[] }) {
  const items = (donors || [])
    .map((d) => ({ ...d, domain: domainFor(d.name) }))
    .filter((d) => d.domain)
    .slice(0, 6)
  if (!items.length) return null
  return (
    <div className="flex flex-wrap gap-3">
      {items.map((d) => (
        <div key={d.name} className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 border border-line shadow-sm">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`https://logo.clearbit.com/${d.domain}?size=64&format=png`}
            alt={d.name}
            width={28}
            height={28}
            className="object-contain"
            onError={(e) => { (e.currentTarget.parentElement as HTMLElement).style.display = 'none' }}
          />
          <span className="text-[13px] font-medium text-ink">{d.name}{d.amount ? ` · $${Math.round(d.amount).toLocaleString()}` : ''}</span>
        </div>
      ))}
    </div>
  )
}
