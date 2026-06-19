# YouTube Data API — Daily Upload Quota Workaround

**Locked:** 2026-05-23 · **Audience:** founder + future agent sessions

---

## The cap

Google's YouTube Data API enforces a **per-project "Video Uploads per day"** limit (separate from the generic 10K quota-units pool). Default is ~6 uploads/day per Google Cloud project. This is the single biggest bottleneck for batch uploads.

Symptom: `HTTP 429 — Quota exceeded for quota metric 'Video Uploads per day'` even when the regular quota pool is nowhere near exhausted.

---

## Option A — Spin up a 2nd GCP project (Recommended; durable)

Doubles your daily Video Uploads cap from ~6 to ~12. No TOS issues — you own both the project and the YouTube channel.

### One-time setup (~30 min)

1. **Create a new GCP project**
   - https://console.cloud.google.com/projectcreate
   - Name: `agent-companies-cr-youtube-2` (or similar)
   - Note the project ID; we'll need it.

2. **Enable the YouTube Data API v3**
   - https://console.cloud.google.com/apis/library/youtube.googleapis.com
   - Select the new project from the top bar → click "Enable"

3. **Configure OAuth consent screen**
   - https://console.cloud.google.com/apis/credentials/consent
   - User type: "External" (or "Internal" if you have a Google Workspace org)
   - App name: `Campaign Receipts Uploader 2`
   - Support email: `alex@antoniou.net`
   - Scopes — **add only**:
     - `https://www.googleapis.com/auth/youtube.upload`
     - `https://www.googleapis.com/auth/youtube.force-ssl` (for thumbnail + playlist + delete)
   - Test users: `alex@antoniou.net` + the Gmail address the @CampaignReceiptsYoutube channel is signed into

4. **Create OAuth 2.0 credentials**
   - https://console.cloud.google.com/apis/credentials
   - "Create Credentials" → "OAuth client ID" → Application type: **Desktop**
   - Download the JSON file. Move it to:
     ```
     /Applications/DrAntoniou Projects/AgentCompanies/companies/campaign-receipts/scripts/.youtube-oauth-project2.json
     ```
   - (Already in `.gitignore` if it follows the existing `.youtube-*.json` pattern; verify before committing anything else.)

5. **Add the new client_id + client_secret to repo-root `.env`**
   ```
   CR_YOUTUBE_OAUTH_PROJECT2_CLIENT_ID=...
   CR_YOUTUBE_OAUTH_PROJECT2_CLIENT_SECRET=...
   ```

6. **First-run auth**
   ```bash
   cd companies/campaign-receipts
   python3 scripts/pipeline/youtube-upload.py --auth --project 2
   ```
   (Requires a tiny patch to `youtube-upload.py` — see "Pipeline integration" below; works without the patch if you manually swap `.youtube-token.json` between the two projects.)

### Pipeline integration

`youtube-upload.py` currently reads `scripts/.youtube-token.json` (single token). To support two projects cleanly:

- Add `--project N` flag (default 1) → reads `scripts/.youtube-token-projectN.json`
- Add `CR_YOUTUBE_OAUTH_PROJECTN_*` env-var lookup
- Round-robin or explicit `--project` selection in the upload scripts

**Simpler interim**: keep both tokens around, manually swap by symlink:
```bash
ln -sf .youtube-token-project1.json scripts/.youtube-token.json    # default
ln -sf .youtube-token-project2.json scripts/.youtube-token.json    # use project 2 today
```

### Capacity math after Option A

- Day 1: Project 1 (~6 uploads) + Project 2 (~6 uploads) = ~12/day
- Phase 1 LFs (3) + Phase 2 shorts (5) = **fits in one day** with room to spare

---

## Option B — Request a quota increase from Google (Free, slow, uncertain)

- https://support.google.com/youtube/contact/yt_api_form
- "Increase quota" → fill out the API project ID, daily quota you need, and a business justification (legitimate media/journalism use case).
- Approval window: days to weeks. Not all requests granted.
- Asks for a public privacy policy URL — point to `sealed2016.com/privacy` (build if not yet up).
- Worth submitting in parallel with Option A as a long-term improvement.

---

## Option C — Schedule across days (No infra change, slowest)

Already implemented in `scripts/pipeline/sealed-upload-phased.sh`:
- `--phase 1` → LFs only (3 uploads, fits in one night)
- `--phase 2` → shorts batch only (5 uploads, fits the following night)

Best when the founder wants to **deliberately separate** the LF launch from the shorts cohort drop (per 2026-05-23 strategy: let LFs accumulate views/subs before shorts amplify).

---

## Cost of doing nothing

Continuing to share one project's 6-uploads/day cap means:
- Can't ship a full 3 LF + 5 shorts batch in one day → forces multi-night sequencing
- Any unplanned re-upload (`--replace-id` after a chart fix, packaging swap, etc.) competes against scheduled batch capacity
- Tight coupling between SEALED and CR new-news pushes — a CR Massie/Bush night burns SEALED's budget for the next day

---

## Recommendation

1. Tonight / this week: **Option C** (phased) — already wired
2. Within next 7 days: **Option A** (2nd GCP project) — durable 2× capacity
3. Submit Option B (quota request) for free 4× capacity over time
