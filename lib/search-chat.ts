// lib/search-chat.ts — the credit-metered Haiku donor-intelligence CHAT.
//
// This is the core of the $45 software product. Where lib/dossier.ts did a
// one-shot Opus write, this is an INTERACTIVE chat:
//   - A session starts on one entity (politician | donor | bill | vote).
//   - We assemble the SAME deterministic, fully-sourced SQL bundle as the
//     dossier engine (lib/dossier.assembleBundle) — Haiku NEVER recalls, only
//     writes from the bundle, and must cite each fact's `source` or say
//     "not in the data".
//   - The first turn produces a running SUMMARY of the donor-influence levels.
//   - Follow-up turns ("go deeper", a new question) reuse the SAME bundle +
//     prior turns and UPDATE the running summary. Follow-ups are FREE (same
//     credit).
//   - When the conversation approaches Haiku's safe window we mark the session
//     full and tell the user to start a new session (new credit).
//
// COST GUARD: Haiku (cheap), a hard turn cap, capped output, prompt-caching on
// the static system+bundle prefix, and token-spend logging to .external-costs.jsonl.

import { promises as fs } from 'fs'
import path from 'path'
import Anthropic from '@anthropic-ai/sdk'
import { assembleBundle, type EntityType, type DossierBundle } from './dossier'

// Haiku (latest) — execution tier per portfolio tooling rules. NOT Opus.
const HAIKU_MODEL = 'claude-haiku-4-5'

// Conservative caps. A "session" is one credit; these bound the spend per credit.
export const MAX_TURNS = 12 // initial summary counts as turn 1
const MAX_OUTPUT_TOKENS = 1200

// WEB SEARCH cost guard. The model may search the open web for CONTEXT/FRAMING
// (the "why") — never for the money facts (those come ONLY from the SQL bundle).
// Anthropic runs the search server-side and returns cited results. Each search
// is billed per-search ON TOP of tokens, so we cap searches PER TURN hard.
// Web search server-tool price: $10 per 1,000 searches = $0.01 / search.
const MAX_WEB_SEARCHES_PER_TURN = 4
const WEB_SEARCH_USD_PER_CALL = 0.01
// Safe input budget — well under Haiku's 200k window. When the running
// transcript + bundle approaches this, we close the session.
const SAFE_INPUT_TOKEN_BUDGET = 150_000
const APPROX_CHARS_PER_TOKEN = 4

export type ChatMessage = { role: 'user' | 'assistant'; content: string }

const COSTS_LOG = path.join(process.cwd(), 'scripts', '.external-costs.jsonl')

// Haiku 4.5 pricing (per MTok): input $1.00, output $5.00, cache-read $0.10.
// web_searches adds $0.01 per server-side search on top of tokens.
function estimateCostUsd(u: {
  input_tokens: number
  output_tokens: number
  cache_read_input_tokens: number
  web_searches: number
}): number {
  const inUncached = Math.max(0, u.input_tokens)
  return (
    (inUncached / 1_000_000) * 1.0 +
    (u.cache_read_input_tokens / 1_000_000) * 0.1 +
    (u.output_tokens / 1_000_000) * 5.0 +
    u.web_searches * WEB_SEARCH_USD_PER_CALL
  )
}

async function logCost(entry: Record<string, unknown>) {
  try {
    await fs.appendFile(COSTS_LOG, JSON.stringify(entry) + '\n')
  } catch (err) {
    console.error('search-chat: failed to log cost', err)
  }
}

