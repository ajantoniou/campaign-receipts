# CR Premium Pipeline Scripts

Ported from `companies/nt-ministry/scripts/` on 2026-05-20. NT patterns adapted to CR's evidence-driven, politician-aware constraints.

## Scripts

| Script | Purpose | CR-specific changes |
|---|---|---|
| `fal-video-premium.py` | Sora 2 / Veo 3.1 / Kling 3 Pro text-to-video | HOUSE_STYLE_NEGATIVE rewritten for CR (no synthetic real-politician faces, no campaign-rally aesthetic, no cable-news chyron, no partisan palettes) |
| `fal-kling-i2v.py` | Image-to-video for animating Wikimedia photos of named politicians | Hardcoded james seed removed; `--image` is now required. Negative prompt rewritten. |
| `fal-stills-gen.py` | FLUX still B-roll (documents, capitols, archives) | Path anchors |
| `politician-caricature.py` | Book-style FLUX caricatures (Trump lane); manifest `public/brand/caricatures.manifest.json` | Used by `politician-caricature` / `caricature_slug` clips |
| `bake-music.py` | stable-audio per-cue music + mix under Betsy VO | Path anchors |
| `cut-shorts-v2.py` | Splice 9:16 shorts from long-form | Path anchors |
| `elevenlabs-tts.py` | Long/short VO + scribe-verify | Long + short = `jessica` (`CR_ELEVENLABS_SARAH_VOICE_ID`). Writers: `brand/voice-writing.md` |
| `youtube-upload.py` | Upload long-form + shorts to @CampaignReceiptsYoutube | `CR_YOUTUBE_*` env vars; `--playlist` or `CR_YOUTUBE_PLAYLIST_CR_NEW_NEWS`; default `--expect-voice jessica` |
| `ship-checklist.py` | **Pre-upload gate** — narration sync, overlay safe zone, Remotion clips, OCR | `--mode short\|longform`; writes `ship-checklist.json`; see `eng/SHORTS-SHIP-CHECKLIST.md` |
| `produce-video.py` | Long-form orchestrator (gates 1–9) | Gate 7 = ship checklist |
| `generate-youtube-post.py` | Generate YouTube Community draft post from `eng/youtube-meta/<slug>.json` | Writes `eng/youtube-posts/<slug>.md`; run by `pre-upload-pack.py` |

## Env-var contract

```
CR_FAL_API_KEY            # falls back to FAL_API_KEY / FAL_KEY
CR_ELEVENLABS_API_KEY     # falls back to ELEVENLABS_API_KEY
CR_ELEVENLABS_SARAH_VOICE_ID   # long-form Sarah → jessica (cgSgspJ2msm6clMCkdW9)
CR_ELEVENLABS_SHORTS_VOICE_ID  # optional; should match Sarah/jessica if set
CR_YOUTUBE_CLIENT_ID
CR_YOUTUBE_CLIENT_SECRET
CR_YOUTUBE_REFRESH_TOKEN  # CONFIRMED PRESENT 2026-05-20
```

## Vendor pick rule (cheat sheet)

- Named real politician → `fal-kling-i2v.py` seeded from Wikimedia photo. NEVER synthetic-face via text-to-video.
- Unnamed stylized character (silhouette, "a donor", "a senator") → `fal-video-premium.py --model sora2`
- Documents, archives, capitols, stamps → `fal-stills-gen.py` + Ken Burns OR `fal-video-premium.py --model sora2` (wan not exposed in premium dispatcher — use sora2 atmospheric for now)
- Cinematic hero (stamp landing, book closing) → `fal-video-premium.py --model kling3-pro`

## Status

- ✅ Scripts ported, AST-clean, env-vars resolve.
- ⏸  Storyboard producers (hook v6 producer, long-form v2 producer) — to be written in Stage 2 / 3.
- ⏸  `CR_ELEVENLABS_SARAH_VOICE_ID` — founder lock pending after A/B.
- ⏸  Wikimedia photo cache — see `scripts/fetch-wikipedia-photos.mjs` (exists, may need extension for the Iran-deal politician set).
