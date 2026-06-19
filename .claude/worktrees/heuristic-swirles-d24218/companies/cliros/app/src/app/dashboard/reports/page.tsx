"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import {
  computeTitleMetrics,
  marketabilityListBadgeClass,
  marketabilityShortLabel,
} from "@/lib/title-metrics";

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
}

function ReportStatusBadge({ report }: { report: Report }) {
  const blocked = report.pipelineStage === "blocked";
  const ready = report.pipelineStage === "ready" || report.pipelineStage === "delivered" || report.status === "complete";

  if (blocked && report.billed === false) {
    return (
      <span
        className="text-xs font-semibold px-2.5 py-1 rounded-full bg-green-50 text-green-700 border border-green-200"
        title={`Pipeline blocked${report.refundReason ? `: ${report.refundReason}` : ""}. This report was not billed.`}
      >
        No charge
      </span>
    );
  }

  if (blocked) {
    return (
      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-red-50 text-red-700 border border-red-200">
        Blocked
      </span>
    );
  }

  if (ready) {
    return (
      <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-green-50 text-green-700 border border-green-200">
        Ready
      </span>
    );
  }

  return (
    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
      In progress
    </span>
  );
}

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { window.location.href = "/login"; return; }

      const { data: rows } = await supabase
        .from("search_reports")
        .select("id, status, pipeline_stage, billed, refund_reason, risk_score, tier, is_free_trial, created_at, liens, defects, attorney_action_plan, properties(full_address, county, state)")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false });

      if (rows) {
        setReports(rows.map((r: Record<string, unknown>) => {
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
            state: prop?.state || "GA",
            status: r.status as string,
            pipelineStage: (r.pipeline_stage as string | null) || null,
            billed: r.billed as boolean | null,
            refundReason: (r.refund_reason as string | null) || null,
            createdAt: r.created_at as string,
            tier: r.tier as string,
            isFree: r.is_free_trial as boolean,
            marketabilityLabel: marketabilityShortLabel(metrics),
            marketabilityTone: metrics.tone,
          };
        }));
      }
      setLoading(false);
    }
    load();
  }, []);

  const filtered = reports.filter(r =>
    r.address.toLowerCase().includes(search.toLowerCase()) ||
    r.county.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><div className="animate-pulse text-muted">Loading reports...</div></div>;
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">All Reports</h1>
        <Link
          href="/dashboard/new"
          className="bg-primary text-white font-semibold px-4 py-2 rounded-lg hover:bg-primary-dark transition text-sm"
        >
          + New Search
        </Link>
      </div>

      {/* Search filter */}
      <div className="mb-6">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter by address or county..."
          className="w-full max-w-md px-4 py-2.5 border border-border rounded-lg bg-white text-sm outline-none focus:border-accent focus:ring-2 focus:ring-accent/10"
        />
      </div>

      {/* Reports list */}
      <div className="bg-white rounded-xl border border-border divide-y divide-border">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-muted">
            {search ? "No reports match your filter" : "No reports yet"}
          </div>
        ) : (
          filtered.map((report) => (
            <Link
              key={report.id}
              href={`/dashboard/reports/${report.id}`}
              className="flex items-center justify-between px-6 py-4 hover:bg-surface/50 transition-colors"
            >
              <div className="flex-1 min-w-0 mr-4">
                <p className="font-medium text-foreground text-sm truncate">{report.address}</p>
                <p className="text-xs text-muted mt-0.5">
                  {report.county && `${report.county} County · `}
                  {new Date(report.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  {report.isFree && <span className="ml-2 text-accent font-medium">Free</span>}
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span
                  className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${marketabilityListBadgeClass(report.marketabilityTone)}`}
                  title="Indexed-record checklist — not a title opinion"
                >
                  {report.marketabilityLabel}
                </span>
                <ReportStatusBadge report={report} />
                <svg className="w-4 h-4 text-muted" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                </svg>
              </div>
            </Link>
          ))
        )}
      </div>

      <p className="text-xs text-muted mt-4">{filtered.length} report{filtered.length !== 1 ? "s" : ""} total</p>
    </div>
  );
}