const SYSTEM_CONTRACT = `You are the donor-intelligence research assistant for Campaign Receipts, a money-in-politics accountability tool used by journalists and citizen investigators.

You are handed a BUNDLE of facts retrieved from FEC and Congress.gov data, plus a running summary and the user's questions. The bundle includes a themes array: deterministic, pre-computed PATTERNS (the "so-what") — party skew, money concentration, multi-cycle persistence, shared legislation, industry clusters. These were computed in code, NOT by you; never recompute or dispute their numbers, only narrate them. Your ONLY job is to ANSWER from that bundle and keep a clear running summary of the donor-influence connections. You have NO outside knowledge of this entity. You did not look anything up.

When you open a summary or answer a broad question, LEAD WITH THE THEMES (the patterned so-what) before the flat receipts: tell the reader the pattern first ("most of the money leans one party", "half went to five members"), then back it with the sourced line items. If there are no themes, say plainly that no strong pattern emerged and fall back to receipts.

TWO SOURCES OF TRUTH — keep them clearly separate and labeled:
- "What the filings show" — the BUNDLE (facts[], cross_links[], themes[]). This is AUTHORITATIVE. Every dollar, donor, vote, date, and connection comes ONLY from here.
- "Context from the web" — you have a web_search tool. Use it ONLY to explain the WHY: who a donor is, what an organization does, what a bill actually does, why an issue is contested, recent news framing the receipts. Web context is supporting color, may be incomplete, and is NEVER authoritative for any number or fact.

WEB SEARCH RULES:
- NEVER use the web to state, confirm, correct, or override any financial figure, donor amount, vote, date, or connection. Those come ONLY from the bundle. If the web disagrees with the bundle on a number, the bundle wins and you do not mention the web's number.
- Search at most a few times per answer, and only when outside context genuinely helps frame the why. If the bundle alone answers the question, do not search.
- Every web-sourced claim must be attributed inline to the page it came from (cite the source title and/or URL the search returned). Put web context in its own clearly-labeled section ("Context from the web") so the reader never confuses it with the sourced filings.

HARD RULES — violating any is a failure:
1. Assert financial/donor/vote/connection facts ONLY from the bundle's facts[] or cross_links[]. If such a fact is not in the bundle, you may NOT state it. Say "That is not in the data we have" instead.
2. Every dollar figure, vote, and connection you mention must be followed by its source string in parentheses, copied verbatim from that fact's "source" field.
3. If the reader expects a connection the bundle lacks (no votes, no industry stance), SAY SO plainly. Never infer, guess, or fill gaps with the bundle. (Web context may add background, but clearly labeled and cited.)
4. Never assert intent or motive as fact. Frame influence as a question the receipts raise, not a proven quid pro quo. Nonpartisan — same skepticism every direction. No "corrupt", "bought".
5. Plain English, 3rd-to-6th-grade reading level. Short sentences.
6. Attribute every web-context claim to its URL. Separate "what the filings show" (authoritative) from "context from the web" (cited, may be incomplete).

When asked to "go deeper" or a follow-up, dig further into the SAME bundle — pull more facts, more cross-links, more sourced detail. Add web context for the why where it helps. Do not repeat yourself; add.`

function bundleContextText(bundle: DossierBundle): string {
  return `Here is the data bundle for this ${bundle.entity.type} ("${bundle.entity.name}"). Everything you may say must come from it:\n\n\`\`\`json\n${JSON.stringify(bundle, null, 2)}\n\`\`\``
}

function buildSystemBlocks(bundle: DossierBundle): Anthropic.MessageCreateParams['system'] {
  // Static prefix (contract + bundle) is cached across all turns of this session.
  return [
    { type: 'text', text: SYSTEM_CONTRACT, cache_control: { type: 'ephemeral' } },
    { type: 'text', text: bundleContextText(bundle), cache_control: { type: 'ephemeral' } },
  ]
}

function approxTokens(messages: ChatMessage[], bundle: DossierBundle): number {
  const transcriptChars = messages.reduce((s, m) => s + m.content.length, 0)
  const bundleChars = JSON.stringify(bundle).length + SYSTEM_CONTRACT.length
  return Math.ceil((transcriptChars + bundleChars) / APPROX_CHARS_PER_TOKEN)
}

export type WebCitation = { title: string; url: string }

export type TurnResult = {
  reply: string
  summaryMd: string
  contextFull: boolean
  webCitations: WebCitation[]
  usage: { input_tokens: number; output_tokens: number; cache_read_input_tokens: number; web_searches: number }
}

