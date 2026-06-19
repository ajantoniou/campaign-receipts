"use client";

import { useSearchParams } from "next/navigation";
import { useState, useEffect, Suspense } from "react";
import type {
  SearchStatus,
  TitleDefect,
  DeedRecord,
  LienRecord,
  DefectSeverity,
} from "@/lib/types";
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

function ArrowLeftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
    </svg>
  );
}

/* ─── Report Type (matches API response shape) ─── */
interface SearchReport {
  id: string;
  status: string;
  address: { fullAddress: string; county: string; state: string };
  parcel: {
    parcelId: string;
    county: string;
    state: string;
    propertyType: string;
    assessedValue: number | null;
    taxYear: number;
    legalDescription?: string;
  };
  chainOfTitle: {
    entries: DeedRecord[];
    breaks: { description: string; startDate: string; endDate: string }[];
    yearsSearched: number;
    startDate: string;
    endDate: string;
  };
  liens: LienRecord[];
  easements: { id: string; type: string; description: string; recordedDate: string; bookPage?: string }[];
  defects: TitleDefect[];
  summary: string;
  riskScore: number;
  createdAt: string;
  completedAt: string;
}

/* ─── Progress Steps ─── */
const SEARCH_STEPS = [
  { key: "pending", label: "Initializing search..." },
  { key: "searching", label: "Searching county records..." },
  { key: "analyzing", label: "Analyzing chain of title..." },
  { key: "complete", label: "Report ready!" },
];

