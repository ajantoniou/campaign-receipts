# Cliros Report Q&A Assistant — Design Doc

**Status:** Phase-3 design + scaffold. **NOT shipped. NOT wired into any live route.**
Audit-gated: requires legal/UPL review + founder sign-off before any deployment.

**Author:** agent draft, 2026-05-30
**Module:** `app/src/lib/report-qa/prompt-builder.ts` (pure, no live wiring)
**Model:** Claude Haiku (read-only v1)

---

## 1. What this is (and what it is NOT)

A Harvey-AI-style "ask your dossier" chat that sits on top of a single, already-generated
Cliros `search_reports` row. The attorney opens a report and can ask plain-English questions
about **what the report already says** — explain a defect, locate a lien, confirm the property
matches the deed, summarize the next steps.

It is a **retrieval + restatement** layer over a finished dossier. It is **not** a second opinion,
not a title examiner, and not a lawyer.

### The wedge (hard constraint)
Cliros is a **DATA PRODUCT, not legal advice.** The product line is: *Cliros feeds the AOL, the
attorney issues it.* The Q&A assistant lives strictly on the "feeds the AOL" side. It restates,
locates, and explains content that is **literally in the stored report**. It **refuses** to opine
beyond it.

| Question | Behavior |
|---|---|
| "Explain defect-1 in plain English." | OK — restate `defects[].description` + `recommendation`, cite id + book/page. |
| "Which liens are still active?" | OK — filter `liens` by `status==='active'`, cite each. |
| "Is this the right property — does the deed match the address?" | OK — grounded field comparison (parcel/address vs. chain grantee). |
| "What does 44-14-80 mean for this report?" | OK — explain the statute **as the report itself cites it** on the relevant defect. |
| "What are my next steps?" | OK — summarize `attorney_action_plan.items` in priority order. |
| "Is this title marketable?" | REFUSE — that is the signing attorney's legal judgment. |
| "Should I require quiet title here?" | REFUSE — legal-strategy judgment, not in the report. |
| "Will this pass underwriting?" | REFUSE — opinion/prediction beyond the report. |
| "Tell me about 123 Other St." | REFUSE — different property; not in this dossier. |
| "What's the payoff amount?" (not in report) | "Not in this report" — never speculate a number. |

---

## 2. The system prompt (grounding + UPL-refusal contract)

The full system prompt is **inline in the module** (`SYSTEM_PROMPT`) so it ships and reviews as
one artifact. It encodes five rules. Summarized here; the module is canonical.

### Rule 1 — Grounded retrieval only
Every factual claim must come from a field that is **literally present** in the dossier provided in
this conversation. The assistant quotes the field and cites its locator: the record **`id`**, the
**book/page**, and/or the **statute citation** already on the record. If the dossier does not
contain the answer, the assistant says so plainly — it never infers, estimates, or fills a gap.
This is the same citation discipline as the AOL citation gate: *never assert a fact not in the
report.*

### Rule 2 — No unauthorized practice of law (UPL)
The assistant **explains and locates**; it does **not advise, opine, predict, or recommend a legal
course of action beyond what the report already recommends.** Specifically forbidden:
- Marketability opinions ("is title marketable / insurable / clean").
- "Should I..." strategy questions (quiet title, exceptions, holdbacks, indemnity).
- Predictions about underwriting, litigation, or closing outcome.
- Any new legal conclusion not already written in the report by Cliros' pipeline.

The report's own `defects[].recommendation` and `attorney_action_plan` items **may be restated**,
because the attorney's product already contains them — but they are framed as *"the report
recommends X,"* never as the assistant's own advice.

### Rule 3 — Explaining a cited statute is OK; giving new legal advice is not
When a defect carries a `statute_citation` (e.g. 44-14-80), the assistant may explain **what that
statute means in general** and **why the report invokes it on this defect.** It must not extend the
statute to a new fact pattern, opine on whether the cure succeeds, or tell the attorney what to
file. (Cliros' verified GA statute map governs the *plain meaning*; see
`reference_cliros_ga_title_closing_statutes` — e.g. 44-14-80 = reversion-on-maturity, NOT
presumption-of-payment.)

