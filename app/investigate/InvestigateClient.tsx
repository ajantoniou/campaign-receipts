'use client'

// The credit-metered Haiku search CHAT — the core of the $45 software product.
//
// Flow: pick an entity (politician|donor|bill|vote) → start a session (uses 1
// of 100 monthly credits) → Haiku writes a sourced summary of the donor-
// influence connections → ask follow-ups in the SAME session (free) and watch
// the summary UPDATE → when the session is full, "New search" spends a fresh
// credit. Free / non-software users see the teaser + upgrade CTA.
import { useState, useRef, useCallback } from 'react'
import Link from 'next/link'
import { marked } from 'marked'

type Hit = { type: string; id: string; label: string; sub: string }
type ChatMessage = { role: 'user' | 'assistant'; content: string }
type Session = {
  id: string
  entity_type: string
  entity_id: string
  entity_name: string
  summary_md: string
  messages: ChatMessage[]
  turns: number
  context_full: boolean
}
type Credits = { used: number; allotment: number; remaining: number; resets_at?: string }

const TYPE_LABEL: Record<string, string> = {
  politician: 'Politician',
  donor: 'Big donor',
  bill: 'Bill',
  vote: 'Vote',
}

const FILTERS = [
  { key: '', label: 'All' },
  { key: 'politician', label: 'Politicians' },
  { key: 'donor', label: 'Donors' },
  { key: 'bill', label: 'Bills' },
  { key: 'vote', label: 'Votes' },
]

