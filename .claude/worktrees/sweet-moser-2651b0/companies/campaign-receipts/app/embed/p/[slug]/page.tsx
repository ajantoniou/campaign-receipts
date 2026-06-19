// Minimal embeddable widget — designed to be iframed from external blogs,
// Substack posts, news sites. No nav chrome, no sticky bar, just the
// VerdictCard. The lead: 'Local newspapers and Substack writers will use it.'

import { supabaseService, type Politician } from '@/lib/supabase'
import { notFound } from 'next/navigation'
import VerdictCard from '@/app/components/VerdictCard'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const { data } = await supabaseService
    .from('cr_politicians')
    .select('name, party, branch, state')
    .eq('slug', params.slug)
    .single()
  if (!data) return { title: 'Politician scorecard' }
  return {
    title: `${(data as any).name} — promise scorecard`,
    robots: { index: false, follow: true },
  }
}

export default async function EmbedPage({ params }: { params: { slug: string } }) {
  const { data } = await supabaseService
    .from('cr_politicians')
    .select('*')
    .eq('slug', params.slug)
    .single()
  if (!data) notFound()
  const politician = data as Politician

  return (
    <main className="bg-transparent p-4 max-w-3xl mx-auto">
      <a
        href={`https://campaignreceipts.com/politician/${politician.slug}`}
        target="_blank"
        rel="noopener noreferrer"
        className="block"
        aria-label={`Open ${politician.name}'s full scorecard on CampaignReceipts`}
      >
        <VerdictCard politician={politician} />
      </a>
    </main>
  )
}
