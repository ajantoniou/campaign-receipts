// @portfolio/fec — FEC OpenAPI client
//
// Lightweight client against https://api.open.fec.gov/v1/. Reads a key
// from the caller. With DEMO_KEY the per-IP rate limit is ~30 req/hr;
// with a real key it's 1000/hr.

import type {
  FECClient,
  FECClientOptions,
  FECOffice,
  CandidateTotals,
  RawDonor,
  ContributionsBySize,
  Committee,
} from './schema.js'

const BASE = 'https://api.open.fec.gov/v1'

// 80% bipartisan industry-classification rules (OpenSecrets methodology
// proxy). When the FEC contributor's employer name matches a known
// industry keyword we tag it; otherwise null. Keep this list short and
// expand over time — false-positives hurt credibility more than missing
// tags.
const INDUSTRY_KEYWORDS: Array<{ rx: RegExp; code: string; label: string }> = [
  { rx: /\b(google|alphabet|meta|facebook|amazon|microsoft|apple|netflix|nvidia)\b/i, code: 'TECH', label: 'Big Tech' },
  { rx: /\b(exxon|chevron|conoco|halliburton|shell|bp |valero|marathon petroleum)\b/i, code: 'OIL', label: 'Oil & Gas' },
  { rx: /\b(goldman sachs|jpmorgan|jp morgan|citigroup|bank of america|morgan stanley|wells fargo|blackrock)\b/i, code: 'FIN', label: 'Finance' },
  { rx: /\b(pfizer|merck|moderna|johnson & johnson|abbvie|eli lilly|bristol myers)\b/i, code: 'PHRMA', label: 'Pharmaceuticals' },
  { rx: /\b(lockheed|raytheon|northrop|boeing|general dynamics|l3harris)\b/i, code: 'DEF', label: 'Defense' },
  { rx: /\b(aipac|democracy alliance|club for growth|national rifle|nra)\b/i, code: 'POL', label: 'Political organizations' },
  { rx: /\b(united auto workers|seiu|aft|nea|afscme|aflcio|afl-cio)\b/i, code: 'LABOR', label: 'Labor unions' },
  { rx: /\b(real estate|realtor|kushner|trump organization)\b/i, code: 'RE', label: 'Real estate' },
  { rx: /\b(retired|not employed|homemaker|disabled)\b/i, code: 'IND', label: 'Individual / Retired' },
]

function classifyIndustry(employer: string | null, occupation: string | null): { code: string | null; label: string | null } {
  const haystack = `${employer || ''} ${occupation || ''}`
  for (const r of INDUSTRY_KEYWORDS) {
    if (r.rx.test(haystack)) return { code: r.code, label: r.label }
  }
  return { code: null, label: null }
}

