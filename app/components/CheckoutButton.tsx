'use client'

import { useState } from 'react'

// Opens the LemonSqueezy checkout in the on-domain OVERLAY (modal) — same pattern
// as uploadcheck.app (lemon.js loaded in the root layout). Instead of a full-page
// redirect, we ask /api/checkout?format=json for the server-built, email-prefilled
// checkout URL (auth + user_id stay server-side), then open it with
// window.LemonSqueezy.Url.Open(). Falls back to a plain navigation if lemon.js
// hasn't loaded, and to sign-in / pricing when the server says so.

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
  const [loading, setLoading] = useState(false)

  async function handleClick() {
    if (loading) return
    setLoading(true)
    try {
      const resp = await fetch(`/api/checkout?product=newsletter&format=json`, {
        headers: { accept: 'application/json' },
      })
      const data = await resp.json().catch(() => null)

      // Sign-in required or checkout not configured → server tells us where to go.
      if (!data?.ok) {
        if (data?.redirect) window.location.href = data.redirect
        return
      }

      const url: string = data.url
      const ls = typeof window !== 'undefined' ? window.LemonSqueezy : undefined
      if (ls?.Url?.Open) {
        ls.Url.Open(url) // on-domain overlay modal
      } else {
        // lemon.js not ready — open the hosted checkout directly instead of failing.
        window.location.href = url
      }
    } catch {
      // Network/unknown error → fall back to the redirect endpoint.
      window.location.href = `/api/checkout?product=newsletter`
    } finally {
      setLoading(false)
    }
  }

  return (
    <button type="button" onClick={handleClick} className={className} aria-busy={loading}>
      {children}
    </button>
  )
}
