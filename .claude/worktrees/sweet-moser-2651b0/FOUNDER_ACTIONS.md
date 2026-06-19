# Founder Action List

> Founder-only TODOs. Things that can't be delegated to a Claude session
> because they require human authority, payment-rail KYC, dashboard
> access, or strategic judgment the agent shouldn't make alone.

**Last refreshed:** 2026-05-21 (post Paperclip+CoS deprecation cleanup —
items kept are the ones still genuinely founder-blocked).

---

## Gate classes (what counts as founder-only)

| Gate class | Examples |
|------------|----------|
| Payments / merchant | Lemon Squeezy merchant verification, live mode, variant IDs; Stripe live keys + live Checkout products/prices (test-mode wiring stays Claude-owned). |
| Spend | Render paid tier bumps, domain purchases, paid ads — anything irreversible or recurring bill. |
| Launch approvals | Final sign-off on customer-facing launches (cover art, political copy, theological wedge, FTC health language). |
| Legal / regulatory | Attestations or filings where human exec authority is required. |
| Credentials | Issuing secrets to humans; rotating/scrubbing after leaks where dashboard or vault actions need the founder. |

---

## URGENT

(none currently tracked — refresh when work is actually blocked on you)

---

## DECISIONS pending founder

- **HEA-2 domain choice (HealthBrew):** `healthbrew.clinic` vs purchase path. Strategic — unlocks brand + outbound consistency.
- **Concise pseudonym strategy:** keep pseudonym throughout, hybrid (MD on MCAT only), or full reveal?
- **Trump book cover direction (Concise):** standard vs Palestine flag vs other — founder's political statement to own publicly.

---

## NICE TO DO

- **Domain candidates** — propose options per company as needed, purchase via Cloudflare when registrar token is in vault.
- **Gmail filter rules** — set up filters to label `antonioualfred+<company>@gmail.com` per company so brand alias mail is sorted.
- **Stripe Connect onboarding** — when revenue starts; Claude can prep materials, founder completes KYC.

---

## REFERENCES

- Platform URLs + key vault locations: [`shared/portfolio-hub/README.md`](shared/portfolio-hub/README.md)
- Hard rules + money caps: [`BIBLE.md`](BIBLE.md)
- Per-company strategy: [`PORTFOLIO_BRIEF.md`](PORTFOLIO_BRIEF.md)
