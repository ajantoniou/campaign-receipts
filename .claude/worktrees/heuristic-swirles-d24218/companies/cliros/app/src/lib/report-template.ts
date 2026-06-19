/* ─── Cliros Report HTML Template ─── */
/* Used for PDF generation via Puppeteer */

import type { TitleSearchReport } from "./types";
import { computeTitleMetrics } from "./title-metrics";
import { prepareChainForDisplay, formatInstrumentLabel, CHAIN_DISPLAY_YEARS } from "./chain-display";

export interface ReportTemplateImagery {
  streetviewUrl?: string;
  mapUrl?: string;
}

export function generateReportHTML(
  report: TitleSearchReport,
  imagery: ReportTemplateImagery = {}
): string {
  const metrics = computeTitleMetrics({
    riskScore: report.riskScore,
    liens: report.liens,
    defects: report.defects,
  });
  const riskLabel = metrics.marketabilityLabel.toUpperCase();
  const riskColor =
    metrics.tone === "clear" ? "#5B8C5A" : metrics.tone === "verify" ? "#C4956A" : "#C45B4A";
  const chainDisplay = prepareChainForDisplay(report.chainOfTitle?.entries || []);
  const chainRows = chainDisplay.visible;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Title Search Report — ${report.address.fullAddress}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');

    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: 'Inter', -apple-system, sans-serif;
      color: #2D2A26;
      background: #FFFFFF;
      font-size: 11px;
      line-height: 1.5;
      padding: 40px;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #4A6741;
      padding-bottom: 16px;
      margin-bottom: 24px;
    }

    .logo {
      font-size: 24px;
      font-weight: 800;
      color: #4A6741;
      letter-spacing: -0.5px;
    }

    .logo-dot {
      font-size: 12px;
      color: #7D9B76;
    }

    .report-meta {
      text-align: right;
      font-size: 10px;
      color: #8B8580;
    }

    .report-title {
      font-size: 18px;
      font-weight: 700;
      margin-bottom: 4px;
    }

    .address {
      font-size: 14px;
      color: #8B8580;
      margin-bottom: 16px;
    }

    .property-details {
      display: flex;
      gap: 24px;
      font-size: 10px;
      color: #8B8580;
      margin-bottom: 20px;
    }

    .property-details strong {
      color: #2D2A26;
    }

    .risk-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 11px;
      font-weight: 700;
      color: white;
      background: ${riskColor};
      margin-bottom: 16px;
    }

    .summary-box {
      background: #FAF8F5;
      border: 1px solid #E8E4DF;
      border-left: 3px solid #4A6741;
      padding: 12px 16px;
      margin-bottom: 24px;
      border-radius: 4px;
    }

    .summary-label {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #4A6741;
      margin-bottom: 4px;
    }

    .section {
      margin-bottom: 24px;
    }

    .section-title {
      font-size: 14px;
      font-weight: 700;
      color: #4A6741;
      border-bottom: 1px solid #E8E4DF;
      padding-bottom: 6px;
      margin-bottom: 12px;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 10px;
    }

    th {
      text-align: left;
      padding: 6px 8px;
      background: #FAF8F5;
      border: 1px solid #E8E4DF;
      font-weight: 600;
      font-size: 9px;
      text-transform: uppercase;
      letter-spacing: 0.3px;
      color: #8B8580;
    }

    td {
      padding: 6px 8px;
      border: 1px solid #E8E4DF;
      vertical-align: top;
    }

    tr:nth-child(even) td {
      background: #FDFCFB;
    }

    .status-active {
      color: #C4956A;
      font-weight: 600;
    }

    .status-released {
      color: #5B8C5A;
      font-weight: 600;
    }

    .defect-severity {
      display: inline-block;
      padding: 1px 6px;
      border-radius: 3px;
      font-size: 9px;
      font-weight: 700;
      text-transform: uppercase;
    }

    .severity-critical { background: #C45B4A20; color: #C45B4A; }
    .severity-major { background: #C4956A20; color: #C4956A; }
    .severity-minor { background: #6B8CAE20; color: #6B8CAE; }
    .severity-info { background: #8B858020; color: #8B8580; }

    .disclaimer {
      margin-top: 32px;
      padding-top: 16px;
      border-top: 1px solid #E8E4DF;
      font-size: 8px;
      color: #8B8580;
      line-height: 1.4;
    }

    .footer {
      margin-top: 16px;
      text-align: center;
      font-size: 8px;
      color: #8B8580;
    }

    @media print {
      body { padding: 20px; }
      .section { page-break-inside: avoid; }
    }
  </style>
</head>
<body>

  <div class="header">
    <div>
      <div class="logo">Cliros<span class="logo-dot">.ai</span></div>
      <div style="font-size: 10px; color: #8B8580; margin-top: 2px;">Title Intelligence</div>
    </div>
    <div class="report-meta">
      <div>Report ID: ${report.id}</div>
      <div>Generated: ${new Date(report.completedAt || report.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</div>
    </div>
  </div>

  <div class="report-title">Title Search Report</div>
  <div class="address">${report.address.fullAddress}</div>

  ${
    imagery.streetviewUrl || imagery.mapUrl
      ? `<div class="hero-strip" style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:12px 0 18px 0;">
    ${
      imagery.streetviewUrl
        ? `<div style="position:relative;border:1px solid #E8E4DF;border-radius:4px;overflow:hidden;aspect-ratio:16/10;">
            <img src="${imagery.streetviewUrl}" alt="Front of property" style="width:100%;height:100%;object-fit:cover;display:block;"/>
            <div style="position:absolute;left:0;right:0;bottom:0;padding:3px 8px;background:rgba(45,42,38,0.78);color:#fff;font-size:8px;letter-spacing:0.4px;text-transform:uppercase;">Street View</div>
          </div>`
        : ""
    }
    ${
      imagery.mapUrl
        ? `<div style="position:relative;border:1px solid #E8E4DF;border-radius:4px;overflow:hidden;aspect-ratio:16/10;">
            <img src="${imagery.mapUrl}" alt="Parcel map" style="width:100%;height:100%;object-fit:cover;display:block;"/>
            <div style="position:absolute;left:0;right:0;bottom:0;padding:3px 8px;background:rgba(45,42,38,0.78);color:#fff;font-size:8px;letter-spacing:0.4px;text-transform:uppercase;">Parcel · ${report.parcel.parcelId}</div>
          </div>`
        : ""
    }
  </div>`
      : ""
  }

  <div class="property-details">
    <span>Parcel: <strong>${report.parcel.parcelId}</strong></span>
    <span>County: <strong>${report.parcel.county}</strong></span>
    <span>State: <strong>${report.parcel.state}</strong></span>
    <span>Type: <strong>${report.parcel.propertyType || "N/A"}</strong></span>
    ${report.parcel.assessedValue ? `<span>Assessed: <strong>$${report.parcel.assessedValue.toLocaleString()}</strong></span>` : ""}
  </div>

  <div class="risk-badge">${riskLabel}</div>
  <p style="font-size:10px;color:#666;margin-top:6px;">Indexed-record checklist — not a title opinion. Attorney verifies deed images before closing.</p>

  <div class="summary-box">
    <div class="summary-label">AI Summary</div>
    <div>${report.summary}</div>
  </div>

  <!-- Chain of Title -->
  <div class="section">
    <div class="section-title">Chain of Title — last ${CHAIN_DISPLAY_YEARS} years (most recent first)</div>
    <p style="font-size:9px;color:#666;margin-bottom:8px;">Full indexed history (${chainDisplay.totalCount} conveyances) available in source schedule appendix.</p>
    <table>
      <thead>
        <tr>
          <th>Date</th>
          <th>Type</th>
          <th>Grantor</th>
          <th>Grantee</th>
          <th>Consideration</th>
          <th>Book/Page</th>
          <th>Instrument #</th>
        </tr>
      </thead>
      <tbody>
        ${chainRows
          .map(
            (d) => `
          <tr>
            <td>${new Date(d.recordedDate || d.date || "").toLocaleDateString()}</td>
            <td>${formatInstrumentLabel(d)}</td>
            <td>${d.grantor && d.grantor !== "Unknown" ? d.grantor : "—"}</td>
            <td>${d.grantee && d.grantee !== "Unknown" ? d.grantee : "—"}</td>
            <td>${d.consideration ? "$" + d.consideration.toLocaleString() : "—"}</td>
            <td>${d.bookPage || "—"}</td>
            <td>${(d as { instrumentNumber?: string }).instrumentNumber || "—"}</td>
          </tr>`
          )
          .join("")}
      </tbody>
    </table>
    ${report.chainOfTitle.breaks.length === 0 ? '<div style="margin-top: 8px; color: #5B8C5A; font-weight: 600; font-size: 10px;">✓ No breaks in chain of title</div>' : ""}
  </div>

  <!-- Liens -->
  <div class="section">
    <div class="section-title">Liens & Encumbrances</div>
    <table>
      <thead>
        <tr>
          <th>Type</th>
          <th>Status</th>
          <th>Creditor</th>
          <th>Amount</th>
          <th>Recorded</th>
          <th>Released</th>
          <th>Book/Page</th>
        </tr>
      </thead>
      <tbody>
        ${report.liens
          .map(
            (l) => `
          <tr>
            <td>${l.type}</td>
            <td class="status-${l.status}">${l.status.toUpperCase()}</td>
            <td>${l.creditor}</td>
            <td>${l.amount ? "$" + l.amount.toLocaleString() : "—"}</td>
            <td>${new Date(l.recordedDate).toLocaleDateString()}</td>
            <td>${l.releasedDate ? new Date(l.releasedDate).toLocaleDateString() : "—"}</td>
            <td>${l.bookPage || "—"}</td>
          </tr>`
          )
          .join("")}
      </tbody>
    </table>
  </div>

  <!-- Defects -->
  <div class="section">
    <div class="section-title">Title Defects & Observations</div>
    ${
      report.defects.length === 0
        ? '<div style="color: #5B8C5A; font-weight: 600;">✓ No title defects found. Property appears to have clear and marketable title.</div>'
        : `<table>
      <thead>
        <tr>
          <th>Severity</th>
          <th>Category</th>
          <th>Description</th>
          <th>Recommendation</th>
        </tr>
      </thead>
      <tbody>
        ${report.defects
          .map(
            (d) => `
          <tr>
            <td><span class="defect-severity severity-${d.severity}">${d.severity}</span></td>
            <td>${d.category}</td>
            <td>${d.description}</td>
            <td>${d.recommendation}</td>
          </tr>`
          )
          .join("")}
      </tbody>
    </table>`
    }
  </div>

  <!-- Easements -->
  ${
    report.easements.length > 0
      ? `
  <div class="section">
    <div class="section-title">Easements</div>
    <table>
      <thead>
        <tr>
          <th>Type</th>
          <th>Description</th>
          <th>Recorded</th>
          <th>Book/Page</th>
        </tr>
      </thead>
      <tbody>
        ${report.easements
          .map(
            (e) => `
          <tr>
            <td>${e.type}</td>
            <td>${e.description}</td>
            <td>${e.recordedDate ? new Date(e.recordedDate).toLocaleDateString() : "—"}</td>
            <td>${e.bookPage || "—"}</td>
          </tr>`
          )
          .join("")}
      </tbody>
    </table>
  </div>`
      : ""
  }

  <div class="disclaimer">
    ${process.env.CLIROS_BETA_MODE === "true" ? `<strong style="color:#92400E;">BETA PREVIEW:</strong> Cliros is in free beta. This report is provided for feedback purposes and must not be relied on without independent verification.<br/>` : ""}
    <strong>DISCLAIMER:</strong> This report is generated using AI-assisted technology for informational purposes only.
    It does not constitute a title opinion, title insurance commitment, or legal advice. The reviewing attorney is solely
    responsible for verifying all findings and exercising independent professional judgment before issuing an Attorney
    Opinion Letter or any other legal instrument. Cliros is not a title insurance company, title agent, or law firm.
    Use of this report is subject to our Terms of Service at cliros.ai/terms.
  </div>

  <div class="footer">
    Cliros.ai — Title Intelligence in Minutes, Not Days${process.env.CLIROS_BETA_MODE === "true" ? " · Beta Preview" : ""}
  </div>

</body>
</html>`;
}
