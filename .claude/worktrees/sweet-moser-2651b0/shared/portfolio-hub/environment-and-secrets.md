# Environment & secrets — portfolio

## House rule

| Rule | Detail |
|------|--------|
| **Single source of truth** | **Monorepo root** `AgentCompanies/.env` — all companies, agents, and scripts read API keys and tokens from here (or deployment env that **mirrors** the same keys). |
| **Secure** | File is **gitignored**; values never committed; never paste secrets into chat or issues. |
| **Company folders** | Optional **local** `.env` for Next/dev-only overrides — **not** the place for authoritative secrets in tracked repos. Use `.env.example` with placeholders only. |

### Gmail API (OAuth 2.0) — same root `.env`

**OAuth client type:** **Desktop** (recommended for this repo script). You do **not** configure Authorized redirect URIs in Cloud Console for the loopback flow—the library binds `http://localhost:<port>/` automatically.

| Variable | Role |
|----------|------|
| `GMAIL_API_CLIENT_ID` | OAuth client ID (Desktop client in Google Cloud Console) |
| `GMAIL_API_CLIENT_SECRET` | OAuth client secret |
| `GMAIL_API_REFRESH_TOKEN` | Long-lived refresh token (from script after browser consent) |
| `GMAIL_OAUTH_LOCAL_PORT` | Optional; loopback port (default **3000**) |
| `GMAIL_API_REDIRECT_URI` | Optional legacy hint only—if set with a port (e.g. `http://localhost:3000/`), the script uses that port when `GMAIL_OAUTH_LOCAL_PORT` is unset |

**Refresh token (one-time OAuth in browser):** With client ID/secret in root `.env`, run from monorepo root:

```bash
python3 -m pip install google-auth-oauthlib google-auth-httplib2
python3 infrastructure/scripts/gmail_oauth_refresh_token.py
```

Enable **Gmail API** on the project and ensure your Google account is allowed (test user if the app is in testing). Paste the printed `GMAIL_API_REFRESH_TOKEN` into `.env`.

**Note:** This is **separate** from `COS_GMAIL_APP_PASSWORD` (SMTP). Use OAuth + refresh token for Gmail REST; use app password for simple SMTP send if you still need it.

### Routing — Gmail API vs Resend vs SMTP (house rule)

| Path | Use |
|------|-----|
| **Customer-facing transactional** (signup, receipts, product mail) | **Resend** (or ESP already wired per company) — do not send through personal Gmail API for bulk product mail. |
| **Portfolio / CoS / internal digests** | **SMTP** (`COS_GMAIL_APP_PASSWORD`) unless GM-002 decides to migrate to Gmail API send. |
| **Inbox automation** (labels, read threads, reply assist, partner inbox) | **Gmail API** — credentials in root `.env`; delegate per [Gmail delegation matrix](../../companies/portfolio-hq/delegations/2026-05-07-gmail-delegation-matrix.md). |

**Canonical secrets file:** monorepo root **`.env`** (gitignored).

Agents should **never** paste secret values into issues or chat.

## Key names in root `.env` (names only)

| Purpose | Variable names |
|---------|------------------|
| Cloudflare API | `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_API_TOKEN` (account-scoped `cfat_`), `CLOUDFLARE_ACCOUNT_ID` |
| Chief of Staff Gmail SMTP | `COS_GMAIL_ADDRESS`, `COS_GMAIL_APP_PASSWORD`, `COS_GMAIL_PASSWORD` |
| Other Gmail app-password pairs (per company lanes in docs) | `HYPERLOCAL_GMAIL_*`, `NT_GMAIL_*`, `TRADINGLIVE_GMAIL_*` |

Full cross-reference with platform spine: [`.cursor/rules/agent-companies-env-and-paperclip-import.mdc`](../../.cursor/rules/agent-companies-env-and-paperclip-import.mdc).

## Scripts that consume Cloudflare

- `infrastructure/scripts/buy-domain.py` — reads `CLOUDFLARE_API_TOKEN` + `CLOUDFLARE_ACCOUNT_ID`

## Gmail “API” vs app password

- **In this repo today:** automation docs emphasize **`COS_GMAIL_APP_PASSWORD`** (SMTP) for CoS digests and similar — **not** OAuth Gmail REST API by default.
- **Full Gmail API** (send/read via Google REST): requires Google Cloud project + OAuth client — keys indexed above when present.

## Rotation

If any secret appeared in chat or CI logs, rotate at the vendor and update `.env` locally only.
