# CampaignReceipts — Subscription-Tier Roadmap

**Status:** Strategy spec / not implemented
**Trigger condition:** Do not build new paywall or paid-tier surfaces
until @CampaignReceiptsYoutube reaches 10,000 subscribers or the
founder explicitly overrides. The older business triggers below still
matter, but the 10k subscriber gate is now the first gate.

---

## The Strategic Position

Right now, CampaignReceipts is a free, ad-free, public-good directory. The free tier should always remain free. The monetization path runs through a *journalist & political-pro paid tier* on top of the free database — NOT through gating the free experience.

**Near-term lock (2026-05-27):** the public website and YouTube funnel
optimize for free newsletter capture, not paid conversion. Do not
promise paid features in public copy. Build audience, email list, and
repeatable receipt content first.

## The Product

**Working name:** *PromisesKept Pro* (or *CampaignReceipts Pro* — needs founder decision)

**Target customer:** Working journalists, opposition researchers, lobbyists, political-campaign staff, academic political scientists, congressional staff, advocacy organizations.

**Price point:** $399/month per seat, with team discounts at 5+ seats. Annual plan at $3,990 (saves 2 months). Free 14-day trial.

**Why $399:** anchored to existing political-data tools:
- Quorum: ~$1,500-3,000/mo/seat for legislative intelligence
- FiscalNote: ~$2,000+/mo/seat
- PoliticoPro: ~$500-1,000/mo/seat for news
- Bloomberg Government: ~$5,800/year ≈ $483/mo
- $399 lands at the entry point of professional political-data tools — affordable for individual researchers and small newsrooms, expensive enough to signal seriousness

## What Pro Subscribers Get

