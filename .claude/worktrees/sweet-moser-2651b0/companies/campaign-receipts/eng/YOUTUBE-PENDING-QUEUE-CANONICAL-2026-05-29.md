# YouTube Pending Queue Canonical Tracker (2026-05-29)

Purpose: one source-of-truth queue that marks each pending item as either:
- `on-youtube` (already publicly live; only replacement/metadata follow-up remains), or
- `not-on-youtube` (not yet live; upload required).

## Long-form Queue

| slug | current_state | current_live_id | pending_file | action |
|---|---|---:|---|---|
| `sealed-aipac-embassy-v1` | `on-youtube` | `SSuO2KOXr0Y` | `eng/youtube-meta/studio-uploads-pending.json` | Keep as replacement candidate only if a newer master exists and is approved. |
| `sealed-drain-the-swamp-v1` | `on-youtube` | `mnt2Svi9ntI` | `eng/youtube-meta/studio-uploads-pending.json` | Keep as replacement candidate only if a newer master exists and is approved. |
| `sealed-aipac-iran-deal-v7` | `on-youtube` | `w9YX_8mnOf8` | `eng/youtube-meta/studio-uploads-pending.json` | Keep as replacement candidate only if a newer master exists and is approved. |

## Shorts Queue

| slug | current_state | current_live_id | pending_file | action |
|---|---|---:|---|---|
| `sealed-002-aipac-embassy` | `on-youtube` | `rT3G1VSV46g` | `eng/youtube-meta/studio-uploads-pending-shorts.json` | Remove from pending upload list; treat as published. |
| `sealed-003-aipac-campus` | `on-youtube` | `CNmFoUgK4ls` | `eng/youtube-meta/studio-uploads-pending-shorts.json` | Remove from pending upload list; treat as published. |
| `sealed-004-drain-the-swamp` | `on-youtube` | `C7lQWPUz1mA` | `eng/youtube-meta/studio-uploads-pending-shorts.json` | Remove from pending upload list; treat as published. |
| `sealed-005-china-tariffs` | `on-youtube` | `cO1Xvv6Q8Uk` | `eng/youtube-meta/studio-uploads-pending-shorts.json` | Remove from pending upload list; treat as published. |
| `sealed-007-repeal-obamacare` | `on-youtube` | `o1hCqWh1Mxc` | `eng/youtube-meta/studio-uploads-pending-shorts.json` | Remove from pending upload list; treat as published. |
| `sealed-008-tax-returns` | `on-youtube` | `Ujc-mVy_Xvo` | `eng/youtube-meta/studio-uploads-pending-shorts.json` | Remove from pending upload list; treat as published. |
| `sealed-009-term-limits` | `on-youtube` | `55GIMuAmGsM` | `eng/youtube-meta/studio-uploads-pending-shorts.json` | Remove from pending upload list; treat as published. |
| `sealed-010-un-climate-paris` | `on-youtube` | `Fh8AqMkwrbg` | `eng/youtube-meta/studio-uploads-pending-shorts.json` | Remove from pending upload list; treat as published. |
| `sealed-011-self-funding` | `on-youtube` | `pk4ohXWHmx0` | `eng/youtube-meta/studio-uploads-pending-shorts.json` | Remove from pending upload list; treat as published. |
| `sealed-012-lock-her-up` | `on-youtube` | `tWDuu13k8Iw` | `eng/youtube-meta/studio-uploads-pending-shorts.json` | Remove from pending upload list; treat as published. |
| `sealed-013-coal` | `on-youtube` | `ZWVoSVvpro4` | `eng/youtube-meta/studio-uploads-pending-shorts.json` | Remove from pending upload list; treat as published. |
| `sealed-014-nk-nukes` | `on-youtube` | `mQNleERflSU` | `eng/youtube-meta/studio-uploads-pending-shorts.json` | Remove from pending upload list; treat as published. |
| `sealed-015-scotus-roe` | `on-youtube` | `MPBhXUEYCS4` | `eng/youtube-meta/studio-uploads-pending-shorts.json` | Remove from pending upload list; treat as published. |
| `sealed-016-deportation-shortfall` | `on-youtube` | `jvHFneIz48k` | `eng/youtube-meta/studio-uploads-pending-shorts.json` | Remove from pending upload list; treat as published. |
| `sealed-017-birthright` | `on-youtube` | `Lrh_sYXGC4Q` | `eng/youtube-meta/studio-uploads-pending-shorts.json` | Remove from pending upload list; treat as published. |

## Immediate Normalization Actions

1. `studio-uploads-pending-shorts.json`: clear entries (all currently on YouTube).
2. `studio-uploads-pending.json`: keep only if there is a newer approved replacement master; otherwise clear.
3. Keep this file as canonical queue status before every upload day.

## Source of status

- `eng/PUBLISHED-YOUTUBE.md` live table (current published IDs).
- `eng/youtube-meta/studio-uploads-pending.json`
- `eng/youtube-meta/studio-uploads-pending-shorts.json`