function fmtDate(d?: string) {
  if (!d) return ''
  return new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function InvestigateClient({
  hasSoftware,
  initialCredits,
}: {
  hasSoftware: boolean
  initialCredits: Credits | null
}) {
  const [q, setQ] = useState('')
  const [filter, setFilter] = useState('')
  const [hits, setHits] = useState<Hit[]>([])
  const [searching, setSearching] = useState(false)
  const debounce = useRef<NodeJS.Timeout>()

  const [credits, setCredits] = useState<Credits | null>(initialCredits)
  const [session, setSession] = useState<Session | null>(null)
  const [starting, setStarting] = useState(false)
  const [followText, setFollowText] = useState('')
  const [asking, setAsking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [capped, setCapped] = useState(false)

  const search = useCallback((value: string, type: string) => {
    if (value.trim().length < 2) {
      setHits([])
      return
    }
    setSearching(true)
    const url = `/api/entity-search?q=${encodeURIComponent(value)}${type ? `&type=${type}` : ''}`
    fetch(url)
      .then((r) => r.json())
      .then((d) => setHits(d.hits || []))
      .catch(() => setHits([]))
      .finally(() => setSearching(false))
  }, [])

  const onChange = (value: string) => {
    setQ(value)
    clearTimeout(debounce.current)
    debounce.current = setTimeout(() => search(value, filter), 250)
  }
  const onFilter = (key: string) => {
    setFilter(key)
    search(q, key)
  }

  async function startSession(hit: Hit) {
    setError(null)
    setCapped(false)
    setStarting(true)
    setSession(null)
    try {
      const r = await fetch('/api/search/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entity_type: hit.type, entity_id: hit.id }),
      })
      const d = await r.json()
      if (r.status === 429) {
        setCapped(true)
        setError(d.error || "You've used all 100 searches this month.")
        if (d.credits) setCredits({ ...d.credits, resets_at: d.resets_at })
        return
      }
      if (!r.ok) throw new Error(d.error || 'Could not start the search.')
      setSession(d.session)
      if (d.credits) setCredits(d.credits)
      setHits([])
      setQ('')
    } catch (e: any) {
      setError(e.message || 'Could not start the search.')
    } finally {
      setStarting(false)
    }
  }

  async function ask() {
    if (!session || !followText.trim()) return
    const text = followText.trim()
    setAsking(true)
    setError(null)
    // optimistic: show the user's question immediately
    setSession((s) =>
      s ? { ...s, messages: [...s.messages, { role: 'user', content: text }] } : s,
    )
    setFollowText('')
    try {
      const r = await fetch(`/api/search/session/${session.id}/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })
      const d = await r.json()
      if (r.status === 409) {
        setSession((s) => (s ? { ...s, context_full: true } : s))
        setError(d.error || 'This search is full. Start a new search.')
        return
      }
      if (!r.ok) throw new Error(d.error || 'Could not answer.')
      setSession((s) =>
        s
          ? {
              ...s,
              summary_md: d.summary_md,
              turns: d.turns,
              context_full: d.context_full,
              messages: [...s.messages, { role: 'assistant', content: d.reply }],
            }
          : s,
      )
      if (d.credits) setCredits(d.credits)
    } catch (e: any) {
      setError(e.message || 'Could not answer.')
    } finally {
      setAsking(false)
    }
  }

  function newSearch() {
    setSession(null)
    setError(null)
    setCapped(false)
    setFollowText('')
  }

  // ── Teaser for free / newsletter-only users ──
  if (!hasSoftware) {
    return (
      <div className="max-w-[760px] rounded-lg border border-line bg-paper-2 p-6">
        <div className="font-mono text-[11px] uppercase tracking-[0.16em] text-broken mb-2">
          Donor Intelligence
        </div>
        <h2 className="font-display text-[24px] leading-[1.15] text-ink m-0">
          Ask the receipts anything.
        </h2>
        <p className="mt-3 font-sans text-[15px] text-ink-2 leading-[1.55]">
          Pick a politician, a donor, a bill, or a vote. We build a sourced summary of who funds
          whom — and you can keep asking follow-up questions. Every number is tied to FEC and
          Congress records. If it&apos;s not in the data, we say so.
        </p>
        <p className="mt-2 font-sans text-[14px] text-ink-3 leading-[1.5]">
          Free to use. Each search opens a chat you can keep digging in.
        </p>
        <Link
          href="/investigate"
          className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-ink hover:bg-ink-2 text-paper font-sans text-[14px] font-medium px-5 py-2.5 no-underline transition-colors"
        >
          Start searching — free →
        </Link>
      </div>
    )
  }

  const summaryHtml = session ? (marked.parse(session.summary_md || '') as string) : ''

  return (
    <div className="max-w-[760px]">
      {/* Credits meter */}
      {credits && (
        <div className="mb-4 flex items-center justify-between rounded-lg border border-line bg-paper-2 px-4 py-2.5">
          <span className="font-sans text-[14px] text-ink">
            <strong>{credits.remaining}</strong> of {credits.allotment} searches left this month
          </span>
          {credits.resets_at && (
            <span className="font-mono text-[11px] text-ink-3">resets {fmtDate(credits.resets_at)}</span>
          )}
        </div>
      )}

      {!session && (
        <>
          <label htmlFor="q" className="sr-only">
            Search a politician, donor, bill, or vote
          </label>
          <input
            id="q"
            value={q}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Type a name — a politician, a donor, a bill, a vote"
            className="w-full rounded-lg border border-line bg-paper-2 px-4 py-3.5 font-sans text-[16px] text-ink placeholder:text-ink-3 focus:outline-none focus:border-ink-3"
            autoComplete="off"
            disabled={starting}
          />
          <div className="mt-3 flex flex-wrap gap-2">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                onClick={() => onFilter(f.key)}
                className={`rounded-full border px-3 py-1 font-mono text-[11px] uppercase tracking-[0.12em] transition-colors ${
                  filter === f.key ? 'border-ink bg-ink text-paper' : 'border-line text-ink-2 hover:border-ink-3'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {searching && <p className="mt-4 font-mono text-[12px] text-ink-3">Searching…</p>}
          {!searching && q.length >= 2 && hits.length === 0 && (
            <p className="mt-4 font-sans text-[14px] text-ink-2">
              No matches. Try a last name, a PAC name, or a bill name.
            </p>
          )}
          {hits.length > 0 && (
            <ul className="mt-4 space-y-2 list-none p-0">
              {hits.map((h) => (
                <li key={`${h.type}-${h.id}`}>
                  <button
                    onClick={() => startSession(h)}
                    disabled={starting}
                    className="w-full text-left rounded-lg border border-line bg-paper hover:bg-paper-2 px-4 py-3 transition-colors disabled:opacity-60"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-display text-[17px] text-ink leading-tight">{h.label}</span>
                      <span className="shrink-0 font-mono text-[10px] uppercase tracking-[0.12em] text-ink-3 border border-line rounded px-1.5 py-0.5">
                        {TYPE_LABEL[h.type]}
                      </span>
                    </div>
                    {h.sub && <div className="mt-1 font-sans text-[13px] text-ink-2">{h.sub}</div>}
                  </button>
                </li>
              ))}
            </ul>
          )}
          {starting && (
            <div className="mt-6 rounded-lg border border-line bg-paper-2 p-6">
              <p className="font-mono text-[12px] text-ink-3">Building your sourced summary…</p>
            </div>
          )}
        </>
      )}

      {error && !session && (
        <div className="mt-4 rounded-lg border border-broken/40 bg-paper-2 p-4">
          <p className="font-sans text-[14px] text-ink m-0">{error}</p>
          {capped && credits?.resets_at && (
            <p className="mt-1 font-sans text-[13px] text-ink-2 m-0">
              Your searches reset on {fmtDate(credits.resets_at)}.
            </p>
          )}
        </div>
      )}

      {/* Active session */}
      {session && (
        <div className="rounded-lg border border-line bg-paper-2 p-6">
          <div className="flex items-center justify-between gap-3">
            <div className="font-mono text-[11px] uppercase tracking-[0.16em] text-broken">
              {TYPE_LABEL[session.entity_type]}
            </div>
            <button
              onClick={newSearch}
              className="font-sans text-[13px] text-ink-3 underline underline-offset-2 hover:text-ink-2"
            >
              New search
            </button>
          </div>
          <h2 className="mt-1 font-display text-[26px] leading-[1.15] text-ink m-0">
            {session.entity_name}
          </h2>

          {/* Running summary — UPDATES as the user asks follow-ups */}
          <div className="mt-4 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-3">
            What the receipts show
          </div>
          <div
            className="mt-2 dossier-prose font-sans text-[15px] text-ink-2 leading-[1.6]"
            dangerouslySetInnerHTML={{ __html: summaryHtml }}
          />

          {/* Follow-up Q&A transcript (skip the first auto-summary turn) */}
          {session.messages.length > 1 && (
            <div className="mt-6 border-t border-line pt-4 space-y-4">
              {session.messages.slice(1).map((m, i) => (
                <div key={i}>
                  {m.role === 'user' ? (
                    <div className="font-sans text-[14px] font-semibold text-ink">You: {m.content}</div>
                  ) : (
                    <div
                      className="mt-1 dossier-prose font-sans text-[14px] text-ink-2 leading-[1.6]"
                      dangerouslySetInnerHTML={{ __html: marked.parse(m.content) as string }}
                    />
                  )}
                </div>
              ))}
            </div>
          )}

          {asking && <p className="mt-4 font-mono text-[12px] text-ink-3">Looking it up in the data…</p>}
          {error && <p className="mt-3 font-sans text-[14px] text-broken m-0">{error}</p>}

          {/* Follow-up box or context-full notice */}
          {session.context_full ? (
            <div className="mt-5 rounded-lg border border-dashed border-ink-3 bg-paper p-4">
              <p className="font-sans text-[14px] text-ink m-0">
                This search is full. Start a new search to keep digging — it uses one of your monthly
                searches.
              </p>
              <button
                onClick={newSearch}
                className="mt-3 inline-flex rounded-full bg-ink hover:bg-ink-2 text-paper font-sans text-[14px] font-medium px-5 py-2.5 transition-colors"
              >
                New search
              </button>
            </div>
          ) : (
            <div className="mt-5">
              <div className="flex gap-2">
                <input
                  value={followText}
                  onChange={(e) => setFollowText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !asking && ask()}
                  placeholder='Ask a follow-up — "go deeper" or a new question'
                  className="flex-1 rounded-lg border border-line bg-paper px-4 py-2.5 font-sans text-[15px] text-ink placeholder:text-ink-3 focus:outline-none focus:border-ink-3"
                  disabled={asking}
                />
                <button
                  onClick={ask}
                  disabled={asking || !followText.trim()}
                  className="rounded-lg bg-ink hover:bg-ink-2 text-paper font-sans text-[14px] font-medium px-5 disabled:opacity-50"
                >
                  Ask
                </button>
              </div>
              <p className="mt-2 font-sans text-[12px] text-ink-3">
                Follow-ups in this search are free. {Math.max(0, 12 - session.turns)} questions left in
                this search.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