// Run one Haiku turn. `priorMessages` is the conversation so far (excluding the
// new user message). `userText` is the new question. `currentSummary` is the
// running summary we ask Haiku to update.
export async function runTurn(opts: {
  bundle: DossierBundle
  priorMessages: ChatMessage[]
  userText: string
  currentSummary: string
  isFirstTurn: boolean
}): Promise<TurnResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not set')
  const anthropic = new Anthropic({ apiKey })

  const { bundle, priorMessages, userText, currentSummary, isFirstTurn } = opts

  // The user-visible instruction wraps their question with the summary-update ask.
  const summaryInstruction = isFirstTurn
    ? `Write a SUMMARY of the levels of donor-influence connections for this ${bundle.entity.type}, built only from the bundle, every figure sourced. Then output the summary again between <summary>...</summary> tags so we can save it as the running summary.`
    : `Current running summary:\n\n${currentSummary}\n\nThe user asks: "${userText}"\n\nAnswer it from the bundle (sourced). Then output an UPDATED running summary that folds in what you just added, between <summary>...</summary> tags.`

  const messages: Anthropic.MessageParam[] = [
    ...priorMessages.map((m) => ({ role: m.role, content: m.content })),
    { role: 'user' as const, content: summaryInstruction },
  ]

  // Web search is a SERVER tool: Anthropic runs the search loop and returns
  // cited results inline. max_uses hard-caps searches per turn so a single
  // credit can't blow COGS. It stays Haiku — web_search is just a tool it uses.
  const tools: Anthropic.MessageCreateParams['tools'] = [
    {
      type: 'web_search_20250305',
      name: 'web_search',
      max_uses: MAX_WEB_SEARCHES_PER_TURN,
    },
  ]

  // Drive the server-tool loop: the model may emit `pause_turn` while it runs
  // web searches; we re-send the accumulated turn until it finishes.
  let resp = await anthropic.messages.create({
    model: HAIKU_MODEL,
    max_tokens: MAX_OUTPUT_TOKENS,
    system: buildSystemBlocks(bundle),
    messages,
    tools,
  })

  const usageAccum = {
    input_tokens: resp.usage.input_tokens,
    output_tokens: resp.usage.output_tokens,
    cache_read_input_tokens: resp.usage.cache_read_input_tokens ?? 0,
    web_searches: resp.usage.server_tool_use?.web_search_requests ?? 0,
  }
  const allContent: Anthropic.ContentBlock[] = [...resp.content]

  let guard = 0
  while (resp.stop_reason === 'pause_turn' && guard < MAX_WEB_SEARCHES_PER_TURN + 2) {
    guard++
    messages.push({ role: 'assistant', content: resp.content })
    resp = await anthropic.messages.create({
      model: HAIKU_MODEL,
      max_tokens: MAX_OUTPUT_TOKENS,
      system: buildSystemBlocks(bundle),
      messages,
      tools,
    })
    usageAccum.input_tokens += resp.usage.input_tokens
    usageAccum.output_tokens += resp.usage.output_tokens
    usageAccum.cache_read_input_tokens += resp.usage.cache_read_input_tokens ?? 0
    usageAccum.web_searches += resp.usage.server_tool_use?.web_search_requests ?? 0
    allContent.push(...resp.content)
  }

  // Collect cited web sources from web_search_tool_result blocks.
  const seenUrls = new Set<string>()
  const webCitations: WebCitation[] = []
  for (const b of allContent) {
    if (b.type === 'web_search_tool_result' && Array.isArray(b.content)) {
      for (const item of b.content) {
        if (item.type === 'web_search_result' && item.url && !seenUrls.has(item.url)) {
          seenUrls.add(item.url)
          webCitations.push({ title: item.title ?? item.url, url: item.url })
        }
      }
    }
  }

  const full = allContent
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('\n')
    .trim()

  // Pull the running summary out of the tags; the reply is the rest.
  const m = full.match(/<summary>([\s\S]*?)<\/summary>/i)
  const summaryMd = (m ? m[1] : full).trim()
  const reply = full.replace(/<summary>[\s\S]*?<\/summary>/i, '').trim() || summaryMd

  const usage = usageAccum

  await logCost({
    ts: new Date().toISOString(),
    company: 'campaign-receipts',
    feature: 'search-chat',
    model: HAIKU_MODEL,
    entity: `${bundle.entity.type}:${bundle.entity.id}`,
    first_turn: isFirstTurn,
    ...usage,
    web_citations: webCitations.length,
    est_cost_usd: Number(estimateCostUsd(usage).toFixed(5)),
  })

  // Project whether the NEXT turn would risk the window.
  const projected = approxTokens(
    [...priorMessages, { role: 'user', content: userText }, { role: 'assistant', content: full }],
    bundle,
  )
  const contextFull = projected >= SAFE_INPUT_TOKEN_BUDGET

  return { reply, summaryMd, contextFull, webCitations, usage }
}

export { assembleBundle, type EntityType }
