#!/usr/bin/env python3
"""
backfill-video-companion-articles.py

One-shot backfill: inserts the 3 existing CR long-form companion
articles into cr_articles as kind='video_companion'.

Pre-req: migration 006_video_companion_articles.sql applied.

Usage:
  SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \\
    python3 scripts/backfill-video-companion-articles.py [--dry-run]

The script is idempotent: it upserts on slug.
"""
from __future__ import annotations

import json
import os
import sys
import urllib.request
import urllib.error
from datetime import datetime, timezone

DRY = "--dry-run" in sys.argv

# ── Article payloads ───────────────────────────────────────────

BUSH = {
    "slug": "cr-bell-bush-aipac-primary",
    "kind": "video_companion",
    "youtube_id": "QP6rXu_bFDk",
    "title": "$8 Million Beat Cori Bush — By Just 5 Points",
    "dek": "AIPAC's super-PAC spent about $8.5 million to push Cori Bush out of her seat. She still came within 5 points of winning.",
    "body_md": """## What happened

On August 6, 2024, Cori Bush lost her primary in Missouri's 1st district. The winner was Wesley Bell, a county prosecutor. He got about 51 percent. She got about 46 percent.

The money behind that loss did not come from Bell's own campaign. It came from a super-PAC called United Democracy Project. That PAC is paid for by AIPAC, the big Israel lobby group in Washington.

## The receipt

United Democracy Project spent close to $8.5 million on TV ads, mail, and digital ads against Cori Bush. That is ad money the candidate never touches. The Federal Election Commission (FEC) lists every dollar of it on the committee page for `C00761668`.

For one House primary in St. Louis, that is a giant number. AIPAC has now used the same PAC, with the same playbook, against other progressives who voted against more weapons for Israel.

## Why Cori Bush was the target

Cori Bush is a Black, progressive Democrat. She is also a member of "the Squad." She voted against extra military aid for Israel after October 2023, and she called for a ceasefire. AIPAC's PAC went after her the same way it later went after Jamaal Bowman in New York.

## Why this matters

The headline result said Bell beat Bush. The real result is that the lobby in Washington can spend $8 million in one district and still only win by 5 points. That margin is not a wipeout. It is a warning sign for any future candidate AIPAC's PAC targets.

We are not predicting elections. We are showing you where the money came from, and what it bought.
""",
    "source_refs": [
        {"publication": "FEC — United Democracy Project (C00761668) committee page", "url": "https://www.fec.gov/data/committee/C00761668/", "retrieved_at": "2026-05-24"},
        {"publication": "Mondoweiss — AIPAC spent $9 million to help oust Cori Bush", "url": "https://mondoweiss.net/2024/08/aipac-spent-9-million-to-help-oust-cori-bush/", "retrieved_at": "2026-05-24"},
        {"publication": "Axios — Cori Bush primary loss to Wesley Bell", "url": "https://www.axios.com/2024/08/07/cori-bush-primary-results-loss-wesley-bell", "retrieved_at": "2026-05-24"},
    ],
}

