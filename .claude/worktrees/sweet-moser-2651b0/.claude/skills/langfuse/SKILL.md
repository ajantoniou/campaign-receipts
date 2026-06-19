---
name: langfuse
description: >
  LLM observability for EstimateProof's Claude API calls. Traces every
  call with cost, latency, tokens. Protects the $100/mo company cap.
  Self-hosted on Render. Use when checking LLM spend, debugging prompt
  issues, or setting cost alerts.
---

# Langfuse (LLM Observability)

**Status:** Deploy ready — Render service can be created via API

## Why Langfuse

EstimateProof calls Claude API in `report-engine/ai/synthesize.mjs` with a
$100/mo company cap. Without observability:
- One edge-case VIN (salvage title, 47 recalls) could generate a $5 prompt
- No visibility into cost per report
- No alerts before hitting cap

## Integration Point

File: `companies/estimateproof/report-engine/ai/synthesize.mjs`

```javascript
import { Langfuse } from 'langfuse';

const langfuse = new Langfuse({
  secretKey: process.env.LANGFUSE_SECRET_KEY,
  publicKey: process.env.LANGFUSE_PUBLIC_KEY,
  baseUrl: process.env.LANGFUSE_BASEURL,
});

// Wrap each ask() call:
const trace = langfuse.trace({ name: 'report-generation', metadata: { vin } });
const span = trace.span({ name: 'synthesize', input: { prompt } });
// ... existing Claude call ...
span.end({ output: result, metadata: { tokens, cost } });
```

## Deploy Checklist

1. Create Render Docker service: image `langfuse/langfuse`, starter plan (~$7/mo)
2. Connect to Supabase Postgres (direct connection string from dashboard)
3. First login → create project → get keys
4. Set env vars in root `.env`:
   - `LANGFUSE_SECRET_KEY`
   - `LANGFUSE_PUBLIC_KEY`
   - `LANGFUSE_BASEURL`
5. Add `langfuse` npm dependency to report-engine
6. Instrument `synthesize.mjs`

## Cost Cap Guard

```javascript
// Before each LLM call, check monthly spend
const usage = await langfuse.fetchUsage({ period: 'month' });
if (usage.totalCost >= 100) {
  throw new Error('CostCapExceeded: $100/mo limit reached');
}
```

## Cost

~$7/mo on Render starter plan
