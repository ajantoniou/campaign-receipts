/* ─── Closing-day affidavits + GA-specific filings ───
   Four short, high-recurrence documents the closing attorney drafts on
   every (or near-every) GA residential closing. Same UPL posture as the
   warranty deed + settlement statement: Cliros assembles a DRAFT from
   data we already have; attorney reviews + executes.

     1. PT-61 — GA Real Estate Transfer Tax declaration. Required for
        every recorded deed. $1/$1000 of consideration.
     2. Seller's Affidavit of Title — sworn statement: no undisclosed
        liens, no parties in possession, no improvements within 95 days
        (mechanics-lien window), no pending litigation.
     3. 1099-S — IRS seller-transfer reporting. Required for sales ≥$300K
        (most GA residential).
     4. Owner's Policy Affidavit — lender's title-insurance requirement.
        Seller's affidavit of survey + possession + mechanic's liens.
        Feeds the underwriter's owner's policy.
*/

import type { TitleSearchReport } from "../types";

export interface ClosingDocsContext {
  /** Firm letterhead — matches the other templates. */
  firmName?: string;
  firmAddress?: string;
  firmLogoUrl?: string;
  attorneyName?: string;
  attorneyBarNumber?: string;

  /** Buyer + closing details from search_hints. */
  buyerName?: string;
  buyerName2?: string;
  purchasePriceUsd?: number;
  loanAmountUsd?: number;
  closingDate?: string;
  newLenderName?: string;

  /** Optional explicit seller override (defaults to last grantee in chain). */
  sellerNameOverride?: string;
}

