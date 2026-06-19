# SEALED Press — Render environment notes

## API: replacing env vars

Render’s **`PUT https://api.render.com/v1/services/{id}/env-vars` replaces the entire env-var set** for that service. Always **GET** existing variables, **merge** new keys, **PUT** the full desired JSON array, or edit in the dashboard — otherwise required keys can be dropped.

Render still injects **`PORT`** for Node web services even when it does not appear in the dashboard list.

## Health probe

- Path: **`GET /api/health`**
- Returns **`buildId`** when **`RENDER_GIT_COMMIT`** (Render) or **`VERCEL_GIT_COMMIT_SHA`** / **`NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA`** is set during build.

## Required for email capture

- **`SUPABASE_URL`**
- **`SUPABASE_SERVICE_ROLE_KEY`**

Schema: **`public.email_subscribers`** — see [`eng/SUPABASE-SUBSCRIBERS.md`](./SUPABASE-SUBSCRIBERS.md).

Optional Mailchimp sync (double opt-in): **`MAILCHIMP_*`** — see [`eng/MAILCHIMP.md`](./MAILCHIMP.md).

## Health + uptime probes

See [`eng/UPTIME.md`](./UPTIME.md).

## Render host

- Primary endpoint: `https://sealed-press.onrender.com` (used for share links, status checks, and Render health probes).

## Public site URL (share links + consistency)

- **`NEXT_PUBLIC_SITE_URL`** — canonical production origin (no trailing slash). Used by footer share intents; should match `metadataBase` in `app/layout.tsx` via `lib/site-url.ts`.
