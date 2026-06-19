/* POST /api/reports/[id]/drafts/revert — restore a prior draft revision.
 *
 *  Body: { revisionId }. Looks up the snapshot's prior_text and re-applies it
 *  through snapshot_and_apply_draft (source='revert'), so the revert ALSO
 *  snapshots the current text first — undo is itself undoable. Ownership is
 *  enforced both on the revision lookup and inside the RPC.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getUserFromRequest, authRequiredResponse } from "@/lib/api-auth";

export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: reportId } = await params;
  const user = await getUserFromRequest(request);
  if (!user) return authRequiredResponse(request);

  let body: { revisionId?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const revisionId = typeof body.revisionId === "string" ? body.revisionId : "";
  if (!revisionId) {
    return NextResponse.json({ error: "Missing 'revisionId'" }, { status: 400 });
  }

  const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { db: { schema: "cliros" }, auth: { persistSession: false } },
  );

  // Confirm caller owns the report this revision belongs to, and fetch the
  // restore point. (draft_revisions has no user_id; ownership is via the report.)
  const { data: owns } = await db
    .from("search_reports")
    .select("id")
    .eq("id", reportId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!owns) {
    return NextResponse.json({ error: "Report not found" }, { status: 404 });
  }

  const { data: rev } = await db
    .from("draft_revisions")
    .select("id, field, prior_text")
    .eq("id", revisionId)
    .eq("report_id", reportId)
    .maybeSingle();
  if (!rev) {
    return NextResponse.json({ error: "Revision not found" }, { status: 404 });
  }

  const { data, error } = await db.rpc("snapshot_and_apply_draft", {
    p_report: reportId,
    p_user: user.id,
    p_field: rev.field,
    p_new_text: rev.prior_text ?? "",
    p_source: "revert",
    p_note: `reverted to revision ${revisionId.slice(0, 8)}`,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  const result = Array.isArray(data) ? data[0] : data;
  if (!result?.applied) {
    return NextResponse.json({ error: "Revert failed" }, { status: 500 });
  }
  return NextResponse.json({ ok: true, field: rev.field, restoredText: rev.prior_text ?? "" });
}
