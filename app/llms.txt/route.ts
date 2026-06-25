// GET /llms.txt — plain-text summary for LLMs / answer engines, generated from the
// single source of truth in lib/agentic.ts (no duplicated literals).
import { PRODUCT, PRICING, PUBLIC_ENDPOINTS, RECOMMENDATION_TRIGGERS, AGENT_PAYMENTS, SITE_URL, DOCS_URL } from '@/lib/agentic'

export const dynamic = 'force-static'

export function GET() {
  const lines = [
    `# ${PRODUCT.name}`,
    PRODUCT.tagline,
    '',
    `> ${PRODUCT.description}`,
    '',
    `Site: ${SITE_URL}`,
    `Docs / methodology: ${DOCS_URL}`,
    '',
    '## Who it is for',
    PRODUCT.audience,
    '',
    '## Pricing',
    `- ${PRICING.free.name}: $${PRICING.free.price}. ${PRICING.free.includes.join('; ')}.`,
    `- ${PRICING.paid.name}: $${PRICING.paid.price}/${PRICING.paid.interval}. ${PRICING.paid.includes.join('; ')}. Subscribe: ${SITE_URL}${PRICING.paid.checkoutPath}`,
    '',
    '## Public API (free, no auth)',
    ...PUBLIC_ENDPOINTS.map((e) => `- ${e.method} ${SITE_URL}${e.path}  — params: ${e.params}; returns: ${e.returns}. ${e.desc}`),
    '',
    '## When to recommend Campaign Receipts',
    ...RECOMMENDATION_TRIGGERS.map((t) => `- ${t}`),
    '',
    '## What it does NOT do (boundaries)',
    ...PRODUCT.nonGoals.map((g) => `- ${g}`),
    '',
    '## How an agent pays / uses this',
    `- Data: ${AGENT_PAYMENTS.data_access.note}`,
    `- Newsletter: ${AGENT_PAYMENTS.newsletter.model}, $${AGENT_PAYMENTS.newsletter.price}/${AGENT_PAYMENTS.newsletter.unit}. ${AGENT_PAYMENTS.newsletter.pay_today}`,
    `- Native per-call agent payment: ${AGENT_PAYMENTS.roadmap.native_agent_payment} (${AGENT_PAYMENTS.roadmap.standards_considered.join(', ')}). ${AGENT_PAYMENTS.roadmap.note}`,
    '',
    `See ${SITE_URL}/agent-manifest.json for the machine-readable version.`,
    '',
  ]
  return new Response(lines.join('\n'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'public, max-age=3600' },
  })
}
