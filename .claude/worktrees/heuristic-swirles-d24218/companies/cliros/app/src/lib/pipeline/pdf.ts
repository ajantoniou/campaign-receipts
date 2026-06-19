/* ─── PDF generators ───
   Three deliverables per report:

   1. Title Search Report  — internal/lender legal record (existing template)
   2. Attorney Opinion Letter — Fannie Mae B7-2-06 (existing template,
      now branded with firm E&O/IOLTA/underwriter fields)
   3. Homeowner Summary    — plain-English, branded with firm logo

   All three use the same Playwright HTML→PDF pipeline so a single browser
   instance handles every render in the pipeline tick.
*/

import { chromium, Browser } from "playwright";
import type { TitleSearchReport, PropertyImageryRef } from "../types";
import { generateReportHTML } from "../report-template";
import { generateAOLDraft, type AOLAuthorInfo } from "../aol-template";
import { buildAOLRenderModel } from "../aol-finalize";
import { renderAOLLetterHTML } from "./aol-letter-template";
import { publicAttorneyContact } from "../aol-finalize";
import { generateHomeownerSummaryHTML, type HomeownerTemplateContext } from "./homeowner-template";
import { renderTitleCommitmentHTML, type TitleCommitmentContext } from "./title-commitment-template";
import { renderWarrantyDeedHTML, type WarrantyDeedContext } from "./warranty-deed-template";
import { renderSettlementStatementHTML, type SettlementStatementContext } from "./settlement-statement-template";
import {
  renderPT61HTML,
  renderSellerAffidavitHTML,
  render1099SHTML,
  renderOwnersPolicyAffidavitHTML,
  type ClosingDocsContext,
} from "./closing-affidavits-template";
import { getDocumentUrl } from "../document-storage";
import { resolveImageryUrls } from "../agents/property-imagery";

let _browser: Browser | null = null;

async function getBrowser(): Promise<Browser> {
  if (_browser && _browser.isConnected()) return _browser;
  _browser = await chromium.launch({
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--font-render-hinting=none"],
  });
  return _browser;
}

export async function closeBrowser(): Promise<void> {
  if (_browser && _browser.isConnected()) {
    await _browser.close();
    _browser = null;
  }
}

async function htmlToPDF(html: string): Promise<Buffer> {
  const browser = await getBrowser();
  const page = await browser.newPage();
  try {
    await page.setContent(html, { waitUntil: "networkidle" });
    const pdf = await page.pdf({
      format: "Letter",
      margin: { top: "0.5in", right: "0.5in", bottom: "0.5in", left: "0.5in" },
      printBackground: true,
    });
    return pdf;
  } finally {
    await page.close();
  }
}

/* ─── Profile loading helpers ─── */

export interface FirmProfile {
  firm_name?: string;
  firm_address?: string;
  firm_phone?: string;
  firm_website?: string;
  firm_logo_path?: string;
  eo_carrier?: string;
  eo_policy_no?: string;
  eo_limits?: string;
  eo_expiration?: string;
  iolta_bank?: string;
  iolta_disclosure_text?: string;
  title_underwriters?: string[];
  custom_exclusions_block?: string;
  responsible_attorney_address?: string;
  spanish_summary_enabled?: boolean;
}

export interface AttorneyProfile {
  name?: string;
  bar_number?: string;
  state?: string;
  direct_dial?: string;
  email?: string;
  signature_image_path?: string;
}

export interface UserProfile {
  id?: string;
  name?: string | null;
  email?: string | null;
  bar_number?: string | null;
  state?: string | null;
  default_firm_id?: string | null;
}

export interface BrandingContext {
  user: UserProfile | null;
  firm: FirmProfile | null;
  attorney: AttorneyProfile | null;
}

async function resolveSignedUrl(storagePath?: string | null): Promise<string | undefined> {
  if (!storagePath) return undefined;
  try {
    return await getDocumentUrl(storagePath, 60 * 60); // 1h URL good for the PDF render
  } catch (err) {
    console.warn("[pdf] could not sign logo URL:", err);
    return undefined;
  }
}

/* ─── Public generators ─── */

async function imageryForReport(report: TitleSearchReport) {
  return await resolveImageryUrls(report.imagery as PropertyImageryRef | undefined);
}

export async function generateReportPDF(
  report: TitleSearchReport,
  _branding: BrandingContext
): Promise<Buffer> {
  const imagery = await imageryForReport(report);
  const html = generateReportHTML(report, imagery);
  return htmlToPDF(html);
}

