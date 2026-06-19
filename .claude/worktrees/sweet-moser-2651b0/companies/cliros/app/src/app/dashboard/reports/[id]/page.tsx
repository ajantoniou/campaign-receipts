"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import {
  computeTitleMetrics,
  marketabilityBadgeClass,
} from "@/lib/title-metrics";
import {
  prepareChainForDisplay,
  formatInstrumentLabel,
  CHAIN_DISPLAY_YEARS,
} from "@/lib/chain-display";
import { gscccaInstrumentDeepLink } from "@/lib/ga-county-resources";
import ReportAssistant from "@/components/ReportAssistant";

/* ─── Report detail page ───
   Shows the full title search package on one screen:
     - Header with risk score and download buttons
     - Plain-English summary
     - Timeline of conveyances (visual chain of title)
     - Liens grouped by active / released with full citation
     - Defects with severity color coding
     - Data-source provenance footer
*/

interface LienView {
  id?: string;
  type: string;
  amount?: number;
  creditor?: string;
  debtor?: string;
  date?: string;
  recordedDate?: string;
  releasedDate?: string;
  status: string;
  bookPage?: string;
  instrumentNumber?: string;
  notes?: string;
  referencedBookPage?: string;
  pull_image_required?: boolean;
  stale_flag?: string;
}

interface ChainEntry {
  grantor: string;
  grantee: string;
  recordedDate?: string;
  date?: string;
  type?: string;
  instrument?: string;
  book?: string;
  page?: string;
  bookPage?: string;
  consideration?: number;
}

interface DefectView {
  type?: string;
  title?: string;
  severity: string;
  description: string;
  recommendation?: string;
}

interface ActionPlanItemView {
  id: string;
  priority: "critical" | "major" | "minor";
  actionType: string;
  title: string;
  description: string;
  responsibleParty: string;
  vaultRef?: string;
  bookPage?: string;
  statuteCitation?: string;
  links: {
    gsccca?: string;
    countyTax?: string;
    mailto?: string;
    copyText?: string;
  };
  status: "open" | "done";
}

interface ActionPlanView {
  items: ActionPlanItemView[];
  summary: {
    total: number;
    critical: number;
    major: number;
    minor: number;
    estDaysCurative: string;
    autoResolvedReleased?: number;
    lenderClusterCount?: number;
  };
  narrative?: {
    text: string;
    source: "llm" | "deterministic";
    cost_cents: number;
  };
}

interface ReportDetail {
  id: string;
  status: string;
  risk_score: number;
  tier: string;
  is_free_trial: boolean;
  paid_at: string | null;
  created_at: string;
  completed_at: string | null;
  chain_of_title: ChainEntry[];
  chain_breaks: string[];
  years_searched: number;
  liens: LienView[];
  easements: Array<{ type: string; description: string }>;
  defects: DefectView[];
  summary: string;
  data_sources: Record<string, boolean>;
  aol_draft?: string | null;
  client_report_draft?: string | null;
  pipeline_stage?: string;
  last_error?: string | null;
  billed?: boolean;
  refund_reason?: string | null;
  property: { full_address: string; county: string; state: string };
}

const REFUND_REASON_LABELS: Record<string, string> = {
  PARCEL_NOT_FOUND: "We couldn't locate this parcel in the county tax database.",
  PANEL_KILL: "Our quality panel flagged the indexed records as incoherent — vesting deed and active liens didn't reconcile.",
  MAX_ATTEMPTS: "The search exhausted retries against the county records system.",
  BILLING_FAILED: "Card on file could not be charged before the search ran.",
};

