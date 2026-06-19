'use client'

// Header auth button. Shows "Log in" by default and swaps to "Dashboard" once
// it confirms a session via /api/me. Client-side so the root layout can stay
// statically optimized (no cookies() in the layout → no forced-dynamic on
// every public page). httpOnly cookie means JS can't read the session
// directly, hence the tiny fetch.

import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function AuthNavButton({ variant = 'desktop' }: { variant?: 'desktop' | 'mobile' }) {
  // null = unknown (still checking). Render the safe "Log in" affordance while
  // unknown so there's never a flash of a Dashboard link for a logged-out user.
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null)

  useEffect(() => {
    let alive = true
    fetch('/api/me', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : { loggedIn: false }))
      .then((d) => {
        if (alive) setLoggedIn(!!d.loggedIn)
      })
      .catch(() => {
        if (alive) setLoggedIn(false)
      })
    return () => {
      alive = false
    }
  }, [])

  const isDash = loggedIn === true
  const href = isDash ? '/dashboard' : '/auth/signin'
  const label = isDash ? 'Dashboard' : 'Log in'

  if (variant === 'mobile') {
    return (
      <Link
        href={href}
        className="block font-sans text-[17px] text-ink py-3 border-b border-line"
      >
        {label}
      </Link>
    )
  }

  // Desktop: a filled pill so it reads as the account action, distinct from the
  // text nav links beside it.
  return (
    <Link
      href={href}
      className="ml-1 inline-flex items-center rounded-full bg-ink text-paper hover:bg-ink-2 font-sans text-[13px] font-medium px-3.5 py-1.5 transition-colors border border-ink"
    >
      {label}
    </Link>
  )
}
