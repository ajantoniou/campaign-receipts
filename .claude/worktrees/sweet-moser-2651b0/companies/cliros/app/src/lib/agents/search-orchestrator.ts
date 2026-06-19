/* ─── Search Orchestrator ───
   Coordinates GSCCCA + CourtListener/PACER + Claude analysis
   into a single title search flow. Georgia-only.

   Flow:
   1. GSCCCA agent: deeds, state liens, UCC (PT-61 address search → name search)
   2. CourtListener (FREE) → federal bankruptcy + tax liens (primary)
      PACER API ($0.10/page) → fallback if CourtListener fails
   3. Claude AI: analyze all records → risk score + defects + AOL draft
   4. Store results in Supabase
*/

import { createGSCCCAAgent, type GSCCCASearchResults } from "./gsccca-http";
import { isJunkChainEntry, isJunkPartyName, isSelfTransfer } from "../chain-display";
import { createCourtListenerClient, type CourtListenerSearchResults } from "./courtlistener";
import { createPACERClient, type PACERSearchResults } from "./pacer";
import { resolveParcelAnchor, extractOwnerSearchNames, parsePriorOwnerHint, type ParcelAnchor } from "./parcel";
import { scrapeListingUrl, isSupportedListingUrl } from "./listing-scraper";
import type {
  DeedRecord,
  LienRecord,
  TitleDefect,
  ChainOfTitle,
} from "../types";

/* ─── Types ─── */

export interface SearchProgress {
  stage: "initializing" | "gsccca_search" | "pacer_search" | "ai_analysis" | "complete" | "error";
  message: string;
  progress: number; // 0-100
}

export interface TitleSearchResult {
  chainOfTitle: ChainOfTitle;
  liens: LienRecord[];
  defects: TitleDefect[];
  easements: { id: string; type: string; description: string; recordedDate: string; bookPage?: string }[];
  summary: string;
  riskScore: number;
  dataSources: {
    propmix: boolean;
    gsccca: boolean;
    courtlistener: boolean;
    pacer: boolean;
    claudeAnalysis: boolean;
  };
  propertyDetails: {
    owner: string;
    parcelNumber: string;
    propertyType: string;
    assessedValue: number | null;
    yearBuilt: string;
    lastSaleDate: string;
    lastSalePrice: number | null;
    lastSaleDocType: string;
    legalSubdivision: string;
  } | null;
  rawData: {
    gsccca?: GSCCCASearchResults;
    courtlistener?: CourtListenerSearchResults;
    pacer?: PACERSearchResults;
    parcel?: ParcelAnchor;
  };
  errors: string[];
  parcelAnchor?: ParcelAnchor;
  blocked?: boolean;
  blockedReason?: string;
}

export type ProgressCallback = (progress: SearchProgress) => void;

/** Optional attorney-supplied hints. All fields independently sharpen the
 *  search — none are required. Wired from cliros.search_reports.search_hints
 *  via the "Improve accuracy" expander on /dashboard/new. */
export interface SearchHints {
  /** Prior owner (seller on the most recent sale) — seeds GSCCCA RE name
   *  search with the surname under which the vesting deed is indexed. */
  priorOwnerName?: string | null;
  /** Most recent sale date (YYYY-MM-DD) — narrows the GSCCCA window so the
   *  vesting WD surfaces above index-page-deep refinance noise. */
  saleDate?: string | null;
  /** Buyer's loan amount in cents — sanity-checks the indexed lien total.
   *  If active SD$ exceeds loan$ by 5×, likely a surname overmatch. */
  loanAmount?: number | null;
  /** Optional active listing URL (Zillow/Redfin/Realtor.com). When present,
   *  the orchestrator scrapes JSON-LD + og: tags for sale price + date and
   *  uses them as a fallback for any hint the attorney left blank. */
  listingUrl?: string | null;
}

/* ─── Orchestrator ─── */

