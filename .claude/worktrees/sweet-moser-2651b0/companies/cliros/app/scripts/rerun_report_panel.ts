/* ─── Re-run pipeline + panel on one report (post parser fix) ───
   Usage: npx tsx scripts/rerun_report_panel.ts [report_id]
   Default report: EIKHOFF 87648f5f-c691-4198-8b4a-fe5f6859ae74
*/

import { createClient } from "@supabase/supabase-js";
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "..", ".env.local") });

const REPORT_ID =
  process.argv[2] || "87648f5f-c691-4198-8b4a-fe5f6859ae74";
const MAX_TICKS = 25;

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const db = createClient(url, key, { db: { schema: "cliros" } });

  console.log(`[rerun] resetting report ${REPORT_ID} → queued`);
  await db.from("report_qa_reviews").delete().eq("report_id", REPORT_ID);
  await db.from("search_reports").update({
    pipeline_stage: "queued",
    panel_verdict: null,
    panel_ship_confidence_pct: null,
    stage_attempts: 0,
    last_error: null,
    status: "pending",
  }).eq("id", REPORT_ID);

  const tickScript = path.join(__dirname, "run_pipeline_tick.ts");
  for (let i = 0; i < MAX_TICKS; i++) {
    const r = spawnSync("npx", ["tsx", tickScript], {
      cwd: path.join(__dirname, ".."),
      stdio: "inherit",
      env: process.env as NodeJS.ProcessEnv,
    });
    if (r.status !== 0) console.warn(`[rerun] tick ${i + 1} exit ${r.status}`);

    const { data: row } = await db
      .from("search_reports")
      .select("pipeline_stage, panel_verdict, panel_ship_confidence_pct, last_error")
      .eq("id", REPORT_ID)
      .single();

    console.log(
      `[rerun] tick ${i + 1}: stage=${row?.pipeline_stage} verdict=${row?.panel_verdict} confidence=${row?.panel_ship_confidence_pct}%`
    );

    if (row?.pipeline_stage === "ready" || row?.pipeline_stage === "delivered") {
      console.log("[rerun] pipeline complete");
      break;
    }
    if (row?.pipeline_stage === "blocked") {
      console.error("[rerun] blocked:", row.last_error);
      process.exit(1);
    }
  }

  const { data: reviews } = await db
    .from("report_qa_reviews")
    .select("persona, verdict, severity")
    .eq("report_id", REPORT_ID)
    .order("persona");

  console.log("\n[rerun] panel reviews:");
  for (const r of reviews || []) {
    console.log(`  ${r.persona}: ${r.verdict} (${r.severity})`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
