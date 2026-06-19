/* GET /api/reports/[id]/download?doc=title|aol|homeowner — vault PDF with session auth.
   If the PDF isn't in the vault yet (cron never ran, or chromium unavailable
   on the cron), fall back to on-demand generation in the web service which
   has a working playwright install. Cached after first render. */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getUserFromRequest, authRequiredResponse } from "@/lib/api-auth";

export const maxDuration = 120;
export const dynamic = "force-dynamic";
export const revalidate = 0;

type DocType =
  | "title"
  | "aol"
  | "homeowner"
  | "commitment"
  | "deed"
  | "settlement"
  | "pt61"
  | "seller_affidavit"
  | "form_1099s"
  | "owners_affidavit";
const VALID: Record<string, DocType> = {
  title: "title",
  aol: "aol",
  homeowner: "homeowner",
  commitment: "commitment",
  deed: "deed",
  settlement: "settlement",
  pt61: "pt61",
  seller_affidavit: "seller_affidavit",
  form_1099s: "form_1099s",
  owners_affidavit: "owners_affidavit",
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: reportId } = await params;
  const docParam = request.nextUrl.searchParams.get("doc") || "title";
  const doc = VALID[docParam];
  if (!doc) {
    return NextResponse.json({ error: "Invalid doc type" }, { status: 400 });
  }

  const user = await getUserFromRequest(request);
  if (!user) return authRequiredResponse(request);

  const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { db: { schema: "cliros" }, auth: { persistSession: false } }
  );

  const { data: report } = await db
    .from("search_reports")
    .select("id")
    .eq("id", reportId)
    .eq("user_id", user.id)
    .single();

  if (!report) {
    return NextResponse.json({ error: "Report not found" }, { status: 404 });
  }

  try {
    const { ensureGeneratedPdf } = await import("@/lib/pipeline/render-pdfs");
    const signedUrl = await ensureGeneratedPdf(reportId, user.id, doc);
    return NextResponse.redirect(signedUrl);
  } catch (err) {
    console.error(`[download] ${doc} ${reportId} failed:`, err);
    return NextResponse.json(
      {
        error: "Could not generate PDF",
        detail: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}
