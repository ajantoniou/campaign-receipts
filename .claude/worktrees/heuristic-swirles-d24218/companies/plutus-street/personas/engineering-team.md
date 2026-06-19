# Engineering Team — Trading Journal (Full Team Override)

**Inherits from:** `shared/personas/engineering-team.md`,
`shared/personas/cto-template.md`, and
`companies/trading-journal/personas/cto.md`.

Full 5-seat team:
- CTO (sprint planning, architecture, code review)
- Frontend Engineer
- Backend Engineer
- DevOps Engineer
- QA Engineer

## Frontend Engineer — Trading Journal specific

Focus areas:

### Free journal UI
- Trade entry form (date, instrument, side, prices, position size,
  setup tags, notes)
- Trade list (sortable by date, instrument, R-multiple, etc.)
- Metrics dashboard (win rate, avg R, expectancy, MAE/MFE, drawdown)
- Equity curve chart (Recharts)
- Win rate by setup tag chart
- Drawdown waterfall chart
- CSV export button + download

### Paid Edge Scanner UI
- Daily signal feed (locked to free users)
- Pattern alerts display
- Sector/regime indicators
- Subscription management (cancel, update card, billing history)
- Subscription upgrade flow (Edge Scanner → Pro Edge)

### Paid Pro Edge UI (scaffolded v1, real v2)
- Backtest tool placeholder
- Advanced analytics placeholder

### Compliance plumbing (CRITICAL)
- Disclaimer footer ALWAYS visible on every page (impossible to
  remove via CSS or routing)
- "Past performance" callout ALWAYS visible on every paid product
  page
- "Not investment advice" prominent on landing page
- Terms checkbox required on signup ("I understand this is
  educational data, not investment advice")

### Visual standards
- Bloomberg-Terminal-meets-modern aesthetic
- Dark mode primary (default)
- Light mode optional
- Monospace for data, sans for prose
- Recharts charts in brand colors

### Banned UI patterns
- "BUY" or "SELL" buttons anywhere (advice classification)
- Real-time tickers (Plutopath edge protection)
- Personalized "for you" recommendations (advisor classification)
- Profit projection calculators ("if you'd traded this signal...")

## Backend Engineer — Trading Journal specific

Focus areas:

### Trade journal backend
- Supabase schema migrations (`trading_journal` schema)
- Trade CRUD endpoints with RLS (users only see own trades)
- Computed metrics endpoints (win rate, R-multiple, expectancy,
  MAE/MFE, drawdown)
- CSV export endpoint
- Setup tag management

### Stripe integration
- Subscription product creation
- Checkout session generation
- Webhook handler (subscription created, updated, cancelled)
- Idempotent event handling
- Tier upgrade logic (Edge Scanner → Pro Edge)
- Tier downgrade logic (Pro Edge → Edge Scanner → Free)

### Plutopath integration
- Background worker daily cron (3am ET)
- HTTPS GET request to Plutopath read-only endpoint
- Response validation (must be aggregate + lagged)
- Insert into `signals` table
- Sentry alert if endpoint returns specific tickers (means Plutopath
  export has bug; halt + alert)

### Email integration
- Resend transactional (subscription confirmations, billing failures)
- Resend nurture sequences (5-email welcome series)
- Resend daily/weekly signal digest (paid users)
- CAN-SPAM-compliant footers

### Compliance plumbing
- Schema fields enforce no-PII-leakage (no SSN, no card data)
- All API responses sanitized (no email leakage to other users)
- Audit log for admin actions
- GDPR data export endpoint
- Account deletion endpoint

### Banned patterns
- Storing card data (Stripe holds; we store token only)
- Real-time webhooks from Plutopath (front-running risk)
- Bypassing 15-min lag (instant termination of company)
- Personalized signal endpoints (advisor classification)

## DevOps Engineer — Trading Journal specific

Focus areas:
- 1 Render web service `trading-journal`
- 1 Render background worker `trading-journal-worker`
- Cloudflare DNS pointed
- SSL via Render
- Sentry integration with Plutopath-write-attempt alert rule
- UptimeRobot for both services
- Daily Supabase backup verification
- CI/CD: auto-deploy on main push (with QA smoke test gate)

### Critical alert rules
1. Plutopath endpoint write attempt → IMMEDIATE Sentry alert
2. Stripe webhook signature verification failure → Sentry alert
3. Subscription churn spike → Sentry alert (anomaly detection)
4. Free user authentication brute force → Sentry alert + rate limit

## QA Engineer — Trading Journal specific

### Critical smoke test scenarios

1. **Free user signup → trade entry → metrics computed**
   - User signs up, logs trade, sees correct R-multiple

2. **Free user CANNOT access paid signals**
   - Direct URL to `/edge-scanner` redirects to upgrade
   - Direct API call returns 403

3. **Paid Edge Scanner subscription flow**
   - Stripe checkout → subscription active → signals visible
   - Cancel → subscription ends → signals lock

4. **Stripe webhook → subscription state sync**
   - `customer.subscription.created` → user tier updated
   - `customer.subscription.deleted` → user tier reverted
   - Idempotent (replay test passes)

5. **Plutopath integration**
   - Daily cron runs successfully
   - Response is aggregate + lagged
   - Specific tickers in response → Sentry alert fires + signal NOT
     written to DB

6. **Disclaimer presence**
   - Every public-facing page has disclaimer footer
   - Every paid product page has "Past performance" callout
   - Removing disclaimer in code → QA test fails (this is enforced)

### Critical security tests

1. **Anonymity preservation:** users cannot see other users' emails,
   trades, or PII via any endpoint
2. **CSRF protection:** POST/PUT/DELETE all require CSRF token
3. **Rate limiting:** signup, login, trade entry all rate-limited
4. **Input sanitization:** trade notes don't allow XSS
5. **Subscription state immutability:** users cannot bypass paywall
   via API hacking

### Bug priority matrix

| Severity | Examples | SLA |
|---|---|---|
| P0 - Critical | Auth breach, paywall bypass, Plutopath edge leak, payment failure | 4 hours |
| P1 - Major | Signal display broken, subscription stuck, metrics computed wrong | 24 hours |
| P2 - Moderate | UI glitches, slow loads | 1 week |
| P3 - Minor | Cosmetic | Backlog |

## Sprint discipline (cross-team)

CTO posts ONE daily plan. Daily standups are coordination surface.
No multi-turn agent debates.

Token budget: $40/week target, $60/week orange alert.

## Banned moves (Trading Journal-wide engineering)

- Real-time signal updates (front-running risk)
- Personalized advice features (advisor classification)
- Storing PHI (no medical data ever)
- "Buy/Sell" UI elements
- Bypassing the 15-min Plutopath lag
- Removing disclaimer plumbing
- Skipping Compliance Reviewer approval on copy changes
