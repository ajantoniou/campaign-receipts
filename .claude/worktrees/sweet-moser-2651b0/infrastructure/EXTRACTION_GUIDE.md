# Company Extraction Guide — When to Push a Company to GitHub

**Decision rule (founder, 2026-05-02; reconfirmed 2026-05-05):**

> "locally first then to git repo if it's successful/with traction.
> Only push specific agent companies to github. The parent
> AgentCompanies should stay local and .env should be in the parent
> folder. That's how I've done it with plutopath and it's secure."

The parent monorepo `AgentCompanies/` is **always local**. It is never
pushed to GitHub. `.env` lives at the parent root only and is gitignored.
A company stays inside the monorepo until it hits traction; then it gets
extracted into its own GitHub repo + Render auto-deploy.

**`.env` placement invariant (verify periodically):**

```bash
# Must exist at parent root:
test -f "/Applications/DrAntoniou Projects/AgentCompanies/.env"

# Must NOT exist inside any company working tree (prevents accidental extraction):
find "/Applications/DrAntoniou Projects/AgentCompanies/companies" -maxdepth 3 -name ".env" -print
```

This matches the architecture note already encoded in `.gitignore` (parent
monorepo local-only; per-company repos are extracted artifacts).

**Exception (2026-05-05):** `companies/portfolio-hq/` is special — it is
the Office of the Chief of Staff and gets its own GitHub repo (separate
from the parent monorepo). See "Portfolio HQ extraction" section below.

## Traction triggers (when to extract a company)

A company qualifies for extraction when ANY of these are true:

- **Revenue-fast company** (Concise, CarStack):
  First 10 paying customers OR $200/mo MRR
- **Slow-burn company** (NT Ministry, HealthBrew):
  First 5 paying customers OR $500/mo MRR
- **Founder explicit decision:** "I want this on GitHub now"
- **Portfolio HQ:** extracted whenever founder is ready (this is the
  governance repo, not a product company)

Until a company hits one of these triggers, it stays in the local
monorepo. No GitHub. No remote. Hibernating companies (`hyperlocal-matrix`,
`plutus-street`) never extract while hibernating.

## Pre-extraction checklist

Before extracting a company:

- [ ] Verify GITHUB_PAT is in `.env` and works:
  ```bash
  curl -H "Authorization: token $GITHUB_PAT" \
    https://api.github.com/user
  ```
- [ ] Decide repo name (e.g., `concise-direct-sales`,
  `healthbrew-app`)
- [ ] Decide repo visibility (private recommended initially)
- [ ] Confirm Stripe + other API keys for THIS company are
  documented in `.env` and ready to migrate to Render env vars

## Files that get extracted (per-company repo)

```
<company>/
├── vision.md
├── kickoff-brief.md
├── permissions-and-configurations.md
├── issues-backlog.md
├── week-1-plan.md
├── personas/
├── content/        (subset; drafts/ stay local)
├── brand/
├── pnl/
├── standups/       (last 30 days only; archive older)
├── plans/
├── deploys/
└── code/           (Next.js / backend / etc., once built)
```

## Files that DO NOT get extracted (stay in local monorepo)

- `CHIEF_OF_STAFF.md` (operational, founder-private)
- `PORTFOLIO_BRIEF.md` (cross-company strategy)
- `briefings/` (Chief of Staff outputs)
- `shared/personas/` (cross-company templates)
- `shared/docs/` (cross-company strategy docs)
- `infrastructure/SETUP.md` (founder-private setup steps)
- `infrastructure/EXTRACTION_GUIDE.md` (this file)
- `.env` (always — secrets)
- Other companies' folders

## Extraction process (when triggered)

### Step 1: Clone the company subfolder into its own repo

Use `git filter-repo` (NOT `git filter-branch` which is deprecated):

```bash
# Install git-filter-repo if not already
brew install git-filter-repo

# Clone the AgentCompanies monorepo to a working copy
cp -R "/Applications/DrAntoniou Projects/AgentCompanies" \
      "/tmp/extract-<company>"

cd "/tmp/extract-<company>"

# Filter to just the company folder, keeping its history
git filter-repo --path companies/<company>/ \
  --path-rename companies/<company>/:

# Now the working tree is just the company files, with their git
# history preserved
```

### Step 2: Create GitHub repo via PAT

