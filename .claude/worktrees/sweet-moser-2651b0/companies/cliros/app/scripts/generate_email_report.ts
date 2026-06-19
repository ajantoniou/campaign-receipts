#!/usr/bin/env npx tsx
/* Generate an HTML email report from a Cliros search result JSON file.
   Usage: npx tsx scripts/generate_email_report.ts /tmp/cliros_search_result_xxx.json
*/

import * as fs from "fs";
import { computeTitleMetrics } from "../src/lib/title-metrics";

const inputPath = process.argv[2];
if (!inputPath) {
  console.error("Usage: npx tsx scripts/generate_email_report.ts <report.json>");
  process.exit(1);
}

const report = JSON.parse(fs.readFileSync(inputPath, "utf-8"));

function toneColor(tone: "clear" | "verify" | "curative"): string {
  if (tone === "clear") return "#10B981";
  if (tone === "verify") return "#F59E0B";
  return "#EF4444";
}

function escapeHtml(s: string): string {
  return (s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

const addr = report.address?.fullAddress || "Unknown Address";
const risk = report.riskScore ?? 0;
const deeds = report.chainOfTitle?.entries || [];
const liens = report.liens || [];
const defects = report.defects || [];
const metrics = computeTitleMetrics({ riskScore: risk, liens, defects });
const tone = metrics.tone;
const marketColor = toneColor(tone);
const summary = report.summary || "";
const owner = report.propertyDetails?.owner || "N/A";
const sources = report.dataSources || {};
const errors = report.errors || [];
const createdAt = report.createdAt ? new Date(report.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "N/A";

const deedRows = deeds.slice(0, 25).map((d: Record<string, string>) => `
  <tr>
    <td style="padding:6px 10px;border-bottom:1px solid #E5E7EB;font-size:13px;">${escapeHtml(d.recordedDate || "")}</td>
    <td style="padding:6px 10px;border-bottom:1px solid #E5E7EB;font-size:13px;">${escapeHtml(d.grantor || "Unknown")}</td>
    <td style="padding:6px 10px;border-bottom:1px solid #E5E7EB;font-size:13px;">${escapeHtml(d.grantee || "Unknown")}</td>
    <td style="padding:6px 10px;border-bottom:1px solid #E5E7EB;font-size:13px;">${escapeHtml(d.bookPage || "")}</td>
    <td style="padding:6px 10px;border-bottom:1px solid #E5E7EB;font-size:13px;">${escapeHtml(d.instrumentType || d.type || "Deed")}</td>
  </tr>`).join("");

const lienRows = liens.slice(0, 25).map((l: Record<string, string>) => `
  <tr>
    <td style="padding:6px 10px;border-bottom:1px solid #E5E7EB;font-size:13px;">${escapeHtml(l.recordedDate || l.filingDate || "")}</td>
    <td style="padding:6px 10px;border-bottom:1px solid #E5E7EB;font-size:13px;">${escapeHtml(l.type || "Lien")}</td>
    <td style="padding:6px 10px;border-bottom:1px solid #E5E7EB;font-size:13px;">${escapeHtml(l.debtor || l.against || "Unknown")}</td>
    <td style="padding:6px 10px;border-bottom:1px solid #E5E7EB;font-size:13px;">${escapeHtml(l.creditor || l.holder || "")}</td>
    <td style="padding:6px 10px;border-bottom:1px solid #E5E7EB;font-size:13px;">${l.amount ? `$${Number(l.amount).toLocaleString()}` : "N/A"}</td>
  </tr>`).join("");

const defectRows = defects.length > 0 ? defects.map((d: Record<string, string>) => `
  <tr>
    <td style="padding:6px 10px;border-bottom:1px solid #E5E7EB;font-size:13px;">${escapeHtml(d.type || d.category || "")}</td>
    <td style="padding:6px 10px;border-bottom:1px solid #E5E7EB;font-size:13px;color:${d.severity === "critical" ? "#EF4444" : d.severity === "major" ? "#F59E0B" : "#6B7280"};font-weight:600;">${escapeHtml((d.severity || "").toUpperCase())}</td>
    <td style="padding:6px 10px;border-bottom:1px solid #E5E7EB;font-size:13px;">${escapeHtml(d.description || "")}</td>
  </tr>`).join("") : `<tr><td colspan="3" style="padding:12px;text-align:center;color:#6B7280;">No title defects identified</td></tr>`;

const sourcesList = Object.entries(sources)
  .filter(([, v]) => v)
  .map(([k]) => {
    const labels: Record<string, string> = {
      propmix: "PropMix Property Records",
      gsccca: "GSCCCA (Georgia Superior Court Clerks)",
      courtlistener: "CourtListener (Federal Courts)",
      pacer: "PACER (Federal Courts)",
      claudeAnalysis: "Claude AI Analysis",
    };
    return labels[k] || k;
  })
  .map((s) => `<li style="margin:4px 0;font-size:14px;">&#x2713; ${s}</li>`)
  .join("");

const html = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width"></head>
<body style="margin:0;padding:0;background:#F3F4F6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<div style="max-width:720px;margin:0 auto;background:#FFFFFF;">

  <!-- Header -->
  <div style="background:linear-gradient(135deg,#0F172A 0%,#1E293B 100%);padding:32px 40px;text-align:center;">
    <img src="https://cliros.onrender.com/logo-white.svg" alt="Cliros" width="160" height="36" style="display:inline-block;margin-bottom:8px;" />
    <p style="margin:8px 0 0;color:#94A3B8;font-size:14px;">AI-Powered Title Search Report</p>
  </div>

  <!-- Property Summary -->
  <div style="padding:32px 40px;border-bottom:1px solid #E5E7EB;">
    <h2 style="margin:0 0 8px;color:#0F172A;font-size:20px;">${escapeHtml(addr)}</h2>
    <p style="margin:0;color:#6B7280;font-size:14px;">Report generated ${createdAt} &bull; Owner: ${escapeHtml(owner)}</p>
  </div>

  <!-- Marketability -->
  <div style="padding:24px 40px;border-bottom:1px solid #E5E7EB;">
    <p style="margin:0;display:inline-block;padding:6px 14px;border-radius:999px;background:${marketColor};color:#FFFFFF;font-size:14px;font-weight:600;">${escapeHtml(metrics.marketabilityLabel)}</p>
    <p style="margin:8px 0 0;color:#374151;font-size:13px;">${escapeHtml(metrics.marketabilityDetail)}</p>
    <p style="margin:4px 0 0;color:#6B7280;font-size:13px;">${deeds.length} deeds &bull; ${liens.length} liens &bull; ${metrics.curativeItemCount} checklist item${metrics.curativeItemCount === 1 ? "" : "s"}</p>
    <p style="margin:8px 0 0;color:#9CA3AF;font-size:11px;font-style:italic;">Marketability label reflects checklist items derived from indexed records; not a numeric title opinion.</p>
  </div>

  <!-- AI Summary -->
  <div style="padding:24px 40px;border-bottom:1px solid #E5E7EB;">
    <h3 style="margin:0 0 12px;color:#0F172A;font-size:16px;">AI Analysis Summary</h3>
    <div style="background:#F8FAFC;border-left:4px solid #3B82F6;padding:16px;border-radius:4px;">
      <p style="margin:0;color:#374151;font-size:14px;line-height:1.6;white-space:pre-wrap;">${escapeHtml(summary)}</p>
    </div>
  </div>

  <!-- Chain of Title -->
  <div style="padding:24px 40px;border-bottom:1px solid #E5E7EB;">
    <h3 style="margin:0 0 12px;color:#0F172A;font-size:16px;">Chain of Title (${deeds.length} records${deeds.length > 25 ? ", showing first 25" : ""})</h3>
    <table style="width:100%;border-collapse:collapse;border:1px solid #E5E7EB;">
      <thead>
        <tr style="background:#F8FAFC;">
          <th style="padding:8px 10px;text-align:left;font-size:12px;color:#6B7280;border-bottom:2px solid #E5E7EB;">Date</th>
          <th style="padding:8px 10px;text-align:left;font-size:12px;color:#6B7280;border-bottom:2px solid #E5E7EB;">Grantor</th>
          <th style="padding:8px 10px;text-align:left;font-size:12px;color:#6B7280;border-bottom:2px solid #E5E7EB;">Grantee</th>
          <th style="padding:8px 10px;text-align:left;font-size:12px;color:#6B7280;border-bottom:2px solid #E5E7EB;">Book/Page</th>
          <th style="padding:8px 10px;text-align:left;font-size:12px;color:#6B7280;border-bottom:2px solid #E5E7EB;">Type</th>
        </tr>
      </thead>
      <tbody>${deedRows || '<tr><td colspan="5" style="padding:12px;text-align:center;color:#6B7280;">No deeds found</td></tr>'}</tbody>
    </table>
  </div>

  <!-- Liens -->
  <div style="padding:24px 40px;border-bottom:1px solid #E5E7EB;">
    <h3 style="margin:0 0 12px;color:#0F172A;font-size:16px;">Liens & Encumbrances (${liens.length} records${liens.length > 25 ? ", showing first 25" : ""})</h3>
    <table style="width:100%;border-collapse:collapse;border:1px solid #E5E7EB;">
      <thead>
        <tr style="background:#F8FAFC;">
          <th style="padding:8px 10px;text-align:left;font-size:12px;color:#6B7280;border-bottom:2px solid #E5E7EB;">Date</th>
          <th style="padding:8px 10px;text-align:left;font-size:12px;color:#6B7280;border-bottom:2px solid #E5E7EB;">Type</th>
          <th style="padding:8px 10px;text-align:left;font-size:12px;color:#6B7280;border-bottom:2px solid #E5E7EB;">Debtor</th>
          <th style="padding:8px 10px;text-align:left;font-size:12px;color:#6B7280;border-bottom:2px solid #E5E7EB;">Creditor</th>
          <th style="padding:8px 10px;text-align:left;font-size:12px;color:#6B7280;border-bottom:2px solid #E5E7EB;">Amount</th>
        </tr>
      </thead>
      <tbody>${lienRows || '<tr><td colspan="5" style="padding:12px;text-align:center;color:#6B7280;">No liens found</td></tr>'}</tbody>
    </table>
  </div>

  <!-- Defects -->
  <div style="padding:24px 40px;border-bottom:1px solid #E5E7EB;">
    <h3 style="margin:0 0 12px;color:#0F172A;font-size:16px;">Title Defects (${defects.length})</h3>
    <table style="width:100%;border-collapse:collapse;border:1px solid #E5E7EB;">
      <thead>
        <tr style="background:#F8FAFC;">
          <th style="padding:8px 10px;text-align:left;font-size:12px;color:#6B7280;border-bottom:2px solid #E5E7EB;">Type</th>
          <th style="padding:8px 10px;text-align:left;font-size:12px;color:#6B7280;border-bottom:2px solid #E5E7EB;">Severity</th>
          <th style="padding:8px 10px;text-align:left;font-size:12px;color:#6B7280;border-bottom:2px solid #E5E7EB;">Description</th>
        </tr>
      </thead>
      <tbody>${defectRows}</tbody>
    </table>
  </div>

  <!-- Data Sources -->
  <div style="padding:24px 40px;border-bottom:1px solid #E5E7EB;">
    <h3 style="margin:0 0 12px;color:#0F172A;font-size:16px;">Data Sources</h3>
    <ul style="margin:0;padding:0 0 0 20px;color:#374151;">${sourcesList}</ul>
    ${errors.length > 0 ? `<p style="margin:12px 0 0;color:#EF4444;font-size:13px;">Errors: ${escapeHtml(errors.join("; "))}</p>` : ""}
  </div>

  <!-- Footer -->
  <div style="padding:24px 40px;background:#F8FAFC;text-align:center;">
    <p style="margin:0;color:#6B7280;font-size:12px;">This report is for informational purposes only and does not constitute legal advice.</p>
    <p style="margin:8px 0 0;color:#6B7280;font-size:12px;">Cliros &mdash; AI-Powered Title Search for Georgia Attorneys</p>
    <p style="margin:4px 0 0;color:#94A3B8;font-size:11px;">Report ID: ${report.id || "N/A"}</p>
  </div>

</div>
</body>
</html>`;

const outPath = inputPath.replace(".json", "_email.html");
fs.writeFileSync(outPath, html);
console.log(`HTML email report saved to: ${outPath}`);
console.log(`Size: ${(html.length / 1024).toFixed(1)} KB`);
