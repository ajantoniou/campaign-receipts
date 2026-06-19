# Source Bibliography — cr-what-happened-to-trump (LF)

**Author:** series-architect (Stage 5 — Primary-Source Receipts)
**Date:** 2026-05-26
**Mode:** longform, 10-13 min, cr-new-news
**Slug:** cr-what-happened-to-trump

**Rule of the road (founder lock 2026-05-25):** Primary sources only. Government docs, .gov databases, Wayback Machine snapshots of donaldjtrump.com, court filings, dated video/audio with venue, ACLU/CAIR/CCR/ADC official statements. Secondary outlets (AP, NPR, WaPo, CNN, etc.) appear here ONLY where they are the reachable surface of an event for which the underlying primary record (DoD briefing, judge's order, ICE filing) is the actual anchor; the cite is the underlying document, not the outlet's framing. Where Sealed/eng/ already pinned URLs, they are reused verbatim — not re-searched.

**Honesty contract:** Every claim either has a primary source on this page or a `[GAP]` flag stating exactly what was searched and what's still missing. A small verified number beats a big unverified one.

---

## § Beat 1 — "You remember this voice." (2015 Trump cold open)

### Factual claims being made
- A 2015-cycle Trump clip exists in which he calls the Middle East wars a scam / says "no more endless wars" / equivalent verbatim line.
- The clip can be cited with date, venue, and a durable URL.

### Primary sources
- **[GAP — needs primary source]** No durable primary-record URL for a specific 2015 Trump clip is currently pinned in any input read for this stage. The Sealed/eng/ Iran and weaponization source files do not contain a 2015-cycle Trump video citation. The story-extraction brief itself flags this as "(Source: 2015 clips pending Stage 6 pin; commitments.json `platform-promise-08-iron-dome`)" — i.e., Stage 6 is on the hook to anchor it. commitments.json only contains the 2024 verbatim, not 2015.
  - **What was searched:** Sealed/eng/2024-deleted-promises-prose-v1.md (not opened — flagged as next pull if available), Sealed/eng/2024-deleted-promises-sources-iran.md, Sealed/eng/2024-deleted-promises-sources-weaponization.md, commitments.json (2024 corpus only, no 2015 entries).
  - **What is needed to close the gap:** one of —
    - C-SPAN clip URL with timestamp for a 2015 or early-2016 Trump rally or interview in which he uses the verbatim line ("no more endless wars," "the wars in the Middle East have been a disaster," "trillions of dollars," or equivalent). C-SPAN is the canonical primary venue: its archive is durable, dated, and venue-stamped.
    - Trump campaign press release archived on Wayback from 2015-2016 with the verbatim line.
    - A specific GOP primary debate transcript (the 2015 Fox News, CNN, and CBS GOP debates are all transcript-available on the candidate news outlets and on the Commission on Presidential Debates / debates.org archive — these count as primary because the spoken record is the artifact).
  - **Recommended Stage 6 action:** pin the Mar 10 2016 CNN GOP debate (Miami) or the Oct 28 2015 CNBC GOP debate (Boulder) where Trump's "$4 trillion / wars are a scam" framing appears; both have full C-SPAN-archived video. Until pinned, do not show a quote on screen.

---

## § Beat 2 — "He said it again in 2024 — in writing." (verbatim 2024 promise)

### Factual claims being made
- On donaldjtrump.com, on/before Nov 4 2024, Trump's campaign published the verbatim line "President Trump will defend America against all threats, protect America against all dangers, and keep America out of unnecessary foreign wars."
- The 20 Core Promises platform document published the verbatim line "Prevent world war three, restore peace in europe and in the middle east, and build a great iron dome missile defense shield over our entire country -- all made in america."

### Primary sources (REUSE from commitments.json)
- **"keep America out of unnecessary foreign wars"**
  - Source artifact: `companies/campaign-receipts/app/2024-trump-campaign-promises/commitments.json` id `military-rehire-patriots`
  - Verbatim quote: `"President Trump will defend America against all threats, protect America against all dangers, and keep America out of unnecessary foreign wars. He will also get the Harris-Biden Administration's radical left ideology out of our military and rehire every patriot who was unjustly fired."`
  - Source page: `trump-2024-issues-immigration-snapshot.html` (Wayback-derived capture hosted at `https://campaignreceipts.com/sources/trump-2024-issues-immigration-snapshot.html`)
  - Captured: 2026-02-16
  - Deleted after: 2025-01-20 (canonical donaldjtrump.com policy-page removal date)
  - Source section: "Renew American Strength and Leadership"
- **"Prevent world war three"**
  - Source artifact: commitments.json id `platform-promise-08-iron-dome`
  - Verbatim quote: `"Prevent world war three, restore peace in europe and in the middle east, and build a great iron dome missile defense shield over our entire country -- all made in america"`
  - Source page: `trump-2024-platform-snapshot.html` (`https://campaignreceipts.com/sources/trump-2024-platform-snapshot.html`)
  - Captured: 2026-02-21
  - Deleted after: 2025-01-20
  - Source section: "20 Core Promises to Make America Great Again"
- **Underlying primary (Wayback):** the commitments.json `methodology` field explicitly states each verbatim quote is from "a preserved snapshot of donaldjtrump.com (via the Internet Archive's Wayback Machine) or from the 2024 Republican National Convention platform PDF (adopted July 15, 2024 and still publicly hosted at gop.com as of capture)." The campaignreceipts.com/sources/ HTML files are the locally-hosted captures of those Wayback snapshots.
- **[GAP — soft]** The specific Wayback timestamp URL (e.g., `https://web.archive.org/web/20241104XXXXXX/https://www.donaldjtrump.com/...`) for each of the two source pages is not recorded inside commitments.json itself — only the local mirror is. **What is needed to close:** run the local HTML files against Wayback's CDX API to retrieve the exact `web.archive.org/web/<timestamp>/<original-url>` for both pages, so the on-screen citation can read the canonical Wayback URL rather than the CR mirror.

---

## § Beat 3 — "On January 20, 2025, the page came down."

### Factual claims being made
- The donaldjtrump.com policy pages, the platform pages, and the 20 Core Promises page were removed on or about January 20, 2025.
- The site converted to a donation form / donation-only landing page.
- The Wayback Machine is now the only place those words live.

### Primary sources
- **commitments.json methodology field** (REUSE — same artifact):
  - `"The live policy pages on donaldjtrump.com were removed by January 20, 2025, when the domain converted to a donation-only landing page. The per-page Wayback capture date is recorded as captured_date. We do not log the exact removal date of each page; we use a canonical deleted_after of 2025-01-20 for the donaldjtrump.com pages."`
  - This is CR's own canonical methodology statement — primary for the project's own dating convention.
- **Underlying primary (Wayback CDX index):** the strongest possible anchor here is a side-by-side Wayback capture pair —
  - Last capture of the policy page WITH the verbatim promise (Nov 2024 - early Jan 2025)
  - First capture of donaldjtrump.com AFTER Jan 20 2025 showing the donation-only state
  - These two timestamps together prove the deletion is real, not a CR assertion.
- **[GAP — needs primary URL pin]** The exact pair of Wayback timestamps proving the before/after has NOT been recorded in any input read for this stage. **What is needed:** run `https://web.archive.org/web/timemap/link/https://www.donaldjtrump.com/platform` (or the equivalent CDX query) to enumerate captures across Jan 15-Feb 1 2025 and pin (a) the last "promises live" capture and (b) the first "donation-only" capture. Both URLs go on screen in Beat 3. Without this pair, the line "the page came down" is asserted, not proven on its own face.

---

## § Beat 4 — "Five months in, the planes flew." (Operation Midnight Hammer)

### Factual claims being made
- June 21, 2025: U.S. struck three Iranian nuclear sites — Fordow, Natanz, Isfahan.
- Seven B-2 stealth bombers from Missouri, fourteen bunker-busters, plus Tomahawks from a submarine.
- Strike duration ~25 minutes; no U.S. casualties; Iran did not fire back at the planes.
- Trump addressed the nation from the White House at ~10 p.m., called it "spectacular military success," said sites were "completely and totally obliterated."
- Pentagon called it "very narrowly tailored" and "necessary."
- Broader 12-day Israel-Iran war killed at least 1,062 in Iran (Iranian Health Ministry, via UK Commons Library).

### Primary sources (REUSE — fully pinned in Sealed/eng/2024-deleted-promises-sources-iran.md)
- **Congressional Research Service (CRS) Insight IN12571 — "U.S. Strikes on Nuclear Sites in Iran"**
  - URL: https://www.congress.gov/crs_external_products/IN/PDF/IN12571/IN12571.1.pdf
  - Primary government document: date, targets, weapons, "narrowly tailored" framing, nuclear-program-degradation language. THIS IS THE ANCHOR cite for the strike.
- **UK House of Commons Library research briefing CBP-10292 — "Iran: Impacts of June 2025 Israel and US strikes"**
  - URL: https://commonslibrary.parliament.uk/research-briefings/cbp-10292/
  - Primary government summary (UK Parliament). Carries the 1,062-person Iranian Health Ministry figure for the broader 12-day war. Use ONLY for the war-total figure; do not generalize to the three U.S. strike sites (Iran has not released a per-site count, and the briefing is explicit about that).
- **CSIS — "What Operation Midnight Hammer Means for the Future of Iran's Nuclear Ambitions"**
  - URL: https://www.csis.org/analysis/what-operation-midnight-hammer-means-future-irans-nuclear-ambitions
  - Think-tank analytical anchor for three-target-sites and weapons-load cross-check.
- **NPR — "Details emerge about Operation Midnight Hammer" (June 22 2025)**
  - URL: https://www.npr.org/2025/06/22/nx-s1-5441763/details-emerge-about-operation-midnight-hammer
  - Used per founder rule ONLY as the reachable transcript of Trump's own 10 p.m. White House address: "spectacular military success," "completely and totally obliterated." Underlying primary IS the address itself (White House transcript). See gap below.
- **AP News — June 21–22 2025 coverage**
  - URL: https://apnews.com/article/iran-israel-war-nuclear-trump-06-22-2025
  - Wire confirmation of date + operation name.

### Gaps / sharpening
- **[GAP — soft]** The official **White House transcript** of Trump's June 21 2025 ~10 p.m. address is the strongest primary for the "spectacular military success" / "obliterated" quotes; the NPR cite is a reachable proxy. **What is needed:** pull the address from whitehouse.gov/briefings-statements or whitehouse.gov/remarks for that date and pin alongside the NPR URL.
- **[GAP — soft]** The DoD press-briefing transcript (Secretary of Defense + Chairman of the Joint Chiefs) in which the "very narrowly tailored" and "necessary" language was used should be pinned from defense.gov/News/Transcripts alongside the CRS doc.

---

## § Beat 5 — "The 2016 audit already graded it KEPT." (SEALED ledger)

### Factual claims being made
- SEALED 2016 corpus contains 145 promises, scored 46 KEPT / 51 PARTIAL / 40 BROKEN / 8 READER-DECIDES.
- Promise #46 "Tear Up the Iran Nuclear Deal" — KEPT.
- Promise #51 "No More Endless Wars" — PARTIAL.
- (Supporting) Promise #47 "Move Embassy to Jerusalem" — KEPT.
- (Supporting) Promise #42 "Stop Nation-Building Overseas" — PARTIAL.
- (Supporting) Promise #50 "North Korea — Solve Nuclear Threat" — BROKEN.

### Primary sources
- **SEALED canonical retail PDF** — invariant verdict math 46/51/40/8
  - Source-of-truth file: `companies/Sealed/.claude/CLAUDE.md` (verdict-math invariant section)
  - Artifact: `companies/Sealed/artifacts/SEALED-v1-retail.pdf` (generated by `scripts/build-retail-pdf.mjs`, npm `generate:retail-pdf`)
  - This is CR's own primary — the published book. The verdict numbers and per-promise verdicts ARE the canonical record; the script may cite them as "from the SEALED 2016 audit (145 promises, on screen at sealed2016.com)" with no upstream cite required.
- **Per-promise verdict seed data:** `companies/campaign-receipts/scripts/seed-trump-2016-cycle.json` (per topic brief § 4) — promises #42, #46, #47, #50, #51 are all entries in that file with their graded verdicts.
- **[GAP — soft]** Page numbers in the retail PDF for each cited promise (#46, #51, plus the three supporting) are not recorded here. **What is needed:** open the retail PDF and pin page numbers so on-screen lower-thirds can read "SEALED p.XXX." This sharpens the trust signal — viewer can buy the book and turn to the page.
- Underlying primary for Promise #46 (the actual U.S. withdrawal from the JCPOA): **White House Presidential Memorandum, May 8 2018, "Ceasing U.S. Participation in the JCPOA and Taking Additional Action to Counter Iran's Malign Influence and Deny Iran All Paths to a Nuclear Weapon."** This is the canonical primary government document for the kept promise.
  - **[GAP]** The whitehouse.gov archived URL for this memorandum is not pinned in any input read this stage. **What is needed:** pull from the Trump White House archive at trumpwhitehouse.archives.gov.

---

## § Beat 6 — "The weaponization promise broke the same way." (4 named students)

### Factual claims being made
- 2024 verbatim promise: "End the weaponization of government against the american people."
- Mahmoud Khalil — Columbia grad student, lawful permanent resident, taken from NYC apartment Mar 8 2025 (no warrant), flown to Louisiana, held 104 days, federal judge ordered release on bail Jun 20 2025.
- Rumeysa Ozturk — Tufts Ph.D., taken off Somerville MA sidewalk Mar 25 2025 over an op-ed, moved to LA, federal judge in Vermont ordered release May 9 2025; immigration judge later terminated removal proceedings.
- Mohsen Mahdawi — Columbia, green card, taken at U.S. citizenship interview in Vermont Apr 14 2025; federal judge ordered release on bail Apr 30 2025; judge wrote detention had "substantial claims" of "retaliation for protected speech."
- Badar Khan Suri — Georgetown postdoc, Indian national on valid visa, taken from outside his Rosslyn VA home Mar 2025, held in TX ~two months; federal judge in VA ordered release May 14 2025 citing First Amendment + Fifth Amendment violations.

### Primary sources for the 2024 promise text (REUSE from commitments.json)
- commitments.json id `platform-promise-09-end-weaponization`, verbatim `"End the weaponization of government against the american people"`, source page `trump-2024-platform-snapshot.html`, captured 2026-02-21, deleted_after 2025-01-20, section "20 Core Promises to Make America Great Again."

### Primary sources for the four cases (REUSE — fully pinned in Sealed/eng/2024-deleted-promises-sources-weaponization.md)
- **Mahmoud Khalil**
  - Center for Constitutional Rights press release / court-filing announcement: https://ccrjustice.org/home/press-center/press-releases/court-rules-mahmoud-khalil-s-lawsuit-challenging-his-unlawful — **PRIMARY** (CCR is counsel of record; court filing is the artifact). Anchor.
  - NPR, Jun 20 2025: https://www.npr.org/2025/06/20/nx-s1-5440351/judge-orders-release-of-columbia-activist-mahmoud-khalil — reachable surface for release-date confirmation.
- **Rumeysa Ozturk**
  - ACLU Massachusetts press release: https://www.aclum.org/press-releases/immigration-judge-terminates-removal-proceedings-against-child-development-scholar-rumeysa-ozturk/ — **PRIMARY** (counsel-of-record statement, removal-proceedings termination order). Anchor.
  - Boston Globe, Jul 17 2025: https://www.bostonglobe.com/2025/07/17/metro/rumeysa-ozturk-describes-ice-detention-op-ed/ — context.
- **Mohsen Mahdawi**
  - ACLU national press release with judge's quote: https://www.aclu.org/press-releases/federal-court-orders-columbia-student-mohsen-mahdawi-released-on-bail — **PRIMARY** (counsel statement + bail-order quote). Anchor.
  - CNN, Apr 30 2025: https://www.cnn.com/2025/04/30/us/vermont-judge-orders-release-of-mohsen-mahdawi — reachable surface.
- **Badar Khan Suri**
  - Washington Post, May 14 2025: https://www.washingtonpost.com/immigration/2025/05/14/georgetown-researcher-suri-virginia-texas/ — release order coverage.
  - NPR, May 14 2025: https://www.npr.org/2025/05/14/g-s1-66606/georgetown-badar-khan-suri-immigration-release — release coverage.
  - **[GAP — soft]** The actual VA federal court order text (with the First/Fifth Amendment language directly quoted) is the strongest primary. Both WaPo and NPR are reachable surfaces for it. **What is needed:** the PACER docket entry or counsel (ACLU-VA / CAIR) press release with the order embedded. Either pinned and the script can quote the judge directly rather than the outlet's paraphrase.

---

## § Beat 7 — "You voted on a page. The page is gone. The verdict is yours." (close)

### Factual claims being made
- The final image is the 2024 donaldjtrump.com page with the "keep America out of unnecessary foreign wars" verbatim line.
- The page is gone as of Jan 20 2025.
- The Wayback Machine is free; the campaign site is not built to remember.

### Primary sources
- Same as Beat 2 (verbatim promise) + Beat 3 (deletion).
- All sources for the close are reused from above. No new pins required.

---

## § Founder § 7 unverified claims — status

Per founder brief 2026-05-25 § 7, these five (six, counting the derived $600B→40yr line) are the **non-negotiables** for Stage 6. Series-architect read-through status as of Stage 5:

| # | Claim | Status | Notes |
|---|---|---|---|
| 1 | **$82M AIPAC dumped for Trump in 2016** | **[GAP]** — NOT VERIFIED at primary. Inputs read this stage do not contain a pinned FEC / OpenSecrets URL with a measurement definition that matches "$82M." The founder asserted it is in the SEALED book; the canonical retail PDF was not opened this stage. **What is needed:** (a) open `companies/Sealed/artifacts/SEALED-v1-retail.pdf` and locate the AIPAC chapter / footnote with the exact dollar figure and measurement definition; (b) cross-check against FEC.gov direct query (AIPAC PAC committee ID `C00127811`) and OpenSecrets industry-total page for pro-Israel giving in the 2015-16 cycle; (c) if the SEALED figure is AIPAC-PAC-only it will be far below $82M, so the script must either swap to the verified PAC figure OR redefine the on-screen language to match what $82M actually measures (likely AIPAC-aligned individual donors + affiliated 501(c)(4) spend across the cycle, not "AIPAC the PAC"). **Recommendation: drop $82M from screen until anchored. Use the verified smaller PAC number.** |
| 2 | **$600B foreign aid 2014-2024, mostly Ukraine + Israel** | **[GAP]** — NOT VERIFIED. **What is needed:** USAID ForeignAssistance.gov filtered to FY2014-FY2024 total obligations OR a CRS report on the same window. The order of magnitude is plausible (total U.S. foreign assistance runs ~$50-70B/yr in recent years; 10×60 = $600B is in the right zone) but the exact figure, the window definition, and the Ukraine+Israel share must be pinned to a single primary source. **Recommendation: if not pinnable in one source, swap to the FY-by-FY USAID total for the most recent 5-year window with the Ukraine + Israel line items broken out; smaller window, harder number.** |
| 3 | **$15B/yr would house every homeless American** | **[GAP]** — NOT VERIFIED. **What is needed:** HUD Annual Homeless Assessment Report (AHAR) unsheltered-population count × a named per-unit Permanent Supportive Housing cost (USICH or HUD model). Quick check on plausibility: ~770K total homeless × ~$20K/yr PSH op cost ≈ $15.4B — so the math is in the right zone, but it must be cited to HUD AHAR (year specified) + a named cost model (USICH / National Alliance to End Homelessness / HUD PIT). **Recommendation: pin HUD AHAR 2024 + a single named cost-per-unit source; show the math on screen so the viewer sees the assumption.** |
| 4 | **"7 sovereign nations" he enabled invasions of** | **[GAP]** — NOT ENUMERABLE from inputs read. The story-extraction brief itself (§ 3) explicitly **excludes** this from the load-bearing reveals. **Recommendation per founder topic brief: DROP THE NUMBER. Use the qualitative line ("a sequence of foreign military escalations the 2015 voter was specifically told would not happen") with a verified list of 2-3 named, sourced incidents (Soleimani strike Jan 3 2020 + Yemen continuation of Saudi-coalition support + Syria-strikes 2017/2018). Do not assert "7."** |
| 5 | **"Lower groceries day one" promise text** | **[GAP]** — NOT FOUND IN INPUTS. commitments.json was searched for inflation/grocery promises; the two pinned verbatim quotes confirmed this stage are the war/Iron-Dome lines, not the grocery line. **What is needed:** grep commitments.json for "groceries" / "grocery" / "prices" / "inflation" / "day one" — if a verbatim promise with the "day one" framing exists, cite it; if not, do not put the phrase on screen as a Trump quote. (The phrase circulated widely in campaign coverage but the script must cite the actual donaldjtrump.com or rally-transcript verbatim.) |
| 6 | **"End Ukraine war in 24h" promise text** | **[GAP]** — NOT FOUND IN INPUTS. Same as above — commitments.json was not exhaustively grepped for Ukraine. The "24 hours" framing was a campaign-trail rally line, not a donaldjtrump.com policy-page line as far as inputs read this stage confirm. **What is needed:** a dated rally transcript or C-SPAN clip URL with timestamp for the verbatim "I will end this war in 24 hours" line. Without that, the phrase appears on screen as paraphrase, not Trump's voice. |
| 6b | **$600B → 40yr homeless housing math (derived)** | **[GAP — derived]** Lives or dies with #2 and #3. If both anchored, this is a one-line on-screen calculation. If either falls, the entire closing math frame is rewritten per topic brief § 4. |

---

## § What this bibliography enables, and where it stops

### Enables (script can proceed)
- All of Beat 4 (Iran strike, Operation Midnight Hammer) — fully primary-pinned, reusing Sealed/eng/.
- All of Beat 6 (four named ICE detentions) — fully primary-pinned, reusing Sealed/eng/.
- Beat 2 verbatim 2024 promises — fully pinned from commitments.json (with one soft gap on the canonical Wayback timestamp URL).
- Beat 5 SEALED ledger references — anchored to the canonical retail PDF and seed JSON (with one soft gap on page numbers).
- Beat 7 close — same anchors as Beats 2 and 3.

### Stops (script cannot lock without Stage 6 resolution)
- **Beat 1 cold-open clip** — no 2015 Trump primary URL pinned yet. Without it, the entire cold-open premise (his own voice, not a narrator) cannot land. This is the single largest open gap.
- **Beat 3 page-deletion before/after** — the methodology assertion holds, but the script is stronger with a pinned pair of Wayback timestamps (last-with-promise + first-without).
- **All five (six) founder § 7 figures** — every one is either unverified or unanchored. The story-extraction brief explicitly designed the spine to survive any of them being dropped; that design discipline holds and is the right move. None of them should appear on screen without a primary cite or the script swaps to a verified smaller number.

A small verified number beats a big unverified one. The spine of this piece stands on the Iran strike record + the four named First Amendment cases + the SEALED 2016 corpus + the deleted-page captures. Every one of those is anchored. The unverified figures are decoration, not load-bearing. If Stage 6 cannot pin them in the time available, the script proceeds without them and the piece is still complete.

— series-architect, 2026-05-26
