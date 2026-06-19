# Security headers baseline for Next apps

Every public-facing Next.js site in this portfolio should advertise a minimal set of response headers before adding application-specific CSP rules or feature policies. The shared helper at `shared/config/security-headers.js` returns the `withSecurityHeaders` wrapper so that each `next.config.js` can opt in without copying the same array twice.

## Headers we enforce today

- `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload` — lock browsers onto HTTPS for future visits.
- `X-Content-Type-Options: nosniff` — stop MIME type sniffing, which can trick legacy browsers.
- `X-Frame-Options: DENY` — prevent clickjacking by disallowing the site from being framed.
- `Referrer-Policy: strict-origin-when-cross-origin` — keep cross-site referrers minimal while still allowing same-origin behavior.
- `Permissions-Policy: camera=(), microphone=(), geolocation=(), interest-cohort=()` — zero out risky features and disable FLoC/Topics.
- `X-XSS-Protection: 0` — disable an obsolete IE filter that can break modern CSPs (kept for compatibility).

The rule applies to `source: '/(.*)'`, which makes the headers show up on every route, API, and edge response produced by the Next runtime.

## How to use

1. Import the wrapper at the top of `next.config.js`:

   ```js
   const { withSecurityHeaders } = require('../../shared/config/security-headers')
   ```

2. Wrap whatever config object you already have:

   ```js
   const baseConfig = { /* existing settings */ }
   module.exports = withSecurityHeaders(baseConfig)
   ```

3. If you already return `headers()` from your config (e.g., to customize CSP per route), keep those rules untouched. The helper will call your original function and append the baseline entry afterwards.

4. Run `npm run lint` or `next build` inside the app to confirm the config still loads and then `curl -I http://localhost:3000` to spot-check the headers in dev.

## Customizing the baseline

- If a route needs to opt out (for example, to allow embedding), add a more targeted rule in your own `headers()` definition. Next merges apply order, so ensure your opt-out runs before the shared rule if you need to override a single header.
- The permissions policy and HSTS values above can be tweaked inside `shared/config/security-headers.js` once a new baseline is agreed upon.
- When you adopt a full CSP, keep it in its own `headers()` entry so the helper can keep doing its job. CSP usually needs knowledge of fonts, media/CDNs, and analytics partners, so scope those to each site rather than the shared file.

## Why this lives in `shared`

Security headers are an easy win with very little overhead, and pointing every Next site at a single list prevents drift. Once the helper is in place, any future Next build can follow steps 1‑4 without copy/pasting the header array again.
