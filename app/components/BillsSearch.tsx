'use client'

// Find an older bill — search box under the Newsletter page. Debounced query
// to /api/bills-search, real results, each links to the bill's money-trail
// page. Brand parchment/navy, IBM-Plex-Mono labels. 3rd-grade copy.

import { useState, useRef, useEffect, useCallback } from 'react'
import Link from 'next/link'

type BillHit = {
  congress: number
  bill_type: string
  bill_number: number
  title: string
  status: string | null
  href: string
}

export default function BillsSearch() {
  const [query, setQuery] = useState('')
  const [bills, setBills] = useState<BillHit[]>([])
  const [loading, setLoading] = useState(false)
  const [touched, setTouched] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>()

  const search = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setBills([])
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`/api/bills-search?q=${encodeURIComponent(q)}`)
      if (res.ok) {
        const data = await res.json()
        setBills(data.bills || [])
      } else {
        setBills([])
      }
    } catch {
      setBills([])
    } finally {
      setLoading(false)
      setTouched(true)
    }
  }, [])

  useEffect(() => {
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => search(query), 220)
    return () => clearTimeout(debounceRef.current)
  }, [query, search])

  const showEmpty = touched && !loading && query.trim().length >= 2 && bills.length === 0

  return (
    <div className="max-w-[760px] mx-auto">
      <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-2 mb-3">
        Find an older bill
      </div>
      <h2 className="font-display text-[28px] sm:text-[34px] leading-[1.1] tracking-[-0.005em] text-ink">
        Look up a past bill.
      </h2>
      <p className="mt-3 font-sans text-[15px] text-ink-2 leading-relaxed">
        Type a bill name or its number. See who paid for it.
      </p>

      <div className="mt-5">
        <label htmlFor="bills-search" className="sr-only">Search past bills</label>
        <input
          id="bills-search"
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Try a bill name or a number"
          className="w-full rounded-lg border border-line bg-paper px-4 py-3.5 font-sans text-[16px] text-ink placeholder:text-ink-3 outline-none focus:border-ink transition-colors"
        />
      </div>

      {loading && (
        <p className="mt-4 font-sans text-[14px] text-ink-3">Searching…</p>
      )}

      {showEmpty && (
        <p className="mt-4 font-sans text-[14px] text-ink-3">
          No bills match that yet. Try a number, like 3633.
        </p>
      )}

      {bills.length > 0 && (
        <ul className="mt-5 list-none p-0 space-y-2.5">
          {bills.map((b) => (
            <li key={`${b.congress}-${b.bill_type}-${b.bill_number}`}>
              <Link
                href={b.href}
                className="block rounded-lg border border-line bg-paper-2 px-4 py-3 hover:border-ink transition-colors group"
              >
                <div className="flex items-baseline justify-between gap-3">
                  <span className="font-sans text-[15px] text-ink leading-snug group-hover:underline underline-offset-4">
                    {b.title}
                  </span>
                  <span className="shrink-0 font-mono text-[11px] uppercase tracking-[0.1em] text-ink-3">
                    {(b.bill_type || '').toUpperCase()} {b.bill_number}
                  </span>
                </div>
                {b.status && (
                  <div className="mt-1 font-mono text-[11px] uppercase tracking-[0.08em] text-ink-3">
                    {b.status}
                  </div>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