```bash
GITHUB_PAT=$(grep "^GITHUB_PAT=" "/Applications/DrAntoniou Projects/AgentCompanies/.env" | cut -d'=' -f2-)

curl -X POST -H "Authorization: token $GITHUB_PAT" \
  -H "Content-Type: application/json" \
  https://api.github.com/user/repos \
  -d '{"name":"<company-name>","private":true,"description":"<one-liner>"}'
```

### Step 3: Push the extracted repo

```bash
cd "/tmp/extract-<company>"
# Prefer SSH (no PAT embedded in git remote URLs — avoids leak via `git remote -v`).
git remote add origin git@github.com:<USERNAME>/<company-name>.git
GIT_TERMINAL_PROMPT=0 git push -u origin main
```

If you must use HTTPS, use a credential helper / `GIT_ASKPASS` — do **not**
embed `GITHUB_PAT` directly in the remote URL.

### Step 4: Configure Render auto-deploy

In Render dashboard for the `<company>` web service:
1. Connect GitHub repo
2. Select branch: `main`
3. Auto-deploy on push: enabled
4. Build command + start command per the company's tech stack

### Step 5: Update local monorepo

The local monorepo continues to be the source of truth for
strategic docs (PORTFOLIO_BRIEF, briefings, shared). The extracted
company's local folder can either:

- **Stay as-is** (just gets stale; that's OK, GitHub is the new source
  for code)
- **Be replaced with a thin pointer** (a README.md saying "Extracted to
  https://github.com/<USERNAME>/<company-name>")

Founder decides per-company.

## Don't extract too early

Extracting a company before traction is premature optimization. Costs:

- 30-60 min of git surgery
- New attack surface (GitHub leak, Render misconfig, etc.)
- Cross-company coordination harder (Chief of Staff has to read GitHub
  PRs for that company instead of monorepo standups)
- Reverting is painful

Wait for actual signal. The traction triggers above are deliberately
high enough to justify the extraction work.

## Don't extract everything at once

When 2+ companies hit traction simultaneously, extract them sequentially
not in parallel:
1. Extract company A
2. Run for a week, confirm Render auto-deploy works, no surprises
3. Then extract company B

This preserves debugging clarity.

## What about shared persona templates?

When companies are extracted, they reference `../../shared/personas/`
which doesn't exist in the extracted repo. Two options:

**Option A: Duplicate at extraction time**
- Copy `shared/personas/*.md` into the extracted repo as
  `extracted-repo/shared-personas/*.md`
- Future updates to shared templates require manual sync

**Option B: Git submodule**
- Create a 7th repo `AgentCompanies-Shared` for the shared templates
- Each extracted company repo includes it as a git submodule
- Updates flow automatically when submodule is updated

Option A is simpler. Option B is cleaner for long-term. Decide at
extraction time per company.

## Portfolio HQ extraction (special case, added 2026-05-05)

`companies/portfolio-hq/` is the Office of the Chief of Staff, not a
product company. It is the governance/orchestration layer and gets
its own GitHub repo (`portfolio-hq` or similar) so that:

- The CoS persona and its reporting structure are version-controlled
  remotely (founder's safety net if the local laptop dies).
- McKinsey advisor, YC advisor, and Paperclip Feedback agent
  research outputs have a durable home.
- Cross-company governance briefs are auditable.

Portfolio HQ extraction differs from product-company extraction:

- No customer/MRR trigger — extract when founder is ready.
- No Render deploy (HQ has no public web service).
- Private GitHub repo recommended (governance is internal).
- Continues to live inside the local monorepo too. The local copy is
  the working tree the CoS reads/writes during heartbeats; the GitHub
  repo is a periodic mirror. (Decide push cadence per founder
  preference: every commit, daily, or after each portfolio briefing.)

Files extracted to the Portfolio HQ repo:

```
portfolio-hq/
├── vision.md                 (Office of CoS charter)
├── personas/                 (CoS, McKinsey, YC advisor, etc.)
├── research/                 (McKinsey memos, paperclip feedback)
├── legal/                    (LLC docs, contracts)
└── .paperclip/               (Paperclip-internal HQ artifacts)
```

Files that DO NOT get pushed to the Portfolio HQ repo (stay local):

- `briefings/` — daily CoS heartbeats (high-volume, low-signal-per-file)
- `BIBLE.md`, `CHIEF_OF_STAFF.md`, `PORTFOLIO_BRIEF.md` — these are
  parent-monorepo strategy docs, not HQ assets
- `.env` and any secrets
