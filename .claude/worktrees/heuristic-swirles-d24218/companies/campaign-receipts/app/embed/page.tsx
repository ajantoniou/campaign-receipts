// Documentation page for the embed widget. Tells journalists/Substackers
// how to drop a politician scorecard into their own page with one iframe.

import Link from 'next/link'
import { Code, Copy } from 'lucide-react'

export default function EmbedDocsPage() {
  const exampleSlug = 'donald-trump'
  const iframeSnippet = `<iframe
  src="https://campaignreceipts.com/embed/p/${exampleSlug}"
  width="100%"
  height="640"
  style="border:none;background:transparent;max-width:760px"
  loading="lazy"
  title="CampaignReceipts politician scorecard"
></iframe>`

  return (
    <>
      <section className="border-b border-ink-800/60">
        <div className="section-shell pt-16 pb-10">
          <div className="eyebrow mb-3">Reuse the receipts</div>
          <h1 className="text-display-lg text-ink-50 text-balance">
            Embed any scorecard on your site
          </h1>
          <p className="mt-5 text-lg text-ink-300 max-w-2xl leading-relaxed">
            Drop a CampaignReceipts politician scorecard onto your blog, Substack, or news article. No tracking, no auth, no API key — just one iframe.
          </p>
        </div>
      </section>

      <article className="section-shell py-10 grid lg:grid-cols-[1fr_300px] gap-10">
        <div className="space-y-10 max-w-3xl">
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Code className="size-4 text-amber-400" />
              <h2 className="text-xl font-semibold text-ink-50 tracking-tight">The snippet</h2>
            </div>
            <pre className="rounded-lg ring-1 ring-ink-800 bg-ink-950 p-5 text-[13px] text-ink-200 leading-relaxed overflow-x-auto font-mono">
{iframeSnippet}
            </pre>
            <p className="mt-3 text-sm text-ink-400 leading-relaxed">
              Replace <code className="text-amber-300 bg-ink-900 px-1 rounded">{exampleSlug}</code> with any politician&rsquo;s slug. The slug is the last segment of their URL on this site — e.g. <code className="text-amber-300 bg-ink-900 px-1 rounded">alexandria-ocasio-cortez</code>.
            </p>
          </section>

          <section>
            <div className="flex items-center gap-2 mb-3">
              <Copy className="size-4 text-amber-400" />
              <h2 className="text-xl font-semibold text-ink-50 tracking-tight">What renders</h2>
            </div>
            <p className="text-sm text-ink-300 leading-relaxed">
              The embed renders the full VerdictCard — photo, term boundaries, the kept-% or pending-count hero number, a four-color ScorecardBar, and a &ldquo;Verified [date]&rdquo; stamp. It links back to the politician&rsquo;s full page on this site.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-ink-50 tracking-tight mb-3">Attribution</h2>
            <p className="text-sm text-ink-300 leading-relaxed">
              The embedded card includes a footer line reading <code className="text-amber-300 bg-ink-900 px-1 rounded">campaignreceipts.com/politician/[slug]</code>. Please leave it intact — it&rsquo;s how readers find the underlying receipts.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-ink-50 tracking-tight mb-3">Updates</h2>
            <p className="text-sm text-ink-300 leading-relaxed">
              The widget reads live data from this site, so verdicts update automatically as our editorial review continues. The <Link href="/methodology" className="text-amber-400 underline-offset-4 hover:underline">methodology</Link> page documents how we grade.
            </p>
          </section>
        </div>

        <aside className="lg:sticky lg:top-24 self-start hidden lg:block">
          <div className="card-base p-5">
            <div className="eyebrow mb-3">Try it now</div>
            <div className="rounded-lg ring-1 ring-ink-800 bg-ink-950 p-4">
              <iframe
                src={`/embed/p/${exampleSlug}`}
                width="100%"
                height="380"
                style={{ border: 'none', background: 'transparent' }}
                loading="lazy"
                title="Embed preview"
              />
            </div>
            <p className="mt-3 text-[11px] text-ink-500 leading-relaxed">
              Live preview of the embed iframe. Resize this column to see how it adapts.
            </p>
          </div>
        </aside>
      </article>
    </>
  )
}