function SearchProgress({ currentStatus }: { currentStatus: SearchStatus }) {
  const statusIndex = SEARCH_STEPS.findIndex((s) => s.key === currentStatus);

  return (
    <div className="max-w-lg mx-auto">
      <div className="space-y-4">
        {SEARCH_STEPS.map((step, i) => {
          const isDone = i < statusIndex;
          const isCurrent = i === statusIndex;
          return (
            <div key={step.key} className="flex items-center gap-3">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 transition-all ${
                  isDone
                    ? "bg-success text-white"
                    : isCurrent
                      ? "bg-primary text-white animate-pulse"
                      : "bg-border text-muted"
                }`}
              >
                {isDone ? "✓" : i + 1}
              </div>
              <span
                className={`text-sm font-medium ${
                  isDone
                    ? "text-success"
                    : isCurrent
                      ? "text-foreground"
                      : "text-muted"
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Marketability Badge ───
   Replaces the legacy 0–100 risk score with a checklist-based label that
   maps to action — not a numeric opinion. See title-metrics.ts.
*/
function MarketabilityBadge({ report }: { report: SearchReport }) {
  const m = computeTitleMetrics({
    riskScore: report.riskScore,
    liens: report.liens,
    defects: report.defects,
  });
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold border ${marketabilityBadgeClass(m.tone)}`}>
      {m.tone === "clear" ? (
        <ShieldCheckIcon className="w-4 h-4" />
      ) : (
        <ExclamationIcon className="w-4 h-4" />
      )}
      {m.marketabilityLabel}
    </span>
  );
}

/* ─── Severity Badge ─── */
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

/* ─── Report Sections ─── */
function ReportHeader({
  report,
}: {
  report: SearchReport;
}) {
  return (
    <div className="bg-white rounded-xl border border-border p-6 md:p-8">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Title Search Report
          </h1>
          <p className="mt-1 text-lg text-muted">
            {report.address.fullAddress}
          </p>
          <div className="mt-3 flex flex-wrap gap-3 text-sm text-muted">
            <span>
              Parcel: <strong className="text-foreground">{report.parcel.parcelId}</strong>
            </span>
            <span>·</span>
            <span>
              County: <strong className="text-foreground">{report.parcel.county}</strong>
            </span>
            <span>·</span>
            <span>
              Type: <strong className="text-foreground">{report.parcel.propertyType}</strong>
            </span>
          </div>
        </div>
        <div className="flex flex-col items-start md:items-end gap-2">
          <MarketabilityBadge report={report} />
          <span className="text-xs text-muted">
            Generated {new Date(report.completedAt).toLocaleDateString()}
          </span>
        </div>
      </div>

      {/* Summary */}
      <div className="mt-6 p-4 bg-card rounded-lg border border-border">
        <h3 className="text-sm font-semibold text-foreground mb-2">
          AI Summary
        </h3>
        <p className="text-sm text-muted leading-relaxed">{report.summary}</p>
      </div>
    </div>
  );
}

function ChainOfTitleSection({
  chain,
}: {
  chain: SearchReport["chainOfTitle"];
}) {
  return (
    <div className="bg-white rounded-xl border border-border p-6 md:p-8">
      <h2 className="text-xl font-bold text-foreground mb-1">
        Chain of Title
      </h2>
      <p className="text-sm text-muted mb-6">
        {chain.yearsSearched} years searched ({chain.startDate} to{" "}
        {chain.endDate})
        {chain.breaks.length === 0 && (
          <span className="ml-2 text-success font-semibold">
            · No breaks found
          </span>
        )}
      </p>

      <div className="space-y-0">
        {chain.entries.map((deed, i) => (
          <div key={deed.id} className="relative pl-8 pb-6">
            {/* Timeline line */}
            {i < chain.entries.length - 1 && (
              <div className="absolute left-[13px] top-6 bottom-0 w-0.5 bg-border" />
            )}
            {/* Timeline dot */}
            <div className="absolute left-1.5 top-1.5 w-4 h-4 rounded-full bg-primary border-2 border-white shadow" />

            <div className="bg-card rounded-lg p-4 border border-border">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-semibold text-foreground text-sm">
                    {deed.grantor} → {deed.grantee}
                  </p>
                  <p className="text-xs text-muted mt-0.5">
                    {deed.type.replace("_", " ")} deed · Recorded{" "}
                    {new Date(deed.recordedDate).toLocaleDateString()}
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
                {deed.instrumentNumber && (
                  <span>Inst #: {deed.instrumentNumber}</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function LiensSection({
  liens,
}: {
  liens: SearchReport["liens"];
}) {
  const active = liens.filter((l) => l.status === "active");
  const released = liens.filter((l) => l.status === "released");

  return (
    <div className="bg-white rounded-xl border border-border p-6 md:p-8">
      <h2 className="text-xl font-bold text-foreground mb-1">
        Liens & Encumbrances
      </h2>
      <p className="text-sm text-muted mb-6">
        {active.length} active · {released.length} released
      </p>

      <div className="space-y-3">
        {liens.map((lien) => (
          <div
            key={lien.id}
            className={`rounded-lg p-4 border ${
              lien.status === "active"
                ? "border-accent/30 bg-accent/5"
                : "border-border bg-card"
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-foreground text-sm">
                    {lien.type.charAt(0).toUpperCase() + lien.type.slice(1)} Lien
                  </span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded font-semibold ${
                      lien.status === "active"
                        ? "bg-accent/20 text-accent"
                        : "bg-success/10 text-success"
                    }`}
                  >
                    {lien.status.toUpperCase()}
                  </span>
                </div>
                <p className="text-xs text-muted mt-1">{lien.creditor}</p>
                <div className="mt-2 flex gap-4 text-xs text-muted">
                  <span>
                    Recorded: {new Date(lien.recordedDate).toLocaleDateString()}
                  </span>
                  {lien.releasedDate && (
                    <span>
                      Released:{" "}
                      {new Date(lien.releasedDate).toLocaleDateString()}
                    </span>
                  )}
                  {lien.bookPage && <span>Book/Page: {lien.bookPage}</span>}
                </div>
              </div>
              {lien.amount && (
                <span className="text-sm font-semibold text-foreground shrink-0">
                  ${lien.amount.toLocaleString()}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DefectsSection({
  defects,
}: {
  defects: TitleDefect[];
}) {
  if (defects.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-border p-6 md:p-8">
        <h2 className="text-xl font-bold text-foreground mb-4">
          Title Defects
        </h2>
        <div className="flex items-center gap-3 p-4 bg-success/5 rounded-lg border border-success/20">
          <ShieldCheckIcon className="w-6 h-6 text-success" />
          <p className="text-sm text-success font-semibold">
            No title defects found. Property appears to have clear and
            marketable title.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-border p-6 md:p-8">
      <h2 className="text-xl font-bold text-foreground mb-4">Title Defects</h2>
      <div className="space-y-3">
        {defects.map((d) => (
          <div key={d.id} className="rounded-lg p-4 border border-border bg-card">
            <div className="flex items-start gap-3">
              <SeverityBadge severity={d.severity} />
              <div>
                <h4 className="font-semibold text-foreground text-sm">
                  {d.title}
                </h4>
                <p className="text-xs text-muted mt-1 leading-relaxed">
                  {d.description}
                </p>
                <p className="text-xs text-primary mt-2 font-medium">
                  Recommendation: {d.recommendation}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Action Bar ─── */
function ActionBar() {
  return (
    <div className="bg-white rounded-xl border border-border p-4 flex flex-wrap items-center gap-3">
      <button className="bg-primary text-white font-semibold px-5 py-2.5 rounded-lg hover:bg-primary-dark transition text-sm">
        Download PDF Report
      </button>
      <button className="bg-card text-foreground font-semibold px-5 py-2.5 rounded-lg border border-border hover:border-primary/30 hover:bg-primary/5 transition text-sm">
        Generate AOL Draft
      </button>
      <button className="bg-card text-foreground font-semibold px-5 py-2.5 rounded-lg border border-border hover:border-primary/30 hover:bg-primary/5 transition text-sm">
        Order Full Bundle
      </button>
    </div>
  );
}

/* ─── Search Results Content ─── */
function SearchResultsContent() {
  const searchParams = useSearchParams();
  const address = searchParams.get("address") || "";
  const [status, setStatus] = useState<SearchStatus>("pending");
  const [report, setReport] = useState<SearchReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  // Check auth status first, then search if authenticated
  useEffect(() => {
    if (!address) return;

    let cancelled = false;

    async function checkAndSearch() {
      // Try the search API — if 401, show preview instead
      setStatus("searching");
      setError(null);

      try {
        const res = await fetch("/api/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ address }),
        });

        if (cancelled) return;

        if (res.status === 401) {
          // Not authenticated — show preview with signup prompt
          setIsAuthenticated(false);
          setStatus("complete");
          return;
        }

        setIsAuthenticated(true);

        if (!res.ok) {
          const data = await res.json().catch(() => ({ error: "Unknown error" }));
          setError(data.error || `Search failed (${res.status})`);
          return;
        }

        setStatus("analyzing");

        const data = await res.json();
        if (cancelled) return;

        setReport(data);
        setStatus("complete");
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Network error — please try again");
        }
      }
    }

    const t = setTimeout(checkAndSearch, 400);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [address]);

  if (!address) {
    return (
      <div className="min-h-screen bg-card flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground">
            No address provided
          </h1>
          <p className="mt-2 text-muted">
            Go back to the home page and enter a property address.
          </p>
          <a
            href="/"
            className="mt-4 inline-block bg-primary text-white font-semibold px-6 py-2.5 rounded-lg hover:bg-primary-dark transition"
          >
            Back to Search
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-card">
      {/* Header */}
      <header className="bg-white border-b border-border sticky top-0 z-50">
        <div className="max-w-5xl mx-auto flex items-center justify-between px-6 h-14">
          <a href="/" className="flex items-center gap-2">
            <span className="text-xl font-extrabold text-primary tracking-tight">Cliros</span>
            <span className="text-xs font-semibold text-primary/60 mt-0.5">.ai</span>
          </a>
          <a
            href="/"
            className="flex items-center gap-1.5 text-sm text-muted hover:text-foreground transition"
          >
            <ArrowLeftIcon className="w-4 h-4" />
            New Search
          </a>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {/* Error state */}
        {error && (
          <div className="bg-white rounded-xl border border-danger/30 p-8 md:p-12">
            <div className="text-center">
              <ExclamationIcon className="w-12 h-12 text-danger mx-auto" />
              <h1 className="mt-4 text-2xl font-bold text-foreground">
                Search Failed
              </h1>
              <p className="mt-2 text-muted">{error}</p>
              <div className="mt-6 flex gap-3 justify-center">
                <button
                  onClick={() => window.location.reload()}
                  className="bg-primary text-white font-semibold px-6 py-2.5 rounded-lg hover:bg-primary-dark transition text-sm"
                >
                  Try Again
                </button>
                <a
                  href="/dashboard"
                  className="bg-card text-foreground font-semibold px-6 py-2.5 rounded-lg border border-border hover:border-primary/30 transition text-sm"
                >
                  Back to Dashboard
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Loading state */}
        {!error && status !== "complete" && (
          <div className="bg-white rounded-xl border border-border p-8 md:p-12">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-foreground">
                Searching property records...
              </h1>
              <p className="mt-2 text-muted">{address}</p>
            </div>
            <SearchProgress currentStatus={status} />
          </div>
        )}

        {/* Unauthenticated preview — show teaser + signup prompt */}
        {status === "complete" && isAuthenticated === false && (
          <div className="space-y-6">
            {/* Preview header */}
            <div className="bg-white rounded-xl border border-border p-6 md:p-8">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold text-foreground">Title Search Preview</h1>
                  <p className="mt-1 text-lg text-muted">{address}</p>
                  <div className="mt-3 flex flex-wrap gap-3 text-sm text-muted">
                    <span>State: <strong className="text-foreground">Georgia</strong></span>
                  </div>
                </div>
              </div>

              {/* Preview summary */}
              <div className="mt-6 p-4 bg-card rounded-lg border border-border">
                <h3 className="text-sm font-semibold text-foreground mb-2">What You Get</h3>
                <div className="grid sm:grid-cols-2 gap-3 text-sm text-muted">
                  <div className="flex items-center gap-2">
                    <ShieldCheckIcon className="w-4 h-4 text-primary shrink-0" />
                    25-year chain of title from GSCCCA
                  </div>
                  <div className="flex items-center gap-2">
                    <ShieldCheckIcon className="w-4 h-4 text-primary shrink-0" />
                    State & federal lien search
                  </div>
                  <div className="flex items-center gap-2">
                    <ShieldCheckIcon className="w-4 h-4 text-primary shrink-0" />
                    UCC filings & PT-61 records
                  </div>
                  <div className="flex items-center gap-2">
                    <ShieldCheckIcon className="w-4 h-4 text-primary shrink-0" />
                    Risk analysis & AOL draft
                  </div>
                </div>
              </div>
            </div>

            {/* Blurred placeholder sections */}
            <div className="relative">
              <div className="space-y-6 blur-sm pointer-events-none select-none" aria-hidden="true">
                <div className="bg-white rounded-xl border border-border p-6 md:p-8">
                  <h2 className="text-xl font-bold text-foreground mb-4">Chain of Title</h2>
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="bg-card rounded-lg p-4 border border-border">
                        <div className="h-4 bg-border rounded w-3/4 mb-2" />
                        <div className="h-3 bg-border/60 rounded w-1/2" />
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-white rounded-xl border border-border p-6 md:p-8">
                  <h2 className="text-xl font-bold text-foreground mb-4">Liens & Encumbrances</h2>
                  <div className="space-y-3">
                    {[1, 2].map((i) => (
                      <div key={i} className="bg-card rounded-lg p-4 border border-border">
                        <div className="h-4 bg-border rounded w-2/3 mb-2" />
                        <div className="h-3 bg-border/60 rounded w-1/3" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Signup overlay */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="bg-white rounded-2xl shadow-2xl border border-border p-8 max-w-md mx-4 text-center">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <ShieldCheckIcon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground">Sign up to view full report</h3>
                  <p className="mt-2 text-sm text-muted leading-relaxed">
                    Create a free account to access up to 5 complete title search reports. No credit card required.
                  </p>
                  <a
                    href={`/signup?address=${encodeURIComponent(address)}`}
                    className="mt-6 block bg-primary text-white font-semibold py-3 rounded-lg hover:bg-primary-dark transition text-sm"
                  >
                    Sign Up Free — Get 5 Reports
                  </a>
                  <p className="mt-3 text-xs text-muted">
                    Already have an account?{" "}
                    <a href={`/login?redirect=/search?address=${encodeURIComponent(address)}`} className="text-primary hover:underline">
                      Log in
                    </a>
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Complete state — authenticated with report */}
        {status === "complete" && report && isAuthenticated && (
          <div className="space-y-6">
            <ActionBar />
            <ReportHeader report={report} />
            <ChainOfTitleSection chain={report.chainOfTitle} />
            <LiensSection liens={report.liens} />
            <DefectsSection defects={report.defects} />

            {/* Easements */}
            {report.easements.length > 0 && (
              <div className="bg-white rounded-xl border border-border p-6 md:p-8">
                <h2 className="text-xl font-bold text-foreground mb-4">
                  Easements
                </h2>
                <div className="space-y-3">
                  {report.easements.map((e) => (
                    <div
                      key={e.id}
                      className="rounded-lg p-4 border border-border bg-card"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <span className="text-xs px-2 py-0.5 bg-info/10 text-info rounded font-semibold border border-info/20">
                            {e.type.toUpperCase()}
                          </span>
                          <p className="mt-2 text-sm text-foreground">
                            {e.description}
                          </p>
                          {e.recordedDate && (
                            <p className="mt-1 text-xs text-muted">
                              Recorded:{" "}
                              {new Date(e.recordedDate).toLocaleDateString()}
                              {e.bookPage && ` · Book/Page: ${e.bookPage}`}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Disclaimer */}
            <div className="bg-accent/5 rounded-xl border border-accent/20 p-6">
              <p className="text-xs text-foreground/70 leading-relaxed">
                <strong>Disclaimer:</strong> This report is generated by AI for
                attorney review purposes only. It does not constitute legal
                advice or a legal opinion. The reviewing attorney is responsible
                for verifying all findings and exercising professional judgment
                before issuing an Attorney Opinion Letter. Cliros is not a
                title insurance company and does not provide title insurance.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

/* ─── Page with Suspense boundary ─── */
export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-card flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="mt-4 text-muted">Loading...</p>
          </div>
        </div>
      }
    >
      <SearchResultsContent />
    </Suspense>
  );
}
