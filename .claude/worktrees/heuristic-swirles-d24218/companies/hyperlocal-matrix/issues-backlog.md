# Hyperlocal Matrix — Issues / Backlog

**Status legend:** TODO / IN PROGRESS / BLOCKED / DONE
**Priority legend:** P0-P3

---

## P0 (Saturday/Sunday)

### HM-001: Initial infrastructure provisioning
- **Owner:** Founder → CTO verification
- **Status:** TODO

### HM-002: Brand name proposals
- **Owner:** Brand/Design
- **Output:** 3-5 candidates with domain + USPTO check
- **Status:** TODO

### HM-003: Legal Compliance Watcher initial document drafts
- **Owner:** Legal Compliance Watcher
- **Output:**
  - `compliance/terms-of-service.md` v1
  - `compliance/privacy-policy.md` v1
  - `compliance/moderation-policy.md` v1
  - `compliance/incident-response-playbook.md` v1
  - `compliance/state-by-state-rules.md` (NC + 5 expansion candidates)
- **Status:** TODO

### HM-004: Domain registration + DNS
- **Owner:** DevOps
- **Status:** TODO

### HM-005: Render infrastructure (web + worker)
- **Owner:** DevOps
- **Output:** 2 Render services live with stub
- **Status:** TODO

### HM-006: Supabase schema (`hyperlocal_matrix`)
- **Owner:** Backend Engineer
- **Output:** Tables per `personas/cto.md` schema design
- **Status:** TODO

### HM-007: Architecture decision document
- **Owner:** CTO
- **Output:** `tech-plan/architecture.md` covering: real-time chat
  approach, identity verification flow, moderation pipeline, Stripe
  Connect Express choice, geofencing approach
- **Status:** TODO

### HM-008: Charlotte business research (Plaza Midwood + NoDa + South End)
- **Owner:** Sales & Partnership
- **Output:** `sales/charlotte-prospects.md` with 500+ businesses
  identified, decision-maker info, LinkedIn URLs
- **Status:** TODO

### HM-009: Community Moderator policy v1
- **Owner:** Community Moderator + Legal Compliance Watcher
- **Output:** `moderation/policy.md` (banned/watch/allowed categories,
  workflow, escalations)
- **Status:** TODO

### HM-010: NCMEC platform registration application
- **Owner:** Legal Compliance Watcher
- **Output:** Application drafted; founder signs
- **Status:** TODO

### HM-011: Brand book v1
- **Owner:** Brand/Design
- **Output:** Voice + visual + banned phrases
- **Status:** TODO

### HM-012: DeepSeek vs Haiku A/B test
- **Owner:** CEO + Chief Accountant
- **Status:** TODO

---

## P1 (Week 1)

### HM-020: Landing page v1 (Frontend Engineer)
- **Output:** Hero + waitlist signup + business preview
- **Acceptance:** Email signup works, prospects can submit interest
- **Owner:** Frontend Engineer

### HM-021: Stripe account + Connect Express setup
- **Owner:** CTO + Backend Engineer + Founder (KYC only)
- **Output:** Stripe master account live, Connect Express onboarding
  flow tested with test card

### HM-022: Stripe Identity verification template + 18+ flow design
- **Owner:** Frontend Engineer + Backend Engineer + Legal Compliance
- **Output:** Stripe Identity template configured; UI flow designed
  (not yet built)

### HM-023: First 100 LinkedIn DMs sent (warm-up phase, list-building
       not selling)
- **Owner:** Sales & Partnership
- **Output:** 100 personalized DMs sent introducing platform; tracking
  replies in CRM

### HM-024: Outreach template approval
- **Owner:** Legal Compliance Watcher + Brand/Design
- **Output:** All outreach templates approved before send

### HM-025: Engineering team daily standup discipline established
- **Owner:** CTO
- **Output:** Daily standup format committed; first week token usage
  monitored

---

## P2 (Week 2)

### HM-030: Anonymous user signup flow (Frontend + Backend)
- **Output:** User can sign up, get random username, browse channels
  read-only
- **Acceptance:** Signup works on mobile + desktop

### HM-031: Stripe Identity integration (Frontend + Backend)
- **Output:** User can complete 18+ + CC verification via Stripe
  Identity
- **Acceptance:** Test verification successful, $0 hold appears, user
  can post

### HM-032: Real-time chat infrastructure (Backend Engineer)
- **Output:** Supabase Realtime configured, channels with messages
  table, basic chat UI with optimistic updates
- **Acceptance:** Two test users can chat in real-time

