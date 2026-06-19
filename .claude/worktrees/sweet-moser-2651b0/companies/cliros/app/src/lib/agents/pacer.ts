/* ─── PACER PCL API Integration ───
   Searches the Public Access to Court Electronic Records (PACER) system
   for federal tax liens and bankruptcy records.

   Uses the PACER Case Locator (PCL) REST API:
   - Search by party name across all federal courts
   - Returns bankruptcy cases and federal tax lien cases
   - Cost: $0.10/page, waived if under $30/quarter

   API Docs: https://pcl.uscourts.gov/pcl/pages/search.jsf
   Auth: https://pacer.uscourts.gov/
*/

/* ─── Types ─── */

export interface PACERCredentials {
  username: string;
  password: string;
}

export interface PACERBankruptcyResult {
  caseNumber: string;
  caseTitle: string;
  court: string;
  chapter: string; // "7", "11", "13"
  dateFiled: string;
  dateClosed?: string;
  dateDischarge?: string;
  debtor: string;
  status: "open" | "closed" | "discharged";
}

export interface PACERFederalLienResult {
  caseNumber: string;
  court: string;
  dateFiled: string;
  amount?: number;
  debtor: string;
  creditor: string; // Usually "United States of America" / "IRS"
  status: "active" | "released";
}

export interface PACERSearchResults {
  bankruptcies: PACERBankruptcyResult[];
  federalLiens: PACERFederalLienResult[];
  errors: string[];
  searchedAt: string;
  pagesUsed: number; // For cost tracking
}

/* ─── Constants ─── */

// PACER PCL API endpoints
const PACER_BASE = "https://pcl.uscourts.gov";
const PACER_AUTH_URL = "https://pacer.uscourts.gov/pscof/manage/login.jsf";

// For the newer PACER Next Gen API:
const PACER_NG_BASE = "https://pcl.uscourts.gov/pcl-public-api/rest";
const PACER_LOGIN_URL = `${PACER_NG_BASE}/loginToken`;
const PACER_SEARCH_URL = `${PACER_NG_BASE}/parties`;

/* ─── PACER Client ─── */

export class PACERClient {
  private credentials: PACERCredentials;
  private token: string | null = null;
  private tokenExpiry: number = 0;

  constructor(credentials: PACERCredentials) {
    this.credentials = credentials;
  }

  /* ── Authentication ── */

