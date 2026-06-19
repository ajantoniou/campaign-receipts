# CR YouTube Shorts Pipeline

One 60-second YouTube Short per day, drawn from the 145 graded SEALED 2016
promises. Drives traffic to **sealed2016.com** (book sales).

Channel: **CampaignReceipts** (`UC4NINNbjaoy2PTKxbY5an-g`)

## Pieces

| File | Role |
|------|------|
| `generate-script.mjs` | Per-promise → 150-word VO + caption cues + title/description/tags. Verbatim corpus only. |
| `produce-short.mjs`   | ElevenLabs synth (Sarah) → Ken-Burns visual → burned captions → sidechain audio mix → ffprobe + RMS verification. |
| `upload-to-youtube.mjs` | OAuth + resumable upload via googleapis. `--dry-run` works end-to-end with no creds. |
| `run-daily.mjs` | Orchestrator: pops queue, generates, produces, copies to `public/shorts/`, uploads (dry-run by default). Persistent `_state.json`. |
| `_render_text.py` (none — removed) | The pipeline uses **rsvg-convert** to render SVG text → PNG and ffmpeg `overlay` to composite, because the homebrew default ffmpeg ships without `drawtext` (no libfreetype). |

## Voice (locked)

- **ElevenLabs Sarah** — `voice_id EXAVITQu4vr4xnSDxMaL`
- American female, mid-30s, slight Southern character
- Stability 0.5 / similarity 0.75 (defaults; override via `CR_SHORTS_STABILITY` / `CR_SHORTS_SIMILARITY` env)
- Why: female VO outperforms male on 60-sec political Shorts and differentiates from the SEALED hook trailer's male narrator.

## Editorial guardrails (load-bearing)

1. **Verbatim** quotes only from the corpus. No paraphrase. Cuts allowed; rewording is not.
2. **One** primary-source URL per script, named on screen.
3. **60-second hard cap** on rendered VO — pipeline FAILS if `vo.mp3 > 60s`.
4. **Burned-in captions** on every video (Shorts default-muted).
5. **Title format**: `{VERDICT}: {short promise} | SEALED`
6. **Description CTA**: utm-tagged sealed2016.com link.

## Day-to-day usage

```bash
# Dry run (no upload, no state advance)
node scripts/shorts/run-daily.mjs --dry-run

# Real publish (privacy: public | unlisted | private)
node scripts/shorts/run-daily.mjs --privacy unlisted

# Re-run a specific promise without advancing the queue (testing)
node scripts/shorts/run-daily.mjs --only drain-the-swamp-aipac-iran --dry-run
```

State lives in `_state.json` (queue + next_index + history). Build artifacts
live under `_build/<date>-<promise-id>/`. Re-running the same day reuses
`vo.mp3` and `master.mp4` (idempotent).

## Adding a promise to the queue

1. Add a verbatim-only entry to `PROMISES` in `generate-script.mjs`. Required:
   `verbatim_promise`, `verdict`, `receipt_lines` (each citable from manuscript),
   `primary_source` (url + name), `share_card` (1080×1920 PNG), `slug`,
   `episode_no`.
2. Append the new `promise_id` to `DEFAULT_QUEUE` in `run-daily.mjs` (or
   edit `_state.json.queue` directly).

## YouTube OAuth — founder one-time setup

The upload script needs YouTube Data API v3 credentials. Required env vars
in the **monorepo root** `.env`:

```
CR_YOUTUBE_CLIENT_ID=<from Google Cloud Console>
CR_YOUTUBE_CLIENT_SECRET=<from Google Cloud Console>
CR_YOUTUBE_REFRESH_TOKEN=<obtained from one-time --auth flow>
CR_YOUTUBE_CHANNEL_ID=UC4NINNbjaoy2PTKxbY5an-g
```

### Google Cloud Console steps

1. Go to https://console.cloud.google.com → create project "campaign-receipts-shorts" (or reuse existing CR project).
2. **APIs & Services → Library → YouTube Data API v3 → Enable.**
3. **APIs & Services → OAuth consent screen** — External, app name "CampaignReceipts Shorts Uploader", scopes: `youtube.upload` and `youtube`. Add yourself as a test user.
4. **APIs & Services → Credentials → Create credentials → OAuth client ID → Desktop app.** Download JSON or copy client_id + client_secret into `.env`.
5. Run the auth flow once:
   ```bash
   node scripts/shorts/upload-to-youtube.mjs --auth
   ```
   A local callback server opens; browser opens; sign in with the channel-owner Google account; consent; paste the code if prompted. Refresh token is written to `.youtube-token.json` (gitignored) and printed for `.env`.

Until OAuth is wired, **`run-daily.mjs` defaults to `--dry-run`** — the entire pipeline (script → MP4 → metadata.json) runs locally, prints the exact API payload, and exits without hitting Google.

## Asset dependencies

- `companies/concise-sealed/public/share-cards/v1/share-01-aipac-iran-deal.png` (1080×1920) — base image for episode 001. Each new promise needs its own share card under `share-cards/v1/`.
- `companies/concise-sealed/public/movie/_build_v4/music.mp3` (Incompetech "Impact Prelude", CC-BY) — background music, sidechain-ducked behind VO.

## Verification (enforced in pipeline)

- `ffprobe`: 1080×1920, ≤60s, video + audio tracks present
- RMS scan: voice/music differential ≥ 8 dB at every sampled speech window
- Outputs `verification.json` + `rms-report.json` to the build dir

## Cost

ElevenLabs Turbo v2.5 at ~$0.22 / 1k chars. A 100-word VO ≈ 600 chars ≈ **$0.13**.
Budget allocation: $5 covers ~30 generations + retries.
Logged per-piece to `.external-costs.jsonl`.
