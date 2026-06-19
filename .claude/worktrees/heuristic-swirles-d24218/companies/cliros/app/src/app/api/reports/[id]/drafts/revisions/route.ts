/* GET  /api/reports/[id]/drafts/revisions?field=aol_draft — revision history
 * POST /api/reports/[id]/drafts/revisions/revert — restore a prior version
 *
 * The undo trail for attorney-in-the-loop edits. Each apply snapshots the prior
 * text; this lists those restore points and reverts to one (which itself
 * snapshots the current text first, so revert is also reversible).
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getUserFromRequest, authRequiredResponse } from "@/lib/api-auth";

export const dynamic = "force-dynamic";

function svc() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { db: { schema: "cliros" }, auth: { persistSession: false } },
  );
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: reportId } = await params;
  const user = await getUserFromRequest(request);
  if (!user) return authRequiredResponse(request);

  const field = new URL(request.url).searchParams.get("field") || "aol_draft";
  if (field !== "aol_draft" && field !== "client_report_draft") {
    return NextResponse.json({ error: "Invalid field" }, { status: 400 });
  }

  const db = svc();
  // Ownership: confirm the report belongs to the caller before listing.
  const { data: owns } = await db
    .from("search_reports")
    .select("id")
    .eq("id", reportId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!owns) {
    return NextResponse.json({ error: "Report not found" }, { status: 404 });
  }

  const { data: revs, error } = await db
    .from("draft_revisions")
    .select("id, field, source, note, created_at")
    .eq("report_id", reportId)
    .eq("field", field)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ field, revisions: revs ?? [] });
}