MASSIE = {
    "slug": "cr-massie-gallrein-primary",
    "kind": "video_companion",
    "youtube_id": "7GpuZ0cfK1Y",
    "title": "$35 Million Beat Thomas Massie — Most Expensive House Primary Ever",
    "dek": "Outside groups poured about $15.8 million against Massie in Kentucky's 4th district. Total race spend hit $35 million — a record.",
    "body_md": """## What happened

On May 19, 2026, Thomas Massie lost his Republican primary in Kentucky's 4th district. The winner was Ed Gallrein, a former Navy SEAL endorsed by President Trump. Gallrein got about 54 percent. Massie got about 45 percent. The margin was around 10,000 votes.

Total spending in the race was about $35 million. That is the most ever spent in a U.S. House primary.

## The receipt

About $15.8 million of that money was outside spending against Massie — ad money the candidate never touches. The biggest pieces:

- **$4.1 million** from United Democracy Project, AIPAC's super-PAC.
- **$3.9 million** from the Republican Jewish Coalition Victory Fund.
- **$750,000** from Preserve America PAC, which is tied to Miriam Adelson, into a Kentucky group called MAGA KY.

The FEC lists every filing. Al Jazeera and The Intercept both broke down the totals from the same FEC reports.

## Why Thomas Massie was the target

Massie is a libertarian Republican. He votes "no" a lot. He voted against the big foreign-aid package in April 2024 that sent $26 billion to Israel. He forced votes on releasing the Epstein files. He voted against Trump's "big beautiful" tax and immigration bill.

In his last interview before primary day, Massie told CBS that "95 percent of my opponent's money comes from the Israeli lobby." He said the spending turned what would have been a 60-40 race into a 50-50 race.

## Why this matters

CR shows the same skepticism for lobby money against a libertarian Republican that we showed for the same lobby's money against a progressive Democrat like Cori Bush. Same playbook. Opposite end of the spectrum. That is the through-line.

The headline says Trump beat Massie. The receipt says the most expensive House primary ever was paid for, in big part, by the same lobby that beat Bush two years before.
""",
    "source_refs": [
        {"publication": "Al Jazeera — Massie race breaks spending record as pro-Israel groups target Trump critic", "url": "https://www.aljazeera.com/news/2026/5/18/massie-race-breaks-spending-record-as-pro-israel-groups-target-trump-critic", "retrieved_at": "2026-05-24"},
        {"publication": "The Intercept — Thomas Massie loses primary", "url": "https://theintercept.com/2026/05/19/thomas-massie-loses-election-results-trump-aipac-kentucky/", "retrieved_at": "2026-05-24"},
        {"publication": "FEC — United Democracy Project (C00761668) committee page", "url": "https://www.fec.gov/data/committee/C00761668/", "retrieved_at": "2026-05-24"},
        {"publication": "FEC — Preserve America PAC (C00878801) committee page", "url": "https://www.fec.gov/data/committee/C00878801/", "retrieved_at": "2026-05-24"},
    ],
}

RABB = {
    "slug": "cr-rabb-pa3-aipac-defeat",
    "kind": "video_companion",
    "youtube_id": "sodpDcNFUio",
    "title": "AOC Beat AIPAC's $3.5 Million Attack On Chris Rabb",
    "dek": "A super-PAC spent $3.5 million to lift Ala Stanford in Philadelphia. Chris Rabb still won the open seat — with help from AOC, Hasan Piker, Cori Bush, and Thomas Massie.",
    "body_md": """## What happened

On May 19, 2026, Chris Rabb won the Democratic primary in Pennsylvania's 3rd district. The seat is open — Dwight Evans is retiring. Rabb got about 44.2 percent. Ala Stanford, the candidate the outside money supported, got about 24.1 percent.

## The receipt

A super-PAC called 314 Action Fund spent about $3.5 million in this race — all of it to support Ala Stanford. None of it was coded as "oppose Rabb." The FEC has every filing on committee page `C00633248`.

Where the seed money came from is the bigger story. A brand-new nonprofit called the Kimbark Foundation was set up in Delaware in December 2025. About 65 days later, in February 2026, it wired $500,000 into 314 Action Fund. It also wired another $500,000 into a second PAC. That is dark-money seeding — a shell foundation that you cannot easily trace, feeding a super-PAC that then runs ads.

Drop Site News and Common Dreams reported the Kimbark money first. Both name the same FEC filings.

## Why Chris Rabb won anyway

Rabb is a sitting state representative in Pennsylvania. He had endorsements from Alexandria Ocasio-Cortez, Cori Bush, and state senator Sharif Street. The streamer Hasan Piker boosted him to a large online audience. And — the part nobody saw coming — Thomas Massie, the libertarian Republican who just lost his own primary to the same kind of lobby money, also spoke up.

That is the joke buried in the headline. The lobby that has been winning these races for years lost this one, and the coalition that beat it crossed the whole political map.

## Why this matters

Same lobby. Same playbook. Different result. The receipts are public — FEC committee pages, Drop Site News investigation, Common Dreams reporting. Read them. Then decide for yourself.
""",
    "source_refs": [
        {"publication": "FEC — 314 Action Fund (C00633248) committee page", "url": "https://www.fec.gov/data/committee/C00633248/", "retrieved_at": "2026-05-24"},
        {"publication": "FEC — Independent expenditures for Ala Stanford (PA-03)", "url": "https://www.fec.gov/data/independent-expenditures/?committee_id=C00633248&candidate_id=H6PA03245&cycle=2026", "retrieved_at": "2026-05-24"},
        {"publication": "FEC — EDW Action Fund (C00863472) committee page", "url": "https://www.fec.gov/data/committee/C00863472/", "retrieved_at": "2026-05-24"},
        {"publication": "Drop Site News — AIPAC, UDP, Ala Stanford, Philadelphia congressional race", "url": "https://www.dropsitenews.com/p/aipac-udp-ala-stanford-philadelphia-congress-race", "retrieved_at": "2026-05-24"},
        {"publication": "Common Dreams — Philly Dem secret AIPAC", "url": "https://www.commondreams.org/news/philly-dem-secret-aipac", "retrieved_at": "2026-05-24"},
    ],
}

