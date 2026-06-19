/* ─── PDF Report Generation ───
   GET /api/reports/[id]/pdf
   Returns: HTML page styled for print-to-PDF (browser prints as PDF)

   In future: integrate with headless browser or PDF library for
   server-side PDF generation. For now, returns print-optimized HTML.
*/

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getUserFromRequest, authRequiredResponse } from "@/lib/api-auth";
import { computeTitleMetrics } from "@/lib/title-metrics";

export const maxDuration = 120;
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const user = await getUserFromRequest(request);
  if (!user) return authRequiredResponse(request);
  const userId = user.id;

  const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { db: { schema: "cliros" }, auth: { persistSession: false } }
  );

  // Prefer vault PDF; auto-generate on-demand if missing (web service has chromium).
  try {
    const { ensureGeneratedPdf } = await import("@/lib/pipeline/render-pdfs");
    const { data: owned } = await db
      .from("search_reports")
      .select("id")
      .eq("id", id)
      .eq("user_id", userId)
      .maybeSingle();
    if (!owned) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }
    const signedUrl = await ensureGeneratedPdf(id, userId, "title");
    return NextResponse.redirect(signedUrl);
  } catch (err) {
    // Fall through to print-friendly HTML if Chromium really isn't available.
    console.warn(`[pdf] on-demand generate failed (${id}); serving HTML print view:`, err);
  }

  const { data: report, error } = await db
    .from("search_reports")
    .select("*, properties(full_address, county, state, parcel_id, property_type, assessed_value, legal_description)")
    .eq("id", id)
    .eq("user_id", userId)
    .single();

  if (error || !report) {
    return NextResponse.json({ error: "Report not found" }, { status: 404 });
  }

  const prop = report.properties;
  const deeds = report.chain_of_title || [];
  const liens = report.liens || [];
  const defects = report.defects || [];

  // Generate print-friendly HTML
  const html = generateReportHTML({
    address: prop?.full_address || "Unknown",
    county: prop?.county || "",
    state: prop?.state || "",
    parcelId: prop?.parcel_id || "",
    propertyType: prop?.property_type || "",
    assessedValue: prop?.assessed_value,
    summary: report.summary || "",
    riskScore: report.risk_score || 0,
    deeds,
    liens,
    defects,
    completedAt: report.completed_at || report.created_at,
  });

  return new NextResponse(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Content-Disposition": `inline; filename="Cliros-Report-${id.slice(0, 8)}.html"`,
    },
  });
}

interface ReportHTMLParams {
  address: string;
  county: string;
  state: string;
  parcelId: string;
  propertyType: string;
  assessedValue: number | null;
  summary: string;
  riskScore: number;
  deeds: { grantor: string; grantee: string; recordedDate: string; type: string; consideration?: number; bookPage?: string; instrumentNumber?: string }[];
  liens: { type: string; status: string; creditor: string; amount?: number; recordedDate: string; releasedDate?: string; bookPage?: string }[];
  defects: { severity: string; title: string; description: string; recommendation: string }[];
  completedAt: string;
}

