// POST /api/search/session/[id]/message — a FREE follow-up turn in an existing
// session (same credit). Enforces ownership + hasSoftware + the per-session turn
// cap + the context-full close. Updates the running summary and message log.
//
// Body: { text: string }
import { NextResponse } from 'next/server'
import { getEntitlement } from '@/lib/entitlement'
import { getCreditState } from '@/lib/search-credits'
import { assembleBundle, runTurn, MAX_TURNS, type EntityType, type ChatMessage } from '@/lib/search-chat'
import { supabaseService } from '@/lib/supabase'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const ent = await getEntitlement()
  if (!ent.user) return NextResponse.json({ error: 'Please sign in.' }, { status: 401 })
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
  const text = typeof body?.text === 'string' ? body.text.trim() : ''
  if (!text) return NextResponse.json({ error: 'Type a question first.' }, { status: 400 })
  if (text.length > 2000) return NextResponse.json({ error: 'That question is too long.' }, { status: 400 })

  // Load the session and verify ownership.
  const { data: session } = await supabaseService
    .from('cr_search_sessions')
    .select('id, user_id, entity_type, entity_id, entity_name, summary_md, messages, turns, context_full')
    .eq('id', params.id)
    .maybeSingle()

  if (!session) return NextResponse.json({ error: 'Session not found.' }, { status: 404 })
  if (session.user_id !== ent.user.id) {
    return NextResponse.json({ error: 'Not your session.' }, { status: 403 })
  }

  if (session.context_full) {
    return NextResponse.json(
      { error: 'This search is full. Start a new search to keep going.', context_full: true },
      { status: 409 },
    )
  }
  if (session.turns >= MAX_TURNS) {
    // Cap the session; mark it full so the UI sends the user to a new credit.
    await supabaseService.from('cr_search_sessions').update({ context_full: true }).eq('id', session.id)
    return NextResponse.json(
      { error: 'This search is full. Start a new search to keep going.', context_full: true },
      { status: 409 },
    )
  }

  // Re-assemble the bundle (deterministic SQL; cheap and keeps the source of
  // truth on the server — never trust a client-sent bundle).
  const bundle = await assembleBundle(session.entity_type as EntityType, session.entity_id)
  if (!bundle) return NextResponse.json({ error: 'We have no record for that anymore.' }, { status: 404 })

  const priorMessages = (session.messages || []) as ChatMessage[]

  let turn
  try {
    turn = await runTurn({
      bundle,
      priorMessages,
      userText: text,
      currentSummary: session.summary_md || '',
      isFirstTurn: false,
    })
  } catch (err) {
    console.error('search message: turn failed', err)
    return NextResponse.json({ error: 'The research engine is busy. Try again.' }, { status: 502 })
  }

  const newMessages: ChatMessage[] = [
    ...priorMessages,
    { role: 'user', content: text },
    { role: 'assistant', content: turn.reply },
  ]
  const newTurns = session.turns + 1
  const contextFull = turn.contextFull || newTurns >= MAX_TURNS

  const { error } = await supabaseService
    .from('cr_search_sessions')
    .update({
      summary_md: turn.summaryMd,
      messages: newMessages,
      turns: newTurns,
      context_full: contextFull,
      updated_at: new Date().toISOString(),
    })
    .eq('id', session.id)

  if (error) {
    console.error('search message: update failed', error)
    return NextResponse.json({ error: 'Could not save your question.' }, { status: 500 })
  }

  // Follow-ups are FREE — return the meter unchanged so the UI stays in sync.
  const credits = await getCreditState(ent.user.id)

  return NextResponse.json({
    reply: turn.reply,
    summary_md: turn.summaryMd,
    web_citations: turn.webCitations,
    turns: newTurns,
    context_full: contextFull,
    turns_left: Math.max(0, MAX_TURNS - newTurns),
    credits: { used: credits.used, allotment: credits.allotment, remaining: credits.remaining, resets_at: credits.periodEnd },
  })
}