TRUMP = {
    "slug": "cr-what-happened-to-trump",
    "kind": "video_companion",
    "youtube_id": "IvnGLCWXlus",
    "title": "Trump Promised No Unnecessary Wars. Then 7 B-2s Hit Iran.",
    "dek": "Trump's 2024 page promised to keep America out of unnecessary foreign wars. The archived page exists. The live URLs now return 404. Then U.S. B-2s struck Iran.",
    "body_md": """## What happened

In 2024, Donald Trump's campaign page made a clear promise: he would keep America out of unnecessary foreign wars.

That page is no longer live. The Internet Archive still has the promise. As checked on May 27, 2026, the live campaign URLs returned 404.

Then came the receipt.

On June 21, 2025, the United States struck three nuclear sites in Iran: Fordow, Natanz, and Isfahan.

The Congressional Research Service says seven B-2 stealth bombers took part. It says the strike used fourteen bunker-buster bombs. It also says Tomahawk missiles were launched from a submarine.

This article is not telling you what to think about that strike. It is showing the page voters saw, the page that is gone, and the record of what happened after.

## The receipt

There are three pieces of paper.

First: the archived 2024 campaign page. It said Trump would "keep America out of unnecessary foreign wars."

Second: the live page status. The URLs for the issues page and platform page now return 404.

Third: the government record. CRS Insight IN12571 describes the June 21, 2025 U.S. strikes on Iranian nuclear sites and names the aircraft, targets, and basic timeline.

That is the Campaign Receipts method: promise, public record, outcome.

## Where SEALED 2016 fits

SEALED 2016 is the older audit. It graded 145 Trump 2016 promises.

That audit already showed the split inside this story:

- Tear up the Iran nuclear deal: KEPT.
- No more endless wars: PARTLY KEPT.

Those two promises can collide. A voter can agree with the Iran-deal promise and still ask whether a later strike fits the anti-war promise.

That is why this video points to both sites. CampaignReceipts.com tracks current promises and money. Sealed2016.com keeps the 145-promise audit.

## Why this matters

Campaign pages are built to persuade you before election day. They are not built to remember after election day.

The Wayback Machine remembers. CRS remembers. FEC filings remember. That is why this site exists.

You do not have to change your vote because of one receipt. You do not have to agree with our framing. You can read the sources and decide for yourself.

But the promise was public. The page is gone. The planes flew. The receipt remains.

## Watch the video and Shorts

- Long-form video: https://youtu.be/IvnGLCWXlus
- Short: the campaign page now says 404 — https://youtube.com/shorts/qRJlGkhP3Eg
- Short: seven B-2s flew — https://youtube.com/shorts/Z_LCTUxwIHs
- Short: one kept promise collided with another — https://youtube.com/shorts/GKx4y5hplqM

Read more receipts at https://campaignreceipts.com.

Read the 145-promise audit at https://sealed2016.com.

Join the free weekly email at https://campaignreceipts.com/weekly.
""",
    "source_refs": [
        {"publication": "PBS NewsHour — Donald Trump's 2016 Republican National Convention acceptance speech", "url": "https://www.pbs.org/video/watch-presidential-candidate-donald-trump-s-full-speech-1476405218/", "retrieved_at": "2026-05-27"},
        {"publication": "TIME — Donald Trump Republican Convention Speech Transcript", "url": "https://time.com/4418493/republican-convention-donald-trump-transcript/", "retrieved_at": "2026-05-27"},
        {"publication": "Wayback Machine — donaldjtrump.com/issues capture, Jan. 23, 2025", "url": "https://web.archive.org/web/20250123070840/https://www.donaldjtrump.com/issues", "retrieved_at": "2026-05-27"},
        {"publication": "Wayback Machine — donaldjtrump.com/platform capture, Jan. 23, 2025", "url": "https://web.archive.org/web/20250123073008/https://www.donaldjtrump.com/platform", "retrieved_at": "2026-05-27"},
        {"publication": "Congressional Research Service — U.S. Strikes on Nuclear Sites in Iran, IN12571", "url": "https://www.congress.gov/crs_external_products/IN/PDF/IN12571/IN12571.1.pdf", "retrieved_at": "2026-05-27"},
        {"publication": "SEALED 2016 — 145-promise audit", "url": "https://sealed2016.com", "retrieved_at": "2026-05-27"},
    ],
}

