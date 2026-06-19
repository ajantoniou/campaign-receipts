/* ─── On-demand PDF renderer ───
   Web service has playwright/chromium installed; crons sometimes don't. When
   the download API is hit and the vault is empty, generate the PDF inline
   and persist it for future fetches. Same generators used by stageDrafting,
   factored out so both call sites share branding lookup logic.
*/

import { createClient } from "@supabase/supabase-js";
import type { TitleSearchReport } from "../types";
import {
  generateReportPDF,
  generateAOLPDF,
  generateHomeownerSummaryPDF,
  generateTitleCommitmentPDF,
  generateWarrantyDeedPDF,
  generateSettlementStatementPDF,
  generatePT61PDF,
  generateSellerAffidavitPDF,
  generate1099SPDF,
  generateOwnersPolicyAffidavitPDF,
  type BrandingContext,
} from "./pdf";
import {
  uploadDocument,
  storeGeneratedPDF,
  getDocumentUrl,
  invalidateGeneratedPdfs,
} from "../document-storage";

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

const FILENAMES: Record<DocType, string> = {
  title: "Title_Search_Report.pdf",
  aol: "Attorney_Opinion_Letter.pdf",
  homeowner: "Homeowner_Summary.pdf",
  commitment: "Title_Commitment_Summary.pdf",
  deed: "Draft_Warranty_Deed.pdf",
  settlement: "Settlement_Statement.pdf",
  pt61: "PT-61_Transfer_Tax.pdf",
  seller_affidavit: "Seller_Affidavit_of_Title.pdf",
  form_1099s: "Form_1099-S_Draft.pdf",
  owners_affidavit: "Owners_Policy_Affidavit.pdf",
};

function db() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { db: { schema: "cliros" }, auth: { persistSession: false } }
  );
}

async function loadReportPayload(reportId: string): Promise<TitleSearchReport> {
  const sb = db();
  const { data: r } = await sb
    .from("search_reports")
    .select(`
      id, summary, risk_score, chain_of_title, chain_breaks, years_searched,
      search_start_date, search_end_date, liens, easements, defects, aol_draft, client_report_draft,
      property:properties(full_address, street, city, state, zip, county, parcel_id, legal_description, acreage, assessed_value, imagery)
    `)
    .eq("id", reportId)
    .single();
  if (!r) throw new Error("Report not found");
  const rawProp = (r as unknown as { property?: Record<string, unknown> | Record<string, unknown>[] }).property;
  const p: Record<string, unknown> =
    Array.isArray(rawProp) ? (rawProp[0] || {}) : (rawProp || {});
  return {
    id: r.id,
    address: {
      fullAddress: String(p.full_address ?? ""),
      street: String(p.street ?? ""),
      city: String(p.city ?? ""),
      state: String(p.state ?? "GA"),
      zip: String(p.zip ?? ""),
    },
    parcel: {
      county: String(p.county ?? ""),
      state: String(p.state ?? "GA"),
      parcelId: String(p.parcel_id ?? ""),
      legalDescription: String(p.legal_description ?? ""),
    },
    chainOfTitle: {
      entries: r.chain_of_title || [],
      breaks: r.chain_breaks || [],
      yearsSearched: r.years_searched || 0,
      startDate: r.search_start_date || "",
      endDate: r.search_end_date || "",
    },
    liens: r.liens || [],
    easements: r.easements || [],
    defects: r.defects || [],
    summary: r.summary || "",
    riskScore: r.risk_score || 0,
    aolDraft: (r as unknown as { aol_draft?: string | null }).aol_draft || undefined,
    clientReportDraft:
      (r as unknown as { client_report_draft?: string | null }).client_report_draft || undefined,
    imagery: (p.imagery as Record<string, unknown> | undefined) || undefined,
  } as unknown as TitleSearchReport;
}

async function loadBranding(userId: string): Promise<BrandingContext> {
  const sb = db();
  const { data: user } = await sb
    .from("users")
    .select("id, name, email, bar_number, state, default_firm_id")
    .eq("id", userId)
    .maybeSingle();
  let firm: Record<string, unknown> | null = null;
  let attorney: Record<string, unknown> | null = null;
  if (user?.default_firm_id) {
    const { data: f } = await sb.from("firms").select("*").eq("id", user.default_firm_id).maybeSingle();
    firm = f || null;
    const { data: a } = await sb
      .from("firm_attorneys")
      .select("*")
      .eq("firm_id", user.default_firm_id)
      .eq("is_default", true)
      .maybeSingle();
    attorney = a || null;
  }
  return { user, firm, attorney } as BrandingContext;
}

/* Produce one of the three PDFs, persist to vault, return signed URL.
   Throws if playwright/chromium isn't available so caller can show a
   clear error instead of silently corrupting the vault. */
