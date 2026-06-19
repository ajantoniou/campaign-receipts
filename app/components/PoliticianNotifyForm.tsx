'use client'

// PoliticianNotifyForm — inline email-only signup that tags the
// signup with a specific politician slug. Per founder rev-7 batch
// C: "'Notify me when politician updates' tagged with politician slug".
//
// Stores in cr_comp_requests with:
//   request_type = 'friday_receipts' (reuses the existing newsletter pipe)
//   feedback_topic = 'notify:<slug>'   (so we can filter who wants what)
//   utm_source = 'politician-page'
//   utm_content = '<slug>'
//
// When a politician page changes (re-grade, new verdict, new bill),
// the cron picks up these rows and emails just the targeted cohort.

import { useState } from 'react'

export default function PoliticianNotifyForm({
  slug,
  name,
}: {
  slug: string
  name: string
}) {
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [website, setWebsite] = useState('') // honeypot

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (website) { setSubmitted(true); return }
    setError(null)
    setSubmitting(true)
    try {
      const resp = await fetch('/api/comp-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // Honeypot reaches the server too — direct-POST bots skip this
          // client entirely, so the server-side check is the one that bites.
          website: website || undefined,
          request_type: 'friday_receipts',
          email,
          name: email.split('@')[0],
          feedback_topic: `notify:${slug}`,
          utm_source: 'politician-page',
          utm_content: slug,
        }),
      })
      if (!resp.ok) {
        const body = await resp.json().catch(() => ({}))
        throw new Error(body.error || 'Submission failed')
      }
      setSubmitted(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Submission failed')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="rounded-lg border border-kept/40 bg-kept/[0.05] p-4">
        <div className="font-mono text-[11px] uppercase tracking-[0.16em] text-kept">
          ✓ Subscribed
        </div>
        <p className="mt-2 font-sans text-[14px] text-ink-2 leading-relaxed m-0">
          We'll email you when {name}'s scorecard updates — new verdicts,
          re-grades, or major receipts. One-click unsubscribe.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-line bg-paper-2 p-5">
      <div className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-2 mb-2">
        Notify me on updates
      </div>
      <h3 className="font-display text-[20px] leading-[1.15] tracking-[-0.005em] text-ink m-0 mb-2">
        Track {name}.
      </h3>
      <p className="font-sans text-[14px] text-ink-2 leading-[1.5] mb-4 m-0">
        Email me when a verdict on {name}'s scorecard changes,
        a new receipt is added, or a major bill vote lands. One short
        email at a time, never bundled with the rest of the list.
      </p>
      <form onSubmit={onSubmit} className="flex flex-col sm:flex-row gap-2">
        <label className="hidden" aria-hidden>
          Website
          <input
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
          />
        </label>
        <input
          type="email"
          required
          placeholder="you@newsroom.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="flex-1 bg-paper border border-line focus:border-ink focus:outline-none focus:ring-2 focus:ring-ink/20 rounded-md px-3 py-2 font-sans text-[14px] text-ink placeholder:text-ink-3 transition"
        />
        <button
          type="submit"
          disabled={submitting}
          className="inline-flex items-center justify-center rounded-full bg-ink text-paper hover:bg-ink-2 disabled:opacity-50 font-sans text-[14px] font-medium px-4 py-2 transition-colors border border-ink shrink-0"
        >
          {submitting ? '…' : 'Notify me →'}
        </button>
      </form>
      {error && (
        <div className="mt-2 font-mono text-[10px] uppercase tracking-[0.14em] text-broken">
          {error}
        </div>
      )}
    </div>
  )
}
