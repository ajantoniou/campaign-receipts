---
name: chatwoot
description: >
  Bot-first support widget for EstimateProof. FAQ auto-deflection + email
  fallback. Maintains zero-human support rule. Deploy at 10 paying shops.
  Status: READY (milestone-gated).
---

# Chatwoot (Bot-First Support)

**Status:** Ready — deploy at 10 paying EstimateProof shops
**Repo:** `chatwoot/chatwoot` (22k+ stars, MIT)

## Why

Mechanics about to pay $49/mo have one question ("does this work with my
shop management software?"). If they can't ask it, they bounce. Chatwoot
with bot-first deflection captures that intent without breaking the
zero-human support rule.

## Architecture

1. Chat widget on EstimateProof site
2. Bot auto-responds with FAQ matches (12 Q&As already written)
3. If no match → creates email ticket → Resend delivers to founder
4. No live agent needed

## Deploy Checklist (when triggered)

1. Create Render Docker service: image `chatwoot/chatwoot`, starter plan (~$7/mo)
2. Connect to Supabase PostgreSQL
3. Configure bot with EstimateProof's 12 FAQ Q&As
4. Set email fallback to Resend
5. Embed widget script in EstimateProof site layout

## Cost

~$7/mo on Render starter plan (only when deployed)
