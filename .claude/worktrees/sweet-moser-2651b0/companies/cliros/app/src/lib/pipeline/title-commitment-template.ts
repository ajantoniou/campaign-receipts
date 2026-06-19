/* ─── Title commitment summary template ───
   Attorney-prepared title commitment summary. Two schedules:
     A. Vested owner + legal description (the "what's being conveyed").
     B-1. Curative items required at closing (must clear before closing).
     B-2. Permitted exceptions (survive closing — easements, restrictions,
          aged released liens flagged for underwriter exception).

   This is NOT an underwriter-issued title insurance commitment. Cliros
   does not underwrite or issue insurance. For deals that require title
   insurance, the attorney delivers this draft to the underwriter who
   countersigns and issues the policy. For cash deals, refinances of an
   existing owner's policy, or deals where the buyer waives insurance,
   the attorney-prepared commitment is the closing-ready document.
*/

import type { TitleSearchReport, LienRecord, TitleDefect } from "../types";

export interface TitleCommitmentContext {
  /** Firm letterhead — same shape as AOL/homeowner templates. */
  firmName?: string;
  firmAddress?: string;
  firmPhone?: string;
  firmWebsite?: string;
  firmLogoUrl?: string;
  attorneyName?: string;
  attorneyBarNumber?: string;
  /** Effective date — defaults to today. */
  effectiveDate?: string;
  /** Optional proposed insured (buyer name) for deals where Cliros knows it. */
  proposedInsured?: string;
}

