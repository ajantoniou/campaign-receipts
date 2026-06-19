/* ─── Dev-fixture report seeder ───
   Creates a fresh report pre-loaded with a known-good chain/lien set from a
   JSON fixture, parked at the `chain_analysis` stage. This lets the persona
   stages (chain→lien→defect→aol) be re-run WITHOUT re-hitting GSCCCA and
   WITHOUT progressively corrupting live state via repeated reset/re-tick.

   Why this exists: iterating on the persona pipeline by re-running a LIVE
   searched report ~15× both cost ~$1.63/pass and blanked report c53fc39b
   (empty persona payload wiped the arrays). A fixture report is cheap and
   disposable — delete it and re-seed for a clean slate.

   Usage:
     set -a && source .env.local && set +a
     npx tsx scripts/seed_fixture_report.ts            # uses peachtree-battle.json
     npx tsx scripts/seed_fixture_report.ts <fixture>  # other fixture name

   Then advance it with the normal tick runner:
     CLIROS_FORCE_REPORT_ID=<printed id> npx tsx scripts/run_pipeline_tick.ts

   The printed id is also written to scripts/fixtures/.last-seeded-id so a
   re-run loop can pick it up.
*/

import { createClient } from "@supabase/supabase-js";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

function admin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY");
  return createClient(url, key, { db: { schema: "cliros" } });
}

async function main() {
  const fixtureName = process.argv[2] || "peachtree-battle";
  const fixturePath = join(process.cwd(), "scripts", "fixtures", `${fixtureName}.json`);
  const fx = JSON.parse(readFileSync(fixturePath, "utf-8"));
  const db = admin();

  // Use an existing user so FK constraints are satisfied. Prefer the founding
  // dev user if present; otherwise the first user in the table.
  const { data: users, error: userErr } = await db
    .from("search_reports")
    .select("user_id")
    .not("user_id", "is", null)
    .limit(1);
  if (userErr) throw userErr;
  const userId = users?.[0]?.user_id;
  if (!userId) throw new Error("No existing user_id found to attach the fixture report to");

  // 1. Property — reuse if it already exists (full_address is unique).
  const { data: existingProp } = await db
    .from("properties")
    .select("id")
    .eq("full_address", fx.property.full_address)
    .maybeSingle();
  let propId = existingProp?.id as string | undefined;
  if (!propId) {
    const { data: prop, error: propErr } = await db
      .from("properties")
      .insert({
        full_address: fx.property.full_address,
        street: fx.property.street,
        city: fx.property.city,
        state: fx.property.state,
        zip: fx.property.zip,
        county: fx.property.county,
        parcel_id: fx.property.parcel_id,
        legal_description: fx.property.legal_description,
      })
      .select("id")
      .single();
    if (propErr) throw propErr;
    propId = prop.id;
  }

  // 2. Report parked at chain_analysis with fixture chain+liens pre-loaded
  //    (mirrors exactly what stageSearching persists, minus the GSCCCA cost).
  const { data: report, error: repErr } = await db
    .from("search_reports")
    .insert({
      user_id: userId,
      property_id: propId,
      status: "analyzing",
      pipeline_stage: "chain_analysis",
      stage_attempts: 0,
      ai_spend_cents: 0,
      chain_of_title: fx.chain_of_title.entries,
      chain_breaks: fx.chain_of_title.breaks,
      years_searched: fx.years_searched,
      search_start_date: fx.search_start_date,
      search_end_date: fx.search_end_date,
      liens: fx.liens,
      easements: fx.easements ?? [],
      defects: fx.defects ?? [],
      data_sources: ["FIXTURE: " + fixtureName],
    })
    .select("id")
    .single();
  if (repErr) throw repErr;

  const idPath = join(process.cwd(), "scripts", "fixtures", ".last-seeded-id");
  writeFileSync(idPath, report.id, "utf-8");

  console.log(`[seed-fixture] created fixture report ${report.id}`);
  console.log(`[seed-fixture]   property: ${fx.property.full_address}`);
  console.log(`[seed-fixture]   stage: chain_analysis | liens: ${fx.liens.length} | chain: ${fx.chain_of_title.entries.length}`);
  console.log(`[seed-fixture]   id written to scripts/fixtures/.last-seeded-id`);
  console.log(`[seed-fixture] advance with: CLIROS_FORCE_REPORT_ID=${report.id} npx tsx scripts/run_pipeline_tick.ts`);
}

main().catch((e) => {
  console.error("[seed-fixture] failed:", e);
  process.exit(1);
});