EMBASSY = {
    "slug": "sealed-aipac-embassy-v2",
    "kind": "video_companion",
    "youtube_id": "ihnYXzqIwUQ",
    "title": "One Afternoon. Embassy Moved. 60 Dead. Same Date.",
    "dek": "On May 14, 2018, the U.S. opened its embassy in Jerusalem — a top AIPAC goal. The same afternoon, dozens died at the Gaza border. SEALED graded the move KEPT.",
    "body_md": """## What happened

On May 14, 2018, the United States opened its embassy in Jerusalem. The ribbon was cut that afternoon. Moving the embassy was a top goal for AIPAC, the big Israel lobby in Washington.

The change started five months earlier. On December 6, 2017, the president signed Proclamation 9683. It said Jerusalem was Israel's capital.

The same afternoon as the ribbon-cutting, people died at the Gaza border. We show both halves. We tell you how to feel about neither.

## The receipt

This is promise #74 in the SEALED 2016 audit. It is graded KEPT.

For twenty years before this, four presidents kept the embassy in Tel Aviv. The law let them sign a waiver every six months to delay the move. Each one signed it, over and over. Then one president stopped signing it.

Five months before the ribbon-cutting, the United Nations General Assembly voted on the capital decision. The vote was 128 to 9 against it. The move went ahead anyway.

## Why the grade is narrow

KEPT only grades the move. It does not grade the afternoon.

The death toll that day is hard to pin down, so we give you the real range. The UN aid office (OCHA) counted 55 people killed at the Gaza border that day. A later UN Commission of Inquiry counted 73 who died of wounds from that day. The number 60 was reported as the count rose. We hold all three numbers honestly.

## Why this matters

A promise can be kept and still leave you with a hard question. The move was a clear promise, and it was kept. The same afternoon carried a death toll that the headline never showed.

We are not telling you what to think. We are showing you the promise, the public record, and the same date on both.

If the promise was kept, what do you call the same afternoon? That is the question to sit with.

## Watch the video

- Long-form video: https://youtu.be/ihnYXzqIwUQ

Read more receipts at https://campaignreceipts.com.

Read the SEALED 2016 audit at https://sealed2016.com.

Join the free weekly email at https://campaignreceipts.com/weekly.
""",
    "source_refs": [
        {"publication": "U.S. Department of State — Opening of U.S. Embassy Jerusalem", "url": "https://2017-2021.state.gov/opening-of-u-s-embassy-jerusalem/", "retrieved_at": "2026-05-29"},
        {"publication": "Federal Register — Proclamation 9683, Recognizing Jerusalem as the Capital of Israel", "url": "https://www.federalregister.gov/documents/2017/12/11/2017-26832/recognizing-jerusalem-as-the-capital-of-the-state-of-israel-and-relocating-the-united-states-embassy", "retrieved_at": "2026-05-29"},
        {"publication": "United Nations — General Assembly resolution ES-10/19 on Jerusalem (vote 128-9)", "url": "https://press.un.org/en/2017/ga11995.doc.htm", "retrieved_at": "2026-05-29"},
        {"publication": "UN OCHA — Occupied Palestinian Territory, Gaza border casualties (May 14, 2018)", "url": "https://www.ochaopt.org/content/over-100-palestinians-killed-six-weeks-gaza-demonstrations", "retrieved_at": "2026-05-29"},
        {"publication": "UN Human Rights Council — Commission of Inquiry on the 2018 Gaza protests (A/HRC/40/74)", "url": "https://www.ohchr.org/en/hr-bodies/hrc/co-i-gaza-protests/index", "retrieved_at": "2026-05-29"},
        {"publication": "SEALED 2016 — 145-promise audit (promise #74)", "url": "https://sealed2016.com", "retrieved_at": "2026-05-29"},
    ],
}

