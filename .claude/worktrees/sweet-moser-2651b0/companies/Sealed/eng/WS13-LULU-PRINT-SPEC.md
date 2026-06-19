# WS13 — Lulu Direct Paperback Print Spec

**Status:** Updated 2026-05-16 — Chapter 10 ("What was promised in 2024") added; page count rises from 112 to 140; new spine width 0.375". Prior proof print #2875779 (printed against the 112-page interior) is **superseded** and should NOT be used as a reference for the live product page or the next proof reprint.

## Print configuration

| Field | Value |
|---|---|
| Product | 6×9 US Trade paperback |
| Bind | Perfect bound |
| Interior paper | 80# cream-white (Lulu code `CW444`) |
| Quality | Standard B&W |
| Cover | Glossy laminate |
| Pages | **140** (rendered 2026-05-16; was 112 before Chapter 10 was added) |
| **POD package SKU** | **`0600X0900BWSTDPB080CW444GXX`** |

### Why CW (cream-white) and not UW (ultra-white)

Scope said "80# White." Lulu's POD catalog for 6×9 standard B&W perfect-bound exposes:
- 80# cream-white (`080CW444`) — selected
- 60# ultra-white (`080UW444` returned 400 on cost-calc; only 60# UW is offered for this trim+quality combo)

CW is the closest match to "80# White" intent. The cream is a warmer, less harsh page typical of trade non-fiction (which SEALED is). If the founder wants ultra-white, the only path at this trim/quality is 60# (`0600X0900BWSTDPB060UW444GXX`) — thinner paper, slightly cheaper print, but spine will scale.

## Spine width

From Lulu `POST /cover-dimensions/`:

```json
{ "podPackageId": "0600X0900BWSTDPB080CW444GXX", "pageCount": 140, "unit": "inch" }
→ { "width": "12.625", "height": "9.250", "unit": "inch" }
```

- Total wraparound cover: **12.625" × 9.250"** (includes 0.125" bleed on all four sides)
- Computed spine width: **0.375"** (12.625 − 2×(6.0 + 0.125 outer bleed) = 12.625 − 12.25)
- Prior values (superseded by 2026-05-16 Chapter 10 build): total 12.562" / spine 0.312" at 112pp.
- Stored to `artifacts/SEALED-v1-print-cover.dims.json` at every cover build. `build-print-cover.mjs` now reads page count dynamically from the rendered `SEALED-v1-print.pdf` (via `pdf-lib`) — no more hardcoded 112.

## Cost preview (1 unit → 734 Stanhope Ln, Matthews NC 28105, MAIL shipping)

```json
{
  "currency": "USD",
  "line_item_costs": [{ "quantity": 1, "total_cost_incl_tax": "5.88" }],
  "shipping_cost":   { "total_cost_incl_tax": "6.10" },
  "fulfillment_cost": { "total_cost_incl_tax": "0.81" },
  "total_cost_excl_tax": "11.92",
  "total_cost_incl_tax": "12.79"
}
```

**Total landed cost per unit (1×, MAIL, NC): $12.79.** Note: scope estimated print at $8/copy; Lulu's actual print is $5.48 + $0.75 fulfillment = $6.23, lower than the founder's estimate. Margin at $25 retail: **~$12.21/unit** before LS fees and the $9 digital bundle delivery cost overhead.

## Proof print

- **Print job ID:** `2875779`
- **External ID:** `SEALED-WS13-PROOF-1778944186116`
- **Final polled status:** `UNPAID` (Lulu's validated-and-queued state; production starts after Lulu's billing system charges the card on file, which is separate from API submission. The 60-second `production_delay` window has elapsed; the job is now committed to print.)
- **Contact:** alex@antoniou.net
- **Ship-to:** 734 Stanhope Ln, Matthews NC 28105 — confirmed-deliverable per Lulu address validation (suggested ZIP+4: 28105-1515).
- **Transcript:** `eng/WS13-paperback-proof-print.txt`

### Print-jobs API gotcha (worth documenting for future agents)

Lulu's `POST /print-jobs/` returns **HTTP 500 with an HTML body** (no JSON) if `page_count` is supplied on a line item. The endpoint derives `page_count` from the fetched interior PDF and treats client-supplied values as a server error. By contrast, `POST /print-job-cost-calculations/` **requires** `page_count`. Asymmetric — `lib/lulu-client.mjs` handles this: cost-calc passes through, print-jobs callers must omit.

## Production launch checklist (pre-paperback variant flip on Lemon Squeezy)

- [ ] **Real ISBN** — buy 1 (US: Bowker, $125 single or $295 for 10-pack). Place in back-cover ISBN box, replacing the "PENDING placeholder" stub in `scripts/build-print-cover.mjs`. Update copyright page in `scripts/build-retail-pdf.mjs` to include ISBN.
- [ ] **Verify proof copy** when it arrives (3–8 business days from production start). Check:
  - Cover spine alignment (text not bleeding off spine)
  - Front-cover Statue-of-Liberty illustration registration
  - Frontispiece four-portrait layout (page 1, before half-title)
  - Colophon page bare (no per-buyer stamp yet — that comes at fulfillment)
  - Trade paperback feel of 80# cream-white
- [ ] **Create Lemon Squeezy paperback variant** at $25 in the existing SEALED product. Note the variant ID (numeric).
- [ ] **Set env var** `LEMONSQUEEZY_PAPERBACK_VARIANT_ID` on Render (watermark-webhook service) to the variant ID above. Until set, the paperback branch in `services/watermark-webhook/server.mjs` is dormant — existing digital flow is unaffected.
- [ ] **Run migration** `services/watermark-webhook/migrations/2026-05-16-paperback-orders.sql` against the SEALED Supabase schema.
- [ ] **Upload static cover PDF** to Supabase `sealed-masters/SEALED-v1-print-cover.pdf` so the webhook can reference a stable signed URL (or have the webhook generate signed URLs on the fly — see commit 2).
- [ ] **Storefront swap** — replace the "notify me" form in `app/components/three-ways-in.tsx` with a live "Buy paperback" button pointing at the LS variant checkout URL. (Diff spec at bottom of this doc / in agent report.)
- [ ] **Webhook smoke test** — trigger a $0.01 LS test order against the paperback variant; confirm:
  - Lulu print job created
  - Buyer receives the "ships in 5–8 business days from Lulu" email
  - Row inserted into `sealed_paperback_orders`
  - Digital PDF/ePub flow still works for the digital-bundle variant (no regression)

## Spend

- fal.ai (Flux dev, 1 image, ~$0.05): cover illustration `public/sealed-cover-art.jpg`
- Lulu (1 proof copy + ship, $12.79 inc tax): print job 2875779
- **Total WS13 spend:** ~$12.84 against $20 cap.
