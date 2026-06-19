# MrBeast Packaging — `cr-bush-short-02-money-flow`

```
ROLE: MrBeast Packaging
MODE: REVIEW | TRANSFORM (one revision applied)
```

## PLAYBOOK ANCHORS
- "Plain English in titles and thumbs — no JCPOA, no IE, no UDP without translation." — persona 06 line 50
- "One huge number, one big idea."

## CTR RISKS
- **Found and fixed 2026-05-23 01:35.** The original thumb headline was `UDP`
  (the acronym for AIPAC's super-PAC, United Democracy Project). Per persona
  06's hard rule against acronyms-without-translation, this fails the
  expectations-contract test for non-political viewers — they'd see "UDP" and
  scroll. Replaced headline with `$8M` and subline with `AIPAC PAC HIT MO-1`,
  which is plain-English, names the lobby, and pays off the receipt.
- After fix: navy bg, `$8M`, "AIPAC PAC HIT MO-1", Bush portrait, RECEIPT stamp.

## AVD RISKS
- None. First VO line in the short ("AIPAC's super-PAC — United Democracy
  Project — sent eight million dollars into MO-1") explicitly translates UDP
  → AIPAC's super-PAC inside the first sentence. Thumb now mirrors that.

## SPECIFIC FIX
- thumbnail: `public/shorts/_thumbs/cr-bush-short-02-money-flow.jpg` — regenerated 2026-05-23 01:36 with `$8M` / `AIPAC PAC HIT MO-1` / `RECEIPT` / Bush portrait — **shipping**
- title (already plain-English in meta): `How $8M Reached St. Louis Mailboxes — UDP vs Cori Bush #shorts` (acronym-OK in title because the description's first line translates it)
- description line 1 (locked, translates the acronym): "United Democracy Project — AIPAC's super-PAC — filed Schedule E independent expenditures opposing Cori Bush."

## VERDICT: PASS-WITH-DISCLOSURE (post-revision)

- AI-narration disclosure auto-injected.
- Persona-06 hard rule on acronym-translation: enforced via thumb regen.

— Audited 2026-05-23. Captures the full transform: original `UDP` thumb caught
in MrBeast pass before upload, regenerated, re-approved.
