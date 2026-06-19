/* ─── Attorney action plan builder ───
   Deterministic checklist from defects, liens, and chain breaks.
   Grounded in Maggie/Reena/David Harrington curative workflow — no extra LLM.
*/

import type { TitleSearchReport, TitleDefect, LienRecord } from "./types";
import { buildSourceIndex } from "./source-package";
import {
  buildClerkCallout,
  buildLenderReleaseMailto,
  buildPayoffRequestText,
  buildTaxCommissionerMailto,
  getCountyResource,
  gscccaInstrumentSearchUrl,
  gscccaLienSearchUrl,
} from "./ga-county-resources";
import type { SupabaseClient } from "@supabase/supabase-js";

export type ActionType =
  | "verify_release"
  | "pull_record"
  | "tax_commissioner_check"
  | "verify_chain"
  | "curative_action"
  | "underwriter_exception";

export type ActionPriority = "critical" | "major" | "minor" | "info";
export type ResponsibleParty = "attorney" | "lender" | "seller" | "tax_commissioner";

export interface ActionPlanItem {
  id: string;
  priority: ActionPriority;
  actionType: ActionType;
  title: string;
  description: string;
  responsibleParty: ResponsibleParty;
  vaultRef?: string;
  bookPage?: string;
  instrumentNumber?: string;
  statuteCitation?: string;
  links: {
    gsccca?: string;
    countyTax?: string;
    mailto?: string;
    copyText?: string;
    /** County-specific "needs a human phone call" instruction, rendered when a
     *  curative fact (e.g. §44-14-80 maturity date, an unindexed grantee)
     *  cannot be resolved from the online GSCCCA index. Carries the verified
     *  clerk phone OR a literal [MUST-VERIFY] token — never a guessed number. */
    clerkCallout?: string;
  };
  status: "open" | "done";
}

export interface AttorneyActionPlan {
  items: ActionPlanItem[];
  summary: {
    total: number;                  // visible items after clustering
    critical: number;
    major: number;
    minor: number;
    estDaysCurative: string;
    /** Liens with status='released' that paired cleanly to a recorded CANC/REL
     *  via reconcileSecurityDeedLiens upstream — these need no attorney action. */
    autoResolvedReleased?: number;
    /** Active liens collapsed under one or more lender clusters. */
    activeLienCount?: number;
    /** Total raw lien rows in the underlying report — useful for "show all N". */
    rawLienCount?: number;
    /** Distinct creditor groups represented in the visible action items. */
    lenderClusterCount?: number;
    /** Active SDs co-recorded with the vesting deed — the current owner's
     *  purchase-money mortgage. Counted toward active liens but surfaced
     *  as INFO, not curative. */
    purchaseMoneyMortgageCount?: number;
  };
  generatedAt: string;
}

type DefectRow = TitleDefect & {
  statute_citation?: string;
  book_page_citation?: string;
};

type LienRow = LienRecord & {
  pull_image_required?: boolean;
  stale_flag?: string;
  debtor?: string;
  isPurchaseMoney?: boolean;
};

function vaultRefByBookPage(
  index: Array<Record<string, unknown>>,
  bookPage?: string,
): string | undefined {
  if (!bookPage) return undefined;
  const norm = bookPage.replace(/\s/g, "").toLowerCase();
  const hit = index.find((r) => {
    const bp = String(r.bookPage || "").replace(/\s/g, "").toLowerCase();
    return bp && bp === norm;
  });
  return hit?.vaultRef as string | undefined;
}

function estCurativeDays(
  critical: number,
  major: number,
  /** True when at least one open defect could require quiet title (a chain
   *  break or an unreconciled out-conveyance). The base estimate is the
   *  best-case image-review/corrective-instrument path; if quiet title is on
   *  the table, the realistic aggregate window extends to ~120 days and the
   *  summary must say so — an aggregate cannot be shorter than the longest
   *  mandatory single path it contains (audit blocker). */
  quietTitlePossible = false,
): string {
  const base =
    critical >= 2 ? "14–30" :
    critical === 1 ? "7–14" :
    major >= 3 ? "5–10" :
    major >= 1 ? "3–5" :
    "1–2";
  return quietTitlePossible
    ? `${base} if the chain issues clear on image review; up to 120 days if quiet title (OCGA §23-3-60) is required`
    : base;
}

