# Hero block UX audit (tracker step 1)

**Scope:** [app/page.tsx](../app/page.tsx) — above-the-fold hero and primary actions.  
**Date:** 2026-05-06

## What works

- Clear headline + sublines; waitlist banner when store is not approved.
- Skip link for keyboard users.
- Sticky header with anchor targets.
- Hero uses separate mobile/desktop art direction (two background assets).

## Gaps (prioritized)

1. ~~**Secondary funnel:**~~ **Done:** `/sample` CTA + price tease in hero (tracker step 12).
2. **Social proof:** No press, volume, or preorder count (testimonial scaffold step 9 pending).
3. **Value compression:** “Why buy” is below the fold — consider one-line proof-of-work in hero (credentialing step 5).
4. **Pricing visibility:** Bundle vs standard only appears in buy section; hero does not telegraph price anchors (step 7).
5. **Trust microcopy:** Hero could cite “primary sources / 2015–2016 record” without legal overclaim (literary-agent).
6. **CTA count:** Three hero actions max; currently two — after adding sample, ensure hierarchy (primary preview, secondary sample, tertiary notify).
7. **Loading / LCP:** Large hero images — add `priority` or `<picture>`/`sizes` (steps 22–23).

## Next actions

- Implement steps 3–5, 8–10 in content blocks; step 12 `/sample` link; steps 16–23 for system polish.