CAMPUS_EO = {
    "slug": "sealed-aipac-campus-eo",
    "kind": "video_companion",
    "youtube_id": "AAELowu_vOw",
    "title": "He Promised to Widen Campus Speech. One Order Narrowed It.",
    "dek": "A 2019 executive order told the government to use a private group's definition of antisemitism to police campus speech. It kept a donor's goal and broke a voter's promise.",
    "body_md": """## What happened

In 2019, the president signed an order about speech on college campuses. He had run on protecting free speech. This order did the opposite for one kind of speech.

On December 11, 2019, he signed Executive Order 13899. It pulled three pieces together into one machine.

This is an audit, not an argument. We show the promise and the receipt. We never take a side on the speech itself.

## The receipt

The first piece is the IHRA definition of antisemitism. IHRA is a group, not a court. Its definition is a guide. On its own, it bound no school.

The second piece is the order. EO 13899 told the federal government to use that guide when it checks campus complaints.

The third piece is Title VI. That is the law that lets Washington pull a school's federal money. In other words, the guide now had teeth, because it was tied to the money.

Three pieces. One date. That is how a private guide became a federal rule.

## Why this is two ledgers

This one order sits on two scorecards at the same time.

In the SEALED paper trail, it is logged as a kept goal for AIPAC. It is Priority #3, marked "Done." For the donor, the promise was kept.

By Campaign Receipts' own audit, it BROKE the voter's promise. He ran to widen campus speech. The order narrowed the rules around one kind of speech.

## The machine running today

This is not old news. The machine still runs.

In July 2025, Columbia University adopted that same IHRA guide. In March 2025, 60 schools were warned about the same Title VI money lever.

## Why this matters

A campaign promise and a donor goal are not always the same thing. Here, one order served the donor and cut against the voter.

We do not tell you the order was right or wrong. We show you the promise, the order, and the receipt.

He promised to protect campus speech. Then one order drew a line around one kind of speech. Would you count that promise as kept?

## Watch the video

- Long-form video: https://youtu.be/AAELowu_vOw

Read more receipts at https://campaignreceipts.com.

Read the SEALED 2016 audit at https://sealed2016.com.

Join the free weekly email at https://campaignreceipts.com/weekly.
""",
    "source_refs": [
        {"publication": "White House Archive — Executive Order 13899 on Combating Anti-Semitism (Dec. 11, 2019)", "url": "https://trumpwhitehouse.archives.gov/presidential-actions/executive-order-combating-anti-semitism/", "retrieved_at": "2026-05-29"},
        {"publication": "Federal Register — EO 13899, Combating Anti-Semitism", "url": "https://www.federalregister.gov/documents/2019/12/16/2019-27217/combating-anti-semitism", "retrieved_at": "2026-05-29"},
        {"publication": "IHRA — Working definition of antisemitism", "url": "https://holocaustremembrance.com/resources/working-definition-antisemitism", "retrieved_at": "2026-05-29"},
        {"publication": "U.S. Department of Justice — Title VI of the Civil Rights Act of 1964", "url": "https://www.justice.gov/crt/fcs/TitleVI", "retrieved_at": "2026-05-29"},
        {"publication": "Columbia University — Statement adopting IHRA working definition (July 2025)", "url": "https://www.columbia.edu/content/statements-university-leadership", "retrieved_at": "2026-05-29"},
        {"publication": "U.S. Department of Education — 60 universities warned over Title VI (March 2025)", "url": "https://www.ed.gov/about/news/press-release/us-department-of-education-sends-letters-60-universities-under-investigation-antisemitic-discrimination-and-harassment", "retrieved_at": "2026-05-29"},
        {"publication": "SEALED 2016 — donor-priority paper trail (Priority #3)", "url": "https://sealed2016.com", "retrieved_at": "2026-05-29"},
    ],
}

