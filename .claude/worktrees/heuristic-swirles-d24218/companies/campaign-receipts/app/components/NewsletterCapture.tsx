'use client'

import { useState } from 'react'
import type { NewsletterSource } from '@/lib/newsletter-signup'

type Variant = 'inline-receipt' | 'inline-wide' | 'footer-dark'

type Props = {
  variant: Variant
  surface: NewsletterSource
  sourceSlug?: string
  heading: React.ReactNode
  body: string
  buttonLabel: string
}

const variantClasses: Record<Variant, {
  shell: string
  eyebrow: string
  heading: string
  body: string
  input: string
  button: string
  microcopy: string
  success: string
}> = {
  'inline-receipt': {
    shell: 'relative overflow-hidden rounded-lg border border-line bg-paper p-5 sm:p-6 shadow-[0_1px_0_rgba(36,31,26,0.04)]',
    eyebrow: 'font-mono text-[11px] uppercase tracking-[0.18em] text-ink-2',
    heading: 'font-display text-[24px] sm:text-[28px] leading-[1.1] tracking-[-0.005em] text-ink m-0',
    body: 'font-sans text-[14px] sm:text-[15px] text-ink-2 leading-relaxed m-0',
    input: 'bg-paper-2 border border-line focus:border-ink focus:outline-none focus:ring-2 focus:ring-ink/20 rounded-md px-3.5 py-2.5 font-sans text-[14px] text-ink placeholder:text-ink-3 transition min-h-[44px]',
    button: 'inline-flex min-h-[44px] items-center justify-center rounded-full bg-ink text-paper hover:bg-ink-2 disabled:opacity-50 font-sans text-[14px] font-medium px-5 py-2.5 transition-colors border border-ink',
    microcopy: 'font-mono text-[10px] uppercase tracking-[0.14em] text-ink-3',
    success: 'rounded-lg border border-kept/30 bg-kept/[0.06] p-5',
  },
  'inline-wide': {
    shell: 'rounded-lg border border-line bg-paper-2 p-6 sm:p-8',
    eyebrow: 'font-mono text-[11px] uppercase tracking-[0.18em] text-ink-2',
    heading: 'font-display text-[28px] sm:text-[34px] leading-[1.1] tracking-[-0.005em] text-ink m-0',
    body: 'font-sans text-[15px] text-ink-2 leading-relaxed m-0',
    input: 'bg-paper border border-line focus:border-ink focus:outline-none focus:ring-2 focus:ring-ink/20 rounded-md px-3.5 py-2.5 font-sans text-[14px] text-ink placeholder:text-ink-3 transition min-h-[44px]',
    button: 'inline-flex min-h-[44px] items-center justify-center rounded-full bg-ink text-paper hover:bg-ink-2 disabled:opacity-50 font-sans text-[14px] font-medium px-5 py-2.5 transition-colors border border-ink',
    microcopy: 'font-mono text-[10px] uppercase tracking-[0.14em] text-ink-3',
    success: 'rounded-lg border border-kept/30 bg-kept/[0.06] p-6',
  },
  'footer-dark': {
    shell: 'w-full',
    eyebrow: 'sr-only',
    heading: 'sr-only',
    body: 'sr-only',
    input: 'bg-paper/10 border border-paper/20 focus:border-paper focus:outline-none focus:ring-2 focus:ring-paper/30 rounded-md px-3 py-2 font-sans text-[13px] text-paper placeholder:text-paper/40 transition min-h-[44px]',
    button: 'inline-flex min-h-[44px] items-center justify-center rounded-full bg-paper text-ink hover:bg-paper/90 disabled:opacity-50 font-sans text-[13px] font-medium px-4 py-2 transition-colors border border-paper shrink-0',
    microcopy: 'sr-only',
    success: 'font-mono text-[11px] uppercase tracking-[0.16em] text-paper',
  },
}

export default function NewsletterCapture({
  variant,
  surface,
  sourceSlug,
  heading,
  body,
  buttonLabel,
}: Props) {
  const classes = variantClasses[variant]
  const [email, setEmail] = useState('')
  const [website, setWebsite] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [confirmationSent, setConfirmationSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)

    try {
      const resp = await fetch('/api/newsletter-signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          source: surface,
          source_slug: sourceSlug,
          website,
        }),
      })

      const payload = (await resp.json().catch(() => ({}))) as {
        error?: string
        confirmationSent?: boolean
      }

      if (!resp.ok) {
        throw new Error(payload.error || 'Signup failed')
      }

      setConfirmationSent(Boolean(payload.confirmationSent))
      setSubmitted(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Signup failed')
    } finally {
      setSubmitting(false)
    }
  }

  if (submitted) {
    if (variant === 'footer-dark') {
      return (
        <div className={classes.success}>
          {confirmationSent ? 'Check your inbox to confirm' : 'Subscribed · your first email is on the way'}
        </div>
      )
    }

    return (
      <div className={classes.success}>
        <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-kept mb-2">
          {confirmationSent ? 'Confirmation sent' : 'You are on the list'}
        </div>
        <p className="font-sans text-[14px] text-ink-2 leading-relaxed m-0">
          {confirmationSent
            ? 'Check your inbox to confirm. We send occasional free updates — for the weekly money trail, see Friday Receipts ($9).'
            : "You'll get occasional free updates. Want the weekly money trail? That's Friday Receipts ($9). One-click unsubscribe."}
        </p>
      </div>
    )
  }

  return (
    <div className={classes.shell}>
      {variant === 'inline-receipt' && (
        <>
          <div className="pointer-events-none absolute inset-x-0 top-0 h-2 bg-[radial-gradient(circle_at_8px_0,var(--paper-2,#F4EEDF)_6px,transparent_6.5px)] bg-[length:16px_8px]" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2 bg-[radial-gradient(circle_at_8px_8px,var(--paper-2,#F4EEDF)_6px,transparent_6.5px)] bg-[length:16px_8px]" />
        </>
      )}
      <div className={classes.eyebrow}>Free updates · the announcement list</div>
      <h3 className={`${classes.heading} mt-2`}>{heading}</h3>
      <p className={`${classes.body} mt-3`}>{body}</p>

      <form onSubmit={onSubmit} className="mt-5 flex flex-col sm:flex-row gap-2">
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
        <label className="sr-only" htmlFor={`newsletter-email-${surface}-${variant}`}>
          Email address
        </label>
        <input
          id={`newsletter-email-${surface}-${variant}`}
          type="email"
          required
          inputMode="email"
          autoComplete="email"
          placeholder="you@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={`flex-1 ${classes.input}`}
        />
        <button type="submit" disabled={submitting} className={classes.button}>
          {submitting ? 'Sending...' : buttonLabel}
        </button>
      </form>
      {error && (
        <div className="mt-2 font-mono text-[10px] uppercase tracking-[0.14em] text-broken">
          {error}
        </div>
      )}
      <p className={`${classes.microcopy} mt-3`}>
        Occasional free updates · Unsubscribe in one click · We never sell your address
      </p>
    </div>
  )
}
