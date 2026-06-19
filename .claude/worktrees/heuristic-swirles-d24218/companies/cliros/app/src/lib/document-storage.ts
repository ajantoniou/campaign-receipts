/* ─── Document Storage ───
   Wraps Supabase Storage for the report-documents vault. Each report has
   a folder; categories: deeds, liens, uccs, court_records, generated, other.

   Generated PDFs (title report, AOL letter, homeowner summary) are stored
   under category='generated' with metadata.type identifying which doc.
*/

import { createClient } from "@supabase/supabase-js";

const BUCKET = "report-documents";

export interface StoredDocument {
  id: string;
  reportId: string;
  category: string;
  filename: string;
  storagePath: string;
  mimeType: string;
  sizeBytes: number;
  metadata: Record<string, unknown>;
}

function admin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

function adminCliros() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { db: { schema: "cliros" }, auth: { persistSession: false } }
  );
}

async function ensureBucket(): Promise<void> {
  const client = admin();
  const { data: buckets } = await client.storage.listBuckets();
  if (!buckets?.find((b) => b.name === BUCKET)) {
    await client.storage.createBucket(BUCKET, {
      public: false,
      fileSizeLimit: 50 * 1024 * 1024,
    });
  }
}

export async function uploadDocument(
  reportId: string,
  category: StoredDocument["category"],
  filename: string,
  data: Buffer | Uint8Array,
  mimeType: string,
  metadata: Record<string, unknown> = {}
): Promise<StoredDocument> {
  await ensureBucket();
  const client = admin();
  const storagePath = `${reportId}/${category}/${filename}`;
  const { error } = await client.storage
    .from(BUCKET)
    .upload(storagePath, data as Buffer, { contentType: mimeType, upsert: true });
  if (error) throw new Error(`Upload failed: ${error.message}`);

  const id = `${reportId}-${category}-${filename}`;
  const db = adminCliros();
  await db.from("report_documents").upsert({
    id,
    report_id: reportId,
    category,
    filename,
    storage_path: storagePath,
    mime_type: mimeType,
    size_bytes: data.length,
    metadata,
  });

  return {
    id,
    reportId,
    category,
    filename,
    storagePath,
    mimeType,
    sizeBytes: data.length,
    metadata,
  };
}

const LOGO_MIME: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
};

/** Firm letterhead logo — stored outside report vault paths. */
export async function uploadFirmLogo(
  firmId: string,
  data: Buffer,
  ext: string,
): Promise<{ storagePath: string; mimeType: string }> {
  await ensureBucket();
  const normalized = ext.toLowerCase().replace(/^\./, "");
  const mimeType = LOGO_MIME[normalized] || "image/png";
  const storagePath = `firm-assets/${firmId}/logo.${normalized}`;
  const client = admin();
  const { error } = await client.storage
    .from(BUCKET)
    .upload(storagePath, data, { contentType: mimeType, upsert: true });
  if (error) throw new Error(`Logo upload failed: ${error.message}`);
  return { storagePath, mimeType };
}

export async function getDocumentUrl(
  storagePath: string,
  expiresInSeconds = 3600
): Promise<string> {
  const client = admin();
  const { data, error } = await client.storage
    .from(BUCKET)
    .createSignedUrl(storagePath, expiresInSeconds);
  if (error) throw new Error(`Signed URL failed: ${error.message}`);
  return data.signedUrl;
}

export async function storeGeneratedPDF(
  reportId: string,
  pdfBuffer: Buffer,
  type: "title_report" | "aol_letter" | "homeowner_summary"
): Promise<StoredDocument> {
  const labels: Record<string, string> = {
    title_report: "Title_Search_Report",
    aol_letter: "Attorney_Opinion_Letter",
    homeowner_summary: "Homeowner_Summary",
  };
  const filename = `${labels[type]}.pdf`;
  return uploadDocument(reportId, "generated", filename, pdfBuffer, "application/pdf", { type });
}

const GENERATED_FILENAMES = [
  "Title_Search_Report.pdf",
  "Attorney_Opinion_Letter.pdf",
  "Homeowner_Summary.pdf",
  "Title_Commitment_Summary.pdf",
  "Draft_Warranty_Deed.pdf",
  "Settlement_Statement.pdf",
  "PT-61_Transfer_Tax.pdf",
  "Seller_Affidavit_of_Title.pdf",
  "Form_1099-S_Draft.pdf",
  "Owners_Policy_Affidavit.pdf",
];

/** Remove vault PDFs so ensureGeneratedPdf re-renders from latest drafts. */
export async function invalidateGeneratedPdfs(reportId: string): Promise<void> {
  const db = adminCliros();
  const { data: docs } = await db
    .from("report_documents")
    .select("id, storage_path")
    .eq("report_id", reportId)
    .in("filename", GENERATED_FILENAMES);

  if (!docs?.length) return;

  const paths = docs.map((d) => d.storage_path as string).filter(Boolean);
  if (paths.length) {
    const client = admin();
    await client.storage.from(BUCKET).remove(paths);
  }
  await db.from("report_documents").delete().in(
    "id",
    docs.map((d) => d.id as string),
  );
}

export async function listReportDocuments(reportId: string): Promise<StoredDocument[]> {
  const db = adminCliros();
  const { data } = await db
    .from("report_documents")
    .select("*")
    .eq("report_id", reportId)
    .order("created_at", { ascending: true });
  return (data || []).map((r: Record<string, unknown>) => ({
    id: r.id as string,
    reportId: r.report_id as string,
    category: r.category as string,
    filename: r.filename as string,
    storagePath: r.storage_path as string,
    mimeType: r.mime_type as string,
    sizeBytes: (r.size_bytes as number) || 0,
    metadata: (r.metadata as Record<string, unknown>) || {},
  }));
}
