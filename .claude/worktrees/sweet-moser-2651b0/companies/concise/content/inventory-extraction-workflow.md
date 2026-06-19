# Inventory Extraction Workflow

**Purpose:** Executable guide to populate `inventory.md` Section 1 (Complete Inventory) once book PDFs land in Supabase Storage.

**Owner:** CEO + Brand/Design (parallel execution, ~2 hours total)

**Trigger:** Sunday morning when CTO uploads PDFs to Supabase Storage

**Goal state:** `inventory.md` Section 1 + Section 2 (Top 3 candidates) complete with full metadata + ranking rationale by Sunday 2 PM.

---

## Phase 1: Metadata Extraction (Brand/Design ~ 45 min)

### Step 1: List all books in Supabase Storage

Once CTO uploads PDFs, retrieve the file list:

```bash
# CTO provides: list of filenames + count
# Expected output: 20+ PDF files named like:
# - MCAT_Book_1.pdf
# - MCAT_Book_2.pdf
# - Trump_Election_Promises.pdf
# - Ben_Franklin_Virtues.pdf
# - [other titles].pdf
```

### Step 2: Extract per-book metadata

For EACH book PDF:

| Metadata Field | How to Extract | Example |
|---|---|---|
| **Title** | PDF metadata (Properties) OR filename | "MCAT Comprehensive Review" |
| **Current Amazon ASIN** | Ask founder OR search Google (title + author pseudonym) | B0ABCD1234 |
| **Current Price** | Look up ASIN on Amazon | $19.99 |
| **Genre** | Content scan (first chapter / table of contents) | MCAT, politics, advice |
| **Estimated Page Count** | PDF properties OR manual count (spot-check first 10, last 5 pages) | 412 pages |
| **Estimated Word Count** | (Page count × 250) rough estimate | 103K words |

**Tool:** Use PDF reader (macOS Preview, Adobe Reader, or pdfinfo CLI) to extract metadata.

**Output format:** Create a spreadsheet (Google Sheets or CSV) with columns:

```
Filename | Title | ASIN | Current Price | Genre | Page Count | Word Count | Notes
MCAT_Book_1.pdf | MCAT Comprehensive... | B0ABCD1234 | $19.99 | MCAT | 412 | 103K | High engagement signal
...
```

**Timeline:** ~2 min per book × 20 books = ~40 min (faster if PDFs have clean metadata)

---

## Phase 2: Amazon Performance Research (Brand/Design + CEO ~ 60 min)

