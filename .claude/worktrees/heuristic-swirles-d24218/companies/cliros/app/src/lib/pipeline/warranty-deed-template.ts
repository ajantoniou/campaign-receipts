/* ─── Draft warranty deed template ───
   Generates a GA-standard warranty deed DRAFT for the attorney to review,
   edit, and execute at closing. This is template-fill work that closing
   attorneys do dozens of times per week — Cliros pre-fills the bones from
   the data we already have (legal description, seller from chain, etc.)
   and the attorney supplies the buyer name + consideration.

   UPL posture: drafting a closing document IS practicing law in GA. This
   template MUST be framed as "prepared at the direction of [attorney]"
   and the attorney is the responsible drafter. Cliros assembles; the
   attorney reviews + finalizes + executes. Standard pattern across all
   closing software (SoftPro, Qualia, ResWare all operate this way).
*/

import type { TitleSearchReport } from "../types";

export interface WarrantyDeedContext {
  /** Firm letterhead — same shape as the other templates. */
  firmName?: string;
  firmAddress?: string;
  firmLogoUrl?: string;
  attorneyName?: string;
  attorneyBarNumber?: string;

  /** Buyer name(s) — from search_hints.buyerName. REQUIRED for a usable
   *  draft. If missing, template shows placeholder so attorney must fill. */
  buyerName?: string;
  /** Optional second buyer (joint tenancy / tenants in common). */
  buyerName2?: string;
  /** Joint tenancy framing. Default = TIC. */
  jointTenancy?: boolean;

  /** Consideration in USD whole dollars. From search_hints.loanAmount or
   *  the listing price scraped from Zillow/Redfin. Attorney edits if wrong. */
  considerationUsd?: number;

  /** Closing date — from search_reports.closing_date. */
  closingDate?: string;

  /** Optional explicit seller name override. Defaults to last grantee of
   *  chain (= current owner of record = the seller in this conveyance). */
  sellerNameOverride?: string;
}

