# Security Findings

**Audit date:** 2026-05-12
**Status key:** FIXED = remediated in this audit | OPEN = not yet addressed | ACCEPTED = known, risk accepted

---

## CRITICAL

### F-01: Health endpoints leak operational intelligence (FIXED)

**Sites:** All three
**Before:** `/api/health` returned git commit SHA, internal service name (`serviceledger-site`, `sealed-press`, `campaign-receipts-directory`), and boolean inventory of every configured env var (including confirmation that `SUPABASE_SERVICE_ROLE_KEY` exists).
**Impact:** Attacker can pin exact deployed code revision, enumerate service architecture, and confirm which secrets exist (narrowing attack surface for targeted leaks).
**Fix:** Health endpoints now return only `{"status":"ok"}` or `{"status":"degraded"}`.

### F-02: robots.txt leaks Render origin URL (FIXED)

**Site:** sealed2016.com
**Before:** `Sitemap: https://sealed-press.onrender.com/sitemap.xml` — reveals hosting provider, project name, and direct origin bypass URL.
**Impact:** Attacker bypasses any CDN/WAF by hitting origin directly; can probe for endpoints without CDN logging.
**Fix:** Changed to `https://sealed2016.com/sitemap.xml`. Sitemap.ts base URL also fixed.

### F-03: Sitemap.ts hardcodes Render origin (FIXED)

**Site:** sealed2016.com
**Before:** `const base = 'https://sealed-press.onrender.com'`
**Fix:** Changed to `https://sealed2016.com`.

---

## HIGH

### F-04: No security headers on campaignreceipts.com (FIXED)

**Site:** campaignreceipts.com
**Before:** `next.config.js` did not use `withSecurityHeaders()` — missing HSTS, X-Frame-Options, CSP, X-Content-Type-Options.
**Impact:** XSS exploitation easier; clickjacking possible; no transport security enforcement.
**Fix:** Wrapped config with `withSecurityHeaders()`.

### F-05: No Content-Security-Policy anywhere (FIXED)

**Sites:** All three
**Before:** Shared security headers included HSTS, X-Frame-Options, etc. but no CSP.
**Impact:** No defense-in-depth against XSS.
**Fix:** Added baseline CSP to `shared/config/security-headers.js`. Initially permissive (`unsafe-inline`, `unsafe-eval`) to avoid breaking existing functionality. Should be tightened after testing.

### F-06: LemonSqueezy products endpoint unauthenticated (FIXED)

**Site:** sealed2016.com
**Before:** `GET/POST /api/lemon-squeezy/products` — no auth. GET leaks product catalog with variant IDs. POST creates products on LemonSqueezy.
**Impact:** Attacker can enumerate products, create unauthorized products, and harvest variant IDs for webhook forgery.
**Fix:** Both methods now require `X-API-Key` header matching `ADMIN_API_KEY` env var.

### F-07: Open redirect in auth callback (FIXED)

**Site:** estimateproof.com
**Before:** `/auth/callback?next=https://evil.com` redirects to attacker-controlled URL after login.
**Impact:** Phishing — attacker crafts magic link that redirects victim to fake dashboard after authentication.
**Fix:** `next` parameter validated: must start with `/`, no `//`, no protocol. Also fixed: was using `createBrowserClient` on server side (incorrect, couldn't access cookies).

### F-08: No rate limiting on subscribe/waitlist endpoints (FIXED)

**Sites:** All three
**Before:** No CAPTCHA, no rate limiting. `/api/subscribe` on estimateproof triggers expensive AI report generation + email send per request.
**Impact:** Email bombing, resource exhaustion, cost abuse (each subscribe call costs ~$0.10 in AI + email).
**Fix:** In-memory IP-based rate limiter: 5 requests per IP per 15 minutes on all subscribe/waitlist endpoints.

---

## MEDIUM

### F-09: No webhook replay protection (FIXED)

**Sites:** estimateproof.com, sealed2016.com
**Before:** Webhook signature validation was solid, but no timestamp validation. Captured webhook payloads could be replayed indefinitely.
**Impact:** Limited by idempotent upserts (estimateproof uses `onConflict: 'ls_subscription_id'`), but still allows re-triggering side effects like email sends.
**Fix:** Both webhook handlers now reject events with `meta.created_at` older than 5 minutes or in the future.

### F-10: Webhook response leaks subscriber PII (FIXED)

**Site:** sealed2016.com
**Before:** Webhook response body included `email`, `tags`, `testMode` — visible in LemonSqueezy logs and any network proxy.
**Fix:** Response body reduced to `{ success: true, event: eventName }`.

### F-11: No CAPTCHA on any form (OPEN)

**Sites:** All three
**Before/current:** Contact forms, subscribe forms, and waitlist forms have no CAPTCHA.
**Impact:** Bot spam possible even with rate limiting (distributed IPs bypass per-IP limits).
**Recommendation:** Add hCaptcha or Turnstile to public forms. Priority: estimateproof subscribe (triggers AI cost).

### F-12: Direct origin access not blocked (OPEN)

**Site:** sealed2016.com
**Before/current:** `sealed-press.onrender.com` responds identically to `sealed2016.com`. Robots.txt fix removes the easy discovery, but the origin is still accessible if guessed.
**Recommendation:** Configure Render to check `Host` header or add a shared secret header between CDN and origin.

---

## LOW

### F-13: Missing `published` gate on politician profiles (OPEN)

**Site:** campaignreceipts.com
**Current:** All politician slugs are publicly accessible. Draft profiles can be viewed by guessing slugs.
**Recommendation:** Add a `published` boolean column and filter in queries.

### F-14: CSP needs tightening (OPEN)

**Sites:** All three
**Current:** CSP includes `unsafe-inline` and `unsafe-eval` to avoid breaking existing functionality.
**Recommendation:** After testing, remove `unsafe-eval` and migrate inline scripts to nonce-based CSP.

### F-15: Vitals endpoint writes to filesystem without limit (OPEN)

**Site:** sealed2016.com
**Current:** `POST /api/vitals` appends to `runtime/vitals/vitals.jsonl` without size limit or rate limit.
**Impact:** Disk exhaustion on long-running containers.
**Recommendation:** Add rate limiting and file rotation/size cap.
