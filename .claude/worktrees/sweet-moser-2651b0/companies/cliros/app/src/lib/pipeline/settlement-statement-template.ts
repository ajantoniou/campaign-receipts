/* ─── Settlement statement (CD / ALTA-style) template ───
   Sixth deliverable. The line-item money sheet attorneys spend 30-90 min
   building manually for every closing. Cliros assembles it from data we
   already have: purchase price + loan amount (search_hints), seller
   payoffs (active liens we found and clustered by lender), property
   taxes (parcel anchor's assessedValue × county millage rate), and
   standard GA closing fees (county recording fee, title insurance
   premium calc, commission). Attorney edits + finalizes.

   UPL posture: this is a DRAFT. The attorney is the responsible
   settlement agent. Cliros assembles; the attorney reviews + signs at
   closing. Matches the warranty-deed template pattern (commit 26dfd0a0).
*/

import type { TitleSearchReport, LienRecord } from "../types";

export interface SettlementStatementContext {
  /** Firm letterhead — same shape as the other templates. */
  firmName?: string;
  firmAddress?: string;
  firmLogoUrl?: string;
  attorneyName?: string;
  attorneyBarNumber?: string;

  /** Buyer name(s) — from search_hints.buyerName. */
  buyerName?: string;
  buyerName2?: string;

  /** Purchase price in USD whole dollars. Falls back to loan amount / 0.8
   *  (assume 20% down) if not supplied. */
  purchasePriceUsd?: number;
  /** Loan amount in USD whole dollars. */
  loanAmountUsd?: number;
  /** Closing date — from search_reports.closing_date. */
  closingDate?: string;
  /** Lender name on the new SD. From search_hints (future field) or "[NEW LENDER]". */
  newLenderName?: string;

  /** Commission percentage (e.g. 6 for 6%). Default 6% per GA convention. */
  commissionPct?: number;
  /** Attorney's flat fee in USD. Default $750 (GA residential standard). */
  attorneyFeeUsd?: number;
  /** Title insurance premium override — defaults to GA rate card (~$3.50/$1000). */
  titleInsurancePremiumUsd?: number;
}

