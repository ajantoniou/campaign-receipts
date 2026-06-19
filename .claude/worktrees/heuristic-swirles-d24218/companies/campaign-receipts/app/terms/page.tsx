import Link from 'next/link'
import { FileText, Code, AlertTriangle, Scale } from 'lucide-react'

export const metadata = {
  title: 'Terms of use — CampaignReceipts',
  description: 'The plain-English terms for using CampaignReceipts.com, embedding its scorecards, and citing its verdicts.',
}

export default function TermsPage() {
  return (
    <>
      <section className="border-b border-ink-800/60">
        <div className="section-shell pt-16 pb-10">
          <div className="eyebrow mb-3">Using the site</div>
          <h1 className="text-display-lg text-ink-50 text-balance">Terms of use</h1>
          <p className="mt-5 text-lg text-ink-300 max-w-2xl leading-relaxed">
            Last updated: May 13, 2026. Use of CampaignReceipts.com means you agree to the terms below.
          </p>
        </div>
      </section>

      <article className="section-shell py-12 grid lg:grid-cols-[1fr_280px] gap-12">
        <div className="space-y-10 max-w-3xl text-[15px] text-ink-300 leading-relaxed">
          <Block icon={FileText} title="What you can do">
            <ul className="space-y-2.5 list-disc pl-5">
              <li>Read, share, quote, and screenshot any page on this site, for any non-commercial purpose, with attribution to <strong className="text-ink-100">campaignreceipts.com</strong>.</li>
              <li>Embed individual politician scorecards on your own site via the iframe widget documented at <Link href="/embed" className="text-amber-400 underline-offset-4 hover:underline">/embed</Link>, provided the attribution footer in the iframe remains intact.</li>
              <li>Quote verdicts and reasoning in articles, classroom material, social posts, or research, with a link back to the politician&rsquo;s page on this site.</li>
            </ul>
          </Block>

          <Block icon={AlertTriangle} title="What you can't do">
            <ul className="space-y-2.5 list-disc pl-5">
              <li>Re-publish the full database (politicians, promises, receipts) as your own product or service.</li>
              <li>Use the site or its content as if it were a paid political advertisement, endorsement, or attack ad.</li>
              <li>Scrape the site at a rate that materially affects performance for other users, or attempt to circumvent rate limits and security measures.</li>
              <li>Misrepresent verdicts, omit dissenting context, or alter promise text and present it as ours.</li>
            </ul>
          </Block>

          <Block icon={Code} title="The embed widget">
            The embed at <Link href="/embed" className="text-amber-400 underline-offset-4 hover:underline">/embed/p/[slug]</Link> is free for editorial use. The iframe includes an attribution line that must remain visible. The data inside the widget updates live, so embeds you place today reflect our latest verdicts indefinitely. If your site has strict content-security policies that block iframes, contact us and we&rsquo;ll help.
          </Block>

          <Block icon={Scale} title="Content is provided as-is">
            We work in good faith from primary-source records but make no warranty &mdash; express or implied &mdash; that every verdict is accurate, every receipt is current, or that the site will be free of errors. Use of the site is at your own risk. See <Link href="/disclaimer" className="text-amber-400 underline-offset-4 hover:underline">/disclaimer</Link> for the full editorial caveat.
          </Block>

          <Block icon={AlertTriangle} title="Limitation of liability">
            To the maximum extent permitted by applicable law, CampaignReceipts is not liable for any indirect, incidental, consequential, or punitive damages arising from your use of the site or reliance on its content. Our total liability to any user is capped at $50 USD, the cost of a refundable nominal-value adjudication.
          </Block>

          <Block icon={FileText} title="Disputes about verdicts">
            If you believe a specific verdict is wrong, email <a className="text-amber-400 underline-offset-4 hover:underline" href="mailto:disputes@campaignreceipts.com">disputes@campaignreceipts.com</a> with the politician&rsquo;s name, the verdict number, and the primary source you believe contradicts our finding. We respond within 7 days and apply verified corrections with a public note at <Link href="/corrections" className="text-amber-400 underline-offset-4 hover:underline">/corrections</Link>.
          </Block>

          <Block icon={FileText} title="Changes to these terms">
            We will update these terms in writing here if material changes are needed. The "Last updated" date at the top of this page tracks revisions.
          </Block>

          <Block icon={Scale} title="Governing law">
            These terms are governed by the laws of the State of Delaware, USA, without regard to conflict-of-laws principles. Disputes will be resolved in courts located in Delaware, unless applicable consumer-protection law in your jurisdiction provides otherwise.
          </Block>
        </div>

        <aside className="lg:sticky lg:top-24 self-start hidden lg:block">
          <div className="card-base p-5">
            <div className="eyebrow mb-3">In a sentence</div>
            <p className="text-sm text-ink-300 leading-relaxed">
              Read, share, embed, quote — with attribution. Don&rsquo;t re-publish the full database or use the site as political advertising.
            </p>
            <div className="mt-5 pt-5 border-t border-ink-800/60 text-xs text-ink-500 space-y-2">
              <div>· <Link href="/disclaimer" className="hover:text-ink-300">Disclaimer</Link></div>
              <div>· <Link href="/privacy" className="hover:text-ink-300">Privacy</Link></div>
              <div>· <Link href="/methodology" className="hover:text-ink-300">Methodology</Link></div>
            </div>
          </div>
        </aside>
      </article>
    </>
  )
}

function Block({ icon: Icon, title, children }: { icon: any; title: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="flex items-center gap-3 mb-3">
        <div className="size-9 rounded-md bg-ink-900/80 ring-1 ring-ink-800 flex items-center justify-center">
          <Icon className="size-4.5 text-amber-400" strokeWidth={2} />
        </div>
        <h2 className="text-xl font-semibold text-ink-50 tracking-tight">{title}</h2>
      </div>
      <div className="pl-12">{children}</div>
    </section>
  )
}
