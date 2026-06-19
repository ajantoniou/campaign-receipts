/* ─── GSCCCA Browser Agent ───
   Playwright-based agent that searches Georgia Superior Court Clerks'
   Cooperative Authority (gsccca.org) for real estate records.

   NOT a scraper. An on-demand digital paralegal:
   - Authenticates with paid Premium account
   - Searches by address → gets deed chain
   - Searches by owner name → gets liens, UCC filings
   - Human-speed requests (2-5s gaps between pages)
   - One property at a time

   Data retrieved:
   - Deeds (chain of title, 1999+)
   - Judgment liens (state, 2004+)
   - Tax liens (state revenue dept)
   - UCC filings
   - Lis pendens
   - Mortgage records
   - PT-61 (Real Estate Transfer Tax) records
*/

import { chromium, Browser, Page, BrowserContext } from "playwright";

/* ─── Types ─── */

export interface GSCCCACredentials {
  username: string;
  password: string;
}

export interface GSCCCADeedResult {
  recordedDate: string;
  bookPage: string;
  instrumentType: string;
  grantor: string;
  grantee: string;
  county: string;
  consideration?: number;
  instrumentNumber?: string;
  legalDescription?: string;
  /** Book-page of the original security deed cited on CANC/REL instruments */
  referencedBookPage?: string;
}

export interface GSCCCALienResult {
  recordedDate: string;
  bookPage: string;
  instrumentType: string; // "judgment lien", "state tax lien", "federal tax lien", "lis pendens"
  debtor: string;
  creditor: string;
  county: string;
  amount?: number;
  status?: string; // "active" | "released" | "cancelled"
  releasedDate?: string;
  instrumentNumber?: string;
}

export interface GSCCCAUCCResult {
  fileDate: string;
  fileNumber: string;
  debtor: string;
  securedParty: string;
  status: string; // "active" | "terminated" | "lapsed"
  expirationDate?: string;
  collateralDescription?: string;
}

export interface GSCCCA_PT61Result {
  saleDate: string;
  salePrice: number;
  address: string;
  grantor: string;
  grantee: string;
  county: string;
  bookPage?: string;
  documentNumber?: string;
}

export interface GSCCCASearchResults {
  deeds: GSCCCADeedResult[];
  liens: GSCCCALienResult[];
  uccs: GSCCCAUCCResult[];
  pt61s: GSCCCA_PT61Result[];
  errors: string[];
  searchedAt: string;
  ownerNames: string[]; // names extracted from deed chain for lien/UCC searches
}

/* ─── Constants ─── */

const URLS = {
  login: "https://apps.gsccca.org/login.asp",
  loginFallback: "https://search.gsccca.org/login.asp",
  realEstateNameSearch: "https://search.gsccca.org/RealEstate/namesearch.asp",
  realEstatePremium: "https://search.gsccca.org/RealEstatePremium/InstrumentTypeSearch.aspx",
  lienNameSearch: "https://search.gsccca.org/lien/namesearch.asp",
  uccSearch: "https://search.gsccca.org/UCC_Search/search.asp?searchtype=Article9",
  pt61NameSearch: "https://search.gsccca.org/pt61/namesearch.asp",
  pt61AddressSearch: "https://search.gsccca.org/PT61Premium/AddressSearch.aspx",
  stateTaxLienSearch: "https://search.gsccca.org/LienSearch/StateTaxLienSearch.aspx",
};

// Human-speed delay between page loads
// Production: 2000-5000ms for respectful scraping
// Can be reduced for testing via GSCCCA_FAST_MODE env var
const FAST_MODE = process.env.GSCCCA_FAST_MODE === "1";
const MIN_DELAY_MS = FAST_MODE ? 500 : 2000;
const MAX_DELAY_MS = FAST_MODE ? 1500 : 5000;

const SEARCH_YEARS = 25; // How far back to search (1999+)

/* ─── Agent Class ─── */

export class GSCCCAAgent {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private page: Page | null = null;
  private credentials: GSCCCACredentials;
  private isLoggedIn = false;

  constructor(credentials: GSCCCACredentials) {
    this.credentials = credentials;
  }

  /* ── Lifecycle ── */

