/* Re-run panel_review stage only (uses loadReport index-gap labels) */
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "..", ".env.local") });

const REPORT_ID = process.argv[2] || "87648f5f-c691-4198-8b4a-fe5f6859ae74";

async function main() {
  process.env.CLIROS_FORCE_REPORT_ID = REPORT_ID;
  const { spawnSync } = await import("node:child_process");
  const r = spawnSync("npx", ["tsx", path.join(__dirname, "run_pipeline_tick.ts")], {
    cwd: path.join(__dirname, ".."),
    stdio: "inherit",
    env: { ...process.env, CLIROS_FORCE_REPORT_ID: REPORT_ID },
  });
  process.exit(r.status ?? 0);
}

main();
