/* ─── AOL Generation Endpoint ─── */
/* GET /api/reports/[id]/aol
   Generates and returns an Attorney Opinion Letter for the given report.
   Returns plain text (downloadable as .txt file).
*/

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getUserFromRequest, authRequiredResponse } from "@/lib/api-auth";
import { generateAOLDraft } from "@/lib/aol-template";
import type { TitleSearchReport, PropertyAddress, ParcelInfo, ChainOfTitle, LienRecord, Easement, TitleDefect } from "@/lib/types";

export const maxDuration = 120;
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: reportId } = await params;
  const wantPdf = request.nextUrl.searchParams.get("format") === "pdf";

  const user = await getUserFromRequest(request);
  if (!user) return authRequiredResponse(request);
  const userId = user.id;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { db: { schema: "cliros" }, auth: { persistSession: false } }
  );

  if (wantPdf) {
    const { data: ownership } = await supabase
      .from("search_reports")
      .select("id")
      .eq("id", reportId)
      .eq("user_id", userId)
      .maybeSingle();
    if (!ownership) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }
    try {
      const { ensureGeneratedPdf } = await import("@/lib/pipeline/render-pdfs");
      const signedUrl = await ensureGeneratedPdf(reportId, userId, "aol");
      return NextResponse.redirect(signedUrl);
    } catch (err) {
      console.error(`[aol pdf] ${reportId} failed:`, err);
      return NextResponse.json(
        { error: "Could not generate AOL PDF", detail: err instanceof Error ? err.message : String(err) },
        { status: 500 }
      );
    }
  }

  const { data: row } = await supabase
    .from("search_reports")
    .select("*, properties(full_address, street, city, state, zip, county)")
    .eq("id", reportId)
    .eq("user_id", userId)
    .single();

  if (!row) {
    return NextResponse.json({ error: "Report not found" }, { status: 404 });
  }

  // Load user profile (works for attorneys and non-attorneys)
  const { data: userRow } = await supabase
    .from("users")
    .select("name, email, bar_number, firm_name, firm_address, state")
    .eq("id", userId)
    .single();

  const attorney = {
    name: userRow?.name || "[NAME]",
    barNumber: userRow?.bar_number || undefined,
    firmName: userRow?.firm_name || undefined,
    firmAddress: userRow?.firm_address || undefined,
    state: userRow?.state || "Georgia",
    email: userRow?.email || undefined,
  };

  // Build TitleSearchReport from DB row
  const prop = row.properties as Record<string, string> | null;
  const address: PropertyAddress = {
    street: prop?.street || "",
    city: prop?.city || "",
    state: prop?.state || "GA",
    zip: prop?.zip || "",
    county: prop?.county || "",
    fullAddress: prop?.full_address || "",
  };

  const parcel: ParcelInfo = {
    parcelId: "",
    county: prop?.county || "",
    state: prop?.state || "GA",
    legalDescription: undefined,
  };

  const chainOfTitle: ChainOfTitle = {
    entries: (row.chain_of_title || []) as unknown as ChainOfTitle["entries"],
    breaks: (row.chain_breaks || []) as string[],
    yearsSearched: row.years_searched || 0,
    startDate: row.search_start_date || "",
    endDate: row.search_end_date || "",
  };

  const report: TitleSearchReport = {
    id: row.id,
    userId,
    address,
    parcel,
    chainOfTitle,
    liens: (row.liens || []) as LienRecord[],
    easements: (row.easements || []) as Easement[],
    defects: (row.defects || []) as TitleDefect[],
    status: row.status,
    createdAt: row.created_at,
    completedAt: row.completed_at,
    summary: row.summary || "",
    riskScore: row.risk_score || 0,
  };

  // Generate AOL
  const aolContent = generateAOLDraft(report, attorney);

  // Return as downloadable text
  return new NextResponse(aolContent, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": `attachment; filename="AOL_${reportId}.txt"`,
    },
  });
}
