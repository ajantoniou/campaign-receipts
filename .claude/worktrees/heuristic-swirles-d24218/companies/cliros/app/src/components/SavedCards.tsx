"use client";

/* ─── Saved Card on File (LemonSqueezy metered subscription) ───
   Single card per attorney. Setup is a redirect to LS's hosted checkout
   ($0, captures card, starts metered subscription). Once set, paralegals
   can run reports past the free trial without re-entering payment — each
   report posts a usage record to LS which bills the card on the cycle.
*/

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface SavedCard {
  brand: string;
  last4: string;
  status: string;
  renewsAt?: string;
}

export default function SavedCards() {
  const [card, setCard] = useState<SavedCard | null>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch("/api/lemon/save-card", {
        headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {},
      });
      if (res.ok) {
        const json = await res.json();
        setCard(json.card);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // If we just came back from LS checkout, the webhook may take a moment.
    // Poll a few times to pick up the freshly-set card.
    if (typeof window !== "undefined" && new URLSearchParams(window.location.search).get("card_saved") === "1") {
      const interval = setInterval(load, 3000);
      setTimeout(() => clearInterval(interval), 30000);
    }
  }, []);

  async function startSetup() {
    setStarting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch("/api/lemon/save-card", {
        method: "POST",
        headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {},
      });
      const json = await res.json();
      if (json.url) {
        window.location.href = json.url;
      } else {
        alert(json.error || "Could not start card setup");
        setStarting(false);
      }
    } catch (err) {
      console.error(err);
      setStarting(false);
    }
  }

  const isActive = card && (card.status === "active" || card.status === "on_trial");

  return (
    <div className="bg-white rounded-xl border border-border p-6 mb-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h2 className="font-bold text-foreground">Card on File</h2>
          <p className="text-sm text-muted mt-1">
            Save a card so paralegals can run reports without re-entering payment.
            Billed via LemonSqueezy at $200/report (merchant of record handles tax + chargebacks).
          </p>
        </div>
      </div>

      {loading ? (
        <div className="text-sm text-muted">Loading…</div>
      ) : isActive && card ? (
        <div className="flex items-center justify-between p-3 border border-border rounded-lg bg-surface">
          <div className="flex items-center gap-3">
            <span className="font-mono text-sm uppercase font-medium text-foreground">
              {card.brand}
            </span>
            <span className="text-foreground">•••• {card.last4}</span>
            <span className="text-xs px-2 py-0.5 bg-green-100 text-green-800 rounded font-medium uppercase">
              {card.status === "on_trial" ? "Trial" : "Active"}
            </span>
            {card.renewsAt && (
              <span className="text-xs text-muted">renews {new Date(card.renewsAt).toLocaleDateString()}</span>
            )}
          </div>
          <button
            onClick={startSetup}
            disabled={starting}
            className="text-sm text-blue-600 hover:underline disabled:opacity-50"
          >
            Update card
          </button>
        </div>
      ) : card && !isActive ? (
        <div className="space-y-3">
          <div className="p-3 border border-amber-300 bg-amber-50 rounded-lg text-sm">
            Card on file is <strong>{card.status}</strong>. Paralegals can&apos;t auto-charge until this is reactivated.
          </div>
          <button
            onClick={startSetup}
            disabled={starting}
            className="px-4 py-2 bg-slate-900 text-white rounded-md text-sm font-medium disabled:opacity-50"
          >
            {starting ? "Opening…" : "Reactivate card"}
          </button>
        </div>
      ) : (
        <div>
          <div className="bg-surface rounded-lg p-4 text-sm text-muted mb-4">
            No card on file yet. Add one to enable auto-charge on report generation past the free trial.
          </div>
          <button
            onClick={startSetup}
            disabled={starting}
            className="px-4 py-2 bg-slate-900 text-white rounded-md text-sm font-medium hover:bg-slate-800 disabled:opacity-50"
          >
            {starting ? "Opening LemonSqueezy…" : "+ Save card on file"}
          </button>
        </div>
      )}
    </div>
  );
}
