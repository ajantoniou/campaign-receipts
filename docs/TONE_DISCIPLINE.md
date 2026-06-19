# Tone Discipline — Campaign Receipts

> Distilled from the rev-1 through rev-6 site build (May 14–16 2026).
> Six expert panel reviews caught and killed several brand-cracking
> moments. The decisions below are the muscle memory that hardened
> the brand. Any new surface (YouTube channel, podcast, newsletter,
> Twitter, content partnership) must inherit this discipline.

## The one-line brand

**"Receipts, not rhetoric."** Term-scoped verdicts. Primary-source
citations. Three sequential reviewers (neutral · conservative ·
progressive). No party affiliation, no campaign-staff history.

## The five rules

### 1. Sourcing layer, not source of record

CR is a synthesis layer above primary sources. Every claim is backed
by federalregister.gov / congress.gov / debates.org / fec.gov /
justice.gov / efile.fara.gov / govinfo.gov. The website's job is to
make those sources legible, not to replace them.

**Why this matters for new surfaces:** content that quotes CR's
verdict without citing the underlying primary source is not journalism
— it's a one-source dependency. The methodology page (`/methodology#cite`)
explicitly tells reporters: cite the primary source for instrument-level
claims, cite CR's RCPT-ID only for verdict-level synthesis. Same rule
applies to YouTube voice-over scripts, podcast claims, and Twitter posts.

### 2. Nonpartisan by construction, not by claim

The brand doesn't *claim* nonpartisanship — it builds nonpartisanship
into the methodology. Specifically:

- **Three sequential reviewers per verdict** (neutral · conservative
  · progressive). The progressive + conservative panels are publicly
  named as "recruiting" with explicit prior-affiliation criteria on
  `/about`. We'd rather show open seats than fake panelists.
- **No politician donations accepted. No advertising.** Funding
  source: SEALED Press book sales + Pro newsroom licenses. Stated
  in the site footer.
- **Verdict palette is nonpartisan:** sage (kept) · amber (partial)
  · coral (broken) · slate (pending) · olive (you decide). No red/
  blue. Party tags are the only place red/blue ever appears, and
  only as muted background on tiny chips.

**Rule for new surfaces:** never frame a CR position as opposing
*a party*. Frame it as opposing *unverified claims*, *unsourced
verdicts*, or *partisan framing*. The enemy is the genre, not the
politicians.

### 3. The "I hope it doesn't get me banned" test

If the founder's gut says "I hope this doesn't get me banned" — that
instinct is the brand-crack alarm. Two cases this session hit it:

- **Dual-citizenship flags on politician profiles** — founder's
  instinct was right; we pivoted to a standalone investigation
  page (`/dual-citizenship`) with strict primary-source rigor instead
  of decorating profiles with flag emojis. Reframed the topic as
  *the journalism we're doing* instead of *a label we're applying
  to specific people*.
- **AIPAC under "foreign donors"** — same risk. AIPAC is a domestic
  501(c)(4)/PAC under U.S. law, not a foreign agent. The page now
  explicitly says "DOMESTIC U.S. PACs, NOT foreign agents" in the
  section intro and renders a "Domestic PAC" tag (not a "Convicted"
  outcome chip) on those rows. The precision is the brand.

**Rule for new surfaces:** when a topic risks identity-political
shorthand, separate the journalism from the labeling. Treat the
topic as "what does the primary source say?" not "what category
do we put this person in?"

### 4. Honest gaps over fabricated rows

Three concrete cases this session:

- `cr_citizenships` initial seed: target was ~15 dual-citizen
  politicians; rigor returned 2. We shipped 2 and a "submit a
  citation" CTA. No padding.
- `cr_foreign_donor_records.foreign_soe_employee`: zero verified
  FEC records met the bar. Section ships **empty** with the same
  "submit a citation" CTA. The empty-state IS the editorial
  position: we don't fabricate rows to fill a category.
