/* ─── Report draft editing ───
   PATCH /api/reports/[id]/drafts
   Saves attorney-edited AOL + client report text before PDF render.
*/

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getUserFromRequest, authRequiredResponse } from "@/lib/api-auth";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: reportId } = await params;
  const user = await getUserFromRequest(request);
  if (!user) return authRequiredResponse(request);

  let body: { aol_draft?: string; client_report_draft?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const updates: Record<string, string | null> = {};
  if (typeof body.aol_draft === "string") updates.aol_draft = body.aol_draft;
  if (typeof body.client_report_draft === "string") {
    updates.client_report_draft = body.client_report_draft;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No draft fields provided" }, { status: 400 });
  }

  const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { db: { schema: "cliros" }, auth: { persistSession: false } }
  );

  const { data, error } = await db
    .from("search_reports")
    .update(updates)
    .eq("id", reportId)
    .eq("user_id", user.id)
    .select("id, aol_draft, client_report_draft")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ error: "Report not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, ...data });
}