function esc(s?: string | number | null): string {
  if (s == null) return "";
  return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function fmtDate(s?: string | null): string {
  if (!s) return "";
  const d = new Date(s);
  if (isNaN(d.getTime())) return s;
  return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

function moneyWords(n?: number): string {
  if (!n || n <= 0) return "[INSERT CONSIDERATION]";
  // For closing-doc consideration, attorneys typically write
  // "Ten Dollars ($10.00) and other good and valuable consideration" for
  // privacy reasons — the actual purchase price goes on the PT-61, not
  // the recorded deed. Match that convention but show the full amount as
  // a comment for the attorney's reference.
  return `Ten Dollars ($10.00) and other good and valuable consideration`;
}

export function renderWarrantyDeedHTML(
  report: TitleSearchReport,
  ctx: WarrantyDeedContext,
): string {
  const today = new Date().toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric",
  });

  // Seller = current vested owner (last grantee in the chain). Attorney
  // confirms this against the most recent deed of record.
  const lastDeed = report.chainOfTitle?.entries?.[report.chainOfTitle.entries.length - 1];
  const sellerName = ctx.sellerNameOverride || lastDeed?.grantee || "[SELLER NAME — confirm against most recent vesting deed]";

  const buyerLine = ctx.buyerName2
    ? `${esc(ctx.buyerName)}${ctx.jointTenancy ? " AND " : " AND "}${esc(ctx.buyerName2)}, as ${ctx.jointTenancy ? "JOINT TENANTS WITH RIGHT OF SURVIVORSHIP" : "TENANTS IN COMMON"}`
    : ctx.buyerName
      ? esc(ctx.buyerName)
      : "[BUYER NAME — required before execution]";

  const county = report.parcel?.county || report.address.county || "[COUNTY]";
  const legalDesc = report.parcel?.legalDescription
    || "Refer to most recent vesting deed of record for full metes-and-bounds description. Verify legal description matches subject property before execution.";

  const considerationDisplay = moneyWords(ctx.considerationUsd);
  const considerationComment = ctx.considerationUsd && ctx.considerationUsd > 10
    ? `<span class="reviewer-note">Reviewer note: True consideration is $${ctx.considerationUsd.toLocaleString()}. Full amount goes on PT-61 (not recorded here) per GA practice.</span>`
    : "";

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Draft Warranty Deed — ${esc(report.address.fullAddress)}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: "Times New Roman", Georgia, serif; font-size: 12pt; line-height: 1.55; color: #1a1a1a; padding: 1in 1in 0.75in; max-width: 8.5in; margin: 0 auto; }
  .draft-watermark { position: fixed; top: 40%; left: 0; right: 0; text-align: center; font-size: 96pt; color: rgba(220, 38, 38, 0.08); font-weight: 900; letter-spacing: 0.2em; transform: rotate(-22deg); transform-origin: center; pointer-events: none; z-index: -1; }
  .prep-block { font-size: 10pt; color: #444; border-bottom: 1px solid #999; padding-bottom: 10px; margin-bottom: 24px; }
  .prep-block strong { color: #1a1a1a; }
  .return-block { font-size: 10pt; color: #444; margin-bottom: 30px; }
  .doc-title { text-align: center; font-size: 18pt; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; margin-bottom: 6px; }
  .state-county { text-align: center; font-size: 11pt; margin-bottom: 24px; }
  p { margin-bottom: 14px; text-align: justify; }
  .legal-desc { margin: 14px 0 14px 0.5in; padding: 10px 14px; border-left: 3px solid #999; background: #fafafa; font-size: 11pt; }
  .signature-area { margin-top: 50px; }
  .sig-row { display: flex; justify-content: space-between; gap: 40px; margin-bottom: 30px; }
  .sig-col { flex: 1; }
  .sig-line { border-top: 1px solid #1a1a1a; padding-top: 4px; font-size: 10pt; }
  .sig-name { font-weight: 700; font-size: 11pt; }
  .witness-section { margin-top: 40px; padding-top: 20px; border-top: 1px solid #ccc; }
  .witness-section h3 { font-size: 11pt; font-weight: 700; margin-bottom: 14px; }
  .upl-banner { margin-top: 40px; padding: 14px 18px; border: 2px solid #dc2626; background: #fef2f2; border-radius: 4px; font-size: 9.5pt; color: #7f1d1d; line-height: 1.55; }
  .upl-banner strong { display: block; margin-bottom: 4px; font-size: 10pt; }
  .reviewer-note { display: inline-block; margin-top: 6px; padding: 3px 8px; background: #fef3c7; color: #78350f; border-radius: 3px; font-size: 9pt; font-style: italic; }
  .footer { margin-top: 22px; font-size: 8.5pt; color: #888; text-align: center; }
</style></head><body>

<div class="draft-watermark">DRAFT</div>

<div class="prep-block">
  <strong>This instrument prepared at the direction of:</strong><br>
  ${esc(ctx.attorneyName || "[ATTORNEY NAME]")}${ctx.attorneyBarNumber ? `, Georgia Bar No. ${esc(ctx.attorneyBarNumber)}` : ""}<br>
  ${esc(ctx.firmName || "")}<br>
  ${esc(ctx.firmAddress || "")}
</div>

<div class="return-block">
  <strong>After recording, return to:</strong><br>
  ${esc(ctx.firmName || "[FIRM NAME]")}<br>
  ${esc(ctx.firmAddress || "[FIRM ADDRESS]")}
</div>

<div class="doc-title">Warranty Deed</div>
<div class="state-county">STATE OF GEORGIA · COUNTY OF ${esc(county.toUpperCase())}</div>

<p>
THIS INDENTURE, made this _______ day of _____________________, ${new Date().getFullYear()},
between <strong>${esc(sellerName)}</strong>, of the County of ${esc(county)},
State of Georgia (hereinafter called &ldquo;Grantor&rdquo;), and
<strong>${buyerLine}</strong> (hereinafter called &ldquo;Grantee&rdquo;).
</p>

<p>
WITNESSETH that Grantor, for and in consideration of the sum of
<strong>${considerationDisplay}</strong> in hand paid, the receipt and sufficiency
whereof is hereby acknowledged, has granted, bargained, sold, aliened, conveyed
and confirmed, and by these presents does grant, bargain, sell, alien, convey and
confirm unto the said Grantee, its heirs, successors, and assigns, all that tract
or parcel of land lying and being in the County of ${esc(county)}, State of Georgia,
and being more particularly described as follows:
</p>

<div class="legal-desc">
${esc(legalDesc).replace(/\n/g, "<br>")}<br><br>
<em>Property address: ${esc(report.address.fullAddress)}</em>
${report.parcel?.parcelId ? `<br><em>Tax parcel: ${esc(report.parcel.parcelId)}</em>` : ""}
${lastDeed?.bookPage ? `<br><em>Being the same property conveyed to Grantor by deed recorded in Book ${esc(lastDeed.bookPage)} of the ${esc(county)} County records.</em>` : ""}
</div>

${considerationComment}

<p>
TO HAVE AND TO HOLD the said tract or parcel of land, with all and singular the rights,
members and appurtenances thereof, to the same being, belonging, or in anywise appertaining,
to the only proper use, benefit and behoof of the said Grantee, its heirs, successors
and assigns, in FEE SIMPLE.
</p>

<p>
AND THE SAID GRANTOR will warrant and forever defend the right and title to the
above described property, unto the said Grantee, its heirs, successors and assigns,
against the claims of all persons whomsoever.
</p>

<p>
This conveyance is made subject to all easements, restrictions, covenants of record,
and matters disclosed in the title commitment of even or near date herewith.
</p>

<p>
IN WITNESS WHEREOF, the said Grantor has signed and sealed this deed, the day
and year first above written.
</p>

<div class="signature-area">
  <div class="sig-row">
    <div class="sig-col">
      <div class="sig-line">Signed, sealed and delivered in the presence of:</div>
    </div>
    <div class="sig-col">
      <div class="sig-line">${esc(sellerName)} <em>(Grantor)</em></div>
    </div>
  </div>

  <div class="witness-section">
    <h3>WITNESSES:</h3>
    <div class="sig-row">
      <div class="sig-col">
        <div style="margin-bottom:24px"></div>
        <div class="sig-line">Unofficial Witness</div>
      </div>
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

<div class="upl-banner">
  <strong>DRAFT — FOR ATTORNEY REVIEW ONLY.</strong>
  This document was assembled by Cliros at the direction of the named attorney from data
  retrieved from the public records. It is a draft instrument and is not legally effective
  until reviewed, edited as necessary, and executed under the supervision of the responsible
  attorney. The reviewing attorney provides the legal judgment, verifies the legal
  description and party names against the closing file, and is the party of record on
  the executed deed. Cliros provides document-assembly assistance only and does not
  practice law, render legal advice, or guarantee the legal effect of any instrument.
</div>

<div class="footer">
  Generated by Cliros — Closing document assembly for Georgia attorneys · cliros.ai
  ${ctx.closingDate ? ` · Anticipated closing: ${esc(fmtDate(ctx.closingDate))}` : ""}
  · Draft generated ${esc(today)}
</div>
</body></html>`;
}
