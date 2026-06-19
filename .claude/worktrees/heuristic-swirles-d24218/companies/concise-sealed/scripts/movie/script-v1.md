# SEALED 60-Sec Movie Hook — v1 Script

Three-beat trailer. Total runtime: 60s ±2s. Format: 1920×1080 master, 9:16 auto-crop variant.

Persistent burned-in lower-third (all frames except final beat which has its own):
`Voice-over reads verbatim 2016 campaign quotes. Source page in description.`

All load-bearing text stays inside the center 56.25% column (1080px-wide safe zone in the 1920 master) so the 9:16 reel crop preserves it.

---

## Beat 1 — THE PROMISE (0:00 – 0:20)

| t       | Visual                                                  | On-screen text                                                                 |
|---------|---------------------------------------------------------|--------------------------------------------------------------------------------|
| 0:00–03 | Black → fade up parchment frame                          | "JUNE 16, 2015" (Lora serif, cream) / sub: "He came down the escalator." (mono, civic-red) |
| 0:03–08 | Ken-burns slow zoom on `ch1-swamp.jpg`                   | Caption: "I will drain the swamp."                                              |
| 0:08–14 | Ken-burns on `ch4-healthcare.jpg`                        | Caption: "Repeal and replace Obamacare."                                        |
| 0:14–20 | Ken-burns on `ch7-china.jpg`                             | Caption: "Bring back our jobs."                                                 |

## Beat 2 — THE RECEIPT (0:20 – 0:40)

| t       | Visual                                                  | On-screen text                                                                  |
|---------|---------------------------------------------------------|---------------------------------------------------------------------------------|
| 0:20–25 | 2×2 grid: `cover-2016/2020/2024/2026.jpg`                | Overlay: "2016. 2020. 2024. 2026."                                              |
| 0:25–32 | Parchment "ledger" frame                                 | Large: "He made 145 promises."  /  Sub: "We tracked every one."                 |
| 0:32–40 | Parchment scorecard frame                                | "46 KEPT" (civic-green) "51 PARTIAL" (amber) "40 BROKEN" (civic-red) "8 READER-DECIDES" |

## Beat 3 — THE ARCHIVE (0:40 – 1:00)

| t       | Visual                                                  | On-screen text                                                                  |
|---------|---------------------------------------------------------|---------------------------------------------------------------------------------|
| 0:40–46 | Ken-burns on `policy-trade-2024-screenshot.png`          | Caption: "Then in 2024 he ran again. We preserved those promises too."         |
| 0:46–50 | Ken-burns on `policy-economy-2024-screenshot.png`        | (continuation)                                                                  |
| 0:50–55 | Live `donaldjtrump.com` capture (donate-only shell)      | (silent reveal — about 1.5s of clean shell, then text zoom)                     |
| 0:55–58 | Text zoom over the donate shell                          | Large civic-red: "THEY DELETED THE PLATFORM."  /  Below: "WE KEPT IT."          |
| 0:58–60 | Parchment end-card                                       | Wordmark: "SEALED2016.COM"  /  Mono: "campaignreceipts.com/sources"  /  Sub: "The receipts they tried to disappear." |

---

## Visual rules

- No AI-generated celebrity likeness. All faces are from existing `cover-*.jpg` illustrations only.
- fal.ai is **NOT** used for any frame in v1. All typography is rendered via Puppeteer; all motion via ffmpeg `zoompan` + `xfade`.
- Lower-third disclosure burned in beats 1 + 2 only (Beat 3 end-card replaces it with attribution).
- Color tokens: cream `#F5EFE0`, navy `#0B2545`, civic-red `#8C1D18`, civic-green `#2F5D3A`, amber `#B8860B`.
- Type: Lora serif (headings/quotes), IBM Plex Mono (timestamps/captions).

## Asset manifest

Reuse only — no generation:
- `public/ch1-swamp.jpg`, `ch4-healthcare.jpg`, `ch7-china.jpg`
- `public/cover-2016.jpg`, `cover-2020.jpg`, `cover-2024.jpg`, `cover-2026.jpg`
- `companies/campaign-receipts/public/sources/policy-trade-2024-screenshot.png`, `policy-economy-2024-screenshot.png`

Captured at render time:
- `public/movie/_build/live-donaldjtrump.png` (Puppeteer headless screenshot)

Generated at render time (typography only, Puppeteer):
- `public/movie/_build/title-0615.png`
- `public/movie/_build/scoreboard.png`
- `public/movie/_build/deleted.png`
- `public/movie/_build/endcard.png`
- `public/movie/_build/lowerthird.png` (transparent PNG overlay)