- `cr_promises` rev-4 → rev-5: Trump 2016 corpus had 81 graded
  promises but zero `cr_receipts` rows and stub `verdict_reasoning`
  ("Aggregated chapter verdict from the SEALED book. See
  campaignreceipts.com/politi..."). Re-skinning the page would have
  made the absence MORE visible; we wrote 4 real 1.7-1.9k char case
  studies grounded in primary sources before the visual rebuild.

**Rule for new surfaces:** the data discipline that produces empty
sections is the data discipline that produces credibility. If a
script claim, an episode segment, or a thumbnail can't be sourced,
the segment doesn't ship — you reshape around what you have.

### 5. Honesty about uncertainty

When data is contested, say so on the page. Concrete examples:

- `/foreign-donors` FEC MUR 7272 (Mercury+Podesta): outcome marked
  as "Dismissed" with an explicit long_explanation note that **a
  deadlocked 2-2 commission vote is a procedural dismissal, not a
  finding of innocence.**
- `/dual-citizenship` explainer leads with: *"Snopes 2024 surveyed
  several circulating lists and concluded most are unreliable."*
  The page's editorial premise is *the genre is wrong; here's what
  we can defend.*
- `/about` reviewer panel: 4 seats marked "Recruiting" with the
  prior-affiliation criteria stated, plus the line: *"a 'bipartisan
  review' claim that doesn't name people isn't a review claim —
  it's marketing. We'd rather show open seats than fake them."*
- `/methodology#cite`: tells reporters EXACTLY what's not citation-
  ready yet (live-tracking profiles, non-featured promise rows
  without case studies) so they don't misuse the site.

**Rule for new surfaces:** the honesty about what we don't know is
the trust signal that lets the audience trust what we do know.
Episode scripts should explicitly mark contested claims as contested,
flag MUR deadlocks as procedural-not-substantive, and cite Snopes-
debunked-genre framings when relevant.

## Anti-patterns (things we won't ship)

- "Rage-bait political accountability" — frames itself as crusader-
  vs-villains. Caps audience at one tribe.
- Verdict + no receipt — every claim is sourced or the segment
  doesn't ship.
- Identity-coding shorthand — flag emojis next to names without a
  primary-source justification.
- Anonymous reviewer claims — "our panel reviewed this" without
  named panelists or named open seats.
- "Hot take" content with no methodology trail — every segment
  should be reverse-engineerable to its primary sources.
- Single-target political channels — covering only-conservative-
  politicians or only-progressive-politicians dies. Cover everyone
  or cover no one.
- "AI sparkle" voice — confident assertions with no documentation
  trail. The voice is auditor's, not pundit's.

## What "voice" sounds like

When in doubt, write like:

- The ProPublica accountability desk
- The Atlantic's investigative pieces
- The Lever / Sludge on campaign finance
- WaPo Fact Checker on specific instruments
- NOT: Twitter dunk culture, cable-news framing, partisan
  commentariat, "tea/lore" YouTube voice, "destroying X with
  facts" titles

## The voice test (use before publishing any new surface)

Ask 3 questions before shipping a script, post, or page:

1. **Sourcing test:** can every concrete claim point to a primary
   source we'd link from the website? If no, cut the claim.
2. **Symmetry test:** would this segment read the same way if the
   politician were from the other party? If no, rewrite for the
   symmetry. The accountability stays; the framing flattens.
3. **"Banned" test:** does the founder's gut say "I hope this
   doesn't get me banned"? If yes, the framing is wrong (not
   necessarily the content — usually a presentation fix solves it).

## How this maps to a YouTube/podcast channel

The same five rules port directly:

- Voice-over scripts: every concrete claim cites a primary source
  shown on screen + linked in the description's sources.md.
- Episode formats lean toward the **comparison structure**:
  "Politician X said Y in [debate]. The record shows Z [primary
  source on screen]. We grade this BROKEN / KEPT / PARTIAL based
  on [instrument-level evidence]."
- Thumbnails and titles avoid the rage-bait register. Title pattern:
  *"[Politician] said [X]. Here's what actually happened."* —
  not *"[POLITICIAN] EXPOSED!!!"*.
- Description includes a sources.md link or inline citation list.
  Same RCPT-ID system the website uses for stable citation.
- Each episode names which CR Receipt(s) the synthesis is built on,
  so a viewer fact-checking can land on the site and verify.

## Inheritance

If you're building a new surface (channel, podcast, partnership,
syndication), this file is the constitution. Reading it ONCE saves
you from re-discovering rev-1-through-rev-6's brand-cracking moments
the hard way.

When a new tone question comes up that isn't covered here, the meta-
rule is: *what would a senior accountability journalist who's
reviewed us 5 times already approve of?* That panel got us from
"BOOKMARK-ONLY / STILL-NO-CITE" at rev 4 to "CITE — would actually
cite a CR verdict in Monday's piece" at rev 6. The discipline that
moved the needle is the discipline that defines the brand.