export function createFECClient(opts: FECClientOptions): FECClient {
  const apiKey = opts.apiKey
  if (!apiKey) throw new Error('FECClient: missing apiKey')

  async function get<T = any>(path: string, params: Record<string, string | number | undefined> = {}): Promise<T> {
    const qs = new URLSearchParams({ api_key: apiKey })
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined) qs.append(k, String(v))
    }
    const url = `${BASE}${path}?${qs.toString()}`
    const resp = await fetch(url)
    if (!resp.ok) {
      const body = await resp.text().catch(() => '')
      throw new Error(`FEC API ${resp.status}: ${path} — ${body.slice(0, 200)}`)
    }
    return resp.json() as Promise<T>
  }

  function officeToFecCode(office: FECOffice): string {
    if (office === 'senator') return 'S'
    if (office === 'representative') return 'H'
    return 'P'
  }

  return {
    async lookupCandidate(name, state, office) {
      const data = await get<{ results: Array<{ candidate_id: string; name: string; state: string; office: string; cycles: number[] }> }>('/candidates/search', {
        q: name,
        state: state || undefined,
        office: officeToFecCode(office),
        per_page: 5,
      })
      const results = data.results || []
      if (results.length === 0) return null
      results.sort((a, b) => Math.max(...(b.cycles || [0])) - Math.max(...(a.cycles || [0])))
      return results[0]?.candidate_id || null
    },

    async getCandidateTotals(candidateId, cycle) {
      const data = await get<{ results: any[] }>(`/candidate/${candidateId}/totals/`, {
        cycle,
        per_page: 1,
      })
      const r = (data.results || [])[0] || {}
      const total = Number(r.receipts || 0)
      const ind = Number(r.individual_contributions || 0)
      const pac = Number(r.other_political_committee_contributions || 0)
      const self = Number(r.candidate_contribution || 0)
      const itemized = Number(r.individual_itemized_contributions || 0)
      const unitemized = Number(r.individual_unitemized_contributions || 0)
      const totals: CandidateTotals = {
        total_raised: total,
        total_spent: Number(r.disbursements || 0),
        cash_on_hand: Number(r.last_cash_on_hand_end_period || r.cash_on_hand_end_period || 0),
        individual_pct: total > 0 ? Math.round((ind / total) * 10000) / 100 : 0,
        pac_pct: total > 0 ? Math.round((pac / total) * 10000) / 100 : 0,
        self_funded_pct: total > 0 ? Math.round((self / total) * 10000) / 100 : 0,
        in_state_pct: 0,
        large_donor_pct: total > 0 ? Math.round((itemized / Math.max(itemized + unitemized, 1)) * 10000) / 100 : 0,
      }
      return totals
    },

    async getTopDonors(candidateId, cycle, limit = 20) {
      const data = await get<{ results: any[] }>('/schedules/schedule_a/', {
        candidate_id: candidateId,
        two_year_transaction_period: cycle,
        sort: '-contribution_receipt_amount',
        per_page: 100,
      })
      const rows = data.results || []
      const acc = new Map<string, { name: string; employer: string | null; occupation: string | null; total: number; is_pac: boolean; is_individual: boolean }>()
      for (const c of rows) {
        const name = (c.contributor_name || '').trim()
        if (!name) continue
        const key = `${name}|${(c.contributor_employer || '').trim()}`
        const isPac = c.entity_type === 'PAC' || c.entity_type === 'COMMITTEE'
        const cur = acc.get(key) || {
          name,
          employer: c.contributor_employer || null,
          occupation: c.contributor_occupation || null,
          total: 0,
          is_pac: isPac,
          is_individual: !isPac,
        }
        cur.total += Number(c.contribution_receipt_amount || 0)
        acc.set(key, cur)
      }
      const donors: RawDonor[] = Array.from(acc.values())
        .sort((a, b) => b.total - a.total)
        .slice(0, limit)
        .map((d) => {
          const ind = classifyIndustry(d.employer, d.occupation)
          return {
            name: d.name,
            employer: d.employer,
            occupation: d.occupation,
            total_contributed: d.total,
            is_pac: d.is_pac,
            is_individual: d.is_individual,
            industry_code: ind.code,
          }
        })
      return donors
    },

    async getContributionsBySize(candidateId, cycle) {
      const data = await get<{ results: any[] }>(`/candidate/${candidateId}/totals/`, {
        cycle,
        per_page: 1,
      })
      const r = (data.results || [])[0] || {}
      return {
        under_200: Number(r.individual_unitemized_contributions || 0),
        '200_to_1000': 0,
        '1000_to_2900': 0,
        over_2900: Number(r.individual_itemized_contributions || 0),
      } as ContributionsBySize
    },

    async getCandidateCommittees(candidateId) {
      const data = await get<{ results: any[] }>(`/candidate/${candidateId}/committees/`, {
        per_page: 20,
      })
      const out: Committee[] = (data.results || []).map((c) => ({
        id: c.committee_id,
        name: c.name,
        type: (c.committee_type === 'P' ? 'principal' : c.committee_type === 'L' ? 'leadership_pac' : 'other') as Committee['type'],
      }))
      return out
    },
  }
}

// Convenience: classify donor totals → donor profile bucket.
export function computeDonorProfile(totals: CandidateTotals): 'grassroots' | 'mixed' | 'corporate' | 'self-funded' | 'unknown' {
  if (totals.total_raised === 0) return 'unknown'
  if (totals.self_funded_pct >= 25) return 'self-funded'
  if (totals.pac_pct >= 30) return 'corporate'
  if (totals.individual_pct >= 70 && totals.large_donor_pct <= 50) return 'grassroots'
  return 'mixed'
}
