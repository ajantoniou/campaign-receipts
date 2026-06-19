/* ─── GA county tax commissioner + GSCCCA deep links ───
   Used by attorney action plan workbench for mailto and external lookups.
*/

export interface CountyResource {
  county: string;
  taxPortalUrl: string;
  taxCommissionerEmail?: string;
  taxOfficePhone?: string;
  /** Clerk of Superior Court real-estate-recording line. ONLY populate from an
   *  authoritative official-domain source (the county clerk's own site). A
   *  hallucinated clerk number ships malpractice — when not verified, leave
   *  undefined and the callout renders a literal [MUST-VERIFY] token instead of
   *  any number. */
  clerkRealEstatePhone?: string;
  /** Source URL backing clerkRealEstatePhone (audit trail; verify-before-quote). */
  clerkPhoneSource?: string;
  /** Whether clerkRealEstatePhone is the dedicated Real-Estate/Deeds recording
   *  line ("re_direct") or only the Clerk's general main line ("main_line").
   *  When "main_line", the callout tells the attorney to ASK FOR the Real
   *  Estate / Deeds division on transfer — honest about what they'll reach.
   *  Defaults to "re_direct" when a number is present without this field. */
  clerkPhoneKind?: "re_direct" | "main_line";
}

const COUNTIES: Record<string, CountyResource> = {
  fulton: {
    county: "Fulton",
    taxPortalUrl: "https://www.fultoncountytaxes.org/property-taxes",
    taxCommissionerEmail: "tax@fultoncountyga.gov",
    taxOfficePhone: "(404) 612-6400",
    // VERIFIED on two official fultonclerk.org pages (Deeds-and-Records +
    // Recording-Division), labeled "Real Estate Recording Customer Service line."
    clerkRealEstatePhone: "(404) 613-5313",
    clerkPhoneSource: "https://www.fultonclerk.org/143/Deeds-and-Records",
  },
  dekalb: {
    county: "DeKalb",
    taxPortalUrl: "https://www.dekalbtax.org/",
    taxCommissionerEmail: "taxcommissioner@dekalbcountyga.gov",
    taxOfficePhone: "(404) 298-4000",
    // VERIFIED on the Clerk of Superior Court's own Contact-Real-Estate page:
    // the number printed beneath the "Real Estate Suite / Ground Floor" address.
    // (General clerk line 404-371-2836 is NOT the RE line.)
    clerkRealEstatePhone: "(404) 687-3812",
    clerkPhoneSource: "https://www.dksuperiorclerk.com/contactrealestate/",
    clerkPhoneKind: "re_direct",
  },
  cobb: {
    county: "Cobb",
    taxPortalUrl: "https://www.cobbtax.org/",
    taxCommissionerEmail: "taxcommissioner@cobbcounty.org",
    taxOfficePhone: "(770) 528-8600",
    // VERIFIED on the Clerk of Superior Court's official Real-Estate-Information
    // page, labeled "Recording/Filing 770-528-1360" (the office also lists a
    // separate "Deed Room 770-528-1328" for image copies).
    clerkRealEstatePhone: "(770) 528-1360",
    clerkPhoneSource: "https://www.cobbsuperiorcourtclerk.com/real-estate-information/",
    clerkPhoneKind: "re_direct",
  },
  clayton: {
    county: "Clayton",
    taxPortalUrl: "https://www.claytoncountyga.gov/government/tax-commissioner",
    taxCommissionerEmail: undefined,
    taxOfficePhone: "(770) 477-3311",
    // VERIFIED on the official GSCCCA Clayton clerk-contact page, labeled
    // "Real Estate Records (Notaries, Tradenames, etc.) - 770-477-3395"
    // (distinct from Main Office 770-477-4565).
    clerkRealEstatePhone: "(770) 477-3395",
    clerkPhoneSource: "https://www.gsccca.org/clerks/clerk-results?cid=31",
    clerkPhoneKind: "re_direct",
  },
  gwinnett: {
    county: "Gwinnett",
    taxPortalUrl: "https://www.gwinnetttaxcommissioner.com/",
    taxCommissionerEmail: "tax@gwinnettcounty.com",
    taxOfficePhone: "(770) 822-8800",
    // VERIFIED Clerk main line on gwinnettcourts.com Deeds-and-Land-Records page
    // + GSCCCA cid=67. No RE-recording-specific phone is published on any
    // official source — attorney must ask for the Real Estate / Deeds division.
    clerkRealEstatePhone: "(770) 822-8100",
    clerkPhoneSource: "https://www.gwinnettcourts.com/deeds-and-land-records/",
    clerkPhoneKind: "main_line",
  },
  henry: {
    county: "Henry",
    taxPortalUrl: "https://www.henrycountytax.com/",
    taxCommissionerEmail: undefined,
    taxOfficePhone: "(770) 288-8180",
    // VERIFIED Clerk of Superior Court office line on official GSCCCA cid=75.
    // No RE-recording-specific phone published — ask for Real Estate / Deeds.
    clerkRealEstatePhone: "(770) 288-8022",
    clerkPhoneSource: "https://www.gsccca.org/clerks/clerk-results?cid=75",
    clerkPhoneKind: "main_line",
  },
  cherokee: {
    county: "Cherokee",
    taxPortalUrl: "https://www.cherokeega.com/tax-commissioner/",
    taxCommissionerEmail: "taxcommissioner@cherokeega.com",
    taxOfficePhone: "(678) 493-6400",
    // INTENTIONALLY UNVERIFIED — two official sources CONFLICT on the Deeds &
    // Records line: the Clerk's own site (cherokeecourtclerk.com) says
    // 678-493-6540; the official GSCCCA page (cid=28) says 678-493-6592. Per the
    // malpractice-grade rule, we do NOT pick one — the callout renders the
    // [MUST-VERIFY] token so a human confirms which currently reaches the RE desk.
    // (Independently-confirmed main line if needed: 678-493-6511.)
  },
};

