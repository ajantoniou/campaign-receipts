/* ─── Source data package builder ───
   Shared by GET /api/reports/[id]/sources and founder email pack.
   No raw_data column — structured fields on search_reports are the vault.
*/

import type { SupabaseClient } from "@supabase/supabase-js";

export interface SourceDocumentRef {
  id: string;
  category: string;
  filename: string;
  storagePath: string;
  sizeBytes: number;
}

export async function buildSourcePackage(
  db: SupabaseClient<any, any, any>,
  reportId: string,
): Promise<Record<string, unknown>> {
  const { data: row, error } = await db
    .from("search_reports")
    .select(
      "id, property_id, chain_of_title, chain_breaks, liens, easements, defects, summary, risk_score, data_sources, created_at, aol_draft, ai_spend_cents, years_searched, search_start_date, search_end_date",
    )
    .eq("id", reportId)
    .single();

  if (error || !row) {
    throw new Error(error?.message || "Report not found");
  }

  let property: Record<string, string> | null = null;
  if (row.property_id) {
    const { data: prop } = await db
      .from("properties")
      .select("full_address, county, state, parcel_id, legal_description")
      .eq("id", row.property_id as string)
      .maybeSingle();
    property = prop as Record<string, string> | null;
  }

  const { data: vaultDocs } = await db
    .from("report_documents")
    .select("id, category, filename, storage_path, size_bytes")
    .eq("report_id", reportId)
    .order("created_at", { ascending: true });

  const sourceIndex = buildSourceIndex(
    (row.chain_of_title as Record<string, unknown>[]) || [],
    (row.liens as Record<string, unknown>[]) || [],
  );

  return {
    _metadata: {
      reportId: row.id,
      property: property?.full_address || "Unknown",
      county: property?.county || "Unknown",
      state: property?.state || "GA",
      parcelId: property?.parcel_id || null,
      generatedAt: row.created_at,
      downloadedAt: new Date().toISOString(),
      provider: "Cliros.ai",
      note: "Structured source records and vault file index for this title search. Cited in the Attorney Opinion Letter SOURCE SCHEDULE.",
    },
    report: {
      summary: row.summary,
      riskScore: row.risk_score,
      dataSources: row.data_sources,
      aiSpendCents: row.ai_spend_cents,
      yearsSearched: row.years_searched,
      searchWindow: {
        start: row.search_start_date,
        end: row.search_end_date,
      },
    },
    aolDraft: row.aol_draft,
    sourceIndex,
    chainOfTitle: row.chain_of_title || [],
    chainBreaks: row.chain_breaks || [],
    liens: row.liens || [],
    easements: row.easements || [],
    defects: row.defects || [],
    vaultDocuments: (vaultDocs || []).map((d) => ({
      vaultId: d.id,
      category: d.category,
      filename: d.filename,
      storagePath: d.storage_path,
      sizeBytes: d.size_bytes,
    })),
    rawSourceArtifacts: (vaultDocs || [])
      .filter((d) => (d.category as string) !== "generated")
      .map((d) => ({
        vaultId: d.id,
        category: d.category,
        filename: d.filename,
        storagePath: d.storage_path,
        sizeBytes: d.size_bytes,
      })),
  };
}

/** Numbered refs (DOC-001…) for AOL citations and vault crosswalk. */
export function buildSourceIndex(
  chain: Record<string, unknown>[],
  liens: Record<string, unknown>[],
): Array<Record<string, unknown>> {
  const index: Array<Record<string, unknown>> = [];
  let n = 1;

  for (const e of chain) {
    index.push({
      vaultRef: `DOC-${String(n).padStart(3, "0")}`,
      kind: "chain",
      instrumentType: e.type || e.instrumentType || "deed",
      bookPage: e.bookPage || (e.book && e.page ? `${e.book}-${e.page}` : null),
      instrumentNumber: e.instrumentNumber || null,
      grantor: e.grantor,
      grantee: e.grantee,
      recordedDate: e.recordedDate || e.date,
    });
    n++;
  }

  for (const l of liens) {
    index.push({
      vaultRef: `DOC-${String(n).padStart(3, "0")}`,
      kind: "lien",
      type: l.type,
      status: l.status,
      bookPage: l.bookPage || l.referencedBookPage || null,
      instrumentNumber: l.instrumentNumber || null,
      creditor: l.creditor,
      debtor: l.debtor,
      amount: l.amount,
      recordedDate: l.recordedDate || l.filingDate,
    });
    n++;
  }

  return index;
}
