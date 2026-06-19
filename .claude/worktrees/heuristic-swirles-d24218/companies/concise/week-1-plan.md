# Concise — Week 1 Day-by-Day Plan

**Week of 2026-05-02 (Saturday) through 2026-05-08 (Friday)**

---

## Saturday 2026-05-02 — Provisioning

### Founder (~2 hours one-time)
1. Gmail account creation
2. Cloudflare register domain
3. Render: 1 web service
4. Stripe products: setup placeholders for Top 3 books
5. Resend signup + domain verify
6. **Provide CONCISE Drive folder access** to CTO (share folder OR
   download books locally for upload to Supabase Storage)
7. Identify Top 3 books for Phase 1 launch (founder ranks)
8. Decide pseudonym vs real-name strategy
9. Decide Trump book cover direction (after Brand proposes Saturday
   afternoon)

### Agent Team (parallel)

#### CEO (Opus 4.7)
- Read all required files
- Post Week 1 plan
- Identify decisions for founder

#### Brand/Design (V4-Pro)
- DELIVERABLE BY 2 PM: 3-5 brand name proposals (continue Concise
  pseudonym brand OR launch fresh brand for direct-sale)
- 3 visual direction mood boards
- DELIVERABLE BY 5 PM: Trump book cover variants (3-5 versions
  including standard, Palestine flag, others)

#### CTO (V4-Pro)
- Verify Render MCP access
- Plan Next.js stack decisions
- Document tech plan

#### Head of Growth (V4-Pro)
- Identify target Reddit subs:
  - r/MCAT (highly engaged pre-med)
  - r/premed (pre-med community)
  - r/conservative or r/politics for Trump book (careful with
    promotion rules)
  - r/selfimprovement for advice books
- Plan TikTok content style + first 3 video concepts

#### Chief Accountant (V4-Pro)
- Verify API keys
- DeepSeek discount confirmation
- Open ledger: $0 spent, $250 cap, weekly burn target $20-30
- Set up Amazon vs direct tracking columns

#### McKinsey + YC Advisors (Opus 4.7)
- Initial 300-word critiques

### Saturday EOD checklist
- [ ] Gmail + domain + Render + Stripe + Resend set up
- [ ] CONCISE Drive folder accessible to CTO
- [ ] Top 3 books identified by founder
- [ ] Trump book cover direction approved by founder
- [ ] Pseudonym vs real-name strategy documented
- [ ] Brand names approved by founder Saturday night
- [ ] DeepSeek A/B test results

---

## Sunday 2026-05-03

### Founder (~10 min)
- Review Saturday standups
- Approve any remaining decisions

### Agent work

#### CTO
- Domain registered
- DNS to Render
- Deploy stub Next.js app
- Inventory existing books from Drive folder

#### Brand/Design
- Brand book v1 (`brand/brand-book.md`)
- Logo wordmark v1
- Cover redesigns for Top 3 books (apply approved direction)
- First chapter free PDFs designed (lead magnets)

#### CTO
- Resend domain verify (SPF, DKIM)
- Supabase `concise` schema with `books`, `customers`, `orders`,
  `email_subscribers` tables
- Upload Top 3 books PDFs to Supabase Storage

#### Head of Growth
- Reddit account ready (use founder's existing or new)
- First "helpful but no link" comment in r/MCAT

### Sunday EOD checklist
- [ ] Web service live with HTTPS
- [ ] Brand book v1 + logo committed
- [ ] Top 3 book PDFs accessible to CTO
- [ ] Reddit presence started
- [ ] First chapter PDFs designed for Top 3

---

## Monday 2026-05-04

### Daily standup (9 AM ET)

#### CTO
- Stripe Payment Links for Top 3 books configured
- Stripe webhook handler scaffold
- Test transaction end-to-end (test card)

#### Brand/Design
- Per-book landing page copy drafted (3 pages)
- Welcome email sequence drafted (5 emails)

#### Head of Growth
- 5 helpful Reddit comments
- First TikTok video drafted

#### CEO
- Compile standup
- Identify decisions for founder

---

## Tuesday 2026-05-05

#### CTO
- Per-book landing pages live (3 pages)
- Email signup form on each page
- Stripe checkout flow tested

#### Brand/Design
- Cover designs finalized for Top 3
- Each cover applied to landing pages
- Email template designed

#### Head of Growth
- 5 more Reddit comments
- First TikTok video posted
- Pin landing page to Reddit profile bio

---

## Wednesday 2026-05-06

#### CTO
- PDF delivery automation:
  - Stripe webhook → Resend email with secure download link
  - Test end-to-end with real test card
- Email nurture sequence integrated (Resend automation)

#### Brand/Design
- MCAT bundle visual identity (separate from individual books)
- TikTok template v1

#### Head of Growth
- 5 more Reddit comments
- 2nd TikTok video posted
- First targeted post in r/MCAT (helpful + soft mention of Concise
  resources in profile)

#### McKinsey Advisor
- Mid-week pulse: are landing pages converting visitors to email
  signups?
- Critique posted

---

## Thursday 2026-05-07

#### CTO
- MCAT bundle Stripe product ($49-99 — founder approved price)
- Bundle landing page

#### Brand/Design
- Bundle landing page copy + visual

#### Head of Growth
- 3rd TikTok video
- 5 more Reddit comments
- First Twitter post (if Concise has handle; else founder approves
  posting under existing pseudonym handle)

#### Chief Accountant
- Mid-week ledger update
- Amazon vs direct comparison v1 (no direct revenue yet, baseline only)

---

## Friday 2026-05-08 — End of Week 1

### Daily standups

### CEO (mid-day)
- Week 1 retrospective
- Week 2 plan draft

### Chief Accountant
- Friday P&L review
- Cross-company summary

### McKinsey + YC Advisors
- Weekly reviews
- Specific focus: traffic data, conversion data, MCAT bundle
  positioning

### Founder (Friday evening, ~10 min)
- Read summaries
- Approve Week 2 plan
- Approve any pending decisions (4th book to launch, pricing tweaks)

---

## Week 1 success criteria

By EOD Friday 2026-05-08:

### Engineering & Distribution
- [x] Web service live, HTTPS, brand-applied
- [x] Top 3 books on landing pages with Stripe Payment Links
- [x] PDF delivery automated (test purchase succeeds)
- [x] Email capture functional with welcome sequence drafted
- [x] MCAT bundle Stripe product live

### Marketing
- [x] 15+ helpful Reddit comments accumulated
- [x] 3 TikTok videos posted
- [x] First Twitter post under approved handle
- [x] Brand book v1 + logo committed

### Compliance
- [x] No HIPAA/medical claims on MCAT book marketing
- [x] No revealed PII without founder approval
- [x] Refund policy documented

### Spend
- [x] Cumulative spend < $25 (well under $250 cap)

---

## Week 2 preview

- 5+ books direct-sale live
- 50+ email subscribers
- First sale (target 1-3 sales)
- 30+ Reddit comments
- 5+ TikTok videos
- Customer support flow tested
- Affiliate program brainstorm started

Detail in `plans/week-2026-05-09.md` (CEO writes Sunday).
