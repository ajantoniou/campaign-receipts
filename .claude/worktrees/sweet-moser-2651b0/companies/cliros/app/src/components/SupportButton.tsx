"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function SupportButton({ activeReportId }: { activeReportId?: string }) {
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch("/api/support/ticket", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({
          subject,
          body,
          page_context: typeof window !== "undefined" ? window.location.href : null,
          report_id: activeReportId || null,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Could not send ticket");
      setSuccess(true);
      setSubject("");
      setBody("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <button
        onClick={() => { setOpen(true); setSuccess(false); }}
        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-300 hover:text-white hover:bg-slate-800 rounded-md transition"
      >
        <span>❓</span>
        <span>Help &amp; Feedback</span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-white rounded-lg shadow-xl w-full max-w-md p-6"
            onClick={(e) => e.stopPropagation()}
          >
            {success ? (
              <div className="text-center py-4">
                <div className="text-4xl mb-3">✓</div>
                <h3 className="text-lg font-semibold mb-2">Ticket received</h3>
                <p className="text-sm text-slate-600 mb-4">
                  We&apos;ll review and respond within one business day. Urgent issues are paged immediately.
                </p>
                <button
                  onClick={() => setOpen(false)}
                  className="px-4 py-2 bg-slate-900 text-white rounded-md text-sm"
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={submit}>
                <h3 className="text-lg font-semibold mb-1">Get help</h3>
                <p className="text-sm text-slate-600 mb-4">
                  Found a bug, have a question, or want to request a feature? We read every ticket.
                </p>

                <label className="block mb-3">
                  <span className="block text-sm font-medium text-slate-700 mb-1">Subject</span>
                  <input
                    type="text"
                    required
                    minLength={3}
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Short description"
                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                  />
                </label>

                <label className="block mb-3">
                  <span className="block text-sm font-medium text-slate-700 mb-1">What&apos;s happening?</span>
                  <textarea
                    required
                    minLength={5}
                    rows={5}
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder="Describe the issue, what you expected, and what happened instead."
                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm"
                  />
                </label>

                {activeReportId && (
                  <div className="text-xs text-slate-500 mb-3">
                    📎 Linked to current report
                  </div>
                )}

                {error && <div className="text-sm text-red-600 mb-3">{error}</div>}

                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-4 py-2 bg-slate-900 text-white rounded-md text-sm disabled:opacity-50"
                  >
                    {submitting ? "Sending…" : "Send"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
