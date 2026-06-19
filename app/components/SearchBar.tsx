'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Search, X } from 'lucide-react'

type PoliticianResult = {
  slug: string
  name: string
  party: string
  branch: string
  state: string
  scorecard_percentage_kept: number
  photo_url: string
}

type PromiseResult = {
  promise_text: string
  verdict: string
  category: string
  politician_name: string
  politician_slug: string
}

const VERDICT_COLORS: Record<string, string> = {
  KEPT: 'text-emerald-400',
  PARTIAL: 'text-amber-400',
  BROKEN: 'text-rose-400',
  YOU_DECIDE: 'text-violet-400',
  BLOCKED: 'text-ink-400',
}

export default function SearchBar() {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [politicians, setPoliticians] = useState<PoliticianResult[]>([])
  const [promises, setPromises] = useState<PromiseResult[]>([])
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<NodeJS.Timeout>()

  const search = useCallback(async (q: string) => {
    if (q.length < 2) {
      setPoliticians([])
      setPromises([])
      return
    }
    setLoading(true)
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`)
      if (res.ok) {
        const data = await res.json()
        setPoliticians(data.politicians || [])
        setPromises(data.promises || [])
      }
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => search(query), 200)
    return () => clearTimeout(debounceRef.current)
  }, [query, search])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === '/' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        e.preventDefault()
        inputRef.current?.focus()
        setOpen(true)
      }
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [])

  const hasResults = politicians.length > 0 || promises.length > 0
  const showDropdown = open && query.length >= 2

  return (
    <div ref={containerRef} className="relative">
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-ink-900/60 border border-ink-800/60 focus-within:border-amber-500/40 transition-colors">
        <Search className="size-3.5 text-ink-500 shrink-0" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          placeholder='Search promises… (press "/")'
          className="bg-transparent text-sm text-ink-200 placeholder:text-ink-600 outline-none w-32 sm:w-48 lg:w-56"
        />
        {query && (
          <button onClick={() => { setQuery(''); setPoliticians([]); setPromises([]) }} className="text-ink-500 hover:text-ink-300">
            <X className="size-3.5" />
          </button>
        )}
      </div>

      {showDropdown && (
        <div className="absolute top-full mt-2 right-0 w-[340px] sm:w-[420px] max-h-[70vh] overflow-y-auto rounded-lg border border-ink-800/60 bg-ink-950 shadow-2xl shadow-black/40 z-50">
          {loading && (
            <div className="px-4 py-3 text-sm text-ink-500">Searching…</div>
          )}

          {!loading && !hasResults && query.length >= 2 && (
            <div className="px-4 py-6 text-center text-sm text-ink-500">
              No results for &ldquo;{query}&rdquo;
            </div>
          )}

          {politicians.length > 0 && (
            <div>
              <div className="px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-ink-500 border-b border-ink-800/40">
                Politicians
              </div>
              {politicians.map((p) => (
                <Link
                  key={p.slug}
                  href={`/politician/${p.slug}`}
                  onClick={() => { setOpen(false); setQuery('') }}
                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-ink-900/60 transition-colors"
                >
                  <div className="shrink-0 size-8 rounded-full bg-ink-800 overflow-hidden">
                    {p.photo_url && (
                      <img src={p.photo_url} alt="" className="size-full object-cover" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-ink-100 truncate">{p.name}</div>
                    <div className="text-xs text-ink-500">
                      {p.party} · {p.branch} · {p.state}
                      {p.scorecard_percentage_kept != null && (
                        <span className="ml-1 text-emerald-400">
                          {Math.round(p.scorecard_percentage_kept)}% kept
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {promises.length > 0 && (
            <div>
              <div className="px-4 py-2 text-[11px] font-semibold uppercase tracking-wider text-ink-500 border-b border-ink-800/40">
                Promises
              </div>
              {promises.map((p, i) => (
                <Link
                  key={i}
                  href={`/politician/${p.politician_slug}`}
                  onClick={() => { setOpen(false); setQuery('') }}
                  className="block px-4 py-2.5 hover:bg-ink-900/60 transition-colors"
                >
                  <div className="text-sm text-ink-200 line-clamp-2">{p.promise_text}</div>
                  <div className="mt-1 flex items-center gap-2 text-xs text-ink-500">
                    <span className={VERDICT_COLORS[p.verdict] || 'text-ink-400'}>{p.verdict}</span>
                    <span>·</span>
                    <span>{p.politician_name}</span>
                    {p.category && <><span>·</span><span>{p.category}</span></>}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
