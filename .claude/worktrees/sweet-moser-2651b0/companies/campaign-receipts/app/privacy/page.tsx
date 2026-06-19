import Link from 'next/link'
import { Eye, Database, Cookie, Mail } from 'lucide-react'

export const metadata = {
  title: 'Privacy — CampaignReceipts',
  description: 'What CampaignReceipts collects, what it does not, and how to contact us about your data.',
}

export default function PrivacyPage() {
  return (
    <>
      <section className="border-b border-ink-800/60">
        <div className="section-shell pt-16 pb-10">
          <div className="eyebrow mb-3">Your data, briefly</div>
          <h1 className="text-display-lg text-ink-50 text-balance">Privacy policy</h1>
          <p className="mt-5 text-lg text-ink-300 max-w-2xl leading-relaxed">
            Last updated: May 13, 2026. This is the entire policy. It is short on purpose.
          </p>
        </div>
      </section>

      <article className="section-shell py-12 grid lg:grid-cols-[1fr_280px] gap-12">
        <div className="space-y-10 max-w-3xl text-[15px] text-ink-300 leading-relaxed">
          <Block icon={Eye} title="What we collect">
            <ul className="space-y-2.5 list-disc pl-5">
              <li>
                <strong className="text-ink-100">Aggregate site analytics</strong> via Cloudflare Web Analytics &mdash; a privacy-friendly tool that does not use cookies and does not fingerprint individual visitors. It records page-view counts, referring URLs, and country-level geography, all anonymized in aggregate.
              </li>
              <li>
                <strong className="text-ink-100">Email addresses you submit</strong> &mdash; only if you sign up for a politician&rsquo;s waitlist, send a dispute via the dispute form, or contact us by email. Stored in our Supabase database. Used solely to send what you asked for and to respond to your specific inquiry.
              </li>
              <li>
                <strong className="text-ink-100">Server access logs</strong> &mdash; standard web-server records from our hosting provider (Render) including IP address, user agent, and request path. Retained for security and debugging.
              </li>
            </ul>
          </Block>

          <Block icon={Cookie} title="What we do not collect">
            We do not set advertising cookies. We do not embed third-party trackers like Google Analytics, Meta Pixel, or TikTok Pixel. We do not sell, share, or monetize visitor data in any way. We do not have an advertising business.
          </Block>

          <Block icon={Database} title="Where we store it">
            Email addresses and dispute records sit in a Supabase Postgres database (Row-Level Security enabled). Photos and static assets live on Render and Cloudflare. We use no third-party data brokers or marketing tooling.
          </Block>

          <Block icon={Mail} title="Your rights">
            You can ask us to delete any record we hold about you by emailing <a className="text-amber-400 underline-offset-4 hover:underline" href="mailto:privacy@campaignreceipts.com">privacy@campaignreceipts.com</a>. We will delete it within 30 days. There is no account to close because we don&rsquo;t require accounts.
          </Block>

          <Block icon={Eye} title="Children">
            CampaignReceipts is a public-record educational tool intended for general audiences. We do not knowingly collect information from anyone under 13. If you believe a child has submitted information through the dispute or waitlist forms, contact <a className="text-amber-400 underline-offset-4 hover:underline" href="mailto:privacy@campaignreceipts.com">privacy@campaignreceipts.com</a> and we will delete it.
          </Block>

          <Block icon={Eye} title="Changes to this policy">
            We will update this policy in writing here if our data practices change. Material changes will be noted at the top of this page with a new "Last updated" date.
          </Block>
        </div>

        <aside className="lg:sticky lg:top-24 self-start hidden lg:block">
          <div className="card-base p-5">
            <div className="eyebrow mb-3">In a sentence</div>
            <p className="text-sm text-ink-300 leading-relaxed">
              We use cookieless analytics. We don&rsquo;t sell your data. If you email us, we store the email only to reply.
            </p>
            <div className="mt-5 pt-5 border-t border-ink-800/60 text-xs text-ink-500 space-y-2">
              <div>· <Link href="/terms" className="hover:text-ink-300">Terms of use</Link></div>
              <div>· <Link href="/disclaimer" className="hover:text-ink-300">Disclaimer</Link></div>
              <div>· <a href="mailto:privacy@campaignreceipts.com" className="hover:text-ink-300">privacy@campaignreceipts.com</a></div>
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
