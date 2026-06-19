/* GET /api/reports/[id]/homeowner — Homeowner_Summary.pdf via vault or on-demand.
   Mirror of /api/reports/[id]/pdf but for the client-facing summary. Lives at
   its own path so the dashboard button can hit it without query params. */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getUserFromRequest, authRequiredResponse } from "@/lib/api-auth";

export const maxDuration = 120;
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

  const { data: owned } = await db
    .from("search_reports")
    .select("id")
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!owned) {
    return NextResponse.json({ error: "Report not found" }, { status: 404 });
  }

  try {
    const { ensureGeneratedPdf } = await import("@/lib/pipeline/render-pdfs");
    const signedUrl = await ensureGeneratedPdf(id, user.id, "homeowner");
    return NextResponse.redirect(signedUrl);
  } catch (err) {
    console.error(`[homeowner pdf] ${id} failed:`, err);
    return NextResponse.json(
      {
        error: "Could not generate Homeowner Summary PDF",
        detail: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}