function esc(s?: string | number | null): string {
  if (s == null) return "";
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function fmtDate(s?: string | null): string {
  if (!s) return "—";
  const d = new Date(s);
  if (isNaN(d.getTime())) return s;
  return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

function fmtMoney(n?: number | null): string {
  if (n == null || !Number.isFinite(n) || n <= 0) return "—";
  return `$${Math.round(n).toLocaleString()}`;
}

interface ClassifiedItems {
  curative: Array<{ label: string; cite: string; detail: string }>;
  permitted: Array<{ label: string; cite: string; detail: string }>;
}

/**
 * Sort liens + defects + chain breaks into Schedule B-1 (curative) vs
 * Schedule B-2 (permitted exceptions). Matches the attorney-action-plan
 * clustering: purchase-money mortgage = permitted (B-2), active SDs with
 * release required = curative (B-1), aged-released = permitted with
 * underwriter exception.
 */
function classifySchedules(report: TitleSearchReport): ClassifiedItems {
  const out: ClassifiedItems = { curative: [], permitted: [] };

  const liens = (report.liens as Array<LienRecord & { isPurchaseMoney?: boolean; stale_flag?: string }>) || [];
  const defects = (report.defects as TitleDefect[]) || [];

  // B-1 Curative — active liens that need clearance, critical/major defects
  for (const l of liens) {
    if (l.status !== "active") continue;
    if (l.isPurchaseMoney) continue; // → permitted below
    const bp = l.bookPage || l.referencedBookPage || "—";
    const amt = fmtMoney(l.amount);
    const lender = l.creditor && l.creditor !== "(lender not in index)" ? l.creditor : "Lender not in index";
    out.curative.push({
      label: l.type === "tax" ? `Tax lien (${lender})` : `${l.type[0].toUpperCase()}${l.type.slice(1)} lien — ${lender}`,
      cite: `Book ${bp}${amt !== "—" ? ` · ${amt}` : ""}`,
      detail:
        l.type === "tax"
          ? `Active tax lien of record. Obtain payoff and cancellation from the county tax commissioner prior to closing.`
          : `Active ${l.type} of record. Obtain payoff statement and recorded cancellation prior to closing.`,
    });
  }
  for (const d of defects) {
    if (d.severity !== "critical" && d.severity !== "major") continue;
    out.curative.push({
      label: d.title,
      cite: d.severity.toUpperCase(),
      detail: d.description,
    });
  }
  // Chain breaks (real ones, not Unknown-party index gaps) — curative.
  const realBreaks = (report.chainOfTitle?.breaks || []).filter((b) => !/\bUnknown\b/i.test(b));
  for (const br of realBreaks) {
    out.curative.push({
      label: "Chain of title inconsistency",
      cite: "Index review",
      detail: `${br} — verify by pulling the deed image and confirming parties match.`,
    });
  }

  // B-2 Permitted exceptions
  // — Purchase-money mortgage (current owner's home loan; pays off at THIS
  //   owner's next sale, not this closing). Shown so the underwriter knows
  //   the owner of record is encumbered.
  for (const l of liens) {
    if (l.status === "active" && l.isPurchaseMoney) {
      const bp = l.bookPage || "—";
      out.permitted.push({
        label: `Current owner's mortgage — ${l.creditor || "Lender"}`,
        cite: `Book ${bp} · ${fmtMoney(l.amount)}`,
        detail:
          "Active purchase-money mortgage co-recorded with the current owner's vesting deed. " +
          "Pays off when this owner sells. Not a curative item for this closing.",
      });
    }
  }
  // — Aged released liens — released of record, no longer an encumbrance
  for (const l of liens) {
    const stale = (l as LienRecord & { stale_flag?: string }).stale_flag;
    if (l.status === "released" && stale && stale.includes("ancient")) {
      out.permitted.push({
        label: `Aged released lien (${l.type})`,
        cite: `Book ${l.bookPage || "—"}`,
        detail:
          "Released of record; no longer an encumbrance. " +
          "Confirm the recorded cancellation and that the underwriter excepts it from coverage.",
      });
    }
  }
  // — Minor defects = permitted, attorney verifies
  for (const d of defects) {
    if (d.severity !== "minor") continue;
    out.permitted.push({
      label: d.title,
      cite: "MINOR",
      detail: d.description,
    });
  }
  // — Easements + recorded restrictions = permitted (standard)
  for (const e of (report.easements || [])) {
    out.permitted.push({
      label: `Easement (${e.type || "unspecified"})`,
      cite: e.bookPage ? `Book ${e.bookPage}` : "—",
      detail: e.description || "Recorded easement of record.",
    });
  }
  // Always-present standard exceptions
  out.permitted.push({
    label: "Standard survey exception",
    cite: "Standard",
    detail: "Any encroachments, overlaps, boundary line disputes, or other matters which would be disclosed by an accurate and complete survey of the premises.",
  });
  out.permitted.push({
    label: "Parties in possession",
    cite: "Standard",
    detail: "Rights or claims of parties in possession not shown by the public records.",
  });

  return out;
}

export function renderTitleCommitmentHTML(
  report: TitleSearchReport,
  ctx: TitleCommitmentContext,
): string {
  const today = ctx.effectiveDate || new Date().toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric",
  });

  const lastDeed = report.chainOfTitle?.entries?.[report.chainOfTitle.entries.length - 1];
  const vestedOwner = lastDeed?.grantee || "Owner of record (verify against current parcel anchor)";
  const legalDesc =
    report.parcel?.legalDescription ||
    "Refer to most recent vesting deed of record for full metes-and-bounds description.";

  const { curative, permitted } = classifySchedules(report);

  const curativeRows = curative.length > 0
    ? curative.map((it, i) => `
      <tr>
        <td class="num">${i + 1}.</td>
        <td><strong>${esc(it.label)}</strong><br><span class="cite">${esc(it.cite)}</span></td>
        <td>${esc(it.detail)}</td>
      </tr>`).join("")
    : `<tr><td colspan="3" class="empty">No curative items identified. Title appears clear of monetary encumbrances requiring release at closing.</td></tr>`;

  const permittedRows = permitted.length > 0
    ? permitted.map((it, i) => `
      <tr>
        <td class="num">${i + 1}.</td>
        <td><strong>${esc(it.label)}</strong><br><span class="cite">${esc(it.cite)}</span></td>
        <td>${esc(it.detail)}</td>
      </tr>`).join("")
    : `<tr><td colspan="3" class="empty">Standard exceptions only.</td></tr>`;

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Title Commitment — ${esc(report.address.fullAddress)}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: Georgia, "Times New Roman", serif; font-size: 10.5pt; line-height: 1.45; color: #1a1a1a; padding: 0.5in; max-width: 8.5in; margin: 0 auto; }
  .header { border-bottom: 2px solid #1e3a5f; padding-bottom: 14px; margin-bottom: 22px; display: flex; align-items: flex-start; justify-content: space-between; }
  .firm { font-size: 10pt; }
  .firm-name { font-weight: 700; font-size: 12pt; color: #1e3a5f; }
  .firm-meta { color: #555; }
  .logo { max-height: 56px; }
  .title-block { text-align: center; margin-bottom: 22px; }
  .doc-title { font-size: 16pt; font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase; color: #1e3a5f; }
  .doc-sub { font-size: 10pt; color: #555; margin-top: 4px; font-style: italic; }
  .effective { margin-top: 8px; font-size: 10pt; }
  .property { background: #f8f9fa; border: 1px solid #e5e5e5; border-radius: 4px; padding: 14px 18px; margin-bottom: 22px; }
  .property h2 { font-size: 11pt; color: #1e3a5f; margin-bottom: 8px; }
  .property dl { display: grid; grid-template-columns: 140px 1fr; gap: 4px 14px; font-size: 10pt; }
  .property dt { color: #555; }
  .property dd { color: #1a1a1a; }
  .schedule { margin-bottom: 22px; page-break-inside: avoid; }
  .schedule h2 { font-size: 12pt; font-weight: 700; color: #1e3a5f; padding-bottom: 6px; border-bottom: 1.5px solid #1e3a5f; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 0.04em; }
  .schedule .lead { font-size: 9.5pt; color: #555; font-style: italic; margin-bottom: 10px; }
  table { width: 100%; border-collapse: collapse; font-size: 10pt; }
  th { text-align: left; padding: 8px 10px 6px; font-weight: 700; background: #f1f5f9; color: #1e3a5f; border-bottom: 1.5px solid #1e3a5f; font-size: 9.5pt; text-transform: uppercase; letter-spacing: 0.03em; }
  td { padding: 9px 10px; border-bottom: 1px solid #e5e5e5; vertical-align: top; }
  td.num { font-weight: 700; color: #1e3a5f; width: 36px; text-align: right; padding-right: 14px; }
  .cite { font-family: "SF Mono", Consolas, monospace; font-size: 8.5pt; color: #666; }
  .empty { color: #666; font-style: italic; text-align: center; padding: 16px 10px; }
  .signature { margin-top: 36px; }
  .signature-line { border-top: 1px solid #1a1a1a; width: 280px; margin-bottom: 4px; padding-top: 4px; }
  .signature-name { font-weight: 700; }
  .signature-meta { font-size: 9pt; color: #555; }
  .disclaimer { margin-top: 28px; padding: 14px 16px; border: 1.5px solid #fbbf24; background: #fffbeb; border-radius: 4px; font-size: 9pt; color: #78350f; line-height: 1.6; }
  .disclaimer strong { color: #78350f; }
  .footer { margin-top: 22px; padding-top: 14px; border-top: 1px solid #e5e5e5; font-size: 8.5pt; color: #888; text-align: center; }
</style></head><body>

<div class="header">
  <div class="firm">
    ${ctx.firmName ? `<div class="firm-name">${esc(ctx.firmName)}</div>` : ""}
    ${ctx.firmAddress ? `<div class="firm-meta">${esc(ctx.firmAddress)}</div>` : ""}
    ${ctx.firmPhone ? `<div class="firm-meta">${esc(ctx.firmPhone)}</div>` : ""}
    ${ctx.firmWebsite ? `<div class="firm-meta">${esc(ctx.firmWebsite)}</div>` : ""}
  </div>
  ${ctx.firmLogoUrl ? `<img class="logo" src="${esc(ctx.firmLogoUrl)}" alt="firm logo">` : ""}
</div>

<div class="title-block">
  <div class="doc-title">Title Commitment Summary</div>
  <div class="doc-sub">Attorney-prepared schedule of conditions and exceptions</div>
  <div class="effective">Effective date: <strong>${esc(today)}</strong></div>
</div>

<div class="property">
  <h2>Subject Property</h2>
  <dl>
    <dt>Address</dt><dd>${esc(report.address.fullAddress)}</dd>
    <dt>County</dt><dd>${esc(report.parcel?.county || report.address.county || "—")}, Georgia</dd>
    ${report.parcel?.parcelId ? `<dt>Parcel ID</dt><dd>${esc(report.parcel.parcelId)}</dd>` : ""}
    <dt>Search window</dt><dd>${esc(fmtDate(report.chainOfTitle?.startDate))} through ${esc(fmtDate(report.chainOfTitle?.endDate))} (${report.chainOfTitle?.yearsSearched || "—"} years)</dd>
    ${ctx.proposedInsured ? `<dt>Proposed insured</dt><dd>${esc(ctx.proposedInsured)}</dd>` : ""}
  </dl>
</div>

<div class="schedule">
  <h2>Schedule A — Vesting</h2>
  <table>
    <tr><th style="width:160px">Estate or interest</th><td>Fee simple</td></tr>
    <tr><th>Vested in</th><td><strong>${esc(vestedOwner)}</strong> (as shown by most recent deed of record)</td></tr>
    <tr><th>Legal description</th><td>${esc(legalDesc)}</td></tr>
    ${lastDeed?.bookPage ? `<tr><th>Vesting deed</th><td>Recorded ${esc(fmtDate(lastDeed.recordedDate || (lastDeed as { date?: string }).date))} · Book ${esc(lastDeed.bookPage)} · ${esc(lastDeed.type || "")}</td></tr>` : ""}
  </table>
</div>

<div class="schedule">
  <h2>Schedule B-1 — Requirements (Curative)</h2>
  <p class="lead">The following matters must be satisfied, released, or otherwise resolved on or before the closing date.</p>
  <table>
    <thead><tr><th></th><th>Item</th><th>Action required</th></tr></thead>
    <tbody>${curativeRows}</tbody>
  </table>
</div>

<div class="schedule">
  <h2>Schedule B-2 — Permitted Exceptions</h2>
  <p class="lead">The following matters of record and standard exceptions survive closing. They do not require curative action.</p>
  <table>
    <thead><tr><th></th><th>Item</th><th>Description</th></tr></thead>
    <tbody>${permittedRows}</tbody>
  </table>
</div>

<div class="signature">
  <div class="signature-line"></div>
  <div class="signature-name">${esc(ctx.attorneyName || "[ATTORNEY NAME]")}</div>
  ${ctx.attorneyBarNumber ? `<div class="signature-meta">Georgia Bar No. ${esc(ctx.attorneyBarNumber)}</div>` : ""}
  ${ctx.firmName ? `<div class="signature-meta">${esc(ctx.firmName)}</div>` : ""}
  <div class="signature-meta">Date: ${esc(today)}</div>
</div>

<div class="disclaimer">
  <strong>NOT A POLICY OF TITLE INSURANCE.</strong> This document is an attorney-prepared summary of conditions and exceptions based on the public records examined within the search window stated above. It is not a binding commitment to issue a policy of title insurance and does not insure against any defect, lien, encumbrance, or other matter. For deals requiring title insurance, this summary may serve as a draft to be reviewed and countersigned by a licensed title insurance underwriter. The reviewing attorney verifies the public-record examination and renders the legal opinion. Cliros provides informational research and document assembly only.
</div>

<div class="footer">
  Generated by Cliros — Title research and closing document assembly for Georgia attorneys · cliros.ai
</div>
</body></html>`;
}