export function normalizeCountyKey(county?: string): string {
  if (!county) return "fulton";
  return county.toLowerCase().replace(/\s+county$/i, "").trim();
}

export function getCountyResource(county?: string): CountyResource {
  const key = normalizeCountyKey(county);
  return COUNTIES[key] || {
    county: county || "Georgia",
    taxPortalUrl: "https://search.gsccca.org/RealEstatePremium/InstrumentTypeSearch.aspx",
    taxCommissionerEmail: undefined,
    taxOfficePhone: undefined,
  };
}

/** GSCCCA instrument search — attorney opens and enters book-page manually. */
export function gscccaInstrumentSearchUrl(): string {
  return "https://search.gsccca.org/RealEstatePremium/InstrumentTypeSearch.aspx";
}

export function gscccaLienSearchUrl(): string {
  return "https://search.gsccca.org/lien/namesearch.asp";
}

/** Live per-county GSCCCA Index-Data Good-From/Thru page. Tells the attorney
 *  whether the online index even covers a given instrument date (statewide
 *  real-estate name index starts 1999-01-01; plat index 2004-01-01; image
 *  coverage is per-county and incomplete). VERIFIED source pattern. */
export function gscccaCountyGoodThruUrl(county?: string): string | undefined {
  const code = GSCCCA_COUNTY_CODES[(county || "").toUpperCase().replace(/\s+county$/i, "").trim()];
  if (!code) return undefined;
  return `https://search.gsccca.org/RealEstate/goodthru.asp?appid=4&CountyID=${code}`;
}

/**
 * Render the "this needs a human phone call" callout for a curative fact the
 * online GSCCCA index does NOT contain (e.g. a 2001 security-deed maturity
 * date for the §44-14-80 reversion test; an 'Unknown' grantee the book/page
 * resolver couldn't name; a pre-1999 / pre-image-coverage instrument).
 *
 * DISCIPLINE: never substitute a guessed clerk phone number. If the county's
 * clerkRealEstatePhone is not VERIFIED-from-official-source, the callout prints
 * the literal `[MUST-VERIFY: <County> Clerk of Superior Court phone]` token so
 * a human supplies it before the dossier ships. The clerk provides a document
 * COPY, not legal research — the copy reflects that.
 */
export function buildClerkCallout(params: {
  county?: string;
  book?: string;
  page?: string;
  /** What the online index lacks, e.g. "maturity date", "grantee name". */
  missingField: string;
  /** Why it's not online, e.g. "maturity dates appear only on the recorded image". */
  why: string;
}): string {
  const res = getCountyResource(params.county);
  const countyName = res.county;
  const phone =
    res.clerkRealEstatePhone ||
    `[MUST-VERIFY: ${countyName} Clerk of Superior Court real-estate-recording phone]`;
  const bp =
    params.book && params.page ? `Book ${params.book}/Page ${params.page}` : "the cited instrument";
  // When the verified number is only the Clerk's general main line (no RE-direct
  // line is published officially), tell the attorney to ask for the Real Estate
  // / Deeds division on transfer — honest about what the number reaches.
  const linePhrase =
    res.clerkRealEstatePhone && res.clerkPhoneKind === "main_line"
      ? `Call the ${countyName} Clerk of Superior Court main line at ${phone} and ask for the Real Estate / Deeds & Records division`
      : `Call the ${countyName} Clerk of Superior Court real-estate-recording line at ${phone}`;
  return (
    `Human action required — ${countyName} County Clerk of Superior Court. ` +
    `The online GSCCCA index does not contain the ${params.missingField} for this instrument ` +
    `(${params.why}). ${linePhrase} to request the recorded image at ${bp}; ` +
    `read the ${params.missingField} from the image. ` +
    `(The clerk provides the document copy, not legal research.)`
  );
}

