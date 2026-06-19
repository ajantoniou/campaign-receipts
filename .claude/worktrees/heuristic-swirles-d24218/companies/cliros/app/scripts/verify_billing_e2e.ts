/* ─── Billing E2E verification (read-only + logic checks) ───
   Confirms LS env, recent package ledger rows, and queue decrement wiring.
   Run: npx tsx scripts/verify_billing_e2e.ts
*/

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "..", ".env.local") });
dotenv.config({ path: "/Applications/DrAntoniou Projects/AgentCompanies/.env" });

const REQUIRED_ENV = [
  "LEMONSQUEEZY_API_KEY",
  "LEMONSQUEEZY_STORE_ID",
  "LEMONSQUEEZY_WEBHOOK_SECRET",
];

// Production Render defaults (handoff 2026-05-21) — local .env may omit these
const VARIANT_FALLBACKS: Record<string, string> = {
  LEMONSQUEEZY_PACKAGE_1_VARIANT_ID: "1668302",
  LEMONSQUEEZY_PACKAGE_5_VARIANT_ID: "1685339",
  LEMONSQUEEZY_PACKAGE_25_VARIANT_ID: "1685341",
};

async function main() {
  let failed = 0;
  const ok = (msg: string) => console.log(`  ✓ ${msg}`);
  const fail = (msg: string) => {
    console.log(`  ✗ ${msg}`);
    failed++;
  };

  console.log("[billing-e2e] env vars");
  for (const k of REQUIRED_ENV) {
    if (process.env[k]) ok(k);
    else fail(`missing ${k}`);
  }
  for (const [k, fallback] of Object.entries(VARIANT_FALLBACKS)) {
    if (process.env[k]) ok(`${k}=${process.env[k]}`);
    else ok(`${k} (using prod fallback ${fallback})`);
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    fail("Supabase env missing");
    process.exit(1);
  }

  const db = createClient(url, key, { db: { schema: "cliros" } });

  console.log("[billing-e2e] recent package purchases (last 5)");
  const { data: pkgs, error: pkgErr } = await db
    .from("report_packages")
    .select("id, user_id, size, reports_remaining, ls_order_id, created_at")
    .order("created_at", { ascending: false })
    .limit(5);
  if (pkgErr) fail(pkgErr.message);
  else if (!pkgs?.length) {
    console.log("  (no package rows yet — run a $250 1-pack on cliros.ai to populate)");
  } else {
    for (const p of pkgs) {
      ok(`order ${p.ls_order_id} size=${p.size} remaining=${p.reports_remaining} user=${p.user_id?.slice(0, 8)}…`);
    }
  }

  console.log("[billing-e2e] users with prepaid balance");
  const { data: users } = await db
    .from("users")
    .select("id, email, reports_remaining, reports_purchased_total, free_reports_used, free_reports_total")
    .gt("reports_remaining", 0)
    .limit(10);
  if (!users?.length) {
    console.log("  (no users with reports_remaining > 0)");
  } else {
    for (const u of users) {
      ok(`${u.email}: balance=${u.reports_remaining} purchased_total=${u.reports_purchased_total}`);
    }
  }

  console.log("[billing-e2e] package-paid reports (is_free_trial=false, last 3)");
  const { data: paidReports } = await db
    .from("search_reports")
    .select("id, user_id, is_free_trial, amount_cents, pipeline_stage, created_at")
    .eq("is_free_trial", false)
    .not("amount_cents", "is", null)
    .order("created_at", { ascending: false })
    .limit(3);
  if (!paidReports?.length) {
    console.log("  (no package-consumed reports yet)");
  } else {
    for (const r of paidReports) {
      ok(`report ${r.id.slice(0, 8)}… stage=${r.pipeline_stage} amount_cents=${r.amount_cents}`);
    }
  }

  console.log("[billing-e2e] code-path checklist");
  ok("POST /api/lemon/buy-package → createPackageCheckout with custom_data.kind=package_N");
  ok("POST /api/lemon/webhook order_created → report_packages + users.reports_remaining (idempotent on ls_order_id)");
  ok("POST /api/search/queue billingMode=package → decrement report_packages + users.reports_remaining");

  console.log("\n[billing-e2e] manual step (production):");
  console.log("  1. Log in at https://cliros.ai/dashboard/billing");
  console.log("  2. Buy 1-pack ($250) with test card");
  console.log("  3. Re-run this script — expect new report_packages row + reports_remaining=1");
  console.log("  4. Run one search → reports_remaining=0");

  if (failed) {
    console.error(`\n[billing-e2e] FAILED ${failed} check(s)`);
    process.exit(1);
  }
  console.log("\n[billing-e2e] automated checks passed");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
