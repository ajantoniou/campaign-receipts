/* ─── Help Documentation Page ───
   Living self-serve help docs. Renders from src/lib/docs/content.ts —
   edit that file + redeploy to update.

   Structure: left rail of section anchors, right column of content.
   No external markdown deps; all content typed.
*/

import { HELP_SECTIONS } from "@/lib/docs/content";
import Link from "next/link";

export const metadata = {
  title: "Help & Documentation · Cliros",
  description: "How Cliros works, address tips, pricing, refund policy, and how to request features.",
};

export default function DocumentationPage() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <header className="mb-10 pb-6 border-b border-border">
        <h1 className="text-3xl font-bold text-foreground mb-2">Help &amp; Documentation</h1>
        <p className="text-muted mb-4">
          Everything about using Cliros. If you can&apos;t find what you need, email{" "}
          <a href="mailto:support@cliros.ai" className="underline font-medium text-foreground">
            support@cliros.ai
          </a>
          {" "}or, for product ideas,{" "}
          <a href="mailto:alex@cliros.ai" className="underline font-medium text-foreground">
            alex@cliros.ai
          </a>.
        </p>
        <div className="bg-surface border border-border rounded-lg p-4 max-w-md text-sm text-muted">
          Product walkthrough video is paused until the demo report reliably appears in the dashboard.
          Run your first search from{" "}
          <Link href="/dashboard" className="underline font-medium text-foreground">
            New Search
          </Link>{" "}
          or email{" "}
          <a href="mailto:support@cliros.ai" className="underline font-medium text-foreground">
            support@cliros.ai
          </a>{" "}
          for a guided tour.
        </div>
      </header>

      <div className="grid lg:grid-cols-[220px_1fr] gap-10">
        {/* Section nav */}
        <nav aria-label="Documentation sections" className="lg:sticky lg:top-6 self-start">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted mb-3">Sections</p>
          <ul className="space-y-1.5 text-sm">
            {HELP_SECTIONS.map((sec) => (
              <li key={sec.slug}>
                <a
                  href={`#${sec.slug}`}
                  className="block py-1.5 px-2 -mx-2 rounded text-foreground hover:bg-surface transition-colors"
                >
                  {sec.title}
                </a>
              </li>
            ))}
          </ul>
          <div className="mt-8 pt-6 border-t border-border text-xs text-muted">
            <Link href="/dashboard/help" className="underline hover:text-foreground">
              View my tickets →
            </Link>
          </div>
        </nav>

        {/* Content */}
        <article className="space-y-12 max-w-3xl">
          {HELP_SECTIONS.map((sec) => (
            <section key={sec.slug} id={sec.slug} className="scroll-mt-6">
              <h2 className="text-2xl font-bold text-foreground mb-3">{sec.title}</h2>
              {sec.intro && (
                <p className="text-foreground/80 mb-6 leading-relaxed">{sec.intro}</p>
              )}

              {sec.subsections.map((sub, i) => (
                <div key={i} className="mb-8">
                  <h3 className="text-lg font-semibold text-foreground mb-3">{sub.heading}</h3>

                  {sub.body && (
                    <div className="space-y-3 text-foreground/85 leading-relaxed">
                      {sub.body.map((p, j) => (
                        <p key={j}>{p}</p>
                      ))}
                    </div>
                  )}

                  {sub.list && (
                    <ul className="mt-3 space-y-2.5">
                      {sub.list.map((item, j) => (
                        <li key={j} className="text-foreground/85 leading-relaxed">
                          <span className="font-semibold text-foreground">{item.label}</span>
                          {item.detail && <span> — {item.detail}</span>}
                        </li>
                      ))}
                    </ul>
                  )}

                  {sub.callout && (
                    <div
                      className={`mt-4 p-4 rounded-md border text-sm leading-relaxed ${
                        sub.callout.kind === "warning"
                          ? "bg-amber-50 border-amber-200 text-amber-900"
                          : sub.callout.kind === "tip"
                          ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                          : "bg-slate-50 border-slate-200 text-slate-800"
                      }`}
                    >
                      <span className="font-semibold uppercase tracking-wide text-xs mr-2">
                        {sub.callout.kind === "warning" ? "Watch out" : sub.callout.kind === "tip" ? "Tip" : "Note"}
                      </span>
                      {sub.callout.text}
                    </div>
                  )}
                </div>
              ))}
            </section>
          ))}

          {/* Final CTA strip */}
          <section className="mt-16 p-6 bg-surface border border-border rounded-xl">
            <h2 className="text-lg font-bold text-foreground mb-2">Couldn&apos;t find your answer?</h2>
            <p className="text-foreground/80 mb-4">
              We read every email. Most replies go out within one business day.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <a
                href="mailto:support@cliros.ai"
                className="inline-flex items-center justify-center px-5 py-2.5 bg-slate-900 text-white text-sm font-medium rounded-md hover:bg-slate-800 transition-colors"
              >
                Email support@cliros.ai
              </a>
              <a
                href="mailto:alex@cliros.ai"
                className="inline-flex items-center justify-center px-5 py-2.5 border border-slate-900 text-slate-900 text-sm font-medium rounded-md hover:bg-slate-100 transition-colors"
              >
                Email founder (alex@cliros.ai)
              </a>
            </div>
          </section>
        </article>
      </div>
    </div>
  );
}