export async function ensureGeneratedPdf(
  reportId: string,
  userId: string,
  doc: DocType
): Promise<string> {
  const sb = db();
  const { data: existing } = await sb
    .from("report_documents")
    .select("storage_path")
    .eq("report_id", reportId)
    .eq("filename", FILENAMES[doc])
    .maybeSingle();
  if (existing?.storage_path) {
    return getDocumentUrl(existing.storage_path, 300);
  }

  const report = await loadReportPayload(reportId);
  const branding = await loadBranding(userId);
  // Deed + Settlement statement need buyer-name + closing_date + loan from
  // search_hints. One extra DB fetch when generating either.
  let closingOpts: {
    buyerName?: string;
    buyerName2?: string;
    jointTenancy?: boolean;
    considerationUsd?: number;
    closingDate?: string;
    loanAmountUsd?: number;
    purchasePriceUsd?: number;
  } = {};
  if (doc === "deed" || doc === "settlement" || doc === "pt61" || doc === "seller_affidavit" || doc === "form_1099s" || doc === "owners_affidavit") {
    const { data: hintRow } = await db()
      .from("search_reports")
      .select("search_hints, closing_date")
      .eq("id", reportId)
      .maybeSingle();
    const hints = (hintRow?.search_hints as Record<string, unknown> | null) || {};
    // loanAmount in hints is CENTS; both PDF templates want USD whole dollars.
    const loanUsd = typeof hints.loanAmount === "number"
      ? Math.round((hints.loanAmount as number) / 100)
      : undefined;
    closingOpts = {
      buyerName: (hints.buyerName as string | undefined) || undefined,
      buyerName2: (hints.buyerName2 as string | undefined) || undefined,
      jointTenancy: hints.jointTenancy === true,
      considerationUsd: loanUsd,
      loanAmountUsd: loanUsd,
      // Settlement statement falls back to loan / 0.8 (20% down) when no
      // explicit purchase price; that math lives in the template, here
      // we just plumb what the attorney supplied (none today).
      purchasePriceUsd: undefined,
      closingDate: (hintRow?.closing_date as string | undefined) || undefined,
    };
  }

  let buf: Buffer;
  if (doc === "title") buf = await generateReportPDF(report, branding);
  else if (doc === "aol") buf = await generateAOLPDF(report, branding);
  else if (doc === "homeowner") buf = await generateHomeownerSummaryPDF(report, branding);
  else if (doc === "commitment") buf = await generateTitleCommitmentPDF(report, branding);
  else if (doc === "deed") buf = await generateWarrantyDeedPDF(report, branding, closingOpts);
  else if (doc === "settlement") buf = await generateSettlementStatementPDF(report, branding, closingOpts);
  else if (doc === "pt61") buf = await generatePT61PDF(report, branding, closingOpts);
  else if (doc === "seller_affidavit") buf = await generateSellerAffidavitPDF(report, branding, closingOpts);
  else if (doc === "form_1099s") buf = await generate1099SPDF(report, branding, closingOpts);
  else buf = await generateOwnersPolicyAffidavitPDF(report, branding, closingOpts);

  if (doc === "title") {
    const stored = await storeGeneratedPDF(reportId, buf, "title_report");
    return getDocumentUrl(stored.storagePath, 300);
  }
  const stored = await uploadDocument(
    reportId,
    "generated",
    FILENAMES[doc],
    buf,
    "application/pdf",
    {
      type:
        doc === "aol"
          ? "aol_letter"
          : doc === "homeowner"
            ? "homeowner_summary"
            : doc === "commitment"
              ? "title_commitment"
              : doc === "deed"
                ? "warranty_deed_draft"
                : doc === "settlement"
                  ? "settlement_statement"
                  : doc === "pt61"
                    ? "pt61_transfer_tax"
                    : doc === "seller_affidavit"
                      ? "seller_affidavit_of_title"
                      : doc === "form_1099s"
                        ? "form_1099s_draft"
                        : "owners_policy_affidavit",
    },
  );
  return getDocumentUrl(stored.storagePath, 300);
}

/** Drop cached PDFs so the next fetch re-renders from saved drafts + firm profile. */
export async function regenerateAllPdfs(reportId: string, userId: string): Promise<void> {
  await invalidateGeneratedPdfs(reportId);
  await ensureGeneratedPdf(reportId, userId, "title");
  await ensureGeneratedPdf(reportId, userId, "aol");
  await ensureGeneratedPdf(reportId, userId, "homeowner");
  await ensureGeneratedPdf(reportId, userId, "commitment");
  await ensureGeneratedPdf(reportId, userId, "deed");
  await ensureGeneratedPdf(reportId, userId, "settlement");
  await ensureGeneratedPdf(reportId, userId, "pt61");
  await ensureGeneratedPdf(reportId, userId, "seller_affidavit");
  await ensureGeneratedPdf(reportId, userId, "form_1099s");
  await ensureGeneratedPdf(reportId, userId, "owners_affidavit");
}