  private async authenticate(): Promise<boolean> {
    // Check if we have a valid token
    if (this.token && Date.now() < this.tokenExpiry) {
      return true;
    }

    try {
      // PACER uses a token-based auth for the API
      const response = await fetch(PACER_LOGIN_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          loginId: this.credentials.username,
          password: this.credentials.password,
        }),
      });

      if (!response.ok) {
        console.error(`PACER auth failed: ${response.status} ${response.statusText}`);
        return false;
      }

      const data = await response.json();
      this.token = data.loginResult?.token || data.token || null;
      // Token typically valid for 2 hours
      this.tokenExpiry = Date.now() + 2 * 60 * 60 * 1000;

      return !!this.token;
    } catch (err) {
      console.error("PACER authentication error:", err);
      return false;
    }
  }

  /* ── Search ── */

  /**
   * Search PACER for bankruptcy and federal tax lien cases by party name.
   * Searches all federal courts in Georgia (or nationwide if no state).
   */
  async searchByName(
    lastName: string,
    firstName?: string,
    state: string = "GA"
  ): Promise<PACERSearchResults> {
    const results: PACERSearchResults = {
      bankruptcies: [],
      federalLiens: [],
      errors: [],
      searchedAt: new Date().toISOString(),
      pagesUsed: 0,
    };

    const authenticated = await this.authenticate();
    if (!authenticated) {
      results.errors.push("PACER authentication failed");
      return results;
    }

    // Search bankruptcy courts
    try {
      const bkResults = await this.searchParty({
        lastName,
        firstName,
        courtType: "bk", // bankruptcy
        state,
      });
      results.bankruptcies = bkResults.cases.map(this.mapBankruptcyCase);
      results.pagesUsed += bkResults.pageCount;
    } catch (err) {
      results.errors.push(`Bankruptcy search failed: ${err}`);
    }

    // Search district courts for federal tax liens
    try {
      const distResults = await this.searchParty({
        lastName,
        firstName,
        courtType: "dc", // district court
        state,
        natureOfSuit: "890", // Other Statutory Actions (includes tax liens)
      });
      results.federalLiens = distResults.cases
        .filter((c) => this.isFederalTaxLien(c))
        .map(this.mapFederalLienCase);
      results.pagesUsed += distResults.pageCount;
    } catch (err) {
      results.errors.push(`Federal lien search failed: ${err}`);
    }

    return results;
  }

  /**
   * Search PACER PCL API for party records.
   */
  private async searchParty(params: {
    lastName: string;
    firstName?: string;
    courtType: string;
    state?: string;
    natureOfSuit?: string;
  }): Promise<{ cases: PACERCaseRaw[]; pageCount: number }> {
    const searchParams: Record<string, string> = {
      lastName: params.lastName,
      courtTypeId: params.courtType,
    };

    if (params.firstName) searchParams.firstName = params.firstName;
    if (params.state) searchParams.courtId = this.getCourtId(params.state, params.courtType);
    if (params.natureOfSuit) searchParams.natureOfSuitCode = params.natureOfSuit;

    // Date range — search last 20 years
    const endDate = new Date();
    const startDate = new Date();
    startDate.setFullYear(startDate.getFullYear() - 20);
    searchParams.dateFiledFrom = this.formatDate(startDate);
    searchParams.dateFiledTo = this.formatDate(endDate);

    const queryString = new URLSearchParams(searchParams).toString();

    const response = await fetch(`${PACER_SEARCH_URL}?${queryString}`, {
      headers: {
        Accept: "application/json",
        "X-NEXT-GEN-CSO": this.token || "",
      },
    });

    if (!response.ok) {
      throw new Error(`PACER search failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const cases: PACERCaseRaw[] = data.content || data.results || [];
    const pageCount = Math.ceil((data.totalElements || cases.length) / 25);

    return { cases, pageCount };
  }

  /* ── Court ID Mapping ── */

  private getCourtId(state: string, courtType: string): string {
    // Georgia federal courts
    const GA_COURTS: Record<string, string[]> = {
      bk: ["ganb", "gamb", "gasb"], // Northern, Middle, Southern District BK
      dc: ["gand", "gamd", "gasd"], // Northern, Middle, Southern District
    };

    const courts = GA_COURTS[courtType];
    if (courts && state === "GA") {
      return courts.join(","); // Search all GA federal courts
    }

    // For other states, use state abbreviation
    return state.toLowerCase();
  }

  /* ── Result Mappers ── */

  private mapBankruptcyCase(raw: PACERCaseRaw): PACERBankruptcyResult {
    const chapter = raw.caseNumber?.match(/(\d+)-bk-/i)?.[1] ||
      raw.chapter || "unknown";

    let status: PACERBankruptcyResult["status"] = "open";
    if (raw.dateDischarged || raw.dispositionDescription?.includes("discharged")) {
      status = "discharged";
    } else if (raw.dateClosed || raw.dispositionDescription?.includes("closed")) {
      status = "closed";
    }

    return {
      caseNumber: raw.caseNumber || raw.caseId || "",
      caseTitle: raw.caseTitle || raw.partyName || "",
      court: raw.courtName || raw.courtId || "",
      chapter,
      dateFiled: raw.dateFiled || "",
      dateClosed: raw.dateClosed || undefined,
      dateDischarge: raw.dateDischarged || undefined,
      debtor: raw.partyName || raw.lastName + (raw.firstName ? `, ${raw.firstName}` : ""),
      status,
    };
  }

  private mapFederalLienCase(raw: PACERCaseRaw): PACERFederalLienResult {
    return {
      caseNumber: raw.caseNumber || raw.caseId || "",
      court: raw.courtName || raw.courtId || "",
      dateFiled: raw.dateFiled || "",
      debtor: raw.partyName || raw.lastName + (raw.firstName ? `, ${raw.firstName}` : ""),
      creditor: "United States of America (IRS)",
      status: raw.dateClosed ? "released" : "active",
    };
  }

  private isFederalTaxLien(raw: PACERCaseRaw): boolean {
    const title = (raw.caseTitle || "").toLowerCase();
    const nos = raw.natureOfSuit || "";
    return (
      title.includes("united states") ||
      title.includes("irs") ||
      title.includes("internal revenue") ||
      title.includes("tax lien") ||
      nos === "890" ||
      nos === "870"
    );
  }

  /* ── Helpers ── */

  private formatDate(d: Date): string {
    return `${(d.getMonth() + 1).toString().padStart(2, "0")}/${d.getDate().toString().padStart(2, "0")}/${d.getFullYear()}`;
  }
}

/* ─── Raw PACER Case Shape ─── */

interface PACERCaseRaw {
  caseId?: string;
  caseNumber?: string;
  caseTitle?: string;
  courtId?: string;
  courtName?: string;
  chapter?: string;
  dateFiled?: string;
  dateClosed?: string;
  dateDischarged?: string;
  dispositionDescription?: string;
  partyName?: string;
  lastName?: string;
  firstName?: string;
  natureOfSuit?: string;
}

/* ─── Factory ─── */

export function createPACERClient(): PACERClient {
  const username = process.env.PACER_USERNAME;
  const password = process.env.PACER_PASSWORD;

  if (!username || !password) {
    throw new Error("PACER_USERNAME and PACER_PASSWORD environment variables are required");
  }

  return new PACERClient({ username, password });
}
