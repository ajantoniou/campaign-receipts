/* ─── AOL finalize: signature block + source schedule ───
   Persona drafts often leave bracket placeholders; this injects firm
   attorney info and appends a SOURCE SCHEDULE the lender can audit.
*/

import type { TitleSearchReport, TitleDefect, LienRecord } from "./types";
import type { AOLAuthorInfo } from "./aol-template";
import { buildSourceIndex } from "./source-package";

export interface AOLFirmInfo {
  firm_name?: string;
  firm_address?: string;
  firm_phone?: string;
  firm_website?: string;
}

export interface AOLExceptionRow {
  label: string;
  bookPage?: string;
  vaultRef?: string;
}

export interface AOLSourceRow {
  vaultRef: string;
  kind: string;
  instrumentType?: string;
  bookPage?: string;
  parties?: string;
  recordedDate?: string;
  status?: string;
}

export interface AOLSignatureBlock {
  name: string;
  barNumber?: string;
  firmName?: string;
  firmAddress?: string;
  state?: string;
}

export interface AOLRenderModel {
  reportId: string;
  date: string;
  propertyAddress: string;
  county: string;
  parcelId?: string;
  searchWindow: string;
  currentVesting?: string;
  logoUrl?: string;
  firmName?: string;
  firmAddress?: string;
  firmPhone?: string;
  firmWebsite?: string;
  opinionBody: string;
  exceptions: AOLExceptionRow[];
  sourceRows: AOLSourceRow[];
  signature: AOLSignatureBlock;
  disclosureBlocks: string[];
}

function buildSignatureBlock(author: AOLAuthorInfo): string {
  const name = author.name || "[Attorney Name]";
  const firm = author.firmName || "[Firm Name]";
  const addr = author.firmAddress || "[Firm Address]";
  const bar = author.barNumber || "[Bar Number]";
  const state = author.state || "Georgia";

  return `_______________________________
${name}, Esq.
${firm}
${addr}
Georgia Bar No. ${bar}
State of ${state}`;
}

export function buildSourceSchedule(report: TitleSearchReport): string {
  const chain = report.chainOfTitle.entries as unknown as Record<string, unknown>[];
  const liens = report.liens as unknown as Record<string, unknown>[];
  const index = buildSourceIndex(chain, liens);

  if (index.length === 0) {
    return `SOURCE SCHEDULE (Cliros Vault)

No indexed instruments — re-run search or pull images manually.`;
  }

  const lines = [
    "SOURCE SCHEDULE (Cliros Vault)",
    "The following records were examined and are retained in Cliros matter storage.",
    "Raw GSCCCA index pulls and federal-court search snapshots are stored alongside this report.",
    "Full JSON export and signed-URL downloads: dashboard → Raw Source Data.",
    "",
  ];

  for (const row of index) {
    const ref = row.vaultRef as string;
    const kind = row.kind as string;
    if (kind === "chain") {
      lines.push(
        `${ref} | Chain | ${row.instrumentType} | Book/Page: ${row.bookPage || "—"} | Inst: ${row.instrumentNumber || "—"} | ${row.grantor} → ${row.grantee} | ${row.recordedDate || "—"}`,
      );
    } else {
      lines.push(
        `${ref} | Lien | ${row.type} (${row.status}) | Book/Page: ${row.bookPage || "—"} | ${row.creditor} | ${row.amount ? "$" + Number(row.amount).toLocaleString() : "—"} | ${row.recordedDate || "—"}`,
      );
    }
  }

  lines.push("");
  lines.push(`Report ID: ${report.id}`);
  return lines.join("\n");
}

/** Replace persona placeholders and append source schedule if missing. */
export function finalizeAolDraft(
  body: string,
  report: TitleSearchReport,
  author: AOLAuthorInfo,
): string {
  let text = body.trim();
  const sig = buildSignatureBlock(author);

  const placeholderPatterns = [
    /\[Attorney signature block\]/gi,
    /\[ATTORNEY SIGNATURE BLOCK\]/g,
    /\[Attorney name\], Esq\./gi,
    /\[Attorney Name\], Esq\./g,
    /Georgia Bar No\. \[bar_number\]/gi,
    /\[Firm name, address, phone\]/gi,
    /\[Firm Name, Address, Phone\]/gi,
    /\[internal_file_no\]/gi,
  ];

  for (const re of placeholderPatterns) {
    text = text.replace(re, "");
  }

  // Strip trailing empty signature stub lines persona may leave
  text = text.replace(/\n{3,}Respectfully,?\s*\n+/gi, "\n\nRespectfully submitted,\n\n");

  if (!/_{5,}/.test(text)) {
    text = text.replace(
      /Respectfully submitted,?\s*$/i,
      `Respectfully submitted,\n\n\n${sig}`,
    );
    if (!/_{5,}/.test(text)) {
      text += `\n\n\n${sig}`;
    }
  } else {
    // Replace underscore-only signature line with full block if only one line present
    text = text.replace(/_{10,}\s*\n(\[.*?\]\s*\n?)*/g, `${sig}\n`);
  }

  if (!/SOURCE SCHEDULE/i.test(text)) {
    text += `\n\n${buildSourceSchedule(report)}`;
  }

  return text;
}

