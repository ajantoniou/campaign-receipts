// Server-only auth helpers. Magic-link flow:
//   1. /auth/signin POSTs an email → mintMagicLink → Resend mail.
//   2. User clicks /auth/verify/[token] — GET peeks and shows a confirm
//      button (mail scanners GET links; only a human POSTs) → POST →
//      consumeMagicLink → upsert user → mintSession → httpOnly cookie.
//   3. Server components call getSessionUser(cookies()) on each request
//      to know who's logged in; lib/entitlement.ts layers on top.
//
// No Supabase Auth, no NextAuth. The token tables are simple, the
// cookie is httpOnly + Secure, and our scale doesn't justify JWT.

import { randomBytes } from 'crypto'
import { cookies } from 'next/headers'
import { supabaseService } from './supabase'

const COOKIE_NAME = 'cr_sess'
const SESSION_TTL_DAYS = 60
const MAGIC_LINK_TTL_MINUTES = 30

function token(bytes = 32) {
  return randomBytes(bytes).toString('base64url')
}

export async function mintMagicLink(
  email: string,
  meta?: { ip?: string | null; userAgent?: string | null },
): Promise<string> {
  const t = token(24)
  const expiresAt = new Date(Date.now() + MAGIC_LINK_TTL_MINUTES * 60_000).toISOString()
  const { error } = await supabaseService.from('cr_magic_links').insert({
    token: t,
    email: email.toLowerCase().trim(),
    expires_at: expiresAt,
    ip: meta?.ip ?? null,
    user_agent: meta?.userAgent?.slice(0, 400) ?? null,
  })
  if (error) throw new Error(`mintMagicLink: ${error.message}`)
  return t
}

// "Links minted in the last N minutes" for the abuse caps in /api/auth/start.
// Fails open (0) on a DB error — a count blip must not lock signin.
export async function countRecentMagicLinks(
  filter: { email?: string; ip?: string },
  withinMinutes: number,
): Promise<number> {
  const since = new Date(Date.now() - withinMinutes * 60_000).toISOString()
  let q = supabaseService
    .from('cr_magic_links')
    .select('token', { count: 'exact', head: true })
    .gte('created_at', since)
  if (filter.email) q = q.eq('email', filter.email)
  if (filter.ip) q = q.eq('ip', filter.ip)
  const { count, error } = await q
  if (error) return 0
  return count ?? 0
}

// Read-only "is this link still usable?" for the GET confirm page —
// mail-gateway link scanners GET every URL, so GET must never consume.
export async function peekMagicLink(t: string): Promise<boolean> {
  const { data } = await supabaseService
    .from('cr_magic_links')
    .select('expires_at, consumed_at')
    .eq('token', t)
    .maybeSingle()
  if (!data || data.consumed_at) return false
  return new Date(data.expires_at).getTime() >= Date.now()
}

export async function consumeMagicLink(t: string): Promise<{ userId: string; email: string } | null> {
  // Atomic claim: the UPDATE only matches a token that is still unconsumed, so
  // two concurrent requests with the same link can't both mint a session
  // (check-then-act race). The DB returns the row to exactly one caller.
  const { data } = await supabaseService
    .from('cr_magic_links')
    .update({ consumed_at: new Date().toISOString() })
    .eq('token', t)
    .is('consumed_at', null)
    .select('email, expires_at')
    .maybeSingle()
  if (!data) return null // unknown token, or already consumed by a concurrent request
  if (new Date(data.expires_at).getTime() < Date.now()) return null

  const email = data.email.toLowerCase().trim()
  const { data: existing } = await supabaseService
    .from('cr_users')
    .select('id')
    .eq('email', email)
    .maybeSingle()
  let userId = existing?.id
  if (!userId) {
    const { data: created, error } = await supabaseService
      .from('cr_users')
      .insert({ email })
      .select('id')
      .single()
    if (error) throw new Error(`consumeMagicLink upsert: ${error.message}`)
    userId = created.id
  }
  return { userId, email }
}

export async function mintSession(userId: string): Promise<string> {
  const t = token(32)
  const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 86_400_000).toISOString()
  const { error } = await supabaseService.from('cr_sessions').insert({
    token: t,
    user_id: userId,
    expires_at: expiresAt,
  })
  if (error) throw new Error(`mintSession: ${error.message}`)
  return t
}

export function setSessionCookie(sessionToken: string) {
  cookies().set(COOKIE_NAME, sessionToken, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_TTL_DAYS * 86_400,
  })
}

export function clearSessionCookie() {
  cookies().delete(COOKIE_NAME)
}

export type SessionUser = {
  id: string
  email: string
  displayName: string | null
}

export async function getSessionUser(): Promise<SessionUser | null> {
  const sessionToken = cookies().get(COOKIE_NAME)?.value
  if (!sessionToken) return null

  const { data: sess } = await supabaseService
    .from('cr_sessions')
    .select('user_id, expires_at')
    .eq('token', sessionToken)
    .maybeSingle()
  if (!sess) return null
  if (new Date(sess.expires_at).getTime() < Date.now()) {
    // Expired token grants nothing AND we delete the dead row so it can't be
    // replayed against any future code path that forgets the expiry check.
    // Fire-and-forget with a rejection handler so a DB blip can't surface as
    // an unhandled rejection.
    void supabaseService.from('cr_sessions').delete().eq('token', sessionToken).then(
      () => {},
      () => {},
    )
    return null
  }

  const { data: user } = await supabaseService
    .from('cr_users')
    .select('id, email, display_name')
    .eq('id', sess.user_id)
    .maybeSingle()
  if (!user) return null

  // Touch last_used_at on the session — fire-and-forget, don't block. The
  // rejection handler keeps a DB blip from becoming an unhandled rejection.
  void supabaseService
    .from('cr_sessions')
    .update({ last_used_at: new Date().toISOString() })
    .eq('token', sessionToken)
    .then(
      () => {},
      () => {},
    )

  return { id: user.id, email: user.email, displayName: user.display_name }
}