export function buildAttorneyActionPlan(report: TitleSearchReport): AttorneyActionPlan {
  const chain = report.chainOfTitle.entries as unknown as Record<string, unknown>[];
  const liens = report.liens as unknown as LienRow[];
  const defects = report.defects as unknown as DefectRow[];
  const index = buildSourceIndex(chain, liens as unknown as Record<string, unknown>[]);
  const county = report.parcel?.county || report.address.county;
  const countyRes = getCountyResource(county);
  const address = report.address.fullAddress;
  const parcelId = report.parcel?.parcelId;
  const items: ActionPlanItem[] = [];
  let n = 0;

  const push = (item: Omit<ActionPlanItem, "id" | "status">) => {
    n++;
    items.push({ ...item, id: `action-${n}`, status: "open" });
  };

  // ── Clustering pass ──
  // A property with many refinancings produces a row per SD/CANC. Without
  // clustering, the attorney sees hundreds of "obtain release" items — one
  // founder report had 729 lien rows from only 4 distinct creditors. Cluster
  // active liens by normalized lender name so the visible checklist is the
  // count of LENDERS to chase, not records to process.
  let autoResolvedReleased = 0;
  let activeLienCount = 0;
  let purchaseMoneyCount = 0;
  const taxLiens: LienRow[] = [];
  const pullImageRows: LienRow[] = [];
  const purchaseMoneyByLender = new Map<string, { creditor: string; rows: LienRow[] }>();
  const activeByLender = new Map<string, { creditor: string; rows: LienRow[]; type: LienRecord["type"] }>();
  const releasedAgedByLender = new Map<string, { creditor: string; rows: LienRow[] }>();

  const normalizeCreditor = (c?: string): string => {
    if (!c) return "(unknown)";
    return c
      .toUpperCase()
      .replace(/\b(N\.?A\.?|NA|FSB|FA|FED(\.|ERAL)?|SAVINGS|BANK|TRUST|CO(MPANY)?\.?|CORP(ORATION)?\.?|INC\.?|LLC|LLP|LP|LTD\.?)\b/g, "")
      .replace(/[^A-Z0-9 ]/g, " ")
      .replace(/\s+/g, " ")
      .trim() || c.toUpperCase();
  };

  for (const lien of liens) {
    // Released-and-cleanly-paired SDs are auto-resolved upstream by
    // reconcileSecurityDeedLiens in search-orchestrator.ts — they have a
    // releasedDate and need no attorney action. Count and skip.
    if (lien.status === "released" && !lien.stale_flag?.includes("ancient")) {
      autoResolvedReleased++;
      continue;
    }

    if (lien.status === "released" && lien.stale_flag?.includes("ancient")) {
      const key = normalizeCreditor(lien.creditor);
      const bucket = releasedAgedByLender.get(key) || { creditor: lien.creditor || "Unknown lender", rows: [] };
      bucket.rows.push(lien);
      releasedAgedByLender.set(key, bucket);
      continue;
    }

    if (lien.status !== "active") continue;
    activeLienCount++;

    // Purchase-money mortgage co-recorded with the current owner's vesting
    // deed: still an active lien legally, but NOT a curative item for the
    // attorney's closing. Cluster separately, render as info, never count
    // toward the lender clusters that require releases.
    if (lien.isPurchaseMoney) {
      purchaseMoneyCount++;
      const key = normalizeCreditor(lien.creditor);
      const bucket = purchaseMoneyByLender.get(key) || { creditor: lien.creditor || "Unknown lender", rows: [] };
      bucket.rows.push(lien);
      purchaseMoneyByLender.set(key, bucket);
      continue;
    }

    if (lien.type === "tax") {
      taxLiens.push(lien);
      continue;
    }

    const needsImage =
      lien.pull_image_required ||
      !lien.creditor ||
      lien.creditor.includes("not in index") ||
      lien.creditor === "(lender not in index)";
    if (needsImage) {
      pullImageRows.push(lien);
      continue;
    }

    const key = normalizeCreditor(lien.creditor);
    const bucket = activeByLender.get(key) || { creditor: lien.creditor || "Unknown lender", rows: [], type: lien.type };
    bucket.rows.push(lien);
    activeByLender.set(key, bucket);
  }

  // ── Emit clustered items ──

  // Tax liens — one per parcel (the county is the same), so collapse to ONE item.
  if (taxLiens.length > 0) {
    const bps = taxLiens.map((l) => l.bookPage || l.referencedBookPage).filter(Boolean).slice(0, 3);
    const firstBp = bps[0];
    push({
      priority: "critical",
      actionType: "tax_commissioner_check",
      title: `Verify tax status — ${countyRes.county} County (${taxLiens.length} record${taxLiens.length === 1 ? "" : "s"})`,
      description:
        `Active tax lien${taxLiens.length === 1 ? "" : "s"} of record (${bps.join(", ")}${taxLiens.length > 3 ? `, +${taxLiens.length - 3} more` : ""}). ` +
        `Cross-check ALL with county tax commissioner before closing — one mailto covers the whole parcel.`,
      responsibleParty: "tax_commissioner",
      vaultRef: vaultRefByBookPage(index, firstBp),
      bookPage: firstBp,
      links: {
        countyTax: countyRes.taxPortalUrl,
        mailto: buildTaxCommissionerMailto({ county, parcelId, address, reportId: report.id }),
      },
    });
  }

  // Pull-image cluster — collapse to one "pull N records" item.
  if (pullImageRows.length > 0) {
    const sampleBp = pullImageRows[0].bookPage || pullImageRows[0].referencedBookPage;
    const sampleVault = vaultRefByBookPage(index, sampleBp);
    const sampleBps = pullImageRows
      .map((l) => l.bookPage || l.referencedBookPage)
      .filter(Boolean)
      .slice(0, 5)
      .join(", ");
    push({
      priority: "major",
      actionType: "pull_record",
      title: `Pull ${pullImageRows.length} recorded image${pullImageRows.length === 1 ? "" : "s"} — lender not in index`,
      description:
        `${pullImageRows.length} lien record${pullImageRows.length === 1 ? "" : "s"} ${pullImageRows.length === 1 ? "has" : "have"} incomplete parties in the GSCCCA name index. ` +
        `Pull image${pullImageRows.length === 1 ? "" : "s"} (e.g. ${sampleBps}${pullImageRows.length > 5 ? ", …" : ""}) to identify lenders before requesting payoffs.`,
      responsibleParty: "attorney",
      vaultRef: sampleVault,
      bookPage: sampleBp,
      links: { gsccca: gscccaInstrumentSearchUrl() },
    });
  }

  // Active by-lender clusters — one item per lender.
  for (const [, bucket] of activeByLender) {
    const rows = bucket.rows;
    const firstBp = rows[0].bookPage || rows[0].referencedBookPage;
    const vaultRef = vaultRefByBookPage(index, firstBp);
    const totalAmt = rows.reduce((acc, r) => acc + (r.amount || 0), 0);
    const bps = rows.map((r) => r.bookPage || r.referencedBookPage).filter(Boolean).slice(0, 5);
    const lienType = bucket.type;
    const borrower = rows[0].debtor || (rows[0].notes?.match(/Borrower:\s*([^·]+)/i)?.[1]?.trim());

    const summaryLine = rows.length === 1
      ? `Active ${lienType} of record${totalAmt > 0 ? ` ($${totalAmt.toLocaleString()})` : ""}. Request payoff and recorded cancellation.`
      : `${rows.length} active ${lienType} records under same lender${totalAmt > 0 ? ` (totaling $${totalAmt.toLocaleString()})` : ""}. ` +
        `Request consolidated payoff covering ${bps.join(", ")}${rows.length > 5 ? `, +${rows.length - 5} more` : ""}.`;

    push({
      priority: lienType === "irs" || lienType === "judgment" ? "critical" : "major",
      actionType: "verify_release",
      title: rows.length === 1
        ? `Obtain release — ${bucket.creditor || lienType}`
        : `Obtain ${rows.length} releases — ${bucket.creditor || lienType}`,
      description: summaryLine,
      responsibleParty: "lender",
      vaultRef,
      bookPage: firstBp,
      instrumentNumber: rows[0].instrumentNumber,
      links: {
        gsccca: gscccaLienSearchUrl(),
        mailto: buildLenderReleaseMailto({
          creditor: bucket.creditor,
          bookPage: firstBp,
          amount: totalAmt || undefined,
          borrower,
          address,
          reportId: report.id,
        }),
        copyText: buildPayoffRequestText({
          creditor: bucket.creditor,
          bookPage: bps.join(", "),
          amount: totalAmt || undefined,
          borrower,
          address,
          reportId: report.id,
        }),
      },
    });
  }

  // Purchase-money mortgage clusters — one info item per lender. This is the
  // CURRENT OWNER's mortgage (co-recorded with their vesting deed); it gets
  // paid off when this owner sells next, not at the closing the inquiring
  // attorney is preparing for. We surface it so the attorney can see it
  // (origination date, amount, lender) but flag clearly as "no action needed
  // unless this closing involves THIS owner selling."
  for (const [, bucket] of purchaseMoneyByLender) {
    const rows = bucket.rows;
    const firstBp = rows[0].bookPage;
    const totalAmt = rows.reduce((acc, r) => acc + (r.amount || 0), 0);
    const earliest = rows
      .map((r) => r.recordedDate)
      .filter(Boolean)
      .sort()[0];
    push({
      priority: "info",
      actionType: "verify_release",
      title: rows.length === 1
        ? `Current owner's mortgage — ${bucket.creditor}`
        : `Current owner's mortgages — ${bucket.creditor} (${rows.length} records)`,
      description:
        `Active purchase-money mortgage co-recorded with the current owner's vesting deed` +
        (earliest ? ` on ${earliest}` : "") +
        (totalAmt > 0 ? ` ($${totalAmt.toLocaleString()})` : "") +
        `. This is the owner's home loan — it pays off when they sell. ` +
        `No action needed unless this closing involves the current owner as seller, ` +
        `in which case request a payoff statement and use the cluster above.`,
      responsibleParty: "attorney",
      vaultRef: vaultRefByBookPage(index, firstBp),
      bookPage: firstBp,
      links: { gsccca: gscccaLienSearchUrl() },
    });
  }

  // Aged-released clusters — one underwriter-exception per lender, not per row.
  for (const [, bucket] of releasedAgedByLender) {
    const rows = bucket.rows;
    const firstBp = rows[0].bookPage || rows[0].referencedBookPage;
    push({
      priority: "minor",
      actionType: "underwriter_exception",
      title: rows.length === 1
        ? `Except aged released lien — ${bucket.creditor}`
        : `Except ${rows.length} aged released liens — ${bucket.creditor}`,
      description: rows.length === 1
        ? `Released lien (${firstBp || "—"}) — release of record; no longer an encumbrance. Confirm the recorded cancellation and that the underwriter excepts it from coverage in AOL Schedule A.`
        : `${rows.length} aged released liens under ${bucket.creditor}, each released of record. Single Schedule A exception covers the cluster.`,
      responsibleParty: "attorney",
      vaultRef: vaultRefByBookPage(index, firstBp),
      bookPage: firstBp,
      links: {},
    });
  }

  for (const br of report.chainOfTitle.breaks || []) {
    if (/\bUnknown\b/i.test(br)) continue;
    push({
      priority: "major",
      actionType: "verify_chain",
      title: "Verify chain break",
      description: br,
      responsibleParty: "attorney",
      links: { gsccca: gscccaInstrumentSearchUrl() },
    });
  }

  for (const d of defects) {
    if (d.severity === "info") continue;
    const bp = d.book_page_citation;
    // Attach a county-specific "needs a human phone call" callout when the
    // curative fact depends on a field the online GSCCCA index does NOT carry.
    // Two known index-gap cases: (1) a §44-14-80 reversion turns on the security
    // deed's MATURITY DATE, which lives only on the recorded image; (2) an
    // 'Unknown'/unindexed grantee the book/page resolver couldn't name. The
    // callout carries a VERIFIED clerk phone or a literal [MUST-VERIFY] token.
    const text = `${d.description} ${d.recommendation}`.toLowerCase();
    const needsMaturityImage =
      /44-14-80/.test(text) && /\bmaturity\b/.test(text);
    const needsGranteeImage =
      /\bunknown\b/.test(text) && /\bgrantee\b/.test(text);
    let clerkCallout: string | undefined;
    if (needsMaturityImage) {
      const firstBp = (bp || "").match(/(\d+)-(\d+)/);
      clerkCallout = buildClerkCallout({
        county,
        book: firstBp?.[1],
        page: firstBp?.[2],
        missingField: "maturity date",
        why:
          "maturity dates appear only on the recorded image, not the online name index; " +
          "the §44-14-80 reversion is keyed to maturity, not the deed's recording age",
      });
    } else if (needsGranteeImage) {
      const firstBp = (bp || "").match(/(\d+)-(\d+)/);
      clerkCallout = buildClerkCallout({
        county,
        book: firstBp?.[1],
        page: firstBp?.[2],
        missingField: "grantee name",
        why:
          "the GSCCCA name index returns this grantee as 'Unknown' and the $0 book/page " +
          "resolver could not name it; the party must be read off the recorded image",
      });
    }
    push({
      priority: d.severity === "critical" ? "critical" : d.severity === "major" ? "major" : "minor",
      actionType: "curative_action",
      title: d.title,
      description: d.description,
      responsibleParty: "attorney",
      vaultRef: vaultRefByBookPage(index, bp),
      bookPage: bp,
      statuteCitation: d.statute_citation,
      links: {
        gsccca: gscccaInstrumentSearchUrl(),
        copyText: d.recommendation,
        ...(clerkCallout ? { clerkCallout } : {}),
      },
    });
  }

  // Suppress operational tasks (pull-image, verify-chain) whose underlying
  // book/pages are ALREADY covered by a curative_action lifted from a defect.
  // A defect's own recommendation tells the attorney to pull that image / verify
  // that break, so emitting a separate task double-counts the same work at a
  // different severity — that is what made the plan summary ("N critical, M
  // major") disagree with the defect list. Collect every book/page any
  // curative_action defect references, then drop redundant operational tasks.
  // Extract GSCCCA book/page tokens (book 4-6 digits, page 1-4 digits) while
  // EXCLUDING ISO date fragments — a naive /\d+-\d+/ matches "2001-09" out of
  // "2001-09-17", which polluted the coverage set and let a duplicate
  // verify-chain task survive next to its parent defect. Strip YYYY-MM-DD dates
  // first, then match book/page with word boundaries.
  const extractBookPages = (s?: string): string[] => {
    const noDates = (s || "").replace(/\b\d{4}-\d{2}-\d{2}\b/g, " ");
    return [...noDates.matchAll(/\b\d{4,6}-\d{1,4}\b/g)].map((m) => m[0]);
  };
  const defectCoveredBookPages = new Set<string>();
  for (const it of items) {
    if (it.actionType !== "curative_action") continue;
    // Defects often carry their book/pages in the DESCRIPTION prose, not the
    // bookPage field (which is frequently null). Harvest from both, else the
    // covered-set is empty and the dedup never fires (the verify_chain /
    // pull_record duplicates survive and inflate the count vs the AOL body).
    for (const bp of extractBookPages(it.bookPage)) defectCoveredBookPages.add(bp);
    for (const bp of extractBookPages(it.description)) defectCoveredBookPages.add(bp);
  }
  const isCoveredByDefect = (it: (typeof items)[number]): boolean => {
    const all = [...extractBookPages(it.description), ...extractBookPages(it.bookPage)];
    return all.length > 0 && all.every((bp) => defectCoveredBookPages.has(bp));
  };
  const operationalCovered = items.filter(
    (it) =>
      (it.actionType === "verify_chain" || it.actionType === "pull_record") &&
      isCoveredByDefect(it)
  );

  const seen = new Set<string>();
  const deduped = items
    .filter((it) => !operationalCovered.includes(it))
    .filter((it) => {
      const key = `${it.actionType}:${it.title}:${it.bookPage || ""}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

  const rank: Record<ActionPriority, number> = { critical: 0, major: 1, minor: 2, info: 3 };
  deduped.sort((a, b) => rank[a.priority] - rank[b.priority]);

  const critical = deduped.filter((i) => i.priority === "critical").length;
  const major = deduped.filter((i) => i.priority === "major").length;
  const minor = deduped.filter((i) => i.priority === "minor").length;

  // Quiet title (OCGA §23-3-60) is the worst-case curative path for a true chain
  // break or an unreconciled out-conveyance. When any open defect is of that
  // kind, the aggregate curative estimate must surface the ~120-day worst case
  // rather than only the best-case image-review window (audit blocker).
  const quietTitlePossible = defects.some((d) => {
    if (d.severity === "info") return false;
    const dType = (d as { type?: string; category?: string }).type || d.category || "";
    const t = `${dType} ${d.title || ""} ${d.description || ""} ${d.recommendation || ""}`.toLowerCase();
    return (
      /chain[\s_-]?break/.test(t) ||
      /out[\s_-]?conveyance/.test(t) ||
      /quiet[\s_-]?title/.test(t) ||
      /23-3-60/.test(t)
    );
  });

  return {
    items: deduped,
    summary: {
      total: deduped.length,
      critical,
      major,
      minor,
      estDaysCurative: estCurativeDays(critical, major, quietTitlePossible),
      autoResolvedReleased,
      activeLienCount,
      rawLienCount: liens.length,
      lenderClusterCount: activeByLender.size,
      purchaseMoneyMortgageCount: purchaseMoneyCount,
    },
    generatedAt: new Date().toISOString(),
  };
}

/** Build TitleSearchReport shape from DB row + property join for action plan. */
export function reportRowToTitleSearch(
  r: Record<string, unknown>,
  property: Record<string, unknown>,
): TitleSearchReport {
  return {
    id: String(r.id),
    userId: String(r.user_id || ""),
    address: {
      fullAddress: String(property.full_address ?? ""),
      street: String(property.street ?? ""),
      city: String(property.city ?? ""),
      state: String(property.state ?? "GA"),
      zip: String(property.zip ?? ""),
      county: String(property.county ?? ""),
    },
    parcel: {
      parcelId: String(property.parcel_id ?? ""),
      county: String(property.county ?? ""),
      state: String(property.state ?? "GA"),
      legalDescription: String(property.legal_description ?? ""),
    },
    chainOfTitle: {
      entries: (r.chain_of_title as TitleSearchReport["chainOfTitle"]["entries"]) || [],
      breaks: (r.chain_breaks as string[]) || [],
      yearsSearched: Number(r.years_searched) || 0,
      startDate: String(r.search_start_date || ""),
      endDate: String(r.search_end_date || ""),
    },
    liens: (r.liens as LienRecord[]) || [],
    easements: [],
    defects: (r.defects as TitleDefect[]) || [],
    status: "complete",
    createdAt: String(r.created_at || new Date().toISOString()),
    summary: String(r.summary || ""),
    riskScore: Number(r.risk_score) || 0,
    aolDraft: r.aol_draft ? String(r.aol_draft) : undefined,
  };
}

export async function persistAttorneyActionPlan(
  db: SupabaseClient<any, any, any>,
  reportId: string,
  report: TitleSearchReport,
): Promise<AttorneyActionPlan> {
  const plan = buildAttorneyActionPlan(report);

  // LLM narrative composer — adds one plain-English paragraph on top of the
  // clustered items so the attorney can scan in 10 seconds. Best-effort; on
  // any failure we persist the plan without a narrative and the UI shows
  // the deterministic 1-line fallback.
  try {
    const { composeActionPlanNarrative } = await import("./pipeline/action-plan-narrative");
    const { data: spend } = await db
      .from("search_reports")
      .select("ai_spend_cents")
      .eq("id", reportId)
      .maybeSingle();
    const aiCap = Number(process.env.CLIROS_AI_SPEND_CAP_CENTS || 250);
    const remaining = aiCap - ((spend?.ai_spend_cents as number) || 0);
    const narrative = await composeActionPlanNarrative(
      plan,
      report.address.fullAddress,
      remaining,
    );
    // Stuff the narrative on the plan object before persist — the column is
    // jsonb so the extra key is backward-compatible. UI reads
    // plan.narrative ?? plan.summary fallback line.
    (plan as AttorneyActionPlan & {
      narrative?: { text: string; source: "llm" | "deterministic"; cost_cents: number };
    }).narrative = {
      text: narrative.text,
      source: narrative.source,
      cost_cents: narrative.costCents,
    };
    if (narrative.costCents > 0) {
      await db
        .from("search_reports")
        .update({ ai_spend_cents: ((spend?.ai_spend_cents as number) || 0) + narrative.costCents })
        .eq("id", reportId);
    }
  } catch (err) {
    console.warn(`[persistAttorneyActionPlan] narrative compose failed for ${reportId}:`, err instanceof Error ? err.message : err);
  }

  await db.from("search_reports").update({ attorney_action_plan: plan }).eq("id", reportId);
  return plan;
}
