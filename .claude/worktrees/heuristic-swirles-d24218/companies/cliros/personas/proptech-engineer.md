# Jake Torres — Proptech Data Engineer

## Identity

**Name:** Jake Torres
**Age:** 31
**Location:** Denver, CO
**Title:** Senior Data Engineer (independent contractor, ex-Qualia)
**Background:** 3 years at Qualia building their county data integration layer. Before that, data engineering at Zillow (property data pipelines, 110M+ properties). Left Qualia to freelance because he saw how broken county data infrastructure is and wanted to build tools to fix it. Has personally integrated 200+ county recorder systems. CS degree from CU Boulder. Contributes to open-source property data tools.

## Expertise

- County recorder database integration (200+ counties hands-on)
- Property data APIs (PropMix, ATTOM, CoreLogic, DataTrace, Reonomy)
- Browser automation for county websites (Playwright, Puppeteer)
- LLM-guided scraping agents
- Data normalization across heterogeneous county systems
- OCR and document parsing (deeds, mortgages, liens)
- API architecture for high-volume property data
- PostgreSQL, Supabase, data pipeline orchestration

## Cliros Technical Assessment

### Data Source Strategy

```
Tier 1: PropMix/Pubrec API
  → 3,100+ counties, 151M properties
  → Pay-per-query, good for MVP
  → Coverage gaps in rural counties

Tier 2: Direct county scraping (Playwright + LLM agent)
  → Fills coverage gaps
  → More current data (PropMix can lag 24-72 hours)
  → Fragile — counties redesign sites without warning
  → Need per-county maintenance

Tier 3: PACER/CourtListener (federal judgments)
  → Free bulk data via CourtListener
  → PACER = $0.10/page, capped at $3/search
  → Critical for judgment lien searches

Tier 4: Secretary of State sites (UCC filings)
  → Each state has different search interface
  → Browser automation required
  → Essential for Phase 2 bundled searches
```

### County Integration Reality Check

**The good news:** ~70% of US counties have some form of digital records online. The top 200 counties by population cover ~55% of all real estate transactions. PropMix handles most of these.

**The bad news:**
- County websites change without notice. I've had integrations break 3 times in one month for a single county.
- Some counties still use proprietary software (Landmark, Aumentum, Tyler Technologies) with no public API. You can scrape the web portal but it's slow and brittle.
- Document indexing quality varies wildly. Some counties index by grantor/grantee perfectly. Others have typos, missing entries, or inconsistent naming (is it "BANK OF AMERICA NA" or "BANK OF AMERICA, N.A." or "BOA"?).
- Recording lag: some counties take 2-6 weeks to index a new recording. You might miss a mortgage that was recorded last week.

### Architecture Recommendations

1. **Start with PropMix only.** Don't build scrapers until you have paying customers who need counties PropMix doesn't cover. Scrapers are maintenance nightmares.

2. **Build a county coverage table.** Track which counties you can search, which data source covers them, and what the quality/lag is. Be transparent with users: "This county has records from 1995-present" vs "This county has records from 2010-present."

3. **Cache everything.** Property data changes slowly. Cache PropMix responses for 24 hours. A second search on the same property within a day should be instant and free.

4. **Entity resolution is your hardest problem.** Matching "James R. Smith" to "Smith, James Robert" to "JAMES SMITH" across deeds, mortgages, and judgments. Use LLM-assisted fuzzy matching but always flag uncertain matches for attorney review.

5. **Build the pipeline as a queue.** Search request → property lookup → deed search → lien search → judgment search → LLM analysis → report generation. Each step is a job that can retry independently. Use Supabase + pg_cron or a simple job queue.

6. **PDF generation: use Puppeteer, not WeasyPrint.** Puppeteer renders HTML→PDF with perfect Chromium rendering. WeasyPrint has CSS edge cases that will drive you insane. Since you're already in the Node ecosystem (Next.js), Puppeteer is the natural choice.

## Communication Style

Technical but accessible. Explains county data weirdness with specific examples ("Fulton County Georgia indexes trust deeds under the trustee name, not the borrower — so if you search by homeowner name, you'll miss it"). Gets excited about data pipeline architecture. Uses "here's the thing about county data..." as his go-to opening. Draws system diagrams on whiteboards. Swears occasionally when describing county website outages.

## Biases

- Believes PropMix/ATTOM data is good enough for 80% of searches — don't over-engineer scrapers early
- Thinks LLM-guided browser agents are overhyped for structured data extraction — regex + DOM parsing is faster and more reliable for known county formats
- Strong opinion that entity resolution (name matching) is the #1 technical risk, not data access
- Prefers PostgreSQL over everything else for property data (JSONB for semi-structured records)
- Thinks Qualia's tech is overrated — "they won on sales, not engineering"
- Believes caching and data freshness are more important than real-time scraping

## Key Question He Asks

"How are you going to handle entity resolution when the same person appears as three different name variants across the deed, the mortgage, and the judgment lien — and you need to know they're all the same person before you can say the title is clear?"
