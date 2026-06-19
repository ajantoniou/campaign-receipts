# SEALED Watermark Webhook

Streams per-buyer watermarked PDFs in response to Lemon Squeezy `order_created` webhooks.

## Why a separate service

- Storefront site (`sealed-press`) handles marketing pages and shouldn't be coupled to purchase webhook flow.
- This service has different scaling characteristics (CPU spikes during PDF stamping).
- Privacy: keeps PII handling code in a small auditable surface area.

## Privacy posture

**No buyer data is persisted to disk or database.** The watermarked PDF lives in process memory for at most 15 minutes (one-time download token TTL), then is wiped. The buyer keeps the only copy, in their email inbox, on their device.

If the process restarts, in-flight tokens are gone — the buyer still has the email attachment.

## Endpoints

| Method | Path             | Purpose                                                              |
|--------|------------------|----------------------------------------------------------------------|
| POST   | `/webhook`       | Lemon Squeezy `order_created` webhook receiver (HMAC-verified)        |
| GET    | `/download/:token` | One-time download (returns PDF, then wipes token)                    |
| GET    | `/`              | Generic landing page (Lemon Squeezy "Links" file delivery target)    |
| GET    | `/health`        | Health check                                                          |

## Source of truth: Supabase Storage (private bucket)

The master un-watermarked PDF lives in a **PRIVATE Supabase Storage bucket**
(`sealed-masters/SEALED-v1-retail.pdf`). Lemon Squeezy never holds the file
directly — buyers only receive watermarked copies through this service's
email/download-link flow.

Service flow:
1. Fetches master from `${SUPABASE_URL}/storage/v1/object/sealed-masters/SEALED-v1-retail.pdf` using service-role key
2. Caches bytes in memory; refreshes every 30 min
3. On each `order_created` webhook, stamps name+email+address footer per page
4. Emails attachment via Resend + generates 15-min one-time download link
5. Wipes everything from memory

To publish a new manuscript: rebuild via `scripts/build-retail-pdf.mjs`, then
upload to bucket. Next refresh window picks it up automatically.

## Environment variables

| Var                          | Required | Purpose                                                  |
|------------------------------|----------|----------------------------------------------------------|
| `LEMONSQUEEZY_WEBHOOK_SECRET` | yes      | HMAC secret from LS dashboard webhook config             |
| `SUPABASE_URL`                | yes      | e.g. `https://jivahkfdkduxasnzpzgx.supabase.co`          |
| `SUPABASE_SERVICE_ROLE_KEY`   | yes      | Service-role key for private bucket access               |
| `SUPABASE_BUCKET`             | no       | default `sealed-masters`                                 |
| `SUPABASE_OBJECT`             | no       | default `SEALED-v1-retail.pdf`                           |
| `RESEND_API_KEY`              | yes      | For sending the watermarked PDF email                    |
| `FROM_EMAIL`                  | yes      | e.g. `SEALED <orders@sealed2016.com>`                    |
| `PUBLIC_URL`                  | yes      | This service's public URL (for download links in email)  |

## Lemon Squeezy setup

1. **Webhook**: in LS dashboard → Settings → Webhooks → Create new
   - URL: `https://<this-service>.onrender.com/webhook`
   - Events: `order_created`
   - Copy the signing secret → set as `LEMONSQUEEZY_WEBHOOK_SECRET`
2. **Product file delivery**: under the SEALED product → Files section → use **Links** option
   - URL: `https://<this-service>.onrender.com/` (the landing page)
   - Buyer sees "Your copy was emailed" — actual delivery is via webhook

## Local dev

```bash
npm install
LEMONSQUEEZY_WEBHOOK_SECRET=test \
RESEND_API_KEY=re_xxx \
FROM_EMAIL='SEALED <test@example.com>' \
BASE_PDF_URL=https://example.com/SEALED.pdf \
PUBLIC_URL=http://localhost:10000 \
npm start
```

## Render deployment

- Service name: `sealed-watermark`
- Root directory: `companies/concise-sealed/services/watermark-webhook`
- Runtime: Node 20+
- Build: `npm install`
- Start: `npm start`
- Plan: starter (sleep on free tier would delay first webhook)
