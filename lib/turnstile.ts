// Server-side Cloudflare Turnstile verification.
//
// Turnstile is an invisible (Managed-mode) challenge layered on top of the
// honeypot + rate caps from the June 2026 form-spam work. The client widget
// (components/TurnstileWidget.tsx) drops a `cf-turnstile-response` token into
// the form; this verifies it against Cloudflare's siteverify endpoint.
//
// Fail-OPEN by design, in two places:
//   1. Secret unset (local dev / misconfig) → pass.
//   2. No token at all → pass. A missing token means the widget never ran —
//      JS disabled, the CF script blocked by a corporate firewall or privacy
//      extension, an old cached page. Blocking here would silently lock out
//      exactly the legitimate corporate users we fixed the magic-link flow
//      for. The honeypot + per-IP/email caps remain the always-on backstop.
// Fail-CLOSED only on a token that is PRESENT but INVALID — that's a bot that
// ran (or faked) the widget and got a bad/forged token.
// Cloudflare unreachable (timeout / 5xx) also fails open — Turnstile is an
// added layer, never a single point of failure for sign-in.

const SECRET = process.env.TURNSTILE_SECRET_KEY || ''
const SITEVERIFY = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'

export function turnstileEnabled(): boolean {
  return SECRET.length > 0
}

export async function verifyTurnstile(token: string | null | undefined, ip?: string | null): Promise<boolean> {
  if (!SECRET) return true // not configured → don't block (dev / misconfig)
  if (!token) return true // widget never ran (no JS / script blocked) → fail open; caps still apply

  try {
    const body = new URLSearchParams({ secret: SECRET, response: token })
    if (ip) body.set('remoteip', ip)
    const res = await fetch(SITEVERIFY, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body,
      // Don't let a slow Cloudflare hang the request path.
      signal: AbortSignal.timeout(5000),
    })
    if (!res.ok) return true // Cloudflare itself errored → fail open
    const data = (await res.json()) as { success?: boolean; 'error-codes'?: string[] }
    // A misconfigured secret (e.g. a botched key rotation) would reject every
    // real user's valid token. Surface it loudly and fail OPEN rather than
    // silently locking everyone out — same spirit as the missing-token case.
    if (data['error-codes']?.includes('invalid-input-secret')) {
      console.error('verifyTurnstile: invalid-input-secret — TURNSTILE_SECRET_KEY is wrong; failing open')
      return true
    }
    return data.success === true
  } catch {
    return true // network error / timeout → fail open; caps still apply
  }
}
