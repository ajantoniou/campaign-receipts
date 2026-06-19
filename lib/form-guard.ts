// Shared abuse guard for public form endpoints (newsletter, waitlist,
// comp-request). Counterpart of the magic-link caps in lib/auth.ts —
// see the June 2026 form-spam context in lib/form-token.ts.
//
// Why not the signed form token here: these forms live on cached/static
// marketing pages, so a 30-minute token would expire inside the page
// cache and reject real users. Defenses for cached pages are the
// honeypot field (checked server-side by each route) plus the hourly
// caps below, counted in cr_form_submissions so they survive deploys
// and span Render instances (the old per-route in-memory Maps did not).

import { supabaseService } from './supabase'

// Leftmost X-Forwarded-For entry. On Render the platform sets the first
// entry to the real client IP and appends its own internal-LB hops to the
// right — verified against Render's request logs, where the logged clientIP
// is always a distinct public address, never a shared proxy IP. Reading the
// rightmost entry would collapse every per-IP cap into one internal-LB
// bucket. (Leftmost is theoretically client-spoofable; on Render it is the
// only platform-trustworthy signal. If this domain moves behind the
// Cloudflare proxy, switch to cf-connecting-ip, which the client can't forge.)
export function clientIp(req: Request): string | null {
  return req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || null
}

// Returns true (and logs the submission) when under the caps; false when
// the caller should silently drop the request. Email cap is per form so a
// real person can use several forms in one hour; IP cap spans all forms so
// a bot can't shop around. Fails open — a count blip must not block forms.
export async function allowAndLogSubmission(opts: {
  // e.g. 'newsletter', 'waitlist', 'comp-request:tip' — the email cap is
  // per form key; the IP cap spans all keys.
  form: string
  email: string
  req: Request
  maxPerEmailPerHour?: number
  maxPerIpPerHour?: number
}): Promise<boolean> {
  const maxEmail = opts.maxPerEmailPerHour ?? 3
  const maxIp = opts.maxPerIpPerHour ?? 10
  const email = opts.email.trim().toLowerCase()
  const ip = clientIp(opts.req)
  const userAgent = opts.req.headers.get('user-agent')?.slice(0, 400) ?? null
  const since = new Date(Date.now() - 3600_000).toISOString()

  const [byEmail, byIp] = await Promise.all([
    supabaseService
      .from('cr_form_submissions')
      .select('id', { count: 'exact', head: true })
      .eq('form', opts.form)
      .eq('email', email)
      .gte('created_at', since),
    ip
      ? supabaseService
          .from('cr_form_submissions')
          .select('id', { count: 'exact', head: true })
          .eq('ip', ip)
          .gte('created_at', since)
      : Promise.resolve({ count: 0, error: null }),
  ])

  // A count error means the guard is inert (e.g. a missing grant) — log
  // loudly; the request is still allowed (fail open).
  if (byEmail.error) console.error('form-guard email count failed:', byEmail.error.message)
  if (byIp.error) console.error('form-guard ip count failed:', byIp.error.message)

  if ((byEmail.count ?? 0) >= maxEmail || (byIp.count ?? 0) >= maxIp) {
    // Server-side trace only — the client response stays indistinguishable
    // from success.
    console.log(`form-guard drop: form=${opts.form} email=${email} ip=${ip ?? '-'}`)
    return false
  }

  const { error } = await supabaseService
    .from('cr_form_submissions')
    .insert({ form: opts.form, email, ip, user_agent: userAgent })
  if (error) console.error('cr_form_submissions insert failed:', error.message)
  return true
}
