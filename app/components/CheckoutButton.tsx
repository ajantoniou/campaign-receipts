'use client'

import { useState } from 'react'

// "Sign up today" → email-first checkout (founder 2026-06-23).
// Click the CTA → an inline email field appears → on submit we open the LemonSqueezy
// overlay (modal) PREFILLED with that email, waiting for payment. No sign-in wall.
// The /api/checkout?email=... endpoint builds the prefilled URL; the webhook
// reconciles the subscription by customer email. Falls back to a plain navigation
// if lemon.js (loaded in the root layout) hasn't initialized.

declare global {
  interface Window {
    LemonSqueezy?: { Url?: { Open?: (url: string) => void } }
  }
}

export default function CheckoutButton({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  const [open, setOpen] = useState(false) // email field revealed?
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())

  async function startCheckout(e?: React.FormEvent) {
    e?.preventDefault()
    if (loading) return
    if (!emailValid) { setError('Enter a valid email'); return }
    setError('')
    setLoading(true)
    try {
      const resp = await fetch(`/api/checkout?product=newsletter&format=json&email=${encodeURIComponent(email.trim())}`, {
        headers: { accept: 'application/json' },
      })
      const data = await resp.json().catch(() => null)
      if (!data?.ok) {
        if (data?.redirect) window.location.href = data.redirect
        else setError('Checkout unavailable — try again')
        return
      }
      const url: string = data.url
      const ls = typeof window !== 'undefined' ? window.LemonSqueezy : undefined
      if (ls?.Url?.Open) ls.Url.Open(url) // on-domain overlay modal, email prefilled
      else window.location.href = url
    } catch {
      window.location.href = `/api/checkout?product=newsletter&email=${encodeURIComponent(email.trim())}`
    } finally {
      setLoading(false)
    }
  }

  // Step 1: the "Sign up today" button.
  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className={className}>
        {children}
      </button>
    )
  }

  // Step 2: inline email capture → opens the prefilled payment modal.
  return (
    <form onSubmit={startCheckout} className="flex flex-col sm:flex-row gap-2 items-stretch w-full max-w-md">
      <input
        type="email"
        autoFocus
        required
        value={email}
        onChange={(e) => { setEmail(e.target.value); if (error) setError('') }}
        placeholder="Your email…"
        className="flex-1 bg-background border border-white/10 rounded-full px-5 py-3 text-primary text-sm focus:outline-none focus:border-white/30 transition-colors"
        aria-label="Email for newsletter signup"
      />
      <button type="submit" className={className} aria-busy={loading} disabled={loading}>
        {loading ? 'Opening…' : 'Continue'}
      </button>
      {error && <span className="text-xs text-accent self-center sm:absolute sm:mt-14">{error}</span>}
    </form>
  )
}
