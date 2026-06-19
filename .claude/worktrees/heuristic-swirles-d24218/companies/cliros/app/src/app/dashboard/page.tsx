"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import AddressAutocomplete from "@/components/AddressAutocomplete";
import {
  computeTitleMetrics,
  marketabilityListBadgeClass,
  marketabilityShortLabel,
} from "@/lib/title-metrics";

interface UserProfile {
  name: string;
  email: string;
  role: string;
  free_reports_used: number;
  free_reports_total: number;
  firm_name: string | null;
  firm_address: string | null;
}

interface Report {
  id: string;
  address: string;
  county: string;
  state: string;
  status: string;
  pipelineStage: string | null;
  billed: boolean | null;
  refundReason: string | null;
  createdAt: string;
  tier: string;
  isFree: boolean;
  marketabilityLabel: string;
  marketabilityTone: "clear" | "verify" | "curative";
  isClear: boolean;
}

function MarketabilityBadge({ label, tone }: { label: string; tone: Report["marketabilityTone"] }) {
  return (
    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${marketabilityListBadgeClass(tone)}`}>
      {label}
    </span>
  );
}

function ReportStatusBadge({ report }: { report: Report }) {
  const blocked = report.pipelineStage === "blocked";
  const ready = report.pipelineStage === "ready" || report.pipelineStage === "delivered" || report.status === "complete";

  if (blocked && report.billed === false) {
    return (
      <span
        className="text-xs font-semibold px-2 py-0.5 rounded bg-green-50 text-green-700"
        title={`Pipeline blocked${report.refundReason ? `: ${report.refundReason}` : ""}. This report was not billed.`}
      >
        No charge
      </span>
    );
  }

  if (blocked) {
    return (
      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-red-50 text-red-700" title="Pipeline blocked before delivery.">
        Blocked
      </span>
    );
  }

  if (ready) {
    return (
      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-green-50 text-green-700">
        Ready
      </span>
    );
  }

  return (
    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-700">
      In progress
    </span>
  );
}
function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
    </svg>
  );
}

function DocumentIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
    </svg>
  );
}

/* ─── Icons ─── */
export default function DashboardPage() {
  const [address, setAddress] = useState("");
  const [user, setUser] = useState<UserProfile | null>(null);
  const [reports, setReports] = useState<Report[]>([]);
  const [loadingUser, setLoadingUser] = useState(true);

  useEffect(() => {
    async function loadUser() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        window.location.href = "/login";
        return;
      }

      const { data: profile } = await supabase
        .from("users")
        .select("name, email, role, free_reports_used, free_reports_total, firm_name, firm_address")
        .eq("id", session.user.id)
        .single();

      if (profile) setUser(profile);

      const { data: reportRows } = await supabase
        .from("search_reports")
        .select("id, status, pipeline_stage, billed, refund_reason, risk_score, tier, is_free_trial, created_at, liens, defects, attorney_action_plan, properties(full_address, county, state)")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false })
        .limit(20);

      if (reportRows && reportRows.length > 0) {
        setReports(
          reportRows.map((r: Record<string, unknown>) => {
            const prop = r.properties as Record<string, string> | null;
            const plan = r.attorney_action_plan as {
              summary?: { total?: number; autoResolvedReleased?: number; rawLienCount?: number; purchaseMoneyMortgageCount?: number };
            } | null;
            const metrics = computeTitleMetrics({
              riskScore: (r.risk_score as number) || 0,
              liens: (r.liens as Array<{ status?: string }>) || [],
              defects: (r.defects as Array<{ severity?: string }>) || [],
              actionPlanTotal: plan?.summary?.total,
              autoResolvedReleased: plan?.summary?.autoResolvedReleased,
              rawLienCount: plan?.summary?.rawLienCount,
              purchaseMoneyMortgageCount: plan?.summary?.purchaseMoneyMortgageCount,
            });
            return {
              id: r.id as string,
              address: prop?.full_address || "Unknown",
              county: prop?.county || "",
              state: prop?.state || "",
              status: r.status as string,
              pipelineStage: (r.pipeline_stage as string | null) || null,
              billed: r.billed as boolean | null,
              refundReason: (r.refund_reason as string | null) || null,
              createdAt: r.created_at as string,
              tier: r.tier as string,
              isFree: r.is_free_trial as boolean,
              marketabilityLabel: marketabilityShortLabel(metrics),
              marketabilityTone: metrics.tone,
              isClear: metrics.tone === "clear",
            };
          })
        );
      }
      setLoadingUser(false);
    }
    loadUser();
  }, []);

  const freeLeft = Math.max(0, (user?.free_reports_total ?? 5) - (user?.free_reports_used ?? 0));
  const needsFirmProfile = !user?.firm_name || !user?.firm_address;
  const cleanTitles = reports.length > 0
    ? Math.round((reports.filter(r => r.isClear).length / reports.length) * 100)
    : 0;

  if (loadingUser) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse text-muted">Loading your dashboard...</div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header row */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Welcome back, {user?.name?.split(" ")[0] || "Counselor"}
          </h1>
          <p className="text-sm text-muted mt-1">
            {freeLeft > 0
              ? `${freeLeft} free report${freeLeft !== 1 ? "s" : ""} remaining`
              : "Free trial complete — $200 per report"
            }
          </p>
        </div>
        <button
          onClick={async () => {
            await supabase.auth.signOut();
            window.location.href = "/";
          }}
          className="text-sm text-muted hover:text-foreground transition"
        >
          Sign out
        </button>
      </div>

      {needsFirmProfile && (
        <div className="mb-8 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="text-sm font-bold text-amber-950">Finish firm letterhead before your first dossier</p>
            <p className="text-xs text-amber-900/80 mt-1 leading-relaxed">
              Add firm name, address, logo, and public attorney contact so the
              AOL, client report, and closing documents render on usable firm
              letterhead.
            </p>
          </div>
          <Link
            href="/dashboard/settings"
            className="shrink-0 inline-flex items-center justify-center rounded-lg bg-amber-900 text-white px-4 py-2 text-sm font-semibold hover:bg-amber-950 transition"
          >
            Complete Settings
          </Link>
        </div>
      )}

      {/* Quick search */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (address.trim()) {
            window.location.href = `/dashboard/new?address=${encodeURIComponent(address.trim())}`;
          }
        }}
        className="mb-8"
      >
        <div className="flex items-center bg-white border border-border rounded-xl focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/10 transition-all shadow-sm">
          <SearchIcon className="w-5 h-5 text-muted ml-4 shrink-0" />
          <AddressAutocomplete
            value={address}
            onChange={setAddress}
            placeholder="Search a Georgia property address..."
            className="flex-1"
            inputClassName="w-full px-4 py-3.5 text-base bg-transparent outline-none placeholder:text-muted/50"
          />
          <button
            type="submit"
            className="bg-primary text-white font-semibold px-6 py-2.5 m-1.5 rounded-lg hover:bg-primary-dark transition shrink-0 text-sm"
          >
            Search
          </button>
        </div>
      </form>

      {/* Stats cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-border p-5">
          <p className="text-xs font-medium text-muted uppercase tracking-wide">Total Reports</p>
          <p className="text-3xl font-bold text-foreground mt-2">{reports.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-border p-5">
          <p className="text-xs font-medium text-muted uppercase tracking-wide">Clean Titles</p>
          <p className="text-3xl font-bold text-green-600 mt-2">{cleanTitles}%</p>
        </div>
        <div className="bg-white rounded-xl border border-border p-5">
          <p className="text-xs font-medium text-muted uppercase tracking-wide">Free Left</p>
          <p className="text-3xl font-bold text-accent mt-2">{freeLeft}</p>
        </div>
        <div className="bg-white rounded-xl border border-border p-5">
          <p className="text-xs font-medium text-muted uppercase tracking-wide">This Month</p>
          <p className="text-3xl font-bold text-foreground mt-2">
            {reports.filter(r => {
              const d = new Date(r.createdAt);
              const now = new Date();
              return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
            }).length}
          </p>
        </div>
      </div>

      {/* Recent reports table */}
      <div className="bg-white rounded-xl border border-border">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h2 className="font-bold text-foreground">Recent Reports</h2>
          <Link
            href="/dashboard/reports"
            className="text-sm text-accent hover:text-accent-light transition font-medium"
          >
            View all
          </Link>
        </div>

        {reports.length === 0 ? (
          <div className="p-12 text-center">
            <DocumentIcon className="w-10 h-10 text-muted/30 mx-auto" />
            <p className="mt-3 text-muted font-medium">No reports yet</p>
            <p className="mt-1 text-sm text-muted/60">
              Search a Georgia property address to generate your first title report.
            </p>
            <Link
              href="/dashboard/new"
              className="inline-block mt-4 bg-primary text-white font-semibold px-5 py-2.5 rounded-lg hover:bg-primary-dark transition text-sm"
            >
              Run Your First Search
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {reports.map((report) => (
              <Link
                key={report.id}
                href={`/dashboard/reports/${report.id}`}
                className="flex items-center justify-between px-6 py-4 hover:bg-surface/50 transition-colors"
              >
                <div className="flex-1 min-w-0 mr-4">
                  <p className="font-medium text-foreground text-sm truncate">
                    {report.address}
                  </p>
                  <p className="text-xs text-muted mt-0.5">
                    {report.county && `${report.county} County · `}
                    {new Date(report.createdAt).toLocaleDateString("en-US", {
                      month: "short", day: "numeric", year: "numeric"
                    })}
                    {report.isFree && (
                      <span className="ml-2 text-accent font-medium">Free</span>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <MarketabilityBadge label={report.marketabilityLabel} tone={report.marketabilityTone} />
                  <ReportStatusBadge report={report} />
                  <svg className="w-4 h-4 text-muted" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