function generateReportHTML(p: ReportHTMLParams): string {
  const metrics = computeTitleMetrics({
    riskScore: p.riskScore,
    liens: p.liens,
    defects: p.defects,
  });
  const marketabilityLabel = metrics.marketabilityLabel;
  const marketabilityDetail = metrics.marketabilityDetail;
  const badgeColor =
    metrics.tone === "clear"
      ? "#16a34a"
      : metrics.tone === "verify"
        ? "#d97706"
        : "#dc2626";

  const deedRows = p.deeds.map((d) => `
    <tr>
      <td>${new Date(d.recordedDate).toLocaleDateString()}</td>
      <td>${d.type.replace("_", " ")}</td>
      <td>${d.grantor}</td>
      <td>${d.grantee}</td>
      <td>${d.consideration ? "$" + d.consideration.toLocaleString() : "—"}</td>
      <td>${d.bookPage || "—"}</td>
    </tr>
  `).join("");

  const lienRows = p.liens.map((l) => `
    <tr>
      <td><span class="status-${l.status}">${l.status.toUpperCase()}</span></td>
      <td>${l.type}</td>
      <td>${l.creditor}</td>
      <td>${l.amount ? "$" + l.amount.toLocaleString() : "—"}</td>
      <td>${new Date(l.recordedDate).toLocaleDateString()}</td>
      <td>${l.releasedDate ? new Date(l.releasedDate).toLocaleDateString() : "—"}</td>
    </tr>
  `).join("");

  const defectItems = p.defects.map((d) => `
    <div class="defect">
      <span class="severity severity-${d.severity}">${d.severity.toUpperCase()}</span>
      <strong>${d.title}</strong>
      <p>${d.description}</p>
      <p class="recommendation">Recommendation: ${d.recommendation}</p>
    </div>
  `).join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Title Search Report — ${p.address}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 11pt; line-height: 1.5; color: #1a1a1a; padding: 40px; max-width: 850px; margin: 0 auto; }
    @media print {
      body { padding: 20px; }
      .no-print { display: none; }
      table { page-break-inside: auto; }
      tr { page-break-inside: avoid; }
    }
    .header { border-bottom: 3px solid #1e3a5f; padding-bottom: 20px; margin-bottom: 30px; }
    .logo { font-size: 24pt; font-weight: 800; color: #1e3a5f; letter-spacing: -0.5px; }
    .logo span { color: #3b82f6; }
    .subtitle { color: #666; font-size: 9pt; margin-top: 2px; }
    .report-title { font-size: 18pt; font-weight: 700; margin-top: 20px; }
    .address { font-size: 14pt; color: #444; margin-top: 4px; }
    .meta { display: flex; gap: 20px; margin-top: 10px; font-size: 9pt; color: #666; }
    .risk-badge { display: inline-block; padding: 4px 12px; border-radius: 4px; font-weight: 700; font-size: 10pt; color: white; background: ${badgeColor}; margin-top: 10px; }
    .marketability-detail { margin-top: 6px; font-size: 9pt; color: #555; max-width: 640px; }
    .section { margin-top: 30px; }
    .section h2 { font-size: 14pt; font-weight: 700; border-bottom: 1px solid #e5e5e5; padding-bottom: 6px; margin-bottom: 12px; }
    .summary-box { background: #f8f9fa; border: 1px solid #e5e5e5; border-radius: 6px; padding: 16px; font-size: 10pt; }
    table { width: 100%; border-collapse: collapse; font-size: 9pt; margin-top: 8px; }
    th { background: #f1f5f9; text-align: left; padding: 8px 6px; font-weight: 600; border-bottom: 2px solid #e2e8f0; }
    td { padding: 6px; border-bottom: 1px solid #f1f5f9; vertical-align: top; }
    .status-active { background: #fef3c7; color: #92400e; padding: 2px 6px; border-radius: 3px; font-size: 8pt; font-weight: 600; }
    .status-released { background: #d1fae5; color: #065f46; padding: 2px 6px; border-radius: 3px; font-size: 8pt; font-weight: 600; }
    .defect { background: #f8f9fa; border: 1px solid #e5e5e5; border-radius: 6px; padding: 12px; margin-bottom: 10px; }
    .defect strong { font-size: 10pt; }
    .defect p { font-size: 9pt; color: #444; margin-top: 4px; }
    .recommendation { color: #1e3a5f; font-weight: 500; }
    .severity { display: inline-block; padding: 2px 6px; border-radius: 3px; font-size: 8pt; font-weight: 600; margin-right: 8px; }
    .severity-critical { background: #fee2e2; color: #991b1b; }
    .severity-major { background: #fef3c7; color: #92400e; }
    .severity-minor { background: #dbeafe; color: #1e40af; }
    .severity-info { background: #f1f5f9; color: #475569; }
    .disclaimer { margin-top: 40px; padding: 16px; border: 1px solid #fbbf24; border-radius: 6px; background: #fffbeb; font-size: 8pt; color: #78350f; }
    .footer { margin-top: 30px; text-align: center; font-size: 8pt; color: #999; border-top: 1px solid #e5e5e5; padding-top: 15px; }
    .print-btn { position: fixed; top: 20px; right: 20px; background: #1e3a5f; color: white; border: none; padding: 10px 20px; border-radius: 6px; font-size: 10pt; cursor: pointer; font-weight: 600; }
    .print-btn:hover { background: #2d4a6f; }
  </style>
</head>
<body>
  <button class="print-btn no-print" onclick="window.print()">Print / Save as PDF</button>

  <div class="header">
    <div class="logo">Cliros<span>.ai</span></div>
    <div class="subtitle">AI-Powered Title Search Platform</div>
    <div class="report-title">Title Search Report</div>
    <div class="address">${p.address}</div>
    <div class="meta">
      ${p.parcelId ? `<span>Parcel: ${p.parcelId}</span>` : ""}
      ${p.county ? `<span>County: ${p.county}</span>` : ""}
      ${p.state ? `<span>State: ${p.state}</span>` : ""}
      ${p.propertyType ? `<span>Type: ${p.propertyType}</span>` : ""}
      <span>Generated: ${new Date(p.completedAt).toLocaleDateString()}</span>
    </div>
    <div class="risk-badge">${marketabilityLabel}</div>
    <div class="marketability-detail">${marketabilityDetail} <em>Marketability label reflects checklist items, not a numeric title opinion.</em></div>
  </div>

  <div class="section">
    <h2>AI Analysis Summary</h2>
    <div class="summary-box">${p.summary}</div>
  </div>

  ${p.deeds.length > 0 ? `
  <div class="section">
    <h2>Chain of Title</h2>
    <table>
      <thead>
        <tr><th>Date</th><th>Type</th><th>Grantor</th><th>Grantee</th><th>Consideration</th><th>Book/Page</th></tr>
      </thead>
      <tbody>${deedRows}</tbody>
    </table>
  </div>
  ` : ""}

  ${p.liens.length > 0 ? `
  <div class="section">
    <h2>Liens & Encumbrances</h2>
    <table>
      <thead>
        <tr><th>Status</th><th>Type</th><th>Creditor</th><th>Amount</th><th>Recorded</th><th>Released</th></tr>
      </thead>
      <tbody>${lienRows}</tbody>
    </table>
  </div>
  ` : ""}

  <div class="section">
    <h2>Title Defects & Issues</h2>
    ${p.defects.length === 0
      ? `<div class="summary-box" style="color: #16a34a; border-color: #bbf7d0;">No title defects found. Property appears to have clear and marketable title.</div>`
      : defectItems}
  </div>

  <div class="disclaimer">
    <strong>Disclaimer:</strong> This report is generated by AI for attorney review purposes only. It does not constitute legal advice or a legal opinion. The reviewing attorney is responsible for verifying all findings and exercising professional judgment before issuing an Attorney Opinion Letter (AOL). Cliros is not a title insurance company and does not provide title insurance. All data sourced from GSCCCA (Georgia Superior Court Clerks' Cooperative Authority), Georgia Superior Courts, and federal court records via CourtListener/PACER.
  </div>

  <div class="footer">
    Cliros.ai — AI-Powered Title Search for Real Estate Attorneys<br>
    Report ID: ${p.parcelId || "N/A"} · Generated ${new Date(p.completedAt).toLocaleString()}
  </div>
</body>
</html>`;
}
