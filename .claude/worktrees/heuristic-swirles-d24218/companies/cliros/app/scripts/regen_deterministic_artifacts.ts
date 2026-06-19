/* ─── Regenerate deterministic AOL artifacts (no AI call) ───
   Rebuilds aol_draft + attorney_action_plan for an existing report from its
   already-persisted structured arrays and the already-persisted aol_lock
   opinion_language. Use after a deterministic template / action-plan code change
   so the persisted dossier reflects the new code WITHOUT re-running the persona
   stages (which cost AI tokens and are non-deterministic).

   Usage:
     set -a && source .env.local && set +a
     CLIROS_FORCE_REPORT_ID=<id> npx tsx scripts/regen_deterministic_artifacts.ts
*/
import { createClient } from "@supabase/supabase-js";
import { generateAOLDraft, type AOLAuthorInfo } from "../src/lib/aol-template";
import {
  persistAttorneyActionPlan,
  reportRowToTitleSearch,
} from "../src/lib/attorney-action-plan";

async function main() {
  const reportId = process.env.CLIROS_FORCE_REPORT_ID;
  if (!reportId) throw new Error("set CLIROS_FORCE_REPORT_ID");

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  const db = createClient(url, key, { db: { schema: "cliros" } });

  const { data: r, error } = await db
    .from("search_reports")
    .select(
      `id, user_id, summary, risk_score, chain_of_title, chain_breaks, years_searched,
       search_start_date, search_end_date, liens, easements, defects, aol_draft, created_at,
       property:properties(full_address, street, city, state, zip, county, parcel_id, legal_description)`
    )
    .eq("id", reportId)
    .single();
  if (error || !r) throw new Error(`report ${reportId} not found: ${error?.message}`);

  const rawProp = (r as unknown as { property?: unknown }).property;
  const property = (Array.isArray(rawProp) ? rawProp[0] : rawProp) || {};

  const titleReport = reportRowToTitleSearch(
    r as unknown as Record<string, unknown>,
    property as Record<string, unknown>
  );

  // Reuse the persisted aol_lock opinion_language — do NOT re-run the persona.
  const { data: pass } = await db
    .from("persona_passes")
    .select("artifact")
    .eq("report_id", reportId)
    .eq("stage", "aol_lock")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const opinionLanguage =
    (pass?.artifact as { opinion_language?: string } | null)?.opinion_language || "";
  if (!opinionLanguage) {
    console.warn("[regen] no persisted opinion_language — opinion will use the deterministic fallback");
  }

  const author: AOLAuthorInfo = {
    name: "[ATTORNEY NAME]",
    state: titleReport.parcel.state || "Georgia",
  };
  const assembled = generateAOLDraft(titleReport, author, opinionLanguage);

  await db.from("search_reports").update({ aol_draft: assembled }).eq("id", reportId);
  await persistAttorneyActionPlan(db, reportId, { ...titleReport, aolDraft: assembled });

  console.log(`[regen] rebuilt aol_draft (${assembled.length} chars) + action plan for ${reportId}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
