'use client'

// HomeSearchHero — the engine-first homepage hero (strategy 2026-06-15).
//
// The search engine is the core product, so the homepage leads with the
// search box. Type a politician / donor / bill / vote → live entity
// suggestions (the same /api/entity-search the /investigate page uses) →
// click one to open its sourced dossier on /investigate. A first-time
// visitor sees the engine's affordance immediately and is one click from
// an answer. Warm-paper aesthetic, per the design system.

import { useState, useRef, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'

type Hit = { type: string; id: string; label: string; sub: string }

const TYPE_LABEL: Record<string, string> = {
  politician: 'Politician',
  donor: 'Donor',
  bill: 'Bill',
  vote: 'Vote',
}

export default function HomeSearchHero({ centered = false }: { centered?: boolean }) {
  const router = useRouter()
  const [q, setQ] = useState('')
  const [hits, setHits] = useState<Hit[]>([])
  const [searching, setSearching] = useState(false)
  const [open, setOpen] = useState(false)
  const debounce = useRef<NodeJS.Timeout>()
  const boxRef = useRef<HTMLFormElement>(null)

  const search = useCallback((value: string) => {
    if (value.trim().length < 2) {
      setHits([])
      return
    }
    setSearching(true)
    fetch(`/api/entity-search?q=${encodeURIComponent(value)}`)
      .then((r) => r.json())
      .then((d) => setHits((d.hits || []).slice(0, 6)))
      .catch(() => setHits([]))
      .finally(() => setSearching(false))
  }, [])

  function onChange(value: string) {
    setQ(value)
    setOpen(true)
    clearTimeout(debounce.current)
    debounce.current = setTimeout(() => search(value), 220)
  }

  // Open an entity's dossier on the engine page.
  function go(hit: Hit) {
    router.push(`/investigate?type=${hit.type}&id=${encodeURIComponent(hit.id)}`)
  }

  // Enter with no selection → take the top hit, else the investigate page.
  function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (hits[0]) go(hits[0])
    else if (q.trim()) router.push(`/investigate?q=${encodeURIComponent(q.trim())}`)
  }

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  const showDropdown = open && q.trim().length >= 2

  return (
    <div className={centered ? 'w-full' : 'max-w-[720px]'}>
      <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-broken mb-3">
        Follow the money
      </div>
      <h1
        className={`font-display ${
          centered
            ? 'text-[40px] sm:text-[60px] lg:text-[68px]'
            : 'text-[36px] sm:text-[52px] lg:text-[58px]'
        } leading-[1.0] tracking-[-0.015em] text-ink text-balance m-0`}
      >
        See who paid your <em className="italic">politician</em>.
      </h1>
      <p
        className={`mt-4 font-sans text-[16px] sm:text-[18px] text-ink-2 leading-[1.5] ${
          centered ? 'max-w-[560px] mx-auto' : 'max-w-[560px]'
        }`}
      >
        Type a name. We show who paid — and how they voted after. Every
        number is sourced to FEC.gov and Congress.gov.
      </p>

      {/* The search box — the hero's one primary affordance */}
      <form
        ref={boxRef}
        onSubmit={onSubmit}
        className={`relative mt-7 ${centered ? 'max-w-[600px] mx-auto' : ''}`}
      >
        <div className="flex items-center gap-2 rounded-full border border-ink-3 bg-paper-2 focus-within:border-ink focus-within:ring-2 focus-within:ring-ink/15 transition-all pl-5 pr-2 py-2">
          <span aria-hidden className="font-mono text-ink-3 text-[15px]">⌕</span>
          <input
            value={q}
            onChange={(e) => onChange(e.target.value)}
            onFocus={() => setOpen(true)}
            placeholder="A senator, a PAC, a bill…"
            aria-label="Search a politician, donor, bill, or vote"
            autoComplete="off"
            className="flex-1 min-w-0 bg-transparent font-sans text-[16px] text-ink placeholder:text-ink-3 outline-none py-1.5"
          />
          <button
            type="submit"
            className="cta-lift shrink-0 inline-flex items-center gap-1.5 rounded-full bg-ink text-paper hover:bg-ink-2 font-sans text-[15px] font-medium px-5 py-2.5 border border-ink"
          >
            Search →
          </button>
        </div>

        {showDropdown && (
          <div className="absolute left-0 right-0 top-full mt-2 z-30 rounded-lg border border-line bg-paper shadow-[0_1px_0_rgba(26,24,21,0.04),0_18px_40px_-20px_rgba(26,24,21,0.4)] overflow-hidden">
            {searching && hits.length === 0 && (
              <div className="px-4 py-3 font-mono text-[12px] text-ink-3">Searching…</div>
            )}
            {!searching && hits.length === 0 && (
              <div className="px-4 py-3 font-sans text-[14px] text-ink-2">
                No match. Try a last name, a PAC, or a bill name.
              </div>
            )}
            {hits.map((h) => (
              <button
                key={`${h.type}-${h.id}`}
                type="button"
                onClick={() => go(h)}
                className="w-full text-left flex items-center justify-between gap-3 px-4 py-3 hover:bg-paper-2 transition-colors border-b border-line last:border-0"
              >
                <span className="min-w-0">
                  <span className="block font-display text-[16px] text-ink leading-tight truncate">{h.label}</span>
                  {h.sub && <span className="block font-sans text-[12px] text-ink-2 truncate">{h.sub}</span>}
                </span>
                <span className="shrink-0 font-mono text-[9px] uppercase tracking-[0.14em] text-ink-3 border border-line rounded px-1.5 py-0.5">
                  {TYPE_LABEL[h.type] || h.type}
                </span>
              </button>
            ))}
          </div>
        )}
      </form>

      <p className={`mt-3 font-sans text-[13px] text-ink-3 ${centered ? 'text-center' : ''}`}>
        Free to start — 5 searches a month, no card.
      </p>
    </div>
  )
}