**Tool:** [Helium 10](https://www.helium10.com) (free tier) or manual ASIN lookup on Amazon.

### Step 3: Research each book's current Amazon performance

For EACH ASIN from Phase 1:

| Metric | Source | How to Get | Example |
|---|---|---|---|
| **Current Reviews Count** | Amazon product page | Search ASIN → look at reviews section | 247 reviews |
| **Average Rating** | Amazon product page | Look at star rating | 4.3 stars |
| **Monthly Sales Estimate** | Helium 10 (free tier) | Paste ASIN → "Sales Estimate" | ~15 books/month |
| **Best Seller Rank** | Amazon product page | Look at "Best Seller rank in..." | #1,234 in Medical Books |
| **Category** | Amazon product page | Look at breadcrumb navigation | Medical > Exam Prep > MCAT |

**Manual lookup example:**
1. Go to Amazon.com
2. Search for ASIN (e.g., `B0ABCD1234`)
3. Note: price, review count, rating, category
4. Open [Helium 10 Chrome extension](https://www.helium10.com) → paste URL
5. Get sales estimate from extension overlay

**Output format:** Extend Phase 1 spreadsheet with new columns:

```
... | Reviews | Rating | Est. Monthly Sales | BSR | Category | Revenue Signal
... | 247 | 4.3 | ~15/mo | #1234 | Medical > MCAT | High (4.3 stars, strong reviews)
...
```

**Timeline:** ~3 min per ASIN × 20 books = ~60 min

---

## Phase 3: Audience Tagging & Ranking (CEO ~ 30 min)

### Step 4: Define audience tags for each book

For EACH book, tag:

```
Category: [MCAT | Politics | Advice | Classic | Other]
Difficulty: [Beginner | Intermediate | Advanced]
Target Audience: [Pre-med students | Political readers | Self-improvement readers | Etc.]
Direct-Sale Potential: [High | Medium | Low]
  - High: 50+ reviews + 4.0+ stars + clear audience
  - Medium: 20-50 reviews + 3.5+ stars + niche audience
  - Low: <20 reviews OR <3.5 stars OR saturated category
Revenue Estimate (direct-sale): [High ($50-200/mo) | Medium ($10-50/mo) | Low (<$10/mo)]
  - Based on: monthly sales signal × (direct margin / Amazon margin) × audience size
Cover Redesign Feasibility: [Easy | Medium | Hard]
  - Easy: simple, generic cover (can redesign quickly)
  - Medium: needs research on competitor covers
  - Hard: highly specific imagery or complex layout
```

**Output:** Add columns to spreadsheet:

```
... | Category | Difficulty | Target | Direct Potential | Est. Revenue | Cover Redesign Ease
... | MCAT | Advanced | Pre-med | High | $50-100/mo | Easy
...
```

---

## Phase 4: Top 3 Ranking (CEO + Brand/Design ~ 15 min)

### Step 5: Identify Top 3 candidates

**Ranking criteria (in priority order):**

1. **Existing audience signal** (reviews + rating + sales estimate)
   - High-performing books (100+ reviews, 4.0+ stars, 20+ books/month) are proven demand

2. **Direct-sale revenue potential** (estimated market size × margin improvement)
   - Example: 20 books/month on Amazon at $20 = $400 gross
   - Stripe direct at same volume = $400 gross − $12 (Stripe fee) = $388
   - If direct captures 2-3x volume (no Amazon constraints) → $800-1200 gross

3. **Cover redesign feasibility** (time + Brand/Design bandwidth)
   - Can refresh in <4 hours? Prioritize
   - Needs custom photography? Defer to Week 2

4. **Bundle potential** (related titles)
   - MCAT books: all 3 can bundle at $49-99 (Amazon doesn't allow bundles)
   - Advice books: can group thematically
   - Trump book: standalone political title

5. **Controversy risk** (founder's brand tolerance)
   - Trump book: founder owns cover decision + public position
   - Health claims: strictly avoid (exam prep only, not medical advice)

**Decision matrix (copy & fill):**

| Rank | Book Title | Audience Signal | Revenue Potential | Cover Ease | Bundle Fit | Risk | Final Score |
|---|---|---|---|---|---|---|---|
| 1 | [MCAT Book A] | High (200 reviews, 4.5★) | High ($80-150/mo) | Easy | ✅ (bundle all 3) | Low | **Select** |
| 2 | [MCAT Book B] | High (180 reviews, 4.4★) | High ($70-140/mo) | Easy | ✅ (bundle all 3) | Low | **Select** |
| 3 | [Trump Book] | High (150 reviews, 4.2★) | High ($60-120/mo) | Medium | Standalone | Medium | **Select** |
| 4 | [Advice Book A] | Medium (80 reviews, 4.1★) | Medium ($20-50/mo) | Medium | ✅ (advice bundle) | Low | Defer to Week 2 |

**Output:** Document Top 3 selection with clear rationale in `inventory.md` Section 2.

---

## Execution Checklist (Sunday Morning)

**Time: Sunday 9 AM — 2 PM (assuming books uploaded)**

### Pre-work (CTO, Saturday night or Sunday 8 AM)
- [ ] Upload all 20+ book PDFs to Supabase Storage
- [ ] Post Slack message: "Books ready in Supabase Storage. Go/no-go for inventory Sunday?"

### Brand/Design (Sunday 9 AM — 10:45 AM)
- [ ] Download all PDFs from Supabase Storage
- [ ] Extract metadata: title, ASIN, price, page count, word count
- [ ] Create spreadsheet with Phase 1 + Phase 2 columns
- [ ] Post: "Metadata extraction done; Phase 2 research starting"

### Brand/Design + CEO (Sunday 11 AM — 1 PM)
- [ ] Research Amazon metrics for each ASIN (Helium 10 or manual)
- [ ] Tag audience, difficulty, direct-sale potential, cover feasibility
- [ ] Draft Top 3 decision matrix
- [ ] CEO makes final Top 3 ranking decision
- [ ] Post: "Top 3 identified: [Title A], [Title B], [Title C]"

### Brand/Design (Sunday 1 PM — 2 PM)
- [ ] Populate `inventory.md` Section 1 (complete inventory table)
- [ ] Populate `inventory.md` Section 2 (Top 3 candidates with full rationale)
- [ ] Commit to Git with clear message
- [ ] Post: "Inventory complete. Founder approval needed on Top 3 by Sunday EOD for cover redesign start Monday."

### Founder (Sunday evening)
- [ ] Review Top 3 ranking + rationale in `inventory.md` Section 2
- [ ] Approve Top 3 (may override CEO/Brand if desired)
- [ ] Provide final Top 3 list to CEO

---

## Tools & Links

| Task | Tool | Free? | Time to setup |
|---|---|---|---|
| PDF metadata extraction | macOS Preview OR pdfinfo (CLI) | ✅ | 0 min |
| Spreadsheet | Google Sheets | ✅ | 2 min |
| Amazon ASIN lookup | Amazon.com | ✅ | 0 min (manual) |
| Sales estimate | Helium 10 | ⚠️ Free tier only | 5 min (signup) |
| Alternative sales estimate | [AMZ Scout](https://amzscout.net) or [Jungle Scout](https://www.junglescout.com) | ⚠️ Free trial | 5 min |

**Recommendation:** Helium 10 free tier is sufficient for 20 books (10 lookups/day). If hit limit, use manual Amazon + estimate.

---

## Failure Modes & Mitigations

| Scenario | Mitigation |
|---|---|
| Book PDFs don't have clean metadata | Use filename + manual inspection of first page + ask founder |
| Can't find Amazon ASIN for a book | Search by title + author pseudonym; may be out of print on Amazon |
| Helium 10 free tier limit hit | Switch to manual lookup + estimation based on review count + rating |
| Top 3 decision is contentious | CEO + Brand/Design propose; founder makes final call (founder approval guardrail) |
| Book files corrupted or unreadable | CTO re-uploads; Brand/Design extracts from alternative source (founder's local copy) |

---

## Definition of Done

Inventory is complete when:

- [ ] `inventory.md` Section 1: All 20+ books with metadata (title, ASIN, price, reviews, sales estimate, audience tags)
- [ ] `inventory.md` Section 2: Top 3 candidates with clear ranking rationale
- [ ] Git commit with message: "CON-6: Inventory complete; Top 3 identified"
- [ ] Founder approval received (may override, but acknowledgment recorded)
- [ ] CEO post: "Inventory complete. Brand/Design proceeding to cover redesigns Monday morning."

**Next blocker unblock:** Brand/Design starts cover redesigns (CN-009) once founder approves Top 3.

---

## Timeline Dependencies

```
Sunday 9 AM: Books land ─┐
                        ├─→ Metadata extraction (45 min)
                        ├─→ Amazon research (60 min)
                        ├─→ Audience tagging (30 min)
                        ├─→ Top 3 ranking (15 min)
                        └─→ Inventory.md populated by 2 PM
                            │
                            └─→ Founder approval (EOD Sunday)
                                │
                                └─→ Monday: Cover redesigns start (CN-009)
                                    │
                                    └─→ Wednesday: Covers live on landing pages
```

**Critical path:** Books must arrive Sunday 9 AM to stay on schedule. Every hour delay = 1 hour slip in cover redesigns.

---

## Notes for executor

- **This is a template, not a hard constraint.** If books arrive with complete metadata already tagged, skip to Phase 4 directly.
- **Ask founder:** "Do you have existing ASIN data or metadata we can copy/paste?" (Could save 30 min)
- **Don't overthink audience tags.** Use common sense: MCAT books → pre-med students. Trump book → political readers. Advice book → self-improvement readers.
- **Revenue estimates are rough.** Based on existing Amazon signal + (direct margin / Amazon margin). If wrong, adjust after Week 2 actual data.
- **Founder override is expected.** Founder may have strong intuition on which book will sell better direct. That's valid. CEO role is to surface data; founder decides.

---

**Attached:** This workflow is ready to execute Sunday morning. No re-planning needed. Just execute & populate inventory.md Section 1 + 2.
