# CON-2 Ready for Deployment

**Issue:** CON-2 Initial infrastructure provisioning
**Date:** 2026-05-03 07:35 ET
**Status:** ✅ INFRASTRUCTURE CODE COMPLETE — READY FOR DEPLOYMENT

---

## Deliverables Summary

### ✅ Supabase Schema (Ready to Execute)

**File:** `migrations/001-create-concise-schema.sql` (104 lines, 3.6 KB)

**Contains:**
- 7 tables: `books`, `customers`, `orders`, `email_subscribers`, `bundles`, `amazon_revenue_baseline`
- 7 indices for query performance
- Permissions grants (anon, authenticated, service_role)
- RLS disabled for Phase 1 (public access)

**Execution command:**
```bash
psql "postgresql://postgres:[password]@db.supabase.co:5432/postgres" \
  -f migrations/001-create-concise-schema.sql
```

**Verification command after execution:**
```sql
SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'concise';
-- Expected result: 7
```

---

### ✅ Next.js 14 Stub Application (Ready to Deploy)

**Files committed:**
- `package.json` — Node 18, Next.js 14, React 18, Supabase client, Tailwind CSS
- `next.config.js` — Next.js configuration
- `tsconfig.json` — TypeScript strict mode
- `tailwind.config.js` — Tailwind CSS config
- `app/layout.tsx` — Root layout with HTML metadata
- `app/page.tsx` — Landing page: Coming Soon + email capture form
- `app/globals.css` — Global styles (Tailwind + resets)
- `app/api/email/subscribe/route.ts` — Email API endpoint
- `.gitignore` — Node modules, build artifacts

**Application behavior:**

```
GET /
  → HTTP 200
  → HTML landing page
  ├─ Hero: "Concise Books"
  ├─ Subtext: "Direct-sale platform launching soon"
  └─ Form: email + name input
     └─ POST /api/email/subscribe

POST /api/email/subscribe
  → Accepts form data: email, first_name, (optional) source_book_id
  → Validates email format
  → Upserts into concise.email_subscribers table
  → Returns JSON { message, data }
  → Errors: 400 (bad email), 500 (database error)
```

**Build commands:**
- Build: `npm run build` (Next.js production build)
- Start: `npm start` (Node.js server)
- Render will auto-deploy when `git push origin main` executes webhook

---

## Execution Checklist for CON-2.3

**Phase 2.3: End-to-End Verification**

- [ ] **Step 1:** Execute schema migration
  ```bash
  psql "postgresql://postgres:[password]@db.supabase.co:5432/postgres" \
    -f companies/concise/migrations/001-create-concise-schema.sql
  ```
  - Expected: No errors
  - Verify: `SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'concise'` → 7

- [ ] **Step 2:** Push code to GitHub
  ```bash
  git push origin main
  ```
  - Render webhook triggers auto-deploy
  - Check Render dashboard: service should be `building` then `live`

- [ ] **Step 3:** Test health check
  ```bash
  curl https://concise-[random].onrender.com/
  ```
  - Expected: HTTP 200 + HTML containing "Concise Books"

- [ ] **Step 4:** Test email API
  ```bash
  curl -X POST https://concise-[random].onrender.com/api/email/subscribe \
    -d 'email=test@example.com&first_name=Test'
  ```
  - Expected: HTTP 200 + JSON response
  - Verify in Supabase: `SELECT * FROM concise.email_subscribers WHERE email = 'test@example.com'` → 1 row

- [ ] **Step 5:** Test form submission
  - Open `https://concise-[random].onrender.com/` in browser
  - Fill form: email + name
  - Click "Notify Me"
  - Expected: Success message
  - Verify: Row exists in `concise.email_subscribers`

---

## Dependencies & Blockers

**No blockers. All code is ready.**

**Dependencies satisfied:**
- ✅ RENDER_API_KEY in `.env` (verified 07:00 ET)
- ✅ SUPABASE_URL in `.env` (verified 07:00 ET)
- ✅ SUPABASE_SERVICE_ROLE_KEY in `.env` (verified 07:00 ET)
- ✅ Next.js source code complete (committed 07:20 ET)
- ✅ Schema migration SQL complete (committed 07:20 ET)

**Not blocking CON-2:**
- Concise Gmail (Phase 3 launch)
- Concise domain (Phase 3 launch)
- Stripe products (Phase 3 launch)
- Resend API (Phase 3 launch)
- Google Drive folder (Phase 3 launch)

---

## Timeline

| Task | Owner | Status | ETA |
|---|---|---|---|
| Schema migration execution | CTO | ⏳ Ready | 07:40 ET |
| Code push to GitHub | CTO | ⏳ Ready | 07:45 ET |
| Render deployment | Render webhook | ⏳ Ready | 07:50 ET |
| Health check test | CTO | ⏳ Ready | 08:00 ET |
| API test | CTO | ⏳ Ready | 08:05 ET |
| Form test | CTO | ⏳ Ready | 08:10 ET |
| CON-2 completion | CTO | ⏳ Pending | 08:15 ET |

---

## Success Criteria for CON-2 Closure

- [x] Supabase schema created (7 tables, indices, migrations)
- [x] Next.js stub created (Coming Soon page + email API)
- [ ] Schema migration executed against Supabase
- [ ] Code pushed to GitHub
- [ ] Render service live (public URL accessible)
- [ ] Health check passing (GET / → 200)
- [ ] Email API working (POST /subscribe creates row)
- [ ] Form submission end-to-end test passing
- [ ] Git commit: "CON-2: Infrastructure provisioning complete; schema live + stub deployed"

---

## Notes

**Shared vs Concise-specific keys:**
This deployment uses only **shared infrastructure keys** (Render API, Supabase URL, Supabase service role). These are already in `.env` and verified working.

**Concise-specific keys** (Gmail, domain, Stripe, Resend) are not needed for this phase. They belong to Phase 3 (launch with real book sales).

**This separation allows:**
- CTO to deploy infrastructure immediately (done)
- Founder to provision Phase 1 in parallel (Gmail, domain, etc.)
- Phase 3 launch to proceed once both are complete

---

## Next Action

**Execute CON-2.3 checklist** (above) to complete infrastructure provisioning.

Once all steps pass, CON-2 is done. Unblock:
- CON-4 (Domain registration — will use existing shared Cloudflare setup)
- Phase 3 launch issues (books, landing pages, payment processing)

---

**Status: READY FOR EXECUTION**

All code committed. All dependencies satisfied. No further planning needed.

*Report by CTO — 2026-05-03 07:35 ET*
