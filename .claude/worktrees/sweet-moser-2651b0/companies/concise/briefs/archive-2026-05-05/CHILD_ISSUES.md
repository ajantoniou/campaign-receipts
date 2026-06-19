# CON-6 Child Issues — Dependency Tracking

**Parent issue:** CON-6 (Inventory existing books)

**Purpose:** Make blocking dependencies explicit as child issues rather than buried in standups.

---

## Child Issue 1: CN-004 — CONCISE Drive Folder Access (BLOCKING)

**Status:** TODO (CRITICAL BLOCKER)

**Owner:** Founder (Alex)

**Action required:** Share `CONCISE Reads` folder from Google Drive with CTO email

**Impact on CON-6:** Cannot populate inventory until books accessible

**Acceptance criteria:**
- [ ] Founder shares CONCISE Reads folder with CTO via Google Drive
- [ ] CTO confirms files downloadable
- [ ] CTO uploads PDFs to Supabase Storage by Sunday 9 AM

**Estimated time:** 10 minutes

**Blocker on CON-6 unblock:** YES — this must complete by Saturday EOD for Sunday execution

**Next action:** CEO confirms founder provisioning ETA with message: "Drive folder share needed by Saturday 6 PM for Sunday execution."

---

## Child Issue 2: Founder Decision — Brand Name Direction (CN-002, BLOCKING CN-005)

**Status:** AWAITING FOUNDER DECISION

**Owner:** Founder (Alex), Brand/Design decision support

**Decision required:** Approve one of 3 brand options:
- Option 1: Continue pseudonym (safest, fastest)
- Option 2: "Concise" parent brand + pseudonym author (RECOMMENDED)
- Option 3: Completely new brand (risky)

**Reference:** `brand/brand-name-proposals.md` (detailed options, recommendation, mood boards)

**Impact on CON-6:** Determines visual branding for inventory layout + all Week 1 materials

**Acceptance criteria:**
- [ ] Founder selects Option 1, 2, or 3
- [ ] Brand/Design confirms understanding + begins logo design Sunday morning

**Decision deadline:** Saturday EOD

**Blocker on CON-6 unblock:** NO — doesn't block inventory population. Blocks logo + visual branding (parallel track).

**Next action:** CEO presents proposal with recommendation: "Option 2 balances premium positioning + your privacy. Which appeals to you?"

---

## Child Issue 3: Founder Decision — Trump Book Cover Direction (CN-009, BLOCKING visual branding)

**Status:** AWAITING FOUNDER DECISION

**Owner:** Founder (Alex), Brand/Design decision support

**Decision required:** Approve one of 5 cover variants:
1. Standard neutral political cover
2. Palestine flag cover (bold political statement)
3. Abstract political commentary
4. Contrarian fact-check framing
5. Real-name identity reveal

**Reference:** `brand/trump-book-cover-variants.md` (detailed variants, decision matrix, framework)

**Impact on CON-6:** Determines Trump book visual direction + entire direct-sale brand association

**Acceptance criteria:**
- [ ] Founder selects variant 1-5 (or requests hybrid)
- [ ] Brand/Design confirms understanding + begins cover mockup design post-inventory

**Decision deadline:** Saturday EOD

**Blocker on CON-6 unblock:** NO — doesn't block inventory population. Blocks Trump book cover design (downstream).

**Next action:** CEO presents options with risk/reward matrix: "Variants 3-4 balance impact + processability. Which resonates?"

---

## Child Issue 4: Sunday Inventory Execution — Execute Extraction Workflow (CON-6 IMPLEMENTATION)

**Status:** PENDING (depends on CN-004 + books upload)

**Owner:** Brand/Design (executor), CEO (decision support)

**Trigger condition:** Books uploaded to Supabase Storage by Sunday 9 AM

**Action required:** Execute `content/inventory-sunday-checklist.md` (copy-paste steps 1-9)

**Phases:**
- Phase 1: Metadata extraction (title, ASIN, page count) — 45 min
- Phase 2: Amazon performance research (reviews, rating, sales estimate) — 60 min
- Phase 3: Audience tagging (category, difficulty, revenue potential) — 30 min
- Phase 4: Top 3 ranking + documentation — 15 min

**Acceptance criteria:**
- [ ] `inventory.md` Section 1 populated (all 20+ books with metadata)
- [ ] `inventory.md` Section 2 populated (Top 3 candidates with rationale)
- [ ] Git commit with message: "CON-6: Inventory complete; Top 3 identified"
- [ ] Founder approval received on Top 3 (may override, but acknowledged)

**Estimated time:** 2 hours (9 AM → 2 PM Sunday)

**Blocker on CON-6 completion:** YES — this is the implementation phase. Unblocked by CN-004 + founder decisions.