### Per-politician deep view
- **All 100+ promises** (vs. the free tier's curated 15-25)
- **Full case studies on every promise** (vs. featured-only on free)
- **Source URLs and dates inline** for every claim
- **Voting-record cross-reference** — every promise hyperlinked to the Congress.gov votes that adjudicated it
- **Promise evolution history** — how a politician's stated position changed across cycles

### Donor data deep view
- **Top 100 donors per cycle** (vs. top 10 on free)
- **Full industry breakdown** with sub-industry rollups
- **Donor-vote correlation** — "Sen. X voted with these donors' interests on Y% of issues"
- **Bundler / dark-money tracing** where data is available
- **PAC funding network maps** — see the web of connected committees

### Workflow tools
- **Saved searches and alerts** — get email/Slack when a tracked politician's verdict changes
- **CSV / JSON export** — pull data into spreadsheets, BI tools, research databases
- **API access** — rate-limited but generous (1,000 calls/day starting)
- **Bulk download** — full database snapshots for academic researchers
- **Citation generator** — APA/Chicago format citations for every claim, ready to paste into articles
- **Embed widgets** — newsrooms can embed live scorecards in their articles

### Comparison tools
- **Side-by-side politicians** — compare 2-4 politicians' promise records on the same screen
- **Cohort analysis** — "all senators who promised X" with their actual records
- **Trend tracking** — how a cohort's promise-keeping rate changed over time

### Audit trail access
- **The 3-pass review logs** — see the actual reviewer transcripts that produced each verdict
- **Methodology notes** — full reasoning chains, not just final verdicts
- **Dispute history** — who disputed what, what we changed in response

---

## What Stays Free (Forever)

1. The ranked homepage — full politician list, all current filters
2. Per-politician page with featured 4 + standard inventory (15-25 promises)
3. Color-coded verdicts
4. Methodology page
5. Dispute submission
6. Search functionality
7. The book promo (SEALED Press)

The free tier is the marketing engine + the public-good. Gating it would kill the moat.

---

## Revenue Math

### Pessimistic case
- 50 paying subscribers @ $399/mo = **$20K MRR / $240K ARR**
- Operating costs: ~$5K/year (hosting, FEC sync, etc.) + 1 part-time editorial
- Net: covers 1 FTE editorial position; sustainable but not transformative

### Base case
- 200 paying subscribers + 20 team plans (10 seats each) = ~$120K MRR / $1.4M ARR
- Supports 3-5 person team (editorial + engineering + sales)
- Enables Phase 3 state-legislator expansion

### Optimistic case
- 500 individual + 100 team plans (avg 5 seats) = ~$400K MRR / $4.8M ARR
- Enables licensing deals with major newsrooms, university libraries, congressional offices
- Justifies $399 → $499 price increase

---

## Why Journalists Will Pay

Existing tools (Quorum, FiscalNote) cost 4-10x more and don't have:
1. Promise-tracking framed as accountability journalism (their framing is policy intelligence)
2. Bipartisan-reviewed verdicts (their data is raw — no editorial layer)
3. The narrative case studies (they're databases; we're an archive)
4. The donor-promise correlation tools

The wedge is: **PoliticoPro tells journalists what's happening. Quorum tells them how to influence it. We tell them whether the politician actually kept their word — and who paid for the campaign that elected them.** That's a distinct value proposition that doesn't compete with existing political-data tools but complements them.

---

## What Has to Be True Before We Build This

In dependency order:

1. **Free directory has 100+ politicians** ← current session's batch will get us here
2. **FEC donor data integrated** for senators and major candidates ← FEC plan documented separately
3. **SEALED book sustaining the operation** ← TBD on book sales trajectory
4. **Free directory traffic ≥ 50K monthly visits** ← needs analytics first, then content + SEO compound
5. **Auto-upgrade-to-full-review threshold working** ← infrastructure shipped; needs traffic data
6. **At least 10 "always-on" full-review politicians** (the top-traffic 10% always get the deep treatment)

When all 6 are true AND the YouTube channel has reached 10,000
subscribers, build the Pro tier. Founder may override this gate, but
agents should not start paywall build work without that override.

---

## What I'd Recommend NOT Doing

- **Don't gate any current free functionality.** Even if Pro launches, today's free tier stays free.
- **Don't promise Pro features before building them.** The signup waitlist should describe Pro at a high level, not commit to specific feature dates.
- **Don't go ad-supported.** Ad networks are incompatible with the bipartisan editorial brand.
- **Don't license to political campaigns.** Selling our data to campaigns directly creates a brand-trust risk. Newsrooms, researchers, academic users, lobbyists are the audience. Political campaigns are NOT.
- **Don't ship the API first.** APIs are easy to build but hard to support. Ship the UI tools first; expose the API only when there's clear pull from existing subscribers.

---

## Mini-Roadmap (If/When We Build It)

**Month 1:**
- Pro waitlist landing page (free-tier brand consistent)
- Add Stripe Connect for billing
- Add Supabase auth (currently no user accounts at all)

**Month 2:**
- Build the Pro deep view per politician
- Build saved searches + email alerts
- Beta launch with 10 hand-picked customers at $99/mo (founders rate)

**Month 3:**
- CSV export, basic API
- Compare-politicians side-by-side
- Increase price to $199/mo for new signups; founders keep $99

**Month 6:**
- Donor-vote correlation tools
- Embed widgets
- Move to full $399/mo for new signups

**Month 12:**
- Team plans
- Newsroom integrations
- Academic licensing

---

## Phase 3 — Owned-media monetization (post-traffic)

**Trigger:** monthly unique visitors crosses ~50K. Until then, every
hour spent on production capacity is better spent on the data product.

**Plays, in order of expected ARR:**

### Phase 3a — CR Podcast
Weekly 30-min show built around the Receipt of the Week franchise +
one Active Race deep dive + one Donor → Vote breakdown. Format
deliberately short and bibliography-heavy — every claim citation-IDed
back to a CR receipt URL. Sponsors are policy-adjacent (CivicTech,
Brunswick Group, OpenSecrets-style nonprofit foundations), never
political committees.

Daily Wire reference is editorial, not business: they monetize
opinion. CR monetizes **receipts**. The differentiator IS the tagline.

Production stack: existing CR PNG card renderer powers all on-air
b-roll. No new tooling required beyond hosting (Spotify / Apple /
RSS via Transistor or similar).

### Phase 3b — YouTube long-form
Per-race deep-dive (~15 min) + per-Donor → Vote story (~12 min) +
quarterly "year of receipts" annual round-up (~25 min). Reuses CR's
existing data + card renders + the podcast voice. Monetization:
YouTube ads + sponsor slots + cross-promo of SEALED book + bundle.

YouTube is downstream of the podcast — recording the podcast on
camera with a slightly tighter edit gets us the YouTube version for
~20% extra production cost.

### Phase 3c — Pitch the show to a network
Once CR has ~6 months of podcast + YouTube traction, the show is a
sellable IP. Targets: ProPublica's audio arm, Wondery, Spotify
politics vertical. We retain the data product; the show is licensed.

This is the right exit shape for the *editorial* side of CR. The
*data* side stays sovereign — the data is the moat.

---

**Hard rule on all of Phase 3:** the editorial voice is the same one
the website carries. Receipts, not rhetoric. No partisan angling, no
outrage tier, no "did you SEE what they did?!" thumbnail style. The
panel was clear and the founder agrees: Bloomberg Terminal energy,
not Daily Wire energy.

---

## Phase 3 — pre-wired credentials (do not delete)

A YouTube channel and OAuth client were provisioned ahead of the
Phase 3 production push. They sit in the monorepo root `.env` so any
future cron/script that publishes to the CampaignReceipts YouTube
channel can read them without re-doing the OAuth flow.

Env vars in `/Applications/DrAntoniou Projects/AgentCompanies/.env`:

| Key | What it is |
|---|---|
| `CR_YOUTUBE_CHANNEL_ID`        | Numeric YouTube channel ID for the CampaignReceipts channel |
| `CR_YOUTUBE_CHANNEL_HANDLE`    | The `@handle` for the channel |
| `CR_YOUTUBE_OAUTH_CLIENT_ID`   | Google OAuth 2.0 client ID (`964042652225-...apps.googleusercontent.com`) |
| `CR_YOUTUBE_OAUTH_CLIENT_SECRET` | Google OAuth 2.0 client secret (`GOCSPX-...`) |
| `CR_YOUTUBE_REFRESH_TOKEN`     | Long-lived refresh token — re-mint if Google revokes (publishes happen via this token, not the client secret) |

Founder confirmed values 2026-05-20. Stored in the monorepo root
`.env` (gitignored), NOT committed to the repo. When Phase 3a/3b
production kicks off, the publishing script reads these via
`process.env.CR_YOUTUBE_*` and uses `googleapis` to upload via the
YouTube Data API v3.

**Do not commit these to the repo.** Do not log them in build output.
The refresh token in particular is sensitive — anyone with it can
publish to the channel.

If we add a YouTube publisher cron later, follow the env-group
pattern: put these in a Render env group called something like
`cr-youtube-publish-env` and link the group to that one cron, NOT
to the main `cr-daily-worker` (no need for daily snapshots to have
publishing credentials in scope).
