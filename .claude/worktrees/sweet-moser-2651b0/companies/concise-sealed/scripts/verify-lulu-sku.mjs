/**
 * Verify a candidate Lulu POD package SKU for the SEALED v1 paperback.
 *
 * Config target: 6×9 US Trade, Perfect Bound, 80# White, Standard B&W,
 * Glossy cover, 115 pages.
 *
 * Strategy: ping /print-job-cost-calculations/ with a known-good shipping
 * address against a handful of candidate SKUs. The first one that returns
 * HTTP 200 is the canonical SKU for our config. Save to eng/WS13-LULU-PRINT-SPEC.md.
 *
 * Usage:
 *   node --env-file=../../.env scripts/verify-lulu-sku.mjs
 */

import { calculatePrintCost, LuluApiError } from "../lib/lulu-client.mjs"

const CANDIDATES = [
  // Lulu SKU grammar (per Lulu Direct docs):
  //   <TRIM><COLOR><QUALITY><BIND><PAPER><FINISH>
  //   trim   : 0600X0900 (6"x9")
  //   color  : BW (standard B&W) / PRE / PRC etc.
  //   quality: STD (standard) / PRE (premium)
  //   bind   : PB (perfect bound)
  //   paper  : 080 + CW444 (cream white) / UW444 (ultra-white)
  //   finish : MXX (matte cover) / GXX (glossy cover) — historical Lulu used
  //            CW for cream-white, with M/G as cover sheen suffix
  "0600X0900BWSTDPB080CW444MXX", // 6x9 BW std perfect-bound 80# cream white, matte cover
  "0600X0900BWSTDPB080CW444GXX", // ...glossy cover
  "0600X0900BWSTDPB080UW444MXX", // 80# ultra-white (white), matte cover
  "0600X0900BWSTDPB080UW444GXX", // 80# ultra-white (white), glossy cover  ← prime suspect
  "0600X0900BWSTDPB060UW444MXX", // 60# variant fallback
  "0600X0900BWSTDPB060UW444GXX",
]

const SHIPPING_ADDRESS = {
  name: "Alex Antoniou",
  street1: "734 Stanhope Ln",
  city: "Matthews",
  state_code: "NC",
  country_code: "US",
  postcode: "28105",
  phone_number: "+15555555555",
}

const PAGE_COUNT = 115

async function main() {
  console.log("Probing Lulu POD package SKUs for 6×9 perfect-bound 80#white B&W glossy 115pp...\n")
  const winners = []
  for (const sku of CANDIDATES) {
    try {
      const cost = await calculatePrintCost({
        lineItems: [{ pod_package_id: sku, page_count: PAGE_COUNT, quantity: 1 }],
        shippingAddress: SHIPPING_ADDRESS,
        shippingLevel: "MAIL",
      })
      console.log(`✓ 200 OK  ${sku}`)
      // Surface print cost only — defer shipping breakdown to test script
      const li = cost?.line_item_costs?.[0]
      if (li) {
        console.log(`         unit_print_cost=${li.total_cost_excl_discounts ?? li.total_cost_excl_tax ?? "?"} ${cost.currency || ""}`)
      }
      winners.push({ sku, cost })
    } catch (err) {
      if (err instanceof LuluApiError) {
        const detail = typeof err.body === "string" ? err.body.slice(0, 160) : JSON.stringify(err.body).slice(0, 200)
        console.log(`✗ ${err.status}    ${sku}  — ${detail}`)
      } else {
        console.log(`✗ ERR    ${sku}  — ${err.message}`)
      }
    }
  }

  console.log("\n--- Winners ---")
  for (const w of winners) console.log(w.sku)
  if (winners.length === 0) {
    console.error("\nNo candidate SKU returned 200. Investigate Lulu SKU grammar.")
    process.exitCode = 2
    return
  }
  // Pick glossy-white if available (matches scope), else first winner
  const preferred =
    winners.find((w) => w.sku.includes("UW444GXX")) ||
    winners.find((w) => w.sku.includes("CW444GXX")) ||
    winners[0]
  console.log(`\nSelected SKU: ${preferred.sku}`)
  console.log(JSON.stringify(preferred.cost, null, 2))
}

main().catch((err) => {
  console.error("Fatal:", err)
  process.exitCode = 1
})
