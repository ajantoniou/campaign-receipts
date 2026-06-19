import Link from 'next/link'
import { AlertTriangle, BookOpen, Scale, Mail } from 'lucide-react'

export const metadata = {
  title: 'Disclaimer — CampaignReceipts',
  description:
    'Educational and informational use only. How CampaignReceipts arrives at verdicts, what they mean, and what they explicitly do not constitute.',
}

export default function DisclaimerPage() {
  return (
    <>
      <section className="border-b border-ink-800/60">
        <div className="section-shell pt-16 pb-10">
          <div className="eyebrow mb-3">Important</div>
          <h1 className="text-display-lg text-ink-50 text-balance">Disclaimer</h1>
          <p className="mt-5 text-lg text-ink-300 max-w-2xl leading-relaxed">
            Read this once. It explains what CampaignReceipts is, what it isn&rsquo;t, and how to use it responsibly.
          </p>
        </div>
      </section>

      <article className="section-shell py-12 grid lg:grid-cols-[1fr_280px] gap-12">
        <div className="space-y-10 max-w-3xl text-[15px] text-ink-300 leading-relaxed">
          <Block icon={BookOpen} title="Educational and informational use only">
            CampaignReceipts is a free, independently-edited fact-checking archive. It exists to make campaign promises and their outcomes easier for citizens, journalists, and researchers to find and compare. It is not legal advice, voting advice, financial advice, or a paid political communication. We do not endorse any candidate, party, or ballot measure.
          </Block>

          <Block icon={Scale} title="Verdicts are editorial judgments">
            Each verdict — <strong className="text-emerald-400">KEPT</strong>, <strong className="text-amber-400">PARTIAL</strong>, <strong className="text-rose-400">BROKEN</strong>, <strong className="text-violet-400">YOU DECIDE</strong> — is the editorial product of our team applying the published rules at <Link href="/methodology" className="text-amber-400 underline-offset-4 hover:underline">/methodology</Link> to primary-source records (Public Law numbers, Senate and House roll-call votes, executive orders, signed legislation, court rulings). Reasonable readers can and do disagree. Disagreement is the point: we publish the receipts so you can come to your own conclusion.
          </Block>

          <Block icon={AlertTriangle} title="No warranty of completeness or accuracy">
            We work in good faith from the public record but make no guarantee that every receipt is current, every quote is exactly as spoken, or every verdict is final. Politics moves; verdicts can change. We track changes via the monthly spot-audit documented at <Link href="/methodology" className="text-amber-400 underline-offset-4 hover:underline">/methodology</Link> and publish corrections at <Link href="/corrections" className="text-amber-400 underline-offset-4 hover:underline">/corrections</Link>.
          </Block>

          <Block icon={Mail} title="Spotted an error? Tell us.">
            Email <a className="text-amber-400 underline-offset-4 hover:underline" href="mailto:disputes@campaignreceipts.com">disputes@campaignreceipts.com</a> with the politician&rsquo;s name, the specific verdict, and the primary source you believe contradicts our finding. We respond within 7 days. Verified corrections are applied with a public note in the corrections log.
          </Block>

          <Block icon={Scale} title="Photos and attribution">
            Politician photos used on this site come from public-domain government sources (Bioguide, official state and federal portrait galleries) or are replaced by a party-tinted initials fallback when none is available. We do not use AP, Getty, or other commercial wire-service photos. If a photo is used in error, contact us and we&rsquo;ll remove it within 48 hours.
          </Block>

          <Block icon={Scale} title="Not investment, voting, or legal advice">
            Nothing on this site is a recommendation to vote for or against any candidate, donate to any campaign, buy any product, or take any legal action. We do not collect, sell, or share personally identifying information beyond what is described in our <Link href="/privacy" className="text-amber-400 underline-offset-4 hover:underline">privacy policy</Link>.
          </Block>
        </div>

        <aside className="lg:sticky lg:top-24 self-start hidden lg:block">
          <div className="card-base p-5">
            <div className="eyebrow mb-3">In a sentence</div>
            <p className="text-sm text-ink-300 leading-relaxed">
              We publish primary-source-backed verdicts on what politicians promised vs. what they did, for educational use, with a public methodology and a working dispute process.
            </p>
            <div className="mt-5 pt-5 border-t border-ink-800/60 text-xs text-ink-500 space-y-2">
              <div>· <Link href="/methodology" className="hover:text-ink-300">Methodology</Link></div>
              <div>· <Link href="/privacy" className="hover:text-ink-300">Privacy</Link></div>
              <div>· <Link href="/terms" className="hover:text-ink-300">Terms of use</Link></div>
              <div>· <Link href="/corrections" className="hover:text-ink-300">Corrections log</Link></div>
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
