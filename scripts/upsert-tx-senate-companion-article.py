#!/usr/bin/env python3
"""
upsert-tx-senate-companion-article.py — Stage 30.5 companion page for the
TX Senate 2026 super-PAC long-form.

youtube_id is LEFT NULL on purpose: the founder uploads the LF manually
(Stage 29), then Stage 30 fills youtube_id via post-studio-upload. The
article publishes now so it is Google-indexable within 24h; the video embed
appears automatically once youtube_id lands.

Usage:
  SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
    python3 scripts/upsert-tx-senate-companion-article.py [--dry-run]

Idempotent: upserts on slug.
"""
from __future__ import annotations

import json
import os
import sys
import urllib.request
import urllib.error
from datetime import datetime, timezone

DRY = "--dry-run" in sys.argv

ARTICLE = {
    "slug": "cr-tx-senate-2026-superpacs",
    "kind": "video_companion",
    "youtube_id": None,  # founder uploads manually; Stage 30 fills this
    "title": "The Friendly Name Is the Costume: $90M in the Texas Senate Race",
    "dek": "Nearly $90 million in outside money is picking Texas's next senator before the primary — hiding behind names that sound like your neighbors. We pulled the FEC filings and named the billionaires.",
    "hero_image_url": "/longform/cr-tx-senate-2026-superpacs-thumb.jpg",
    "body_md": """## The ad on your couch

If you live in Texas, you are tired of these ads. One comes on. It says it is from **Texans for a Conservative Majority**. The name sounds like a room full of your neighbors.

It is not. The friendly name is the costume. And the only place the real face is written is the public filing.

The 2026 race for one U.S. Senate seat in Texas is the most expensive Senate race in the country right now. Nearly **$90 million** in outside money is already shaping it — most of it spent before most voters are paying attention. The strange part is where the money comes from. Most of it is not from the people running. It comes from outside groups called super-PACs. In other words, a super-PAC raises huge checks and buys ads. It just cannot hand that money to a campaign. So the names on the ads are not the candidates. They are the groups. And every group picked a name that sounds like you.

We pulled the public FEC filings — every super-PAC has to tell the government who pays it — and traced the friendly names back to the people who actually wrote the checks.

## Receipt 1 — "Texans" is one beer billionaire

**Texans for a Conservative Majority** (FEC committee `C00542217`) has spent about **$24.1 million — all of it against one Republican, Ken Paxton.**

The crowd is not a crowd. It is mostly one man:

- **John L. Nau III — about $15.6 million.** His family business distributes beer across Texas. He is a billionaire.
- **Stephen Schwarzman — $4 million.** The CEO of the Wall Street firm Blackstone.
- **Trevor Rees-Jones — about $3.6 million.** A Texas oil magnate.

A name that says "Texans" is, in the filing, a beer billionaire, a Wall Street CEO, and an oil magnate.

## Receipt 2 — Truth and Courage vs Allred

**Truth and Courage PAC** (FEC `C00796045`) has spent about **$22 million — all of it against the Democrat, Colin Allred.**

The biggest **named** donor we can see in its filing is an out-of-state billionaire, **Jeff Yass, at $2 million**, from the trading firm Susquehanna. Most of the rest is not itemized in a way that names the people behind it. Same trick: a friendly name on the outside, big checks on the inside.

## Receipt 3 — both sides wear the costume

You might think only one side does this. We thought so too. We were wrong.

**Lone Star Rising PAC** (FEC `C00918268`) has spent about **$8.5 million against the Democrat Jasmine Crockett — inside the Democrats' own primary.** It sounds like proud Texas folks. But one of its backers is a California tech billionaire, **Reid Hoffman, at $1.5 million.** Liberal money. A Texan-sounding name. The costume fits both parties.

## The honest gaps

Some threads do not pull all the way, and we will not make a name up:

- **WinSenate** (FEC `C00865444`) — about **$10.1 million for Allred.** It is affiliated with Senate Majority PAC, but its donors are **not itemized yet.** We do not know those names.
- **Conservative Texans PAC** (FEC `C00932707`) — about **$4.9 million against Wesley Hunt**, 100% through a single out-of-state pass-through. The donors are one filing removed, and not itemized.
- **Win It Back PAC** (FEC `C00844613`) — about **$9.2 million against Allred**, a Club for Growth vehicle.

Where the filing does not name a donor, we say so. We do not guess.

## Why it matters

Ken Paxton and Colin Allred want to speak for thirty million Texans. Picture the woman who drives across town after work to vote. She gets one ballot. A billionaire in another state gets fifteen million dollars of airtime. That is the gap.

The next ad will sound like your neighbors. It will not be. You do not need a reporter to find out who really paid. It is one filing. It is free. And it is already yours.

## Method

Every figure here comes from public FEC committee filings (independent-expenditure totals and Schedule A contributions), retrieved May 2026. Dollar amounts are rounded. Where a committee's donors are not itemized in the filing, we label the gap rather than fill it.
""",
    "source_refs": [
        {"publication": "FEC — Texans for a Conservative Majority (C00542217) committee page", "url": "https://www.fec.gov/data/committee/C00542217/", "retrieved_at": "2026-05-31"},
        {"publication": "FEC — Truth and Courage PAC (C00796045) committee page", "url": "https://www.fec.gov/data/committee/C00796045/", "retrieved_at": "2026-05-31"},
        {"publication": "FEC — WinSenate (C00865444) committee page", "url": "https://www.fec.gov/data/committee/C00865444/", "retrieved_at": "2026-05-31"},
        {"publication": "FEC — Win It Back PAC (C00844613) committee page", "url": "https://www.fec.gov/data/committee/C00844613/", "retrieved_at": "2026-05-31"},
        {"publication": "FEC — Lone Star Rising PAC (C00918268) committee page", "url": "https://www.fec.gov/data/committee/C00918268/", "retrieved_at": "2026-05-31"},
        {"publication": "FEC — Conservative Texans PAC (C00932707) committee page", "url": "https://www.fec.gov/data/committee/C00932707/", "retrieved_at": "2026-05-31"},
    ],
}


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
        "generator": "cr-pipeline-stage-30.5-video-companion",
        "generator_version": "tx-senate-2026-05-31",
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
            resp.read()
            print(f"[ok] upserted {article['slug']} ({len(article['source_refs'])} sources, youtube_id={article['youtube_id']})")
    except urllib.error.HTTPError as e:
        print(f"[error] {article['slug']}: HTTP {e.code} — {e.read().decode('utf-8')}", file=sys.stderr)
        sys.exit(1)


def main() -> None:
    a = ARTICLE
    print(f"Stage 30.5 companion article (dry_run={DRY})")
    print(f"  slug:        {a['slug']}")
    print(f"  kind:        {a['kind']}")
    print(f"  youtube_id:  {a['youtube_id']} (null until founder upload)")
    print(f"  title:       {a['title']}")
    print(f"  hero:        {a['hero_image_url']}")
    print(f"  body_chars:  {len(a['body_md'])}")
    print(f"  sources:     {len(a['source_refs'])}")
    if DRY:
        print("\n[dry-run] no row inserted.")
        return
    upsert(a)
    print(f"\n[done] https://campaignreceipts.com/articles/{a['slug']}")


if __name__ == "__main__":
    main()
