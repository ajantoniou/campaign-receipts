// GET /api/dossier/[type]/[id] — the gated connection dossier (brief §3 + §4).
//
// type ∈ politician | donor | bill | vote.
// - Bundle is assembled from pure SQL (deterministic, sourced).
// - FREE users get the bundle headline + fact/connection COUNTS + a locked flag.
//   No Opus call → no $ spent on anonymous traffic.
// - PRO users get the Opus-written dossier prose. Opus only WRITES from the
//   bundle; it never recalls. Response cached in cr_dossier_cache by inputs_hash.
import { NextResponse } from 'next/server'
import { getEntitlement } from '@/lib/entitlement'
import { getDossier, type EntityType } from '@/lib/dossier'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const VALID: EntityType[] = ['politician', 'donor', 'bill', 'vote']

export async function GET(_req: Request, { params }: { params: { type: string; id: string } }) {
  const type = params.type as EntityType
  if (!VALID.includes(type)) {
    return NextResponse.json({ error: 'Unknown entity type' }, { status: 400 })
  }
  const id = decodeURIComponent(params.id)

  const ent = await getEntitlement()
  const isPro = ent.tier === 'pro'

  try {
    const result = await getDossier(type, id, { withProse: isPro })
    if (!result) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }

    if (!isPro) {
      // Free teaser: headline + how much is behind the gate. No prose, no Opus.
      return NextResponse.json({
        tier: 'free',
        locked: true,
        entity: result.bundle.entity,
        headline: result.headline,
        fact_count: result.factCount,
        connection_count: result.crossLinkCount,
        upgrade_url: '/pricing',
      })
    }

    return NextResponse.json({
      tier: 'pro',
      locked: false,
      entity: result.bundle.entity,
      headline: result.headline,
      dossier_md: result.dossierMd,
      bundle: result.bundle, // Pro gets the raw sourced bundle too (auditability)
      cached: result.cached,
    })
  } catch (err) {
    console.error('dossier error:', err)
    return NextResponse.json({ error: 'Dossier unavailable' }, { status: 502 })
  }
}
