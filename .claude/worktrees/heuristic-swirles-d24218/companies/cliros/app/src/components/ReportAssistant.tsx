"use client";

/* ─── Report Assistant (grounded Q&A + attorney-in-the-loop drafting) ───
   Two modes:
     • Ask  — read-only, UPL-bounded Q&A (restate/locate/explain the report).
     • Edit — the assistant PROPOSES an edited AOL / client-report draft from the
              attorney's instruction; the attorney APPROVES (snapshot+apply, with
              an undo trail) or asks for a REWRITE. The assistant never writes;
              approval is the gate, and the attorney is the author of record.
*/

import { useState, useRef } from "react";
import { supabase } from "@/lib/supabase";

interface QaTurn {
  role: "user" | "assistant";
  text: string;
}
interface Proposal {
  target: "aol_draft" | "client_report_draft";
  proposed: string;
  rationale: string;
  flags: string[];
  malformed: boolean;
  current: string;
}
interface Revision {
  id: string;
  field: "aol_draft" | "client_report_draft";
  source: "manual" | "assistant_apply" | "revert";
  note: string | null;
  created_at: string;
}

const SOURCE_LABEL: Record<Revision["source"], string> = {
  assistant_apply: "Assistant edit",
  manual: "Manual edit",
  revert: "Reverted",
};

const ASK_SUGGESTIONS = [
  "Which deed carries the legal description?",
  "What does the report say about the chain break?",
  "Explain the statute cited on the critical defects.",
  "List every active lien and its book/page.",
];

const TARGET_LABEL: Record<Proposal["target"], string> = {
  aol_draft: "Attorney Opinion Letter",
  client_report_draft: "Client report",
};

