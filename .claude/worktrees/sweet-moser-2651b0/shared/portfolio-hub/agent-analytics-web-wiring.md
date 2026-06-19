# Agent Analytics — wire every company website

**Upstream:** [Agent-Analytics/agent-analytics](https://github.com/Agent-Analytics/agent-analytics) (MIT). Tracker is `GET /tracker.js`; events go to your **self-hosted** Worker/Docker endpoint or **Agent Analytics Cloud**.

**Paperclip UI:** Plugin + per-company project binding stays per [`companies/portfolio-hq/briefs/2026-05-07-agent-analytics-paperclip-plugin.md`](../../companies/portfolio-hq/briefs/2026-05-07-agent-analytics-paperclip-plugin.md) (issues **POR-211**, **HEA-136**, **CON-162**, **CAR-57**, **NTM-131**, **VOT-86**).

This doc is **customer-facing sites**: Next.js / static pages across `companies/*/web`, `companies/concise-sealed`, etc.

---

## 0. One collector URL for the portfolio

Deploy **one** OSS endpoint (Cloudflare Worker + D1 recommended) or use **one** cloud project. Set server **`ALLOWED_ORIGINS`** (or upstream equivalent) to every **production origin** you serve (each domain / preview if needed).

---

## 1. Environment (public + secret split)

| Variable | Where | Purpose |
|----------|--------|---------|
| `NEXT_PUBLIC_AGENT_ANALYTICS_URL` | Render / Vercel / host env | Base URL of your AA server **no trailing slash**, e.g. `https://agent-analytics.xxx.workers.dev` |
| `NEXT_PUBLIC_AGENT_ANALYTICS_PROJECT` | Same | **Project slug** per site/product (`data-project`), e.g. `concise-sealed`, `healthbrew-www` |
| `NEXT_PUBLIC_AGENT_ANALYTICS_TOKEN` | Same | Public **project token** from AA (matches `data-token` — designed for browser; still rotate if leaked) |

**Server-side only (agents / CLI, not browser):** `AGENT_ANALYTICS_URL`, `AGENT_ANALYTICS_API_KEY` for [`@agent-analytics/cli`](https://www.npmjs.com/package/@agent-analytics/cli) and HTTP `X-API-Key` reads — keep in root `.env` / Render secrets, never `NEXT_PUBLIC_*`.

---

## 2. Snippet (HTML)

From [upstream README](https://github.com/Agent-Analytics/agent-analytics):

```html
<script defer src="https://YOUR-SERVER/tracker.js"
        data-project="YOUR_PROJECT_SLUG"
        data-token="YOUR_PROJECT_TOKEN"></script>
```

---

## 3. Next.js App Router (example)

Add to root `layout.tsx` (or a small `Analytics.tsx` client component if you need env injection):

```tsx
const base = process.env.NEXT_PUBLIC_AGENT_ANALYTICS_URL;
const project = process.env.NEXT_PUBLIC_AGENT_ANALYTICS_PROJECT;
const token = process.env.NEXT_PUBLIC_AGENT_ANALYTICS_TOKEN;

{base && project && token ? (
  <script
    defer
    src={`${base}/tracker.js`}
    data-project={project}
    data-token={token}
  />
) : null}
```

Use one **project slug per logical site** so Paperclip / CLI stats stay readable.

---

## 4. Rollout checklist (repeat per company)

1. Add env vars on that service’s Render (or host) dashboard.
2. Deploy; load a page; verify network **`POST /track`** (or batch) succeeds (200).
3. `curl "$AGENT_ANALYTICS_URL/health"` from CI or laptop.
4. Confirm project appears in **`GET /projects`** after first event.

---

## 5. Docs

- Tracker options: [Tracker.js reference](https://docs.agentanalytics.sh/reference/tracker-js/)
- CLI: set `AGENT_ANALYTICS_URL` + `AGENT_ANALYTICS_API_KEY` for self-hosted OSS
