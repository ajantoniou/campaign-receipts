/* ─── Source Data Download ─── */
/* GET /api/reports/[id]/sources
   Returns structured vault JSON (chain, liens, defects, source index).
*/

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getUserFromRequest, authRequiredResponse } from "@/lib/api-auth";
import { buildSourcePackage } from "@/lib/source-package";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: reportId } = await params;

  const user = await getUserFromRequest(request);
  if (!user) return authRequiredResponse(request);

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { db: { schema: "cliros" }, auth: { persistSession: false } }
  );

  const { data: owned } = await supabase
    .from("search_reports")
    .select("id")
    .eq("id", reportId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!owned) {
    return NextResponse.json({ error: "Report not found" }, { status: 404 });
  }

  try {
    const sourcePackage = await buildSourcePackage(supabase, reportId);
    const jsonStr = JSON.stringify(sourcePackage, null, 2);

    return new NextResponse(jsonStr, {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="Cliros_Sources_${reportId}.json"`,
      },
    });
  } catch (err) {
    console.error(`[sources] ${reportId}:`, err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Could not build source package" },
      { status: 500 }
    );
  }
}