export default function ReportAssistant({
  reportId,
  onApplied,
}: {
  reportId: string;
  /** Called after an approved edit lands so the parent can refresh its draft textareas. */
  onApplied?: (target: Proposal["target"], text: string) => void;
}) {
  const [mode, setMode] = useState<"ask" | "edit">("ask");

  // shared
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ask mode
  const [turns, setTurns] = useState<QaTurn[]>([]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // edit mode
  const [target, setTarget] = useState<Proposal["target"]>("aol_draft");
  const [instruction, setInstruction] = useState("");
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [applied, setApplied] = useState(false);

  // revision history
  const [revisions, setRevisions] = useState<Revision[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  async function authHeaders(): Promise<Record<string, string>> {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {};
  }

  /* ── ask mode ── */
  async function ask(question: string) {
    const q = question.trim();
    if (!q || busy) return;
    setError(null);
    setBusy(true);
    setTurns((t) => [...t, { role: "user", text: q }]);
    setInput("");
    try {
      const resp = await fetch(`/api/reports/${reportId}/qa`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(await authHeaders()) },
        body: JSON.stringify({ question: q }),
      });
      const data = await resp.json();
      if (!resp.ok) {
        setError(data?.error || "The assistant couldn't answer. Try again.");
        setTurns((t) => t.slice(0, -1));
        return;
      }
      setTurns((t) => [...t, { role: "assistant", text: String(data.answer || "") }]);
      requestAnimationFrame(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight }));
    } catch {
      setError("Network error. Try again.");
      setTurns((t) => t.slice(0, -1));
    } finally {
      setBusy(false);
    }
  }

  /* ── edit mode ── */
  async function propose() {
    const ins = instruction.trim();
    if (!ins || busy) return;
    setError(null);
    setApplied(false);
    setBusy(true);
    try {
      const resp = await fetch(`/api/reports/${reportId}/qa/propose-edit`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(await authHeaders()) },
        body: JSON.stringify({ instruction: ins, target }),
      });
      const data = await resp.json();
      if (!resp.ok) {
        setError(data?.error || "Couldn't draft a proposal. Try again.");
        return;
      }
      setProposal({
        target: data.target,
        proposed: String(data.proposed || ""),
        rationale: String(data.rationale || ""),
        flags: Array.isArray(data.flags) ? data.flags : [],
        malformed: !!data.malformed,
        current: String(data.current || ""),
      });
    } catch {
      setError("Network error. Try again.");
    } finally {
      setBusy(false);
    }
  }

  async function approve() {
    if (!proposal || busy) return;
    setBusy(true);
    setError(null);
    try {
      const resp = await fetch(`/api/reports/${reportId}/drafts/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(await authHeaders()) },
        body: JSON.stringify({
          target: proposal.target,
          text: proposal.proposed,
          source: "assistant_apply",
          note: instruction.slice(0, 200),
        }),
      });
      const data = await resp.json();
      if (!resp.ok) {
        setError(data?.error || "Couldn't apply the edit. Try again.");
        return;
      }
      setApplied(true);
      onApplied?.(proposal.target, proposal.proposed);
      setProposal(null);
      setInstruction("");
      if (showHistory) await loadHistory(proposal.target);
    } catch {
      setError("Network error. Try again.");
    } finally {
      setBusy(false);
    }
  }

  function askForRewrite() {
    // Keep the proposal context; pre-focus the instruction box for refinement.
    setProposal(null);
    setError(null);
  }

  async function loadHistory(t: Proposal["target"]) {
    try {
      const resp = await fetch(
        `/api/reports/${reportId}/drafts/revisions?field=${t}`,
        { headers: await authHeaders() },
      );
      const data = await resp.json();
      if (resp.ok) setRevisions(Array.isArray(data.revisions) ? data.revisions : []);
    } catch {
      /* non-fatal */
    }
  }

  async function toggleHistory() {
    const next = !showHistory;
    setShowHistory(next);
    if (next) await loadHistory(target);
  }

  async function restore(revisionId: string) {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const resp = await fetch(`/api/reports/${reportId}/drafts/revert`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(await authHeaders()) },
        body: JSON.stringify({ revisionId }),
      });
      const data = await resp.json();
      if (!resp.ok) {
        setError(data?.error || "Couldn't restore that version. Try again.");
        return;
      }
      onApplied?.(data.field, String(data.restoredText || ""));
      await loadHistory(target);
    } catch {
      setError("Network error. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mt-8 rounded-lg border border-slate-200 bg-white">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <div>
          <h2 className="text-base font-semibold text-slate-900">Report assistant</h2>
          <p className="mt-1 text-sm text-slate-500">
            {mode === "ask"
              ? "Explains and locates what this report says. Cites the record behind every answer. Not legal advice — marketability is your call."
              : "Proposes edits to your draft. You review and approve before anything is saved — you are the author of record. Every approved edit can be undone."}
          </p>
        </div>
        <div className="ml-4 flex shrink-0 rounded-md border border-slate-200 p-0.5 text-sm">
          {(["ask", "edit"] as const).map((m) => (
            <button
              key={m}
              onClick={() => { setMode(m); setError(null); }}
              className={
                "rounded px-3 py-1 " +
                (mode === m ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-50")
              }
            >
              {m === "ask" ? "Ask" : "Edit draft"}
            </button>
          ))}
        </div>
      </div>

      {error && <div className="px-5 pt-3 text-sm text-rose-600">{error}</div>}

      {mode === "ask" ? (
        <>
          {turns.length > 0 && (
            <div ref={scrollRef} className="max-h-96 overflow-y-auto px-5 py-4 space-y-4">
              {turns.map((t, i) => (
                <div key={i} className={t.role === "user" ? "text-right" : "text-left"}>
                  <div
                    className={
                      "inline-block max-w-[90%] whitespace-pre-wrap rounded-lg px-3 py-2 text-sm " +
                      (t.role === "user"
                        ? "bg-slate-900 text-white"
                        : "bg-slate-50 text-slate-800 border border-slate-100")
                    }
                  >
                    {t.text}
                  </div>
                </div>
              ))}
              {busy && <div className="text-left text-sm text-slate-400">Reading the report…</div>}
            </div>
          )}
          {turns.length === 0 && (
            <div className="px-5 pt-4 flex flex-wrap gap-2">
              {ASK_SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => ask(s)}
                  disabled={busy}
                  className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-600 hover:bg-slate-50 disabled:opacity-50"
                >
                  {s}
                </button>
              ))}
            </div>
          )}
          <form
            onSubmit={(e) => { e.preventDefault(); ask(input); }}
            className="flex items-center gap-2 px-5 py-4"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              maxLength={600}
              placeholder="e.g. Which deed carries the legal description?"
              className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
              disabled={busy}
            />
            <button
              type="submit"
              disabled={busy || !input.trim()}
              className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
            >
              Ask
            </button>
          </form>
        </>
      ) : (
        <div className="px-5 py-4">
          {applied && (
            <div className="mb-3 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              Edit applied to your {TARGET_LABEL[target]} draft. You can undo it from the draft’s
              revision history. Remember to regenerate the PDF.
            </div>
          )}

          <div className="mb-3 flex items-center justify-end">
            <button
              onClick={toggleHistory}
              className="text-xs text-slate-500 underline-offset-2 hover:text-slate-800 hover:underline"
            >
              {showHistory ? "Hide revision history" : "Revision history & undo"}
            </button>
          </div>

          {showHistory && (
            <div className="mb-4 rounded-md border border-slate-200 bg-slate-50/60 px-3 py-2">
              {revisions.length === 0 ? (
                <p className="py-1 text-xs text-slate-400">
                  No saved revisions yet for {TARGET_LABEL[target]}. Each approved edit shows up here
                  so you can restore the version before it.
                </p>
              ) : (
                <ul className="divide-y divide-slate-200">
                  {revisions.map((rev) => (
                    <li key={rev.id} className="flex items-center justify-between gap-3 py-2 text-xs">
                      <span className="text-slate-600">
                        <span className="font-medium text-slate-800">{SOURCE_LABEL[rev.source]}</span>
                        {rev.note ? <span className="text-slate-500"> — {rev.note}</span> : null}
                        <span className="block text-[11px] text-slate-400">
                          {new Date(rev.created_at).toLocaleString()}
                        </span>
                      </span>
                      <button
                        onClick={() => restore(rev.id)}
                        disabled={busy}
                        className="shrink-0 rounded border border-slate-300 px-2 py-1 text-slate-700 hover:bg-white disabled:opacity-50"
                        title="Restore the document to the version BEFORE this edit"
                      >
                        Restore this version
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {!proposal ? (
            <>
              <div className="mb-3 flex items-center gap-3 text-sm">
                <span className="text-slate-500">Edit:</span>
                {(["aol_draft", "client_report_draft"] as const).map((t) => (
                  <label key={t} className="flex items-center gap-1.5 text-slate-700">
                    <input
                      type="radio"
                      name="qa-target"
                      checked={target === t}
                      onChange={() => setTarget(t)}
                    />
                    {TARGET_LABEL[t]}
                  </label>
                ))}
              </div>
              <textarea
                value={instruction}
                onChange={(e) => setInstruction(e.target.value)}
                maxLength={1200}
                rows={3}
                placeholder={
                  "Tell the assistant what to change. It uses facts already in this report; for new " +
                  "legal language, state the substance and it will draft it for your approval.\n" +
                  "e.g. “Tighten the opinion’s vesting paragraph and add that defect-4 will be carried " +
                  "as a Schedule B exception.”"
                }
                className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-500 focus:outline-none"
                disabled={busy}
              />
              <div className="mt-2 flex items-center justify-between">
                <p className="text-xs text-slate-400">
                  The assistant proposes; nothing is saved until you approve.
                </p>
                <button
                  onClick={propose}
                  disabled={busy || !instruction.trim()}
                  className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
                >
                  {busy ? "Drafting…" : "Propose edit"}
                </button>
              </div>
            </>
          ) : (
            <div>
              <div className="mb-2 text-sm font-medium text-slate-900">
                Proposed {TARGET_LABEL[proposal.target]} — review before approving
              </div>
              {proposal.malformed && (
                <div className="mb-2 rounded bg-amber-50 px-3 py-1.5 text-xs text-amber-700">
                  The assistant didn’t return a clean proposal format — review the full text carefully.
                </div>
              )}
              <pre className="max-h-80 overflow-y-auto whitespace-pre-wrap rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800">
                {proposal.proposed}
              </pre>
              {proposal.rationale && (
                <p className="mt-2 text-sm text-slate-600">
                  <span className="font-medium text-slate-700">What changed: </span>
                  {proposal.rationale}
                </p>
              )}
              {proposal.flags.length > 0 && (
                <ul className="mt-2 list-disc pl-5 text-xs text-amber-700">
                  {proposal.flags.map((f, i) => (
                    <li key={i}>{f}</li>
                  ))}
                </ul>
              )}
              <div className="mt-3 flex items-center gap-2">
                <button
                  onClick={approve}
                  disabled={busy}
                  className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  {busy ? "Applying…" : "Approve & apply"}
                </button>
                <button
                  onClick={askForRewrite}
                  disabled={busy}
                  className="rounded-md border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  Ask for a rewrite
                </button>
              </div>
              <p className="mt-2 text-xs text-slate-400">
                Approving adopts this text under your own review. The prior version is snapshotted so
                you can undo.
              </p>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