  async init(): Promise<void> {
    this.browser = await chromium.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    this.context = await this.browser.newContext({
      userAgent:
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      viewport: { width: 1280, height: 800 },
    });
    this.page = await this.context.newPage();
  }

  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.context = null;
      this.page = null;
      this.isLoggedIn = false;
    }
  }

  /* ── Authentication ── */

  async login(): Promise<boolean> {
    if (!this.page) throw new Error("Agent not initialized. Call init() first.");

    // Try multiple login endpoints — GSCCCA has several domains and the ASP pages
    // can be down independently. Priority: apps.gsccca.org > search.gsccca.org > www.gsccca.org
    const loginUrls = [URLS.login, URLS.loginFallback];

    for (const loginUrl of loginUrls) {
      try {
        console.log(`[GSCCCA] Trying login at ${loginUrl}...`);
        await this.page.goto(loginUrl, { waitUntil: "domcontentloaded", timeout: 15000 });
        await this.humanDelay();

        // Check for server errors
        const bodyCheck = await this.page.textContent("body") || "";
        if (bodyCheck.includes("internal server error") || bodyCheck.includes("cannot be displayed")) {
          console.warn(`[GSCCCA] ${loginUrl} returned server error, trying next...`);
          continue;
        }

        // apps.gsccca.org form: name="txtUserID" / name="txtPassword" (no IDs)
        const appsUserField = await this.page.$('input[name="txtUserID"]');
        // search.gsccca.org mobile form: has specific IDs
        const mobileUser = "#pagelayoutBox_loginForm_C004_mobileusername";
        const useMobile = await this.page.isVisible(mobileUser);
        // search.gsccca.org desktop form
        const useDesktop = await this.page.isVisible("#username");

        if (appsUserField) {
          // apps.gsccca.org login form
          console.log("[GSCCCA] Using apps.gsccca.org login form");
          await this.page.fill('input[name="txtUserID"]', this.credentials.username);
          await this.humanDelay(500, 1000);
          await this.page.fill('input[name="txtPassword"]', this.credentials.password);
          await this.humanDelay(500, 1000);

          // Submit — the login form on apps.gsccca.org has NO visible submit button.
          // The only input[type=submit] on the page is the site search — DO NOT click it.
          // Instead, submit the form that contains txtUserID directly.
          await this.page.evaluate(() => {
            const userField = document.querySelector('input[name="txtUserID"]');
            const form = userField?.closest('form');
            if (form) form.submit();
          });
        } else if (useMobile) {
          console.log("[GSCCCA] Using mobile login form");
          await this.page.fill(mobileUser, this.credentials.username);
          await this.humanDelay(500, 1000);
          await this.page.fill("#pagelayoutBox_loginForm_C004_mobilepassword", this.credentials.password);
          await this.humanDelay(500, 1000);
          await this.page.click("#pagelayoutBox_loginForm_C004_mobileloginbtn");
        } else if (useDesktop) {
          console.log("[GSCCCA] Using desktop login form");
          await this.page.fill("#username", this.credentials.username);
          await this.humanDelay(500, 1000);
          await this.page.fill("#password", this.credentials.password);
          await this.humanDelay(500, 1000);
          await this.page.click("#loginbtn");
        } else {
          console.warn(`[GSCCCA] No recognized login form at ${loginUrl}, trying next...`);
          continue;
        }

        await this.page.waitForLoadState("domcontentloaded");
        await this.humanDelay();

        // Verify login — check for "Logout" text on page
        const bodyText = await this.page.textContent("body") || "";
        this.isLoggedIn = bodyText.includes("Logout") || bodyText.includes("Log Out") || bodyText.includes("Welcome");

        if (!this.isLoggedIn) {
          // Secondary check — try accessing a search page
          await this.page.goto(URLS.realEstateNameSearch, { waitUntil: "domcontentloaded" });
          await this.humanDelay();
          // After login, the RE page should have the name search field AND not redirect to login
          const searchField = await this.page.$("#txtSearchName");
          const currentUrl = this.page.url();
          this.isLoggedIn = !!searchField && !currentUrl.includes("login");
        }

        if (this.isLoggedIn) {
          console.log(`[GSCCCA] Login successful via ${loginUrl}`);
          return true;
        } else {
          console.warn(`[GSCCCA] Login via ${loginUrl} did not succeed, trying next...`);
        }
      } catch (err) {
        console.warn(`[GSCCCA] Login attempt at ${loginUrl} failed:`, err);
      }
    }

    console.error("[GSCCCA] All login attempts FAILED");
    return false;
  }

  /* ── Main Search Flow ── */

  /**
   * Complete title search for a property address.
   * Flow:
   * 1. Search PT-61 by address → get recent sale, grantor/grantee names
   * 2. Search Real Estate by grantee name → get deed chain going back
   * 3. For each owner in chain, search Lien Index → get liens
   * 4. For each owner in chain, search UCC Index → get UCC filings
   */
  async searchProperty(address: string, county?: string): Promise<GSCCCASearchResults> {
    if (!this.page || !this.isLoggedIn) {
      throw new Error("Agent not logged in. Call init() and login() first.");
    }

    const results: GSCCCASearchResults = {
      deeds: [],
      liens: [],
      uccs: [],
      pt61s: [],
      errors: [],
      searchedAt: new Date().toISOString(),
      ownerNames: [],
    };

    try {
      // Step 1: Search PT-61 by address to find current owner
      console.log(`[GSCCCA] Step 1: PT-61 address search for "${address}"`);
      const pt61Results = await this.searchPT61ByAddress(address, county);
      results.pt61s = pt61Results;

      // Extract owner names from PT-61 (most recent grantee = current owner)
      const ownerNames = new Set<string>();
      for (const pt61 of pt61Results) {
        if (pt61.grantee) ownerNames.add(pt61.grantee.toUpperCase());
        if (pt61.grantor) ownerNames.add(pt61.grantor.toUpperCase());
      }

      // Step 2: Search Real Estate Index by name for deed chain
      console.log(`[GSCCCA] Step 2: Real Estate name search for deed chain`);
      const allDeeds: GSCCCADeedResult[] = [];

      // If PT-61 found names, search by those. Otherwise search Real Estate Index
      // directly using the street name as a proxy (catches many residential deeds).
      if (ownerNames.size > 0) {
        for (const name of ownerNames) {
          const lastName = name.split(/[, ]/)[0];
          if (!lastName || lastName.length < 2) continue;
          const deeds = await this.searchRealEstateByName(lastName, county);
          allDeeds.push(...deeds);
          await this.humanDelay();
        }
      } else {
        // Fallback: PT-61 returned no results (commercial property, missing data, etc.)
        // Try searching by common last name from the street address or use address-based search
        console.log("[GSCCCA] PT-61 returned no owner names — trying Real Estate Index with address keywords");

        // Extract potential search terms from address: street name words that could be owner names
        // e.g. "123 Peachtree Street" → try "Peachtree" (many GA streets are named after families)
        // This is a heuristic — not all streets are family names, but it catches common cases
        const { street } = this.parseAddress(address);
        const streetWords = street.replace(/^\d+\s+/, "").split(/\s+/)
          .filter(w => w.length > 3 && !/^(st|rd|ave|dr|ln|ct|blvd|way|pl|cir|street|road|avenue|drive|lane|court|boulevard|circle|place|north|south|east|west|nw|ne|sw|se|apt|ste|suite|unit)$/i.test(w));

        // Also try the city name as it sometimes matches property records
        const parts = address.split(",").map(s => s.trim());
        const city = parts[1] || "";

        // Search with whatever terms we can extract
        const searchTerms = [...streetWords];
        if (city && city.length > 3) searchTerms.push(city);

        for (const term of searchTerms.slice(0, 3)) {
          console.log(`[GSCCCA] Fallback RE search with term: "${term}"`);
          const deeds = await this.searchRealEstateByName(term, county);
          allDeeds.push(...deeds);
          await this.humanDelay();
        }
      }

      // Deduplicate deeds by bookPage
      const seenBookPages = new Set<string>();
      for (const deed of allDeeds) {
        const key = `${deed.county}-${deed.bookPage}`;
        if (!seenBookPages.has(key)) {
          seenBookPages.add(key);
          results.deeds.push(deed);
          // Also collect owner names from deeds for lien search
          if (deed.grantee) ownerNames.add(deed.grantee.toUpperCase());
          if (deed.grantor) ownerNames.add(deed.grantor.toUpperCase());
        }
      }

      results.ownerNames = Array.from(ownerNames);

      // Deduplicate last names for lien/UCC search (avoid searching "PEACHTREE" 5 times
      // if it appears as grantor/grantee in multiple deeds)
      const lastNamesForSearch = new Set<string>();
      for (const name of ownerNames) {
        const lastName = name.split(/[, ]/)[0];
        if (lastName && lastName.length >= 2) {
          lastNamesForSearch.add(lastName.toUpperCase());
        }
      }
      // Cap at 10 unique last names to keep search time reasonable
      const lienSearchNames = Array.from(lastNamesForSearch).slice(0, 10);

      // Step 3: Search Lien Index for each owner
      console.log(`[GSCCCA] Step 3: Lien search for ${lienSearchNames.length} unique last names (from ${ownerNames.size} total)`);
      for (const lastName of lienSearchNames) {
        try {
          console.log(`[GSCCCA]   Lien search: "${lastName}"`);
          const liens = await this.searchLiensByName(lastName, county);
          results.liens.push(...liens);
        } catch (err) {
          results.errors.push(`Lien search failed for "${lastName}": ${err}`);
        }
        await this.humanDelay();
      }

      // Step 4: Search UCC for each owner
      console.log(`[GSCCCA] Step 4: UCC search for ${lienSearchNames.length} unique last names`);
      for (const lastName of lienSearchNames) {
        try {
          console.log(`[GSCCCA]   UCC search: "${lastName}"`);
          const uccs = await this.searchUCCByName(lastName);
          results.uccs.push(...uccs);
        } catch (err) {
          results.errors.push(`UCC search failed for "${lastName}": ${err}`);
        }
        await this.humanDelay();
      }

      // Sort deeds by recorded date (most recent first)
      results.deeds.sort(
        (a, b) => new Date(b.recordedDate).getTime() - new Date(a.recordedDate).getTime()
      );

    } catch (err) {
      results.errors.push(`Search failed: ${err}`);
    }

    return results;
  }

  /* ── PT-61 Address Search (Premium only) ── */

  private async searchPT61ByAddress(
    address: string,
    county?: string
  ): Promise<GSCCCA_PT61Result[]> {
    if (!this.page) return [];
    const results: GSCCCA_PT61Result[] = [];

    try {
      // Premium PT-61 Address Search — calibrated 2026-05-16
      // ASP.NET page at /PT61Premium/AddressSearch.aspx
      // Fields: #BodyContent_txtAddress, #BodyContent_ddlCounties,
      //         #BodyContent_txtDateFrom, #BodyContent_txtDateTo,
      //         #BodyContent_btnSearch ("Begin Search")
      await this.page.goto(URLS.pt61AddressSearch, {
        waitUntil: "domcontentloaded",
        timeout: 15000,
      });
      await this.humanDelay();

      // Check if PT-61 Premium page loaded properly (it's an ASPX page that may be down)
      const pt61Body = await this.page.textContent("body") || "";
      if (pt61Body.includes("internal server error") || pt61Body.includes("cannot be displayed")) {
        console.log("[GSCCCA] PT-61 Premium page is down, skipping");
        return results;
      }

      // Check if the address field exists (page may have loaded but with different content)
      const hasAddressField = await this.page.isVisible("#BodyContent_txtAddress").catch(() => false);
      if (!hasAddressField) {
        console.log("[GSCCCA] PT-61 Premium form not found, skipping");
        return results;
      }

      // Parse address to get street portion
      const { street } = this.parseAddress(address);

      // Fill address field
      await this.page.fill("#BodyContent_txtAddress", street);

      // Set county if provided
      if (county) {
        try {
          const countySelect = await this.page.$("#BodyContent_ddlCounties");
          if (countySelect) {
            // Try by label (county names in dropdown)
            try {
              await countySelect.selectOption({ label: county.toUpperCase() });
            } catch {
              // Try partial match
              const options = await countySelect.$$eval("option", (opts) =>
                opts.map((o) => ({ value: o.value, text: o.textContent?.trim() || "" }))
              );
              const match = options.find((o) => o.text.toLowerCase().includes(county.toLowerCase()));
              if (match) await countySelect.selectOption(match.value);
            }
          }
        } catch { /* skip county selection */ }
      }

      // Date range
      const endDate = new Date();
      const startDate = new Date();
      startDate.setFullYear(startDate.getFullYear() - SEARCH_YEARS);
      try {
        await this.page.fill("#BodyContent_txtDateFrom", this.formatDate(startDate));
        await this.page.fill("#BodyContent_txtDateTo", this.formatDate(endDate));
      } catch { /* use defaults */ }

      await this.humanDelay(500, 1000);

      // Dismiss any calendar popups that may overlay the search button
      await this.page.click("body", { position: { x: 10, y: 10 } }).catch(() => {});
      await this.humanDelay(200, 400);

      // Submit — use force:true in case calendar overlay still intercepts
      await this.page.click("#BodyContent_btnSearch", { force: true });
      await this.page.waitForLoadState("domcontentloaded");
      await this.humanDelay();

      // Parse results table
      results.push(...(await this.parsePT61Results()));
    } catch (err) {
      console.error("[GSCCCA] PT-61 address search error:", err);
    }

    return results;
  }

  /* ── Real Estate Name Search ── */

  private async searchRealEstateByName(
    lastName: string,
    county?: string
  ): Promise<GSCCCADeedResult[]> {
    if (!this.page) return [];
    const results: GSCCCADeedResult[] = [];

    try {
      await this.page.goto(URLS.realEstateNameSearch, {
        waitUntil: "domcontentloaded",
      });
      await this.humanDelay();

      // Calibrated from live site 2026-05-16:
      // Step 1: Fill form → submit → get name list (table.name_results)
      // Step 2: Click radio button (rdoEntityName) for each name
      // Step 3: Click "Display Details" (#btnDisplayDetails) → get deed records

      await this.page.fill("#txtSearchName", lastName);

      if (county) {
        await this.selectCounty(county);
      }

      const endDate = new Date();
      const startDate = new Date();
      startDate.setFullYear(startDate.getFullYear() - SEARCH_YEARS);
      await this.page.fill("#txtFromDate", this.formatDate(startDate));
      await this.page.fill("#txtToDate", this.formatDate(endDate));

      try {
        await this.page.selectOption('select[name="MaxRows"]', "100");
      } catch { /* use default */ }

      await this.humanDelay(500, 1000);
      // Dismiss any calendar overlay before clicking submit
      await this.page.click("body", { position: { x: 10, y: 10 } }).catch(() => {});
      await this.humanDelay(200, 400);
      await this.page.click("#btnSubmit", { force: true });

      // Wait for navigation to complete — the submit goes to names.asp?Type=0
      try {
        await this.page.waitForURL(/names\.asp/i, { timeout: 15000 });
      } catch {
        // Fallback: just wait for DOM
        await this.page.waitForLoadState("domcontentloaded");
      }

      // Wait for either name results or "no records" message
      await this.page.waitForSelector(
        'table.name_results, input[name="rdoEntityName"], td:has-text("No records")',
        { timeout: 15000 }
      ).catch(() => {});
      await this.humanDelay();

      // Debug: log current URL and check for redirects
      const afterSubmitUrl = this.page.url();
      if (afterSubmitUrl.includes("login")) {
        console.warn(`[GSCCCA] RE search redirected to login: ${afterSubmitUrl}`);
        return results; // Session expired
      }

      // Check if names.asp returned a login redirect form (auto-submitting hidden form)
      const namesPageHtml = await this.page.content();
      if (namesPageHtml.includes('action="https://apps.gsccca.org/login.asp') && namesPageHtml.includes('frmLogin')) {
        console.warn(`[GSCCCA] names.asp returned login redirect form — session expired`);
        this.isLoggedIn = false;
        const relogged = await this.login();
        if (!relogged) return results;
        return this.searchRealEstateByName(lastName, county);
      }

      // Step 2: Parse name list and click through each name
      const nameRadios = await this.page.$$eval(
        'input[name="rdoEntityName"]',
        (inputs) => inputs.map((i) => (i as HTMLInputElement).value)
      );

      // Also capture the display text for each radio (the actual entity name)
      const nameLabels = await this.page.$$eval(
        'table.name_results tr',
        (trs) => trs.map((tr) => {
          const radio = tr.querySelector('input[name="rdoEntityName"]') as HTMLInputElement | null;
          const cells = Array.from(tr.querySelectorAll("td"));
          // The entity name is usually in the 2nd cell (after radio button)
          const nameCell = cells.find((td) => !td.querySelector("input") && (td.textContent?.trim().length || 0) > 2);
          return {
            value: radio?.value || "",
            name: nameCell?.textContent?.trim() || radio?.value || "",
          };
        }).filter((n) => n.value)
      );

      console.log(`[GSCCCA] Found ${nameLabels.length} name entries for "${lastName}"`);

      // Click each name's radio and get deed details
      // Cap at 5 names to keep search time reasonable (each name = multiple page loads)
      for (const nameEntry of nameLabels.slice(0, 5)) {
        try {
          // Select the radio button (use evaluate to handle special chars in value)
          await this.page.evaluate((val) => {
            const radios = document.querySelectorAll('input[name="rdoEntityName"]') as NodeListOf<HTMLInputElement>;
            for (const r of radios) {
              if (r.value === val) { r.click(); r.checked = true; break; }
            }
          }, nameEntry.value);
          await this.humanDelay(500, 1000);

          // Click "Display Details" — verify button exists first
          const displayBtn = await this.page.$("#btnDisplayDetails");
          if (!displayBtn) {
            console.warn(`[GSCCCA] Display Details button not found, skipping "${nameEntry.name}"`);
            continue;
          }
          await this.page.click("#btnDisplayDetails", { timeout: 10000 });
          await this.page.waitForLoadState("domcontentloaded", { timeout: 15000 }).catch(() => {});
          await this.humanDelay();

          // Parse deed results from the detail page, passing the searched entity name
          const deeds = await this.parseDeedResults(nameEntry.name);
          results.push(...deeds);
          console.log(`[GSCCCA]   → ${deeds.length} deeds for "${nameEntry.name}"`);

          // Go back to name list for next name
          await this.page.goBack();
          await this.page.waitForLoadState("domcontentloaded", { timeout: 15000 }).catch(() => {});
          await this.humanDelay();
        } catch (err) {
          console.error(`[GSCCCA] Error getting deeds for "${nameEntry.name}":`, err);
        }
      }
    } catch (err) {
      console.error(`[GSCCCA] Real Estate search error for "${lastName}":`, err);
    }

    return results;
  }

  /* ── Lien Name Search ── */

  private async searchLiensByName(
    lastName: string,
    county?: string
  ): Promise<GSCCCALienResult[]> {
    if (!this.page) return [];
    const results: GSCCCALienResult[] = [];

    try {
      await this.page.goto(URLS.lienNameSearch, {
        waitUntil: "domcontentloaded",
      });
      await this.humanDelay();

      // Calibrated 2026-05-16: same form as RE search, but submit uses fnSubmitForm()
      // and results are also a name list with radio buttons → "Display Details"
      await this.page.fill("#txtSearchName", lastName);

      if (county) {
        await this.selectCounty(county);
      }

      try {
        await this.page.selectOption('select[name="MaxRows"]', "100");
      } catch { /* use default */ }

      await this.humanDelay(500, 1000);

      // Submit via JavaScript (button onclick="javascript:fnSubmitForm()")
      await this.page.evaluate(() => {
        if (typeof (window as unknown as Record<string, unknown>).fnSubmitForm === "function") {
          ((window as unknown as Record<string, unknown>).fnSubmitForm as () => void)();
        }
      });
      await this.page.waitForLoadState("domcontentloaded");
      await this.humanDelay();

      // Same name list + radio button flow as RE search
      const lienNameRadios = await this.page.$$eval(
        'table.name_results input[name="rdoEntityName"]',
        (inputs) => inputs.map((i) => (i as HTMLInputElement).value)
      );

      console.log(`[GSCCCA] Found ${lienNameRadios.length} lien name entries for "${lastName}"`);

      for (const nameValue of lienNameRadios.slice(0, 5)) {
        try {
          // Use evaluate to handle special chars in radio values
          await this.page.evaluate((val) => {
            const radios = document.querySelectorAll('input[name="rdoEntityName"]') as NodeListOf<HTMLInputElement>;
            for (const r of radios) {
              if (r.value === val) { r.click(); r.checked = true; break; }
            }
          }, nameValue);
          await this.humanDelay(500, 1000);

          // Lien page may use #btnDisplayDetails or fnSubmitForm() for display
          const displayBtn = await this.page.$("#btnDisplayDetails");
          if (displayBtn) {
            await displayBtn.click();
          } else {
            // Fallback: call fnSubmitForm() which is used on lien pages
            await this.page.evaluate(() => {
              if (typeof (window as unknown as Record<string, unknown>).fnSubmitForm === "function") {
                ((window as unknown as Record<string, unknown>).fnSubmitForm as () => void)();
              }
            });
          }
          await this.page.waitForLoadState("domcontentloaded", { timeout: 15000 }).catch(() => {});
          await this.humanDelay();

          const liens = await this.parseLienResults();
          results.push(...liens);

          await this.page.goBack();
          await this.page.waitForLoadState("domcontentloaded", { timeout: 15000 }).catch(() => {});
          await this.humanDelay();
        } catch (err) {
          console.error(`[GSCCCA] Error getting liens for "${nameValue}":`, err);
        }
      }
    } catch (err) {
      console.error(`[GSCCCA] Lien search error for "${lastName}":`, err);
    }

    return results;
  }

  /* ── UCC Name Search ── */

  private async searchUCCByName(lastName: string): Promise<GSCCCAUCCResult[]> {
    if (!this.page) return [];
    const results: GSCCCAUCCResult[] = [];

    try {
      // UCC Article 9 Basic Name Search — calibrated 2026-05-16
      // Fields: DebtorLastName, DebtorFirstName, FromDate, ToDate, FinalCountyList, #btnSubmit
      await this.page.goto(URLS.uccSearch, {
        waitUntil: "domcontentloaded",
      });
      await this.humanDelay();

      await this.page.fill('input[name="DebtorLastName"]', lastName);

      // Set date range
      const uccEndDate = new Date();
      const uccStartDate = new Date();
      uccStartDate.setFullYear(uccStartDate.getFullYear() - SEARCH_YEARS);
      try {
        await this.page.fill('input[name="FromDate"]', this.formatDate(uccStartDate));
        await this.page.fill('input[name="ToDate"]', this.formatDate(uccEndDate));
      } catch { /* use defaults */ }

      await this.humanDelay(500, 1000);
      await this.page.click("body", { position: { x: 10, y: 10 } }).catch(() => {});
      await this.humanDelay(200, 400);
      await this.page.click("#btnSubmit", { force: true });
      await this.page.waitForLoadState("domcontentloaded");
      await this.humanDelay();

      results.push(...(await this.parseUCCResults()));
    } catch (err) {
      console.error(`[GSCCCA] UCC search error for "${lastName}":`, err);
    }

    return results;
  }

  /* ── Result Parsers ── */

  /**
   * Parse deed/real estate results from the current page.
   * Calibrated 2026-05-16: Each deed is a table.table_borders with:
   *   Row 1 (reg_deed_cell_borders): [icon|County|Type|FILED: date|BOOK: num|PAGE: num]
   *   Row 2+ (reg_property_cell_borders): property details
   *   The icon img alt="Grantee" or alt="Grantor" tells us the party role
   */
  private async parseDeedResults(searchedName?: string): Promise<GSCCCADeedResult[]> {
    if (!this.page) return [];

    try {
      await this.page.waitForSelector("table.table_borders, .no-results", {
        timeout: 10000,
      }).catch(() => {});

      // Each table.table_borders is one deed instrument
      const instruments = await this.page.$$eval("table.table_borders", (tables) =>
        tables.map((t) => {
          // First row has the deed header cells (class=reg_deed_cell_borders)
          const headerCells = Array.from(t.querySelectorAll("td.reg_deed_cell_borders"));
          if (headerCells.length < 4) return null;

          // Icon image tells us party role (Grantor vs Grantee)
          // sym_dp.gif = Direct Party (the searched name is this role)
          // sym_rp.gif = Reverse Party (the OTHER party)
          const icon = headerCells[0]?.querySelector("img");
          const iconSrc = icon?.getAttribute("src") || "";
          const iconAlt = icon?.alt?.toLowerCase() || "";
          // "grantor" or "grantee" — this is the role of the SEARCHED party
          const partyRole = iconAlt || (iconSrc.includes("dp") ? "grantor" : "grantee");

          const county = headerCells[1]?.textContent?.trim() || "";
          const instrumentType = headerCells[2]?.textContent?.trim() || "";

          // Parse "FILED: 4/7/2005"
          const filedText = headerCells[3]?.textContent?.trim() || "";
          const dateMatch = filedText.match(/FILED:\s*(.+)/i);
          const filedDate = dateMatch?.[1]?.trim() || "";

          // Parse "BOOK: 42266"
          const bookText = headerCells[4]?.textContent?.trim() || "";
          const bookMatch = bookText.match(/BOOK:\s*(.+)/i);
          const book = bookMatch?.[1]?.trim() || "";

          // Parse "PAGE:  223"
          const pageText = headerCells[5]?.textContent?.trim() || "";
          const pageMatch = pageText.match(/PAGE:\s*(.+)/i);
          const pageNum = pageMatch?.[1]?.trim() || "";

          // Property details from reg_property_cell_borders rows
          const propCells = Array.from(t.querySelectorAll("td.reg_property_cell_borders"));
          const propText = propCells.map((td) => td.textContent?.trim() || "").join(" ");

          // Extract subdivision, lot, block from property text
          const subdivMatch = propText.match(/SUBDIVISION:\s*(.+?)(?:\s+LOT:|$)/i);
          const lotMatch = propText.match(/LOT:\s*(.+?)(?:\s+BLOCK:|$)/i);
          const blockMatch = propText.match(/BLOCK:\s*(.+?)(?:\s+COMMENTS:|$)/i);

          // Try to find the counterparty name from party name rows
          // GSCCCA shows "GRANTEE: Name" or "GRANTOR: Name" in party rows
          const allText = t.textContent || "";
          const grantorMatch = allText.match(/GRANTOR:\s*(.+?)(?:\n|GRANTEE:|$)/i);
          const granteeMatch = allText.match(/GRANTEE:\s*(.+?)(?:\n|GRANTOR:|$)/i);

          return {
            county: county.replace(" County", ""),
            instrumentType,
            filedDate,
            book,
            page: pageNum,
            bookPage: book && pageNum ? `${book}-${pageNum}` : "",
            partyRole,
            subdivision: subdivMatch?.[1]?.trim() || "",
            lot: lotMatch?.[1]?.trim() || "",
            block: blockMatch?.[1]?.trim() || "",
            extractedGrantor: grantorMatch?.[1]?.trim() || "",
            extractedGrantee: granteeMatch?.[1]?.trim() || "",
          };
        }).filter(Boolean)
      );

      // Map to GSCCCADeedResult
      const name = searchedName || "Unknown";
      return instruments
        .filter((inst): inst is NonNullable<typeof inst> => inst !== null)
        .map((inst) => {
          // Use extracted names if available, otherwise use searched name for the known role
          let grantor = inst.extractedGrantor || "";
          let grantee = inst.extractedGrantee || "";

          // If we couldn't extract names from page text, use the searched name
          if (!grantor && !grantee) {
            if (inst.partyRole.includes("grantor")) {
              grantor = name;
            } else {
              grantee = name;
            }
          }

          return {
            recordedDate: this.normalizeDate(inst.filedDate),
            bookPage: inst.bookPage,
            instrumentType: inst.instrumentType,
            grantor: grantor || name,
            grantee: grantee || "Unknown",
            county: inst.county,
            legalDescription: [
              inst.subdivision && `Subdivision: ${inst.subdivision}`,
              inst.lot && `Lot: ${inst.lot}`,
              inst.block && `Block: ${inst.block}`,
            ].filter(Boolean).join(", ") || undefined,
          };
        });
    } catch (err) {
      console.error("[GSCCCA] Error parsing deed results:", err);
      return [];
    }
  }

  /**
   * Parse lien detail results from the current page.
   * Calibrated 2026-05-16: Lien detail pages use a DIFFERENT layout from deeds.
   * - Table rows use `td.bordered_cell` class (NOT table_borders/reg_deed_cell_borders)
   * - Header row: Selection | County | Instrument Type | Date Filed | Book | Page | Sec/GMD | LD | LL
   * - Data rows: same bordered_cell class
   * - Party icons: sym_dp.gif (Direct Party = Debtor), sym_rp.gif (Reverse Party = Creditor)
   * - Below instrument rows: property rows with Subdivision/Unit/Block/Lot/Comments
   */
  private async parseLienResults(): Promise<GSCCCALienResult[]> {
    if (!this.page) return [];

    try {
      // Wait for either the bordered_cell table or a no-results indicator
      await this.page.waitForSelector("td.bordered_cell, table.table_borders, .no-results", {
        timeout: 10000,
      }).catch(() => {});

      // Try bordered_cell first (lien detail pages)
      const hasBorderedCell = await this.page.$("td.bordered_cell");

      if (hasBorderedCell) {
        // Lien detail page with bordered_cell layout
        const instruments = await this.page.$$eval("table", (tables) => {
          const results: Array<{
            county: string;
            instrumentType: string;
            filedDate: string;
            book: string;
            page: string;
            bookPage: string;
            partyRole: string; // "debtor" | "creditor"
          }> = [];

          for (const table of tables) {
            const rows = Array.from(table.querySelectorAll("tr"));
            for (const row of rows) {
              const cells = Array.from(row.querySelectorAll("td.bordered_cell"));
              if (cells.length < 6) continue;

              // Skip header rows (check if first cell has an img or text like "Selection")
              const firstCellText = cells[0]?.textContent?.trim() || "";
              if (firstCellText === "Selection" || firstCellText === "County") continue;

              // Check for party icon in first cell
              const icon = cells[0]?.querySelector("img");
              const iconSrc = icon?.getAttribute("src") || "";
              let partyRole = "";
              if (iconSrc.includes("sym_dp")) partyRole = "debtor"; // Direct Party
              else if (iconSrc.includes("sym_rp")) partyRole = "creditor"; // Reverse Party

              // Skip rows without an icon (likely property detail or header rows)
              if (!partyRole && !icon) continue;

              // Columns: [icon/Selection | County | Instrument Type | Date Filed | Book | Page | ...]
              const county = (cells[1]?.textContent?.trim() || "").replace(" County", "");
              const instrumentType = cells[2]?.textContent?.trim() || "";
              const filedDate = cells[3]?.textContent?.trim() || "";
              const book = cells[4]?.textContent?.trim() || "";
              const pageNum = cells[5]?.textContent?.trim() || "";

              // Skip if no useful data
              if (!county && !instrumentType && !filedDate) continue;

              results.push({
                county,
                instrumentType,
                filedDate,
                book,
                page: pageNum,
                bookPage: book && pageNum ? `${book}-${pageNum}` : "",
                partyRole,
              });
            }
          }
          return results;
        });

        // Group debtor/creditor pairs — typically they appear as adjacent rows for same instrument
        const lienResults: GSCCCALienResult[] = [];
        let currentLien: GSCCCALienResult | null = null;

        for (const inst of instruments) {
          if (inst.partyRole === "debtor") {
            // Start new lien record
            if (currentLien) lienResults.push(currentLien);
            currentLien = {
              recordedDate: this.normalizeDate(inst.filedDate),
              bookPage: inst.bookPage,
              instrumentType: inst.instrumentType,
              debtor: "", // Name comes from the searched name
              creditor: "",
              county: inst.county,
            };
          } else if (inst.partyRole === "creditor" && currentLien) {
            // Attach creditor info to current lien
            currentLien.creditor = inst.county || ""; // Sometimes creditor name is in the row
          } else {
            // Standalone row — treat as a lien
            lienResults.push({
              recordedDate: this.normalizeDate(inst.filedDate),
              bookPage: inst.bookPage,
              instrumentType: inst.instrumentType,
              debtor: "",
              creditor: "",
              county: inst.county,
            });
          }
        }
        if (currentLien) lienResults.push(currentLien);

        return lienResults;
      }

      // Fallback: table_borders layout (same structure as deeds, some lien pages may use it)
      const instruments = await this.page.$$eval("table.table_borders", (tables) =>
        tables.map((t) => {
          const headerCells = Array.from(t.querySelectorAll("td.reg_deed_cell_borders"));
          if (headerCells.length < 4) return null;

          const county = headerCells[1]?.textContent?.trim()?.replace(" County", "") || "";
          const instrumentType = headerCells[2]?.textContent?.trim() || "";
          const filedText = headerCells[3]?.textContent?.trim() || "";
          const dateMatch = filedText.match(/FILED:\s*(.+)/i);
          const filedDate = dateMatch?.[1]?.trim() || "";
          const bookText = headerCells[4]?.textContent?.trim() || "";
          const book = bookText.match(/BOOK:\s*(.+)/i)?.[1]?.trim() || "";
          const pageText = headerCells[5]?.textContent?.trim() || "";
          const pageNum = pageText.match(/PAGE:\s*(.+)/i)?.[1]?.trim() || "";

          return { county, instrumentType, filedDate, book, page: pageNum, bookPage: book && pageNum ? `${book}-${pageNum}` : "" };
        }).filter(Boolean)
      );

      return instruments
        .filter((inst): inst is NonNullable<typeof inst> => inst !== null)
        .map((inst) => ({
          recordedDate: this.normalizeDate(inst.filedDate),
          bookPage: inst.bookPage,
          instrumentType: inst.instrumentType,
          debtor: "",
          creditor: "",
          county: inst.county,
        }));
    } catch (err) {
      console.error("[GSCCCA] Error parsing lien results:", err);
      return [];
    }
  }

  private async parseUCCResults(): Promise<GSCCCAUCCResult[]> {
    if (!this.page) return [];

    try {
      await this.page.waitForSelector("table, .results, .no-results, #gvResults", {
        timeout: 10000,
      }).catch(() => {});

      // Check for no results
      const pageText = await this.page.textContent("body") || "";
      if (/no records? found|no results|0 records? returned|your search returned no/i.test(pageText)) {
        console.log("[GSCCCA] UCC: No records found on page");
        return [];
      }

      // Try specific GSCCCA table first
      const resultTable = await this.page.$("#gvResults, table.results, table.searchResults");
      if (!resultTable) {
        console.log("[GSCCCA] UCC: No result table found");
        return [];
      }

      const rows = await this.page.$$eval(
        "#gvResults tr, table.results tr, table.searchResults tr",
        (trs) =>
          trs
            .filter((tr) => tr.querySelectorAll("th").length === 0)
            .map((tr) =>
              Array.from(tr.querySelectorAll("td")).map(
                (td) => td.textContent?.trim() || ""
              )
            )
            .filter((cells) => cells.length >= 3)
      );

      return rows.map((cells) => this.mapUCCRow(cells)).filter((u): u is GSCCCAUCCResult => u !== null);
    } catch (err) {
      console.error("[GSCCCA] Error parsing UCC results:", err);
      return [];
    }
  }

  private async parsePT61Results(): Promise<GSCCCA_PT61Result[]> {
    if (!this.page) return [];

    try {
      await this.page.waitForSelector("table, .results, .no-results, #BodyContent_gvResults", {
        timeout: 10000,
      }).catch(() => {});

      // Detect "no results" — check page text for common GSCCCA messages
      const pageText = await this.page.textContent("body") || "";
      const noResultPatterns = [
        /no records? found/i,
        /no results/i,
        /0 records? returned/i,
        /your search returned no/i,
        /no matching/i,
      ];
      if (noResultPatterns.some((p) => p.test(pageText))) {
        console.log("[GSCCCA] PT-61: No records found on page");
        return [];
      }

      // Try GSCCCA-specific result table first, then fall back to generic
      const resultSelector = await this.page.$("#BodyContent_gvResults, #gvResults, table.results, table.searchResults");
      if (!resultSelector) {
        console.log("[GSCCCA] PT-61: No result table found on page");
        return [];
      }

      const rows = await this.page.$$eval(
        "#BodyContent_gvResults tr, #gvResults tr, table.results tr, table.searchResults tr",
        (trs) =>
          trs
            .filter((tr) => tr.querySelectorAll("th").length === 0)
            .map((tr) =>
              Array.from(tr.querySelectorAll("td")).map(
                (td) => td.textContent?.trim() || ""
              )
            )
            .filter((cells) => cells.length >= 3)
      );

      const parsed = rows.map((cells) => this.mapPT61Row(cells)).filter((p): p is GSCCCA_PT61Result => p !== null);

      // Validate: PT-61 results must have either a real date or a recognizable address
      // Filter out garbage rows that come from page navigation elements
      const validated = parsed.filter((p) => {
        const hasDate = p.saleDate && /^\d{4}-\d{2}-\d{2}$/.test(p.saleDate);
        const hasAddress = p.address && /\d+\s+\w+/.test(p.address);
        const hasRealName = p.grantor && p.grantor !== "Unknown" && p.grantor.length > 2 &&
          !/^(SEARCHED|PREMIUM|EXPAND|UNKNOWN|SALE|PT-61)$/i.test(p.grantor);
        return hasDate || hasAddress || hasRealName;
      });

      console.log(`[GSCCCA] PT-61: ${rows.length} raw rows → ${validated.length} validated results`);
      return validated;
    } catch (err) {
      console.error("[GSCCCA] Error parsing PT-61 results:", err);
      return [];
    }
  }

  /* ── Row Mappers ──
     These map raw table cell arrays to typed results.
     Column positions need to be calibrated against the live site.
     Current mapping is a best-guess based on typical county recorder layouts.
     After first login, we'll capture actual column headers and adjust. */

  private mapDeedRow(cells: string[]): GSCCCADeedResult | null {
    if (cells.length < 4) return null;
    try {
      // Expected columns (typical): Date | Book/Page | Type | Grantor | Grantee | County
      // Some layouts: County | Date | Book/Page | Type | Grantor | Grantee
      // We'll try to detect by content patterns

      let date = "", bookPage = "", type = "", grantor = "", grantee = "", county = "";

      for (let i = 0; i < cells.length; i++) {
        const cell = cells[i];
        if (!date && /\d{1,2}\/\d{1,2}\/\d{2,4}/.test(cell)) {
          date = cell;
        } else if (!bookPage && /\d+\s*[-/]\s*\d+/.test(cell)) {
          bookPage = cell;
        } else if (!type && /deed|mortgage|lien|plat|ease|right|release|assign|transfer|warranty|quit/i.test(cell)) {
          type = cell;
        }
      }

      // Remaining cells are likely names and county
      const nameCells = cells.filter(
        (c) =>
          c !== date &&
          c !== bookPage &&
          c !== type &&
          c.length > 1 &&
          !/^\d+$/.test(c)
      );

      if (nameCells.length >= 2) {
        grantor = nameCells[0];
        grantee = nameCells[1];
        if (nameCells.length >= 3) county = nameCells[2];
      }

      if (!date && !bookPage) return null; // Not a valid deed row

      return {
        recordedDate: this.normalizeDate(date),
        bookPage: bookPage || "",
        instrumentType: type || "unknown",
        grantor: grantor || "Unknown",
        grantee: grantee || "Unknown",
        county: county || "",
        consideration: this.extractDollarAmount(cells.join(" ")),
      };
    } catch {
      return null;
    }
  }

  private mapLienRow(cells: string[]): GSCCCALienResult | null {
    if (cells.length < 3) return null;
    try {
      let date = "", bookPage = "", type = "", debtor = "", creditor = "";

      for (const cell of cells) {
        if (!date && /\d{1,2}\/\d{1,2}\/\d{2,4}/.test(cell)) {
          date = cell;
        } else if (!bookPage && /\d+\s*[-/]\s*\d+/.test(cell)) {
          bookPage = cell;
        } else if (!type && /lien|judgment|tax|lis pendens|mechanics|materialm/i.test(cell)) {
          type = cell;
        }
      }

      const nameCells = cells.filter(
        (c) => c !== date && c !== bookPage && c !== type && c.length > 1
      );
      if (nameCells.length >= 1) debtor = nameCells[0];
      if (nameCells.length >= 2) creditor = nameCells[1];

      if (!date && !debtor) return null;

      return {
        recordedDate: this.normalizeDate(date),
        bookPage: bookPage || "",
        instrumentType: type || "lien",
        debtor: debtor || "Unknown",
        creditor: creditor || "Unknown",
        county: "",
        amount: this.extractDollarAmount(cells.join(" ")),
      };
    } catch {
      return null;
    }
  }

  private mapUCCRow(cells: string[]): GSCCCAUCCResult | null {
    if (cells.length < 3) return null;
    try {
      return {
        fileDate: this.normalizeDate(cells[0] || ""),
        fileNumber: cells[1] || "",
        debtor: cells[2] || "Unknown",
        securedParty: cells[3] || "Unknown",
        status: /active|current/i.test(cells.join(" ")) ? "active" :
                /terminat|lapse/i.test(cells.join(" ")) ? "terminated" : "active",
      };
    } catch {
      return null;
    }
  }

  private mapPT61Row(cells: string[]): GSCCCA_PT61Result | null {
    if (cells.length < 3) return null;
    try {
      let date = "", address = "", grantor = "", grantee = "";
      const salePrice = this.extractDollarAmount(cells.join(" ")) || 0;

      for (const cell of cells) {
        if (!date && /\d{1,2}\/\d{1,2}\/\d{2,4}/.test(cell)) {
          date = cell;
        } else if (!address && /\d+\s+\w+\s+(st|rd|ave|dr|ln|ct|blvd|way|pl|cir)/i.test(cell)) {
          address = cell;
        }
      }

      const nameCells = cells.filter(
        (c) => c !== date && c !== address && c.length > 1 && !/^\$/.test(c) && !/^\d+$/.test(c)
      );
      if (nameCells.length >= 1) grantor = nameCells[0];
      if (nameCells.length >= 2) grantee = nameCells[1];

      return {
        saleDate: this.normalizeDate(date),
        salePrice,
        address: address || "",
        grantor: grantor || "Unknown",
        grantee: grantee || "Unknown",
        county: "",
      };
    } catch {
      return null;
    }
  }

  /* ── Helpers ── */

  private async humanDelay(minMs?: number, maxMs?: number): Promise<void> {
    const min = minMs || MIN_DELAY_MS;
    const max = maxMs || MAX_DELAY_MS;
    const delay = Math.floor(Math.random() * (max - min + 1)) + min;
    await new Promise((resolve) => setTimeout(resolve, delay));
  }

  private async selectCounty(county: string): Promise<void> {
    if (!this.page) return;
    // Calibrated field name: intCountyID (select dropdown)
    const el = await this.page.$('select[name="intCountyID"]');
    if (!el) return;

    try {
      // Try exact label match first
      await el.selectOption({ label: county });
    } catch {
      // Try partial match — county names may have different casing/formatting
      const options = await el.$$eval("option", (opts) =>
        opts.map((o) => ({ value: o.value, text: o.textContent?.trim() || "" }))
      );
      const match = options.find(
        (o) => o.text.toLowerCase().includes(county.toLowerCase())
      );
      if (match) {
        await el.selectOption(match.value);
      }
    }
  }

  private async submitSearchForm(): Promise<void> {
    if (!this.page) return;
    // Try calibrated selectors first, fall back to generic
    const submitBtn = await this.page.$(
      '#btnSubmit, input[type="button"][value*="Search" i], input[type="submit"], button[type="submit"]'
    );
    if (submitBtn) {
      await submitBtn.click();
    } else {
      await this.page.keyboard.press("Enter");
    }
  }

  private parseAddress(fullAddress: string): { street: string; city: string; state: string; zip: string } {
    // "123 Main St, Atlanta, GA 30301"
    const parts = fullAddress.split(",").map((p) => p.trim());
    const street = parts[0] || "";
    const city = parts[1] || "";
    const stateZip = parts[2] || "";
    const stateMatch = stateZip.match(/([A-Z]{2})\s*(\d{5})?/);
    return {
      street,
      city,
      state: stateMatch?.[1] || "GA",
      zip: stateMatch?.[2] || "",
    };
  }

  private normalizeDate(dateStr: string): string {
    if (!dateStr) return "";
    try {
      // Handle MM/DD/YYYY or M/D/YY
      const match = dateStr.match(/(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
      if (match) {
        let year = parseInt(match[3]);
        if (year < 100) year += year > 50 ? 1900 : 2000;
        return `${year}-${match[1].padStart(2, "0")}-${match[2].padStart(2, "0")}`;
      }
      return dateStr;
    } catch {
      return dateStr;
    }
  }

  private formatDate(d: Date): string {
    return `${(d.getMonth() + 1).toString().padStart(2, "0")}/${d.getDate().toString().padStart(2, "0")}/${d.getFullYear()}`;
  }

  private extractDollarAmount(text: string): number | undefined {
    const match = text.match(/\$\s*([\d,]+(?:\.\d{2})?)/);
    if (match) {
      return parseFloat(match[1].replace(/,/g, ""));
    }
    return undefined;
  }

  /* ── Debug: Capture page state ── */

  async captureDebugInfo(): Promise<{
    url: string;
    title: string;
    formFields: { name: string; id: string; type: string }[];
    tableHeaders: string[][];
  }> {
    if (!this.page) throw new Error("No page");

    const url = this.page.url();
    const title = await this.page.title();

    const formFields = await this.page.$$eval("input, select, textarea", (els) =>
      els.map((e) => ({
        name: (e as HTMLInputElement).name || "",
        id: e.id || "",
        type: (e as HTMLInputElement).type || e.tagName.toLowerCase(),
      }))
    );

    const tableHeaders = await this.page.$$eval("table", (tables) =>
      tables.map((t) => {
        const ths = t.querySelectorAll("th");
        return Array.from(ths).map((th) => th.textContent?.trim() || "");
      })
    );

    return { url, title, formFields, tableHeaders };
  }
}

/* ─── Factory ─── */

export function createGSCCCAAgent(): GSCCCAAgent {
  const username = process.env.GSCCCA_USERNAME;
  const password = process.env.GSCCCA_PASSWORD;

  if (!username || !password) {
    throw new Error("GSCCCA_USERNAME and GSCCCA_PASSWORD environment variables are required");
  }

  return new GSCCCAAgent({ username, password });
}