### HM-033: Geofencing logic (Backend + Frontend)
- **Output:** User location → channels within 5-mile radius shown;
  business channels within ~0.5 miles shown
- **Acceptance:** Test users at different locations see different
  channels

### HM-034: 100 more LinkedIn DMs
- **Owner:** Sales & Partnership
- **Acceptance:** Cumulative 200 DMs, tracking replies

### HM-035: Cold email volume kickoff
- **Owner:** Sales & Partnership
- **Output:** Apollo lists assembled, Instantly campaigns warmed up,
  first 250 cold emails sent
- **Acceptance:** No CAN-SPAM complaints

---

## P2-P1 (Week 3)

### HM-040: Moderation pipeline (Backend Engineer + Community Moderator)
- **Output:** LLM pre-screen on every post; flag queue UI for
  Community Moderator; auto-hide on threshold
- **Acceptance:** Test posts route correctly; mod can take action

### HM-041: Business signup flow (Frontend + Backend)
- **Output:** Business signs up → free 3-month trial activated → no
  card collected → trial-end reminder email scheduled
- **Acceptance:** Test business completes signup, sees trial countdown

### HM-042: Stripe Connect business onboarding (Backend Engineer)
- **Output:** Business sees onboarding link to complete Stripe Connect
  Express setup; subscription billing scheduled to start at trial end
- **Acceptance:** Test business completes Connect, $29 charge scheduled
  for end of trial

### HM-043: 200 more LinkedIn DMs (cumulative 400)
- **Owner:** Sales & Partnership

### HM-044: 250 more cold emails (cumulative 500)
- **Owner:** Sales & Partnership

### HM-045: First 5 free trial business signups
- **Owner:** Whole team
- **Acceptance:** 5 businesses in `businesses` table with trial active

---

## P0 — Week 4 (LAUNCH READY)

### HM-050: Premium user $5/mo subscription (Frontend + Backend)
- **Output:** Cross-radius "jump anywhere" UI; Stripe subscription
  flow

### HM-051: Push notifications opt-in (Frontend + Backend)
- **Output:** Web Push integration; user can opt in to nearby
  message alerts

### HM-052: All compliance documents approved + published
- **Owner:** Legal Compliance Watcher + Founder
- **Output:** ToS, Privacy, Moderation Policy live on site
- **Acceptance:** Founder approves; site has consent flow

### HM-053: NCMEC reporting mechanism integrated
- **Owner:** Backend Engineer + Legal Compliance + Community Moderator
- **Acceptance:** Test CSAM-flagged content triggers report flow
  (without sending real test data to NCMEC, obviously)

### HM-054: Public launch announcement
- **Owner:** Brand/Design + CEO
- **Output:** Charlotte-targeted announcement (Reddit, Charlotte
  Magazine reach-out, Plaza Midwood Facebook groups)

### HM-055: Outreach scaling to full volume
- **Owner:** Sales & Partnership
- **Acceptance:** 200 LinkedIn DMs + 50 AI voice + 500 emails/week

### HM-056: AI voice follow-ups begin (warm only)
- **Owner:** Sales & Partnership
- **Acceptance:** First 25 warm follow-up calls completed; no
  reputation incidents

---

## Week 5-10

- HM-060: First paying business (post-trial conversion)
- HM-061: 25+ paying businesses
- HM-062: Premium user signups (target 50 by week 10)
- HM-063: Active user count target 200-500
- HM-064: Charlotte expansion playbook documented
- HM-065: First moderation incident handled (test the system)
- HM-066: Stripe high-risk merchant review passed (if challenged)

---

## Backlog (no priority)

### Phase 2 (post-revenue)

- Native iOS app
- Native Android app
- Posting fee mechanism ($1/mo or $5 lifetime)
- Premium tier improvements (advanced filters, distance customization)
- Business analytics dashboard
- Verified business reviews integration
- Automated trial-conversion campaigns

### Phase 3 (post-Charlotte expansion)

- Matthews launch
- South End launch
- Other Charlotte neighborhoods
- Other metros (Raleigh-Durham, Atlanta, Nashville)
- White-label option for cities

### Future

- Live event channels (concerts, festivals, weather)
- Local government channels (city council meetings, alerts)
- Anonymous local newspaper integration
- Charity / non-profit channels (free)

---

## CEO grooming weekly

Sunday evening:
1. Move completed items to DONE
2. Re-prioritize based on engineering velocity
3. Add issues from McKinsey/YC reviews
4. Add issues from moderation incidents (often surface product gaps)
5. Kill stale issues