function esc(s?: string | number | null): string {
  if (s == null) return "";
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
function fmtDate(s?: string | null): string {
  if (!s) return "";
  const d = new Date(s);
  return isNaN(d.getTime()) ? s : d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}
function money(n?: number | null): string {
  if (n == null || !Number.isFinite(n) || n <= 0) return "—";
  return `$${Math.round(n).toLocaleString()}.00`;
}

/* ─── Shared chrome — matches the GA-paper aesthetic of the other PDFs ─── */
const SHARED_HEAD = `<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: "Times New Roman", Georgia, serif; font-size: 11pt; line-height: 1.55; color: #1a1a1a; padding: 1in 1in 0.75in; max-width: 8.5in; margin: 0 auto; }
  .draft-watermark { position: fixed; top: 38%; left: 0; right: 0; text-align: center; font-size: 96pt; color: rgba(220, 38, 38, 0.07); font-weight: 900; letter-spacing: 0.2em; transform: rotate(-22deg); pointer-events: none; z-index: -1; }
  .prep-block { font-size: 10pt; color: #444; border-bottom: 1px solid #999; padding-bottom: 10px; margin-bottom: 24px; }
  .prep-block strong { color: #1a1a1a; }
  .doc-title { text-align: center; font-size: 16pt; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; margin-bottom: 6px; }
  .state-county { text-align: center; font-size: 11pt; margin-bottom: 24px; }
  p { margin-bottom: 14px; text-align: justify; }
  .numbered { margin: 14px 0 14px 0.5in; }
  .numbered li { margin-bottom: 10px; }
  .field-grid { display: grid; grid-template-columns: 200px 1fr; gap: 8px 14px; padding: 14px; background: #fafafa; border: 1px solid #e5e5e5; margin: 14px 0; }
  .field-grid dt { font-weight: 700; color: #555; font-size: 10pt; }
  .field-grid dd { color: #1a1a1a; font-size: 10pt; }
  .signature-area { margin-top: 50px; }
  .sig-row { display: flex; justify-content: space-between; gap: 40px; margin-bottom: 30px; }
  .sig-col { flex: 1; }
  .sig-line { border-top: 1px solid #1a1a1a; padding-top: 4px; font-size: 10pt; }
  .sig-name { font-weight: 700; font-size: 11pt; }
  .witness-section { margin-top: 40px; padding-top: 20px; border-top: 1px solid #ccc; }
  .upl-banner { margin-top: 40px; padding: 14px 18px; border: 2px solid #dc2626; background: #fef2f2; border-radius: 4px; font-size: 9.5pt; color: #7f1d1d; line-height: 1.55; }
  .upl-banner strong { display: block; margin-bottom: 4px; font-size: 10pt; }
  .footer { margin-top: 22px; font-size: 8.5pt; color: #888; text-align: center; }
</style>`;

function prepBlock(ctx: ClosingDocsContext): string {
  return `<div class="prep-block">
  <strong>This instrument prepared at the direction of:</strong><br>
  ${esc(ctx.attorneyName || "[ATTORNEY NAME]")}${ctx.attorneyBarNumber ? `, Georgia Bar No. ${esc(ctx.attorneyBarNumber)}` : ""}<br>
  ${esc(ctx.firmName || "")}<br>
  ${esc(ctx.firmAddress || "")}
</div>`;
}

function uplBanner(): string {
  return `<div class="upl-banner">
  <strong>DRAFT — FOR ATTORNEY REVIEW ONLY.</strong>
  This document was assembled by Cliros at the direction of the named attorney
  from data retrieved from the public records. It is a draft instrument and is
  not legally effective until reviewed, edited as necessary, sworn to (where
  applicable), and executed under the supervision of the responsible attorney.
  The reviewing attorney provides the legal judgment, verifies the factual
  recitals, and is the party of record on the executed instrument. Cliros
  provides document-assembly assistance only and does not practice law, render
  legal advice, or guarantee the legal effect of any instrument.
</div>`;
}

function resolveParties(
  report: TitleSearchReport,
  ctx: ClosingDocsContext,
): { sellerName: string; buyerLine: string; county: string } {
  const lastDeed = report.chainOfTitle?.entries?.[report.chainOfTitle.entries.length - 1];
  const sellerName = ctx.sellerNameOverride || lastDeed?.grantee || "[SELLER — confirm against most recent vesting deed]";
  const buyerLine = ctx.buyerName2
    ? `${esc(ctx.buyerName)} AND ${esc(ctx.buyerName2)}`
    : ctx.buyerName ? esc(ctx.buyerName) : "[BUYER NAME — required before execution]";
  const county = report.parcel?.county || report.address.county || "[COUNTY]";
  return { sellerName, buyerLine, county };
}

/* ──────────────────────────────────────────────────────────────────────────
   1. PT-61 GA Real Estate Transfer Tax declaration
   ────────────────────────────────────────────────────────────────────────── */
export function renderPT61HTML(report: TitleSearchReport, ctx: ClosingDocsContext): string {
  const { sellerName, buyerLine, county } = resolveParties(report, ctx);
  const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  const closingDate = ctx.closingDate ? fmtDate(ctx.closingDate) : "[CLOSING DATE]";
  const consideration = ctx.purchasePriceUsd ?? (ctx.loanAmountUsd ? Math.round(ctx.loanAmountUsd / 0.8) : 0);
  const transferTax = consideration > 0 ? Math.round(consideration / 1000) : 0;
  const lastDeed = report.chainOfTitle?.entries?.[report.chainOfTitle.entries.length - 1];

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>PT-61 — ${esc(report.address.fullAddress)}</title>${SHARED_HEAD}</head><body>
<div class="draft-watermark">DRAFT</div>
${prepBlock(ctx)}
<div class="doc-title">Real Estate Transfer Tax Declaration</div>
<div class="state-county">FORM PT-61 · STATE OF GEORGIA · COUNTY OF ${esc(county.toUpperCase())}</div>

<dl class="field-grid">
  <dt>Date of transfer</dt><dd>${esc(closingDate)}</dd>
  <dt>Property address</dt><dd>${esc(report.address.fullAddress)}</dd>
  ${report.parcel?.parcelId ? `<dt>Tax parcel ID</dt><dd>${esc(report.parcel.parcelId)}</dd>` : ""}
  <dt>Grantor (Seller)</dt><dd>${esc(sellerName)}</dd>
  <dt>Grantee (Buyer)</dt><dd>${buyerLine}</dd>
  ${lastDeed?.bookPage ? `<dt>Prior deed (Bk/Pg)</dt><dd>${esc(lastDeed.bookPage)}</dd>` : ""}
</dl>

<p style="margin-top:24px"><strong>CONSIDERATION AND TRANSFER TAX CALCULATION</strong></p>

<dl class="field-grid">
  <dt>Sales price / consideration</dt><dd>${money(consideration)}</dd>
  <dt>Outstanding liens assumed</dt><dd>$0.00 <em>(verify against P&amp;S)</em></dd>
  <dt>Fair market value (if no sale price)</dt><dd>N/A</dd>
  <dt>Taxable amount</dt><dd>${money(consideration)}</dd>
  <dt>Transfer tax rate</dt><dd>$1.00 per $1,000 (or fraction thereof)</dd>
  <dt>TRANSFER TAX DUE</dt><dd><strong>${money(transferTax)}</strong></dd>
</dl>

<p>
The undersigned hereby declares under penalty of perjury that the foregoing
information is true and correct to the best of their knowledge.
</p>

<p>
This declaration is submitted electronically through the GSCCCA PT-61
e-Filing system in conjunction with the recording of the conveyance instrument
described above. The transfer tax shown above will be remitted to the
Clerk of Superior Court of ${esc(county)} County at the time of recording.
</p>

<div class="signature-area">
  <div class="sig-row">
    <div class="sig-col">
      <div style="margin-bottom:24px"></div>
      <div class="sig-line"><span class="sig-name">${esc(sellerName)}</span> <em>(Grantor)</em></div>
    </div>
    <div class="sig-col">
      <div style="margin-bottom:24px"></div>
      <div class="sig-line">${buyerLine} <em>(Grantee or authorized agent)</em></div>
    </div>
  </div>
</div>

${uplBanner()}

<div class="footer">
  Generated by Cliros — GA real estate closing document assembly · cliros.ai · Draft ${esc(today)}
</div>
</body></html>`;
}

/* ──────────────────────────────────────────────────────────────────────────
   2. Seller's Affidavit of Title
   ────────────────────────────────────────────────────────────────────────── */
export function renderSellerAffidavitHTML(report: TitleSearchReport, ctx: ClosingDocsContext): string {
  const { sellerName, buyerLine, county } = resolveParties(report, ctx);
  const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  const lastDeed = report.chainOfTitle?.entries?.[report.chainOfTitle.entries.length - 1];

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Seller's Affidavit of Title — ${esc(report.address.fullAddress)}</title>${SHARED_HEAD}</head><body>
<div class="draft-watermark">DRAFT</div>
${prepBlock(ctx)}
<div class="doc-title">Seller&rsquo;s Affidavit of Title</div>
<div class="state-county">STATE OF GEORGIA · COUNTY OF ${esc(county.toUpperCase())}</div>

<p>
PERSONALLY APPEARED before the undersigned officer duly authorized to administer
oaths, <strong>${esc(sellerName)}</strong> (the &ldquo;Affiant&rdquo;), who being
first duly sworn on oath, deposes and says:
</p>

<ol class="numbered">
  <li>
    Affiant is the owner of record of the real property located at
    <strong>${esc(report.address.fullAddress)}</strong>, in ${esc(county)} County,
    Georgia (the &ldquo;Property&rdquo;)${lastDeed?.bookPage ? `, having acquired title by deed recorded in Book ${esc(lastDeed.bookPage)} of the ${esc(county)} County records` : ""}.
    ${report.parcel?.parcelId ? `Tax Parcel ID: ${esc(report.parcel.parcelId)}.` : ""}
  </li>

  <li>
    There are no parties in possession of the Property other than Affiant${ctx.buyerName ? `, and Affiant will deliver possession to ${buyerLine} on the closing date free and clear of all tenants, occupants, and other parties` : ""}.
  </li>

  <li>
    There are no unrecorded leases, contracts, options, easements, or other
    agreements affecting title to the Property, and no party has any claim of
    right to acquire or occupy the Property other than as may be expressly
    disclosed in writing to the closing attorney prior to closing.
  </li>

  <li>
    There are no improvements made or repairs commenced upon the Property
    within the ninety-five (95) days immediately preceding the date hereof for
    which any contractor, subcontractor, materialman, laborer, or supplier
    remains unpaid, and there are no claims of mechanics&rsquo; or materialmen&rsquo;s
    liens which could be asserted against the Property under O.C.G.A. § 44-14-361
    et seq.
  </li>

  <li>
    There are no judgments, tax liens, federal tax liens, state tax liens, or
    other liens or encumbrances against Affiant or the Property that have not
    been satisfied or that will not be satisfied and released at or before
    closing, other than those expressly disclosed to the closing attorney.
  </li>

  <li>
    There is no pending or threatened litigation, bankruptcy, divorce
    proceeding, or other adverse proceeding involving Affiant that could
    affect title to or possession of the Property.
  </li>

  <li>
    Affiant has full legal authority to convey the Property and to execute and
    deliver the warranty deed conveying the Property to ${buyerLine}.
  </li>

  <li>
    Affiant is not a &ldquo;foreign person&rdquo; within the meaning of Section 1445
    of the Internal Revenue Code and is not subject to FIRPTA withholding.
    ${ctx.buyerName ? `Affiant&rsquo;s representations herein are made for the purpose of inducing ${buyerLine}, the closing attorney, and the title insurance underwriter to consummate this transaction.` : ""}
  </li>

  <li>
    This Affidavit is made for the purpose of inducing the closing attorney,
    the lender (if any), and the title insurance underwriter to issue title
    insurance and to disburse closing proceeds in reliance on the truthfulness
    of the foregoing statements.
  </li>
</ol>

<p style="margin-top:24px">
FURTHER AFFIANT SAYETH NOT.
</p>

<div class="signature-area">
  <div class="sig-row">
    <div class="sig-col">
      <div style="margin-bottom:24px"></div>
      <div class="sig-line"><span class="sig-name">${esc(sellerName)}</span> <em>(Affiant)</em></div>
    </div>
  </div>

  <div class="witness-section">
    <p style="font-size:10pt; margin-bottom:18px">
      Sworn to and subscribed before me this _____ day of _____________________, ${new Date().getFullYear()}.
    </p>
    <div class="sig-row">
      <div class="sig-col">
        <div style="margin-bottom:24px"></div>
        <div class="sig-line">Notary Public<br>
          My commission expires: _______________<br>
          (SEAL)
        </div>
      </div>
    </div>
  </div>
</div>

${uplBanner()}

<div class="footer">
  Generated by Cliros — GA real estate closing document assembly · cliros.ai · Draft ${esc(today)}
</div>
</body></html>`;
}

/* ──────────────────────────────────────────────────────────────────────────
   3. 1099-S (IRS seller transfer reporting)
   ────────────────────────────────────────────────────────────────────────── */
export function render1099SHTML(report: TitleSearchReport, ctx: ClosingDocsContext): string {
  const { sellerName, buyerLine, county } = resolveParties(report, ctx);
  const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  const closingDate = ctx.closingDate ? fmtDate(ctx.closingDate) : "[CLOSING DATE]";
  const consideration = ctx.purchasePriceUsd ?? (ctx.loanAmountUsd ? Math.round(ctx.loanAmountUsd / 0.8) : 0);
  const isRequired = consideration >= 300_000;

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>1099-S — ${esc(report.address.fullAddress)}</title>${SHARED_HEAD}</head><body>
<div class="draft-watermark">DRAFT</div>
${prepBlock(ctx)}
<div class="doc-title">IRS Form 1099-S — Proceeds From Real Estate Transactions</div>
<div class="state-county">STATE OF GEORGIA · COUNTY OF ${esc(county.toUpperCase())}</div>

${!isRequired ? `
<div style="background:#fef3c7; border:1.5px solid #fbbf24; padding:14px 18px; border-radius:4px; margin-bottom:18px; font-size:10pt; color:#78350f">
  <strong>Note:</strong> Sale price (${money(consideration)}) is below the $300,000 reporting threshold
  for owner-occupied primary residences. 1099-S may not be required if the seller
  provides a Certification of No Information Reporting (Treasury Reg. § 1.6045-4(c)(2)).
  Confirm seller qualifies before omitting this filing.
</div>
` : ""}

<p><strong>FILER — Person responsible for closing (typically closing attorney)</strong></p>

<dl class="field-grid">
  <dt>Name</dt><dd>${esc(ctx.attorneyName || "[CLOSING ATTORNEY NAME]")}</dd>
  <dt>Firm</dt><dd>${esc(ctx.firmName || "[FIRM NAME]")}</dd>
  <dt>Address</dt><dd>${esc(ctx.firmAddress || "[FIRM ADDRESS]")}</dd>
  <dt>Federal EIN</dt><dd>[FIRM EIN — required]</dd>
</dl>

<p><strong>TRANSFEROR (Seller — reported to IRS)</strong></p>

<dl class="field-grid">
  <dt>Name</dt><dd>${esc(sellerName)}</dd>
  <dt>SSN / EIN</dt><dd>[SELLER SSN — required, collect at closing]</dd>
  <dt>Address (post-closing)</dt><dd>[SELLER FORWARDING ADDRESS — collect at closing]</dd>
</dl>

<p><strong>TRANSACTION INFORMATION</strong></p>

<dl class="field-grid">
  <dt>Closing date</dt><dd>${esc(closingDate)}</dd>
  <dt>Property address</dt><dd>${esc(report.address.fullAddress)}</dd>
  ${report.parcel?.parcelId ? `<dt>Tax parcel ID</dt><dd>${esc(report.parcel.parcelId)}</dd>` : ""}
  <dt>Gross proceeds (Box 2)</dt><dd><strong>${money(consideration)}</strong></dd>
  <dt>Property type</dt><dd>Real property (improved residential)</dd>
  <dt>Buyer's part of real estate tax</dt><dd>[FROM SETTLEMENT STATEMENT — Box 6]</dd>
</dl>

<p style="margin-top:24px">
This draft Form 1099-S is generated for the closing attorney&rsquo;s preparation
and review. The actual filing must be made through the IRS FIRE system or
authorized e-filing software by January 31 of the year following the closing.
Copy B must be furnished to the seller by February 15.
</p>

<p>
<strong>Seller&rsquo;s certification of no reporting:</strong> If the seller can certify
under Treasury Reg. § 1.6045-4(c)(2) that the property is the seller&rsquo;s
principal residence, the sale price is $250,000 or less ($500,000 for joint
sellers), no portion has been used for business purposes, and there has been
no period of nonqualified use, this 1099-S filing may be omitted. Have the
seller sign the certification at closing if applicable.
</p>

<div class="signature-area">
  <div class="sig-row">
    <div class="sig-col">
      <div style="margin-bottom:24px"></div>
      <div class="sig-line"><span class="sig-name">${esc(ctx.attorneyName || "[ATTORNEY NAME]")}</span> — Filer / Closing Agent</div>
    </div>
  </div>
</div>

${uplBanner()}

<div class="footer">
  Generated by Cliros — IRS Form 1099-S draft · cliros.ai · ${esc(today)}
</div>
</body></html>`;
}

/* ──────────────────────────────────────────────────────────────────────────
   4. Owner's Policy Affidavit (Affidavit of Title for Title Insurance)
   ────────────────────────────────────────────────────────────────────────── */
export function renderOwnersPolicyAffidavitHTML(report: TitleSearchReport, ctx: ClosingDocsContext): string {
  const { sellerName, buyerLine, county } = resolveParties(report, ctx);
  const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Owner's Policy Affidavit — ${esc(report.address.fullAddress)}</title>${SHARED_HEAD}</head><body>
<div class="draft-watermark">DRAFT</div>
${prepBlock(ctx)}
<div class="doc-title">Owner&rsquo;s Affidavit for Title Insurance</div>
<div class="state-county">STATE OF GEORGIA · COUNTY OF ${esc(county.toUpperCase())}</div>

<p>
PERSONALLY APPEARED before the undersigned officer duly authorized to administer
oaths, <strong>${esc(sellerName)}</strong> (the &ldquo;Affiant&rdquo;), who being
first duly sworn on oath, makes the following affidavit for the express
purpose of inducing the issuance of one or more policies of title insurance
covering the real property described below (the &ldquo;Property&rdquo;):
</p>

<dl class="field-grid">
  <dt>Property address</dt><dd>${esc(report.address.fullAddress)}</dd>
  <dt>County</dt><dd>${esc(county)}, Georgia</dd>
  ${report.parcel?.parcelId ? `<dt>Tax parcel ID</dt><dd>${esc(report.parcel.parcelId)}</dd>` : ""}
</dl>

<ol class="numbered">
  <li>
    <strong>SURVEY.</strong> Affiant has no actual knowledge of any
    encroachments, overlaps, boundary line disputes, or other matters affecting
    the Property that would be disclosed by an accurate and complete survey,
    other than those that may be of record or visible from a physical
    inspection of the premises.
  </li>

  <li>
    <strong>POSSESSION.</strong> Affiant is in actual possession of the
    Property, and no other party is in possession or has any right of
    possession or claim of right to possess the Property${ctx.buyerName ? `, and possession will be delivered to ${buyerLine} at closing free and clear of all tenants and occupants` : ""}.
  </li>

  <li>
    <strong>MECHANICS&rsquo; LIENS.</strong> No labor has been performed, no
    materials have been furnished, and no improvements or repairs have been
    commenced upon the Property within the ninety-five (95) days immediately
    preceding the date hereof for which any contractor, subcontractor,
    materialman, or laborer remains unpaid, and Affiant has no knowledge of
    any pending or threatened mechanics&rsquo; or materialmen&rsquo;s liens against the
    Property under O.C.G.A. § 44-14-361 et seq.
  </li>

  <li>
    <strong>UNRECORDED MATTERS.</strong> Affiant has no actual knowledge of
    any unrecorded easements, rights-of-way, leases, contracts, options,
    rights of first refusal, or other agreements affecting title to the
    Property, other than as may be expressly disclosed to the closing
    attorney in writing prior to closing.
  </li>

  <li>
    <strong>JUDGMENTS AND LIENS.</strong> There are no outstanding judgments,
    decrees, executions, tax liens, federal tax liens, state tax liens, or
    other liens or encumbrances against Affiant or the Property that have not
    been satisfied of record or that will not be satisfied of record at or
    before closing.
  </li>

  <li>
    <strong>BANKRUPTCY / PROCEEDINGS.</strong> No bankruptcy proceeding,
    receivership, divorce proceeding, or other proceeding affecting title to
    or possession of the Property is pending or threatened against Affiant.
  </li>

  <li>
    <strong>HOA / ASSOCIATION DUES.</strong> All homeowners&rsquo; association,
    condominium, or community association dues, assessments, and special
    assessments affecting the Property have been paid current or will be
    brought current and prorated at closing.
  </li>

  <li>
    <strong>FIRPTA.</strong> Affiant is not a &ldquo;foreign person&rdquo; within the
    meaning of Section 1445 of the Internal Revenue Code, and no withholding
    is required under FIRPTA.
  </li>

  <li>
    <strong>RELIANCE.</strong> This Affidavit is given for the express purpose
    of inducing the title insurance underwriter to issue one or more policies
    of title insurance and to omit the standard exceptions for parties in
    possession, unrecorded matters, mechanics&rsquo; liens, and survey matters from
    those policies, and Affiant acknowledges that the underwriter and the
    insured parties will rely on the truth of the foregoing.
  </li>
</ol>

<p style="margin-top:24px">FURTHER AFFIANT SAYETH NOT.</p>

<div class="signature-area">
  <div class="sig-row">
    <div class="sig-col">
      <div style="margin-bottom:24px"></div>
      <div class="sig-line"><span class="sig-name">${esc(sellerName)}</span> <em>(Affiant)</em></div>
    </div>
  </div>

  <div class="witness-section">
    <p style="font-size:10pt; margin-bottom:18px">
      Sworn to and subscribed before me this _____ day of _____________________, ${new Date().getFullYear()}.
    </p>
    <div class="sig-row">
      <div class="sig-col">
        <div style="margin-bottom:24px"></div>
        <div class="sig-line">Notary Public<br>
          My commission expires: _______________<br>
          (SEAL)
        </div>
      </div>
    </div>
  </div>
</div>

${uplBanner()}

<div class="footer">
  Generated by Cliros — GA closing document assembly · cliros.ai · Draft ${esc(today)}
</div>
</body></html>`;
}