function formatDate(raw?: string): string {
  if (!raw) return "—";
  const d = new Date(raw);
  if (isNaN(d.getTime())) return raw;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatMoney(amount?: number): string | null {
  if (!amount || amount <= 0) return null;
  return `$${amount.toLocaleString()}`;
}

function borrowerFromNotes(notes?: string): string | null {
  if (!notes) return null;
  const m = notes.match(/Borrower:\s*([^·]+)/i);
  return m && m[1].trim() && m[1].trim().toLowerCase() !== "unknown" ? m[1].trim() : null;
}

function isUnknownBreak(line: string): boolean {
  return /\bUnknown\b/i.test(line);
}

interface StageBadge {
  stage: string;
  status: "pass" | "fail" | "pending";
  composite: number | null;
  scores?: Record<string, number> | null;
  fixes?: string[];
  cost_cents?: number;
  attempt?: number;
}

interface ReportInsights {
  imagery: { streetviewUrl?: string; mapUrl?: string };
  stages: StageBadge[];
  ai_spend_cents: number;
  pipeline_stage: string;
}

const STAGE_LABELS: Record<string, string> = {
  chain_analysis: "Chain",
  lien_analysis: "Liens",
  defect_review: "Defects",
  aol_lock: "AOL",
};

const DOSSIER_DOCS = [
  { doc: "title", label: "Title Search Report", note: "Chain, liens, defects" },
  { doc: "commitment", label: "Title Commitment Summary", note: "Schedules A, B-1, B-2" },
  { doc: "aol", label: "Attorney Opinion Letter", note: "Fannie Mae B7-2-06 draft" },
  { doc: "deed", label: "Draft Warranty Deed", note: "Attorney-review draft" },
  { doc: "settlement", label: "Settlement Statement", note: "CD / ALTA-style draft" },
  { doc: "pt61", label: "PT-61 Transfer Tax", note: "Georgia transfer form draft" },
  { doc: "seller_affidavit", label: "Seller's Affidavit of Title", note: "Closing-day affidavit" },
  { doc: "form_1099s", label: "IRS Form 1099-S", note: "Seller-transfer reporting draft" },
  { doc: "owners_affidavit", label: "Owner's Policy Affidavit", note: "Title-insurance affidavit" },
  { doc: "homeowner", label: "Client Closing Brief", note: "Plain-English client PDF" },
] as const;

export default function ReportDetailPage() {
  const params = useParams();
  const reportId = params.id as string;
  const [report, setReport] = useState<ReportDetail | null>(null);
  const [insights, setInsights] = useState<ReportInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [fbRating, setFbRating] = useState<"up" | "down" | null>(null);
  const [fbComment, setFbComment] = useState("");
  const [fbSubmitting, setFbSubmitting] = useState(false);
  const [fbSubmitted, setFbSubmitted] = useState(false);
  const [fbError, setFbError] = useState<string | null>(null);
  const [aolDraft, setAolDraft] = useState("");
  const [clientDraft, setClientDraft] = useState("");
  const [draftSaving, setDraftSaving] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [sourcesLoading, setSourcesLoading] = useState(false);
  const [rawArtifacts, setRawArtifacts] = useState<Array<{
    vaultId: string;
    category: string;
    filename: string;
    sizeBytes: number;
  }>>([]);
  const [actionPlan, setActionPlan] = useState<ActionPlanView | null>(null);
  const [doneActions, setDoneActions] = useState<Set<string>>(new Set());
  const [showFullChain, setShowFullChain] = useState(false);
  const betaMode = process.env.NEXT_PUBLIC_CLIROS_BETA_MODE === "true";

  useEffect(() => {
    if (!reportId) return;
    try {
      const raw = localStorage.getItem(`cliros-done-actions-${reportId}`);
      if (raw) setDoneActions(new Set(JSON.parse(raw) as string[]));
    } catch { /* */ }
  }, [reportId]);

  function markActionDone(actionId: string) {
    setDoneActions((prev) => {
      const next = new Set(prev);
      next.add(actionId);
      localStorage.setItem(`cliros-done-actions-${reportId}`, JSON.stringify([...next]));
      return next;
    });
  }

  async function copyText(text: string) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      /* fallback ignored */
    }
  }

  async function authHeaders(): Promise<Record<string, string>> {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {};
  }

  async function downloadSources() {
    setSourcesLoading(true);
    try {
      const resp = await fetch(`/api/reports/${reportId}/sources`, {
        credentials: "include",
        headers: await authHeaders(),
      });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        alert(err.error || "Could not download source data");
        return;
      }
      const blob = await resp.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Cliros_Sources_${reportId}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setSourcesLoading(false);
    }
  }

  async function saveDrafts() {
    setDraftSaving(true);
    setDraftSaved(false);
    try {
      const resp = await fetch(`/api/reports/${reportId}/drafts`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json", ...(await authHeaders()) },
        body: JSON.stringify({ aol_draft: aolDraft, client_report_draft: clientDraft }),
      });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        alert(err.error || "Could not save drafts");
        return;
      }
      setDraftSaved(true);
      setTimeout(() => setDraftSaved(false), 2500);
    } finally {
      setDraftSaving(false);
    }
  }

  async function regeneratePdfs() {
    setRegenerating(true);
    try {
      const resp = await fetch(`/api/reports/${reportId}/regenerate`, {
        method: "POST",
        credentials: "include",
        headers: await authHeaders(),
      });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        alert(err.detail || err.error || "Could not regenerate PDFs");
        return;
      }
      alert("PDFs regenerated — open deliverables again to download the updated files.");
    } finally {
      setRegenerating(false);
    }
  }

  async function submitFeedback() {
    if (!fbRating && !fbComment.trim()) {
      setFbError("Pick a thumb or leave a note before submitting.");
      return;
    }
    setFbSubmitting(true); setFbError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const resp = await fetch(`/api/reports/${reportId}/feedback`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}),
        },
        body: JSON.stringify({
          rating: fbRating || "neutral",
          comment: fbComment.trim() || undefined,
        }),
      });
      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        setFbError(err.error || "Could not submit feedback. Try again?");
      } else {
        setFbSubmitted(true);
      }
    } catch (e: unknown) {
      setFbError(e instanceof Error ? e.message : "Network error");
    } finally {
      setFbSubmitting(false);
    }
  }

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { window.location.href = "/login"; return; }

      const { data: row } = await supabase
        .from("search_reports")
        .select("*, properties(full_address, county, state)")
        .eq("id", reportId)
        .eq("user_id", session.user.id)
        .single();

      if (row) {
        const detail = {
          ...row,
          property: row.properties as { full_address: string; county: string; state: string },
        } as unknown as ReportDetail;
        setReport(detail);
        setAolDraft(detail.aol_draft || "");
        setClientDraft(detail.client_report_draft || "");
      }

      try {
        const planResp = await fetch(`/api/reports/${reportId}/action-plan`, {
          credentials: "include",
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (planResp.ok) {
          setActionPlan((await planResp.json()) as ActionPlanView);
        }
      } catch (e) {
        console.warn("action plan fetch failed:", e);
      }

      try {
        const resp = await fetch(`/api/reports/${reportId}/insights`, {
          credentials: "include",
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (resp.ok) {
          const data = (await resp.json()) as ReportInsights;
          setInsights(data);
        }
      } catch (e) {
        console.warn("insights fetch failed:", e);
      }

      // Pull raw source artifacts (GSCCCA snapshots, court records, parcel
      // anchor) from the sources manifest so we can render per-file
      // download links. The manifest itself is small JSON; the actual
      // files are signed-URL fetched via /api/reports/[id]/vault.
      try {
        const srcResp = await fetch(`/api/reports/${reportId}/sources`, {
          credentials: "include",
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (srcResp.ok) {
          const pkg = await srcResp.json();
          const arts = (pkg.rawSourceArtifacts || []) as Array<{
            vaultId: string;
            category: string;
            filename: string;
            sizeBytes: number;
          }>;
          setRawArtifacts(arts);
        }
      } catch (e) {
        console.warn("raw artifacts fetch failed:", e);
      }

      setLoading(false);
    }
    load();
  }, [reportId]);

  if (loading) {
    return <div className="flex items-center justify-center min-h-[60vh]"><div className="animate-pulse text-muted">Loading report...</div></div>;
  }

  if (!report) {
    return (
      <div className="text-center py-20">
        <p className="text-muted">Report not found</p>
        <Link href="/dashboard/reports" className="text-accent mt-2 inline-block">Back to reports</Link>
      </div>
    );
  }

  const liens = report.liens || [];
  const chainRaw = report.chain_of_title || [];
  const chainDisplay = prepareChainForDisplay(chainRaw, {
    years: showFullChain ? 999 : CHAIN_DISPLAY_YEARS,
    maxVisible: showFullChain ? 9999 : 15,
  });
  const chain = chainDisplay.visible;
  const activeLiens = liens.filter((l) => l.status === "active");
  const releasedLiens = liens.filter((l) => l.status === "released");
  // Stale legacy reports stored "Unknown" chain breaks before the parser was
  // fixed. Hide those at display time so we never show false-positive defects.
  const realBreaks = (report.chain_breaks || []).filter((b) => !isUnknownBreak(b));
  const defects = report.defects || [];

  const metrics = computeTitleMetrics({
    riskScore: report.risk_score,
    liens,
    defects,
    actionPlanTotal: actionPlan?.summary.total,
    autoResolvedReleased: (actionPlan?.summary as { autoResolvedReleased?: number })?.autoResolvedReleased,
    rawLienCount: (actionPlan?.summary as { rawLienCount?: number })?.rawLienCount,
    purchaseMoneyMortgageCount: (actionPlan?.summary as { purchaseMoneyMortgageCount?: number })?.purchaseMoneyMortgageCount,
  });
  const marketBadge = marketabilityBadgeClass(metrics.tone);

  return (
    <div className="max-w-4xl mx-auto">
      <Link href="/dashboard/reports" className="text-sm text-muted hover:text-foreground mb-4 inline-flex items-center gap-1">
        <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
        </svg>
        Back to Reports
      </Link>

      {/* BETA disclaimer — visible at the top of every report during beta.
          Removes implied-reliance liability and sets expectations clearly. */}
      {betaMode && (
        <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900 leading-relaxed">
          <span className="font-bold uppercase tracking-wider mr-2">Beta</span>
          This report is provided free during preview for feedback purposes.
          Cliros is an informational research tool — the licensed attorney of record
          remains responsible for verifying every record before issuing an opinion
          or rendering services to a client. Please use the feedback box at the
          bottom of this page to flag anything missed or wrong.
        </div>
      )}

      {/* No-charge banner when the pipeline ended in an unverifiable state.
          Replaces the generic "blocked" UX with a clear "no charge applied"
          outcome per founder policy 2026-05-23. */}
      {report.billed === false && (
        <div className="mb-6 rounded-lg border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-900">
          <div className="font-semibold text-emerald-900 mb-1">
            Address could not be fully verified — no charge applied
          </div>
          <p className="text-emerald-900/90 leading-relaxed">
            {(report.refund_reason && REFUND_REASON_LABELS[report.refund_reason]) ||
              "We couldn't complete this search to our quality bar, so we credited the report back to your balance."}
            {" "}Your report credit has been restored. You can{" "}
            <Link href="/dashboard/new" className="underline font-semibold">
              try a different address
            </Link>{" "}
            or email{" "}
            <a href="mailto:support@cliros.ai" className="underline font-semibold">
              support@cliros.ai
            </a>{" "}
            if you believe this address should resolve.
          </p>
        </div>
      )}

      {/* Property imagery + persona stage badges */}
      {insights && (insights.imagery.streetviewUrl || insights.imagery.mapUrl || insights.stages.some((s) => s.status !== "pending")) && (
        <div className="bg-white rounded-xl border border-border p-6 mb-6 overflow-hidden">
          {(insights.imagery.streetviewUrl || insights.imagery.mapUrl) && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
              {insights.imagery.streetviewUrl ? (
                <div className="relative rounded-lg overflow-hidden border border-border aspect-[16/10] bg-surface">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={insights.imagery.streetviewUrl} alt="Street View" className="w-full h-full object-cover" />
                  <div className="absolute inset-x-0 bottom-0 px-3 py-1.5 bg-foreground/80 text-white text-[10px] uppercase tracking-wider">Street View</div>
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-border aspect-[16/10] flex items-center justify-center text-xs text-muted p-4 text-center">Street View imagery not available for this address</div>
              )}
              {insights.imagery.mapUrl ? (
                <div className="relative rounded-lg overflow-hidden border border-border aspect-[16/10] bg-surface">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={insights.imagery.mapUrl} alt="Parcel Map" className="w-full h-full object-cover" />
                  <div className="absolute inset-x-0 bottom-0 px-3 py-1.5 bg-foreground/80 text-white text-[10px] uppercase tracking-wider">Parcel Map</div>
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-border aspect-[16/10] flex items-center justify-center text-xs text-muted">Parcel map unavailable</div>
              )}
            </div>
          )}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted mr-2">QC Chain</span>
            {insights.stages.map((s) => {
              const label = STAGE_LABELS[s.stage] || s.stage;
              const cls = s.status === "pass"
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : s.status === "fail"
                ? "bg-red-50 text-red-700 border-red-200"
                : "bg-gray-50 text-gray-500 border-gray-200";
              const tip = s.composite !== null
                ? `${label}: composite ${s.composite}/10 · attempt ${s.attempt}${s.fixes && s.fixes.length > 0 ? "\nFixes: " + s.fixes.join("; ") : ""}`
                : `${label}: pending`;
              return (
                <span key={s.stage} title={tip} className={`text-[11px] font-medium px-2.5 py-1 rounded-full border ${cls}`}>
                  {s.status === "pass" ? "✓" : s.status === "fail" ? "↻" : "○"} {label}
                  {s.composite !== null && (
                    <span className="ml-1.5 font-mono text-[10px] opacity-80">{s.composite}</span>
                  )}
                </span>
              );
            })}
            {insights.ai_spend_cents > 0 && (
              <span className="ml-auto text-[10px] text-muted">AI spend: ${(insights.ai_spend_cents / 100).toFixed(2)}</span>
            )}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white rounded-xl border border-border p-6 mb-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{report.property?.full_address}</h1>
            <p className="text-sm text-muted mt-1">
              {report.property?.county && `${report.property.county} County, `}{report.property?.state || "GA"}
              {" · "}Generated {formatDate(report.completed_at || report.created_at)}
              {" · "}{report.years_searched || 25}-year search
            </p>
          </div>
          <div className="text-right shrink-0 max-w-xs">
            <span className={`text-xs font-semibold px-3 py-1.5 rounded-full border inline-block ${marketBadge}`}>
              {metrics.marketabilityLabel}
            </span>
            <p className="text-[10px] text-muted mt-2 leading-snug">{metrics.marketabilityDetail}</p>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-border">
          <div className="flex flex-wrap items-baseline justify-between gap-3 mb-3">
            <div>
              <p className="text-xs font-medium text-muted uppercase tracking-wide">Title-closing dossier</p>
              <p className="text-xs text-muted mt-1">All 10 named PDFs. Open any card to generate or download the latest version.</p>
            </div>
            <button
              type="button"
              onClick={downloadSources}
              disabled={sourcesLoading}
              className="border border-border text-foreground font-medium px-4 py-2 rounded-lg hover:bg-surface transition text-xs disabled:opacity-50"
            >
              {sourcesLoading ? "Preparing…" : "Raw Source JSON"}
            </button>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {DOSSIER_DOCS.map((item, idx) => (
              <a
                key={item.doc}
                href={`/api/reports/${reportId}/download?doc=${item.doc}`}
                target="_blank"
                rel="noopener noreferrer"
                className="group rounded-lg border border-border bg-surface/30 px-4 py-3 hover:border-accent/50 hover:bg-accent/[0.04] transition"
              >
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-white border border-border text-[10px] font-mono text-muted group-hover:text-accent">
                    {String(idx + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground leading-snug">{item.label}</p>
                    <p className="text-[11px] text-muted mt-0.5 leading-snug">{item.note}</p>
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Source documents vault — per-file signed-URL downloads of the
          raw GSCCCA + federal-court + parcel-anchor snapshots the
          pipeline persisted during the search. Attorneys can pull any
          individual artifact to verify our work. */}
      {rawArtifacts.length > 0 && (
        <div className="bg-white rounded-xl border border-border p-6 mb-6">
          <div className="flex items-baseline justify-between gap-3 mb-4">
            <div>
              <h2 className="font-bold text-foreground">Source documents</h2>
              <p className="text-xs text-muted mt-1">
                Raw index pulls retained in your matter vault. Click any file to download a fresh signed link (expires in 60 seconds).
              </p>
            </div>
            <span className="text-xs font-mono text-muted">{rawArtifacts.length} file{rawArtifacts.length === 1 ? "" : "s"}</span>
          </div>
          <ul className="space-y-2">
            {rawArtifacts.map((art) => {
              const catLabel = ({
                deeds: "GSCCCA deed index",
                liens: "GSCCCA lien index",
                court_records: "Federal court records",
                other: "Parcel anchor / supplementary",
                generated: "Generated PDF",
              } as Record<string, string>)[art.category] || art.category;
              const sizeKb = art.sizeBytes ? Math.max(1, Math.round(art.sizeBytes / 1024)) : null;
              return (
                <li key={art.vaultId} className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg border border-border hover:bg-surface/30 transition">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate">{art.filename}</p>
                    <p className="text-xs text-muted">{catLabel}{sizeKb ? ` · ${sizeKb.toLocaleString()} KB` : ""}</p>
                  </div>
                  <a
                    href={`/api/reports/${reportId}/vault?docId=${encodeURIComponent(art.vaultId)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-semibold text-accent hover:underline whitespace-nowrap"
                  >
                    Download →
                  </a>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Attorney workbench — closing checklist */}
      {actionPlan && (
        <div className="bg-white rounded-xl border border-border p-6 mb-6">
          <div className="flex flex-wrap items-baseline justify-between gap-3 mb-4">
            <div>
              <h2 className="font-bold text-foreground">Closing checklist</h2>
              {actionPlan.summary.total > 0 ? (
                <p className="text-xs text-muted mt-1">
                  {actionPlan.summary.critical > 0 && (
                    <span className="text-red-700 font-medium">{actionPlan.summary.critical} critical · </span>
                  )}
                  {actionPlan.summary.major > 0 && (
                    <span className="text-amber-700 font-medium">{actionPlan.summary.major} major · </span>
                  )}
                  {actionPlan.summary.minor > 0 && (
                    <span>{actionPlan.summary.minor} minor · </span>
                  )}
                  est. {actionPlan.summary.estDaysCurative} days curative
                </p>
              ) : (
                <p className="text-xs text-muted mt-1">No curative actions — review deliverables and issue AOL.</p>
              )}
            </div>
            <span className="text-xs font-mono text-muted">{actionPlan.summary.total} item{actionPlan.summary.total === 1 ? "" : "s"}</span>
          </div>
          {actionPlan.narrative?.text && (
            <div className="mb-4 rounded-lg border border-accent/20 bg-accent/[0.03] px-4 py-3">
              <p className="text-sm text-foreground leading-relaxed">{actionPlan.narrative.text}</p>
              {actionPlan.narrative.source === "deterministic" && (
                <p className="text-[10px] text-muted mt-2 italic">
                  Quick summary — LLM narrative not generated for this report (budget or unavailability).
                </p>
              )}
            </div>
          )}
          {actionPlan.items.length > 0 && (
            <ol className="space-y-3">
              {actionPlan.items.map((item) => {
                const isDone = doneActions.has(item.id);
                const priorityClass =
                  item.priority === "critical"
                    ? "border-red-200 bg-red-50/30"
                    : item.priority === "major"
                      ? "border-amber-200 bg-amber-50/30"
                      : "border-border bg-surface/50";
                return (
                  <li
                    key={item.id}
                    className={`p-4 rounded-lg border ${priorityClass} ${isDone ? "opacity-60" : ""}`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-muted mr-2">
                          {item.actionType.replace(/_/g, " ")}
                        </span>
                        <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                          item.priority === "critical" ? "bg-red-600 text-white" :
                          item.priority === "major" ? "bg-amber-600 text-white" : "bg-gray-500 text-white"
                        }`}>
                          {item.priority}
                        </span>
                        <p className={`font-semibold text-sm mt-1 ${isDone ? "line-through" : ""}`}>{item.title}</p>
                        <p className="text-xs text-muted mt-1">{item.description}</p>
                        <div className="flex flex-wrap gap-3 mt-2 text-[10px] font-mono text-muted">
                          {item.vaultRef && <span className="bg-surface px-1.5 py-0.5 rounded border">{item.vaultRef}</span>}
                          {item.bookPage && <span>Book {item.bookPage}</span>}
                          {item.statuteCitation && <span>{item.statuteCitation}</span>}
                        </div>
                      </div>
                      <span className="text-[10px] text-muted capitalize shrink-0">{item.responsibleParty.replace(/_/g, " ")}</span>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-3">
                      {item.links.gsccca && (
                        <a
                          href={item.links.gsccca}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs border border-border px-3 py-1 rounded-lg hover:bg-surface"
                        >
                          Open GSCCCA
                        </a>
                      )}
                      {item.links.countyTax && (
                        <a
                          href={item.links.countyTax}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs border border-border px-3 py-1 rounded-lg hover:bg-surface"
                        >
                          County tax portal
                        </a>
                      )}
                      {item.links.mailto && (
                        <a
                          href={item.links.mailto}
                          className="text-xs border border-border px-3 py-1 rounded-lg hover:bg-surface"
                        >
                          {item.actionType === "tax_commissioner_check" ? "Email tax commissioner" : "Compose email"}
                        </a>
                      )}
                      {item.links.copyText && (
                        <button
                          type="button"
                          onClick={() => copyText(item.links.copyText!)}
                          className="text-xs border border-border px-3 py-1 rounded-lg hover:bg-surface"
                        >
                          Copy request
                        </button>
                      )}
                      {!isDone && (
                        <button
                          type="button"
                          onClick={() => markActionDone(item.id)}
                          className="text-xs text-accent px-3 py-1 rounded-lg hover:bg-accent/5"
                        >
                          Mark done
                        </button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      )}

      {/* Editable drafts before PDF render */}
      <div className="bg-white rounded-xl border border-border p-6 mb-6">
        <div className="flex items-baseline justify-between gap-4 mb-4">
          <div>
            <h2 className="font-bold text-foreground">Edit before PDF</h2>
            <p className="text-xs text-muted mt-1">
              Plain-text drafts — save, then regenerate PDFs. Signature block and source schedule are added automatically to the AOL.
            </p>
          </div>
          <Link href="/dashboard/settings" className="text-xs text-accent hover:underline shrink-0">
            Firm & letter contact →
          </Link>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-foreground mb-1">Attorney Opinion Letter</label>
            <textarea
              value={aolDraft}
              onChange={(e) => setAolDraft(e.target.value)}
              rows={14}
              className="w-full px-3 py-2 border border-border rounded-lg text-xs font-mono leading-relaxed outline-none focus:border-accent"
              placeholder="AOL body text…"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-foreground mb-1">Client report addendum</label>
            <textarea
              value={clientDraft}
              onChange={(e) => setClientDraft(e.target.value)}
              rows={14}
              className="w-full px-3 py-2 border border-border rounded-lg text-xs font-mono leading-relaxed outline-none focus:border-accent"
              placeholder="Optional note appended to the client PDF closing section…"
            />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3 mt-4">
          <button
            type="button"
            onClick={saveDrafts}
            disabled={draftSaving}
            className="bg-primary text-white font-semibold px-5 py-2 rounded-lg text-sm disabled:opacity-50"
          >
            {draftSaving ? "Saving…" : "Save drafts"}
          </button>
          <button
            type="button"
            onClick={async () => { await saveDrafts(); await regeneratePdfs(); }}
            disabled={regenerating || draftSaving}
            className="border border-border font-medium px-5 py-2 rounded-lg text-sm hover:bg-surface disabled:opacity-50"
          >
            {regenerating ? "Regenerating PDFs…" : "Save & regenerate PDFs"}
          </button>
          {draftSaved && <span className="text-sm text-green-600">Drafts saved</span>}
        </div>
      </div>

      {/* Summary */}
      <div className="bg-white rounded-xl border border-border p-6 mb-6">
        <h2 className="font-bold text-foreground mb-3">Executive Summary</h2>
        <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">{report.summary}</p>
      </div>

      {/* Chain of Title — visual timeline */}
      {chainDisplay.totalCount > 0 && (
        <div className="bg-white rounded-xl border border-border p-6 mb-6">
          <div className="flex items-baseline justify-between mb-2">
            <h2 className="font-bold text-foreground">Chain of Title</h2>
            <span className="text-xs text-muted">
              {chainDisplay.recentSorted.length} in last {CHAIN_DISPLAY_YEARS} yrs
              {chainDisplay.olderCount > 0 && !showFullChain ? ` · ${chainDisplay.olderCount} older in full report` : ""}
            </span>
          </div>
          <p className="text-xs text-muted mb-4">
            Most recent first. GSCCCA indexes one party per row — &quot;Unknown&quot; or lot-only entries are index gaps, not recorded ambiguities. Pull deed images (Book/Page) to confirm grantor and grantee.
            {chainDisplay.filteredJunkCount > 0 && (
              <span className="block mt-1 text-amber-800/90">
                {chainDisplay.filteredJunkCount} index row{chainDisplay.filteredJunkCount === 1 ? "" : "s"} hidden (self-transfers, numeric-only parties).
              </span>
            )}
          </p>

          <ol className="relative border-l-2 border-border ml-3 space-y-5">
            {chain.map((e, i) => {
              const date = e.recordedDate || e.date;
              const instrument = formatInstrumentLabel(e);
              const bookPage = e.bookPage || (e.book && e.page ? `${e.book}-${e.page}` : "");
              const grantor = e.grantor && e.grantor !== "Unknown" ? e.grantor : "— (pull deed image)";
              const grantee = e.grantee && e.grantee !== "Unknown" ? e.grantee : "— (pull deed image)";
              return (
                <li key={`${bookPage}-${date}-${i}`} className="ml-6">
                  <span className="absolute -left-[7px] mt-1.5 h-3 w-3 rounded-full bg-primary ring-2 ring-white" />
                  <div className="flex flex-wrap items-baseline gap-x-3">
                    <p className="text-xs font-mono text-muted">{formatDate(date)}</p>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-primary bg-primary/5 px-2 py-0.5 rounded">
                      {instrument}
                    </span>
                  </div>
                  <p className="mt-1 text-sm">
                    <span className="font-medium">{grantor}</span>
                    <span className="text-muted mx-2">→</span>
                    <span className="font-medium">{grantee}</span>
                  </p>
                  <p className="text-xs text-muted mt-0.5 font-mono flex flex-wrap items-baseline gap-x-2">
                    {bookPage && <span>Book {bookPage}</span>}
                    {e.consideration ? <span>· {formatMoney(e.consideration)}</span> : null}
                    {bookPage && (
                      <a
                        href={gscccaInstrumentDeepLink({
                          bookPage,
                          county: report.property?.county || undefined,
                        })}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-accent hover:underline normal-case"
                        title="Open GSCCCA Real Estate Index at this book/page (uses your GSCCCA login)"
                      >
                        · View in GSCCCA ↗
                      </a>
                    )}
                  </p>
                </li>
              );
            })}
          </ol>

          {(chainDisplay.hiddenRecentCount > 0 || chainDisplay.olderCount > 0) && !showFullChain && (
            <button
              type="button"
              onClick={() => setShowFullChain(true)}
              className="mt-4 text-sm text-accent font-medium hover:underline"
            >
              Show all {chainDisplay.totalCount} conveyances
              {chainDisplay.olderCount > 0 ? ` (includes ${chainDisplay.olderCount} older than ${CHAIN_DISPLAY_YEARS} years)` : ""}
            </button>
          )}
          {showFullChain && (chainDisplay.olderCount > 0 || chainDisplay.hiddenRecentCount > 0) && (
            <button
              type="button"
              onClick={() => setShowFullChain(false)}
              className="mt-4 text-sm text-muted hover:underline"
            >
              Collapse to last {CHAIN_DISPLAY_YEARS} years
            </button>
          )}

          {realBreaks.length > 0 && (
            <div className="mt-5 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-xs font-bold text-amber-800 mb-1">Chain inconsistencies to verify ({realBreaks.length})</p>
              <ul className="space-y-1">
                {realBreaks.map((b, i) => (
                  <li key={i} className="text-xs text-amber-800/90">{b}</li>
                ))}
              </ul>
            </div>
          )}
          {realBreaks.length === 0 && (report.chain_breaks || []).length > 0 && (
            <p className="mt-5 text-xs text-muted italic">
              {(report.chain_breaks || []).length} index gap{(report.chain_breaks || []).length === 1 ? "" : "s"} (grantor/grantee not in name index — not a real break). Pull deed images to confirm parties.
            </p>
          )}
        </div>
      )}

      {/* Liens — Active */}
      {activeLiens.length > 0 && (
        <div className="bg-white rounded-xl border border-border p-6 mb-6">
          <div className="flex items-baseline justify-between mb-4">
            <h2 className="font-bold text-foreground">Active Liens &amp; Encumbrances</h2>
            <span className="text-xs font-medium px-2 py-0.5 rounded bg-red-50 text-red-700">{activeLiens.length} active</span>
          </div>
          <div className="space-y-3">
            {activeLiens.map((l, i) => {
              const borrower = borrowerFromNotes(l.notes) || l.debtor;
              const lender = l.creditor && l.creditor !== "(lender not in index)" ? l.creditor : null;
              return (
                <div key={l.id || i} className="p-4 rounded-lg border border-red-100 bg-red-50/40">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="font-semibold text-foreground capitalize">{l.type.replace(/_/g, " ")}</p>
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-red-600 text-white">
                      Active
                    </span>
                  </div>
                  <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-2 text-xs">
                    <div>
                      <p className="text-muted uppercase tracking-wider text-[10px]">Recorded</p>
                      <p className="text-foreground font-medium">{formatDate(l.recordedDate || l.date)}</p>
                    </div>
                    <div>
                      <p className="text-muted uppercase tracking-wider text-[10px]">Book / Page</p>
                      <p className="text-foreground font-medium font-mono">{l.bookPage || "—"}</p>
                    </div>
                    <div>
                      <p className="text-muted uppercase tracking-wider text-[10px]">Amount</p>
                      <p className="text-foreground font-medium">{formatMoney(l.amount) || "Not in index"}</p>
                    </div>
                    <div>
                      <p className="text-muted uppercase tracking-wider text-[10px]">Lender / Creditor</p>
                      <p className="text-foreground font-medium truncate" title={lender || ""}>{lender || "Pull deed image"}</p>
                    </div>
                  </div>
                  {borrower && (
                    <p className="mt-2 text-xs text-muted">Borrower: <span className="text-foreground">{borrower}</span></p>
                  )}
                  {(l.pull_image_required || !lender) && (
                    <p className="mt-2 text-xs font-medium text-amber-800 bg-amber-50 inline-block px-2 py-0.5 rounded">
                      Pull deed image — parties incomplete in index
                    </p>
                  )}
                  {l.bookPage && (
                    <p className="mt-2 text-xs">
                      <a
                        href={gscccaInstrumentDeepLink({
                          bookPage: l.bookPage,
                          county: report.property?.county || undefined,
                        })}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-accent font-medium hover:underline"
                        title="Open GSCCCA Real Estate Index at this book/page (uses your GSCCCA login)"
                      >
                        View in GSCCCA ↗
                      </a>
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Liens — Released */}
      {releasedLiens.length > 0 && (
        <div className="bg-white rounded-xl border border-border p-6 mb-6">
          <div className="flex items-baseline justify-between mb-4">
            <h2 className="font-bold text-foreground">Released / Cancelled Liens</h2>
            <span className="text-xs text-muted">{releasedLiens.length} released</span>
          </div>
          <div className="grid sm:grid-cols-2 gap-2">
            {releasedLiens.map((l, i) => (
              <div key={l.id || i} className="p-3 rounded-lg bg-surface border border-border text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-medium capitalize">{l.type.replace(/_/g, " ")}</span>
                  <span className="text-[10px] uppercase tracking-wider text-emerald-700 font-bold">Released</span>
                </div>
                <p className="mt-1 text-muted">
                  Book {l.bookPage || "—"} · {formatDate(l.recordedDate || l.date)}
                </p>
                {l.referencedBookPage && (
                  <p className="text-muted">Releases SD {l.referencedBookPage}</p>
                )}
                {l.stale_flag && (
                  <p className="text-amber-700 mt-1">Stale flag: {l.stale_flag}</p>
                )}
                {l.bookPage && (
                  <a
                    href={gscccaInstrumentDeepLink({
                      bookPage: l.bookPage,
                      county: report.property?.county || undefined,
                    })}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block mt-1 text-accent hover:underline"
                  >
                    View in GSCCCA ↗
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Defects */}
      {defects.length > 0 && (
        <div className="bg-white rounded-xl border border-border p-6 mb-6">
          <h2 className="font-bold text-foreground mb-3">Title Defects &amp; Items to Address ({defects.length})</h2>
          <div className="space-y-3">
            {defects.map((d, i) => {
              const sevClass =
                d.severity === "critical" ? "border-red-300 bg-red-50/60" :
                d.severity === "major" ? "border-amber-300 bg-amber-50/60" :
                d.severity === "minor" ? "border-blue-300 bg-blue-50/60" :
                "border-border bg-surface";
              const badge =
                d.severity === "critical" ? "bg-red-600 text-white" :
                d.severity === "major" ? "bg-amber-500 text-white" :
                d.severity === "minor" ? "bg-blue-500 text-white" :
                "bg-muted text-white";
              return (
                <div key={i} className={`p-4 rounded-lg border ${sevClass}`}>
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="font-semibold text-foreground">{d.title || d.type}</p>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${badge}`}>
                      {d.severity}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-foreground/80 leading-relaxed">{d.description}</p>
                  {d.recommendation && (
                    <p className="mt-2 text-xs text-foreground/70"><span className="font-semibold">Recommendation:</span> {d.recommendation}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Grounded, read-only Q&A over this report (UPL-bounded; audit-passed) */}
      <ReportAssistant
        reportId={reportId}
        onApplied={(t, text) => {
          if (t === "aol_draft") setAolDraft(text);
          else setClientDraft(text);
        }}
      />

      {/* Data sources provenance */}
      <div className="bg-white rounded-xl border border-border p-6 mb-6">
        <h2 className="font-bold text-foreground mb-3">Data Sources</h2>
        <div className="flex flex-wrap gap-2">
          {report.data_sources && Object.entries(report.data_sources).map(([source, used]) => (
            <span key={source} className={`text-xs px-3 py-1.5 rounded-full font-medium ${
              used ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-gray-50 text-gray-500 border border-gray-200"
            }`}>
              {used ? "✓" : "—"} {source.toUpperCase()}
            </span>
          ))}
        </div>
      </div>

      {/* Beta feedback — emails Alex on submit. The whole point of the beta. */}
      <div className="bg-gradient-to-br from-sky-50 to-white rounded-xl border border-sky-200 p-6 mb-10">
        <div className="flex items-baseline justify-between mb-1">
          <h2 className="font-bold text-foreground">How was this report?</h2>
          <span className="text-[10px] uppercase tracking-wider font-bold text-sky-700">Beta feedback</span>
        </div>
        <p className="text-sm text-muted mb-4">
          Help us tune the engine. Anything that looks wrong, missing, slow, or unclear — tell us in one line.
          Goes straight to Alex&apos;s inbox; we read every reply.
        </p>

        {fbSubmitted ? (
          <div className="p-4 rounded-lg bg-emerald-50 border border-emerald-200 text-sm text-emerald-800">
            Thanks — got it. We&apos;ll fold this into the next iteration.
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 mb-3">
              <button
                type="button"
                onClick={() => setFbRating("up")}
                className={`px-4 py-2 rounded-lg border text-sm font-medium transition ${
                  fbRating === "up"
                    ? "bg-emerald-50 border-emerald-300 text-emerald-700"
                    : "bg-white border-border text-foreground/70 hover:border-emerald-200"
                }`}
              >
                Useful
              </button>
              <button
                type="button"
                onClick={() => setFbRating("down")}
                className={`px-4 py-2 rounded-lg border text-sm font-medium transition ${
                  fbRating === "down"
                    ? "bg-red-50 border-red-300 text-red-700"
                    : "bg-white border-border text-foreground/70 hover:border-red-200"
                }`}
              >
                Missed something
              </button>
            </div>
            <textarea
              value={fbComment}
              onChange={(e) => setFbComment(e.target.value)}
              placeholder="What was missed, wrong, or could be better? (one line is enough)"
              rows={3}
              maxLength={4000}
              className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-sky-300"
            />
            {fbError && (
              <p className="mt-2 text-xs text-red-600">{fbError}</p>
            )}
            <div className="flex items-center justify-between mt-3">
              <p className="text-[11px] text-muted">
                Replies go to alex@cliros.ai — we usually respond same day.
              </p>
              <button
                type="button"
                onClick={submitFeedback}
                disabled={fbSubmitting}
                className="bg-primary text-white font-semibold px-5 py-2 rounded-lg hover:bg-primary-dark transition text-sm disabled:opacity-50"
              >
                {fbSubmitting ? "Sending…" : "Send feedback"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
