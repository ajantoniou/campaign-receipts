/* ─── GSCCCA HTTP Agent ───
   HTTP-based agent (axios + cheerio) that replaces the Playwright browser agent.
   Same interface, same search flow, but uses HTTP requests instead of headless
   Chromium — runs on any Node.js host (Render, Railway, etc.) without needing
   a browser binary.

   Search flow:
   1. Login via form POST → maintain session cookies
   2. PT-61 address search (ASP.NET WebForms postback)
   3. Real Estate name search → deed chain
   4. Lien name search
   5. UCC name search
*/

import axios, { AxiosInstance } from "axios";
import { wrapper } from "axios-cookiejar-support";
import { CookieJar } from "tough-cookie";
import * as cheerio from "cheerio";

type CheerioRoot = ReturnType<typeof cheerio.load>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type CheerioSelection = ReturnType<CheerioRoot["root"]>;

/* ─── Re-export types from original agent ─── */
export type {
  GSCCCACredentials,
  GSCCCADeedResult,
  GSCCCALienResult,
  GSCCCAUCCResult,
  GSCCCA_PT61Result,
  GSCCCASearchResults,
} from "./gsccca";

import type {
  GSCCCACredentials,
  GSCCCADeedResult,
  GSCCCALienResult,
  GSCCCAUCCResult,
  GSCCCA_PT61Result,
  GSCCCASearchResults,
} from "./gsccca";

/* ─── Constants ─── */

const URLS = {
  login: "https://apps.gsccca.org/login.asp",
  loginFallback: "https://search.gsccca.org/login.asp",
  realEstateNameSearch: "https://search.gsccca.org/RealEstate/namesearch.asp",
  realEstateNameSubmit: "https://search.gsccca.org/RealEstate/names.asp",
  realEstateNameSelected: "https://search.gsccca.org/RealEstate/nameselected.asp",
  realEstateBookPageSearch: "https://search.gsccca.org/RealEstate/bookpagesearch.asp",
  realEstateBookPageSubmit: "https://search.gsccca.org/RealEstate/rebooks.asp?Type=2",
  lienNameSearch: "https://search.gsccca.org/lien/namesearch.asp",
  lienNameSubmit: "https://search.gsccca.org/lien/liennames.asp",
  lienNameSelected: "https://search.gsccca.org/lien/liennamesselected.asp",
  uccSearch: "https://search.gsccca.org/UCC_Search/search.asp?searchtype=Article9",
  pt61AddressSearch: "https://search.gsccca.org/PT61Premium/AddressSearch.aspx",
};

// Human-speed delay between page loads
const FAST_MODE = process.env.GSCCCA_FAST_MODE === "1";
// HTTP agent doesn't need long human-like delays — 200-800ms is sufficient
// to avoid rate limiting. FAST_MODE reduces further for local testing.
const MIN_DELAY_MS = FAST_MODE ? 200 : 500;
const MAX_DELAY_MS = FAST_MODE ? 600 : 1200;

// Georgia's customary title examination is 50 years per OCGA § 44-2-21
// and the GA Bar's commentary on best practices. 25 was the older default
// from the initial build; panel review on May 21 2026 flagged the
// deficiency vs the 50-year standard.
const SEARCH_YEARS = 50;

const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

/* ─── Agent Class ─── */

export class GSCCCAAgent {
  private client: AxiosInstance;
  private jar: CookieJar;
  private credentials: GSCCCACredentials;
  private isLoggedIn = false;
  /** Per-search override of SEARCH_YEARS. Set by searchProperty when the
   *  attorney supplies a recent sale date hint. Read by the private name
   *  search + lien search helpers so the GA window is biased toward the
   *  current ownership chunk instead of full 50-year scan. */
  private searchYearsOverride: number | undefined = undefined;

  constructor(credentials: GSCCCACredentials) {
    this.credentials = credentials;
    this.jar = new CookieJar();
    this.client = wrapper(
      axios.create({
        jar: this.jar,
        withCredentials: true,
        headers: {
          "User-Agent": USER_AGENT,
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.5",
          "Accept-Encoding": "gzip, deflate, br",
          Connection: "keep-alive",
          "Upgrade-Insecure-Requests": "1",
        },
        maxRedirects: 10,
        timeout: 30000,
        // Don't throw on non-2xx so we can inspect redirects/errors
        validateStatus: (status) => status < 500,
      })
    );
  }

  /* ── Lifecycle ── */

  async init(): Promise<void> {
    // No browser to launch — just verify connectivity
    console.log("[GSCCCA-HTTP] Agent initialized (HTTP mode)");
  }

  async close(): Promise<void> {
    this.isLoggedIn = false;
    console.log("[GSCCCA-HTTP] Agent closed");
  }

  /* ── Authentication ── */

