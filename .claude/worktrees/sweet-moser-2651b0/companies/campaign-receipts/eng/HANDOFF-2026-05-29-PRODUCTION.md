# Campaign Receipts + Sealed 2016 — Production Handoff (2026-05-29)

## Completed

1. Newsletter capture system shipped and pushed (`origin/main`).
   - Shared `NewsletterCapture` component placed across homepage/weekly/pricing/politician/article/bill/footer.
   - `POST /api/newsletter-signup` and `GET /api/newsletter-signup/confirm` implemented.
   - Free subscribers are written to `cr_free_subscribers` (separate from paid subscribers).
   - Confirmation mail path implemented with confirm token links.

2. Sealed 2016 homepage pricing copy aligned and pushed.
   - Live offer language now centered on `$25 paperback`.
   - `$5 deleted-promises` positioned as stepping-stone messaging.
   - Commit: `2635520e4`.

3. YouTube pipeline enhancement shipped and pushed.
   - Added automated community-post draft generator:
     - `scripts/pipeline/generate-youtube-post.py`
   - Wired into pre-upload flow:
     - `scripts/pipeline/pre-upload-pack.py` now auto-generates `eng/youtube-posts/<slug>.md`.
   - Commit: `e8fd405c1`.

4. YouTube metadata cleanup/audit artifacts are present for operational use.
   - Channel audit doc: `eng/youtube-meta/channel-audit-2026-05-28.md`.
   - Includes the fixed title issue and link/disclosure backfill coverage details.

5. Archive + repo hygiene pass started.
   - Superseded root archive docs moved to:
     - `_archive/superseded-2026-05-29/`

## Pending (Production Priority)

1. Deploy latest `main` for both web properties.
   - `campaignreceipts.com`
   - `sealed2016.com`

2. Production newsletter E2E verification (single real signup).
   - Submit owned test email.
   - Confirm row in `cr_free_subscribers`.
   - Confirm email delivery.
   - Click link and verify `confirmed_at` update.

3. YouTube publish operations (current queue).
   - Continue upload/metadata flow for pending long-form + shorts per:
     - `eng/youtube-meta/studio-uploads-pending.json`
     - `eng/youtube-meta/studio-uploads-pending-shorts.json`
   - Keep canonical links in first lines of descriptions:
     - `campaignreceipts.com`
     - `sealed2016.com`
     - `campaignreceipts.com/weekly`

4. Viral researcher lane (new required pending item).
   - Add a dedicated YouTube viral researcher pass each cycle:
     - Find currently viral political scandal/donor-influence stories.
     - Rank by comment propensity and donor-receipt matchability.
     - Output next-topic slate with source links and recommended first video.

5. Cleanup pass 2 (non-blocking).
   - Review large untracked CR media/QC artifacts and keep only canonical source assets.
   - Ensure generated local artifacts remain ignored and do not pollute production commits.

## Repo Cleanup Rules Added

`.gitignore` now excludes local generated artifacts that should not be part of production planning/source control:

- `_build/`
- `_review/`
- `scripts/.upload-queue.log`
- `scripts/shorts/_build/`
- `public/shorts-upload-*/`
- `public/thumbnails-*/`
- `public/shorts/_normalize-backup/`
- `eng/qc-reports/**/frames/`

