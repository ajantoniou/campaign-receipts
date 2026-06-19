/* POST /api/reports/[id]/drafts/apply — the ATTORNEY APPROVAL gate.
 *
 *  Applies attorney-approved text to one draft field (aol_draft or
 *  client_report_draft) THROUGH the atomic snapshot_and_apply_draft RPC, which
 *  snapshots the prior value into cliros.draft_revisions before overwriting — so
 *  every approved edit is reversible. Ownership is enforced inside the RPC.
 *
 *  This is the ONLY path that persists an assistant-proposed edit; the
 *  propose-edit route never writes. Nothing here is automatic — the attorney
 *  clicked "Approve" on a proposal they reviewed.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getUserFromRequest, authRequiredResponse } from "@/lib/api-auth";

export const dynamic = "force-dynamic";

const MAX_TEXT_CHARS = 60_000;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: reportId } = await params;
  const user = await getUserFromRequest(request);
  if (!user) return authRequiredResponse(request);

  let body: { target?: unknown; text?: unknown; note?: unknown; source?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const target = body.target === "client_report_draft" ? "client_report_draft" : "aol_draft";
  const text = typeof body.text === "string" ? body.text : null;
  if (text == null) {
    return NextResponse.json({ error: "Missing 'text'" }, { status: 400 });
  }
  if (text.length > MAX_TEXT_CHARS) {
    return NextResponse.json({ error: "Text exceeds maximum length." }, { status: 400 });
  }
  // 'revert' is set by the revert route; an attorney approval is 'assistant_apply'
  // (proposal-derived) or 'manual' (hand-typed). Default to assistant_apply.
  const source =
    body.source === "manual" || body.source === "revert" ? body.source : "assistant_apply";
  const note = typeof body.note === "string" ? body.note.slice(0, 500) : null;

  const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { db: { schema: "cliros" }, auth: { persistSession: false } },
  );

  const { data, error } = await db.rpc("snapshot_and_apply_draft", {
    p_report: reportId,
    p_user: user.id,
    p_field: target,
    p_new_text: text,
    p_source: source,
    p_note: note,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  // RPC returns a single row { revision_id, applied }.
  const result = Array.isArray(data) ? data[0] : data;
  if (!result?.applied) {
    return NextResponse.json({ error: "Report not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, revisionId: result.revision_id, target });
}
