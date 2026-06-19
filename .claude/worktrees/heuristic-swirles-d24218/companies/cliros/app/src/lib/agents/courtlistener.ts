/* ─── CourtListener API Client ───
   Free federal court data from Free Law Project's CourtListener.
   Uses RECAP Archive — a free mirror of PACER data.

   - Bankruptcy cases by party name
   - Federal dockets (tax liens, judgments)
   - No per-page charges (unlike PACER $0.10/page)
   - Rate limit: 5/min, 50/hr, 125/day (free tier)

   API Docs: https://wiki.free.law/c/courtlistener/help/api/rest/v4/overview
   Search:   https://www.courtlistener.com/api/rest/v4/search/
*/

/* ─── Types ─── */

export interface CourtListenerBankruptcy {
  caseNumber: string;
  caseTitle: string;
  court: string;       // e.g., "ganb" = GA Northern District BK
  courtName: string;
  chapter: string;     // "7", "11", "13"
  dateFiled: string;
  dateTerminated?: string;
  debtor: string;
  trustee?: string;
  status: "open" | "closed" | "discharged";
  docketId: number;
  pacerCaseId?: string;
}

export interface CourtListenerFederalLien {
  caseNumber: string;
  court: string;
  courtName: string;
  dateFiled: string;
  dateTerminated?: string;
  debtor: string;
  creditor: string;
  status: "active" | "released";
  docketId: number;
}

export interface CourtListenerSearchResults {
  bankruptcies: CourtListenerBankruptcy[];
  federalLiens: CourtListenerFederalLien[];
  errors: string[];
  searchedAt: string;
  totalResults: number;
  source: "courtlistener";
}

/* ─── Constants ─── */

const CL_BASE = "https://www.courtlistener.com/api/rest/v4";
const CL_SEARCH = `${CL_BASE}/search/`;

// Georgia federal courts
const GA_BK_COURTS = "ganb gamb gasb"; // bankruptcy: Northern, Middle, Southern
const GA_DC_COURTS = "gand gamd gasd"; // district: Northern, Middle, Southern

// Rate limiting — respect CourtListener's free tier (5/min)
let lastRequestTime = 0;
const MIN_REQUEST_GAP_MS = 12_500; // ~5 requests per minute

/* ─── Client ─── */

export class CourtListenerClient {
  private token: string | null;

  constructor(token?: string) {
    this.token = token || process.env.COURTLISTENER_TOKEN || null;
  }

