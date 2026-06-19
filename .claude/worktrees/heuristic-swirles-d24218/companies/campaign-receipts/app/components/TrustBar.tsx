import { ShieldCheck, ScrollText, Microscope, FileText } from 'lucide-react'

const trusts = [
  { icon: ShieldCheck, label: 'Every verdict reviewed from both political perspectives' },
  { icon: ScrollText, label: 'Primary-source receipts on every claim' },
  { icon: Microscope, label: 'Methodology-first, published in full' },
  { icon: FileText, label: 'No anonymous scoring — full audit trail' },
]

export default function TrustBar() {
  return (
    <div className="border-y border-ink-800/60 bg-ink-950/60">
      <div className="section-shell py-5">
        <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-3">
          {trusts.map(({ icon: Icon, label }) => (
            <li key={label} className="flex items-center gap-2.5 text-xs text-ink-400">
              <Icon className="size-4 text-amber-400 shrink-0" strokeWidth={2} />
              <span className="leading-snug">{label}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