ARTICLES = [BUSH, MASSIE, RABB, TRUMP, EMBASSY, CAMPUS_EO]

# ── Supabase REST upsert ───────────────────────────────────────

def upsert(article: dict) -> None:
    url = os.environ.get("SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    if not url or not key:
        print("[error] SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required (use --dry-run to skip)", file=sys.stderr)
        sys.exit(2)

    now = datetime.now(timezone.utc).isoformat()
    payload = {
        **article,
        "status": "published",
        "published_at": now,
        "generator": "manual-backfill-video-companion",
        "generator_version": "v1-2026-05-26",
        "last_regenerated_at": now,
        "updated_at": now,
    }

    endpoint = f"{url.rstrip('/')}/rest/v1/cr_articles?on_conflict=slug"
    req = urllib.request.Request(
        endpoint,
        data=json.dumps(payload).encode("utf-8"),
        method="POST",
        headers={
            "apikey": key,
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json",
            "Prefer": "resolution=merge-duplicates,return=representation",
        },
    )
    try:
        with urllib.request.urlopen(req) as resp:
            body = resp.read().decode("utf-8")
            print(f"[ok] upserted {article['slug']} ({len(article['source_refs'])} sources)")
            if os.environ.get("VERBOSE"):
                print(body)
    except urllib.error.HTTPError as e:
        print(f"[error] {article['slug']}: HTTP {e.code} — {e.read().decode('utf-8')}", file=sys.stderr)
        sys.exit(1)


def main() -> None:
    print(f"Backfilling {len(ARTICLES)} video_companion articles (dry_run={DRY})")
    for a in ARTICLES:
        print(f"\n--- {a['slug']} ---")
        print(f"  kind:        {a['kind']}")
        print(f"  youtube_id:  {a['youtube_id']}")
        print(f"  title:       {a['title']}")
        print(f"  dek:         {a['dek']}")
        print(f"  body_chars:  {len(a['body_md'])}")
        print(f"  sources:     {len(a['source_refs'])}")
        if DRY:
            continue
        upsert(a)
    if DRY:
        print("\n[dry-run] no rows inserted. Re-run without --dry-run to upsert.")
    else:
        print(f"\n[done] {len(ARTICLES)} articles upserted.")
        for a in ARTICLES:
            print(f"  https://campaignreceipts.com/articles/{a['slug']}")


if __name__ == "__main__":
    main()
