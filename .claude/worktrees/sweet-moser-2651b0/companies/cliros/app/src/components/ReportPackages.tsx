"use client";

/* ─── Report Packages (Prepaid Credits) ───
   Three-tier package grid + current balance + refund policy.
   Renders on /dashboard/billing.
*/

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface Balance {
  remaining: number;
  purchased_total: number;
  consumed_total: number;
}

const PACKAGES = [
  { size: 1,  priceCents:  25_000, perReport: 250, discountPct: 0  },
  { size: 5,  priceCents: 110_000, perReport: 220, discountPct: 12 },
  { size: 25, priceCents: 500_000, perReport: 200, discountPct: 20, recommended: true },
] as const;

export default function ReportPackages() {
  const [balance, setBalance] = useState<Balance | null>(null);
  const [buying, setBuying] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadBalance() {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { data } = await supabase
        .from("users")
        .select("reports_remaining, reports_purchased_total, reports_consumed_total")
        .eq("id", session.user.id)
        .single();
      if (data) {
        setBalance({
          remaining: data.reports_remaining ?? 0,
          purchased_total: data.reports_purchased_total ?? 0,
          consumed_total: data.reports_consumed_total ?? 0,
        });
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadBalance();
    if (typeof window !== "undefined" && new URLSearchParams(window.location.search).get("package_purchased")) {
      const interval = setInterval(loadBalance, 3000);
      setTimeout(() => clearInterval(interval), 30000);
    }
  }, []);

  async function buy(size: number) {
    setBuying(size);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch("/api/lemon/buy-package", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({ size }),
      });
      const json = await res.json();
      if (json.url) {
        window.location.href = json.url;
      } else {
        alert(json.error || "Could not open checkout");
        setBuying(null);
      }
    } catch {
      setBuying(null);
    }
  }

  return (
    <div className="bg-white rounded-xl border border-border p-6 mb-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="font-bold text-foreground">Report Packages</h2>
          <p className="text-sm text-muted mt-1">
            Buy reports in bulk and save. Best for firms doing multiple closings per month.
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted uppercase font-medium">Current Balance</p>
          <p className="text-2xl font-bold text-foreground">
            {loading ? "—" : balance?.remaining ?? 0}
            <span className="text-sm font-normal text-muted ml-1">reports</span>
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-3 mb-4">
        {PACKAGES.map((pkg) => {
          const recommended = "recommended" in pkg && pkg.recommended;
          return (
            <div
              key={pkg.size}
              className={`border rounded-lg p-4 relative ${recommended ? "border-slate-900 ring-1 ring-slate-900" : "border-border"}`}
            >
              {recommended && (
                <div className="inline-block text-xs font-bold text-white bg-slate-900 px-2 py-0.5 rounded mb-2">
                  MOST POPULAR
                </div>
              )}
              <p className="text-2xl font-bold text-foreground">{pkg.size} reports</p>
              <p className="text-2xl font-bold text-foreground mt-1">
                ${(pkg.priceCents / 100).toLocaleString()}
              </p>
              <p className="text-xs text-muted mt-1">
                ${pkg.perReport}/report
                <span className="ml-2 text-green-700 font-semibold">{pkg.discountPct}% off</span>
              </p>
              <button
                onClick={() => buy(pkg.size)}
                disabled={buying !== null}
                className={`w-full mt-3 px-3 py-2 rounded-md text-sm font-medium disabled:opacity-50 ${
                  recommended
                    ? "bg-slate-900 text-white hover:bg-slate-800"
                    : "border border-slate-900 text-slate-900 hover:bg-slate-100"
                }`}
              >
                {buying === pkg.size ? "Opening checkout…" : `Buy ${pkg.size}-pack`}
              </button>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-muted">
        No refunds, but generous credits. Reports expire 12 months from purchase. Need help with a specific report? Email{" "}
        <a href="mailto:support@cliros.ai" className="underline">support@cliros.ai</a>.
      </p>
    </div>
  );
}
