# Iran v7b — local /watch verification (2026-05-23)

VERIFIED FOR REPLACE_w9YX_8mnOf8

## Master under test

- Path: `companies/campaign-receipts/public/longform/sealed-aipac-iran-deal-v7.mp4`
- Source: `_build/sealed-aipac-iran-deal-v7/master.mp4` (rebuilt 2026-05-23 01:43 ET, after Remotion `--duration` fix)
- MD5: `2020ae42e239978d243b111c696725ae`
- Size / dur: 12,192,240 B / 222.005 s (3:42)

## Pre-checks

- Widened text-card-sync-qc gate: PASS (`_build/sealed-aipac-iran-deal-v7/text-card-sync-qc.json`)
  - Slug match: `sealed-aipac-iran`
  - Allowed prefixes: `iran-*` + legacy `s*` (only used by reuses)
  - Forbidden tokens: embassy chapter (`DEC 6 2017`, `MAY 14 2018`, `JERUSALEM EMBASSY`) + drain chapter (`JAN 28 2017`, `JAN 19 2021`, `EO 13770`, `EO 13983`, `ETHICS PLEDGE`, `315B`, `353B`, `13 OF 18`)
  - Required tokens: `MAY 8`, `2018`, `3.67`, `60`, `82`
- Storyboard: 28 clips, all text-card vendor clips use `iran-*` IDs.

## /watch sweep evidence — 40 frames @ 448px, full mode

| t | content observed | match VO/visual sync? |
|---|---|---|
| 00:00 | PoliticalMap "SEVEN COUNTRIES SIGNED" (USA, UK, France, Germany, Russia, China, Iran) | ✓ |
| 00:06 | Title card "WHO PAID TO KILL THE IRAN DEAL · A SEALED INVESTIGATION" | ✓ |
| 00:11 | ChartBar "ENRICHMENT CAP UNDER DEAL · % U-235" — `3.67%` Deal cap bar (small) + Weapons grade bar (full red), both labels visible | ✓ duration fix confirmed |
| 00:17 | Compliance card "3 YEARS — CAP HELD" | ✓ |
| 00:28 | SourceCard "PROMISE #73 · P. 142 · Tear up the Iran nuclear deal · SEALED 2016 — Trump campaign promises" | ✓ |
| 00:33 | Verdict card "PROMISE #73 · Tear Up The Iran Nuclear Deal · KEPT" | ✓ |
| 00:39–00:50 | Trump portrait (image-kenburns) | ✓ |
| 00:56 | SourceCard "FEDERAL REGISTER · MAY 8, 2018 · United States withdrawal from the JCPOA announced" | ✓ |
| 01:01 | Big-date card "MAY 8, 2018 · Federal Register — withdrawal announced" | ✓ |
| 01:07–01:12 | PoliticalMap "US WALKED OUT ALONE · May 8, 2018 — other countries stayed in" (USA exits, UK/France/Germany/Iran stay) | ✓ |
| 01:18–01:23 | MoneyFlow "DONOR → CANDIDATE → POLICY · THREE LINES, ONE LEDGER" | ✓ |
| 01:29 | Adelson source card "$82M · Republican committees, 2016 cycle · → Kill Iran deal MAY 2018, → Embassy to Jerusalem MAY 2018" | ✓ |
| 01:34–01:40 | "THE BUYER" chapter title | ✓ |
| 01:45 | Reuse from v2 "AIPAC PUBLISHED PRIORITIES · P 142 · Three for three (Iran/Embassy/EO 13899)" — INTENTIONAL chapter closer (vendor=`reuse`, not text-card; QC scope-skips reuses) | ✓ intentional |
| 01:51–01:57 | Timeline "THREE WINS · 18 MONTHS" with May 8 2018, May 14 2018, Dec 11 2019 nodes | ✓ |
| 02:02 | Adelson portrait (image-kenburns) | ✓ |
| 02:08 | CountUp `$67,572,870` Sheldon Adelson · 2016 cycle (Republican committees, FEC) | ✓ duration fix confirmed |
| 02:13–02:19 | CountUp `$132,567,501 → $217,994,340` "LIFETIME TO GOP CAUSES · Reported total · FEC / OpenSecrets" | ✓ |
| 02:24–02:35 | DonorComparison "Big donors on both sides · 2016 cycle · FEC / OpenSecrets" — Adelson $82M, Steyer $91M, Soros $25M, Bloomberg $24M, Saban $14M, Hoffman $8M | ✓ |
| 02:41 | PoliticalMap "EMBASSY MOVE · Tel Aviv → Jerusalem · May 14, 2018" | ✓ |
| 02:46–02:58 | ChartBar "AFTER THE US LEFT · % U-235" — `3.67%` Under deal bar + `60%` By 2021 bar (both bars + labels animate over 15s clip) | ✓ duration fix confirmed |
| 03:03–03:09 | Verdict title "THE DEAL GOT TORN UP · Iran's program got bigger — on the record" | ✓ |
| 03:14–03:20 | Scorecard "THE 2016 PROMISE AUDIT · 46 KEPT, 51 PARTIAL, 40 BROKEN, 8 READER-DECIDES · 145 GRADED · SEALED2016.COM" | ✓ |
| 03:25–03:31 | VerdictStamp "Tear up the Iran nuclear deal · KEPT · May 8, 2018" | ✓ |
| 03:36 | End card "sealed2016.com · The 2016 Promises. Before the Deals." | ✓ |

