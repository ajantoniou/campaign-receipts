/* ─── Homeowner Summary HTML Template ───
   Plain-English client-facing summary the attorney downloads, brands with
   their firm logo, and forwards to the buyer/seller. Designed to be readable
   in 60 seconds — not a legal opinion.
*/

import type { TitleSearchReport } from "../types";
import { computeTitleMetrics } from "../title-metrics";
import { prepareChainForDisplay, formatInstrumentLabel, CHAIN_DISPLAY_YEARS } from "../chain-display";

export interface HomeownerTemplateContext {
  firmName?: string;
  firmAddress?: string;
  firmPhone?: string;
  firmWebsite?: string;
  firmLogoUrl?: string;
  attorneyName?: string;
  attorneyBarNumber?: string;
  attorneyDirectDial?: string;
  attorneyEmail?: string;
  ioltaDisclosure?: string;
  showBarAdvertisingFooter?: boolean;   // GA Rule 7.1–7.5
  customClosingMessage?: string;
  /** Signed Street View URL (front-of-house photo). 50% of hero strip. */
  streetviewUrl?: string;
  /** Signed Google Static Map URL (satellite + parcel pin). 50% of hero strip. */
  mapUrl?: string;
}

function severityColor(sev: string): string {
  if (sev === "critical") return "#C45B4A";
  if (sev === "major") return "#D08B4F";
  if (sev === "minor") return "#C4A24A";
  return "#7D9B76";
}

function severityLabel(sev: string): string {
  if (sev === "critical") return "Needs immediate attention";
  if (sev === "major") return "Important to address";
  if (sev === "minor") return "Worth noting";
  return "Informational";
}

function plainEnglishStatus(report: TitleSearchReport): { label: string; color: string; message: string } {
  const metrics = computeTitleMetrics({
    riskScore: report.riskScore,
    liens: report.liens,
    defects: report.defects,
  });
  if (metrics.tone === "clear") {
    return {
      label: "CLEAR",
      color: "#5B8C5A",
      message:
        "Indexed records show no active liens or major defects flagged for attorney review before closing.",
    };
  }
  if (metrics.tone === "verify") {
    return {
      label: "ITEMS TO VERIFY",
      color: "#D08B4F",
      message:
        `We found ${metrics.curativeItemCount} item${metrics.curativeItemCount === 1 ? "" : "s"} worth verifying before closing. Your attorney will pull deed images and confirm releases — this summary is not a title opinion.`,
    };
  }
  return {
    label: "ATTORNEY REVIEW NEEDED",
    color: "#C45B4A",
    message:
      `Indexed records flagged ${metrics.curativeItemCount} curative item${metrics.curativeItemCount === 1 ? "" : "s"}${metrics.activeLienCount ? ` and ${metrics.activeLienCount} active lien${metrics.activeLienCount === 1 ? "" : "s"}` : ""}. Your attorney must verify before closing — not a final title opinion.`,
  };
}

