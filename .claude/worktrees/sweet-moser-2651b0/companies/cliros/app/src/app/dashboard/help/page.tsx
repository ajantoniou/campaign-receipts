"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface Ticket {
  id: string;
  subject: string;
  status: string;
  category?: string;
  human_response?: string;
  created_at: string;
  responded_at?: string;
}

export default function HelpPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const res = await fetch("/api/support/ticket", {
          headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {},
        });
        if (res.ok) {
          const json = await res.json();
          setTickets(json.tickets || []);
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const statusLabel = (s: string) => {
    if (s === "new") return { text: "Received", color: "bg-blue-100 text-blue-800" };
    if (s === "triaged") return { text: "In review", color: "bg-amber-100 text-amber-800" };
    if (s === "responded") return { text: "Reply ready", color: "bg-green-100 text-green-800" };
    if (s === "resolved") return { text: "Resolved", color: "bg-slate-100 text-slate-700" };
    if (s === "closed") return { text: "Closed", color: "bg-slate-100 text-slate-500" };
    return { text: s, color: "bg-slate-100" };
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">Help &amp; Support</h1>
      <p className="text-slate-600 mb-6 text-sm">
        Your tickets. Open new ones with the Help button in the sidebar. Most are answered within one business day.
      </p>

      {loading ? (
        <div className="text-slate-500">Loading…</div>
      ) : tickets.length === 0 ? (
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-8 text-center">
          <p className="text-slate-600">No tickets yet. We&apos;re here when you need us.</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Subject</th>
                <th className="text-left px-4 py-3 font-medium">Status</th>
                <th className="text-left px-4 py-3 font-medium">Opened</th>
                <th className="text-left px-4 py-3 font-medium">Last response</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {tickets.map((t) => {
                const sl = statusLabel(t.status);
                return (
                  <tr key={t.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-900">{t.subject}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded ${sl.color}`}>
                        {sl.text}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {new Date(t.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {t.human_response ? (
                        <span className="line-clamp-1">{t.human_response.slice(0, 80)}…</span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
