// /who-funds/pro-israel — the free, SEO-built pro-Israel-PAC funding LEDGER.
//
// Strategy brief 2026-06-15 §3b: a sourced FUNDING LEDGER, never a loyalty
// or "pro-Israel politician" list. We show, by name + amount + FEC committee
// ID, which members of Congress received direct contributions from the
// pro-Israel PACs that file with the FEC — AND the inverse list of those who
// took $0. The dollar is the fact; the FEC committee ID is the source. The
// inverse list is what makes it a party-blind DATABASE, not a hit-list.
//
// Data: cr_pac_contributions joined to cr_committees + cr_politicians, for
// the DIRECT-CONTRIBUTION pro-Israel committees only. Super-PAC independent
// expenditures (e.g. UDP C00799031, which spends FOR/AGAINST candidates
// without contributing to them) are a DIFFERENT category and are NOT folded
// in here — conflating IE with contributions would mislead.

import Link from 'next/link'
import { supabaseService } from '@/lib/supabase'
import { Tag, partyVariant } from '@/app/components/cr'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata = {
  title: 'Who took pro-Israel PAC money? The FEC ledger — CampaignReceipts',
  description:
    'Every member of Congress who received direct contributions from pro-Israel PACs (AIPAC PAC, U.S. Israel PAC), by name and amount, sourced to FEC committee IDs — plus the inverse list of those who took $0. A funding ledger, not a loyalty list. Both parties shown.',
  alternates: { canonical: '/who-funds/pro-israel' },
}

// The pro-Israel committees that make DIRECT candidate contributions and
// file with the FEC. Verified against cr_committees 2026-06-15.
const PRO_ISRAEL_COMMITTEES: { id: string; name: string }[] = [
  { id: 'C00797670', name: 'AIPAC PAC' },
  { id: 'C00127811', name: 'U.S. Israel PAC' },
]
const COMMITTEE_IDS = PRO_ISRAEL_COMMITTEES.map((c) => c.id)

function fmtUSD(n: number): string {
  if (!isFinite(n) || n <= 0) return '$0'
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `$${Math.round(n / 1_000)}k`
  return `$${Math.round(n).toLocaleString()}`
}

type Recipient = {
  slug: string
  name: string
  party: string
  state: string
  total: number
  pacs: Set<string>
}

async function getLedger() {
  // Direct contributions from the pro-Israel committees, joined to who got them.
  const { data } = await supabaseService
    .from('cr_pac_contributions')
    .select(
      'committee_id, total_amount, cr_committees!inner(name), cr_politicians!inner(name, party, state, slug)',
    )
    .in('committee_id', COMMITTEE_IDS)

  const byPol = new Map<string, Recipient>()
  for (const r of (data as any[]) || []) {
    const p = r.cr_politicians
    if (!p?.slug) continue
    let e = byPol.get(p.slug)
    if (!e) {
      e = { slug: p.slug, name: p.name, party: p.party, state: p.state, total: 0, pacs: new Set() }
      byPol.set(p.slug, e)
    }
    e.total += Number(r.total_amount) || 0
    e.pacs.add(r.cr_committees?.name || r.committee_id)
  }
  const recipients = [...byPol.values()].sort((a, b) => b.total - a.total)
  const totalPaid = recipients.reduce((s, r) => s + r.total, 0)

  // The inverse list: everyone we track who took $0 from these PACs.
  const { count: tracked } = await supabaseService
    .from('cr_politicians')
    .select('*', { count: 'exact', head: true })

  // A sample of the $0 list (we don't render all 550 — just prove the inverse
  // and link to the full directory). Pull notable names who took $0.
  const recipientSlugs = new Set(recipients.map((r) => r.slug))
  const { data: zeros } = await supabaseService
    .from('cr_politicians')
    .select('name, party, state, slug, scorecard_graded_total')
    .order('scorecard_graded_total', { ascending: false, nullsFirst: false })
    .limit(40)
  const zeroList = ((zeros as any[]) || [])
    .filter((p) => !recipientSlugs.has(p.slug))
    .slice(0, 12)

  return {
    recipients,
    totalPaid,
    tracked: tracked || 0,
    zeroCount: (tracked || 0) - recipients.length,
    zeroList,
  }
}

