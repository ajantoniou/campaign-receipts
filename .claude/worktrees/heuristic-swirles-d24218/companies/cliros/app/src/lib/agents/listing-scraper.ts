/* ─── Listing URL scraper ───
   Light-touch extraction of last-sold date, last-sold price, list price, and
   listing-agent name from Zillow / Redfin / Realtor.com listing pages. Used
   to AUTO-FILL the "Improve accuracy" hints so the attorney doesn't have to
   paste the seller name and sale date by hand when they already have the
   Zillow link on their desk.

   Design notes:
     - Read meta tags + JSON-LD only. Never parse the property-detail blob;
       that's the path that gets you anti-bot rate-limited.
     - 10-second hard timeout; fails GRACEFULLY — listing scrape failure must
       NOT block the search.
     - Returns `null` on any error, partial fields when only some are found.
*/

import axios from "axios";
import * as cheerio from "cheerio";

export interface ListingFacts {
  /** ISO date YYYY-MM-DD of the most recent SOLD event, if listed. */
  lastSoldDate?: string;
  /** USD whole dollars. */
  lastSoldPrice?: number;
  /** Current listing price in USD whole dollars (if currently listed). */
  listPrice?: number;
  /** Name of the listing agent if present in JSON-LD or meta. */
  listingAgent?: string;
  /** Where we got the data — useful for debugging + telemetry. */
  source: "zillow" | "redfin" | "realtor" | "other";
  /** True when we couldn't extract ANY field. */
  empty: boolean;
}

const TIMEOUT_MS = 10_000;
const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

const ALLOWED_HOSTS = new Set([
  "zillow.com", "www.zillow.com",
  "redfin.com", "www.redfin.com",
  "realtor.com", "www.realtor.com",
]);

export function isSupportedListingUrl(rawUrl: string): boolean {
  try {
    const u = new URL(rawUrl);
    if (u.protocol !== "https:" && u.protocol !== "http:") return false;
    return ALLOWED_HOSTS.has(u.hostname.toLowerCase());
  } catch {
    return false;
  }
}

function detectSource(host: string): ListingFacts["source"] {
  if (host.includes("zillow")) return "zillow";
  if (host.includes("redfin")) return "redfin";
  if (host.includes("realtor")) return "realtor";
  return "other";
}

/** Try to coerce a string price ("$485,000") to a USD integer. */
function parsePrice(raw: unknown): number | undefined {
  if (raw == null) return undefined;
  if (typeof raw === "number" && Number.isFinite(raw)) return Math.round(raw);
  if (typeof raw !== "string") return undefined;
  const digits = raw.replace(/[^\d.]/g, "");
  const n = Number(digits);
  if (!Number.isFinite(n) || n <= 0) return undefined;
  return Math.round(n);
}

/** Normalize "Jan 5, 2024" / "2024-01-05" / "01/05/2024" → "YYYY-MM-DD". */
function parseDate(raw: unknown): string | undefined {
  if (!raw || typeof raw !== "string") return undefined;
  const d = new Date(raw);
  if (isNaN(d.getTime())) return undefined;
  return d.toISOString().slice(0, 10);
}

/** Walk every JSON-LD <script> tag and merge the objects into one bag. */
function extractJsonLd($: ReturnType<typeof cheerio.load>): Array<Record<string, unknown>> {
  const out: Array<Record<string, unknown>> = [];
  $('script[type="application/ld+json"]').each((_i, el) => {
    const raw = $(el).contents().text();
    if (!raw.trim()) return;
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) out.push(...parsed);
      else if (parsed && typeof parsed === "object") out.push(parsed);
    } catch {
      /* malformed JSON-LD — skip */
    }
  });
  return out;
}

/** Pull (lastSold*, listPrice, agent) from a JSON-LD blob if present. */
function extractFromJsonLd(blobs: Array<Record<string, unknown>>): Partial<ListingFacts> {
  const out: Partial<ListingFacts> = {};
  for (const blob of blobs) {
    const t = String(blob["@type"] || "").toLowerCase();
    // Schema.org RealEstateListing carries `price` for current list and may
    // expose `dateSold` / `priceSold` on extensions.
    if (t.includes("realestate") || t.includes("residence") || t.includes("place") || t.includes("product")) {
      if (!out.listPrice) out.listPrice = parsePrice(blob.price) ?? parsePrice((blob.offers as { price?: unknown })?.price);
      if (!out.lastSoldDate) out.lastSoldDate = parseDate(blob.dateSold) ?? parseDate(blob.dateLastSold);
      if (!out.lastSoldPrice) out.lastSoldPrice = parsePrice(blob.priceSold) ?? parsePrice(blob.lastSoldPrice);
    }
    // Some pages put the agent in a separate Person/RealEstateAgent block.
    if (!out.listingAgent && (t.includes("realestateagent") || t.includes("person"))) {
      const name = blob.name;
      if (typeof name === "string" && name.trim()) out.listingAgent = name.trim();
    }
    // Zillow embeds an `offers` array with seller/listing info.
    const offers = blob.offers as Record<string, unknown> | Array<Record<string, unknown>> | undefined;
    if (offers && !out.listPrice) {
      const first = Array.isArray(offers) ? offers[0] : offers;
      if (first && typeof first === "object") {
        out.listPrice = parsePrice(first.price);
      }
    }
  }
  return out;
}

/** og:title often contains "$485,000 · 3 Beds · …" — last fallback for list price. */
function extractFromMeta($: ReturnType<typeof cheerio.load>): Partial<ListingFacts> {
  const out: Partial<ListingFacts> = {};
  const ogTitle = $('meta[property="og:title"]').attr("content") || "";
  const dollarMatch = ogTitle.match(/\$[\d,]+(?:\.\d+)?/);
  if (dollarMatch) {
    const n = parsePrice(dollarMatch[0]);
    if (n) out.listPrice = n;
  }
  return out;
}

/**
 * Fetch a listing URL and extract sale + agent facts. Returns null on hard
 * failure (timeout, non-2xx, no useful fields). NEVER throws — caller must
 * be able to call this in a fire-and-forget pattern without a try/catch.
 */
export async function scrapeListingUrl(rawUrl: string): Promise<ListingFacts | null> {
  if (!isSupportedListingUrl(rawUrl)) return null;
  const u = new URL(rawUrl);
  const source = detectSource(u.hostname);

  try {
    const resp = await axios.get(rawUrl, {
      timeout: TIMEOUT_MS,
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.5",
      },
      maxRedirects: 5,
      validateStatus: (s) => s >= 200 && s < 400,
    });

    const html = String(resp.data || "");
    if (!html) return null;

    const $ = cheerio.load(html);
    const jsonLd = extractJsonLd($);
    const facts: Partial<ListingFacts> = {
      ...extractFromJsonLd(jsonLd),
      ...extractFromMeta($),
    };

    const empty =
      !facts.lastSoldDate && !facts.lastSoldPrice && !facts.listPrice && !facts.listingAgent;

    return {
      lastSoldDate: facts.lastSoldDate,
      lastSoldPrice: facts.lastSoldPrice,
      listPrice: facts.listPrice,
      listingAgent: facts.listingAgent,
      source,
      empty,
    };
  } catch (err) {
    console.warn(`[listing-scraper] ${source} fetch failed for "${rawUrl}":`, err instanceof Error ? err.message : err);
    return null;
  }
}
