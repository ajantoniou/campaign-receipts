// Email-only sign-in. Posts to /api/auth/start which sends the link.
// The hidden `ft` field is a signed form-origin token and `website` is a
// honeypot — both checked in /api/auth/start (see lib/form-token.ts for
// the June 2026 abuse context). force-dynamic keeps `ft` fresh per load.

import { mintFormToken } from '@/lib/form-token'
import TurnstileWidget from '@/app/components/TurnstileWidget'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Sign in — CampaignReceipts',
  description: 'Sign in with a magic link emailed to you.',
}

const ERROR_COPY: Record<string, string> = {
  invalid_email: "That doesn't look like a valid email.",
  form_expired: 'Something went wrong. Please try again.',
  link_invalid: 'That link expired or was already used. Request a fresh one.',
}

export default function SignInPage({
  searchParams,
}: {
  searchParams: { sent?: string; error?: string; next?: string }
}) {
  const sent = searchParams.sent === '1'
  const error = searchParams.error
  const next = searchParams.next || '/dashboard'
  const errorCopy = error ? ERROR_COPY[error] : undefined

  return (
    <section className="bg-paper">
      <div className="section-shell py-20 max-w-md">
        <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-broken mb-2">Account</div>
        <h1 className="font-display text-[40px] leading-[1.0] tracking-[-0.012em] text-ink m-0">Sign in</h1>
        <p className="mt-3 text-ink-2 text-[15px]">
          We'll email you a one-time link. No password, no signup form.
        </p>

        {sent ? (
          <div className="mt-8 rounded-xl ring-1 ring-kept/30 bg-kept/5 p-6">
            <div className="text-sm font-semibold text-kept">Check your inbox.</div>
            <div className="mt-1 text-xs text-ink-2">
              The link expires in 30 minutes. If it doesn't arrive, check spam or try again.
            </div>
          </div>
        ) : (
          <form method="post" action="/api/auth/start" className="mt-8 grid gap-3">
            <input type="hidden" name="next" value={next} />
            <input type="hidden" name="ft" value={mintFormToken()} />
            {/* Honeypot: invisible to people, filled by form bots. */}
            <input
              type="text"
              name="website"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              className="hidden"
            />
            <input
              type="email"
              name="email"
              required
              autoFocus
              placeholder="you@email.com"
              className="bg-paper-2 ring-1 ring-line focus:ring-ink-3 focus:outline-none rounded-md px-4 py-2.5 text-sm text-ink"
            />
            {/* Invisible Turnstile challenge; drops cf-turnstile-response into the form. */}
            <TurnstileWidget />
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-full bg-ink hover:bg-ink-2 text-paper font-sans text-[14px] font-medium px-5 py-2.5 transition-colors"
            >
              Email me a link
            </button>
            {errorCopy && <div className="text-xs text-broken">{errorCopy}</div>}
          </form>
        )}
      </div>
    </section>
  )
}