**Next action:** Sunday 9 AM — Brand/Design posts "Inventory extraction starting. ETA 2 PM." and executes checklist.

---

## Child Issue 5: CEO Decision Gate — Confirm Founder ETA on Provisioning (CURRENT, TODAY)

**Status:** IN PROGRESS (CEO action, NOW)

**Owner:** CEO

**Action required:** Contact founder and confirm:
1. When will provisioning (domain, Stripe, Resend, Supabase, **drive folder share**) be complete?
2. Target: Saturday EOD (per week-1-plan.md)
3. If delayed: what's the blocker? Can we help?

**Acceptance criteria:**
- [ ] Founder confirms provisioning ETA (EOD Sat? Sunday morning?)
- [ ] Founder confirms books will be in Supabase Storage by Sunday 9 AM
- [ ] If ETA is slipping: CEO identifies blocker + offers support
- [ ] If ETA is uncertain: CEO escalates to McKinsey/YC advisors (timeline adjustment)

**Decision deadline:** END OF BUSINESS SATURDAY (before team stops for the day)

**Blocker on CON-6 completion:** CRITICAL — if provisioning slips, inventory execution slips by same duration.

**Next action:** CEO sends message to founder: "[Link to FOUNDER_PROVISIONING_CHECKLIST.md]. ETA on completion? Books need to be in Supabase by Sunday 9 AM for inventory execution."

---

## Dependency Chain (Child Issues)

```
CN-004 (Founder provisioning)
  └─ CTO uploads books to Supabase Storage (Sunday 8 AM)
      └─ Child Issue 4 (Inventory execution, Sunday 9 AM - 2 PM)
          └─ CON-6 COMPLETION (inventory.md Sections 1 + 2 populated)
```

**Parallel (doesn't block CON-6 population):**
- Child Issue 2 (Brand decision) → Logo design → Week 1 branding
- Child Issue 3 (Cover decision) → Cover redesigns → Landing pages

**Serial (must resolve before codependent work):**
- Child Issue 5 (CEO confirms founder ETA) → all downstream timing decisions

---

## CEO Action Items (This Heartbeat)

1. **Contact founder NOW (end of business Saturday):**
   ```
   "Concise infrastructure provisioning — what's your ETA on completion?
   Target is EOD today so CTO can upload books to Supabase Sunday morning.
   Books need to be there by 9 AM for inventory execution.

   Any blockers I can help with? (Domain choice? Stripe KYC? Let me know.)"
   ```

2. **If founder says "on track for EOD Sat":**
   - Post: "Provisioning on track. Team: assume books in Supabase Sunday 9 AM. Execute inventory checklist."

3. **If founder says "slipping to Sunday morning":**
   - Post: "Provisioning slipping 1 day. Adjusting timeline: inventory extraction Sunday afternoon → covers Monday → landing pages Wednesday."
   - Escalate to McKinsey/YC: "Timeline shift due to provisioning delay. Still on track for Week 1 launch (Friday). Monitoring."

4. **If founder is blocked:**
   - Identify blocker + offer support (CTO can help Render setup, Brand can help domain naming, etc.)
   - Don't let it slip further.

---

## Status Roll-Up

**CON-6 completion path:**
- [ ] Child Issue 5: CEO confirms founder ETA (TODAY — end of business)
- [ ] Child Issue 1: CN-004 books uploaded (Sunday 9 AM assumption)
- [ ] Child Issue 4: Inventory execution (Sunday 9 AM - 2 PM)
- [ ] CON-6 COMPLETION: inventory.md Sections 1 + 2 (Sunday 2 PM target)

**Parallel work (doesn't delay CON-6):**
- [ ] Child Issue 2: Brand direction approved (Saturday EOD)
- [ ] Child Issue 3: Cover direction approved (Saturday EOD)
- [ ] Logo design (Sunday morning, post-brand approval)
- [ ] Cover redesigns (Sunday afternoon, post-Top 3 identification)

**Next blocker unblock:** Child Issue 5 (CEO confirms founder ETA). If confirmed on track → proceed to Sunday execution. If slipping → escalate + adjust.

---

## Commit Message

Once these child issues are documented, CEO should create a commit that makes them visible:

```
CON-6: Declare child issues to make blockers explicit

Child issues:
1. CN-004: Founder provisioning (books upload) — CRITICAL BLOCKER
2. Brand name decision (CN-002) — founder approval needed
3. Cover direction decision (CN-009) — founder approval needed
4. Sunday inventory execution (CON-6 implementation) — pending CN-004
5. CEO confirmation of founder ETA (TODAY — end of business)

Next: CEO confirms founder provisioning ETA. All downstream work depends on this.
```

---

**This document makes dependency tracking explicit and actionable, rather than buried in standup prose.**