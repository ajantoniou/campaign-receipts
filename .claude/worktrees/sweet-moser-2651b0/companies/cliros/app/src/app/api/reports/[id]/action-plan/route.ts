/* GET /api/reports/[id]/action-plan — attorney closing checklist */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getUserFromRequest, authRequiredResponse } from "@/lib/api-auth";
import {
  buildAttorneyActionPlan,
  persistAttorneyActionPlan,
  reportRowToTitleSearch,
} from "@/lib/attorney-action-plan";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: reportId } = await params;
  const user = await getUserFromRequest(request);
  if (!user) return authRequiredResponse(request);

  const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { db: { schema: "cliros" }, auth: { persistSession: false } },
  );

  const { data: row } = await db
    .from("search_reports")
    .select(
      `id, user_id, summary, risk_score, chain_of_title, chain_breaks, years_searched,
       search_start_date, search_end_date, liens, defects, aol_draft, attorney_action_plan,
       property:properties(full_address, street, city, state, zip, county, parcel_id, legal_description)`,
    )
    .eq("id", reportId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!row) {
    return NextResponse.json({ error: "Report not found" }, { status: 404 });
  }

  if (row.attorney_action_plan) {
    return NextResponse.json(row.attorney_action_plan);
  }

  const rawProp = (row as { property?: Record<string, unknown> | Record<string, unknown>[] }).property;
  const property = (Array.isArray(rawProp) ? rawProp[0] : rawProp) || {};
  const report = reportRowToTitleSearch(row as Record<string, unknown>, property as Record<string, unknown>);
  const plan = await persistAttorneyActionPlan(db, reportId, report);
  return NextResponse.json(plan);
}
