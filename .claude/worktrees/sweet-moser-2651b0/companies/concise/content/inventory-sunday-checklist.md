# CON-6 Inventory — Sunday Morning Quick-Start Checklist

**Launch this the moment CTO posts "Books uploaded to Supabase Storage"**

**Owner:** Brand/Design (lead) + CEO (decision support)

**Timeline:** Sunday 9 AM → 2 PM (5 hours, but most work is parallel)

**Success:** `inventory.md` Section 1 + 2 populated + committed + founder approval received by EOD Sunday

---

## Pre-Work (Friday/Saturday night)

- [ ] **Brand/Design:** Familiarize with `inventory-extraction-workflow.md` (5 min read)
- [ ] **CEO:** Have spreadsheet ready (Google Sheets or CSV template)
- [ ] **Both:** Confirm tools available
  - [ ] PDF reader (macOS Preview, etc.)
  - [ ] Google Sheets access
  - [ ] Helium 10 signup (optional; Amazon manual lookup works too)

---

## Sunday 9 AM: Books Arrive ✅

**Trigger:** CTO posts Slack: "Books uploaded to Supabase Storage. [Download link]"

**Action:** Brand/Design + CEO post back: "Inventory extraction starting. ETA 2 PM."

---

## Sunday 9 AM — 10:45 AM: Phase 1 + 2 (Brand/Design ~ 105 min)

### Step 1: Download books
- [ ] Download all PDFs from Supabase Storage link
- [ ] Save to local folder (e.g., `~/concise-books/`)
- [ ] Count files (should be ~20)

### Step 2: Create spreadsheet
- [ ] Open Google Sheets
- [ ] Create columns (copy from below):

```
Filename | Title | ASIN | Current Price | Page Count | Word Count | Reviews | Rating | Est. Monthly Sales | Genre | Category | Target Audience | Direct Potential | Est. Revenue | Cover Ease | Notes
```

- [ ] Save with name: `CON-6-Inventory-DataEntry-2026-05-02.gsheet`

### Step 3: Extract metadata (Phase 1 of workflow)
- [ ] For EACH PDF:
  - [ ] Open PDF → check Properties (CMD+I on Mac) OR first page
  - [ ] Extract: Title, estimated page count
  - [ ] Search Amazon by title + pseudonym author → find ASIN
  - [ ] Note ASIN, current price
  - [ ] Rough word count: (page count × 250)
  - [ ] Add row to spreadsheet
- [ ] **Time check:** Should finish ~10:45 AM (40-45 min for 20 books)
- [ ] Post: "Metadata extraction done. Amazon research starting."

---

## Sunday 11 AM — 1 PM: Phase 2 + 3 (Brand/Design + CEO ~ 120 min, parallel)

### Step 4: Amazon research (Brand/Design)
- [ ] For EACH ASIN:
  - [ ] Go to Amazon.com
  - [ ] Search ASIN (e.g., `B0ABCD1234`)
  - [ ] Note: reviews count, star rating, category, BSR
  - [ ] (Optional) Open Helium 10 → get sales estimate
  - [ ] Add to spreadsheet: Reviews, Rating, Est. Monthly Sales
- [ ] **Time check:** Should finish ~12:15 PM (3 min per ASIN × 20 = 60 min)
- [ ] Post: "Amazon research complete. Audience tagging next."

### Step 5: Audience tagging (CEO, in parallel with Step 4)
- [ ] Create "Decision Matrix" document (Google Doc)
- [ ] Copy template (from workflow doc, Phase 4)
- [ ] For EACH book, fill in:
  - [ ] Category (MCAT / Politics / Advice / Classic / Other)
  - [ ] Difficulty (Beginner / Intermediate / Advanced)
  - [ ] Target Audience (1-2 sentence description)
  - [ ] Direct-Sale Potential (High / Medium / Low, with reason)
  - [ ] Estimated revenue range (e.g., "$50-100/mo")
  - [ ] Cover Redesign Ease (Easy / Medium / Hard)
- [ ] **Time check:** Should finish ~1 PM (30 min, lighter workload)

### Step 6: CEO decision (CEO)
- [ ] Review completed spreadsheet (brand research) + decision matrix (audience tags)
- [ ] Identify top 5 candidates by revenue potential + ease
- [ ] Draft Top 3 recommendation

---

## Sunday 1 PM — 2 PM: Finalization (Brand/Design + CEO ~ 60 min)

### Step 7: Top 3 decision & rationale
- [ ] CEO + Brand/Design review top 5 candidates
- [ ] Discuss:
  - [ ] Revenue potential (which 3 will generate most direct-sale revenue?)
  - [ ] Bundle strategy (are any 3 thematically related?)
  - [ ] Cover design feasibility (can we redesign all 3 by Tuesday?)
  - [ ] Controversy risk (Trump book — founder approval on cover direction?)
- [ ] Settle on Top 3
- [ ] Document rationale for EACH:
  - [ ] Why this book?
  - [ ] Estimated revenue & audience
  - [ ] Bundle fit
  - [ ] Cover redesign plan (brief)

### Step 8: Populate `inventory.md`
- [ ] Open `content/inventory.md`
- [ ] **Section 1 (Complete Inventory table):**
  - [ ] Copy/paste data from spreadsheet (all 20 books)
  - [ ] Keep: Title, ASIN, Current Price, Est. Monthly Sales, Reviews, Audience Tags
  - [ ] Remove: Word Count, Page Count (keep in spreadsheet for reference only)