export async function executeFullTitleSearch(
  address: string,
  county?: string,
  onProgress?: ProgressCallback,
  hints?: SearchHints | null,
): Promise<TitleSearchResult> {
  const errors: string[] = [];
  let gscccaResults: GSCCCASearchResults | undefined;
  let pacerResults: PACERSearchResults | undefined;
  let courtlistenerResults: CourtListenerSearchResults | undefined;
  let usedCourtListener = false;

  // ── Step 0: PARCEL ANCHOR — required to prevent keyword-name-search drift ──
  onProgress?.({
    stage: "initializing",
    message: "Resolving parcel from county GIS...",
    progress: 5,
  });

  const parcelAnchor = await resolveParcelAnchor(address, county);
  if (!parcelAnchor) {
    console.warn(`[Orchestrator] No parcel found for "${address}" in county "${county || "unknown"}"`);
    return {
      chainOfTitle: { entries: [], breaks: [], yearsSearched: 0, startDate: "", endDate: "" },
      liens: [],
      defects: [],
      easements: [],
      summary:
        "Could not locate this property in the county tax parcel database. " +
        "Please verify the address spelling, ZIP code, and county. If the address is correct " +
        "but still cannot be found, the parcel may be newly subdivided, part of a larger assembled site, " +
        "or located in a county we do not yet cover.",
      riskScore: 0,
      dataSources: {
        propmix: false,
        gsccca: false,
        courtlistener: false,
        pacer: false,
        claudeAnalysis: false,
      },
      propertyDetails: null,
      rawData: {},
      errors: [`Parcel not found: ${address}`],
      blocked: true,
      blockedReason: "PARCEL_NOT_FOUND",
    };
  }

  console.log(
    `[Orchestrator] Parcel anchor: ${parcelAnchor.parcelId} | ${parcelAnchor.owner} | ${parcelAnchor.siteAddress}`
  );
  const ownerSearchNames = extractOwnerSearchNames(parcelAnchor.owner);

  // Augment with attorney-supplied prior-owner name. The vesting WD is
  // indexed under the SELLER's surname; if the attorney already knows the
  // seller (from the listing or LOI), feeding it here bypasses the
  // PT-61-then-name-search dance entirely. See the Peachtree May 23 case
  // — that report would have shipped clean with this single hint.
  // Listing-URL fallback: when the attorney pastes a Zillow/Redfin/Realtor
  // link, scrape it for last-sold-date + last-sold-price + list-price and
  // use those to fill in any hint they left blank. Never overrides what they
  // typed — typed hints always win. Scrape failure is non-fatal.
  const filledHints: SearchHints = { ...(hints || {}) };
  if (hints?.listingUrl && isSupportedListingUrl(hints.listingUrl)) {
    const listing = await scrapeListingUrl(hints.listingUrl);
    if (listing && !listing.empty) {
      if (!filledHints.saleDate && listing.lastSoldDate) {
        filledHints.saleDate = listing.lastSoldDate;
        console.log(`[Orchestrator] Listing → auto-filled saleDate=${listing.lastSoldDate}`);
      }
      // Use last-sold price OR list price as the loan-amount sanity-check
      // baseline when attorney didn't supply loan amount explicitly.
      const proxyAmount = listing.lastSoldPrice ?? listing.listPrice;
      if (!filledHints.loanAmount && proxyAmount) {
        filledHints.loanAmount = proxyAmount * 100; // cents
        console.log(`[Orchestrator] Listing → auto-filled loanAmount proxy=$${proxyAmount.toLocaleString()} (from ${listing.lastSoldPrice ? "last-sold" : "list"} price)`);
      }
      console.log(`[Orchestrator] Listing source: ${listing.source} · lastSold=${listing.lastSoldDate || "—"} $${listing.lastSoldPrice || "—"} · listPrice=$${listing.listPrice || "—"}`);
    } else {
      console.log(`[Orchestrator] Listing scrape returned empty for ${hints.listingUrl}`);
    }
  }
  // Re-bind so the rest of the function sees the enriched hints.
  hints = filledHints;

  if (hints?.priorOwnerName) {
    // parsePriorOwnerHint handles the messy free-text formats attorneys
    // actually type from the PSA: "John & Jane Smith", "Smith, John",
    // "The Smith Family Trust", "Peachtree 1314 LLC", etc. Returns just
    // the surname/distinctive tokens, no first names or stopwords.
    const priorTokens = parsePriorOwnerHint(hints.priorOwnerName);
    for (const t of priorTokens) {
      if (!ownerSearchNames.includes(t)) ownerSearchNames.push(t);
    }
    console.log(
      `[Orchestrator] Hint: prior owner '${hints.priorOwnerName}' → parsed to ${JSON.stringify(priorTokens)} for name search`
    );
  }

  console.log(`[Orchestrator] Owner search names: ${JSON.stringify(ownerSearchNames)}`);

  // ── Step 1: GSCCCA — Deeds, State Liens, UCC ──
  onProgress?.({
    stage: "gsccca_search",
    message: "Searching Georgia county records...",
    progress: 10,
  });

  try {
    const agent = createGSCCCAAgent();
    await agent.init();

    const loginOk = await agent.login();
    if (!loginOk) {
      throw new Error("GSCCCA login failed");
    }

    onProgress?.({
      stage: "gsccca_search",
      message: "Searching deeds, liens, and UCC filings...",
      progress: 25,
    });

    // Seed GSCCCA name search with owner extracted from county tax parcel.
    // This avoids the broken fallback that searched street-name keywords
    // (e.g. "PEACHTREE") as person/entity names and matched railway companies.
    // Bias the GSCCCA window from the attorney's sale-date hint, if given.
    // Vesting deed is ≤ years-since-sale old + 2yr buffer. Anything earlier
    // is historical chain depth and shouldn't dominate the name-index
    // detail-pull cap (5 per name, see gsccca-http.ts:867).
    let searchYearsOverride: number | undefined;
    if (hints?.saleDate) {
      const saleTs = new Date(hints.saleDate).getTime();
      if (!isNaN(saleTs)) {
        const yearsSinceSale = Math.max(
          2,
          Math.ceil((Date.now() - saleTs) / (365.25 * 24 * 60 * 60 * 1000)) + 2,
        );
        // Cap at 50 (the default) so the hint can only narrow, never expand.
        searchYearsOverride = Math.min(50, yearsSinceSale);
        console.log(
          `[Orchestrator] Hint: sale ${hints.saleDate} → GSCCCA search window narrowed to ${searchYearsOverride}yr (was 50)`
        );
      }
    }

    gscccaResults = await agent.searchProperty(
      address,
      parcelAnchor.county,
      ownerSearchNames,
      searchYearsOverride,
    );
    await agent.close();

    if (gscccaResults.errors.length > 0) {
      errors.push(...gscccaResults.errors.map((e) => `GSCCCA: ${e}`));
    }

    // Parcel-scoped legal-description filter. When the county GIS gave us
    // a subdivision/lot/block for THIS parcel, drop GSCCCA name-index hits
    // whose legalDescription cites a different subdivision/lot/block. The
    // name index isn't parcel-keyed, so a common surname returns deeds for
    // every property the same person ever touched. We keep rows with no
    // legalDescription (older deeds + counties that don't populate it) so
    // we don't over-filter.
    if (parcelAnchor.subdivision || parcelAnchor.subdivisionLot || parcelAnchor.subdivisionBlock) {
      const norm = (s?: string) => (s || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
      const wantSub = norm(parcelAnchor.subdivision);
      const wantLot = norm(parcelAnchor.subdivisionLot);
      const wantBlk = norm(parcelAnchor.subdivisionBlock);
      const before = gscccaResults.deeds.length;
      let droppedWrongLegal = 0;
      gscccaResults.deeds = gscccaResults.deeds.filter((d) => {
        if (!d.legalDescription) return true; // no signal → keep
        const desc = d.legalDescription.toUpperCase();
        const subMatch = desc.match(/SUBDIVISION:\s*([^,]+)/);
        const lotMatch = desc.match(/LOT:\s*([^,]+)/);
        const blkMatch = desc.match(/BLOCK:\s*([^,]+)/);
        const gotSub = norm(subMatch?.[1]);
        const gotLot = norm(lotMatch?.[1]);
        const gotBlk = norm(blkMatch?.[1]);
        // Mismatch if we can compare AND any cited field disagrees.
        if (wantSub && gotSub && gotSub !== wantSub) { droppedWrongLegal++; return false; }
        if (wantLot && gotLot && gotLot !== wantLot) { droppedWrongLegal++; return false; }
        if (wantBlk && gotBlk && gotBlk !== wantBlk) { droppedWrongLegal++; return false; }
        return true;
      });
      if (droppedWrongLegal > 0) {
        console.log(
          `[Orchestrator] Parcel-scoped filter: dropped ${droppedWrongLegal} of ${before} deeds with non-matching legal description (want sub=${wantSub || "—"} lot=${wantLot || "—"} blk=${wantBlk || "—"})`
        );
      }
    }

    onProgress?.({
      stage: "gsccca_search",
      message: `Found ${gscccaResults.deeds.length} deeds, ${gscccaResults.liens.length} liens`,
      progress: 45,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    errors.push(`GSCCCA search failed: ${msg}`);
    console.error("[Orchestrator] GSCCCA error:", err);
  }

  // ── Step 2: Federal Courts — CourtListener (free) → PACER (paid fallback) ──
  onProgress?.({
    stage: "pacer_search",
    message: "Checking federal courts for tax liens and bankruptcy...",
    progress: 50,
  });

  try {
    const ownerNameSet = new Set<string>([
      ...(gscccaResults?.ownerNames || []),
    ]);
    const ownerNames = Array.from(ownerNameSet);
    if (ownerNames.length > 0) {
      // ── Primary: CourtListener (FREE, RECAP mirror of PACER) ──
      try {
        const cl = createCourtListenerClient();
        const allCLBankruptcies: CourtListenerSearchResults["bankruptcies"] = [];
        const allCLFederalLiens: CourtListenerSearchResults["federalLiens"] = [];
        let totalCLResults = 0;

        for (const name of ownerNames.slice(0, 5)) {
          const parts = name.split(/[, ]+/);
          const lastName = parts[0];
          const firstName = parts.length > 1 ? parts[1] : undefined;

          const result = await cl.searchByName(lastName, firstName, "GA");
          allCLBankruptcies.push(...result.bankruptcies);
          allCLFederalLiens.push(...result.federalLiens);
          totalCLResults += result.totalResults;
          if (result.errors.length > 0) {
            errors.push(...result.errors);
          }
        }

        courtlistenerResults = {
          bankruptcies: allCLBankruptcies,
          federalLiens: allCLFederalLiens,
          errors: [],
          searchedAt: new Date().toISOString(),
          totalResults: totalCLResults,
          source: "courtlistener",
        };

        // Convert CourtListener results to PACER-compatible format for downstream
        pacerResults = {
          bankruptcies: allCLBankruptcies.map((bk) => ({
            caseNumber: bk.caseNumber,
            caseTitle: bk.caseTitle,
            court: bk.courtName,
            chapter: bk.chapter,
            dateFiled: bk.dateFiled,
            dateClosed: bk.dateTerminated,
            dateDischarge: undefined,
            debtor: bk.debtor,
            status: bk.status,
          })),
          federalLiens: allCLFederalLiens.map((fl) => ({
            caseNumber: fl.caseNumber,
            court: fl.courtName,
            dateFiled: fl.dateFiled,
            debtor: fl.debtor,
            creditor: fl.creditor,
            status: fl.status,
          })),
          errors: [],
          searchedAt: new Date().toISOString(),
          pagesUsed: 0, // CourtListener is free!
        };

        usedCourtListener = true;
        console.log(`[Orchestrator] CourtListener: ${allCLBankruptcies.length} bankruptcies, ${allCLFederalLiens.length} federal liens (FREE)`);

        onProgress?.({
          stage: "pacer_search",
          message: `Found ${allCLBankruptcies.length} bankruptcy records, ${allCLFederalLiens.length} federal liens (via CourtListener)`,
          progress: 65,
        });
      } catch (clErr) {
        const clMsg = clErr instanceof Error ? clErr.message : String(clErr);
        console.warn(`[Orchestrator] CourtListener failed, falling back to PACER: ${clMsg}`);
        errors.push(`CourtListener: ${clMsg}`);
      }

      // ── Fallback: PACER (paid, $0.10/page) — only if CourtListener failed ──
      if (!usedCourtListener && process.env.PACER_USERNAME && process.env.PACER_PASSWORD) {
        try {
          const pacer = createPACERClient();
          const allBankruptcies: PACERSearchResults["bankruptcies"] = [];
          const allFederalLiens: PACERSearchResults["federalLiens"] = [];
          let totalPages = 0;

          for (const name of ownerNames.slice(0, 5)) {
            const parts = name.split(/[, ]+/);
            const lastName = parts[0];
            const firstName = parts.length > 1 ? parts[1] : undefined;

            const result = await pacer.searchByName(lastName, firstName, "GA");
            allBankruptcies.push(...result.bankruptcies);
            allFederalLiens.push(...result.federalLiens);
            totalPages += result.pagesUsed;
            errors.push(...result.errors.map((e) => `PACER: ${e}`));
          }

          pacerResults = {
            bankruptcies: allBankruptcies,
            federalLiens: allFederalLiens,
            errors: [],
            searchedAt: new Date().toISOString(),
            pagesUsed: totalPages,
          };

          console.log(`[Orchestrator] PACER fallback: ${allBankruptcies.length} bankruptcies, ${allFederalLiens.length} liens ($${(totalPages * 0.10).toFixed(2)})`);

          onProgress?.({
            stage: "pacer_search",
            message: `Found ${allBankruptcies.length} bankruptcy records, ${allFederalLiens.length} federal liens (via PACER)`,
            progress: 65,
          });
        } catch (pacerErr) {
          const msg = pacerErr instanceof Error ? pacerErr.message : String(pacerErr);
          errors.push(`PACER fallback also failed: ${msg}`);
        }
      } else if (!usedCourtListener) {
        errors.push("Federal court search unavailable — no CourtListener data and PACER not configured");
        onProgress?.({
          stage: "pacer_search",
          message: "Federal court search unavailable",
          progress: 65,
        });
      }
    } else {
      onProgress?.({
        stage: "pacer_search",
        message: "No owner names found — skipping federal court search",
        progress: 65,
      });
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    errors.push(`Federal court search failed: ${msg}`);
    console.error("[Orchestrator] Federal search error:", err);
  }

  // ── Step 3: Normalize results (merge GSCCCA + federal courts) ──
  const deeds = normalizeDeeds(gscccaResults);
  const liens = normalizeLiens(gscccaResults, pacerResults, ownerSearchNames);
  const chainOfTitle = buildChainOfTitle(deeds);

  // Drop legacy duplicate-by-bookPage lien rows if any slipped through
  // (defense-in-depth on top of normalizeLiens' dedup).
  const bookSeen = new Set<string>();
  for (let i = liens.length - 1; i >= 0; i--) {
    const k = `${liens[i].bookPage || ""}|${liens[i].recordedDate || ""}|${liens[i].creditor}`;
    if (liens[i].bookPage && bookSeen.has(k)) liens.splice(i, 1);
    else if (liens[i].bookPage) bookSeen.add(k);
  }

  // Loan-amount sanity check. When the attorney told us the buyer's loan
  // amount, we can detect surname-overmatch index collisions: if total
  // ACTIVE liens exceeds the loan by 5× AND the active liens span more
  // than 6 distinct lenders, the index almost certainly returned hits
  // from another person with the same surname. We don't drop the rows
  // (attorney must see what's there) but we add a non-fatal warning to
  // the error list so the panel review flags it.
  if (hints?.loanAmount && hints.loanAmount > 0) {
    const activeLienTotalCents = liens
      .filter((l) => l.status === "active" && l.amount)
      .reduce((acc, l) => acc + Math.round((l.amount || 0) * 100), 0);
    const distinctLenders = new Set(
      liens
        .filter((l) => l.status === "active")
        .map((l) => (l.creditor || "").toUpperCase().replace(/[^A-Z0-9]/g, "")),
    );
    if (
      activeLienTotalCents > hints.loanAmount * 5 &&
      distinctLenders.size > 6
    ) {
      const msg =
        `Likely surname-overmatch: active lien total ($${(activeLienTotalCents / 100).toLocaleString()}) ` +
        `exceeds the supplied loan amount ($${(hints.loanAmount / 100).toLocaleString()}) by more than 5×, ` +
        `across ${distinctLenders.size} distinct lenders. Some indexed liens may be index collisions ` +
        `with a different person of the same surname — review carefully before issuing the AOL.`;
      errors.push(msg);
      console.warn(`[Orchestrator] ${msg}`);
    }
  }

  // ── Step 4: Claude AI Analysis ──
  onProgress?.({
    stage: "ai_analysis",
    message: "AI analyzing records for defects and risk...",
    progress: 75,
  });

  let aiAnalysis = {
    summary: "",
    riskScore: 0,
    defects: [] as TitleDefect[],
  };

  try {
    aiAnalysis = await analyzeWithClaude(address, chainOfTitle, liens, gscccaResults, pacerResults);
    onProgress?.({
      stage: "ai_analysis",
      message: "Analysis complete",
      progress: 95,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    errors.push(`AI analysis failed: ${msg}`);
    // Generate minimal summary if Claude fails
    aiAnalysis.summary = `Title search completed for ${address}. ${deeds.length} deeds found, ${liens.length} liens found. Manual review recommended.`;
    aiAnalysis.riskScore = liens.filter((l) => l.status === "active").length > 0 ? 45 : 15;
  }

  onProgress?.({
    stage: "complete",
    message: "Title search complete",
    progress: 100,
  });

  // Build property details — parcel anchor is authoritative; latestDeed fills the rest
  const latestDeed = deeds.length > 0 ? deeds[deeds.length - 1] : null;
  const propertyDetails = {
    owner: parcelAnchor.owner || latestDeed?.grantee || "",
    parcelNumber: parcelAnchor.parcelId,
    propertyType: parcelAnchor.landUseCode || "",
    assessedValue: parcelAnchor.totalAssessedValue ?? null,
    yearBuilt: "",
    lastSaleDate: latestDeed?.recordedDate || "",
    lastSalePrice: latestDeed?.consideration ?? null,
    lastSaleDocType: latestDeed?.type || "",
    legalSubdivision: [parcelAnchor.subdivision, parcelAnchor.subdivisionLot, parcelAnchor.subdivisionBlock]
      .filter(Boolean)
      .join(" / "),
  };

  // SAFETY FALLBACK (Peachtree Battle, May 2026): a report with ZERO chain
  // conveyances but one-or-more liens is structurally impossible — mortgages
  // cannot exist without an owner who granted them. This is the empty-chain
  // signature of the GSCCCA detail-pull cap displacing the vesting deed (see
  // Part A). Rather than ship a fabricated empty-chain AOL, block the report
  // as no-charge so the attorney sees "could not verify chain — no charge".
  // The pipeline's stageSearching honours result.blocked exactly like the
  // PARCEL_NOT_FOUND path in run_pipeline_tick.ts (~lines 191-205).
  const chainConveyanceCount = chainOfTitle.entries.length;
  if (chainConveyanceCount === 0 && liens.length > 0) {
    console.warn(
      `[Orchestrator] BLOCK: chain_of_title is empty (0 conveyances) but ${liens.length} lien(s) present — structurally impossible (mortgages with no owner). Marking report no-charge: CHAIN_EMPTY_LIENS_PRESENT.`
    );
    return {
      chainOfTitle,
      liens,
      defects: aiAnalysis.defects,
      easements: [],
      summary:
        "Could not verify the chain of title for this property. The records " +
        "search returned recorded liens but no vesting deed, which means the " +
        "chain cannot be confirmed. No charge has been applied.",
      riskScore: aiAnalysis.riskScore,
      dataSources: {
        propmix: false,
        gsccca: !!gscccaResults,
        courtlistener: usedCourtListener,
        pacer: !!pacerResults && !usedCourtListener,
        claudeAnalysis: aiAnalysis.summary.length > 0,
      },
      propertyDetails,
      rawData: {
        gsccca: gscccaResults,
        courtlistener: courtlistenerResults,
        pacer: pacerResults,
        parcel: parcelAnchor,
      },
      errors,
      parcelAnchor,
      blocked: true,
      blockedReason: "CHAIN_EMPTY_LIENS_PRESENT",
    };
  }

  return {
    chainOfTitle,
    liens,
    defects: aiAnalysis.defects,
    easements: [], // GSCCCA doesn't have a separate easement index; they appear in deeds
    summary: aiAnalysis.summary,
    riskScore: aiAnalysis.riskScore,
    dataSources: {
      propmix: false,
      gsccca: !!gscccaResults,
      courtlistener: usedCourtListener,
      pacer: !!pacerResults && !usedCourtListener,
      claudeAnalysis: aiAnalysis.summary.length > 0,
    },
    propertyDetails,
    rawData: {
      gsccca: gscccaResults,
      courtlistener: courtlistenerResults,
      pacer: pacerResults,
      parcel: parcelAnchor,
    },
    errors,
    parcelAnchor,
  };
}

/* ─── Normalizers ─── */

function normalizeDeeds(gsccca?: GSCCCASearchResults): DeedRecord[] {
  const deeds: DeedRecord[] = [];
  const seenBookPages = new Set<string>();
  let routedToLiens = 0;

  if (gsccca) {
    for (const [i, d] of gsccca.deeds.entries()) {
      const bp = d.bookPage || "";
      if (bp && seenBookPages.has(bp)) continue;
      if (bp) seenBookPages.add(bp);

      const deedType = classifyDeedType(d.instrumentType || "");
      if (deedType === null) {
        // This GSCCCA row is NOT a chain-of-title conveyance (e.g. Security
        // Deed, Cancellation, Easement). It will be picked up as a lien by
        // the SD-routing logic in normalizeLiens. Skip from chain.
        routedToLiens++;
        continue;
      }

      const grantor = d.grantor || "";
      const grantee = d.grantee || "";
      if (isSelfTransfer(grantor, grantee)) {
        routedToLiens++;
        continue;
      }
      if (isJunkPartyName(grantor) && isJunkPartyName(grantee)) {
        continue;
      }

      // A single-surname RE name search only surfaces the index row matching
      // the searched party; GSCCCA emits the counterparty as "Unknown". This
      // is a valid chain link (the chain-break detector skips "Unknown" pairs
      // by design) — keep both sides verbatim. Swapping the valid party into
      // the Unknown slot would mint a grantor==grantee self-transfer that
      // buildChainOfTitle then drops, silently emptying the chain (Peachtree
      // Battle empty-chain signature, May 2026).
      deeds.push({
        id: `deed-${i}`,
        type: deedType,
        bookPage: d.bookPage || undefined,
        instrumentNumber: d.instrumentNumber || undefined,
        recordedDate: d.recordedDate,
        grantor: isJunkPartyName(grantor) ? "Unknown" : grantor,
        grantee: isJunkPartyName(grantee) ? "Unknown" : grantee,
        consideration: d.consideration,
        notes: d.instrumentType ? `GSCCCA: ${d.instrumentType}` : undefined,
      });
    }
    if (routedToLiens > 0) {
      console.log(
        `[Orchestrator] Chain of title: kept ${deeds.length} conveyances; routed ${routedToLiens} non-chain instruments (SD/CANC/EASE/etc.) to liens section.`
      );
    }
  }

  return deeds;
}

function normalizeLiens(
  gsccca?: GSCCCASearchResults,
  pacer?: PACERSearchResults,
  ownerNames?: string[],
): LienRecord[] {
  const liens: LienRecord[] = [];

  // Build a set of owner-name tokens used to filter GSCCCA's broad name
  // search down to liens actually attributable to this parcel's owner.
  // Without this filter, a common surname returns hundreds of generic state
  // tax liens filed against anyone in Georgia with that name.
  const ownerTokens = new Set<string>();
  for (const n of ownerNames || []) {
    n.toUpperCase().split(/[\s,]+/).filter((w) => w.length >= 3).forEach((w) => ownerTokens.add(w));
  }
  const matchesOwner = (s: string | undefined) => {
    if (!s) return false;
    const tokens = s.toUpperCase().split(/[\s,]+/);
    return tokens.some((t) => ownerTokens.has(t));
  };

  // Security deeds / cancellations / releases from the deed search are
  // ACTUAL property-specific liens (they were filed against THIS parcel
  // because the GSCCCA name search hit an owner-of-record). Route them
  // into the liens section so the panel sees them as encumbrances, not
  // as misclassified chain entries.
  if (gsccca) {
    const seenSDBookPages = new Set<string>();
    let sdCount = 0;
    for (const [i, d] of gsccca.deeds.entries()) {
      const asLien = classifyInstrumentAsLien(d.instrumentType || "");
      if (!asLien) continue;
      const bp = d.bookPage || "";
      if (bp && seenSDBookPages.has(bp)) continue;
      if (bp) seenSDBookPages.add(bp);
      const creditor =
        d.grantee && d.grantee !== "Unknown" ? d.grantee : "(lender not in index)";
      liens.push({
        id: `sd-lien-${i}`,
        type: asLien.lienType,
        status: asLien.status,
        creditor,
        amount: d.consideration,
        recordedDate: d.recordedDate,
        bookPage: d.bookPage,
        instrumentNumber: d.instrumentNumber,
        referencedBookPage: d.referencedBookPage,
        notes:
          `From deed index: ${d.instrumentType} · Borrower: ${d.grantor || "—"}` +
          (d.referencedBookPage ? ` · References SD ${d.referencedBookPage}` : "") +
          (d.consideration ? ` · $${d.consideration.toLocaleString()}` : ""),
      });
      sdCount++;
    }
    if (sdCount > 0) {
      console.log(`[Orchestrator] Liens: routed ${sdCount} security-deed/cancellation rows from the deed index into the liens section.`);
    }

    reconcileSecurityDeedLiens(liens);
    flagPurchaseMoneySDs(liens, gsccca);
  }

  // State liens from GSCCCA — dedupe + filter to owner
  if (gsccca) {
    const seen = new Set<string>();
    let droppedDup = 0;
    let droppedNonOwner = 0;
    let droppedEmpty = 0;
    for (const [i, l] of gsccca.liens.entries()) {
      // Strip jurisdiction string out of creditor field — GSCCCA sometimes
      // writes "FULTON" (the county) into creditor for general execution
      // dockets where the actual creditor is blank.
      const creditor = l.creditor && /^(FULTON|DEKALB|COBB|GWINNETT)$/i.test(l.creditor.trim())
        ? "" : l.creditor;

      // Dedupe by composite key — same lien appearing twice in the GSCCCA
      // index (joint indexing of both parties) should collapse to one row.
      const dedupKey = `${l.bookPage || ""}|${l.recordedDate || ""}|${l.debtor || ""}|${creditor || ""}|${l.instrumentType || ""}`;
      if (seen.has(dedupKey)) { droppedDup++; continue; }
      seen.add(dedupKey);

      // Filter by owner-name match when we have an owner anchor. If the
      // debtor name doesn't overlap with the parcel owner, this is most
      // likely a false-positive surname collision (GSCCCA name index isn't
      // parcel-keyed).
      if (ownerTokens.size > 0 && l.debtor && !matchesOwner(l.debtor)) {
        droppedNonOwner++;
        continue;
      }

      // Skip liens with NO debtor name AND NO creditor — these are pure
      // index artifacts (general execution docket rows with no attribution)
      // and confuse downstream review.
      if ((!l.debtor || l.debtor.trim() === "") && (!creditor || creditor.trim() === "")) {
        droppedEmpty++;
        continue;
      }

      liens.push({
        id: `state-lien-${i}`,
        type: classifyLienType(l.instrumentType),
        status: (l.status as LienRecord["status"]) || "active",
        creditor: creditor || "(unattributed in GSCCCA index)",
        amount: l.amount,
        recordedDate: l.recordedDate,
        releasedDate: l.releasedDate,
        bookPage: l.bookPage,
        instrumentNumber: l.instrumentNumber,
        notes: l.debtor ? `Debtor: ${l.debtor}` : undefined,
      });
    }
    console.log(
      `[Orchestrator] Liens: kept ${liens.length} of ${gsccca.liens.length} (dropped ` +
      `${droppedDup} dup / ${droppedNonOwner} non-owner / ${droppedEmpty} unattributed)`
    );
  }

  // Federal liens from PACER / CourtListener — STRICT debtor-name match.
  // When we have an owner anchor, REQUIRE a verifiable debtor-name match.
  // Anything without a confirmed match is dropped (or demoted to info)
  // because publishing a federal lien defect against the wrong person
  // creates defamation/E&O exposure.
  if (pacer) {
    const seen = new Set<string>();
    let droppedNoDebtor = 0;
    let droppedNonOwner = 0;
    for (const [i, fl] of pacer.federalLiens.entries()) {
      const debtorName = fl.debtor || "";
      const dedupKey = `${fl.caseNumber || ""}|${debtorName}|${fl.dateFiled || ""}`;
      if (seen.has(dedupKey)) continue;
      seen.add(dedupKey);

      if (ownerTokens.size > 0) {
        // No debtor name → can't verify attribution → drop, don't risk defamation.
        if (!debtorName) { droppedNoDebtor++; continue; }
        if (!matchesOwner(debtorName)) { droppedNonOwner++; continue; }
      }

      liens.push({
        id: `fed-lien-${i}`,
        type: "irs",
        status: fl.status === "released" ? "released" : "active",
        creditor: fl.creditor || "United States (IRS / Federal)",
        amount: fl.amount,
        recordedDate: fl.dateFiled,
        notes: debtorName ? `Debtor: ${debtorName}${fl.caseNumber ? ` · Case ${fl.caseNumber}` : ""}` : (fl.caseNumber ? `Case ${fl.caseNumber}` : undefined),
      });
    }
    if (droppedNoDebtor + droppedNonOwner > 0) {
      console.log(
        `[Orchestrator] Federal liens: dropped ${droppedNoDebtor} (no debtor name) + ${droppedNonOwner} (debtor doesn't match owner)`
      );
    }

    // Bankruptcies — same strict rule
    for (const [i, bk] of pacer.bankruptcies.entries()) {
      if (bk.status === "open") {
        if (ownerTokens.size > 0) {
          if (!bk.debtor) continue;
          if (!matchesOwner(bk.debtor)) continue;
        }
        liens.push({
          id: `bankruptcy-${i}`,
          type: "other",
          status: "active",
          creditor: `Bankruptcy Court (Ch. ${bk.chapter})`,
          recordedDate: bk.dateFiled,
          notes: `Case #${bk.caseNumber} — ${bk.court}${bk.debtor ? ` · Debtor: ${bk.debtor}` : ""}. Open bankruptcy may affect title transferability.`,
        });
      }
    }
  }

  return liens;
}

/** Compare two grantor/grantee names with surname-first fuzzy matching.
 * GSCCCA records the same person as "EIKHOFF, CHAD E" and "EIKHOFF, CHAD EDWARD"
 * across deeds — those are the same person, not a chain break.
 */
function nameRoughlyEqual(a: string, b: string): boolean {
  const norm = (s: string) =>
    s.toUpperCase().replace(/[^A-Z\s,]/g, "").split(/[\s,]+/).filter((w) => w.length >= 2);
  const aTokens = norm(a);
  const bTokens = norm(b);
  if (aTokens.length === 0 || bTokens.length === 0) return false;
  // Surname (first token) must match exactly
  if (aTokens[0] !== bTokens[0]) return false;
  // At least one other meaningful token in common
  const aRest = new Set(aTokens.slice(1));
  return bTokens.slice(1).some((t) => aRest.has(t));
}

function buildChainOfTitle(deeds: DeedRecord[]): ChainOfTitle {
  // Drop index noise before sorting — self-transfers, numeric-only parties, etc.
  const conveyances = deeds.filter(
    (d) => !isJunkChainEntry(d as unknown as { grantor?: string; grantee?: string }),
  );

  const sorted = [...conveyances].sort(
    (a, b) => new Date(a.recordedDate).getTime() - new Date(b.recordedDate).getTime()
  );

  // Detect chain breaks — but ignore artifacts that aren't real breaks:
  //   • "Unknown" grantee from the GSCCCA index (indexing limitation, not a
  //     real defect) — skip the pair entirely
  //   • grantor == grantee on the SAME deed (security deed cancellations,
  //     name corrections) — neither row participates in chain linkage
  //   • surname-first fuzzy match (EIKHOFF, CHAD E ≈ EIKHOFF, CHAD EDWARD)
  const breaks: string[] = [];
  let prev: DeedRecord | null = null;
  for (const curr of sorted) {
    // Skip rows that are name-correction or cancellation deeds (grantor=grantee)
    const isSelfDeed =
      nameRoughlyEqual(curr.grantor || "", curr.grantee || "") ||
      (curr.grantor || "").toUpperCase() === (curr.grantee || "").toUpperCase();
    if (isSelfDeed) {
      // Self-referential — don't update prev, don't flag a break
      continue;
    }
    // Skip rows with Unknown party (GSCCCA index gap, not a real break)
    if (
      (curr.grantor || "").toUpperCase() === "UNKNOWN" ||
      (curr.grantee || "").toUpperCase() === "UNKNOWN"
    ) {
      continue;
    }

    if (prev) {
      if (!nameRoughlyEqual(prev.grantee, curr.grantor) && !nameMatch(prev.grantee.toUpperCase(), curr.grantor.toUpperCase())) {
        breaks.push(
          `Chain break between ${prev.recordedDate} and ${curr.recordedDate}: ` +
            `${prev.grantee} (grantee) does not match ${curr.grantor} (grantor)`
        );
      }
    }
    prev = curr;
  }

  const dates = sorted.map((d) => new Date(d.recordedDate).getTime()).filter((t) => !isNaN(t));
  const startDate = dates.length > 0 ? new Date(Math.min(...dates)).toISOString().split("T")[0] : "";
  const endDate = dates.length > 0 ? new Date(Math.max(...dates)).toISOString().split("T")[0] : "";
  const years = dates.length > 0
    ? Math.ceil((Math.max(...dates) - Math.min(...dates)) / (365.25 * 24 * 60 * 60 * 1000))
    : 0;

  return {
    entries: sorted,
    breaks,
    yearsSearched: Math.max(years, 25), // We search 25 years minimum
    startDate,
    endDate,
  };
}

/* ─── Claude AI Analysis ─── */

async function analyzeWithClaude(
  address: string,
  chain: ChainOfTitle,
  liens: LienRecord[],
  gsccca?: GSCCCASearchResults,
  pacer?: PACERSearchResults
): Promise<{
  summary: string;
  riskScore: number;
  defects: TitleDefect[];
}> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY not set");

  const prompt = buildAnalysisPrompt(address, chain, liens, gsccca, pacer);

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`Claude API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  const text = data.content?.[0]?.text || "";

  // Parse structured response
  return parseClaudeAnalysis(text);
}

function buildAnalysisPrompt(
  address: string,
  chain: ChainOfTitle,
  liens: LienRecord[],
  gsccca?: GSCCCASearchResults,
  _pacer?: PACERSearchResults,
): string {

  return `You are a senior title examiner analyzing a Georgia property title search for an attorney preparing an Attorney Opinion Letter (AOL).

## Property
Address: ${address}

## Chain of Title (${chain.entries.length} deeds, ${chain.yearsSearched} years searched)
${chain.entries
  .map(
    (d) =>
      `- ${d.recordedDate}: ${d.grantor} → ${d.grantee} (${d.type}${d.bookPage ? `, Book/Page: ${d.bookPage}` : ""}${d.consideration ? `, $${d.consideration.toLocaleString()}` : ""})`
  )
  .join("\n")}

Chain Breaks: ${chain.breaks.length === 0 ? "None found" : chain.breaks.join("; ")}

## Liens & Encumbrances (${liens.length} found)
${liens
  .map(
    (l) =>
      `- [${l.status.toUpperCase()}] ${l.type} lien — ${l.creditor}${l.amount ? ` ($${l.amount.toLocaleString()})` : ""}, recorded ${l.recordedDate}${l.notes ? ` — ${l.notes}` : ""}`
  )
  .join("\n") || "None found"}

## UCC Filings
${gsccca?.uccs.map((u) => `- ${u.fileDate}: ${u.debtor} → ${u.securedParty} (${u.status})`).join("\n") || "None found"}

## Bankruptcy & Federal-Court Records (owner-matched only)
${
  // Only surface BK / federal liens that survived normalizeLiens' strict
  // owner-name filter — those already live in the liens[] array above with
  // ids "bankruptcy-*" / "fed-lien-*". We deliberately do NOT paste the raw
  // unfiltered pacer.bankruptcies / pacer.federalLiens arrays here: doing so
  // tempts the model to surface index-collision hits (e.g. a federal tax
  // lien whose indexed debtor is a filing-authority string like "USA —
  // United States of America", or a bankruptcy with a non-matching debtor)
  // as "major" defects. Attribution filtering is a deterministic step, not
  // the model's job (Peachtree Battle false-defect signature, May 2026).
  (() => {
    const matched = liens.filter(
      (l) => l.id.startsWith("bankruptcy-") || l.id.startsWith("fed-lien-"),
    );
    return matched.length === 0
      ? "None matched to the parcel owner. (Any federal/bankruptcy index hits that did NOT match the owner name were dropped as likely surname collisions and must NOT be treated as defects.)"
      : matched
          .map((l) => `- [${l.status.toUpperCase()}] ${l.type} — ${l.creditor}, recorded ${l.recordedDate}${l.notes ? ` — ${l.notes}` : ""}`)
          .join("\n");
  })()
}

---

Analyze this title and respond in EXACTLY this JSON format:
{
  "summary": "2-3 paragraph analysis of the title, written for an attorney reviewing this for AOL purposes. Note any concerns, positive findings, and overall assessment.",
  "riskScore": <number 0-100, where 0=perfectly clean title, 100=severe defects>,
  "defects": [
    {
      "id": "defect-1",
      "severity": "critical|major|minor|info",
      "category": "chain_break|lien|encumbrance|bankruptcy|fraud_risk|recording_error|other",
      "title": "Short title of the defect",
      "description": "Detailed description of the defect and its implications",
      "recommendation": "What the attorney should do about this"
    }
  ]
}

Severity guide:
- critical: Blocks closing / unmarketable title (active bankruptcy, unresolved chain break, unreleased mortgage on seller)
- major: Needs resolution before closing but has a clear path (judgment lien with payment plan, UCC filing on fixtures)
- minor: Should be noted but unlikely to block (old released liens, minor recording discrepancies)
- info: FYI items (easements, covenants, historical notes)

If the title is clean with no defects, return an empty defects array and a risk score of 0-10.

CRITICAL RULES — DEFAMATION / E&O LIABILITY:
- NEVER allege fraud, self-dealing, money laundering, title-washing, or any
  criminal/civil wrongdoing about a NAMED person (an individual, e.g. "Chad
  E. Eikhoff"). This creates defamation exposure for both Cliros and the
  attorney signing the AOL.
- It IS acceptable to flag "unusual transfer pattern requires examination"
  about an ENTITY (LLC, trust, corporation) as long as it's framed neutrally
  and recommends verification, not accusation.
- Do not use category="fraud_risk" against any defect that names a natural
  person. Use "recording_error" or "other" and frame as "requires verification".
- Federal liens and bankruptcies must only be flagged as defects if the
  debtor name DEMONSTRABLY matches the property owner. If the source data
  shows a different debtor name, list as "unverified — debtor name does
  not match parcel owner; may be index collision" with severity "info".

Respond with ONLY the JSON, no other text.`;
}

/** Strip defects that allege fraud/self-dealing about a NAMED PERSON.
 * This is a post-processing guardrail on top of the prompt: Claude
 * occasionally still emits these despite the prompt rules. Publishing
 * them is a defamation + E&O bomb (see panel review of report
 * 87648f5f, May 21 2026).
 *
 * Heuristic: if category contains "fraud" OR title/description contains
 * fraud/self-dealing/money-laundering language AND any token in the
 * defect text matches a "comma" pattern that GSCCCA uses for individual
 * names (e.g. "EIKHOFF, CHAD"), demote to "info" and rewrite as
 * "requires examination" or drop entirely.
 */
function sanitizeDefects(defects: TitleDefect[]): TitleDefect[] {
  const FRAUD_PATTERNS = /\b(fraud|self.?deal|money.?launder|title.?wash|sham|scheme|criminal|wire.?fraud|tax.?evasion)\b/i;
  const PERSON_NAME_PATTERN = /\b[A-Z]+,\s+[A-Z][A-Z]+(?:\s+[A-Z]+)?\b/;
  const out: TitleDefect[] = [];
  for (const d of defects) {
    const txt = `${d.title || ""} ${d.description || ""} ${d.recommendation || ""}`;
    const isFraudCategory = (d.category || "").toLowerCase().includes("fraud");
    const hasFraudLanguage = FRAUD_PATTERNS.test(txt);
    const namesAPerson = PERSON_NAME_PATTERN.test(txt);

    if ((isFraudCategory || hasFraudLanguage) && namesAPerson) {
      // Defamation risk — rewrite as neutral verification flag
      out.push({
        ...d,
        category: "other",
        severity: "info",
        title: "Transfer pattern requires examination",
        description:
          "The chain of title shows an unusual pattern of transfers involving common parties. " +
          "This may reflect ordinary intra-family conveyances, security deed cancellations, " +
          "or recording-system indexing artifacts — not necessarily wrongdoing. The examining " +
          "attorney should review the underlying deed images and confirm the chain ties cleanly " +
          "before issuing the AOL. Original AI assessment retained internally for diagnostic purposes only.",
        recommendation:
          "Pull and review the deed images for each questioned conveyance. If the pattern reflects " +
          "legitimate intra-family transfers (gift deeds, trust funding, etc.), document accordingly.",
      });
      console.warn(
        `[Orchestrator] Sanitized defect '${d.title}' — fraud allegation against named person rewritten to neutral verification.`
      );
    } else {
      out.push(d);
    }
  }
  return out;
}

function parseClaudeAnalysis(text: string): {
  summary: string;
  riskScore: number;
  defects: TitleDefect[];
} {
  try {
    // Extract JSON from response (Claude might wrap it in markdown code blocks)
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("No JSON found in Claude response");

    const parsed = JSON.parse(jsonMatch[0]);

    const rawDefects: TitleDefect[] = (parsed.defects || []).map(
      (d: Record<string, string>, i: number) => ({
        id: d.id || `defect-${i}`,
        severity: (d.severity as TitleDefect["severity"]) || "info",
        category: d.category || "other",
        title: d.title || "Unknown defect",
        description: d.description || "",
        recommendation: d.recommendation || "Review with attorney",
      })
    );

    return {
      summary: parsed.summary || "",
      riskScore: Math.min(100, Math.max(0, parsed.riskScore || 0)),
      defects: sanitizeDefects(rawDefects),
    };
  } catch (err) {
    console.error("[Orchestrator] Failed to parse Claude analysis:", err);
    return {
      summary: text.slice(0, 500), // Use raw text as fallback summary
      riskScore: 30, // Conservative default
      defects: [],
    };
  }
}

/* ─── Helpers ─── */

/** Map GSCCCA Real Estate Index instrument codes to DeedRecord["type"].
 * Source: https://training.gsccca.org/lms/resources/chart_re_instruments.pdf
 *
 * Returns null for codes that are NOT chain-of-title entries (security
 * deeds, cancellations, releases, easements, modifications, liens). Those
 * are routed to the liens/encumbrances section by the orchestrator.
 */
function classifyDeedType(type: string): DeedRecord["type"] | null {
  const raw = (type || "").trim().toUpperCase();
  if (!raw) return null;

  // Exact-code matches first (GSCCCA index returns these codes verbatim)
  switch (raw) {
    case "WD":   return "warranty";
    case "QCD":  return "quitclaim";
    case "QC":   return "quitclaim";  // some counties truncate
    case "TRSD": return "trustee";
    case "ESTD": return "executor";
    case "GIFD": return "gift";
    case "FCD":  return "foreclosure";
    case "SHFD": return "sheriff";
    case "TAXD": return "tax_sale";
    case "RWD":  return "right_of_way";
    case "TIMD": return "timber";
    case "GOMD": return "gas_oil_mineral";
    case "ORD":  return "court_order";
    case "REGD": return "registry_transfer";
    // NON-chain instruments — route to liens/encumbrances, not chain
    case "SD":   return null;  // Security Deed (mortgage) → liens
    case "CANC": return null;  // Cancellation → reduces a lien, not chain
    case "REL":  return null;  // Release → reduces a lien
    case "ASGN": return null;  // Assignment of lien interest
    case "MOD":  return null;  // Modification
    case "AGRE": return null;  // Agreement / contract / amendment
    case "EASE": return null;  // Easement (separate from chain)
    case "COVE": return null;  // Covenants/restrictions
    case "BL":   return null;  // Boundary line agreement
    case "POA":  return null;  // Power of Attorney
    case "RPOA": return null;  // Revocation of POA
    case "LIEN": return null;  // Lien itself
    case "ML":   return null;  // Materialman's lien
    case "BKRP": return null;  // Notice of bankruptcy
    case "EST":  return null;  // Estate docs (will/letters/etc.)
    case "AFF":  return null;  // Affidavit
    case "NOT":  return null;  // Notice / UCC-2
    case "BOND": return null;  // Bond
    case "CERT": return null;  // Certificate
    case "MISC": return null;  // Miscellaneous
    case "LEAS": return null;  // Lease
    case "GOML": return null;  // Gas/oil/mineral lease
    case "TIML": return null;  // Timber lease
    case "CNDO": return null;  // Condo declaration
    case "OPT":  return null;  // Option
  }

  // Substring fallbacks for counties that index with full English instead of code
  const t = raw.toLowerCase();
  if (t.includes("warranty") && (t.includes("special") || t.includes("limited"))) return "limited_warranty";
  if (t.includes("warranty")) return "warranty";
  if (t.includes("quit")) return "quitclaim";
  if (t.includes("security deed") || t.includes("deed of trust") || t.includes("mortgage")) return null;
  if (t.includes("cancellation") || t.includes("release")) return null;
  if (t.includes("modification") || t.includes("amendment") || t.includes("assignment")) return null;
  if (t.includes("easement")) return null;
  if (t.includes("covenant") || t.includes("restriction")) return null;
  if (t.includes("affidavit")) return null;
  if (t.includes("power of attorney")) return null;
  if (t.includes("notice")) return null;
  if (t.includes("trustee") || t.includes("trust")) return "trustee";
  if (t.includes("execut") || t.includes("administrator") || t.includes("estate")) return "executor";
  if (t.includes("gift")) return "gift";
  if (t.includes("foreclosure") || t.includes("power of sale")) return "foreclosure";
  if (t.includes("sheriff")) return "sheriff";
  if (t.includes("tax sale") || t.includes("tax deed")) return "tax_sale";
  if (t.includes("right of way") || t.includes("right-of-way")) return "right_of_way";
  if (t.includes("court order") || t.includes("partition") || t.includes("condemnation")) return "court_order";
  if (t.includes("corrective")) return "corrective";

  return "other";
}

/** Route GSCCCA codes that are NOT chain entries into the liens section.
 * SD (Security Deed) = mortgage → active lien
 * CANC = cancellation → if it references a SD, that SD becomes released
 * REL  = release → same
 * Returns lien type if this instrument should appear as a lien row.
 */
/** Normalize book-page for cross-matching (42266-223 vs 42266 - 223) */
function normalizeBookPageKey(bp?: string): string {
  if (!bp) return "";
  return bp.replace(/\s+/g, "").replace(/[^0-9-]/g, "-").replace(/-+/g, "-").trim();
}

/**
 * Pair CANC/REL instruments to originating security deeds by referenced book/page.
 * GA cancellations cite the original SD in instrument text; creditor-name match alone fails when index shows "Unknown".
 */
function reconcileSecurityDeedLiens(liens: LienRecord[]): void {
  const sdRows = liens.filter((l) => l.id.startsWith("sd-lien-"));
  const releases = sdRows.filter((l) => l.status === "released");

  let pairedByRef = 0;

  for (const rel of releases) {
    const refKey = normalizeBookPageKey(rel.referencedBookPage);
    const relOwn = normalizeBookPageKey(rel.bookPage);
    const targetKey = refKey && refKey !== relOwn ? refKey : "";
    if (targetKey) {
      for (const sd of sdRows) {
        if (sd.status !== "active") continue;
        if (normalizeBookPageKey(sd.bookPage) === targetKey) {
          sd.status = "released";
          sd.releasedDate = rel.recordedDate;
          const relKind = rel.notes?.match(/deed index:\s*(\w+)/i)?.[1] || "CANC";
          sd.notes = `${sd.notes || ""} · Released per ${relKind} ${rel.bookPage} (refs ${targetKey})`;
          pairedByRef++;
        }
      }
    }
  }

  // Fallback: same non-unknown creditor + cancellation recorded after SD
  for (const rel of releases) {
    const relCred = (rel.creditor || "").toUpperCase();
    if (!relCred || relCred.includes("NOT IN INDEX") || relCred === "(UNSPECIFIED)") continue;
    for (const sd of sdRows) {
      if (
        sd.status === "active" &&
        sd.creditor &&
        sd.creditor.toUpperCase() === relCred &&
        new Date(sd.recordedDate) < new Date(rel.recordedDate)
      ) {
        sd.status = "released";
        sd.releasedDate = rel.recordedDate;
      }
    }
  }

  // Same borrower on SD notes + later CANC without ref (intra-family payoffs)
  for (const rel of releases) {
    const relBorrower = rel.notes?.match(/Borrower:\s*([^·]+)/)?.[1]?.trim().toUpperCase();
    if (!relBorrower) continue;
    for (const sd of sdRows) {
      if (
        sd.status === "active" &&
        sd.notes?.toUpperCase().includes(relBorrower) &&
        new Date(sd.recordedDate) < new Date(rel.recordedDate)
      ) {
        sd.status = "released";
        sd.releasedDate = rel.recordedDate;
        const relKind = rel.notes?.match(/deed index:\s*(\w+)/i)?.[1] || "cancellation";
        sd.notes = `${sd.notes || ""} · Likely released (same borrower, later ${relKind})`;
      }
    }
  }

  const stillActive = sdRows.filter((l) => l.status === "active").length;
  console.log(
    `[Orchestrator] SD/CANC pairing: ${pairedByRef} matched by referenced book/page; ${stillActive} security deeds still active`
  );
}

/**
 * Mortgages co-travel with vesting deeds. In GA closings, the SECURITY DEED
 * recording the buyer's purchase-money loan is filed alongside (often the
 * same day as) the WARRANTY DEED conveying title to that buyer. That SD is
 * the CURRENT owner's mortgage — it's an active lien but NOT a curative
 * item; it gets paid off when this owner sells next, not at the closing
 * the inquiring attorney is preparing for.
 *
 * Heuristic:
 *   1. Find the most recent chain-of-title WD (the "vesting" deed).
 *   2. Find any active SD recorded within ±7 days of that WD where the
 *      borrower (on the SD notes "Borrower: <name>") matches the WD grantee
 *      by surname (fuzzy).
 *   3. Mark that SD `isPurchaseMoney=true`. Downstream the action-plan
 *      builder treats it as informational, not a release-required item.
 *
 * Edge cases handled:
 *   - Cash purchase: no SD within ±7 days of the WD → no flag, nothing
 *     changes.
 *   - Refinances: the original purchase-money SD may have been replaced
 *     by a refi SD years later. The refi WON'T be co-recorded with a WD
 *     and won't get the flag. That's correct — refinances and HELOCs DO
 *     need releases at closing.
 *   - Recent sale you don't know about: the most-recent-WD logic still
 *     works; we just flag whichever SD pairs with the LATEST WD on record.
 */
function flagPurchaseMoneySDs(
  liens: LienRecord[],
  gsccca?: GSCCCASearchResults,
): void {
  if (!gsccca?.deeds?.length) return;

  // Pull conveyance-type deed rows from the raw GSCCCA index (not the
  // chain-of-title list — we need the raw recording date + grantee).
  const conveyances = gsccca.deeds
    .filter((d) => {
      const t = (d.instrumentType || "").toUpperCase();
      return t === "WD" || t === "QCD" || t === "QC" ||
        t === "ESTD" || t === "TRSD" || t === "GIFD";
    })
    .filter((d) => d.recordedDate)
    .sort((a, b) => new Date(b.recordedDate).getTime() - new Date(a.recordedDate).getTime());
  if (conveyances.length === 0) return;
  const vestingDeed = conveyances[0];
  const vestingTs = new Date(vestingDeed.recordedDate).getTime();
  if (isNaN(vestingTs)) return;

  const granteeSurname = (vestingDeed.grantee || "")
    .toUpperCase()
    .split(/[\s,]+/)
    .filter((t) => t.length >= 3 && !["UNKNOWN", "TRUST", "ESTATE", "LLC", "INC", "CORP"].includes(t))[0];
  if (!granteeSurname) return;

  const COTRAVEL_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;
  let flagged = 0;
  for (const lien of liens) {
    if (lien.type !== "mortgage" || lien.status !== "active") continue;
    if (!lien.recordedDate) continue;
    const lts = new Date(lien.recordedDate).getTime();
    if (isNaN(lts)) continue;
    if (Math.abs(lts - vestingTs) > COTRAVEL_WINDOW_MS) continue;

    // Surname match against the SD's borrower notes — handles "Borrower:
    // EIKHOFF, CHAD E" / "Borrower: SMITH FAMILY TRUST" formats.
    const borrowerHay = (lien.notes || "").toUpperCase();
    const hasGranteeSurname = borrowerHay.includes(granteeSurname);
    if (!hasGranteeSurname) continue;

    lien.isPurchaseMoney = true;
    const daysOff = Math.abs(Math.round((lts - vestingTs) / (24 * 60 * 60 * 1000)));
    lien.notes =
      `${lien.notes || ""} · Purchase-money mortgage (co-recorded with vesting WD ${vestingDeed.bookPage || ""} ${daysOff === 0 ? "same day" : `${daysOff}d apart`})`;
    flagged++;
  }

  if (flagged > 0) {
    console.log(
      `[Orchestrator] Purchase-money: flagged ${flagged} active SD${flagged === 1 ? "" : "s"} as co-traveling with vesting WD (${vestingDeed.bookPage}, recorded ${vestingDeed.recordedDate}) — informational, not curative`
    );
  }
}

function classifyInstrumentAsLien(type: string): {
  lienType: LienRecord["type"];
  status: LienRecord["status"];
} | null {
  const raw = (type || "").trim().toUpperCase();
  if (!raw) return null;

  switch (raw) {
    case "SD":   return { lienType: "mortgage", status: "active" };
    case "CANC": return { lienType: "mortgage", status: "released" };  // Cancellation of an SD
    case "REL":  return { lienType: "mortgage", status: "released" };
    case "ASGN": return { lienType: "mortgage", status: "active" };    // SD assignment — still an active lien
    case "MOD":  return { lienType: "mortgage", status: "active" };    // SD modification
    case "LIEN": return { lienType: "other",    status: "active" };
    case "ML":   return { lienType: "mechanics", status: "active" };
    case "EASE": return { lienType: "other",    status: "active" };    // Easement = encumbrance
  }
  const t = raw.toLowerCase();
  if (t.includes("security deed") || t.includes("deed of trust") || t.includes("mortgage")) {
    return { lienType: "mortgage", status: "active" };
  }
  if (t.includes("cancellation") || t.includes("release")) {
    return { lienType: "mortgage", status: "released" };
  }
  if (t.includes("easement")) return { lienType: "other", status: "active" };
  return null;
}

function classifyLienType(type: string): LienRecord["type"] {
  const t = type.toLowerCase();
  if (t.includes("mortgage")) return "mortgage";
  if (t.includes("judgment")) return "judgment";
  if (t.includes("tax")) return "tax";
  if (t.includes("mechanic") || t.includes("materialm")) return "mechanics";
  if (t.includes("hoa") || t.includes("association")) return "hoa";
  if (t.includes("irs") || t.includes("federal tax")) return "irs";
  if (t.includes("state tax") || t.includes("revenue")) return "state";
  if (t.includes("ucc")) return "ucc";
  return "other";
}

function nameMatch(name1: string, name2: string): boolean {
  // Fuzzy name matching for chain-of-title continuity
  const clean = (n: string) =>
    n
      .toUpperCase()
      .replace(/[^A-Z ]/g, "")
      .replace(/\s+/g, " ")
      .trim();

  const a = clean(name1);
  const b = clean(name2);

  if (a === b) return true;

  // Check if last names match (first word)
  const aLast = a.split(" ")[0];
  const bLast = b.split(" ")[0];
  if (aLast === bLast) return true;

  // Check if one contains the other
  if (a.includes(b) || b.includes(a)) return true;

  return false;
}
