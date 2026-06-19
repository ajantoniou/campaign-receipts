/* ─── Title marketability metrics (attorney-facing labels) ───
   Risk score alone is ambiguous — we expose actionable counts and a plain label.
   NOT a legal opinion; attorney verifies indexed records before closing.
*/

export type MarketabilityTone = "clear" | "verify" | "curative";

export interface TitleMetrics {
  activeLienCount: number;
  criticalDefectCount: number;
  majorDefectCount: number;
  curativeItemCount: number;
  highNoiseIndex: boolean;
  /** Internal 0–100 from persona pipeline — shown only as secondary context */
  legacyRiskScore: number;
  marketabilityLabel: string;
  marketabilityDetail: string;
  tone: MarketabilityTone;
}

export function computeTitleMetrics(input: {
  riskScore?: number;
  liens?: Array<{ status?: string }>;
  defects?: Array<{ severity?: string }>;
  /** Visible (clustered) checklist count from the attorney action plan. */
  actionPlanTotal?: number;
  /** Auto-resolved (released + paired) lien rows — shown as "system already
   *  handled N" credit so the attorney sees what they DON'T need to do. */
  autoResolvedReleased?: number;
  /** Total raw lien rows before clustering — used to surface "N raw rows" hint. */
  rawLienCount?: number;
  /** Active SDs that ARE the current owner's purchase-money mortgage —
   *  legally active liens but not curative items. Excluded from the
   *  marketability tone computation. */
  purchaseMoneyMortgageCount?: number;
}): TitleMetrics {
  // Active liens NET of the current owner's purchase-money mortgage — that
  // SD doesn't need a release for THIS closing (it pays off when the owner
  // sells next, not now). Founder note 2026-05-24: the mortgage co-travels
  // with the deed.
  const purchaseMoneyExcluded = input.purchaseMoneyMortgageCount ?? 0;
  const rawActive = (input.liens || []).filter((l) => l.status === "active").length;
  const activeLienCount = Math.max(0, rawActive - purchaseMoneyExcluded);
  const criticalDefectCount = (input.defects || []).filter((d) => d.severity === "critical").length;
  const majorDefectCount = (input.defects || []).filter((d) => d.severity === "major").length;
  // Prefer the clustered action plan total when available — falling back to
  // raw active lien count produced unreadable copy ("636 items on your
  // closing checklist"). The clustered plan is one item per lender + tax
  // bucket + image-pull cluster, typically <20 even for messy parcels.
  const hasClusteredPlan = input.actionPlanTotal !== undefined && input.actionPlanTotal !== null;
  const highNoiseIndex = !hasClusteredPlan && rawActive >= 25;
  const curativeItemCount = hasClusteredPlan
    ? input.actionPlanTotal!
    : criticalDefectCount + majorDefectCount + (highNoiseIndex ? 0 : activeLienCount);
  const autoResolved = input.autoResolvedReleased ?? 0;

  let tone: MarketabilityTone = "clear";
  let marketabilityLabel = "Clear — no curative items flagged";
  let marketabilityDetail =
    "Indexed records show no active liens or major defects requiring attorney action before closing.";

  if (curativeItemCount > 0 || activeLienCount > 0) {
    // Phrase the active-lien detail honestly: cluster count when we have it
    // (the action plan already grouped by lender), otherwise raw row count.
    const lienHint =
      activeLienCount > 0
        ? ` · ${activeLienCount} active lien record${activeLienCount === 1 ? "" : "s"} in index (grouped by lender below)`
        : "";
    const autoHint = autoResolved > 0
      ? ` · ${autoResolved} already auto-resolved by Cliros`
      : "";

    if (criticalDefectCount >= 2 || activeLienCount >= 3 || (input.riskScore ?? 0) >= 70) {
      tone = "curative";
      if (highNoiseIndex) {
        marketabilityLabel = "Needs review — noisy index match";
        marketabilityDetail =
          `${rawActive} raw active lien index row${rawActive === 1 ? "" : "s"} matched before attorney-action clustering. ` +
          `This is not ${rawActive} legal curative item${rawActive === 1 ? "" : "s"}; the report needs image/ranking review before delivery.`;
      } else {
        marketabilityLabel = "Curative work likely before closing";
        marketabilityDetail =
          `${curativeItemCount} clustered checklist item${curativeItemCount === 1 ? "" : "s"}${lienHint}${autoHint}. ` +
          `Each item targets a lender or tax authority — Cliros pre-resolves released-and-paired liens automatically. Index alone is not a title opinion.`;
      }
    } else {
      tone = "verify";
      marketabilityLabel = "Items to verify";
      marketabilityDetail =
        `${curativeItemCount} clustered checklist item${curativeItemCount === 1 ? "" : "s"}${lienHint}${autoHint}. ` +
        `Attorney review of indexed records recommended before client delivery.`;
    }
  }

  return {
    activeLienCount,
    criticalDefectCount,
    majorDefectCount,
    curativeItemCount,
    highNoiseIndex,
    legacyRiskScore: input.riskScore ?? 0,
    marketabilityLabel,
    marketabilityDetail,
    tone,
  };
}

export function marketabilityBadgeClass(tone: MarketabilityTone): string {
  if (tone === "clear") return "bg-emerald-50 text-emerald-800 border-emerald-200";
  if (tone === "verify") return "bg-amber-50 text-amber-800 border-amber-200";
  return "bg-red-50 text-red-800 border-red-200";
}

export function marketabilityListBadgeClass(tone: MarketabilityTone): string {
  if (tone === "clear") return "bg-green-50 text-green-700 border-green-200";
  if (tone === "verify") return "bg-amber-50 text-amber-700 border-amber-200";
  return "bg-red-50 text-red-700 border-red-200";
}

/** Compact label for report list rows */
export function marketabilityShortLabel(metrics: TitleMetrics): string {
  if (metrics.tone === "clear") return "Clear";
  if (metrics.highNoiseIndex) return "Needs review";
  const n = metrics.curativeItemCount;
  if (metrics.tone === "verify") return n > 0 ? `${n} to verify` : "Verify";
  return n > 0 ? `${n} curative` : "Curative";
}
