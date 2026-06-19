// POST /api/search/session — START a credit-metered Haiku search session.
//
// Gated on hasSoftware. Uses 1 credit (HARD block at 100/mo). Assembles the
// deterministic sourced bundle, runs the FIRST Haiku turn to produce the running
// summary, persists the session, and returns it + the credit meter.
//
// Body: { entity_type: 'politician'|'donor'|'bill'|'vote', entity_id: string }
import { NextResponse } from 'next/server'
import { getEntitlement } from '@/lib/entitlement'
import { getCreditState, useOneCredit } from '@/lib/search-credits'
import { assembleBundle, runTurn, type EntityType } from '@/lib/search-chat'
import { supabaseService } from '@/lib/supabase'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const VALID: EntityType[] = ['politician', 'donor', 'bill', 'vote']

export async function POST(request: Request) {
  const ent = await getEntitlement()
  if (!ent.user) {
    return NextResponse.json({ error: 'Please sign in.' }, { status: 401 })
  }
  if (!ent.hasSoftware) {
    return NextResponse.json(
      { error: 'Donor Intelligence is a paid feature.', upgrade_url: '/pricing' },
      { status: 403 },
    )
  }

  let body: any
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request.' }, { status: 400 })
  }

  const entityType = body?.entity_type as EntityType
  const entityId = typeof body?.entity_id === 'string' ? body.entity_id : ''
  if (!VALID.includes(entityType) || !entityId) {
    return NextResponse.json({ error: 'Pick a politician, donor, bill, or vote.' }, { status: 400 })
  }

  // Assemble the sourced bundle BEFORE spending a credit (no point billing for a 404).
  const bundle = await assembleBundle(entityType, entityId)
  if (!bundle) {
    return NextResponse.json({ error: 'We have no record for that yet.' }, { status: 404 })
  }

  // Check the meter, then spend exactly one credit for this new session.
  const before = await getCreditState(ent.user.id)
  if (before.remaining <= 0) {
    return NextResponse.json(
      {
        error: "You've used all 100 searches this month.",
        credits: { used: before.used, allotment: before.allotment, remaining: 0 },
        resets_at: before.periodEnd,
      },
      { status: 429 },
    )
  }

  const after = await useOneCredit(ent.user.id)
  if (!after) {
    return NextResponse.json(
      { error: "You've used all 100 searches this month.", resets_at: before.periodEnd },
      { status: 429 },
    )
  }

  // First Haiku turn → running summary.
  let turn
  try {
    turn = await runTurn({
      bundle,
      priorMessages: [],
      userText: '',
      currentSummary: '',
      isFirstTurn: true,
    })
  } catch (err) {
    console.error('search session: first turn failed', err)
    return NextResponse.json({ error: 'The research engine is busy. Try again.' }, { status: 502 })
  }

  const messages = [{ role: 'assistant' as const, content: turn.reply }]

  const { data: session, error } = await supabaseService
    .from('cr_search_sessions')
    .insert({
      user_id: ent.user.id,
      entity_type: entityType,
      entity_id: entityId,
      entity_name: bundle.entity.name,
      summary_md: turn.summaryMd,
      messages,
      turns: 1,
      context_full: turn.contextFull,
    })
    .select('id, entity_type, entity_id, entity_name, summary_md, messages, turns, context_full, created_at')
    .single()

  if (error || !session) {
    console.error('search session: insert failed', error)
    return NextResponse.json({ error: 'Could not save the session.' }, { status: 500 })
  }

  return NextResponse.json({
    session,
    web_citations: turn.webCitations,
    credits: { used: after.used, allotment: after.allotment, remaining: after.remaining, resets_at: after.periodEnd },
  })
}
