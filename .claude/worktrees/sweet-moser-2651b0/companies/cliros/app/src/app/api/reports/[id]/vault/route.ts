/* ─── Vault document download ───
   GET /api/reports/[id]/vault?docId=<report_documents.id>

   Auth-checks the report ownership, looks up the document, returns a
   302 redirect to a 60-second signed Supabase Storage URL. Same pattern
   as /api/reports/[id]/download (generated PDFs) but for the raw source
   snapshots (GSCCCA deeds/liens/UCC JSON, federal-court pulls,
   parcel-anchor) we started persisting in commit a5e89b9d.

   The signed URL is short-lived (60s) so the link can't be copy/pasted
   from network logs and reused later. Clicking the dashboard download
   button always gets a fresh URL.
*/

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getUserFromRequest, authRequiredResponse } from "@/lib/api-auth";
import { getDocumentUrl } from "@/lib/document-storage";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: reportId } = await params;
  const docId = request.nextUrl.searchParams.get("docId");
  if (!docId) {
    return NextResponse.json({ error: "docId query param required" }, { status: 400 });
  }

  const user = await getUserFromRequest(request);
  if (!user) return authRequiredResponse(request);

  const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { db: { schema: "cliros" }, auth: { persistSession: false } },
  );

  // Verify the report belongs to this user before handing out a signed URL
  // for any of its vault files. Defense in depth on top of the RLS policy
  // on report_documents (which already restricts SELECT to owning user).
  const { data: owned } = await db
    .from("search_reports")
    .select("id")
    .eq("id", reportId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!owned) {
    return NextResponse.json({ error: "Report not found" }, { status: 404 });
  }

  // Look up the vault document — MUST belong to this report (defense in
  // depth: a leaked docId from another report can't be used to grab
  // someone else's file).
  const { data: doc } = await db
    .from("report_documents")
    .select("id, storage_path, filename")
    .eq("id", docId)
    .eq("report_id", reportId)
    .maybeSingle();
  if (!doc) {
    return NextResponse.json({ error: "Vault document not found for this report" }, { status: 404 });
  }

  try {
    const signedUrl = await getDocumentUrl(doc.storage_path as string, 60);
    return NextResponse.redirect(signedUrl);
  } catch (err) {
    console.error(`[vault] sign failed for ${docId} (${doc.storage_path}):`, err);
    return NextResponse.json(
      { error: "Could not generate download URL", detail: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}