  async login(): Promise<boolean> {
    const loginUrls = [URLS.login, URLS.loginFallback];

    for (const loginUrl of loginUrls) {
      try {
        console.log(`[GSCCCA-HTTP] Trying login at ${loginUrl}...`);

        // Step 1: GET the login page to get any hidden form fields + cookies
        const getResp = await this.client.get(loginUrl);
        await this.humanDelay();

        if (
          getResp.status >= 500 ||
          getResp.data?.includes("internal server error") ||
          getResp.data?.includes("cannot be displayed")
        ) {
          console.warn(`[GSCCCA-HTTP] ${loginUrl} returned server error, trying next...`);
          continue;
        }

        const $ = cheerio.load(getResp.data);

        // Detect which login form we're on
        const hasAppsForm = $('input[name="txtUserID"]').length > 0;
        const hasMobileForm = $("#pagelayoutBox_loginForm_C004_mobileusername").length > 0;
        const hasDesktopForm = $("#username").length > 0;

        let postUrl = loginUrl;
        let formData: Record<string, string> = {};

        if (hasAppsForm) {
          console.log("[GSCCCA-HTTP] Using apps.gsccca.org login form");
          // Find the form action
          const form = $('input[name="txtUserID"]').closest("form");
          const action = form.attr("action");
          if (action) {
            postUrl = new URL(action, loginUrl).href;
          }

          // Collect all hidden fields from the form
          formData = this.extractFormFields($, form);
          formData["txtUserID"] = this.credentials.username;
          formData["txtPassword"] = this.credentials.password;
          // Set redirect to search.gsccca.org to establish session there
          formData["Redirect"] = "https://search.gsccca.org/RealEstate/namesearch.asp";
        } else if (hasMobileForm) {
          console.log("[GSCCCA-HTTP] Using mobile login form");
          const form = $("#pagelayoutBox_loginForm_C004_mobileusername").closest("form");
          const action = form.attr("action");
          if (action) postUrl = new URL(action, loginUrl).href;

          formData = this.extractFormFields($, form);
          formData["pagelayoutBox$loginForm$C004$mobileusername"] = this.credentials.username;
          formData["pagelayoutBox$loginForm$C004$mobilepassword"] = this.credentials.password;
        } else if (hasDesktopForm) {
          console.log("[GSCCCA-HTTP] Using desktop login form");
          const form = $("#username").closest("form");
          const action = form.attr("action");
          if (action) postUrl = new URL(action, loginUrl).href;

          formData = this.extractFormFields($, form);
          formData["username"] = this.credentials.username;
          formData["password"] = this.credentials.password;
        } else {
          console.warn(`[GSCCCA-HTTP] No recognized login form at ${loginUrl}, trying next...`);
          continue;
        }

        await this.humanDelay(500, 1000);

        // Step 2: POST the login form
        const postResp = await this.client.post(postUrl, new URLSearchParams(formData).toString(), {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Referer: loginUrl,
            Origin: new URL(loginUrl).origin,
          },
        });

        await this.humanDelay();

        // Follow meta refresh if present (login redirects through meta refresh)
        let bodyText = postResp.data || "";
        console.log(`[GSCCCA-HTTP] Login POST response status: ${postResp.status}, length: ${bodyText.length}`);

        // Follow up to 3 meta refreshes
        for (let i = 0; i < 3; i++) {
          const metaMatch = bodyText.match(
            /meta\s+http-equiv=["']refresh["']\s+content=["']\d+;url=([^"']+)["']/i
          );
          if (!metaMatch) break;
          console.log(`[GSCCCA-HTTP] Following login meta refresh to: ${metaMatch[1]}`);
          await this.humanDelay(500, 1000);
          const metaResp = await this.client.get(metaMatch[1]);
          bodyText = metaResp.data || "";
        }

        this.isLoggedIn =
          bodyText.includes("Logout") ||
          bodyText.includes("Log Out") ||
          bodyText.includes("Welcome");

        if (!this.isLoggedIn) {
          // Secondary check — try accessing a search page
          const checkResp = await this.client.get(URLS.realEstateNameSearch);
          await this.humanDelay();
          const checkBody = checkResp.data || "";
          const checkUrl = checkResp.request?.res?.responseUrl || checkResp.config.url || "";
          this.isLoggedIn =
            checkBody.includes("txtSearchName") && !checkUrl.includes("login");
        }

        if (this.isLoggedIn) {
          console.log(`[GSCCCA-HTTP] Login successful via ${loginUrl}`);
          return true;
        } else {
          console.warn(`[GSCCCA-HTTP] Login via ${loginUrl} did not succeed, trying next...`);
        }
      } catch (err) {
        console.warn(`[GSCCCA-HTTP] Login attempt at ${loginUrl} failed:`, err);
      }
    }

    console.error("[GSCCCA-HTTP] All login attempts FAILED");
    return false;
  }

  /* ── JS Redirect Form Handler ── */

  /**
   * GSCCCA uses JavaScript-based redirects when the session on search.gsccca.org
   * isn't valid. The response contains a form like:
   *   <form name="frmLogin" method="post" action="https://apps.gsccca.org/login.asp?Redirect=...">
   *     <input type="hidden" name="sFormAction" value="DeedNamesGo">
   *     ... search params as hidden fields ...
   *   </form>
   *   <script>setTimeout('document.frmLogin.submit()',100);</script>
   *
   * We extract the form fields and POST them to the action URL, then follow
   * the resulting redirect to get the actual search results.
   */
  private async followJSRedirectForm(html: string): Promise<string | null> {
    try {
      const $ = cheerio.load(html);
      const form = $('form[name="frmLogin"]');
      if (form.length === 0) {
        console.warn("[GSCCCA-HTTP] No frmLogin form found in redirect page");
        return null;
      }

      const action = form.attr("action") || "";
      if (!action) {
        console.warn("[GSCCCA-HTTP] No action on frmLogin form");
        return null;
      }

      // Collect all hidden fields
      const formData: Record<string, string> = {};
      form.find('input[type="hidden"]').each((_i, el) => {
        const name = $(el).attr("name");
        const value = $(el).attr("value") || "";
        if (name) formData[name] = value;
      });

      // Add login credentials (the redirect goes back through login)
      formData["txtUserID"] = this.credentials.username;
      formData["txtPassword"] = this.credentials.password;

      console.log(`[GSCCCA-HTTP] Following JS redirect to: ${action}`);
      console.log(`[GSCCCA-HTTP] Redirect form has ${Object.keys(formData).length} fields, sFormAction="${formData['sFormAction'] || 'none'}"`);

      await this.humanDelay(500, 1500);

      const resp = await this.client.post(action, new URLSearchParams(formData).toString(), {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Referer: "https://search.gsccca.org/",
          Origin: "https://search.gsccca.org",
        },
      });

      const resultHtml = resp.data || "";
      const resultUrl = resp.request?.res?.responseUrl || resp.config?.url || "";
      console.log(`[GSCCCA-HTTP] Redirect response status: ${resp.status}, length: ${resultHtml.length}`);
      console.log(`[GSCCCA-HTTP] Redirect landed at: ${resultUrl}`);

      // Check if we got redirected AGAIN (sometimes it chains)
      if (resultHtml.includes("frmLogin") && resultHtml.includes("login.asp")) {
        console.log(`[GSCCCA-HTTP] Double redirect detected — following again`);
        return this.followJSRedirectForm(resultHtml);
      }

      // Check for meta refresh redirect (e.g., <meta http-equiv="refresh" content="0;url=...">)
      const metaMatch = resultHtml.match(/meta\s+http-equiv=["']refresh["']\s+content=["']\d+;url=([^"']+)["']/i);
      if (metaMatch) {
        const metaUrl = metaMatch[1];
        console.log(`[GSCCCA-HTTP] Following meta refresh to: ${metaUrl}`);
        await this.humanDelay(500, 1000);
        const metaResp = await this.client.get(metaUrl, {
          headers: {
            Referer: resultUrl,
          },
        });
        const metaHtml = metaResp.data || "";
        console.log(`[GSCCCA-HTTP] Meta refresh response: status=${metaResp.status}, length=${metaHtml.length}`);

        // Check for yet another redirect
        if (metaHtml.includes("frmLogin") && metaHtml.includes("login.asp")) {
          return this.followJSRedirectForm(metaHtml);
        }

        return metaHtml;
      }

      return resultHtml;
    } catch (err) {
      console.error("[GSCCCA-HTTP] Error following JS redirect:", err);
      return null;
    }
  }

  /* ── Main Search Flow ── */

  async searchProperty(
    address: string,
    county?: string,
    externalOwnerNames?: string[],
    /** Optional override of the historical search window. When the attorney
     *  supplies a recent sale date hint the orchestrator passes a smaller
     *  number (e.g. years between today and sale date + 2yr buffer) so the
     *  name-index detail-pulls aren't dominated by ancient refinance noise.
     *  Falls back to SEARCH_YEARS=50 when undefined. */
    searchYearsOverride?: number,
  ): Promise<GSCCCASearchResults> {
    if (!this.isLoggedIn) {
      throw new Error("Agent not logged in. Call init() and login() first.");
    }

    // Persist for the duration of this search so the private name/lien
    // search helpers see the override. Cleared in the finally block.
    this.searchYearsOverride = searchYearsOverride;

    // Overall timeout — return partial results rather than timing out on Render
    const SEARCH_TIMEOUT_MS = 120_000; // 2 minutes for GSCCCA portion
    const searchStart = Date.now();
    const isTimedOut = () => Date.now() - searchStart > SEARCH_TIMEOUT_MS;

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
      // Collect owner names from all sources
      const ownerNames = new Set<string>();

      // Source 1: External owner names (if provided by caller)
      if (externalOwnerNames && externalOwnerNames.length > 0) {
        console.log(`[GSCCCA-HTTP] Using ${externalOwnerNames.length} external owner names: ${externalOwnerNames.join(", ")}`);
        for (const name of externalOwnerNames) {
          ownerNames.add(name.toUpperCase());
        }
      }

      // Source 2: PT-61 address search — ALWAYS run, not just as a fallback.
      // PT-61 is the GA Real Estate Transfer Tax index, keyed by ADDRESS, and
      // returns the most recent SALE (i.e. the vesting deed). It's the canonical
      // path GA title examiners use to anchor the chain because:
      //   1. The vesting deed is indexed under the PRIOR owner's surname in
      //      GSCCCA's name index — searching only the current owner's surname
      //      (from the parcel anchor) reliably misses it for owners with many
      //      refinancings (every SD/CANC outranks the lone WD in detail pulls).
      //   2. PT-61 returns BOTH grantor (seller) and grantee (buyer) for the
      //      sale row, giving us the prior-owner surname to seed name search.
      //   3. Without PT-61, properties with active liens but no vesting deed
      //      in the result set trigger the panel "data layer / narrative layer
      //      contradict" kill (see Peachtree May 23 2026).
      // Diagnostic memory: project_cliros_gsccca_name_search_gap.md
      // The MOST RECENT PT-61 grantor is the prior owner of this exact parcel.
      // We track it separately so the RE name-search loop searches it FIRST —
      // its surname is where the vesting deed lives in the GSCCCA name index.
      // Without prioritization, current-owner surnames (which often map to 5+
      // SD/CANC index entries) consume the detail-pull cap before the WD
      // ever surfaces.
      let priorOwnerSurnameFromPT61: string | undefined;

      console.log(`[GSCCCA-HTTP] Step 1: PT-61 address search for "${address}" (always runs to anchor vesting deed)`);
      try {
        const pt61Results = await this.searchPT61ByAddress(address, county);
        results.pt61s = pt61Results;
        let priorOwnerSurnames = 0;
        for (const pt61 of results.pt61s) {
          if (pt61.grantee) ownerNames.add(pt61.grantee.toUpperCase());
          if (pt61.grantor) {
            ownerNames.add(pt61.grantor.toUpperCase());
            priorOwnerSurnames++;
          }
        }
        // Sort sales newest-first; take the most recent grantor as the
        // canonical prior owner. saleDate is "YYYY-MM-DD" so string compare
        // works. PT-61 rows with no saleDate sort to the bottom.
        const sortedSales = [...results.pt61s]
          .filter((p) => p.grantor)
          .sort((a, b) => (b.saleDate || "").localeCompare(a.saleDate || ""));
        if (sortedSales.length > 0 && sortedSales[0].grantor) {
          const tokens = sortedSales[0].grantor
            .toUpperCase()
            .split(/[\s,]+/)
            .filter((t) => t.length >= 2);
          // For "LAST, FIRST" GSCCCA format, surname is the first token. For
          // entity names ("ACME LLC") the longest non-suffix token is the
          // distinctive one; we just take the first non-empty for now since
          // the downstream extractSearchTerms already handles entity cases.
          priorOwnerSurnameFromPT61 = tokens[0];
          console.log(
            `[GSCCCA-HTTP] PT-61: most-recent sale grantor "${sortedSales[0].grantor}" (${sortedSales[0].saleDate}) → prior-owner surname "${priorOwnerSurnameFromPT61}" will be searched FIRST`
          );
        }
        console.log(
          `[GSCCCA-HTTP] PT-61: ${results.pt61s.length} sale rows; added ${priorOwnerSurnames} prior-owner surname(s) for vesting-deed name search`
        );
      } catch (err) {
        // Non-fatal: parcel-anchor-supplied owner names still drive the search.
        results.errors.push(`PT-61 search failed: ${err}`);
      }

      // Step 2: Real Estate name search for deed chain
      console.log(`[GSCCCA-HTTP] Step 2: Real Estate name search for deed chain`);
      const allDeeds: GSCCCADeedResult[] = [];

      if (ownerNames.size > 0) {
        // Extract search terms from owner names for GSCCCA name search
        // For individuals: use last name (first word before comma)
        // For corporations: use the most distinctive word(s), not generic terms
        const GENERIC_CORP_WORDS = new Set([
          "LLC", "INC", "CORP", "CO", "LP", "LLP", "LTD", "TRUST", "ESTATE",
          "THE", "OF", "AND", "A", "AN", "AT", "IN", "ON", "FOR", "TO",
          "PROPERTY", "PROPERTIES", "INVESTMENTS", "INVESTMENT", "HOLDINGS",
          "GROUP", "PARTNERS", "ASSOCIATES", "ENTERPRISES", "MANAGEMENT",
          "CAPITAL", "REALTY", "REAL", "DEVELOPMENT", "VENTURES", "COMPANY",
          "SERVICES", "SOLUTIONS", "INTERNATIONAL", "NATIONAL", "GLOBAL",
          "STREET", "AVENUE", "ROAD", "DRIVE", "BLVD", "BOULEVARD",
          "LA", "EL", "DE", "ST", "MT", "NE", "NW", "SE", "SW",
        ]);

        // Build searchNames AS AN ORDERED ARRAY so we can put the PT-61-
        // derived prior-owner surname first. Sets-based ordering is iteration-
        // order undefined for our purposes once we mix in priorities.
        const searchNames: string[] = [];
        const seenSearchNames = new Set<string>();
        const addSearchName = (n: string) => {
          if (!n || seenSearchNames.has(n)) return;
          seenSearchNames.add(n);
          searchNames.push(n);
        };

        // PRIORITY: prior-owner surname from most-recent PT-61 sale. This is
        // the surname under which the vesting deed is indexed; searching it
        // first means the WD lands in the first 5 detail pulls instead of
        // being displaced by current-owner SD/CANC rows.
        if (priorOwnerSurnameFromPT61) addSearchName(priorOwnerSurnameFromPT61);

        for (const name of ownerNames) {
          const words = name.split(/[\s,]+/).filter((w) => w.length >= 2);
          // For person names (LAST, FIRST format), use last name
          if (name.includes(",")) {
            const lastName = words[0];
            if (lastName && lastName.length >= 2) {
              addSearchName(lastName);
            }
          } else {
            // For entity names, find the most distinctive word (longest non-generic word ≥3 chars)
            const distinctiveWords = words.filter(
              (w) => w.length >= 3 && !GENERIC_CORP_WORDS.has(w.toUpperCase())
            );
            if (distinctiveWords.length > 0) {
              // Use the longest distinctive word (most unique)
              const best = distinctiveWords.sort((a, b) => b.length - a.length)[0];
              addSearchName(best);
            } else {
              // All words are generic — use the full entity name minus suffixes
              // e.g. "LA PROPERTY INVESTMENTS LLC" → "LA PROPERTY INVESTMENTS"
              const withoutSuffix = words
                .filter((w) => !["LLC", "INC", "CORP", "LP", "LLP", "LTD", "CO"].includes(w.toUpperCase()))
                .join(" ");
              if (withoutSuffix.length >= 3) {
                addSearchName(withoutSuffix);
              }
            }
          }
        }

        for (const searchName of searchNames) {
          try {
            console.log(`[GSCCCA-HTTP] RE name search: "${searchName}"`);
            const deeds = await this.searchRealEstateByName(searchName, county);
            allDeeds.push(...deeds);
          } catch (err) {
            results.errors.push(`RE search failed for "${searchName}": ${err}`);
          }
          await this.humanDelay();
        }
      } else {
        // No owner names from any source (parcel anchor failed AND PT-61 returned nothing).
        // DO NOT fall back to street-keyword name search — that path produced the
        // "railway companies in chain of title" bug because words like "PEACHTREE"
        // matched every entity with that token in their name. Fail clean instead.
        const msg =
          "GSCCCA name search requires owner names from a parcel anchor or PT-61 result. " +
          "Neither was available; refusing to run a keyword search that would produce " +
          "false-positive matches (e.g. street name appearing in unrelated entity names).";
        console.warn(`[GSCCCA-HTTP] ${msg}`);
        results.errors.push(msg);
      }

      // Deduplicate deeds by bookPage
      const seenBookPages = new Set<string>();
      for (const deed of allDeeds) {
        const key = `${deed.county}-${deed.bookPage}`;
        if (!seenBookPages.has(key)) {
          seenBookPages.add(key);
          results.deeds.push(deed);
          if (deed.grantee) ownerNames.add(deed.grantee.toUpperCase());
          if (deed.grantor) ownerNames.add(deed.grantor.toUpperCase());
        }
      }

      // Step 2.5: Resolve "Unknown" deed parties via free book/page lookup.
      // The name index returns only the party we searched on; the counterparty
      // comes back blank/"Unknown" (different surname, not in our search). That
      // empties/degrades the chain of title and the AI panel kills the report.
      // The book/page detail page (final.asp) names BOTH parties for $0 — no
      // deed-image pull, no OCR. Run BEFORE owner-name extraction so the newly
      // resolved real names also feed the lien/UCC search below.
      if (!isTimedOut()) {
        try {
          await this.resolveUnknownParties(results.deeds, county, isTimedOut);
          // Newly resolved names join the owner-name pool for lien/UCC search.
          for (const deed of results.deeds) {
            if (deed.grantee) ownerNames.add(deed.grantee.toUpperCase());
            if (deed.grantor) ownerNames.add(deed.grantor.toUpperCase());
          }
        } catch (err) {
          results.errors.push(`Book/page party resolution failed: ${err}`);
        }
      }

      results.ownerNames = Array.from(ownerNames);

      // Deduplicate last names for lien/UCC search
      // Cap at 3 to avoid timeout on Render (each name → GET + POST + up to 5 detail fetches)
      // Skip junk tokens that match the GSCCCA "unknown party" placeholder.
      const JUNK_NAMES = new Set(["UNKNOWN", "UNK", "N/A", "NONE", "", "TBD"]);
      const lastNamesForSearch = new Set<string>();
      for (const name of ownerNames) {
        const lastName = name.split(/[, ]/)[0];
        if (lastName && lastName.length >= 2 && !JUNK_NAMES.has(lastName.toUpperCase())) {
          lastNamesForSearch.add(lastName.toUpperCase());
        }
      }
      const lienSearchNames = Array.from(lastNamesForSearch).slice(0, 3);

      // Step 3: Lien search
      if (isTimedOut()) {
        console.warn(`[GSCCCA-HTTP] Timeout after ${((Date.now() - searchStart) / 1000).toFixed(1)}s — skipping lien search, returning partial results`);
        results.errors.push("GSCCCA search timed out — lien/UCC results may be incomplete");
      } else {
        console.log(
          `[GSCCCA-HTTP] Step 3: Lien search for ${lienSearchNames.length} unique last names`
        );
        for (const lastName of lienSearchNames) {
          if (isTimedOut()) {
            console.warn(`[GSCCCA-HTTP] Timeout during lien search — returning partial results`);
            results.errors.push("Lien search incomplete due to timeout");
            break;
          }
          try {
            console.log(`[GSCCCA-HTTP]   Lien search: "${lastName}"`);
            const liens = await this.searchLiensByName(lastName, county);
            results.liens.push(...liens);
          } catch (err) {
            results.errors.push(`Lien search failed for "${lastName}": ${err}`);
          }
          await this.humanDelay();
        }
      }

      // Step 4: UCC search
      if (isTimedOut()) {
        console.warn(`[GSCCCA-HTTP] Timeout — skipping UCC search`);
        if (!results.errors.some(e => e.includes("timed out"))) {
          results.errors.push("GSCCCA search timed out — UCC results may be incomplete");
        }
      } else {
        console.log(
          `[GSCCCA-HTTP] Step 4: UCC search for ${lienSearchNames.length} unique last names`
        );
        for (const lastName of lienSearchNames) {
          if (isTimedOut()) {
            console.warn(`[GSCCCA-HTTP] Timeout during UCC search — returning partial results`);
            results.errors.push("UCC search incomplete due to timeout");
            break;
          }
          try {
            console.log(`[GSCCCA-HTTP]   UCC search: "${lastName}"`);
            const uccs = await this.searchUCCByName(lastName);
            results.uccs.push(...uccs);
          } catch (err) {
            results.errors.push(`UCC search failed for "${lastName}": ${err}`);
          }
          await this.humanDelay();
        }
      }

      // Sort deeds by date (most recent first)
      results.deeds.sort(
        (a, b) => new Date(b.recordedDate).getTime() - new Date(a.recordedDate).getTime()
      );
    } catch (err) {
      results.errors.push(`Search failed: ${err}`);
    }

    return results;
  }

  /* ── Book/Page party resolution (fills "Unknown" counterparties for $0) ── */

  /**
   * For each deed whose grantor OR grantee is blank/"Unknown", re-look it up by
   * book & page. The GSCCCA name index only returns the party we searched on;
   * the book/page detail page (final.asp) names BOTH parties. This is free
   * (index viewing is covered by the flat subscription — only PRINTING images
   * costs $0.50/page, and we never hit the print path).
   *
   * Flow (verified live 2026-05-29, Fulton Book 30998 Page 573):
   *   1. GET bookpagesearch.asp to warm the form/cookies + read live hidden
   *      date fields and the county <select>.
   *   2. POST rebooks.asp?Type=2 with the book, page, county id, and date fields.
   *   3. The response contains a hidden frmSubmit whose action is
   *      final.asp?...&Key=<instrKey>. Extract it.
   *   4. GET final.asp; parse the Grantor/Grantee party tables.
   *
   * Capped to protect the 120s searchProperty budget: at most MAX_RESOLVE
   * deeds, and bails on timeout.
   */
  private async resolveUnknownParties(
    deeds: GSCCCADeedResult[],
    county: string | undefined,
    isTimedOut: () => boolean
  ): Promise<void> {
    const isUnknown = (v?: string) => {
      const s = (v || "").trim();
      return s === "" || /^unknown$/i.test(s);
    };

    const needsResolve = deeds.filter(
      (d) => d.bookPage && d.bookPage.includes("-") && (isUnknown(d.grantor) || isUnknown(d.grantee))
    );
    if (needsResolve.length === 0) return;

    // Prioritize CONVEYANCE instruments (the ones that form the chain of title)
    // over SD/CANC/REL/EASE noise (routed to the liens section, not the chain).
    // Without this, the front-loaded refinance SDs consume the cap and the
    // actual vesting WD never gets resolved — leaving the chain full of
    // "Unknown" grantors and triggering the panel kill we're trying to avoid.
    // GSCCCA's name index returns instrument names as FULL WORDS here
    // ("WARRANTY DEED", "QUIT CLAIM DEED", "SECURITY DEED", "CANCELLATION"),
    // not the WD/SD/CANC codes the orchestrator's classifier uses. Match the
    // word "DEED" while excluding the non-chain "SECURITY DEED" — that's the
    // robust signal for a chain-of-title conveyance across counties.
    const isConveyance = (d: GSCCCADeedResult) => {
      const t = (d.instrumentType || "").trim().toUpperCase();
      if (!t) return false;
      if (t.includes("SECURITY")) return false; // SECURITY DEED → liens, not chain
      // codes (some counties truncate) + full-word forms
      if (/^(WD|QCD|QC|TRSD|ESTD|GIFD|FCD|SHFD|TAXD|RWD|TIMD|GOMD|ORD|REGD)$/.test(t)) {
        return true;
      }
      return /\bDEED\b/.test(t) || /\bORDER\b/.test(t);
    };
    const prioritized = [...needsResolve].sort((a, b) => {
      const ca = isConveyance(a) ? 0 : 1;
      const cb = isConveyance(b) ? 0 : 1;
      return ca - cb;
    });

    // Cap detail pulls — each is GET + POST + GET (~3 round trips). The vesting
    // deed + a couple of conveyances are what matter for the chain; old SD/CANC
    // noise rarely benefits from resolution.
    const MAX_RESOLVE = 6;
    const targets = prioritized.slice(0, MAX_RESOLVE);
    console.log(
      `[GSCCCA-HTTP] Book/page resolution: ${needsResolve.length} deed(s) with Unknown parties, resolving up to ${targets.length}`
    );

    // Warm the form once; read the live hidden date fields + county id from it.
    let formGet;
    try {
      formGet = await this.client.get(URLS.realEstateBookPageSearch);
    } catch (err) {
      console.warn(`[GSCCCA-HTTP] Book/page form GET failed: ${err}`);
      return;
    }
    await this.humanDelay();
    const $form = cheerio.load(formGet.data || "");

    // Live hidden date fields the server requires (vary by session).
    const dateFields: Record<string, string> = {};
    for (const fn of ["dtSystemStart", "dtSystemEnd", "dtSysGoodFrom", "dtSysGoodThru"]) {
      const v = $form(`input[name="${fn}"]`).attr("value");
      if (v) dateFields[fn] = v;
    }

    // County id from the form's intCountyID select (alphabetical, APPLING=1...).
    const countyId = county
      ? this.findCountyOption($form, 'select[name="intCountyID"]', county)
      : null;
    if (!countyId) {
      console.warn(
        `[GSCCCA-HTTP] Book/page resolution: county id not found for "${county}" — skipping`
      );
      return;
    }

    for (const deed of targets) {
      if (isTimedOut()) {
        console.warn("[GSCCCA-HTTP] Timeout during book/page resolution — stopping");
        break;
      }
      const dash = deed.bookPage.indexOf("-");
      const book = deed.bookPage.slice(0, dash).trim();
      const page = deed.bookPage.slice(dash + 1).trim();
      if (!book || !page) continue;

      try {
        const resolved = await this.lookupPartiesByBookPage(book, page, countyId, dateFields);
        if (!resolved) continue;
        if (isUnknown(deed.grantor) && resolved.grantor) {
          deed.grantor = resolved.grantor;
        }
        if (isUnknown(deed.grantee) && resolved.grantee) {
          deed.grantee = resolved.grantee;
        }
        console.log(
          `[GSCCCA-HTTP]   Book ${book} Page ${page} → grantor="${deed.grantor}" grantee="${deed.grantee}"`
        );
      } catch (err) {
        console.warn(`[GSCCCA-HTTP] Book/page lookup failed for ${book}-${page}: ${err}`);
      }
      await this.humanDelay();
    }
  }

  /**
   * One book/page detail pull: POST rebooks.asp → extract final.asp Key → GET
   * final.asp → parse named Grantor/Grantee parties. Returns undefined if the
   * detail page can't be reached or parsed.
   */
  private async lookupPartiesByBookPage(
    book: string,
    page: string,
    countyId: string,
    dateFields: Record<string, string>
  ): Promise<{ grantor: string; grantee: string } | undefined> {
    const postBody = new URLSearchParams({
      txtSearchType: "2",
      intCountyID: countyId,
      txtBook: book,
      txtPage: page,
      ...dateFields,
    });

    const postResp = await this.client.post(URLS.realEstateBookPageSubmit, postBody.toString(), {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Referer: URLS.realEstateBookPageSearch,
        Origin: "https://search.gsccca.org",
      },
    });

    // The POST response carries a hidden frmSubmit form whose action points at
    // the detail page: final.asp?Type=2&County=..&Book=..&Page=+<p>&...&Key=<n>
    const postHtml: string = postResp.data || "";
    const actionMatch = postHtml.match(/action=["']?(final\.asp\?[^"'>\s]+)/i);
    if (!actionMatch) return undefined;

    // Decode &amp; and percent-encode the leading space GSCCCA puts before page.
    const finalPath = actionMatch[1].replace(/&amp;/g, "&").replace(/Page=\+/g, "Page=%20");
    const finalUrl = `https://search.gsccca.org/RealEstate/${finalPath}`;
    await this.humanDelay();
    const finalResp = await this.client.get(finalUrl);
    return this.parseBookPageParties(finalResp.data || "");
  }

  /**
   * Parse the named parties out of a final.asp detail page. Party names live in
   * the <td><font> rows that follow the <strong>Grantor</strong> /
   * <strong>Grantee</strong> table-cell headers (multiple rows = multiple parties).
   */
  private parseBookPageParties(html: string): { grantor: string; grantee: string } {
    const $ = cheerio.load(html);
    const clean = (v: string) => v.replace(/&nbsp;/gi, "").replace(/\s+/g, " ").trim();

    const collect = (label: "Grantor" | "Grantee"): string => {
      const names: string[] = [];
      $("strong").each((_i, el) => {
        if ($(el).text().trim().toLowerCase() !== label.toLowerCase()) return;
        // The header cell's parent row precedes the party-name rows; party
        // names are the <font> texts in the sibling rows of the same table.
        const headerCell = $(el).closest("td");
        const table = headerCell.closest("table");
        table.find("td font").each((_j, f) => {
          const t = clean($(f).text());
          if (!t) return;
          // Skip the literal column headers and obvious non-name labels.
          if (/^(grantor|grantee|book|page|instrument|date|county|party)$/i.test(t)) return;
          names.push(t);
        });
        return false; // first matching header table is the party table
      });
      // De-dupe preserving order.
      return Array.from(new Set(names)).join(" / ");
    };

    return { grantor: collect("Grantor"), grantee: collect("Grantee") };
  }

  /* ── PT-61 Address Search (Premium, ASP.NET WebForms) ── */

  private async searchPT61ByAddress(
    address: string,
    county?: string
  ): Promise<GSCCCA_PT61Result[]> {
    const results: GSCCCA_PT61Result[] = [];

    try {
      // GET the ASPX page to obtain __VIEWSTATE, __EVENTVALIDATION, etc.
      const getResp = await this.client.get(URLS.pt61AddressSearch);
      await this.humanDelay();

      const html = getResp.data || "";
      if (html.includes("internal server error") || html.includes("cannot be displayed")) {
        console.log("[GSCCCA-HTTP] PT-61 Premium page is down, skipping");
        return results;
      }

      const $ = cheerio.load(html);

      if ($("#BodyContent_txtAddress").length === 0) {
        console.log("[GSCCCA-HTTP] PT-61 Premium form not found, skipping");
        return results;
      }

      const { street } = this.parseAddress(address);

      // Build ASP.NET WebForms postback data
      // Extract ALL hidden fields (ViewState, EventValidation, PreviousPage, etc.)
      const formData: Record<string, string> = {};
      $('input[type="hidden"]').each((_i, el) => {
        const name = $(el).attr("name");
        const value = $(el).attr("value") || "";
        if (name) formData[name] = value;
      });

      // Extract select defaults (county, display type, records per page)
      $("select").each((_i, el) => {
        const name = $(el).attr("name");
        if (!name) return;
        const selected = $(el).find("option[selected]");
        if (selected.length > 0) {
          formData[name] = selected.attr("value") || selected.text().trim();
        } else {
          formData[name] = $(el).find("option").first().attr("value") || "";
        }
      });

      // CRITICAL: ASP.NET field names use "ctl00$BodyContent$" prefix
      formData["ctl00$BodyContent$txtAddress"] = street;

      // County dropdown
      if (county) {
        const countyOption = this.findCountyOption($, "#BodyContent_ddlCounties", county);
        if (countyOption) {
          formData["ctl00$BodyContent$ddlCounties"] = countyOption;
        }
      }

      // Date range
      const endDate = new Date();
      const startDate = new Date();
      startDate.setFullYear(startDate.getFullYear() - (this.searchYearsOverride ?? SEARCH_YEARS));
      formData["ctl00$BodyContent$txtDateFrom"] = this.formatDate(startDate);
      formData["ctl00$BodyContent$txtDateTo"] = this.formatDate(endDate);

      // The search button triggers a postback
      formData["ctl00$BodyContent$btnSearch"] = "Begin Search";

      // ASP.NET UpdatePanel async postback: requires ScriptManager field
      // The ScriptManager triggers a partial update via __doPostBack
      formData["ctl00$ScriptManager1"] = "ctl00$BodyContent$UpdatePanel1|ctl00$BodyContent$btnSearch";
      formData["__ASYNCPOST"] = "true";

      await this.humanDelay(500, 1000);

      // POST the form back to the same URL (ASP.NET WebForms async postback)
      const postResp = await this.client.post(
        URLS.pt61AddressSearch,
        new URLSearchParams(formData).toString(),
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Referer: URLS.pt61AddressSearch,
            Origin: "https://search.gsccca.org",
            "X-MicrosoftAjax": "Delta=true",
            "X-Requested-With": "XMLHttpRequest",
          },
        }
      );

      await this.humanDelay();

      let pt61Html = postResp.data || "";
      console.log(`[GSCCCA-HTTP] PT-61 response: ${postResp.status}, ${pt61Html.length} bytes`);

      // ASP.NET UpdatePanel returns pipe-delimited partial response
      // Format: length|type|id|content|...
      // We need to extract the HTML content from the UpdatePanel response
      if (pt61Html.includes("|updatePanel|") || pt61Html.includes("|BodyContent_UpdatePanel1|")) {
        console.log("[GSCCCA-HTTP] PT-61: Got UpdatePanel async response, extracting HTML");
        // Parse the pipe-delimited response
        const parts = pt61Html.split("|");
        let extractedHtml = "";
        for (let i = 0; i < parts.length - 3; i++) {
          if (parts[i + 1] === "updatePanel" && parts[i + 2]?.includes("UpdatePanel1")) {
            const length = parseInt(parts[i]);
            extractedHtml = parts[i + 3]?.substring(0, length) || "";
            break;
          }
        }
        if (extractedHtml) {
          pt61Html = extractedHtml;
          console.log(`[GSCCCA-HTTP] PT-61: Extracted ${pt61Html.length} bytes from UpdatePanel`);
        }
      }

      // Follow JS redirect if needed
      if (pt61Html.includes("frmLogin") && pt61Html.includes("login.asp")) {
        const redirected = await this.followJSRedirectForm(pt61Html);
        if (redirected) pt61Html = redirected;
      }

      results.push(...this.parsePT61Results(pt61Html));
    } catch (err) {
      console.error("[GSCCCA-HTTP] PT-61 address search error:", err);
    }

    return results;
  }

  /* ── Real Estate Name Search ── */

  private async searchRealEstateByName(
    lastName: string,
    county?: string
  ): Promise<GSCCCADeedResult[]> {
    const results: GSCCCADeedResult[] = [];

    try {
      // GET the name search form page
      const getResp = await this.client.get(URLS.realEstateNameSearch);
      await this.humanDelay();
      const rawHtml = getResp.data || "";
      const $ = cheerio.load(rawHtml);

      // Build form data from the SearchType form (NOT the site search or login forms)
      const searchForm = $('form[name="SearchType"]');
      const formData: Record<string, string> = {};

      // 1. Hidden inputs from SearchType form
      searchForm.find('input[type="hidden"]').each((_i, el) => {
        const name = $(el).attr("name");
        const value = $(el).attr("value") || "";
        if (name) formData[name] = value;
      });

      // 2. CRITICAL: Extract dt* system fields via regex (cheerio sometimes misparses values)
      const dtPattern = /name="(dt\w+)"\s+value="([^"]*)"/gi;
      let dtMatch;
      while ((dtMatch = dtPattern.exec(rawHtml)) !== null) {
        if (!formData[dtMatch[1]]) {
          formData[dtMatch[1]] = dtMatch[2];
        }
      }

      // 3. Select defaults (txtPartyType, txtInstrCode, MaxRows, TableType)
      searchForm.find("select").each((_i, el) => {
        const name = $(el).attr("name");
        if (!name) return;
        const selected = $(el).find("option[selected]");
        if (selected.length > 0) {
          formData[name] = selected.attr("value") || selected.text().trim();
        } else {
          const first = $(el).find("option").first();
          formData[name] = first.attr("value") || "";
        }
      });

      // 4. Radio button defaults (bolInclude)
      searchForm.find('input[type="radio"][checked]').each((_i, el) => {
        const name = $(el).attr("name");
        if (name) formData[name] = $(el).attr("value") || "";
      });

      // 5. Search parameters (override form defaults)
      const endDate = new Date();
      const startDate = new Date();
      startDate.setFullYear(startDate.getFullYear() - (this.searchYearsOverride ?? SEARCH_YEARS));

      formData["txtSearchName"] = lastName;
      formData["txtFromDate"] = this.formatDate(startDate);
      formData["txtToDate"] = this.formatDate(endDate);
      formData["MaxRows"] = "100"; // Override default of 5

      // 6. County
      if (county) {
        const countyOption = this.findCountyOption($, 'select[name="intCountyID"]', county);
        if (countyOption) {
          formData["intCountyID"] = countyOption;
        }
      }

      await this.humanDelay(500, 1000);

      // POST to names.asp (the form action)
      // The namesearch.asp form posts to names.asp?Type=0 for Real Estate
      const submitUrl = URLS.realEstateNameSubmit + "?Type=0";
      const postResp = await this.client.post(
        submitUrl,
        new URLSearchParams(formData).toString(),
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Referer: URLS.realEstateNameSearch,
            Origin: "https://search.gsccca.org",
          },
        }
      );

      await this.humanDelay();

      // Check for login redirect
      const responseUrl =
        postResp.request?.res?.responseUrl || postResp.config.url || "";
      if (responseUrl.includes("login")) {
        console.warn(`[GSCCCA-HTTP] RE search redirected to login — session expired`);
        this.isLoggedIn = false;
        const relogged = await this.login();
        if (!relogged) return results;
        return this.searchRealEstateByName(lastName, county);
      }

      let namesHtml = postResp.data || "";

      console.log(`[GSCCCA-HTTP] RE names.asp response status: ${postResp.status}, length: ${namesHtml.length}`);

      // GSCCCA uses JS-based redirects when session isn't valid on search.gsccca.org
      // The response contains a form with frmLogin that auto-submits via setTimeout
      // We need to follow this redirect by extracting and POSTing the form
      if (namesHtml.includes("frmLogin") && namesHtml.includes("login.asp")) {
        console.log(`[GSCCCA-HTTP] Detected JS redirect form in names.asp response — following redirect`);
        const redirectedHtml = await this.followJSRedirectForm(namesHtml);
        if (redirectedHtml) {
          namesHtml = redirectedHtml;
          console.log(`[GSCCCA-HTTP] After following redirect, got ${namesHtml.length} bytes`);
        } else {
          console.warn(`[GSCCCA-HTTP] Failed to follow JS redirect`);
          return results;
        }
      }

      // Parse the name list page — find radio buttons with entity names
      const $names = cheerio.load(namesHtml);
      const nameEntries: { value: string; name: string }[] = [];

      $names('input[name="rdoEntityName"]').each((_i, el) => {
        const value = $names(el).attr("value") || "";
        // Find the parent row to get the display name
        const row = $names(el).closest("tr");
        const cells = row.find("td");
        let displayName = "";
        cells.each((_j, td) => {
          const text = $names(td).text().trim();
          // Pick the cell that looks like a name (not the radio button cell)
          if (text.length > 2 && !$names(td).find("input").length) {
            if (!displayName) displayName = text;
          }
        });
        if (value) {
          nameEntries.push({ value, name: displayName || value });
        }
      });

      console.log(`[GSCCCA-HTTP] Found ${nameEntries.length} name entries for "${lastName}"`);

      // Order the entries so the ones most likely to surface a VESTING deed
      // get detail-pulled first. nameEntries here only carry { value, name } —
      // `value` is GSCCCA's opaque radio-button id, `name` is the party display
      // name from the name-list row. There is NO instrument-type (SD/WD/CANC)
      // signal available pre-detail-pull (that only appears after parseDeedResults
      // on the nameselected.asp response). So the strongest signal we actually
      // have in the data is the SEARCHED surname (`lastName`): for a frequently-
      // refinancing owner GSCCCA orders the current-owner SD/CANC index rows
      // ahead of the lone WD, and the vesting deed is indexed under the searched
      // (often prior-owner) surname. Entries whose display name contains the
      // searched surname token are therefore prioritised; everything else keeps
      // its original GSCCCA order (stable sort). We do NOT invent an SD-vs-WD
      // signal that the name-list page does not expose.
      const surnameToken = (lastName || "").trim().toUpperCase();
      if (surnameToken) {
        const matchesSurname = (e: { name: string }) =>
          e.name.toUpperCase().includes(surnameToken);
        nameEntries.sort((a, b) => {
          const am = matchesSurname(a) ? 0 : 1;
          const bm = matchesSurname(b) ? 0 : 1;
          return am - bm; // surname-matching entries first; Array.sort is stable
        });
      }

      // Extract all fields from the NameSearch form for detail POSTs
      // The NameSearch form posts to nameselected.asp (NOT names.asp)
      const nameSearchForm = $names('form[name="NameSearch"]');
      const baseDetailFields: Record<string, string> = {};

      if (nameSearchForm.length > 0) {
        // Hidden inputs
        nameSearchForm.find('input[type="hidden"]').each((_i, el) => {
          const name = $names(el).attr("name");
          const value = $names(el).attr("value") || "";
          if (name) baseDetailFields[name] = value;
        });
        // Text inputs (section, district, dates, etc.)
        nameSearchForm.find('input[type="text"]').each((_i, el) => {
          const name = $names(el).attr("name");
          const value = $names(el).attr("value") || "";
          if (name) baseDetailFields[name] = value;
        });
        // Select defaults
        nameSearchForm.find("select").each((_i, el) => {
          const name = $names(el).attr("name");
          if (!name) return;
          const selected = $names(el).find("option[selected]");
          if (selected.length > 0) {
            baseDetailFields[name] = selected.attr("value") || selected.text().trim();
          } else {
            baseDetailFields[name] = $names(el).find("option").first().attr("value") || "";
          }
        });
        // dtCurrSearchTime may be outside the form — get via regex
        const dtMatch = namesHtml.match(/name="(dtCurrSearchTime)"\s+value="([^"]*)"/i);
        if (dtMatch) baseDetailFields[dtMatch[1]] = dtMatch[2];
      }

      // For each name entry (cap at 12), get deed details via nameselected.asp.
      // Raised from 5 → 12 (Peachtree Battle bug, May 2026): for owners with
      // many refinancings GSCCCA returns 5+ SD/CANC index rows that consumed all
      // 5 slots, displacing the lone vesting WARRANTY DEED → empty chain_of_title
      // with 22 liens. The surname-priority sort above plus the higher cap give
      // the WD a slot. See project_cliros_gsccca_name_search_gap.md.
      for (const nameEntry of nameEntries.slice(0, 12)) {
        try {
          const detailFormData = { ...baseDetailFields, rdoEntityName: nameEntry.value };

          const detailResp = await this.client.post(
            URLS.realEstateNameSelected,
            new URLSearchParams(detailFormData).toString(),
            {
              headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                Referer: submitUrl,
                Origin: "https://search.gsccca.org",
              },
            }
          );

          await this.humanDelay();

          let deedHtml = detailResp.data || "";

          // Follow JS redirect if needed
          if (deedHtml.includes("frmLogin") && deedHtml.includes("login.asp")) {
            console.log(`[GSCCCA-HTTP] Deed detail got JS redirect — following`);
            const redirected = await this.followJSRedirectForm(deedHtml);
            if (redirected) deedHtml = redirected;
          }

          const deeds = this.parseDeedResults(deedHtml, nameEntry.name);
          results.push(...deeds);
          console.log(`[GSCCCA-HTTP]   -> ${deeds.length} deeds for "${nameEntry.name}"`);
        } catch (err) {
          console.error(`[GSCCCA-HTTP] Error getting deeds for "${nameEntry.name}":`, err);
        }
      }
    } catch (err) {
      console.error(`[GSCCCA-HTTP] Real Estate search error for "${lastName}":`, err);
    }

    return results;
  }

  /* ── Lien Name Search ── */

  private async searchLiensByName(
    lastName: string,
    county?: string
  ): Promise<GSCCCALienResult[]> {
    const results: GSCCCALienResult[] = [];

    try {
      const getResp = await this.client.get(URLS.lienNameSearch);
      await this.humanDelay();
      const rawHtml = getResp.data || "";
      const $ = cheerio.load(rawHtml);

      // Build form data from the correct search form (same pattern as RE search)
      const formData = this.extractSearchFormData($, rawHtml);

      formData["txtSearchName"] = lastName;
      formData["MaxRows"] = "25"; // Lower than RE search — we only fetch top 5 details anyway

      // Add date range
      const endDate = new Date();
      const startDate = new Date();
      startDate.setFullYear(startDate.getFullYear() - (this.searchYearsOverride ?? SEARCH_YEARS));
      formData["txtFromDate"] = this.formatDate(startDate);
      formData["txtToDate"] = this.formatDate(endDate);

      if (county) {
        const countyOption = this.findCountyOption($, 'select[name="intCountyID"]', county);
        if (countyOption) {
          formData["intCountyID"] = countyOption;
        }
      }

      await this.humanDelay(500, 1000);

      // Lien name search posts to liennames.asp (NOT names.asp)
      // The SearchType form action is "liennames.asp?Type=0"
      const submitUrl = URLS.lienNameSubmit + "?Type=0";
      const postResp = await this.client.post(
        submitUrl,
        new URLSearchParams(formData).toString(),
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Referer: URLS.lienNameSearch,
            Origin: "https://search.gsccca.org",
          },
        }
      );

      await this.humanDelay();

      let namesHtml = postResp.data || "";
      console.log(`[GSCCCA-HTTP] Lien liennames.asp response status: ${postResp.status}, length: ${namesHtml.length}`);

      // Follow JS redirect if needed (same pattern as RE search)
      if (namesHtml.includes("frmLogin") && namesHtml.includes("login.asp")) {
        console.log(`[GSCCCA-HTTP] Detected JS redirect in lien response — following`);
        const redirectedHtml = await this.followJSRedirectForm(namesHtml);
        if (redirectedHtml) {
          namesHtml = redirectedHtml;
        } else {
          console.warn(`[GSCCCA-HTTP] Failed to follow lien JS redirect`);
          return results;
        }
      }

      const $names = cheerio.load(namesHtml);

      // Parse lien name list (same radio button pattern as RE)
      const nameValues: string[] = [];
      $names('input[name="rdoEntityName"]').each((_i, el) => {
        const value = $names(el).attr("value") || "";
        if (value) nameValues.push(value);
      });

      console.log(`[GSCCCA-HTTP] Found ${nameValues.length} lien name entries for "${lastName}"`);

      // Extract all fields from the NameSearch form for detail POSTs
      const nameSearchForm = $names('form[name="NameSearch"]');
      const baseLienDetailFields: Record<string, string> = {};

      if (nameSearchForm.length > 0) {
        nameSearchForm.find('input[type="hidden"]').each((_i, el) => {
          const name = $names(el).attr("name");
          const value = $names(el).attr("value") || "";
          if (name) baseLienDetailFields[name] = value;
        });
        nameSearchForm.find('input[type="text"]').each((_i, el) => {
          const name = $names(el).attr("name");
          const value = $names(el).attr("value") || "";
          if (name) baseLienDetailFields[name] = value;
        });
        nameSearchForm.find("select").each((_i, el) => {
          const name = $names(el).attr("name");
          if (!name) return;
          const selected = $names(el).find("option[selected]");
          if (selected.length > 0) {
            baseLienDetailFields[name] = selected.attr("value") || selected.text().trim();
          } else {
            baseLienDetailFields[name] = $names(el).find("option").first().attr("value") || "";
          }
        });
        const dtMatch = namesHtml.match(/name="(dtCurrSearchTime)"\s+value="([^"]*)"/i);
        if (dtMatch) baseLienDetailFields[dtMatch[1]] = dtMatch[2];
      }

      for (const nameValue of nameValues.slice(0, 5)) {
        try {
          const detailFormData = { ...baseLienDetailFields, rdoEntityName: nameValue };

          // Lien detail posts to liennamesselected.asp
          const detailResp = await this.client.post(
            URLS.lienNameSelected,
            new URLSearchParams(detailFormData).toString(),
            {
              headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                Referer: submitUrl,
                Origin: "https://search.gsccca.org",
              },
            }
          );

          await this.humanDelay();

          let lienDetailHtml = detailResp.data || "";
          if (lienDetailHtml.includes("frmLogin") && lienDetailHtml.includes("login.asp")) {
            console.log(`[GSCCCA-HTTP] Lien detail got JS redirect — following`);
            const redirected = await this.followJSRedirectForm(lienDetailHtml);
            if (redirected) lienDetailHtml = redirected;
          }

          const liens = this.parseLienResults(lienDetailHtml);
          results.push(...liens);
        } catch (err) {
          console.error(`[GSCCCA-HTTP] Error getting liens for "${nameValue}":`, err);
        }
      }
    } catch (err) {
      console.error(`[GSCCCA-HTTP] Lien search error for "${lastName}":`, err);
    }

    return results;
  }

  /* ── UCC Name Search ── */

  private async searchUCCByName(lastName: string): Promise<GSCCCAUCCResult[]> {
    const results: GSCCCAUCCResult[] = [];

    try {
      const getResp = await this.client.get(URLS.uccSearch);
      await this.humanDelay();
      const $ = cheerio.load(getResp.data);

      const endDate = new Date();
      const startDate = new Date();
      startDate.setFullYear(startDate.getFullYear() - (this.searchYearsOverride ?? SEARCH_YEARS));

      const formData: Record<string, string> = {
        DebtorLastName: lastName,
        FromDate: this.formatDate(startDate),
        ToDate: this.formatDate(endDate),
      };

      // Collect hidden fields
      const hiddenFields = this.extractFormFields($, $("form").first());
      for (const [k, v] of Object.entries(hiddenFields)) {
        if (!(k in formData)) formData[k] = v;
      }

      await this.humanDelay(500, 1000);

      // Find the form action or post to same URL
      const form = $("form").first();
      const action = form.attr("action");
      const submitUrl = action
        ? new URL(action, URLS.uccSearch).href
        : URLS.uccSearch;

      const postResp = await this.client.post(
        submitUrl,
        new URLSearchParams(formData).toString(),
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Referer: URLS.uccSearch,
            Origin: "https://search.gsccca.org",
          },
        }
      );

      await this.humanDelay();

      let uccHtml = postResp.data || "";
      if (uccHtml.includes("frmLogin") && uccHtml.includes("login.asp")) {
        console.log(`[GSCCCA-HTTP] UCC got JS redirect — following`);
        const redirected = await this.followJSRedirectForm(uccHtml);
        if (redirected) uccHtml = redirected;
      }

      results.push(...this.parseUCCResults(uccHtml));
    } catch (err) {
      console.error(`[GSCCCA-HTTP] UCC search error for "${lastName}":`, err);
    }

    return results;
  }

  /* ── Result Parsers ── */

  private parseDeedResults(html: string, searchedName?: string): GSCCCADeedResult[] {
    const $ = cheerio.load(html);
    const name = searchedName || "Unknown";
    const cleanVal = (v?: string) => v?.replace(/&nbsp;/gi, "").replace(/\s+/g, " ").trim() || "";
    const cleanParty = (v?: string) => {
      const s = cleanVal(v);
      if (!s) return "";
      if (/^\d+$/.test(s)) return "";
      if (/^(LOT|BLOCK|UNIT|SUBDIVISION)\b/i.test(s)) return "";
      if (s.length <= 2) return "";
      if (/^UNKNOWN$/i.test(s)) return "";
      return s;
    };

    // GSCCCA returns separate index rows per party (grantor row + grantee row).
    // Merge by instrument key before emitting — fixes grantor=grantee self-deeds.
    type PartialDeed = {
      recordedDate: string;
      bookPage: string;
      instrumentType: string;
      county: string;
      grantor: string;
      grantee: string;
      legalDescription?: string;
      allText: string;
    };
    const byInstrument = new Map<string, PartialDeed>();

    $("table.table_borders").each((_i, table) => {
      const headerCells = $(table).find("td.reg_deed_cell_borders");
      if (headerCells.length < 4) return;

      const icon = headerCells.eq(0).find("img");
      const iconSrc = icon.attr("src") || "";
      const iconAlt = (icon.attr("alt") || "").toLowerCase();
      const partyRole =
        iconAlt ||
        (iconSrc.includes("sym_gr")
          ? "grantor"
          : iconSrc.includes("sym_ge")
            ? "grantee"
            : iconSrc.includes("dp")
              ? "grantor"
              : "grantee");

      const county = (headerCells.eq(1).text().trim() || "").replace(" County", "");
      const instrumentType = headerCells.eq(2).text().trim() || "";

      const filedText = headerCells.eq(3).text().trim();
      const dateMatch = filedText.match(/FILED:\s*(.+)/i);
      const filedDate = dateMatch?.[1]?.trim() || "";

      const bookText = headerCells.length > 4 ? headerCells.eq(4).text().trim() : "";
      const book = bookText.match(/BOOK:\s*(.+)/i)?.[1]?.trim() || "";

      const pageText = headerCells.length > 5 ? headerCells.eq(5).text().trim() : "";
      const pageNum = pageText.match(/PAGE:\s*(.+)/i)?.[1]?.trim() || "";

      const bookPage = book && pageNum ? `${book}-${pageNum}` : "";
      // Pair grantor + grantee index rows: same instrument shares book-page
      const key = bookPage
        ? `${bookPage}|${instrumentType}`
        : `${county}|${this.normalizeDate(filedDate)}|${instrumentType}`;

      const propCells = $(table).find("td.reg_property_cell_borders");
      const propText = propCells
        .map((_j, td) => $(td).text().trim())
        .get()
        .join(" ");

      const subdivMatch = propText.match(/SUBDIVISION:\s*(.+?)(?:\s+(?:UNIT|LOT|BLOCK|COMMENTS):|$)/i);
      const lotMatch = propText.match(/LOT:\s*(.+?)(?:\s+(?:BLOCK|COMMENTS|UNIT):|$)/i);
      const blockMatch = propText.match(/BLOCK:\s*(.+?)(?:\s+(?:COMMENTS|LOT|UNIT):|$)/i);

      const allText = $(table).text();
      let grantorMatch = allText.match(/GRANTOR:\s*(.+?)(?:\n|GRANTEE:|$)/i);
      let granteeMatch = allText.match(/GRANTEE:\s*(.+?)(?:\n|GRANTOR:|$)/i);

      // GSCCCA sometimes uses "Grantor Name" without a colon in party rows
      if (!grantorMatch) {
        grantorMatch = allText.match(/Grantor\s*Name[:\s]+(.+?)(?:\n|Grantee|$)/i);
      }
      if (!granteeMatch) {
        granteeMatch = allText.match(/Grantee\s*Name[:\s]+(.+?)(?:\n|Grantor|$)/i);
      }

      let rowGrantor = cleanParty(grantorMatch?.[1]);
      let rowGrantee = cleanParty(granteeMatch?.[1]);

      // Party rows: scan td cells for labeled names
      $(table)
        .find("td")
        .each((_j, td) => {
          const cellText = cleanVal($(td).text());
          if (!cellText) return;
          if (/^GRANTOR\b/i.test(cellText) && cellText.length > 10) {
            rowGrantor = rowGrantor || cleanParty(cellText.replace(/^GRANTOR[:\s]+/i, ""));
          }
          if (/^GRANTEE\b/i.test(cellText) && cellText.length > 10) {
            rowGrantee = rowGrantee || cleanParty(cellText.replace(/^GRANTEE[:\s]+/i, ""));
          }
        });

      if (!rowGrantor && !rowGrantee) {
        if (partyRole.includes("grantor")) rowGrantor = name;
        else rowGrantee = name;
      }

      const subdivVal = cleanVal(subdivMatch?.[1]);
      const lotVal = cleanVal(lotMatch?.[1]);
      const blockVal = cleanVal(blockMatch?.[1]);
      const legalDescription =
        [subdivVal && `Subdivision: ${subdivVal}`, lotVal && `Lot: ${lotVal}`, blockVal && `Block: ${blockVal}`]
          .filter(Boolean)
          .join(", ") || undefined;

      const existing = byInstrument.get(key);
      if (existing) {
        if (rowGrantor) existing.grantor = rowGrantor;
        if (rowGrantee) existing.grantee = rowGrantee;
        if (legalDescription && !existing.legalDescription) existing.legalDescription = legalDescription;
        existing.allText = `${existing.allText}\n${allText}`;
      } else {
        byInstrument.set(key, {
          recordedDate: this.normalizeDate(filedDate),
          bookPage,
          instrumentType,
          county,
          grantor: rowGrantor,
          grantee: rowGrantee,
          legalDescription,
          allText,
        });
      }
    });

    const results: GSCCCADeedResult[] = [];
    const norm = (s: string) => s.replace(/&nbsp;/gi, "").replace(/\s+/g, " ").trim().toUpperCase();
    const searchedNorm = norm(name);

    for (const d of byInstrument.values()) {
      let grantor = d.grantor;
      let grantee = d.grantee;
      // If one party is the searched name and the other is empty, do not label empty as Unknown yet
      if (!grantor && grantee && norm(grantee) === searchedNorm) grantor = "";
      if (!grantee && grantor && norm(grantor) === searchedNorm) grantee = "";

      const instrumentUpper = (d.instrumentType || "").toUpperCase();
      const referencedBookPage =
        instrumentUpper === "CANC" || instrumentUpper === "REL" || /cancel|release/i.test(d.instrumentType || "")
          ? this.extractReferencedBookPage(d.allText, d.bookPage)
          : undefined;

      results.push({
        recordedDate: d.recordedDate,
        bookPage: d.bookPage,
        instrumentType: d.instrumentType,
        grantor: grantor || "Unknown",
        grantee: grantee || "Unknown",
        county: d.county,
        legalDescription: d.legalDescription,
        referencedBookPage,
      });
    }

    return results;
  }

  /** Parse cited SD book/page on CANC/REL — skip this instrument's own index book/page */
  private extractReferencedBookPage(text: string, ownBookPage?: string): string | undefined {
    if (!text) return undefined;
    const ownKey = (ownBookPage || "").replace(/\s+/g, "").replace(/[^0-9-]/g, "-").replace(/-+/g, "-");
    const patterns = [
      /(?:IN\s+)?BOOK[:\s]*(\d+)\s*[,.\s]+\s*PAGE[:\s]*(\d+)/gi,
      /B\/P[:\s]*(\d+)\s*[-/]\s*(\d+)/gi,
      /Book\s+(\d+)\s+Page\s+(\d+)/gi,
      /SECURITY\s+DEED.*?BOOK[:\s]*(\d+).*?PAGE[:\s]*(\d+)/gi,
    ];
    const found: string[] = [];
    for (const re of patterns) {
      for (const m of text.matchAll(re)) {
        if (m[1] && m[2]) found.push(`${m[1].trim()}-${m[2].trim()}`);
      }
    }
    const norm = (bp: string) => bp.replace(/\s+/g, "").replace(/[^0-9-]/g, "-").replace(/-+/g, "-");
    const unique = [...new Set(found)];
    const notOwn = unique.filter((bp) => norm(bp) !== ownKey);
    if (notOwn.length > 0) return notOwn[notOwn.length - 1];
    return unique.length > 1 ? unique[unique.length - 1] : undefined;
  }

  private parseLienResults(html: string): GSCCCALienResult[] {
    const $ = cheerio.load(html);

    // Try bordered_cell layout first (lien detail pages)
    const borderedCells = $("td.bordered_cell");
    if (borderedCells.length > 0) {
      const instruments: Array<{
        county: string;
        instrumentType: string;
        filedDate: string;
        book: string;
        page: string;
        bookPage: string;
        partyRole: string;
      }> = [];

      $("table").each((_i, table) => {
        $(table)
          .find("tr")
          .each((_j, row) => {
            const cells = $(row).find("td.bordered_cell");
            if (cells.length < 6) return;

            const firstCellText = cells.eq(0).text().trim();
            if (firstCellText === "Selection" || firstCellText === "County") return;

            const icon = cells.eq(0).find("img");
            const iconSrc = icon.attr("src") || "";
            let partyRole = "";
            if (iconSrc.includes("sym_dp")) partyRole = "debtor";
            else if (iconSrc.includes("sym_rp")) partyRole = "creditor";

            if (!partyRole && !icon.length) return;

            const county = (cells.eq(1).text().trim() || "").replace(" County", "");
            const instrumentType = cells.eq(2).text().trim() || "";
            const filedDate = cells.eq(3).text().trim() || "";
            const book = cells.eq(4).text().trim() || "";
            const pageNum = cells.eq(5).text().trim() || "";

            if (!county && !instrumentType && !filedDate) return;

            instruments.push({
              county,
              instrumentType,
              filedDate,
              book,
              page: pageNum,
              bookPage: book && pageNum ? `${book}-${pageNum}` : "",
              partyRole,
            });
          });
      });

      // Group debtor/creditor pairs
      const lienResults: GSCCCALienResult[] = [];
      let currentLien: GSCCCALienResult | null = null;

      for (const inst of instruments) {
        if (inst.partyRole === "debtor") {
          if (currentLien) lienResults.push(currentLien);
          currentLien = {
            recordedDate: this.normalizeDate(inst.filedDate),
            bookPage: inst.bookPage,
            instrumentType: inst.instrumentType,
            debtor: "",
            creditor: "",
            county: inst.county,
          };
        } else if (inst.partyRole === "creditor" && currentLien) {
          currentLien.creditor = inst.county || "";
        } else {
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

    // Fallback: table_borders layout
    const results: GSCCCALienResult[] = [];
    $("table.table_borders").each((_i, table) => {
      const headerCells = $(table).find("td.reg_deed_cell_borders");
      if (headerCells.length < 4) return;

      const county = (headerCells.eq(1).text().trim() || "").replace(" County", "");
      const instrumentType = headerCells.eq(2).text().trim() || "";
      const filedText = headerCells.eq(3).text().trim();
      const filedDate = filedText.match(/FILED:\s*(.+)/i)?.[1]?.trim() || "";
      const book =
        headerCells.length > 4
          ? headerCells.eq(4).text().trim().match(/BOOK:\s*(.+)/i)?.[1]?.trim() || ""
          : "";
      const pageNum =
        headerCells.length > 5
          ? headerCells.eq(5).text().trim().match(/PAGE:\s*(.+)/i)?.[1]?.trim() || ""
          : "";

      results.push({
        recordedDate: this.normalizeDate(filedDate),
        bookPage: book && pageNum ? `${book}-${pageNum}` : "",
        instrumentType,
        debtor: "",
        creditor: "",
        county,
      });
    });

    return results;
  }

  private parseUCCResults(html: string): GSCCCAUCCResult[] {
    const $ = cheerio.load(html);
    const pageText = $.root().text();

    if (/no records? found|no results|0 records? returned|your search returned no/i.test(pageText)) {
      console.log("[GSCCCA-HTTP] UCC: No records found on page");
      return [];
    }

    const resultTable = $("#gvResults, table.results, table.searchResults");
    if (resultTable.length === 0) {
      console.log("[GSCCCA-HTTP] UCC: No result table found");
      return [];
    }

    const results: GSCCCAUCCResult[] = [];
    resultTable.find("tr").each((_i, tr) => {
      // Skip header rows
      if ($(tr).find("th").length > 0) return;
      const cells = $(tr)
        .find("td")
        .map((_j, td) => $(td).text().trim())
        .get();
      if (cells.length < 3) return;

      const mapped = this.mapUCCRow(cells);
      if (mapped) results.push(mapped);
    });

    return results;
  }

  private parsePT61Results(html: string): GSCCCA_PT61Result[] {
    const $ = cheerio.load(html);
    const pageText = $.root().text();

    const noResultPatterns = [
      /no records? found/i,
      /no results/i,
      /0 records? returned/i,
      /your search returned no/i,
      /no matching/i,
    ];
    if (noResultPatterns.some((p) => p.test(pageText))) {
      console.log("[GSCCCA-HTTP] PT-61: No records found on page");
      return [];
    }

    const resultTable = $(
      "#BodyContent_gvResults, #gvResults, table.results, table.searchResults"
    );
    if (resultTable.length === 0) {
      console.log("[GSCCCA-HTTP] PT-61: No result table found on page");
      return [];
    }

    const rows: string[][] = [];
    resultTable.find("tr").each((_i, tr) => {
      if ($(tr).find("th").length > 0) return;
      const cells = $(tr)
        .find("td")
        .map((_j, td) => $(td).text().trim())
        .get();
      if (cells.length >= 3) rows.push(cells);
    });

    const parsed = rows
      .map((cells) => this.mapPT61Row(cells))
      .filter((p): p is GSCCCA_PT61Result => p !== null);

    // Validate: filter out garbage rows
    const validated = parsed.filter((p) => {
      const hasDate = p.saleDate && /^\d{4}-\d{2}-\d{2}$/.test(p.saleDate);
      const hasAddress = p.address && /\d+\s+\w+/.test(p.address);
      const hasRealName =
        p.grantor &&
        p.grantor !== "Unknown" &&
        p.grantor.length > 2 &&
        !/^(SEARCHED|PREMIUM|EXPAND|UNKNOWN|SALE|PT-61)$/i.test(p.grantor);
      return hasDate || hasAddress || hasRealName;
    });

    console.log(
      `[GSCCCA-HTTP] PT-61: ${rows.length} raw rows -> ${validated.length} validated results`
    );
    return validated;
  }

  /* ── Row Mappers (same logic as original agent) ── */

  private mapUCCRow(cells: string[]): GSCCCAUCCResult | null {
    if (cells.length < 3) return null;
    try {
      return {
        fileDate: this.normalizeDate(cells[0] || ""),
        fileNumber: cells[1] || "",
        debtor: cells[2] || "Unknown",
        securedParty: cells[3] || "Unknown",
        status: /active|current/i.test(cells.join(" "))
          ? "active"
          : /terminat|lapse/i.test(cells.join(" "))
            ? "terminated"
            : "active",
      };
    } catch {
      return null;
    }
  }

  private mapPT61Row(cells: string[]): GSCCCA_PT61Result | null {
    if (cells.length < 3) return null;
    try {
      let date = "",
        address = "",
        grantor = "",
        grantee = "";
      const salePrice = this.extractDollarAmount(cells.join(" ")) || 0;

      for (const cell of cells) {
        if (!date && /\d{1,2}\/\d{1,2}\/\d{2,4}/.test(cell)) {
          date = cell;
        } else if (
          !address &&
          /\d+\s+\w+\s+(st|rd|ave|dr|ln|ct|blvd|way|pl|cir)/i.test(cell)
        ) {
          address = cell;
        }
      }

      const nameCells = cells.filter(
        (c) =>
          c !== date && c !== address && c.length > 1 && !/^\$/.test(c) && !/^\d+$/.test(c)
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

  /* ── ASP.NET WebForms Helpers ── */

  /**
   * Extract __VIEWSTATE, __VIEWSTATEGENERATOR, __EVENTVALIDATION, and other
   * ASP.NET hidden fields from a cheerio-loaded page.
   */
  private extractAspNetFormFields($: CheerioRoot): Record<string, string> {
    const fields: Record<string, string> = {};
    const aspNetFields = [
      "__VIEWSTATE",
      "__VIEWSTATEGENERATOR",
      "__EVENTVALIDATION",
      "__EVENTTARGET",
      "__EVENTARGUMENT",
      "__PREVIOUSPAGE",
      "__SCROLLPOSITIONX",
      "__SCROLLPOSITIONY",
    ];

    for (const fieldName of aspNetFields) {
      const val = $(`#${fieldName}`).attr("value") || $(`input[name="${fieldName}"]`).attr("value");
      if (val !== undefined) {
        fields[fieldName] = val;
      }
    }

    return fields;
  }

  /**
   * Extract all form fields (hidden inputs, etc.) from a specific form.
   */
  private extractFormFields(
    $: CheerioRoot,
    form: CheerioSelection
  ): Record<string, string> {
    const fields: Record<string, string> = {};
    form.find('input[type="hidden"]').each((_i, el) => {
      const name = $(el).attr("name");
      const value = $(el).attr("value") || "";
      if (name) fields[name] = value;
    });
    return fields;
  }

  /**
   * Find a county option value from a select dropdown, matching by label.
   */
  private findCountyOption(
    $: CheerioRoot,
    selector: string,
    county: string
  ): string | null {
    let matchValue: string | null = null;

    $(selector)
      .find("option")
      .each((_i, el) => {
        const text = $(el).text().trim();
        const value = $(el).attr("value") || "";
        if (text.toUpperCase() === county.toUpperCase()) {
          matchValue = value;
          return false; // break
        }
        if (text.toLowerCase().includes(county.toLowerCase()) && !matchValue) {
          matchValue = value;
        }
      });

    return matchValue;
  }

  /**
   * Extract all form data from a GSCCCA search page.
   * GSCCCA pages have multiple forms (site search, login, and the actual search form).
   * The search form is named "SearchType" or is the one containing txtSearchName.
   * CRITICAL: must include dt* system fields and all select defaults — without them
   * the server returns "no records found" or 500 errors.
   */
  private extractSearchFormData($: CheerioRoot, rawHtml: string): Record<string, string> {
    const formData: Record<string, string> = {};

    // Find the correct search form
    let searchForm = $('form[name="SearchType"]');
    if (searchForm.length === 0) {
      searchForm = $("form").filter((_i, el) => $(el).find('[name="txtSearchName"]').length > 0);
    }
    if (searchForm.length === 0) {
      // Fallback: get all hidden fields
      $('input[type="hidden"]').each((_i, el) => {
        const name = $(el).attr("name");
        const value = $(el).attr("value") || "";
        if (name) formData[name] = value;
      });
      return formData;
    }

    // 1. Hidden inputs from the form
    searchForm.find('input[type="hidden"]').each((_i, el) => {
      const name = $(el).attr("name");
      const value = $(el).attr("value") || "";
      if (name) formData[name] = value;
    });

    // 2. CRITICAL: Extract dt* system fields via regex
    // Cheerio sometimes misparses values with quotes; regex is more reliable
    const dtPattern = /name="(dt\w+)"\s+value="([^"]*)"/gi;
    let dtMatch;
    while ((dtMatch = dtPattern.exec(rawHtml)) !== null) {
      if (!formData[dtMatch[1]]) {
        formData[dtMatch[1]] = dtMatch[2];
      }
    }

    // 3. Select defaults (txtPartyType, txtInstrCode, MaxRows, TableType, intCountyID)
    searchForm.find("select").each((_i, el) => {
      const name = $(el).attr("name");
      if (!name) return;
      const selected = $(el).find("option[selected]");
      if (selected.length > 0) {
        formData[name] = selected.attr("value") || selected.text().trim();
      } else {
        const first = $(el).find("option").first();
        formData[name] = first.attr("value") || "";
      }
    });

    // 4. Radio button defaults (bolInclude)
    const radioNames = new Set<string>();
    searchForm.find('input[type="radio"]').each((_i, el) => {
      const name = $(el).attr("name");
      if (name && !radioNames.has(name)) {
        const checked = searchForm.find(`input[name="${name}"][checked]`);
        if (checked.length > 0) {
          formData[name] = checked.attr("value") || "";
        }
        radioNames.add(name);
      }
    });

    return formData;
  }

  /* ── General Helpers ── */

  private async humanDelay(minMs?: number, maxMs?: number): Promise<void> {
    const min = minMs || MIN_DELAY_MS;
    const max = maxMs || MAX_DELAY_MS;
    const delay = Math.floor(Math.random() * (max - min + 1)) + min;
    await new Promise((resolve) => setTimeout(resolve, delay));
  }

  private parseAddress(fullAddress: string): {
    street: string;
    city: string;
    state: string;
    zip: string;
  } {
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

  /* ── Debug ── */

  async captureDebugInfo(): Promise<{
    url: string;
    title: string;
    formFields: { name: string; id: string; type: string }[];
    tableHeaders: string[][];
  }> {
    // In HTTP mode, we don't have a live page — return empty debug info
    return {
      url: "(HTTP mode — no live page)",
      title: "(HTTP mode)",
      formFields: [],
      tableHeaders: [],
    };
  }
}

/* ─── Factory ─── */

export function createGSCCCAAgent(): GSCCCAAgent {
  const username = process.env.GSCCCA_USERNAME;
  const password = process.env.GSCCCA_PASSWORD;

  if (!username || !password) {
    throw new Error(
      "GSCCCA_USERNAME and GSCCCA_PASSWORD environment variables are required"
    );
  }

  return new GSCCCAAgent({ username, password });
}
