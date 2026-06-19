# Security Hardening Guide

Patterns and rules for all sites in the AgentCompanies portfolio.

## Supabase key separation

**Rule:** Two keys, two purposes. Never mix them.

| Key | Where | Purpose |
|-----|-------|---------|
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Frontend + server | Respects RLS. Safe to expose in browser. |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only API routes | Bypasses ALL RLS. Never import in client components. |

**Red flags in code review:**
- `SUPABASE_SERVICE_ROLE_KEY` in any file under `app/` that isn't an API route (`route.ts`)
- `createClient(url, serviceRoleKey)` in any file that could be bundled to the client
- `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY` — this env var name should never exist

## Webhook validation pattern

All webhook handlers must follow this pattern:

```typescript
import crypto from 'crypto'

function verifySignature(payload: string, signature: string, secret: string): boolean {
  const hmac = crypto.createHmac('sha256', secret)
  const digest = hmac.update(payload).digest('hex')
  return crypto.timingSafeEqual(Buffer.from(digest), Buffer.from(signature))
}

export async function POST(request: Request) {
  const secret = process.env.WEBHOOK_SECRET?.trim()
  if (!secret) return Response.json({ error: 'Not configured' }, { status: 503 })

  const signature = request.headers.get('x-signature')
  if (!signature) return Response.json({ error: 'Missing signature' }, { status: 400 })

  const payload = await request.text()
  if (!verifySignature(payload, signature, secret))
    return Response.json({ error: 'Invalid signature' }, { status: 400 })

  // Timestamp check — reject replays
  const body = JSON.parse(payload)
  const createdAt = body?.meta?.created_at
  if (createdAt) {
    const age = Date.now() - new Date(createdAt).getTime()
    if (age > 5 * 60_000 || age < -60_000)
      return Response.json({ error: 'Event too old' }, { status: 400 })
  }

  // Process event...

  // NEVER include PII in response body
  return Response.json({ success: true, event: body.meta.event_name })
}
```

**Checklist for new webhook endpoints:**
- [ ] HMAC signature validation with `timingSafeEqual`
- [ ] Timestamp validation (reject > 5 min old)
- [ ] Response body contains no PII (no email, no names)
- [ ] Idempotent processing (upsert with conflict key)
- [ ] Error responses don't leak internal state

## Health endpoints

**Rule:** Health endpoints return only status. No metadata.

```typescript
export async function GET() {
  return NextResponse.json({ status: 'ok' })
}
```

**Never include:**
- Git commit SHA / build ID
- Service name
- Environment variable presence/absence
- Timestamps
- Dependency versions

If you need detailed health for internal monitoring, put it behind an API key check on a separate `/api/health/internal` route.

## Rate limiting

All public-facing mutation endpoints (POST to subscribe, waitlist, contact, etc.) must be rate-limited.

Pattern used in this codebase (in-memory, per-instance):

```typescript
const _rl = new Map<string, { c: number; r: number }>()
function rateLimited(ip: string): boolean {
  const now = Date.now()
  const e = _rl.get(ip)
  if (!e || e.r <= now) { _rl.set(ip, { c: 1, r: now + 900_000 }); return false }
  return ++e.c > 5
}
```

Apply at the top of the handler:
```typescript
const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
if (rateLimited(ip)) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
```

**Limitations:** In-memory rate limiting resets on deploy and doesn't share state across instances. For multi-instance deployments, use Redis or Upstash rate limiting.

## Open redirect prevention

Any redirect target from user input must be validated:

```typescript
function safePath(raw: string | null): string {
  if (!raw) return '/dashboard'
  if (!raw.startsWith('/') || raw.startsWith('//') || raw.includes(':')) return '/dashboard'
  return raw
}
```

**Never** do `redirect(origin + userInput)` without validation.

## Security headers

All sites use `shared/config/security-headers.js` via `withSecurityHeaders()` in `next.config.js`.

Current headers:
- `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=(), interest-cohort=()`
- `X-XSS-Protection: 0` (modern browsers; CSP replaces this)
- `Content-Security-Policy` (baseline, tighten over time)

**When adding a new site:** Always wrap `next.config.js` with `withSecurityHeaders()`.

## Admin/internal endpoints

Any endpoint that modifies external service state (create products, manage subscriptions, etc.) must require authentication:

```typescript
function checkAdminKey(request: NextRequest): boolean {
  const key = process.env.ADMIN_API_KEY?.trim()
  if (!key) return false
  return request.headers.get('x-api-key') === key
}
```

## Robots.txt and sitemaps

**Never reference internal/origin URLs.** Always use the public domain.

- `robots.txt` sitemap URL: `https://yourdomain.com/sitemap.xml`
- `sitemap.ts` base URL: `https://yourdomain.com`
- Never: `https://project-name.onrender.com`