export default async function ProIsraelLedgerPage() {
  const { recipients, totalPaid, tracked, zeroCount, zeroList } = await getLedger()

  return (
    <main className="bg-paper">
      {/* ── Hero ─────────────────────────────────────────────────── */}
      <section className="bg-paper-2 border-b border-line">
        <div className="section-shell py-12 sm:py-16">
          <div className="max-w-[820px]">
            <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-broken mb-3">
              Follow the money · FEC ledger
            </div>
            <h1 className="font-display text-[34px] sm:text-[48px] leading-[1.02] tracking-[-0.012em] text-ink text-balance m-0">
              Who took pro-Israel <em className="italic">PAC money</em>?
            </h1>
            <p className="mt-5 font-sans text-[16px] sm:text-[17px] text-ink-2 leading-[1.5] max-w-[640px]">
              These members of Congress received direct contributions from
              pro-Israel PACs that file with the FEC. Every figure is a real
              FEC record. Both parties are here. Below them: the members who
              took <strong className="text-ink">$0</strong>.
            </p>

            {/* Stat tiles */}
            <div className="mt-7 grid grid-cols-2 sm:grid-cols-3 gap-3 max-w-[560px]">
              <LedgerStat value={fmtUSD(totalPaid)} label="Total direct PAC money" />
              <LedgerStat value={String(recipients.length)} label="Members who took it" />
              <LedgerStat value={zeroCount.toLocaleString()} label="Members who took $0" />
            </div>

            <p className="mt-5 font-mono text-[10px] uppercase tracking-[0.12em] text-ink-3 leading-relaxed">
              Source: FEC committee filings · {PRO_ISRAEL_COMMITTEES.map((c) => `${c.name} (${c.id})`).join(' · ')}.
              Direct contributions only — super-PAC ad spending is tracked separately on each race page.
            </p>
          </div>
        </div>
      </section>

      {/* ── The ledger (who took it) ─────────────────────────────── */}
      <section className="bg-paper border-b border-line">
        <div className="section-shell py-10 sm:py-14">
          <div className="max-w-[820px]">
            <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-2 mb-4">
              The ledger · sorted by amount
            </div>
            <ul className="grid gap-2 list-none p-0 m-0">
              {recipients.map((r, i) => (
                <li key={r.slug}>
                  <Link
                    href={`/politician/${r.slug}`}
                    className="flex items-center justify-between gap-4 rounded-lg border border-line bg-paper-2 hover:bg-paper-3 hover:border-ink-3 transition-all px-4 py-3 no-underline"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="font-mono text-[12px] text-ink-3 tabular-nums shrink-0 w-7">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <div className="min-w-0">
                        <div className="font-display text-[18px] leading-tight text-ink truncate">
                          {r.name}
                        </div>
                        <div className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-ink-3 flex items-center gap-1.5">
                          {r.state}
                          <Tag variant={partyVariant(r.party)}>{r.party[0]}</Tag>
                          <span className="text-ink-3">· {r.pacs.size} PAC{r.pacs.size > 1 ? 's' : ''}</span>
                        </div>
                      </div>
                    </div>
                    <div className="font-display text-[20px] tabular-nums text-broken shrink-0 leading-none">
                      {fmtUSD(r.total)}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
            {recipients.length === 0 && (
              <p className="font-sans text-[14px] text-ink-2">No records loaded yet.</p>
            )}
          </div>
        </div>
      </section>

      {/* ── The inverse: who took $0 ─────────────────────────────── */}
      <section className="bg-paper-2 border-b border-line">
        <div className="section-shell py-10 sm:py-14">
          <div className="max-w-[820px]">
            <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-kept mb-3">
              The inverse · took $0
            </div>
            <h2 className="font-display text-[26px] sm:text-[32px] leading-[1.05] tracking-[-0.01em] text-ink m-0">
              {zeroCount.toLocaleString()} members took <em className="italic">nothing</em>.
            </h2>
            <p className="mt-3 font-sans text-[15px] text-ink-2 leading-[1.5] max-w-[600px]">
              Most of Congress took no direct money from these PACs. A sample —
              see the full record in the directory.
            </p>
            <div className="mt-5 grid sm:grid-cols-2 gap-2">
              {zeroList.map((p) => (
                <Link
                  key={p.slug}
                  href={`/politician/${p.slug}`}
                  className="flex items-center justify-between gap-3 rounded-lg border border-line bg-paper hover:bg-paper-3 transition-all px-3.5 py-2.5 no-underline"
                >
                  <span className="font-display text-[15px] text-ink truncate">{p.name}</span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-3 shrink-0 flex items-center gap-1.5">
                    {p.state}
                    <Tag variant={partyVariant(p.party)}>{p.party[0]}</Tag>
                  </span>
                </Link>
              ))}
            </div>
            <div className="mt-5">
              <Link
                href="/directory"
                className="inline-flex items-center gap-1.5 rounded-full bg-ink text-paper hover:bg-ink-2 font-sans text-[14px] font-medium px-5 py-2.5 transition-colors border border-ink no-underline cta-lift"
              >
                See all {tracked.toLocaleString()} members →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Method / honesty note ────────────────────────────────── */}
      <section className="bg-paper">
        <div className="section-shell py-10 sm:py-12">
          <div className="max-w-[640px] rounded-lg border border-line bg-paper-2 p-5 sm:p-6">
            <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-3 mb-2">
              How to read this
            </div>
            <p className="font-sans text-[14px] text-ink-2 leading-[1.6] m-0">
              This is a <strong className="text-ink">funding ledger</strong>, not
              a label. A dollar figure is a fact; we never call anyone a
              &ldquo;pro-Israel politician.&rdquo; Every amount is a direct
              contribution recorded by the FEC from the committees named above.
              Independent-expenditure ad spending by super PACs (which doesn&rsquo;t
              go to candidates) is tracked separately on each{' '}
              <Link href="/race" className="text-ink underline underline-offset-2 decoration-line hover:decoration-ink">
                race page
              </Link>.
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}

function LedgerStat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-lg border border-line bg-paper p-3.5">
      <div className="font-display text-[28px] sm:text-[32px] leading-none tabular-nums text-broken tracking-[-0.02em]">
        {value}
      </div>
      <div className="mt-1.5 font-mono text-[9px] uppercase tracking-[0.14em] text-ink-3 leading-tight">
        {label}
      </div>
    </div>
  )
}
