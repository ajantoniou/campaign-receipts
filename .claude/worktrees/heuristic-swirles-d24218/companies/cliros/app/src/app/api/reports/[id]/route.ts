/* ─── Report Detail (polled by dashboard for stage transitions) ───
   GET /api/reports/[id]
   Returns: report status, pipeline_stage, panel_verdict, links to PDFs in vault.
   The dashboard polls this every 3-5s while a report is in flight.
*/

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

async function getUserId(request: NextRequest): Promise<string | null> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  const authHeader = request.headers.get("authorization") || "";
  if (authHeader.startsWith("Bearer ")) {
    const c = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${authHeader.slice(7)}` } },
    });
    const { data } = await c.auth.getUser();
    if (data?.user?.id) return data.user.id;
  }

  const ref = supabaseUrl.match(/https:\/\/([^.]+)/)?.[1] || "";
  const cookieStr = request.headers.get("cookie") || "";
  const tokenMatch = cookieStr.match(new RegExp(`sb-${ref}-auth-token(?:\\.0)?=([^;]+)`));
  if (tokenMatch) {
    try {
      const parsed = JSON.parse(decodeURIComponent(tokenMatch[1]));
      if (parsed?.access_token) {
        const c = createClient(supabaseUrl, anonKey, {
          global: { headers: { Authorization: `Bearer ${parsed.access_token}` } },
        });
        const { data } = await c.auth.getUser();
        return data?.user?.id || null;
      }
    } catch { /* fall through */ }
  }
  return null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const userId = await getUserId(request);
  if (!userId) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { db: { schema: "cliros" }, auth: { persistSession: false } }
  );

  const { data: report } = await db
    .from("search_reports")
    .select(`
      id, status, pipeline_stage, panel_verdict, panel_ship_confidence_pct,
      stage_started_at, stage_attempts, last_error,
      billed, refund_reason,
      risk_score, summary, chain_of_title, chain_breaks, years_searched,
      liens, defects, data_sources,
      aol_pdf_path, homeowner_pdf_path,
      created_at, completed_at,
      property:properties(full_address, county, state, parcel_id,
        legal_description, acreage, assessed_value)
    `)
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle();

  if (!report) {
    return NextResponse.json({ error: "Report not found" }, { status: 404 });
  }

  // Fetch panel reviews if any
  const { data: reviews } = await db
    .from("report_qa_reviews")
    .select("persona, verdict, severity, blocking_issues, notes")
    .eq("report_id", id)
    .order("created_at", { ascending: true });

  return NextResponse.json({
    ...report,
    panel_reviews: reviews || [],
  });
}