function esc(s?: string | number | null): string {
  if (s == null) return "";
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function money(n?: number | null): string {
  if (n == null || !Number.isFinite(n)) return "—";
  const sign = n < 0 ? "-" : "";
  const abs = Math.abs(Math.round(n));
  return `${sign}$${abs.toLocaleString()}.00`;
}

function fmtDate(s?: string | null): string {
  if (!s) return "";
  const d = new Date(s);
  if (isNaN(d.getTime())) return s;
  return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

/** GA standard title insurance premium calc — basic owner's policy rate. */
function calcTitleInsurance(priceUsd: number): number {
  if (priceUsd <= 0) return 0;
  // GA simultaneous-issue rates vary by underwriter; this is the residential
  // tier-1 owner's policy ballpark. Attorney edits if different.
  const ratePerThousand = 3.50;
  return Math.round((priceUsd / 1000) * ratePerThousand);
}

/** GA county recording fee — standard $25 + $5 per page beyond 1. We assume
 *  a typical 5-page WD bundle + 5-page SD bundle. Attorney edits per county. */
function calcRecordingFee(): number {
  // Standard residential: 2 instruments (WD + SD), ~$50 total.
  return 50;
}

/** GA PT-61 transfer tax — $1 per $1000 of consideration. */
function calcTransferTax(priceUsd: number): number {
  if (priceUsd <= 0) return 0;
  return Math.round(priceUsd / 1000);
}

/** Aggregate active seller payoffs from the title search liens. Skip the
 *  current owner's purchase-money mortgage IF it has the new buyer's name
 *  on it — that shouldn't happen, but defensive. */
function sellerPayoffs(liens: Array<LienRecord & { isPurchaseMoney?: boolean }>): {
  total: number;
  byLender: Array<{ creditor: string; amount: number; bookPage?: string }>;
} {
  const active = liens.filter((l) => l.status === "active");
  const map = new Map<string, { creditor: string; amount: number; bookPage?: string }>();
  for (const l of active) {
    const key = (l.creditor || "Unknown lender").toUpperCase().replace(/[^A-Z0-9]/g, "");
    const entry = map.get(key) || {
      creditor: l.creditor || "Unknown lender",
      amount: 0,
      bookPage: l.bookPage,
    };
    entry.amount += l.amount || 0;
    map.set(key, entry);
  }
  const byLender = Array.from(map.values());
  const total = byLender.reduce((acc, e) => acc + e.amount, 0);
  return { total, byLender };
}

export function renderSettlementStatementHTML(
  report: TitleSearchReport,
  ctx: SettlementStatementContext,
): string {
  const today = new Date().toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric",
  });
  const closingDate = ctx.closingDate ? fmtDate(ctx.closingDate) : "[CLOSING DATE]";

  // Resolve seller from chain (last grantee = current owner).
  const lastDeed = report.chainOfTitle?.entries?.[report.chainOfTitle.entries.length - 1];
  const sellerName = lastDeed?.grantee || "[SELLER — confirm against most recent vesting deed]";
  const buyerLine = ctx.buyerName2
    ? `${ctx.buyerName} and ${ctx.buyerName2}`
    : ctx.buyerName || "[BUYER NAME]";

  // Resolve purchase price: prefer explicit, fall back to loan + 20% down assumption.
  const purchase = ctx.purchasePriceUsd ?? (ctx.loanAmountUsd ? Math.round(ctx.loanAmountUsd / 0.8) : 0);
  const loan = ctx.loanAmountUsd || 0;
  const cashDown = Math.max(0, purchase - loan);

  // Commissions
  const commissionPct = ctx.commissionPct ?? 6;
  const commissionTotal = Math.round(purchase * (commissionPct / 100));
  const listingSideCommission = Math.round(commissionTotal / 2);
  const buyerSideCommission = commissionTotal - listingSideCommission;

  // Property taxes — assessed value × estimated millage. GA average ~30 mills.
  // We don't know exact county millage at draft time; attorney edits.
  const assessed = ((report.parcel as { assessedValue?: number } | undefined)?.assessedValue) || 0;
  const annualTax = assessed > 0 ? Math.round((assessed * 0.30) / 100) : 0;
  // Prorate: assume seller has paid through end of prior year; buyer
  // reimburses seller for taxes from Jan 1 to closing date. Default to
  // half-year proration if we can't compute exactly.
  const proratedTaxToSeller = annualTax > 0 ? Math.round(annualTax / 2) : 0;

  // Fixed fees
  const attorneyFee = ctx.attorneyFeeUsd ?? 750;
  const recordingFee = calcRecordingFee();
  const transferTax = calcTransferTax(purchase);
  const titleInsurance = ctx.titleInsurancePremiumUsd ?? calcTitleInsurance(purchase);

  // Seller payoffs
  const liens = (report.liens || []) as Array<LienRecord & { isPurchaseMoney?: boolean }>;
  const payoffs = sellerPayoffs(liens);

  // ── SELLER SIDE ──
  // Credits: gross sale price + prorated tax credit
  // Charges: payoffs + commission + transfer tax + half of attorney fee + half of recording
  const sellerCredits = purchase + proratedTaxToSeller;
  const sellerCharges =
    payoffs.total +
    commissionTotal +
    transferTax +
    Math.round(attorneyFee / 2) +
    Math.round(recordingFee / 2);
  const netToSeller = sellerCredits - sellerCharges;

  // ── BUYER SIDE ──
  // Charges: purchase price + half of fees + title insurance + prorated tax owed
  // Credits: loan + earnest money (unknown — placeholder) + cash to close
  const buyerCharges =
    purchase +
    titleInsurance +
    Math.round(attorneyFee / 2) +
    Math.round(recordingFee / 2) +
    proratedTaxToSeller; // buyer reimburses seller
  const buyerCredits = loan;
  const buyerCashToClose = buyerCharges - buyerCredits;

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Settlement Statement — ${esc(report.address.fullAddress)}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Georgia, "Times New Roman", serif; font-size: 10pt; line-height: 1.4; color: #1a1a1a; padding: 0.5in; max-width: 8.5in; margin: 0 auto; }
  .header { border-bottom: 2px solid #1e3a5f; padding-bottom: 14px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: flex-start; }
  .firm-name { font-weight: 700; font-size: 12pt; color: #1e3a5f; }
  .firm-meta { color: #555; font-size: 9.5pt; }
  .logo { max-height: 56px; }
  .doc-title { text-align: center; margin-bottom: 18px; }
  .doc-title h1 { font-size: 16pt; font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase; color: #1e3a5f; }
  .doc-title .sub { font-size: 9.5pt; color: #555; font-style: italic; margin-top: 4px; }
  .doc-title .meta { font-size: 10pt; margin-top: 6px; }
  .property { background: #f8f9fa; border: 1px solid #e5e5e5; padding: 12px 16px; margin-bottom: 18px; border-radius: 4px; }
  .property dl { display: grid; grid-template-columns: 140px 1fr; gap: 4px 14px; font-size: 9.5pt; }
  .property dt { color: #555; }
  .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 22px; margin-bottom: 18px; }
  .side { border: 1px solid #1e3a5f; }
  .side h2 { background: #1e3a5f; color: white; padding: 8px 14px; font-size: 10pt; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; }
  .side table { width: 100%; border-collapse: collapse; }
  .side th { text-align: left; padding: 6px 12px; font-weight: 700; background: #f1f5f9; border-bottom: 1px solid #e5e5e5; font-size: 9pt; text-transform: uppercase; letter-spacing: 0.02em; }
  .side th.right { text-align: right; }
  .side td { padding: 5px 12px; border-bottom: 1px solid #f0f0f0; font-size: 9.5pt; vertical-align: top; }
  .side td.amt { text-align: right; font-family: "SF Mono", Consolas, monospace; }
  .side td.indent { padding-left: 22px; color: #555; font-size: 9pt; }
  .subtotal td { font-weight: 700; border-top: 1.5px solid #1a1a1a; padding-top: 8px; padding-bottom: 8px; background: #fafafa; }
  .net { background: #fef3c7; }
  .net td { font-weight: 700; font-size: 11pt; padding-top: 10px; padding-bottom: 10px; color: #78350f; }
  .fees { margin-bottom: 18px; }
  .fees h2 { font-size: 10pt; font-weight: 700; color: #1e3a5f; padding-bottom: 4px; border-bottom: 1.5px solid #1e3a5f; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.04em; }
  .fees table { width: 100%; border-collapse: collapse; font-size: 9.5pt; }
  .fees td { padding: 4px 0; }
  .fees td.amt { text-align: right; font-family: "SF Mono", Consolas, monospace; width: 100px; }
  .signature { margin-top: 28px; display: flex; gap: 40px; }
  .sig { flex: 1; }
  .sig-line { border-top: 1px solid #1a1a1a; padding-top: 4px; margin-top: 28px; font-size: 9pt; }
  .disclaimer { margin-top: 22px; padding: 12px 16px; border: 2px solid #dc2626; background: #fef2f2; border-radius: 4px; font-size: 9pt; color: #7f1d1d; line-height: 1.55; }
  .disclaimer strong { display: block; margin-bottom: 4px; font-size: 9.5pt; }
  .footer { margin-top: 14px; padding-top: 10px; border-top: 1px solid #e5e5e5; font-size: 8pt; color: #888; text-align: center; }
  .draft-watermark { position: fixed; top: 38%; left: 0; right: 0; text-align: center; font-size: 96pt; color: rgba(220, 38, 38, 0.06); font-weight: 900; letter-spacing: 0.2em; transform: rotate(-22deg); pointer-events: none; z-index: -1; }
</style></head><body>

<div class="draft-watermark">DRAFT</div>

<div class="header">
  <div>
    ${ctx.firmName ? `<div class="firm-name">${esc(ctx.firmName)}</div>` : ""}
    ${ctx.firmAddress ? `<div class="firm-meta">${esc(ctx.firmAddress)}</div>` : ""}
  </div>
  ${ctx.firmLogoUrl ? `<img class="logo" src="${esc(ctx.firmLogoUrl)}" alt="firm logo">` : ""}
</div>

<div class="doc-title">
  <h1>Settlement Statement</h1>
  <div class="sub">Draft — for attorney review prior to closing</div>
  <div class="meta">Closing date: <strong>${esc(closingDate)}</strong> · Prepared: ${esc(today)}</div>
</div>

<div class="property">
  <dl>
    <dt>Property</dt><dd>${esc(report.address.fullAddress)}</dd>
    <dt>County</dt><dd>${esc(report.parcel?.county || "—")}, Georgia</dd>
    ${report.parcel?.parcelId ? `<dt>Parcel ID</dt><dd>${esc(report.parcel.parcelId)}</dd>` : ""}
    <dt>Seller</dt><dd>${esc(sellerName)}</dd>
    <dt>Buyer</dt><dd>${esc(buyerLine)}</dd>
    ${ctx.newLenderName ? `<dt>New lender</dt><dd>${esc(ctx.newLenderName)}</dd>` : ""}
  </dl>
</div>

<div class="two-col">
  <!-- SELLER SIDE -->
  <div class="side">
    <h2>Seller — ${esc(sellerName.split(",")[0])}</h2>
    <table>
      <tr><th colspan="2">Credits to Seller</th></tr>
      <tr><td>Gross sale price</td><td class="amt">${money(purchase)}</td></tr>
      ${proratedTaxToSeller > 0 ? `<tr><td>Tax proration (½ year, est.)</td><td class="amt">${money(proratedTaxToSeller)}</td></tr>` : ""}
      <tr class="subtotal"><td>Total Credits</td><td class="amt">${money(sellerCredits)}</td></tr>

      <tr><th colspan="2">Charges to Seller</th></tr>
      ${payoffs.byLender.length > 0
        ? payoffs.byLender.map((p) => `
            <tr><td>Payoff — ${esc(p.creditor)}${p.bookPage ? ` (Bk ${esc(p.bookPage)})` : ""}</td><td class="amt">${money(p.amount)}</td></tr>
          `).join("")
        : `<tr><td>No active liens of record (verify with lenders)</td><td class="amt">—</td></tr>`}
      <tr><td>Real estate commission (${commissionPct}%)</td><td class="amt">${money(commissionTotal)}</td></tr>
      <tr><td class="indent">Listing-side ${(commissionPct / 2).toFixed(1)}%</td><td class="amt">${money(listingSideCommission)}</td></tr>
      <tr><td class="indent">Buyer-side ${(commissionPct / 2).toFixed(1)}%</td><td class="amt">${money(buyerSideCommission)}</td></tr>
      <tr><td>GA transfer tax ($1/$1,000)</td><td class="amt">${money(transferTax)}</td></tr>
      <tr><td>Attorney fee (½ share)</td><td class="amt">${money(Math.round(attorneyFee / 2))}</td></tr>
      <tr><td>Recording fees (½ share)</td><td class="amt">${money(Math.round(recordingFee / 2))}</td></tr>
      <tr class="subtotal"><td>Total Charges</td><td class="amt">${money(sellerCharges)}</td></tr>

      <tr class="net"><td>NET TO SELLER</td><td class="amt">${money(netToSeller)}</td></tr>
    </table>
  </div>

  <!-- BUYER SIDE -->
  <div class="side">
    <h2>Buyer — ${esc((ctx.buyerName || "[BUYER]").split(",")[0])}</h2>
    <table>
      <tr><th colspan="2">Charges to Buyer</th></tr>
      <tr><td>Purchase price</td><td class="amt">${money(purchase)}</td></tr>
      <tr><td>Owner's title insurance (est.)</td><td class="amt">${money(titleInsurance)}</td></tr>
      <tr><td>Attorney fee (½ share)</td><td class="amt">${money(Math.round(attorneyFee / 2))}</td></tr>
      <tr><td>Recording fees (½ share)</td><td class="amt">${money(Math.round(recordingFee / 2))}</td></tr>
      ${proratedTaxToSeller > 0 ? `<tr><td>Tax proration owed to seller</td><td class="amt">${money(proratedTaxToSeller)}</td></tr>` : ""}
      <tr class="subtotal"><td>Total Charges</td><td class="amt">${money(buyerCharges)}</td></tr>

      <tr><th colspan="2">Credits to Buyer</th></tr>
      <tr><td>Loan proceeds${ctx.newLenderName ? ` — ${esc(ctx.newLenderName)}` : ""}</td><td class="amt">${money(loan)}</td></tr>
      <tr><td>Earnest money / cash deposits</td><td class="amt">[EM]</td></tr>
      <tr class="subtotal"><td>Total Credits</td><td class="amt">${money(buyerCredits)}</td></tr>

      <tr class="net"><td>CASH FROM BUYER AT CLOSING</td><td class="amt">${money(buyerCashToClose)}</td></tr>
    </table>
  </div>
</div>

<div class="fees">
  <h2>Fee Summary (informational)</h2>
  <table>
    <tr><td>Cliros fee (this report)</td><td class="amt">$200</td></tr>
    <tr><td>Attorney fee total (split per agreement)</td><td class="amt">${money(attorneyFee)}</td></tr>
    <tr><td>Recording fees total</td><td class="amt">${money(recordingFee)}</td></tr>
    <tr><td>Owner's title insurance premium (est. @ $3.50/$1,000)</td><td class="amt">${money(titleInsurance)}</td></tr>
    <tr><td>Real estate commission total (${commissionPct}%)</td><td class="amt">${money(commissionTotal)}</td></tr>
    <tr><td>GA transfer tax ($1/$1,000 of consideration)</td><td class="amt">${money(transferTax)}</td></tr>
  </table>
</div>

<div class="signature">
  <div class="sig">
    <div class="sig-line"><strong>${esc(sellerName)}</strong> — Seller</div>
  </div>
  <div class="sig">
    <div class="sig-line"><strong>${esc(buyerLine)}</strong> — Buyer</div>
  </div>
</div>

<div class="signature">
  <div class="sig">
    <div class="sig-line">${esc(ctx.attorneyName || "[ATTORNEY NAME]")}${ctx.attorneyBarNumber ? `, Bar No. ${esc(ctx.attorneyBarNumber)}` : ""} — Settlement Agent</div>
  </div>
</div>

<div class="disclaimer">
  <strong>DRAFT — FOR ATTORNEY REVIEW ONLY.</strong>
  This settlement statement is a Cliros-assembled DRAFT based on data retrieved
  from the public records and inputs provided by the closing attorney. Numbers are
  estimates: tax proration uses an average 30-mill millage rate (verify against
  the actual county millage), title insurance premium uses a Georgia tier-1 rate
  card (the actual underwriter may charge differently), recording fees use the
  GA standard 2-instrument residential bundle (adjust for additional instruments),
  and earnest money is a placeholder (insert from the P&amp;S). The settlement
  agent verifies every line item against the closing file and signs the final
  statement; Cliros prepares the draft, not the binding numbers.
</div>

<div class="footer">
  Generated by Cliros — End-to-end closing document assembly for Georgia attorneys · cliros.ai
</div>
</body></html>`;
}