export function generateHomeownerSummaryHTML(
  report: TitleSearchReport,
  ctx: HomeownerTemplateContext
): string {
  const status = plainEnglishStatus(report);
  const today = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const fmtDate = (raw?: string): string => {
    if (!raw) return "—";
    const d = new Date(raw);
    if (isNaN(d.getTime())) return raw;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };
  const fmtMoney = (n?: number): string => (n && n > 0 ? `$${n.toLocaleString()}` : "—");
  const chainDisplay = prepareChainForDisplay(
    (report.chainOfTitle?.entries || []) as Array<{
      grantor?: string; grantee?: string; recordedDate?: string; date?: string;
      type?: string; instrument?: string; bookPage?: string; book?: string; page?: string;
      consideration?: number;
    }>,
  );
  const chain = chainDisplay.visible;
  const activeLiens = (report.liens || []).filter((l) => l.status === "active");
  const releasedLiens = (report.liens || []).filter((l) => l.status === "released");
  const realBreaks = (report.chainOfTitle?.breaks || []).filter(
    (b) => !/\bUnknown\b/i.test(b)
  );
  const defects = report.defects || [];
  const facts: string[] = [];
  if (chain.length > 0) {
    const newest = chain[0];
    const oldestVisible = chain[chain.length - 1];
    facts.push(
      `Most recent conveyance: <strong>${escapeHtml(fmtDate(newest.recordedDate || newest.date))}</strong>${chainDisplay.totalCount > chain.length ? ` (${chain.length} of ${chainDisplay.totalCount} shown — last ${CHAIN_DISPLAY_YEARS} years)` : ""}.`
    );
    if (newest.grantee && newest.grantee !== "Unknown") {
      facts.push(`Grantee on latest deed: <strong>${escapeHtml(String(newest.grantee))}</strong> — confirm with deed image.`);
    }
    if (oldestVisible !== newest) {
      facts.push(`Visible chain spans <strong>${escapeHtml(fmtDate(oldestVisible.recordedDate || oldestVisible.date))}</strong> through <strong>${escapeHtml(fmtDate(newest.recordedDate || newest.date))}</strong>.`);
    }
  }
  if (activeLiens.length === 0) {
    facts.push("No active liens or unreleased security deeds found in the public record.");
  } else {
    facts.push(
      `<strong>${activeLiens.length}</strong> active lien${activeLiens.length === 1 ? "" : "s"} remain of record — see the breakdown below.`
    );
  }
  if (releasedLiens.length > 0) {
    facts.push(
      `${releasedLiens.length} historical lien${releasedLiens.length === 1 ? "" : "s"} have been released or cancelled.`
    );
  }
  if (realBreaks.length > 0) {
    facts.push(
      `<strong>${realBreaks.length}</strong> chain inconsistenc${realBreaks.length === 1 ? "y" : "ies"} flagged for attorney verification.`
    );
  }

  // Sort defects critical → major → minor
  const sevRank: Record<string, number> = { critical: 0, major: 1, minor: 2 };
  const sortedDefects = [...defects].sort(
    (a, b) => (sevRank[a.severity] ?? 9) - (sevRank[b.severity] ?? 9)
  );

  const firmHeader = ctx.firmLogoUrl
    ? `<img src="${ctx.firmLogoUrl}" alt="${ctx.firmName || ""}" style="max-height:72px;max-width:240px;object-fit:contain;"/>`
    : `<div class="firm-name-fallback">${escapeHtml(ctx.firmName || "Your Closing Attorney")}</div>`;

  const advertisingFooter = ctx.showBarAdvertisingFooter
    ? `<div class="ga-bar-notice">This communication may be considered attorney advertising under Georgia Bar Rules 7.1–7.5. Responsible attorney: ${escapeHtml(
        ctx.attorneyName || "—"
      )}${ctx.firmAddress ? `, ${escapeHtml(ctx.firmAddress)}` : ""}.</div>`
    : "";

  const ioltaFooter = ctx.ioltaDisclosure
    ? `<div class="iolta-notice">${escapeHtml(ctx.ioltaDisclosure)}</div>`
    : "";

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"/><title>Your Property Summary — ${escapeHtml(report.address.fullAddress)}</title>
<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
* { margin:0; padding:0; box-sizing:border-box; }
body { font-family:'Inter', -apple-system, sans-serif; color:#2D2A26; background:#fff; font-size:12px; line-height:1.55; padding:40px; }
.firm-header { display:flex; justify-content:space-between; align-items:flex-start; padding-bottom:20px; border-bottom:2px solid #2D2A26; margin-bottom:24px; }
/* Hero strip — Street View left, Static Map right */
.hero { display:grid; grid-template-columns:1fr 1fr; gap:12px; margin:0 0 28px 0; }
.hero-tile { position:relative; border:1px solid #E5E1D8; border-radius:6px; overflow:hidden; background:#FAF8F3; aspect-ratio:16/10; }
.hero-tile img { width:100%; height:100%; object-fit:cover; display:block; }
.hero-caption { position:absolute; left:0; right:0; bottom:0; padding:4px 8px; background:rgba(45,42,38,0.78); color:#fff; font-size:9px; letter-spacing:0.4px; text-transform:uppercase; }
.hero-placeholder { display:flex; align-items:center; justify-content:center; height:100%; color:#A09680; font-size:11px; padding:18px; text-align:center; }
.firm-name-fallback { font-size:22px; font-weight:700; color:#2D2A26; }
.firm-meta { text-align:right; font-size:10px; color:#666; line-height:1.4; }
.firm-meta strong { color:#2D2A26; font-size:11px; }
h1 { font-size:24px; font-weight:700; margin-bottom:6px; letter-spacing:-0.3px; }
.subtitle { color:#666; font-size:13px; margin-bottom:24px; }
.status-banner { padding:18px 22px; border-radius:8px; margin:28px 0; color:white; }
.status-banner h2 { font-size:18px; margin-bottom:6px; }
.status-banner p { font-size:12px; opacity:0.95; }
.section { margin:28px 0; page-break-inside:avoid; }
.section h3 { font-size:14px; font-weight:700; color:#2D2A26; margin-bottom:14px; padding-bottom:6px; border-bottom:1px solid #E5E1D8; }
.section h3 .count { float:right; font-size:11px; font-weight:500; color:#888; }
.fact-grid { display:grid; grid-template-columns:1fr 1fr; gap:14px 28px; font-size:12px; }
.fact-grid dt { color:#666; font-weight:500; }
.fact-grid dd { color:#2D2A26; font-weight:600; }
/* Timeline ━ ownership history with arrows */
.timeline { position:relative; margin-top:8px; padding-left:30px; }
.timeline::before { content:""; position:absolute; left:11px; top:8px; bottom:8px; width:2px; background:#D7CFBE; }
.tl-event { position:relative; padding:10px 0 12px 14px; }
.tl-event::before { content:""; position:absolute; left:-23px; top:14px; width:10px; height:10px; border-radius:50%; background:#2D2A26; border:2px solid #fff; box-shadow:0 0 0 2px #D7CFBE; }
.tl-event.first::before { background:#7D9B76; }
.tl-event.last::before { background:#A24E3C; }
.tl-date { font-size:10px; font-weight:600; color:#7D6E50; letter-spacing:0.5px; text-transform:uppercase; }
.tl-instr { display:inline-block; margin-left:8px; font-size:9px; font-weight:700; background:#2D2A26; color:#fff; padding:1px 6px; border-radius:3px; letter-spacing:0.5px; }
.tl-parties { font-size:12px; margin-top:3px; color:#2D2A26; font-weight:500; }
.tl-arrow { color:#A24E3C; margin:0 6px; font-weight:700; }
.tl-meta { font-size:10px; color:#888; margin-top:2px; font-family:'IBM Plex Mono', ui-monospace, monospace; }
.bullets { padding-left:18px; }
.bullets li { font-size:12px; margin-bottom:7px; color:#2D2A26; line-height:1.55; }
.bullets li strong { color:#2D2A26; }
.lien-row { display:grid; grid-template-columns:90px 1fr 80px 90px; gap:10px; padding:8px 10px; font-size:11px; background:#FAF8F3; border-radius:4px; margin-bottom:6px; align-items:baseline; }
.lien-row .lien-status { font-size:9px; font-weight:700; padding:2px 6px; border-radius:3px; text-transform:uppercase; letter-spacing:0.4px; text-align:center; }
.lien-active { background:#A24E3C; color:#fff; }
.lien-released { background:#7D9B76; color:#fff; }
.defect { padding:14px 16px; border-left:4px solid; background:#FAF8F3; margin-bottom:10px; border-radius:0 4px 4px 0; page-break-inside:avoid; }
.defect-title { font-weight:600; font-size:12px; margin-bottom:4px; }
.defect-severity { display:inline-block; font-size:9px; font-weight:700; text-transform:uppercase; letter-spacing:0.5px; padding:2px 8px; border-radius:10px; color:white; margin-bottom:6px; }
.defect-body { font-size:11px; color:#5a5a5a; line-height:1.5; }
.chain-summary { background:#FAF8F3; padding:16px; border-radius:6px; font-size:11px; }
.next-steps { background:#F5F0E5; padding:18px; border-radius:6px; }
.next-steps ol { padding-left:22px; }
.next-steps li { margin-bottom:8px; font-size:12px; line-height:1.55; }
.signoff { margin-top:32px; padding-top:20px; border-top:1px solid #E5E1D8; font-size:11px; color:#666; }
.signoff strong { color:#2D2A26; font-size:12px; }
.footer { margin-top:40px; padding-top:16px; border-top:1px solid #E5E1D8; font-size:9px; color:#999; line-height:1.5; }
.ga-bar-notice, .iolta-notice { margin-bottom:8px; font-style:italic; }
.disclaimer { margin-top:12px; }
</style></head>
<body>

<div class="firm-header">
  <div>${firmHeader}</div>
  <div class="firm-meta">
    ${ctx.firmName ? `<strong>${escapeHtml(ctx.firmName)}</strong><br/>` : ""}
    ${ctx.firmAddress ? `${escapeHtml(ctx.firmAddress)}<br/>` : ""}
    ${ctx.firmPhone ? `${escapeHtml(ctx.firmPhone)}<br/>` : ""}
    ${ctx.firmWebsite ? `${escapeHtml(ctx.firmWebsite)}` : ""}
  </div>
</div>

<h1>Your Property Summary</h1>
<div class="subtitle">${escapeHtml(report.address.fullAddress)} · ${today}</div>

${
  ctx.streetviewUrl || ctx.mapUrl
    ? `<div class="hero">
  <div class="hero-tile">
    ${
      ctx.streetviewUrl
        ? `<img src="${ctx.streetviewUrl}" alt="Front of property"/><div class="hero-caption">Street View · ${escapeHtml(report.address.street || report.address.fullAddress)}</div>`
        : `<div class="hero-placeholder">Street View imagery not available for this address</div>`
    }
  </div>
  <div class="hero-tile">
    ${
      ctx.mapUrl
        ? `<img src="${ctx.mapUrl}" alt="Parcel map"/><div class="hero-caption">Parcel ${escapeHtml(report.parcel?.parcelId || "")} · ${escapeHtml(report.parcel?.county || "")} Co.</div>`
        : `<div class="hero-placeholder">Parcel map unavailable</div>`
    }
  </div>
</div>`
    : ""
}

<div class="status-banner" style="background:${status.color}">
  <h2>${status.label}</h2>
  <p>${status.message}</p>
</div>

<div class="section">
  <h3>Property at a Glance</h3>
  <dl class="fact-grid">
    <dt>Address</dt><dd>${escapeHtml(report.address.fullAddress)}</dd>
    <dt>County</dt><dd>${escapeHtml(report.parcel?.county || "—")}</dd>
    <dt>Parcel ID</dt><dd>${escapeHtml(report.parcel?.parcelId || "—")}</dd>
    <dt>Records Examined</dt><dd>${chain.length} conveyance${chain.length === 1 ? "" : "s"} over ${report.chainOfTitle?.yearsSearched || 25} years</dd>
    <dt>Active Liens</dt><dd>${activeLiens.length}</dd>
    <dt>Issues Found</dt><dd>${defects.length}</dd>
  </dl>
</div>

${facts.length > 0 ? `<div class="section">
  <h3>Key Findings</h3>
  <ul class="bullets">
    ${facts.map((f) => `<li>${f}</li>`).join("")}
  </ul>
</div>` : ""}

${
  chain.length > 0
    ? `<div class="section">
  <h3>Ownership Timeline <span class="count">${chain.length} recent · ${chainDisplay.totalCount} total indexed</span></h3>
  <p style="font-size:10px;color:#888;margin-bottom:10px;">Most recent first · last ${CHAIN_DISPLAY_YEARS} years. Full chain in attorney title search PDF.</p>
  <div class="timeline">
    ${chain.map((e, i) => {
      const dateRaw = e.recordedDate || e.date;
      const grantor = e.grantor && e.grantor !== "Unknown" ? String(e.grantor) : "—";
      const grantee = e.grantee && e.grantee !== "Unknown" ? String(e.grantee) : "—";
      const instr = formatInstrumentLabel(e);
      const bookPage = String(e.bookPage || (e.book && e.page ? `${e.book}-${e.page}` : "—"));
      const consid = fmtMoney(e.consideration);
      const cls = i === 0 ? "first" : i === chain.length - 1 ? "last" : "";
      return `<div class="tl-event ${cls}">
        <span class="tl-date">${escapeHtml(fmtDate(dateRaw))}</span>
        <span class="tl-instr">${escapeHtml(instr)}</span>
        <div class="tl-parties">
          ${escapeHtml(grantor)} <span class="tl-arrow">&#8594;</span> ${escapeHtml(grantee)}
        </div>
        <div class="tl-meta">Book ${escapeHtml(bookPage)}${consid !== "—" ? ` &nbsp;&middot;&nbsp; ${consid}` : ""}</div>
      </div>`;
    }).join("")}
  </div>
  ${realBreaks.length > 0 ? `<p style="margin-top:14px;font-size:11px;color:#A24E3C;"><strong>${realBreaks.length} inconsistenc${realBreaks.length === 1 ? "y" : "ies"} to verify:</strong> chain rows where the grantee on one conveyance does not match the grantor on the next.</p>` : ""}
</div>`
    : ""
}

${activeLiens.length > 0 ? `<div class="section">
  <h3>Active Liens to Address <span class="count">${activeLiens.length} active</span></h3>
  ${activeLiens.map((l) => {
    const borrowerMatch = (l.notes || "").match(/Borrower:\s*([^\u00b7]+)/i);
    const borrower = borrowerMatch && borrowerMatch[1].trim().toLowerCase() !== "unknown" ? borrowerMatch[1].trim() : "—";
    const lender = l.creditor && l.creditor !== "(lender not in index)" ? l.creditor : "Pull deed image";
    return `<div class="lien-row">
      <div><span class="lien-status lien-active">Active</span></div>
      <div><strong>${escapeHtml(String(l.type || "lien").replace(/_/g, " "))}</strong> &middot; ${escapeHtml(lender)}<br/><span style="color:#888;font-size:10px;">Borrower: ${escapeHtml(borrower)}</span></div>
      <div style="font-family:'IBM Plex Mono',monospace;color:#666;">${escapeHtml(String(l.bookPage || "—"))}</div>
      <div style="text-align:right;color:#666;">${escapeHtml(fmtDate(l.recordedDate))}</div>
    </div>`;
  }).join("")}
</div>` : ""}

${releasedLiens.length > 0 ? `<div class="section">
  <h3>Released &amp; Cancelled Liens <span class="count">${releasedLiens.length} cleared</span></h3>
  ${releasedLiens.slice(0, 8).map((l) => `<div class="lien-row" style="background:#F5F0E5;">
    <div><span class="lien-status lien-released">Released</span></div>
    <div><strong>${escapeHtml(String(l.type || "lien").replace(/_/g, " "))}</strong></div>
    <div style="font-family:'IBM Plex Mono',monospace;color:#666;">${escapeHtml(String(l.bookPage || "—"))}</div>
    <div style="text-align:right;color:#666;">${escapeHtml(fmtDate(l.recordedDate))}</div>
  </div>`).join("")}
  ${releasedLiens.length > 8 ? `<p style="font-size:10px;color:#888;margin-top:6px;">+ ${releasedLiens.length - 8} additional released liens documented in the full title search report.</p>` : ""}
</div>` : ""}

${
  sortedDefects.length > 0
    ? `<div class="section">
  <h3>Issues to Be Aware Of</h3>
  ${sortedDefects.map(
    (d) => `<div class="defect" style="border-left-color:${severityColor(d.severity)}">
      <div class="defect-severity" style="background:${severityColor(d.severity)}">${severityLabel(d.severity)}</div>
      <div class="defect-title">${escapeHtml(d.title)}</div>
      <div class="defect-body">${escapeHtml(d.description)}<br/><br/><strong>What we recommend:</strong> ${escapeHtml(d.recommendation)}</div>
    </div>`
  ).join("")}
</div>`
    : `<div class="section">
  <h3>Issues to Be Aware Of</h3>
  <div class="chain-summary">No significant issues were identified in our examination.</div>
</div>`
}

<div class="section">
  <h3>What This Means for Your Closing</h3>
  <div class="next-steps">
    ${
      status.label === "CLEAR"
        ? `<p>Indexed records show no curative items flagged. Your attorney will verify deed images before we commit to a closing date.</p>`
        : status.label === "ITEMS TO VERIFY"
        ? `<ol>
            <li>Review the items above with us before the closing date.</li>
            <li>Each item has a recommended action — most can be resolved with a phone call or simple paperwork.</li>
            <li>We'll coordinate with the seller's attorney to clear anything that needs both sides involved.</li>
          </ol>`
        : `<ol>
            <li><strong>Please call us before doing anything else.</strong> Some of these items can take weeks to resolve and we want to set realistic expectations for your closing date.</li>
            <li>We may need to bring in additional support (e.g. title-insurance underwriter, bankruptcy counsel) depending on what we find.</li>
            <li>This is exactly why a thorough title search is done before closing — none of this is unusual to encounter, but each item needs proper handling.</li>
          </ol>`
    }
    ${ctx.customClosingMessage ? `<p style="margin-top:14px;">${escapeHtml(ctx.customClosingMessage)}</p>` : ""}
  </div>
</div>

<div class="signoff">
  Questions? Call us anytime.<br/><br/>
  <strong>${escapeHtml(ctx.attorneyName || ctx.firmName || "—")}${ctx.attorneyBarNumber ? `, Esq. (GA Bar #${escapeHtml(ctx.attorneyBarNumber)})` : ""}</strong><br/>
  ${ctx.attorneyDirectDial ? `Direct: ${escapeHtml(ctx.attorneyDirectDial)}<br/>` : ctx.firmPhone ? `Phone: ${escapeHtml(ctx.firmPhone)}<br/>` : ""}
  ${ctx.attorneyEmail ? `${escapeHtml(ctx.attorneyEmail)}<br/>` : ""}
  ${ctx.firmWebsite ? `${escapeHtml(ctx.firmWebsite)}` : ""}
</div>

<div class="footer">
  ${advertisingFooter}
  ${ioltaFooter}
  <div class="disclaimer">
    ${process.env.CLIROS_BETA_MODE === "true" ? `<strong>BETA PREVIEW:</strong> Cliros is in free beta — this summary is provided for feedback and must be reviewed by the responsible attorney before delivery to any client.<br/>` : ""}
    This summary is a plain-English overview prepared for your convenience. It is not a legal opinion or a substitute for the formal Title Search Report and Attorney Opinion Letter delivered to your lender. For the complete legal analysis, please refer to the Attorney Opinion of Title issued under separate cover.
  </div>
</div>

</body></html>`;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