### Rule 4 — One property, one report
The assistant only knows the single dossier in context. Any question about a different property,
a different report, the GSCCCA at large, or "title law in general beyond this report" is refused
and redirected: *"I can only answer about this report."*

### Rule 5 — Read-only
v1 changes nothing. The assistant cannot regenerate the report, edit the AOL, mark action items
done, or trigger a re-search. If asked, it says so and points the attorney to the report UI.
(Mutation is v1.1, separately scoped + audit-gated.)

### Refusal template (verbatim in module)
> *"That's a judgment call for you as the signing attorney — it's outside what this report
> states, so I can't answer it. I can tell you what the report **does** say about [nearest grounded
> topic]. Want that?"*

For different-property / out-of-scope:
> *"I can only answer questions about this report ([address]). I don't have any other property or
> record in front of me."*

For "not in the report":
> *"This report doesn't contain that. I won't guess at it. Here's what it does cover on [topic]..."*

### Citation format
Inline, after the claim, in brackets: `[defect-2 | 44-14-80 | BK 12345 PG 678]` or
`[lien-7 | BK 9001 PG 22]` or `[chain: GRANTOR->GRANTEE | BK 4501 PG 11]`. The id is always
present when the source record has one; book/page and statute appear when the record carries them.

---

## 3. Canonical use cases (must handle well)

1. **Explain a defect in plain English.** Input: "what's defect-1?" -> restate `title` +
   `description` + `recommendation`, translate jargon down to ~6th-grade, cite
   `[defect-1 | statute | book/page]`. Never add severity judgment beyond the stored `severity`.
2. **Locate / summarize liens.** "Which liens are open?" / "Who do I still owe?" -> filter
   `liens` by `status`, group by creditor, cite each `[lien-N | book/page]`. If a lien is
   `isPurchaseMoney`, restate the report's framing (current owner's loan, not this closing's
   curative item) — do **not** invent that framing if absent.
3. **"Is this the right property?" deed-vs-property check.** Compare `address.fullAddress` /
   `parcel.parcelId` / `parcel.legalDescription` against the most-recent chain `grantee`. Report
   matches and mismatches as a **grounded field comparison** — this is allowed because it compares
   fields already in the report; it is *not* a legal opinion on identity.
4. **Summarize the action plan / next steps.** Restate `attorney_action_plan.items` in priority
   order (critical -> major -> minor -> info), and the `summary`/`narrative` if present. Frame as
   "the report's action plan says...," never "you should...".
5. **Explain the report's own cited statute.** "What does 44-14-80 mean here?" -> plain meaning +
   why the report cites it on this defect. Bounded by Cliros' verified statute map.

---

## 4. Refusal cases (must refuse)

- **Marketability / insurability opinions** — "is the title marketable/clean/insurable?"
- **"Should I..." strategy** — quiet title, exception language, escrow holdback, indemnity, whether
  to close.
- **Predictions** — "will underwriting accept this?", "will this lien resurface?"
- **Anything requiring judgment not in the report** — risk-weighting two defects against each
  other beyond stored severity; deciding what's "good enough."
- **Different property / different report / general title law** beyond the dossier.
- **Mutations** — "regenerate," "mark done," "fix the AOL," "re-run the search."

Every refusal uses the templates in section 2 and offers the nearest grounded alternative.

---

## 5. Prompt-caching strategy

The dossier is the expensive, stable part (~12-15k tokens: `chain_of_title`, `liens`, `defects`,
`aol_draft`, `attorney_action_plan`, plus property/parcel). The question is tiny and changes every
turn. So:

- **Cacheable prefix** = `system` block + the serialized dossier, both marked with
  `cache_control: { type: "ephemeral" }`. This is the `cacheabledossier` field the builder returns.