  /**
   * Search CourtListener for bankruptcy cases and federal liens by party name.
   * Searches Georgia federal courts by default.
   */
  async searchByName(
    lastName: string,
    firstName?: string,
    state: string = "GA"
  ): Promise<CourtListenerSearchResults> {
    const results: CourtListenerSearchResults = {
      bankruptcies: [],
      federalLiens: [],
      errors: [],
      searchedAt: new Date().toISOString(),
      totalResults: 0,
      source: "courtlistener",
    };

    // Search bankruptcy courts
    try {
      const partyName = firstName ? `${lastName}, ${firstName}` : lastName;
      const bkResults = await this.searchRECAP({
        party_name: partyName,
        court: state === "GA" ? GA_BK_COURTS : "",
        type: "r", // RECAP docket search
        order_by: "dateFiled desc",
      });

      results.totalResults += bkResults.count;

      for (const hit of bkResults.results) {
        const bk = this.mapBankruptcy(hit);
        if (bk) results.bankruptcies.push(bk);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      results.errors.push(`CourtListener bankruptcy search: ${msg}`);
    }

    // Search district courts for federal tax liens / IRS cases
    try {
      const partyName = firstName ? `${lastName}, ${firstName}` : lastName;
      const dcResults = await this.searchRECAP({
        party_name: partyName,
        court: state === "GA" ? GA_DC_COURTS : "",
        type: "r",
        q: "IRS OR \"internal revenue\" OR \"tax lien\" OR \"United States of America\"",
        order_by: "dateFiled desc",
      });

      results.totalResults += dcResults.count;

      for (const hit of dcResults.results) {
        const lien = this.mapFederalLien(hit);
        if (lien) results.federalLiens.push(lien);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      results.errors.push(`CourtListener federal lien search: ${msg}`);
    }

    return results;
  }

  /**
   * Search CourtListener RECAP archive.
   */
  private async searchRECAP(params: Record<string, string>): Promise<CLSearchResponse> {
    // Rate limiting
    await this.rateLimit();

    const url = new URL(CL_SEARCH);
    url.searchParams.set("format", "json");
    for (const [key, value] of Object.entries(params)) {
      if (value) url.searchParams.set(key, value);
    }

    const headers: Record<string, string> = {
      Accept: "application/json",
    };
    if (this.token) {
      headers.Authorization = `Token ${this.token}`;
    }

    const response = await fetch(url.toString(), { headers });

    if (!response.ok) {
      if (response.status === 429) {
        throw new Error("CourtListener rate limit exceeded — try again in a minute");
      }
      throw new Error(`CourtListener API ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  }

  /* ─── Mappers ─── */

  private mapBankruptcy(hit: CLSearchHit): CourtListenerBankruptcy | null {
    // Only include actual bankruptcy cases
    const courtId = hit.court_id || hit.court || "";
    if (!courtId.includes("b")) return null; // bankruptcy courts have 'b' in ID

    let status: CourtListenerBankruptcy["status"] = "open";
    if (hit.dateTerminated) {
      status = "closed";
    }

    // Extract debtor name from parties or case name
    const debtor = this.extractDebtor(hit);

    return {
      caseNumber: hit.docketNumber || hit.docket_number || "",
      caseTitle: hit.caseName || hit.case_name || "",
      court: courtId,
      courtName: this.courtDisplayName(courtId),
      chapter: hit.chapter ? String(hit.chapter) : "unknown",
      dateFiled: hit.dateFiled || hit.date_filed || "",
      dateTerminated: hit.dateTerminated || hit.date_terminated || undefined,
      debtor,
      trustee: hit.trustee_str || undefined,
      status,
      docketId: hit.docket_id || 0,
      pacerCaseId: hit.pacer_case_id || undefined,
    };
  }

  private mapFederalLien(hit: CLSearchHit): CourtListenerFederalLien | null {
    const caseName = (hit.caseName || hit.case_name || "").toLowerCase();

    // Filter to actual IRS/tax lien cases
    const isLien =
      caseName.includes("united states") ||
      caseName.includes("irs") ||
      caseName.includes("internal revenue") ||
      caseName.includes("tax lien") ||
      caseName.includes("tax");

    if (!isLien) return null;

    return {
      caseNumber: hit.docketNumber || hit.docket_number || "",
      court: hit.court_id || hit.court || "",
      courtName: this.courtDisplayName(hit.court_id || hit.court || ""),
      dateFiled: hit.dateFiled || hit.date_filed || "",
      dateTerminated: hit.dateTerminated || hit.date_terminated || undefined,
      debtor: this.extractDebtor(hit),
      creditor: "United States of America (IRS)",
      status: hit.dateTerminated ? "released" : "active",
      docketId: hit.docket_id || 0,
    };
  }

  private extractDebtor(hit: CLSearchHit): string {
    // party field is an array of names
    if (hit.party && Array.isArray(hit.party) && hit.party.length > 0) {
      return hit.party[0];
    }
    // Fall back to case name
    return hit.caseName || hit.case_name || "Unknown";
  }

  private courtDisplayName(courtId: string): string {
    const names: Record<string, string> = {
      ganb: "N.D. Georgia Bankruptcy",
      gamb: "M.D. Georgia Bankruptcy",
      gasb: "S.D. Georgia Bankruptcy",
      gand: "N.D. Georgia",
      gamd: "M.D. Georgia",
      gasd: "S.D. Georgia",
    };
    return names[courtId] || courtId;
  }

  /* ─── Rate Limiting ─── */

  private async rateLimit(): Promise<void> {
    const now = Date.now();
    const elapsed = now - lastRequestTime;
    if (elapsed < MIN_REQUEST_GAP_MS) {
      await new Promise((resolve) => setTimeout(resolve, MIN_REQUEST_GAP_MS - elapsed));
    }
    lastRequestTime = Date.now();
  }
}

/* ─── CourtListener Search API Types ─── */

interface CLSearchResponse {
  count: number;
  document_count?: number;
  next: string | null;
  previous: string | null;
  results: CLSearchHit[];
}

interface CLSearchHit {
  // Docket fields
  docket_id?: number;
  caseName?: string;
  case_name?: string;
  docketNumber?: string;
  docket_number?: string;
  court?: string;
  court_id?: string;
  dateFiled?: string;
  date_filed?: string;
  dateTerminated?: string;
  date_terminated?: string;
  pacer_case_id?: string;

  // Bankruptcy-specific
  chapter?: number | string;
  trustee_str?: string;

  // Party info
  party?: string[];
  party_id?: number[];
  attorney?: string[];
  firm?: string[];

  // Judge
  assignedTo?: string;

  // Documents
  recap_documents?: Array<{
    description: string;
    date_created: string;
  }>;
}

/* ─── Factory ─── */

export function createCourtListenerClient(): CourtListenerClient {
  // Token is optional — CL API works without auth but with lower rate limits
  return new CourtListenerClient();
}
