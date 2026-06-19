"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import SavedCards from "@/components/SavedCards";
import ReportPackages from "@/components/ReportPackages";

interface BillingInfo {
  freeUsed: number;
  freeTotal: number;
  totalReports: number;
  paidReports: number;
  reportsRemaining: number;
  refundedReports: number;
}

export default function BillingPage() {
  const [billing, setBilling] = useState<BillingInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { window.location.href = "/login"; return; }

      const { data: profile } = await supabase
        .from("users")
        .select("free_reports_used, free_reports_total, reports_remaining")
        .eq("id", session.user.id)
        .single();

      const { count: totalReports } = await supabase
        .from("search_reports")
        .select("*", { count: "exact", head: true })
        .eq("user_id", session.user.id);

      const { count: paidReports } = await supabase
        .from("search_reports")
        .select("*", { count: "exact", head: true })
        .eq("user_id", session.user.id)
        .eq("is_free_trial", false);

      // Refunded reports — unverifiable runs that were credited back. Counted
      // from the audit table (idempotent: one row per refunded report).
      const { count: refundedReports } = await supabase
        .from("report_refunds")
        .select("*", { count: "exact", head: true })
        .eq("user_id", session.user.id);

      setBilling({
        freeUsed: profile?.free_reports_used || 0,
        freeTotal: profile?.free_reports_total || 5,
        totalReports: totalReports || 0,
        paidReports: paidReports || 0,
        reportsRemaining: profile?.reports_remaining || 0,
        refundedReports: refundedReports || 0,
      });
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><div className="animate-pulse text-muted">Loading billing...</div></div>;
  }

  const freeLeft = Math.max(0, (billing?.freeTotal || 5) - (billing?.freeUsed || 0));
  const betaMode = process.env.NEXT_PUBLIC_CLIROS_BETA_MODE === "true";

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-foreground mb-6">Billing</h1>

      {betaMode ? (
        <div className="bg-gradient-to-br from-amber-50 to-white rounded-xl border border-amber-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h2 className="font-bold text-foreground">Beta — Free during preview</h2>
              <p className="text-sm text-muted mt-1">No card. No cap. We invoice no one until launch.</p>
            </div>
            <span className="text-2xl font-bold text-foreground">$0<span className="text-sm font-normal text-muted">/report</span></span>
          </div>
          <p className="text-[12px] text-muted mt-3">
            Launch pricing is <span className="line-through">$200/report</span>. Beta testers lock in introductory pricing when we exit beta — details by email.
          </p>
        </div>
      ) : (
        <>
          {/* Current plan + free trial progress */}
          <div className="bg-white rounded-xl border border-border p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-bold text-foreground">Pay as you go</h2>
                <p className="text-sm text-muted mt-1">$200 per report — or buy a package below to save</p>
              </div>
              <span className="text-2xl font-bold text-foreground">$200<span className="text-sm font-normal text-muted">/report</span></span>
            </div>

            <div className="bg-surface rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-foreground">Free Trial</span>
                <span className="text-sm text-muted">{billing?.freeUsed || 0} / {billing?.freeTotal || 5} used</span>
              </div>
              <div className="w-full bg-border rounded-full h-2">
                <div
                  className="bg-accent h-2 rounded-full transition-all"
                  style={{ width: `${((billing?.freeUsed || 0) / (billing?.freeTotal || 5)) * 100}%` }}
                />
              </div>
              {freeLeft > 0 ? (
                <p className="text-xs text-muted mt-2">{freeLeft} free report{freeLeft !== 1 ? "s" : ""} remaining</p>
              ) : (
                <p className="text-xs text-amber-600 font-medium mt-2">Free trial complete — buy a package or save a card below</p>
              )}
            </div>
          </div>

          <ReportPackages />
          <SavedCards />
        </>
      )}

      {/* Usage summary */}
      <div className="bg-white rounded-xl border border-border p-6 mb-6">
        <h2 className="font-bold text-foreground mb-4">Usage Summary</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-surface rounded-lg">
            <p className="text-xs text-muted uppercase font-medium">Total Reports</p>
            <p className="text-2xl font-bold text-foreground mt-1">{billing?.totalReports || 0}</p>
          </div>
          <div className="p-4 bg-surface rounded-lg">
            <p className="text-xs text-muted uppercase font-medium">Paid Reports</p>
            <p className="text-2xl font-bold text-foreground mt-1">{billing?.paidReports || 0}</p>
          </div>
          <div className="p-4 bg-surface rounded-lg">
            <p className="text-xs text-muted uppercase font-medium">Balance</p>
            <p className="text-2xl font-bold text-foreground mt-1">{billing?.reportsRemaining || 0}</p>
          </div>
          <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
            <p className="text-xs text-emerald-700 uppercase font-medium">Refunded</p>
            <p className="text-2xl font-bold text-emerald-900 mt-1">{billing?.refundedReports || 0}</p>
            <p className="text-[10px] text-emerald-700 mt-1 leading-tight">No-charge for unverifiable addresses</p>
          </div>
        </div>
      </div>

      {/* Customer-success footer */}
      <div className="bg-surface rounded-xl border border-border p-6 text-sm text-foreground space-y-2">
        <p>
          <strong>Questions or issues with a report?</strong>{" "}
          Email <a href="mailto:support@cliros.ai" className="underline font-medium">support@cliros.ai</a> — we re-run reports for free if there&apos;s an error.
        </p>
        <p>
          <strong>Want a new feature or data source in your report?</strong>{" "}
          Email <a href="mailto:alex@cliros.ai" className="underline font-medium">alex@cliros.ai</a> — we&apos;ll make it work for your firm.
        </p>
      </div>
    </div>
  );
}