- [ ] **Section 2 (Top 3 Candidates):**
  - [ ] Fill in Candidate #1, #2, #3
  - [ ] For EACH:
    - [ ] Title
    - [ ] 2-3 sentence rationale (revenue + audience + design ease)
    - [ ] Direct-sale price point (recommend: MCAT $19-29, Trump $9-19, Advice $12-24)
    - [ ] Bundle fit (MCAT bundle? Advice bundle? Standalone?)
    - [ ] Risk (low/medium/high + mitigation)

### Step 9: Commit
- [ ] Stage files: `git add content/inventory.md`
- [ ] Commit:
  ```bash
  git commit -m "CON-6: Inventory complete; Top 3 identified

  - Section 1: Complete inventory of 20+ books
    - Metadata: title, ASIN, price, reviews, sales estimate
    - Audience tags: category, difficulty, revenue potential
  - Section 2: Top 3 candidates for direct-sale launch
    - [Book A]: [reason] — est. revenue [range]
    - [Book B]: [reason] — est. revenue [range]
    - [Book C]: [reason] — est. revenue [range]
  - Ranking criteria: audience signal, revenue potential, cover ease, bundle fit, risk

  Founder approval pending on final Top 3 (may override). Ready for cover redesigns Monday.

  🤖 Generated with Claude Code

  Co-Authored-By: Claude <noreply@anthropic.com>"
  ```
- [ ] Post: "Inventory complete. Awaiting founder approval on Top 3 by EOD Sunday."

---

## Sunday EOD: Founder Approval (Founder)

- [ ] Founder reviews `inventory.md` Section 1 + 2
- [ ] Approves Top 3 (or suggests alternatives)
- [ ] **Decision:** Trump book cover direction (if included in Top 3)
  - [ ] Standard neutral cover
  - [ ] Palestine flag variant
  - [ ] Other political variant
  - [ ] (Brand/Design will propose 3-5 variants by Monday 9 AM)
- [ ] Posts final approval: "Top 3 approved. Proceeding to cover redesigns."

---

## Monday 9 AM: Handoff to Brand/Design (CN-009)

**Input:** Top 3 approved titles + Trump cover direction (if applicable)

**Output:** Cover redesigns for Top 3 books by Tuesday EOD

---

## Time Budget Summary

| Phase | Task | Owner | Duration | Est. Done |
|---|---|---|---|---|
| 1 | Download books + create spreadsheet | Brand | 10 min | 9:10 AM |
| 1 | Extract metadata (title, ASIN, price, page count) | Brand | 40 min | 10:00 AM |
| 2 | Amazon research (reviews, rating, sales est.) | Brand | 60 min | 11:15 AM |
| 3 | Audience tagging (category, difficulty, potential) | CEO | 30 min | 11:45 AM |
| 4 | CEO decision on Top 3 | CEO | 15 min | 12:00 PM |
| 4 | Populate inventory.md + commit | Brand | 30 min | 1:30 PM |
| **Total** | | **Both** | **~150 min** | **1:30 PM** |

**Buffer:** 30 min for cleanup, questions, or re-research (finish by 2 PM)

**Slack time:** 1 PM → EOD Sunday for founder approval

---

## Troubleshooting

**"I can't find a book's ASIN on Amazon"**
- Search by title + author pseudonym (e.g., "MCAT Comprehensive [Pseudonym Author]")
- Try alt titles (book may be listed under slightly different name)
- Ask founder: "Do you have the ASIN handy?"
- If truly not found: mark as "Out of print / not on Amazon"; note in spreadsheet

**"Helium 10 free tier ran out of lookups"**
- Use manual estimate: (reviews count / months on Amazon) × average rating factor
- Or just use Amazon review count as proxy for sales signal

**"Top 3 is too hard to decide"**
- Use decision matrix from Phase 4: rank by revenue potential + cover ease
- CEO decides; founder can override
- If disagreement: escalate to founder immediately; they own brand direction

**"Books arrived corrupted or unreadable"**
- Contact CTO immediately: "PDFs won't open; re-upload or provide alt source"
- Founder can provide local copies if needed

---

## Success Criteria (Done definition)

By 2 PM Sunday:
- [ ] `inventory.md` Section 1 populated (20+ books, metadata complete)
- [ ] `inventory.md` Section 2 populated (Top 3 + rationale)
- [ ] Git commit pushed
- [ ] Slack post: "Inventory complete. Awaiting founder approval."

By EOD Sunday:
- [ ] Founder approves Top 3 (or overrides with alternative)
- [ ] Trump book cover direction decided (if in Top 3)
- [ ] CEO posts: "Founder approved. Cover redesigns start Monday 9 AM."

---

## Notes

- **This is a checklist, not a prison.** If you finish faster, great. If slower, adjust & post status.
- **Founder input is expected, not a blocker.** If founder wants to change Top 3, that's a valid decision. Adjust + re-commit.
- **Parallel work is OK.** Brand does Amazon research while CEO does audience tagging. Both finish by 1 PM.
- **Questions?** Post in Slack with tag @CEO. Don't get stuck on detail; push forward.

---

**Ready to execute Sunday morning. No re-planning. Just check boxes and populate.**

**Go.**