function stripScheduleAndSignature(text: string): string {
  let t = text;
  t = t.replace(/\nSOURCE SCHEDULE[\s\S]*/i, "");
  t = t.replace(/\nTITLE INSURANCE UNDERWRITER[\s\S]*/i, "");
  t = t.replace(/\nPROFESSIONAL LIABILITY INSURANCE[\s\S]*/i, "");
  t = t.replace(/\nSPECIAL EXCLUSIONS[\s\S]*/i, "");
  t = t.replace(/\nTRUST ACCOUNT DISCLOSURE[\s\S]*/i, "");
  t = t.replace(/_{10,}[\s\S]*$/m, "");
  return t.trim();
}

function buildExceptions(report: TitleSearchReport, index: Array<Record<string, unknown>>): AOLExceptionRow[] {
  const rows: AOLExceptionRow[] = [];
  const liens = report.liens as unknown as LienRecord[];
  for (const l of liens.filter((x) => x.status === "active")) {
    const bp = l.bookPage || l.referencedBookPage;
    rows.push({
      label: `${l.type.toUpperCase()} — ${l.creditor || "see record"}${l.amount ? ` ($${l.amount.toLocaleString()})` : ""}`,
      bookPage: bp,
      vaultRef: index.find((r) => r.kind === "lien" && r.bookPage === bp)?.vaultRef as string | undefined,
    });
  }
  for (const d of report.defects.filter((x) => x.severity === "critical" || x.severity === "major")) {
    const ext = d as TitleDefect & { book_page_citation?: string };
    rows.push({
      label: d.title,
      bookPage: ext.book_page_citation,
    });
  }
  if (rows.length === 0) {
    rows.push({ label: "Standard exceptions to matters of survey, parties in possession, and rights of parties in possession." });
  }
  return rows;
}

function mapSourceRows(index: Array<Record<string, unknown>>): AOLSourceRow[] {
  return index.map((r) => ({
    vaultRef: String(r.vaultRef),
    kind: String(r.kind),
    instrumentType: r.instrumentType ? String(r.instrumentType) : r.type ? String(r.type) : undefined,
    bookPage: r.bookPage ? String(r.bookPage) : undefined,
    parties:
      r.kind === "chain"
        ? `${r.grantor} → ${r.grantee}`
        : r.creditor
          ? String(r.creditor)
          : undefined,
    recordedDate: r.recordedDate ? String(r.recordedDate) : undefined,
    status: r.status ? String(r.status) : undefined,
  }));
}

/** Structured model for professional AOL HTML template. */
export function buildAOLRenderModel(
  body: string,
  report: TitleSearchReport,
  author: AOLAuthorInfo,
  firm: AOLFirmInfo | null | undefined,
  logoUrl?: string,
  disclosureBlocks: string[] = [],
): AOLRenderModel {
  const finalized = finalizeAolDraft(body, report, author);
  const opinionBody = stripScheduleAndSignature(finalized);
  const chain = report.chainOfTitle.entries as unknown as Record<string, unknown>[];
  const liens = report.liens as unknown as Record<string, unknown>[];
  const index = buildSourceIndex(chain, liens);
  const last = report.chainOfTitle.entries[report.chainOfTitle.entries.length - 1];
  const today = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return {
    reportId: report.id,
    date: today,
    propertyAddress: report.address.fullAddress,
    county: report.parcel.county || report.address.county || "Georgia",
    parcelId: report.parcel.parcelId || undefined,
    searchWindow: `${report.chainOfTitle.startDate || "—"} through ${report.chainOfTitle.endDate || "—"} (${report.chainOfTitle.yearsSearched || 25} years)`,
    currentVesting: last?.grantee,
    logoUrl,
    firmName: firm?.firm_name || author.firmName,
    firmAddress: firm?.firm_address || author.firmAddress,
    firmPhone: firm?.firm_phone,
    firmWebsite: firm?.firm_website,
    opinionBody,
    exceptions: buildExceptions(report, index),
    sourceRows: mapSourceRows(index),
    signature: {
      name: author.name || "[Attorney Name]",
      barNumber: author.barNumber,
      firmName: author.firmName || firm?.firm_name,
      firmAddress: author.firmAddress || firm?.firm_address,
      state: author.state || "Georgia",
    },
    disclosureBlocks,
  };
}

/** Public contact for client-facing PDFs — never the login email unless explicitly set as letter email. */
export function publicAttorneyContact(branding: {
  attorney?: { email?: string | null; direct_dial?: string | null; name?: string | null; bar_number?: string | null } | null;
  firm?: { firm_phone?: string | null } | null;
}): { name?: string; barNumber?: string; phone?: string; email?: string } {
  const email = branding.attorney?.email?.trim() || undefined;
  const phone =
    branding.attorney?.direct_dial?.trim() ||
    branding.firm?.firm_phone?.trim() ||
    undefined;
  return {
    name: branding.attorney?.name || undefined,
    barNumber: branding.attorney?.bar_number || undefined,
    phone,
    email,
  };
}
