// Concentrate trust above the first interactive element. The design
// lead's #2 fix: a skeptical visitor (especially partisan) sees a
// verdict before seeing why to trust it. Surface the four trust signals
// inline, linked to the canonical pages.

import Link from 'next/link'
import { ShieldCheck, ScrollText, GitBranch, Mail } from 'lucide-react'

export default function TrustStrip({ auditCount }: { auditCount: number }) {
  return (
    <section className="border-y border-ink-800/60 bg-ink-900/40">
      <div className="section-shell py-3 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[11px] sm:text-xs text-ink-400">
        <Item icon={ShieldCheck} label="Primary sources only" href="/methodology#sources" />
        <Sep />
        <Item icon={GitBranch} label="Both-sides reviewed" href="/methodology" />
        <Sep />
        <Item icon={ScrollText} label={`${auditCount} audit findings logged`} href="/corrections" />
        <Sep />
        <Item icon={Mail} label="Dispute a verdict" href="mailto:disputes@campaignreceipts.com" />
      </div>
    </section>
  )
}

function Item({ icon: Icon, label, href }: { icon: any; label: string; href?: string }) {
  const inner = (
    <span className="inline-flex items-center gap-1.5 text-ink-400 hover:text-ink-100 transition-colors">
      <Icon className="size-3.5 text-amber-400" strokeWidth={2} />
      <span>{label}</span>
    </span>
  )
  if (!href) return inner
  if (href.startsWith('mailto:')) return <a href={href}>{inner}</a>
  return <Link href={href}>{inner}</Link>
}

function Sep() {
  return <span className="text-ink-700 hidden sm:inline">·</span>
}
