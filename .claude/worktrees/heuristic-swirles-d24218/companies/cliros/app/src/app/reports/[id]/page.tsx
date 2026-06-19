"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import type { TitleDefect, DeedRecord, LienRecord, DefectSeverity } from "@/lib/types";
import { computeTitleMetrics, marketabilityBadgeClass } from "@/lib/title-metrics";

/* ─── Icons ─── */
function ShieldCheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
    </svg>
  );
}

function ExclamationIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
    </svg>
  );
}

/* ─── Badges ─── */
function MarketabilityBadge({
  riskScore,
  liens,
  defects,
}: {
  riskScore: number;
  liens: LienRecord[];
  defects: TitleDefect[];
}) {
  const m = computeTitleMetrics({ riskScore, liens, defects });
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold border ${marketabilityBadgeClass(m.tone)}`}>
      {m.tone === "clear" ? <ShieldCheckIcon className="w-4 h-4" /> : <ExclamationIcon className="w-4 h-4" />}
      {m.marketabilityLabel}
    </span>
  );
}

function SeverityBadge({ severity }: { severity: DefectSeverity }) {
  const colors = {
    critical: "bg-danger/10 text-danger border-danger/20",
    major: "bg-accent/10 text-accent border-accent/20",
    minor: "bg-info/10 text-info border-info/20",
    info: "bg-muted/10 text-muted border-border",
  };
  return (
    <span className={`inline-flex px-2 py-0.5 rounded text-xs font-semibold border ${colors[severity]}`}>
      {severity.toUpperCase()}
    </span>
  );
}

/* ─── Report Data Shape ─── */
interface ReportData {
  id: string;
  status: string;
  summary: string | null;
  risk_score: number | null;
  tier: string;
  chain_of_title: DeedRecord[] | null;
  chain_breaks: { description: string; startDate: string; endDate: string }[] | null;
  years_searched: number | null;
  search_start_date: string | null;
  search_end_date: string | null;
  liens: LienRecord[] | null;
  easements: { id: string; type: string; description: string; recordedDate: string; bookPage?: string }[] | null;
  defects: TitleDefect[] | null;
  created_at: string;
  completed_at: string | null;
  properties: {
    full_address: string;
    county: string | null;
    state: string;
    parcel_id: string | null;
    property_type: string | null;
    assessed_value: number | null;
  } | null;
}

export default function ReportDetailPage() {
  const params = useParams();
  const reportId = params.id as string;
  const [report, setReport] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadReport() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        window.location.href = "/login";
        return;
      }

      const { data, error: fetchErr } = await supabase
        .from("search_reports")
        .select("*, properties(full_address, county, state, parcel_id, property_type, assessed_value)")
        .eq("id", reportId)
        .eq("user_id", session.user.id)
        .single();

      if (fetchErr || !data) {
        setError("Report not found or access denied.");
      } else {
        setReport(data as unknown as ReportData);
      }
      setLoading(false);
    }
    loadReport();
  }, [reportId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted">Loading report...</div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <ExclamationIcon className="w-12 h-12 text-danger mx-auto" />
            <h1 className="mt-4 text-xl font-bold text-foreground">{error}</h1>
            <a href="/dashboard" className="mt-4 inline-block text-primary hover:underline text-sm">
              Back to Dashboard
            </a>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const deeds = report.chain_of_title || [];
  const liens = report.liens || [];
  const defects = report.defects || [];
  const easements = report.easements || [];
  const prop = report.properties;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-8 space-y-6">
        {/* Header Card */}
        <div className="bg-white rounded-xl border border-border p-6 md:p-8">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Title Search Report</h1>
              <p className="mt-1 text-lg text-muted">{prop?.full_address || "Unknown address"}</p>
              <div className="mt-3 flex flex-wrap gap-3 text-sm text-muted">
                {prop?.parcel_id && <span>Parcel: <strong className="text-foreground">{prop.parcel_id}</strong></span>}
                {prop?.county && <><span>·</span><span>County: <strong className="text-foreground">{prop.county}</strong></span></>}
                {prop?.property_type && <><span>·</span><span>Type: <strong className="text-foreground">{prop.property_type}</strong></span></>}
              </div>
            </div>
            <div className="flex flex-col items-start md:items-end gap-2">
              <MarketabilityBadge riskScore={report.risk_score || 0} liens={report.liens || []} defects={report.defects || []} />
              <span className="text-xs text-muted">
                Generated {new Date(report.completed_at || report.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
          {report.summary && (
            <div className="mt-6 p-4 bg-card rounded-lg border border-border">
              <h3 className="text-sm font-semibold text-foreground mb-2">AI Summary</h3>
              <p className="text-sm text-muted leading-relaxed">{report.summary}</p>
            </div>
          )}
        </div>

        {/* Chain of Title */}
        {deeds.length > 0 && (
          <div className="bg-white rounded-xl border border-border p-6 md:p-8">
            <h2 className="text-xl font-bold text-foreground mb-1">Chain of Title</h2>
            <p className="text-sm text-muted mb-6">
              {report.years_searched || 20} years searched
              {(report.chain_breaks || []).length === 0 && (
                <span className="ml-2 text-success font-semibold">· No breaks found</span>
              )}
            </p>
            <div className="space-y-0">
              {deeds.map((deed, i) => (
                <div key={deed.id || i} className="relative pl-8 pb-6">
                  {i < deeds.length - 1 && <div className="absolute left-[13px] top-6 bottom-0 w-0.5 bg-border" />}
                  <div className="absolute left-1.5 top-1.5 w-4 h-4 rounded-full bg-primary border-2 border-white shadow" />
                  <div className="bg-card rounded-lg p-4 border border-border">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-foreground text-sm">{deed.grantor} → {deed.grantee}</p>
                        <p className="text-xs text-muted mt-0.5">
                          {deed.type?.replace("_", " ")} deed · Recorded {new Date(deed.recordedDate).toLocaleDateString()}
                        </p>
                      </div>
                      {deed.consideration && (
                        <span className="text-sm font-semibold text-foreground shrink-0">
                          ${deed.consideration.toLocaleString()}
                        </span>
                      )}
                    </div>
                    <div className="mt-2 flex gap-4 text-xs text-muted">
                      {deed.bookPage && <span>Book/Page: {deed.bookPage}</span>}
                      {deed.instrumentNumber && <span>Inst #: {deed.instrumentNumber}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Liens */}
        {liens.length > 0 && (
          <div className="bg-white rounded-xl border border-border p-6 md:p-8">
            <h2 className="text-xl font-bold text-foreground mb-1">Liens & Encumbrances</h2>
            <p className="text-sm text-muted mb-6">
              {liens.filter((l) => l.status === "active").length} active · {liens.filter((l) => l.status === "released").length} released
            </p>
            <div className="space-y-3">
              {liens.map((lien) => (
                <div key={lien.id} className={`rounded-lg p-4 border ${lien.status === "active" ? "border-accent/30 bg-accent/5" : "border-border bg-card"}`}>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground text-sm">
                          {lien.type.charAt(0).toUpperCase() + lien.type.slice(1)} Lien
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded font-semibold ${lien.status === "active" ? "bg-accent/20 text-accent" : "bg-success/10 text-success"}`}>
                          {lien.status.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-xs text-muted mt-1">{lien.creditor}</p>
                      <div className="mt-2 flex gap-4 text-xs text-muted">
                        <span>Recorded: {new Date(lien.recordedDate).toLocaleDateString()}</span>
                        {lien.releasedDate && <span>Released: {new Date(lien.releasedDate).toLocaleDateString()}</span>}
                        {lien.bookPage && <span>Book/Page: {lien.bookPage}</span>}
                      </div>
                    </div>
                    {lien.amount && <span className="text-sm font-semibold text-foreground shrink-0">${lien.amount.toLocaleString()}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Defects */}
        <div className="bg-white rounded-xl border border-border p-6 md:p-8">
          <h2 className="text-xl font-bold text-foreground mb-4">Title Defects</h2>
          {defects.length === 0 ? (
            <div className="flex items-center gap-3 p-4 bg-success/5 rounded-lg border border-success/20">
              <ShieldCheckIcon className="w-6 h-6 text-success" />
              <p className="text-sm text-success font-semibold">No title defects found. Property appears to have clear and marketable title.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {defects.map((d) => (
                <div key={d.id} className="rounded-lg p-4 border border-border bg-card">
                  <div className="flex items-start gap-3">
                    <SeverityBadge severity={d.severity} />
                    <div>
                      <h4 className="font-semibold text-foreground text-sm">{d.title}</h4>
                      <p className="text-xs text-muted mt-1 leading-relaxed">{d.description}</p>
                      <p className="text-xs text-primary mt-2 font-medium">Recommendation: {d.recommendation}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Easements */}
        {easements.length > 0 && (
          <div className="bg-white rounded-xl border border-border p-6 md:p-8">
            <h2 className="text-xl font-bold text-foreground mb-4">Easements</h2>
            <div className="space-y-3">
              {easements.map((e) => (
                <div key={e.id} className="rounded-lg p-4 border border-border bg-card">
                  <span className="text-xs px-2 py-0.5 bg-info/10 text-info rounded font-semibold border border-info/20">
                    {e.type.toUpperCase()}
                  </span>
                  <p className="mt-2 text-sm text-foreground">{e.description}</p>
                  {e.recordedDate && (
                    <p className="mt-1 text-xs text-muted">
                      Recorded: {new Date(e.recordedDate).toLocaleDateString()}
                      {e.bookPage && ` · Book/Page: ${e.bookPage}`}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="bg-white rounded-xl border border-border p-4 flex flex-wrap items-center gap-3">
          <a
            href={`/api/reports/${reportId}/pdf`}
            target="_blank"
            className="bg-primary text-white font-semibold px-5 py-2.5 rounded-lg hover:bg-primary-dark transition text-sm"
          >
            Download PDF Report
          </a>
          <button className="bg-card text-foreground font-semibold px-5 py-2.5 rounded-lg border border-border hover:border-primary/30 hover:bg-primary/5 transition text-sm opacity-50 cursor-not-allowed" disabled>
            Generate AOL Draft (Coming Soon)
          </button>
        </div>

        {/* Disclaimer */}
        <div className="bg-accent/5 rounded-xl border border-accent/20 p-6">
          <p className="text-xs text-foreground/70 leading-relaxed">
            <strong>Disclaimer:</strong> This report is generated by AI for attorney review purposes only. It does not constitute legal advice or a legal opinion. The reviewing attorney is responsible for verifying all findings and exercising professional judgment before issuing an Attorney Opinion Letter. Cliros is not a title insurance company and does not provide title insurance.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