export async function generateAOLPDF(
  report: TitleSearchReport,
  branding: BrandingContext
): Promise<Buffer> {
  const { user, firm, attorney } = branding;

  const author: AOLAuthorInfo = {
    name: attorney?.name || user?.name || "[ATTORNEY NAME]",
    barNumber: attorney?.bar_number || user?.bar_number || undefined,
    firmName: firm?.firm_name || undefined,
    firmAddress: firm?.firm_address || undefined,
    state: attorney?.state || user?.state || "Georgia",
    email: attorney?.email || user?.email || undefined,
  };

  // The AOL body is ALWAYS assembled from the structured chain_of_title /
  // liens arrays via the deterministic template — never from a free-text LLM
  // blob. At aol_lock the persona's opinion_language is slotted into the
  // OPINION section and the FULL assembled letter is persisted as
  // report.aolDraft. That persisted text is already data-derived (recitals
  // templated from the same arrays as Schedule B), so when present we ship it
  // verbatim. When it is absent (persona hasn't run) we regenerate the
  // deterministic template. Either way, recitals can never cite a record that
  // is not in the structured data.
  let aolBody =
    report.aolDraft && report.aolDraft.trim().length > 100
      ? report.aolDraft
      : generateAOLDraft(report, author);

  // Firm-level disclosure blocks (rendered in styled sections, not pre-wrap blob)
  const disclosureBlocks: string[] = [];

  if (firm?.title_underwriters && firm.title_underwriters.length > 0) {
    disclosureBlocks.push(
      `TITLE INSURANCE UNDERWRITER AFFILIATIONS:\n` +
        firm.title_underwriters.map((u) => `  • ${u}`).join("\n"),
    );
  }

  if (firm?.eo_carrier && firm?.eo_policy_no) {
    disclosureBlocks.push(
      `PROFESSIONAL LIABILITY INSURANCE:\n` +
        `  Carrier: ${firm.eo_carrier}\n` +
        `  Policy No: ${firm.eo_policy_no}\n` +
        `  Limits: ${firm.eo_limits || "—"}\n` +
        `  Expiration: ${firm.eo_expiration || "—"}`,
    );
  }

  if (firm?.custom_exclusions_block) {
    disclosureBlocks.push(`SPECIAL EXCLUSIONS AND LIMITATIONS:\n${firm.custom_exclusions_block}`);
  }

  if (firm?.iolta_disclosure_text) {
    disclosureBlocks.push(`TRUST ACCOUNT DISCLOSURE (GA Bar Rule 1.15):\n${firm.iolta_disclosure_text}`);
  }

  const logoUrl = await resolveSignedUrl(firm?.firm_logo_path);
  const model = buildAOLRenderModel(aolBody, report, author, firm, logoUrl, disclosureBlocks);
  const html = renderAOLLetterHTML(model);
  return htmlToPDF(html);
}

export async function generateHomeownerSummaryPDF(
  report: TitleSearchReport,
  branding: BrandingContext
): Promise<Buffer> {
  const { user, firm, attorney } = branding;
  const contact = publicAttorneyContact({ attorney, firm });
  const logoUrl = await resolveSignedUrl(firm?.firm_logo_path);
  const imagery = await imageryForReport(report);
  const ctx: HomeownerTemplateContext = {
    firmName: firm?.firm_name,
    firmAddress: firm?.firm_address,
    firmPhone: firm?.firm_phone,
    firmWebsite: firm?.firm_website,
    firmLogoUrl: logoUrl,
    attorneyName: contact.name || user?.name || undefined,
    attorneyBarNumber: contact.barNumber || user?.bar_number || undefined,
    attorneyDirectDial: contact.phone,
    attorneyEmail: contact.email,
    customClosingMessage: report.clientReportDraft?.trim() || undefined,
    ioltaDisclosure: firm?.iolta_disclosure_text,
    showBarAdvertisingFooter: !!firm?.firm_name, // only show advertising footer when branded
    streetviewUrl: imagery.streetviewUrl,
    mapUrl: imagery.mapUrl,
  };
  const html = generateHomeownerSummaryHTML(report, ctx);
  return htmlToPDF(html);
}

export async function generateTitleCommitmentPDF(
  report: TitleSearchReport,
  branding: BrandingContext,
  opts?: { proposedInsured?: string },
): Promise<Buffer> {
  const { user, firm, attorney } = branding;
  const contact = publicAttorneyContact({ attorney, firm });
  const logoUrl = await resolveSignedUrl(firm?.firm_logo_path);
  const ctx: TitleCommitmentContext = {
    firmName: firm?.firm_name,
    firmAddress: firm?.firm_address,
    firmPhone: firm?.firm_phone,
    firmWebsite: firm?.firm_website,
    firmLogoUrl: logoUrl,
    attorneyName: contact.name || user?.name || undefined,
    attorneyBarNumber: contact.barNumber || user?.bar_number || undefined,
    proposedInsured: opts?.proposedInsured,
  };
  const html = renderTitleCommitmentHTML(report, ctx);
  return htmlToPDF(html);
}

