/* GET /api/reports/[id]/insights
   Returns dashboard-only metadata: signed imagery URLs + persona pass
   composites. Kept out of the main report payload so it can fetch signed
   URLs server-side (the browser can't sign storage URLs without RLS).
*/

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getUserFromRequest, authRequiredResponse } from "@/lib/api-auth";
import { resolveImageryUrls } from "@/lib/agents/property-imagery";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getUserFromRequest(request);
  if (!user) return authRequiredResponse(request);

  const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { db: { schema: "cliros" }, auth: { persistSession: false } }
  );

  const { data: report } = await db
    .from("search_reports")
    .select("id, property_id, ai_spend_cents, pipeline_stage")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!report) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { data: property } = await db
    .from("properties")
    .select("imagery")
    .eq("id", report.property_id)
    .maybeSingle();

  const imagery = await resolveImageryUrls(
    (property?.imagery as Record<string, unknown> | undefined) || null
  );

  // Latest attempt per stage — what the dashboard badge should reflect.
  const { data: passes } = await db
    .from("persona_passes")
    .select("stage, attempt, step_qc, cost_cents_total, created_at")
    .eq("report_id", id)
    .order("attempt", { ascending: false });

  const latestByStage: Record<string, Record<string, unknown>> = {};
  for (const row of passes || []) {
    if (!latestByStage[row.stage]) {
      latestByStage[row.stage] = row;
    }
  }

  const STAGES = ["chain_analysis", "lien_analysis", "defect_review", "aol_lock"];
  const stageBadges = STAGES.map((s) => {
    const row = latestByStage[s];
    if (!row) return { stage: s, status: "pending", composite: null };
    const qc = (row.step_qc as Record<string, unknown>) || {};
    return {
      stage: s,
      status: qc.verdict === "PASS" ? "pass" : "fail",
      composite: typeof qc.composite === "number" ? qc.composite : null,
      scores: qc.scores || null,
      fixes: qc.fixes || [],
      cost_cents: row.cost_cents_total || 0,
      attempt: row.attempt || 1,
    };
  });

  return NextResponse.json({
    imagery,
    stages: stageBadges,
    ai_spend_cents: report.ai_spend_cents || 0,
    pipeline_stage: report.pipeline_stage,
  });
}
