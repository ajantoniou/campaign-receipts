import type { Metadata } from 'next'
import { getBettingSnapshot } from '@/lib/betting-markets'
import { getEntitlement } from '@/lib/entitlement'
import TerminalClient from './TerminalClient'

// Cache this page server-side for 10 minutes so we don't hammer the public API.
export const revalidate = 600

export const metadata: Metadata = {
  title: 'Alpha Terminal — Campaign Receipts',
  description:
    'Institutional predictive market dashboard. Live campaign finance anomalies mapped to political speculation.',
  robots: { index: false, follow: false },
}

export default async function BettingPage() {
  const [snap, ent] = await Promise.all([
    getBettingSnapshot(),
    getEntitlement()
  ])
  
  const hasAccess = ent.hasSoftware

  return <TerminalClient snap={snap} hasAccess={hasAccess} />
}
