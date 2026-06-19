'use client'

// Invisible Cloudflare Turnstile widget. Loads the CF script once, renders a
// Managed-mode challenge, and writes the resulting token into a hidden
// `cf-turnstile-response` field so it posts with the surrounding form (plain
// HTML POST or fetch — both pick up the named input). Verified server-side by
// lib/turnstile.ts. Renders nothing visible unless Cloudflare decides a
// request is risky. No-ops if the site key is unset (local dev).

import { useEffect, useRef } from 'react'

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || ''
const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js'

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: Record<string, unknown>) => string
      reset: (id?: string) => void
      remove: (id?: string) => void
    }
  }
}

// Resolve once window.turnstile is actually usable. The bare script `load`
// event can fire before CF has assigned the global (and won't fire again for
// a script already loaded on a prior SPA visit), so we additionally poll for
// the global with a hard cap. Worst case it never resolves and the widget
// simply doesn't arm — which degrades to "no token" → verifyTurnstile fails
// open, never a lockout.
function ensureScript(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve()
  if (window.turnstile) return Promise.resolve()

  const waitForGlobal = (resolve: () => void) => {
    if (window.turnstile) return resolve()
    let tries = 0
    const id = window.setInterval(() => {
      if (window.turnstile || tries++ > 40) {
        // ~10s cap
        window.clearInterval(id)
        resolve()
      }
    }, 250)
  }

  const existing = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT_SRC}"]`)
  if (existing) {
    // Script tag already in the DOM (e.g. a prior in-SPA visit). It may have
    // already finished, so don't rely on a fresh load event — poll the global.
    return new Promise((resolve) => waitForGlobal(resolve))
  }
  return new Promise((resolve) => {
    const s = document.createElement('script')
    s.src = SCRIPT_SRC
    s.async = true
    s.defer = true
    s.addEventListener('load', () => waitForGlobal(resolve), { once: true })
    document.head.appendChild(s)
  })
}

export default function TurnstileWidget() {
  const holder = useRef<HTMLDivElement>(null)
  const widgetId = useRef<string | null>(null)

  useEffect(() => {
    if (!SITE_KEY) return // not configured — render nothing, form still works
    let cancelled = false

    ensureScript().then(() => {
      if (cancelled || !holder.current || !window.turnstile) return
      // Guard against double-render under React StrictMode dev double-invoke.
      if (widgetId.current) return
      widgetId.current = window.turnstile.render(holder.current, {
        sitekey: SITE_KEY,
        // Managed: invisible unless CF flags the request. Token lands in a
        // hidden input named cf-turnstile-response inside `holder`.
        appearance: 'interaction-only',
        'response-field-name': 'cf-turnstile-response',
        // On expiry, silently refresh so a slow human isn't blocked.
        'expired-callback': () => window.turnstile?.reset(widgetId.current ?? undefined),
      })
    })

    return () => {
      cancelled = true
      if (widgetId.current && window.turnstile) {
        try {
          window.turnstile.remove(widgetId.current)
        } catch {
          /* widget already gone */
        }
        widgetId.current = null
      }
    }
  }, [])

  if (!SITE_KEY) return null
  return <div ref={holder} />
}