/** GSCCCA county codes (intCountyID query param on RealEstatePremium URLs).
 *  Only the high-volume metro-Atlanta counties wired here; everything else
 *  falls back to the bare instrument-search URL.
 */
const GSCCCA_COUNTY_CODES: Record<string, number> = {
  FULTON: 60,
  DEKALB: 44,
  COBB: 33,
  GWINNETT: 67,
  CLAYTON: 31,
  CHEROKEE: 28,
  FORSYTH: 58,
  HENRY: 75,
  DOUGLAS: 49,
  ROCKDALE: 122,
  PAULDING: 110,
  FAYETTE: 56,
  NEWTON: 105,
};

/**
 * Deep-link to a specific recorded instrument on GSCCCA, pre-filled with
 * the book/page (and county when known). Attorney clicks → opens new tab →
 * logs into THEIR GSCCCA → lands on the right row → pulls the image if
 * they want it. Zero scraping; pure deep-link.
 *
 * Falls back to the bare instrument-search URL if we can't parse book-page
 * or don't know the county code. Always returns a usable URL.
 */
export function gscccaInstrumentDeepLink(args: {
  bookPage?: string;
  county?: string;
}): string {
  const base = "https://search.gsccca.org/RealEstatePremium/InstrumentTypeSearch.aspx";
  const bp = (args.bookPage || "").trim();
  if (!bp) return base;
  // Accept "12345-678", "12345/678", "12345 678", "12345 - 678"
  const match = bp.match(/^\s*(\d+)\s*[-/\s]+\s*(\d+)\s*$/);
  if (!match) return base;
  const params = new URLSearchParams({ Book: match[1], Page: match[2] });
  const county = (args.county || "").toUpperCase().replace(/\s+COUNTY$/, "").trim();
  const code = GSCCCA_COUNTY_CODES[county];
  if (code) params.set("intCountyID", String(code));
  return `${base}?${params.toString()}`;
}

export function buildTaxCommissionerMailto(params: {
  county?: string;
  parcelId?: string;
  address: string;
  reportId: string;
}): string | undefined {
  const res = getCountyResource(params.county);
  if (!res.taxCommissionerEmail) return undefined;
  const subject = encodeURIComponent(
    `Tax status inquiry — ${params.parcelId || params.address}`,
  );
  const body = encodeURIComponent(
    `Dear ${res.county} County Tax Commissioner,\n\n` +
      `I am the closing attorney for the following property and request confirmation of current ad valorem tax status (paid / delinquent / liens of record):\n\n` +
      `Property: ${params.address}\n` +
      `Parcel ID: ${params.parcelId || "(see address)"}\n` +
      `Cliros report reference: ${params.reportId}\n\n` +
      `Please reply with current year tax amount, payment status, and any tax liens or executions of record.\n\n` +
      `Thank you,\n`,
  );
  return `mailto:${res.taxCommissionerEmail}?subject=${subject}&body=${body}`;
}

export function buildLenderReleaseMailto(params: {
  creditor?: string;
  bookPage?: string;
  amount?: number;
  borrower?: string;
  address: string;
  reportId: string;
}): string {
  const to = "releases@lender.com";
  const subject = encodeURIComponent(
    `Payoff / release request — ${params.address} — Book ${params.bookPage || "—"}`,
  );
  const body = encodeURIComponent(
    `To Whom It May Concern,\n\n` +
      `Please provide a payoff statement and recorded release for the following security instrument:\n\n` +
      `Property: ${params.address}\n` +
      `Lender: ${params.creditor || "(see book-page)"}\n` +
      `Borrower: ${params.borrower || "—"}\n` +
      `Book-Page: ${params.bookPage || "—"}\n` +
      `Approximate balance: ${params.amount ? "$" + params.amount.toLocaleString() : "—"}\n` +
      `Cliros report: ${params.reportId}\n\n` +
      `Closing attorney — please fax or email recorded cancellation when available.\n`,
  );
  return `mailto:${to}?subject=${subject}&body=${body}`;
}

export function buildPayoffRequestText(params: {
  creditor?: string;
  bookPage?: string;
  amount?: number;
  borrower?: string;
  address: string;
  reportId: string;
}): string {
  return (
    `PAYOFF / RELEASE REQUEST\n\n` +
    `Property: ${params.address}\n` +
    `Lender: ${params.creditor || "(pull deed image for lender name)"}\n` +
    `Borrower: ${params.borrower || "—"}\n` +
    `Book-Page: ${params.bookPage || "—"}\n` +
    `Balance (indexed): ${params.amount ? "$" + params.amount.toLocaleString() : "—"}\n` +
    `Report ID: ${params.reportId}\n\n` +
    `Request: Payoff statement + recorded release/cancellation before closing.`
  );
}
