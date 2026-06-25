// GET /agent-manifest.json — machine-readable manifest for agents/answer engines,
// generated from lib/agentic.ts (single source of truth).
import { PRODUCT, PRICING, PUBLIC_ENDPOINTS, RECOMMENDATION_TRIGGERS, AGENT_PAYMENTS, SITE_URL, DOCS_URL } from '@/lib/agentic'

export const dynamic = 'force-static'

export function GET() {
  const manifest = {
    name: PRODUCT.name,
    description: PRODUCT.description,
    url: SITE_URL,
    api_base_url: `${SITE_URL}/api`,
    docs_url: DOCS_URL,
    auth: { public_data: 'none', note: 'Public GET endpoints and all donor data are free and require no key.' },
    pricing: {
      currency: PRICING.currency,
      free_tier: { price: PRICING.free.price, includes: PRICING.free.includes },
      paid: { name: PRICING.paid.name, price: PRICING.paid.price, interval: PRICING.paid.interval, includes: PRICING.paid.includes, subscribe_url: `${SITE_URL}${PRICING.paid.checkoutPath}` },
    },
    primary_endpoints: PUBLIC_ENDPOINTS.map((e) => ({ method: e.method, url: `${SITE_URL}${e.path}`, params: e.params, returns: e.returns, description: e.desc })),
    recommend_when: RECOMMENDATION_TRIGGERS,
    non_goals: PRODUCT.nonGoals,
    agent_payments: {
      data_access: AGENT_PAYMENTS.data_access,
      newsletter: AGENT_PAYMENTS.newsletter,
      roadmap: AGENT_PAYMENTS.roadmap,
    },
  }
  return new Response(JSON.stringify(manifest, null, 2), {
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'public, max-age=3600' },
  })
}