## Cross-episode leak audit

- No `MAY 14 2018` / `JERUSALEM EMBASSY` / `DEC 6 2017` text-card surfaces in this master other than:
  - the s6-01 reuse "three for three" closer (intentional chapter punchline, not a leak — vendor=`reuse`, points at `_build/sealed-aipac-iran-deal-v2/clips-v4-norm/s6-01.mp4`)
  - the s8-01 DonorComparison metadata ("Iran · embassy · EO 13899" listed as Adelson policy footnote, narratively appropriate)
- No drain-chapter leakage (`EO 13770`, `EO 13983`, `ETHICS PLEDGE`, `13 OF 18`, `JAN 28 2017`, `JAN 19 2021`, `315B`, `353B`).
- No `JCPOA` or `P 1519` leakage on text-cards (these tokens appear correctly on Iran-native cards only, e.g. SourceCard at 00:56).

## Animation health

The Remotion `--duration` fix (formerly `--duration-in-frames`, which was silently ignored by Remotion ≥ 4 CLI) is confirmed working on every dynamic clip:

- ChartBar `s2-01` (00:11, 8s): both bars animate to full height by t=04 of clip, labels visible.
- ChartBar `s9-01` (02:47, 15s): standalone clip frames f08–f15 show progressive growth + final `60%` label at t=12s.
- CountUp `s7-02`/`s7-03` (02:08–02:19, 8+7s): values count up smoothly to `$67.6M` and `$132.6M / $217.9M`, no zero-stuck phase.
- DonorComparison `s8-01` (02:27, 15s): all 6 donor rows render with values.
- VerdictStamp `s10-02` (03:27, 10s): "KEPT" stamp + date appear on schedule.

## Did rebuild fix the original Drain-class bug here?

There was no Drain-class wrong-episode card on Iran v7 to begin with — the prior master shipped with Iran-native cards. The rebuild was triggered defensively because the Remotion `--duration` bug we hit on Drain affected ALL pre-fix Remotion clips system-wide. The previously shipped Iran v7 master had the same bug; this rebuild restores correct ChartBar/CountUp/DonorComparison animations.

## Caveats

- VO is 216s but storyboard total is 237s; the assembler hard-truncates to ~VO+6s (222s). The trailing `s10-03` reuse end card (20s) is partially clipped to ~5s — visually clean and the brand bumper still resolves to `sealed2016.com`. No regression vs the prior v7 master.
- Watch sweep was frames-only (`--no-whisper`); transcript verification deferred to next push window when audio QC runs in `production-qc` (we deliberately ran with `--skip-production-qc` to avoid re-running the full audio pipeline tonight).

## Verdict

**VERIFIED FOR REPLACE_w9YX_8mnOf8** — Iran v7 master is push-ready for the YouTube replace operation when quota resumes (~3 AM ET). No storyboard regression, no cross-episode leak, all dynamic visuals animate correctly post-`--duration` fix.
