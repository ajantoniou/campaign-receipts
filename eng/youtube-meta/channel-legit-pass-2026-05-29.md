# Campaign Receipts — YouTube channel legitimacy pass (delisting appeal)

Written 2026-05-29 for the YouTube delisting appeal, alongside the new 964-char
channel description in `channel-description-2026-05-29.md`. Purpose: give a human
reviewer and an automated classifier every brand-voice signal that reads this
channel as a legitimate journalistic political-media company. All claims here are
verifiable from the live website pages (/about, /methodology, /sources,
/corrections, /for-journalists) and the already-pushed channel description.
Nothing is invented.

---

## 1. Channel keywords

For `brandingSettings.channel.keywords`. Space-separated; multi-word terms quoted.
Currently empty — classifiers read this field, so filling it is a direct
legitimacy signal.

```
"campaign finance" "political journalism" "public record" "FEC data" "Congress.gov" "money in politics" "donor money" "congressional votes" "fact checking" accountability transparency "campaign contributions" "voting record" "election spending" "government data" "open data" "political accountability" "media company" "editorial review" nonpartisan "follow the money" "public records journalism"
```

Rationale: every term names sourced, government-record journalism or a real
editorial practice. No clickbait, no party names, no engagement-bait. Reinforces
the description's `.gov` sourcing and three-reviewer panel rather than competing
with it. ~430 chars, under the practical ceiling.

---

## 2. Channel country

Set it. Use ISO 3166-1 alpha-2 code `US`.

```
US
```

Rationale: the org reports on US federal campaign finance (FEC.gov) and US
congressional records (Congress.gov). A US-focused media company declaring an
empty country reads as evasive to a classifier; a declared origin reads as
accountable and matches the subject matter exactly.

---

## 3. Channel trailer (unsubscribedTrailer)

Set one. Recommended video ID:

```
SSuO2KOXr0Y
```

Rationale: the non-subscriber trailer is the first thing an undecided viewer — or
a reviewer auditing the channel — watches. `SSuO2KOXr0Y` is a live long-form
promise piece (the embassy story), which is the format that best shows the method:
a documented promise, the public record, a sourced verdict. A long-form sourced
piece signals "this is journalism" far better than a Short would. If founder
prefers a piece that opens on visible `.gov` sourcing on screen, `w9YX_8mnOf8` is
the backup. Either is stronger than no trailer; an empty trailer slot on appeal day
is a missed legitimacy signal.

---

## 4. Description revision

Keep as-is.

Rationale: the pushed 964-char description already leads with the category,
states the `.gov` sourcing as its strongest line, names the editor, describes the
review panel and public audit trail, marks the site as free, and discloses the
synthesized voice. It passes the kill list and the receipt-drawer accent. Adding
to it would dilute the single strongest line (`Every fact comes from US-government
.gov sources`) without adding a verifiable claim. The keywords, country, and
trailer above are the gaps; the prose is not one.

---

## 5. About Q&A — appeal free-text block

Paste into the YouTube appeal form free-text and the channel "Details / Business
inquiries" field. CR voice: numbered, sourced, named, quiet.

```
Campaign Receipts is a political-media company. We tie donor money to the public record — who funded a campaign, how that member of Congress voted, which promises they kept or broke — and every fact comes from US-government sources: campaign finance from FEC.gov, votes and bills from Congress.gov. Anyone can check the record.

The editorial lead is Alex Antoniou. Every verdict is reviewed by a three-person panel — a neutral reader, a conservative reader, and a progressive reader — and the review notes are kept as a public audit trail. Our method, sources, and corrections policy are published in full and free at campaignreceipts.com/methodology, /sources, and /corrections.

Narration uses a synthesized voice (ElevenLabs Jessica), disclosed on every upload. Research and scripts are our own. Receipts, not vibes.
```

Rationale: three short paragraphs, each one a verifiable legitimacy proof — the
`.gov` sourcing, the named editor plus the cross-spectrum review and public
correction pages, then the honest AI-narration disclosure. Cites the live
infrastructure pages by name so a reviewer can click straight to them. Lands on
the established tagline, not a plea. ~830 chars.

---

### Constraints honored
- Passes the portfolio kill list (no "journey," "transform," "leverage,"
  "we believe that," hype, urgency, all-caps, financial-advice tone).
- No invented credentials, awards, staff, partnerships, numbers, or false
  non-partisanship claim ("follow the money" / "regardless of party" instead).
- Receipt-drawer accent: numbered, sourced, dated, signed; quiet.
- Internally consistent with the pushed 964-char description (same sourcing,
  same editor, same panel, same tagline, same disclosure).