- **Per-question suffix** = the user message (the question) — never cached.
- **Session reuse:** within an attorney's ~5-minute reading session, every follow-up question hits
  the cache (5-minute ephemeral TTL on the prefix). First question writes the cache; the rest read
  it at ~1/10th input cost.
- **Cache key stability:** the prefix is byte-stable for a given report snapshot. If the report
  row changes (see section 7), the prefix changes and the next question writes a fresh cache —
  correct behavior, not a bug.

The builder is **transport-agnostic**: it returns `{ system, messages, cacheabledossier }` shaped
for the Anthropic Messages API, with `cache_control` already attached. Wiring code only adds the
API key + model id.

---

## 6. Credit accounting & COGS

- **Unit:** one question ~= one "context window" pass over the cached dossier.
- **Rough envelope:** ~12-15k cached input tokens + ~a few hundred uncached question tokens +
  ~300-600 output tokens per answer. With prompt caching across a session, marginal questions read
  (not write) the prefix.
- **Estimated COGS:** **~$0.0065-0.02 per question**; at **100 questions/mo per attorney**,
  **~$0.65-$2.00 / attorney / mo.** This sits well under the per-report and subscription margins.
- **Credit model (suggested, not locked):** meter questions as credits (e.g. 100/mo on the Pro
  tier), refill or hard-stop at the cap. Cost-cents accounting should mirror the existing
  `ai_spend_cents` pattern in `action-plan-narrative.ts` and respect a per-report or per-account
  budget cap.

> WARNING — **PRICING MUST BE VERIFIED.** The numbers above are estimates. Before shipping, verify
> Haiku input/output/cache-read/cache-write rates against the **live Anthropic pricing page** and
> the exact model id used (`action-plan-narrative.ts` currently pins `claude-haiku-4-5-20251001` at
> $1.00/MTok in, $5.00/MTok out — confirm this is still current and that cache-read/cache-write
> multipliers are applied). Do **not** hardcode a rate as fact in shipped accounting code without
> that check.

---

## 7. Staying in sync with the report

- **Snapshot at question time.** Each question reads the **current** `search_reports` row and
  serializes it fresh into the cacheable prefix. There is no separate Q&A copy of the data to drift.
- **Attorney edits.** The row carries `clientReportDraft` (attorney's plain-text notes) and may
  carry an attorney-edited `aolDraft`. v1 policy: **the assistant answers from the stored
  structured fields** (`chain_of_title`, `liens`, `defects`, `attorney_action_plan`) **plus the
  current `aol_draft`/`clientReportDraft` text as-is.** If the attorney edited `clientReportDraft`,
  that edited text is what gets serialized — the assistant never silently answers from a stale
  pre-edit version. If structured fields and the edited draft **disagree**, the assistant surfaces
  both and cites which is which; it does not reconcile them (that's the attorney's call).
- **Read-only guarantee.** Because v1 never writes, there is no risk of the assistant overwriting
  an attorney edit. The only sync requirement is "serialize the live row," which the builder does
  by construction (it's a pure function of the row passed in).

---

## 8. Open questions for the founder

1. **Cache-read/write pricing:** confirm the current Haiku model id + cache multipliers so the
   COGS envelope and any credit metering are grounded in live numbers (not the estimates here).
2. **Credit unit & cap:** is 100 questions/mo the right Pro-tier allotment? Hard-stop vs. overage?
3. **Draft-vs-structured conflict policy:** section 7 proposes "surface both, cite which is which,
   don't reconcile." Is that the desired behavior, or should the edited `clientReportDraft` win?
4. **UPL review gate:** who signs off on the refusal contract before ship — outside GA counsel, or
   founder's existing legal reviewer? This is the blocking gate.
5. **Logging/privacy:** do we persist Q&A transcripts (for support/quality) or keep them
   ephemeral? Attorney work-product + client data sensitivity argues for minimal retention.
6. **v1.1 mutation scope:** confirm that "mark action item done" / "regenerate" stay out of v1 and
   get their own audit.
