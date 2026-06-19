import Link from 'next/link'
import { CompanyPhoneLink } from '../../../shared/react/CompanyPhoneLink'

type SiteFooterProps = {
  shareText?: string
  shareUrl?: string
}

/** Global footer — full grid on homepage (with share), compact on inner pages. */
export function SiteFooter({ shareText, shareUrl }: SiteFooterProps) {
  const showShare = Boolean(shareText && shareUrl)

  return (
    <footer className="bg-parchment-300 px-6 py-16 text-ink-700">
      <div className="mx-auto max-w-6xl">
        <div
          className={`grid gap-10 sm:grid-cols-2 ${showShare ? 'lg:grid-cols-4' : 'lg:grid-cols-3'}`}
        >
          <div>
            <p className="font-serif text-lg font-bold tracking-[0.16em] text-ink-900">SEALED</p>
            <p className="mt-2 text-sm text-ink-600">The 2016 Promises — Before the Deals</p>
          </div>
          <div className="space-y-3 text-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-500">Legal</p>
            <p>
              <Link href="/privacy" className="transition hover:text-civic-blue">
                Privacy
              </Link>
            </p>
            <p>
              <Link href="/terms" className="transition hover:text-civic-blue">
                Terms
              </Link>
            </p>
          </div>
          <div className="space-y-3 text-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-500">Support</p>
            <p>
              <Link href="/contact" className="transition hover:text-civic-blue">
                Contact
              </Link>
            </p>
            <p>
              <CompanyPhoneLink className="transition hover:text-civic-blue" />
            </p>
            <p>
              <a href="mailto:support@sealed2016.com" className="transition hover:text-civic-blue">
                support@sealed2016.com
              </a>
            </p>
          </div>
          {showShare ? (
            <div className="space-y-3 text-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-ink-500">Share</p>
              <p>
                <a
                  href={`https://twitter.com/intent/tweet?text=${shareText}&url=${shareUrl}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition hover:text-civic-blue"
                >
                  Post on X
                </a>
              </p>
              <p>
                <a
                  href={`https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition hover:text-civic-blue"
                >
                  Share on LinkedIn
                </a>
              </p>
            </div>
          ) : null}
        </div>

        <div className="mt-14 border-t border-ink-900/15 pt-8 text-center text-xs text-ink-600">
          <p>SEALED © 2026 · Published by SEALED Press</p>
          <p className="mt-2">
            Powered by the{' '}
            <a
              href="https://campaignreceipts.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-civic-blue underline-offset-4 transition hover:underline"
            >
              CampaignReceipts.com
            </a>{' '}
            research, data, and analytics team.
          </p>
          <p className="mt-3 max-w-2xl mx-auto leading-relaxed">
            A historical archive of campaign statements paired with primary-source records. No claim of
            partisan alignment.
          </p>
        </div>
      </div>
    </footer>
  )
}
