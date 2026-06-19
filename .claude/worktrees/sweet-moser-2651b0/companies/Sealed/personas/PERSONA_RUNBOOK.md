# SEALED Press — persona-scoped execution map

Use this file so **Paperclip / Cursor** agents pick up work in the right **SOUL** lane. Parent personas live under [**Concise**](../../concise/personas/) for literary + editorial continuity.

| Persona | SOUL / bundle | Owns in `concise-sealed/` |
|---------|----------------|---------------------------|
| **Literary Agent** | [`concise/personas/literary-agent/`](../../concise/personas/literary-agent/) | Manuscript, proof-quote checklist, press kit **quotes**, sample excerpt accuracy |
| **Brand & Design** | [`concise/brand/`](../../concise/brand/) + sealed landing | Visual tokens, press kit **design facts**, launch visuals |
| **Head of Growth** | Marketing hooks | Welcome sequence, launch-day copy pack, outreach angles |
| **Sales agent** _(optional Paperclip role)_ | Pipeline lists | Pre-launch outreach table |
| **CTO** | Next.js + APIs + PDF/epub tooling | `/sample`, `artifacts/`, `scripts/`, deploy health |

**Batch rule:** Each markdown deliverable in [`marketing/`](../marketing/) starts with **Owner:** + **Persona:** frontmatter fields so Soul-scoped agents don’t cross streams.

## Founder rule (2026-05-07) — write for the average American reader

The SEALED audience is the **average American** (~100 IQ, on a phone, no policy degree). All customer-facing copy — manuscript, sample PDF, landing page, marketing — must:

- Hit a **6th-grade reading level**. Average sentence ≤ 16 words. Average paragraph 2–4 sentences. Common words over Latinate jargon. One idea per sentence. Active voice.
- **Pair concepts with simple visuals.** When a paragraph explains a comparison, a sequence, a cause-and-effect chain, or a numeric trend, ship a wireframe-style **comparison box**, **timeline**, or **cause-effect chain** alongside the prose. The reader should grasp the shape of the argument from the diagrams alone.
- **Self-test before shipping.** If you stumble reading a paragraph aloud, or if a 12-year-old would lose the thread, rewrite it.

This rule is hard-locked in the **Literary Agent** persona at [`../../concise/personas/literary-agent.md` — Section 3](../../concise/personas/literary-agent.md). The **Book Illustrator** ([`../../concise/personas/book-illustrator.md`](../../concise/personas/book-illustrator.md)) is the default partner for production-grade diagrams.
