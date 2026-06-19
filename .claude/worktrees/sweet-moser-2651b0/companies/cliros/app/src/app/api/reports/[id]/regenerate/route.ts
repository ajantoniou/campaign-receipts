/* ─── Regenerate PDF deliverables ───
   POST /api/reports/[id]/regenerate
   Clears vault PDFs and re-renders from saved drafts + firm profile.
*/

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getUserFromRequest, authRequiredResponse } from "@/lib/api-auth";
import { regenerateAllPdfs } from "@/lib/pipeline/render-pdfs";

export const maxDuration = 120;
export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: reportId } = await params;
  const user = await getUserFromRequest(request);
  if (!user) return authRequiredResponse(request);

  const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { db: { schema: "cliros" }, auth: { persistSession: false } }
  );

  const { data: owned } = await db
    .from("search_reports")
    .select("id")
    .eq("id", reportId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!owned) {
    return NextResponse.json({ error: "Report not found" }, { status: 404 });
  }

  try {
    await regenerateAllPdfs(reportId, user.id);
    return NextResponse.json({ ok: true, message: "PDFs regenerated" });
  } catch (err) {
    console.error(`[regenerate] ${reportId}:`, err);
    return NextResponse.json(
      {
        error: "Could not regenerate PDFs",
        detail: err instanceof Error ? err.message : String(err),
      },
      { status: 500 },
    );
  }
}
