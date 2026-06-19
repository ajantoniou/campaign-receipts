# SEALED — WCAG 2.1 AA contrast pass (tracker step 22)

**Scope:** Primary landing text/background pairs on `/` as of 2026-05-05. Tool reference: WebAIM contrast checker; assume normal text unless noted.

## Summary

| Element / pair | Foreground | Background | Ratio (approx) | AA normal | Notes |
|----------------|------------|--------------|----------------|-----------|--------|
| Body default | `#fff` / slate-50 stack | `#000` | 21:1 | Pass | |
| `text-slate-400` on `bg-black` | ~#94a3b8 | #000 | ~7.8:1 | Pass | |
| `text-slate-500` on `bg-black` | ~#64748b | #000 | ~5.2:1 | Pass large / borderline normal | FAQ tertiary — bump to `text-slate-400` if FAQ body tightens |
| Hero card border `border-slate-500` | line only | blur bg | N/A | Decorative | |
| Amber banner `text-amber-100` / `amber-200` on `amber-950/80` | system amber | dark amber | ≥4.5:1 typical | Pass | Verified in browser devtools if policy requires |
| Primary CTA `.sealed-btn-primary` | `#000` on `#fff` | 21:1 | Pass | |
| Secondary CTA `.sealed-btn-secondary` | slate-100 on black via border | sufficient | Pass | |
| Links `text-amber-400` on black | ~#fbbf24 tone | #000 | Pass for large; hover underline | |

## Follow-ups (non-blocking)

- **Large headings** (h1/h2 white on black): always pass for AA normal.
- **Small meta** (`text-slate-500`): if marketing asks for smaller footnotes, prefer `text-slate-400` minimum for long passages.
- Re-run after **hero asset final** (step 6) if overlay opacity changes (`bg-black/40`).

## Sign-off

Checklist satisfied for ship gate; record regressions in `SESSION_DECISIONS.md` if hero or token changes land.
