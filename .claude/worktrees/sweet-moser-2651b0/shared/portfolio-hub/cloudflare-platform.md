# Cloudflare — portfolio usage

**Secrets:** Monorepo root `.env` only (gitignored). Never commit tokens.

## Tokens

| Variable | Typical prefix | Use |
|----------|----------------|-----|
| `CLOUDFLARE_API_TOKEN` | `cfut_` | User-style token — DNS/zones, registrar flows used by legacy scripts |
| `CLOUDFLARE_ACCOUNT_API_TOKEN` | `cfat_` | Account API token — account-level APIs: Workers, D1, `/accounts/{id}/…` |
| `CLOUDFLARE_ACCOUNT_ID` | UUID | Must match the Cloudflare account the **account** token acts on |

Keep **both** tokens if DNS automation uses `cfut_` and Workers/D1 deploy uses `cfat_`.

## Smoke checks (verify token without printing values)

```bash
# User token — global verify
curl -sS -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  https://api.cloudflare.com/client/v4/user/tokens/verify

# Account token — must use account path (not /user/)
curl -sS -H "Authorization: Bearer $CLOUDFLARE_ACCOUNT_API_TOKEN" \
  "https://api.cloudflare.com/client/v4/accounts/$CLOUDFLARE_ACCOUNT_ID/tokens/verify"
```

HTTP **401** on the wrong endpoint is expected (e.g. `cfat_` on `/user/tokens/verify`).

## Repo automation

- **`infrastructure/scripts/buy-domain.py`** — reads `CLOUDFLARE_API_TOKEN` + `CLOUDFLARE_ACCOUNT_ID` (adjust if you standardize on account token for API parity).

## Workers / D1 / Agent Analytics OSS

Portfolio brief with Wrangler outline and env names: [`companies/portfolio-hq/briefs/2026-05-07-agent-analytics-paperclip-plugin.md`](../../companies/portfolio-hq/briefs/2026-05-07-agent-analytics-paperclip-plugin.md).

Shared Cursor/Claude skill: [`shared/skills/agent-analytics/SKILL.md`](../skills/agent-analytics/SKILL.md).

## Docs

- [Cloudflare API](https://developers.cloudflare.com/api/)
- [Wrangler](https://developers.cloudflare.com/workers/wrangler/)