export async function generateSettlementStatementPDF(
  report: TitleSearchReport,
  branding: BrandingContext,
  opts?: {
    buyerName?: string;
    buyerName2?: string;
    purchasePriceUsd?: number;
    loanAmountUsd?: number;
    closingDate?: string;
    newLenderName?: string;
    commissionPct?: number;
    attorneyFeeUsd?: number;
    titleInsurancePremiumUsd?: number;
  },
): Promise<Buffer> {
  const { user, firm, attorney } = branding;
  const contact = publicAttorneyContact({ attorney, firm });
  const logoUrl = await resolveSignedUrl(firm?.firm_logo_path);
  const ctx: SettlementStatementContext = {
    firmName: firm?.firm_name,
    firmAddress: firm?.firm_address,
    firmLogoUrl: logoUrl,
    attorneyName: contact.name || user?.name || undefined,
    attorneyBarNumber: contact.barNumber || user?.bar_number || undefined,
    buyerName: opts?.buyerName,
    buyerName2: opts?.buyerName2,
    purchasePriceUsd: opts?.purchasePriceUsd,
    loanAmountUsd: opts?.loanAmountUsd,
    closingDate: opts?.closingDate,
    newLenderName: opts?.newLenderName,
    commissionPct: opts?.commissionPct,
    attorneyFeeUsd: opts?.attorneyFeeUsd,
    titleInsurancePremiumUsd: opts?.titleInsurancePremiumUsd,
  };
  const html = renderSettlementStatementHTML(report, ctx);
  return htmlToPDF(html);
}

/** Shared helper — all four closing-day affidavits use the same context shape. */
async function buildClosingDocsContext(
  branding: BrandingContext,
  opts?: {
    buyerName?: string;
    buyerName2?: string;
    purchasePriceUsd?: number;
    loanAmountUsd?: number;
    closingDate?: string;
    newLenderName?: string;
  },
): Promise<ClosingDocsContext> {
  const { user, firm, attorney } = branding;
  const contact = publicAttorneyContact({ attorney, firm });
  const logoUrl = await resolveSignedUrl(firm?.firm_logo_path);
  return {
    firmName: firm?.firm_name,
    firmAddress: firm?.firm_address,
    firmLogoUrl: logoUrl,
    attorneyName: contact.name || user?.name || undefined,
    attorneyBarNumber: contact.barNumber || user?.bar_number || undefined,
    buyerName: opts?.buyerName,
    buyerName2: opts?.buyerName2,
    purchasePriceUsd: opts?.purchasePriceUsd,
    loanAmountUsd: opts?.loanAmountUsd,
    closingDate: opts?.closingDate,
    newLenderName: opts?.newLenderName,
  };
}

export async function generatePT61PDF(
  report: TitleSearchReport,
  branding: BrandingContext,
  opts?: { buyerName?: string; buyerName2?: string; purchasePriceUsd?: number; loanAmountUsd?: number; closingDate?: string },
): Promise<Buffer> {
  const ctx = await buildClosingDocsContext(branding, opts);
  return htmlToPDF(renderPT61HTML(report, ctx));
}

export async function generateSellerAffidavitPDF(
  report: TitleSearchReport,
  branding: BrandingContext,
  opts?: { buyerName?: string; buyerName2?: string; closingDate?: string },
): Promise<Buffer> {
  const ctx = await buildClosingDocsContext(branding, opts);
  return htmlToPDF(renderSellerAffidavitHTML(report, ctx));
}

export async function generate1099SPDF(
  report: TitleSearchReport,
  branding: BrandingContext,
  opts?: { purchasePriceUsd?: number; loanAmountUsd?: number; closingDate?: string },
): Promise<Buffer> {
  const ctx = await buildClosingDocsContext(branding, opts);
  return htmlToPDF(render1099SHTML(report, ctx));
}

export async function generateOwnersPolicyAffidavitPDF(
  report: TitleSearchReport,
  branding: BrandingContext,
  opts?: { buyerName?: string; buyerName2?: string; closingDate?: string },
): Promise<Buffer> {
  const ctx = await buildClosingDocsContext(branding, opts);
  return htmlToPDF(renderOwnersPolicyAffidavitHTML(report, ctx));
}

export async function generateWarrantyDeedPDF(
  report: TitleSearchReport,
  branding: BrandingContext,
  opts?: { buyerName?: string; buyerName2?: string; jointTenancy?: boolean; considerationUsd?: number; closingDate?: string },
): Promise<Buffer> {
  const { user, firm, attorney } = branding;
  const contact = publicAttorneyContact({ attorney, firm });
  const logoUrl = await resolveSignedUrl(firm?.firm_logo_path);
  const ctx: WarrantyDeedContext = {
    firmName: firm?.firm_name,
    firmAddress: firm?.firm_address,
    firmLogoUrl: logoUrl,
    attorneyName: contact.name || user?.name || undefined,
    attorneyBarNumber: contact.barNumber || user?.bar_number || undefined,
    buyerName: opts?.buyerName,
    buyerName2: opts?.buyerName2,
    jointTenancy: opts?.jointTenancy,
    considerationUsd: opts?.considerationUsd,
    closingDate: opts?.closingDate,
  };
  const html = renderWarrantyDeedHTML(report, ctx);
  return htmlToPDF(html);
}
