/* ─── Scrape Georgia real estate attorneys → cliros.prospects ───
   Single canonical scraper for cliros outreach. Uses Leadsscraper.io
   (Google Maps Places + emails-and-contacts) — same backend that built
   estimateproof's 1,166-row prospect list.

   Cost on Leadsscraper:
     * Google Maps Scraper: first 100 places free, then $0.007/place
     * Emails & Contacts:    first 100 domains free, then $0.007/domain
   Full GA sweep estimate: ~$5-15 for ~1000 enriched attorney firms.

   Usage:
     # Phase 1 — scrape Google Maps for firm name/phone/website/place_id
     npx tsx scripts/scrape_ga_attorneys.ts --all

     # Phase 2 — enrich emails for all rows with website but no email
     npx tsx scripts/scrape_ga_attorneys.ts --enrich-emails

     # Parallel batches (spawn N workers with different --offset/--limit)
     npx tsx scripts/scrape_ga_attorneys.ts --enrich-emails --offset 0 --limit 130 --concurrency 8
     npx tsx scripts/scrape_ga_attorneys.ts --enrich-emails --offset 130 --limit 130 --concurrency 8

     # Combined (run both phases sequentially)
     npx tsx scripts/scrape_ga_attorneys.ts --all --enrich-emails

     # Dry-run a single metro (no writes)
     npx tsx scripts/scrape_ga_attorneys.ts --metro "Atlanta GA" --dry-run

     # Specific metros (overrides default GA sweep list)
     npx tsx scripts/scrape_ga_attorneys.ts --metro "Augusta GA" --metro "Macon GA"

     # Resume / refresh: re-run any metro and rows update in place (place_id PK).
     # Re-run --enrich-emails any time to fill in newly-added websites.

   Why one script: cliros has ONE outreach universe (GA real estate
   attorneys). If we ever expand to MA / FL / NY we add metros, not files.
   Founder rule: no script bloat — extend this file when adding metros,
   queries, or enrichment passes.

   Env (loaded from monorepo root .env via tsx):
     LEADSSCRAPER_API_KEY        Leadsscraper API auth
     NEXT_PUBLIC_SUPABASE_URL    Supabase project (jivahkfdkduxasnzpzgx)
     SUPABASE_SERVICE_ROLE_KEY   write access to cliros.prospects

   Output: cliros.prospects rows + console summary (fetched / inserted /
   updated / no_contact / chain_filtered).
*/

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";
import * as path from "node:path";

dotenv.config({ path: path.resolve(__dirname, "../.env.local") });
dotenv.config({
  path: "/Applications/DrAntoniou Projects/AgentCompanies/.env",
});

const API_BASE = "https://api.leadsscraper.io";
const API_KEY = process.env.LEADSSCRAPER_API_KEY;
const SUPABASE_URL =
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!API_KEY) {
  console.error("Missing LEADSSCRAPER_API_KEY in env");
  process.exit(1);
}
if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env");
  process.exit(1);
}

// ─── Georgia metro list ───
// Ordered by closing volume (population × home-sale velocity). Atlanta metro
// is split into sub-cities because a single "real estate attorney Atlanta GA"
// query caps at ~40 results and misses Buckhead / Sandy Springs / etc.
// Add a metro: append below. Do NOT create a second script.
const GA_METROS = [
  // Atlanta MSA (highest closing volume in GA)
  "Atlanta GA",
  "Sandy Springs GA",
  "Buckhead Atlanta GA",
  "Alpharetta GA",
  "Roswell GA",
  "Marietta GA",
  "Smyrna GA",
  "Dunwoody GA",
  "Decatur GA",
  "Johns Creek GA",
  "Duluth GA",
  "Lawrenceville GA",
  "Suwanee GA",
  "Norcross GA",
  "Tucker GA",
  "Kennesaw GA",
  "Woodstock GA",
  "Acworth GA",
  "Cumming GA",
  "Peachtree City GA",
  "Newnan GA",
  "Stockbridge GA",
  "McDonough GA",
  "Conyers GA",
  "Douglasville GA",
  // Second-tier GA metros
  "Savannah GA",
  "Augusta GA",
  "Macon GA",
  "Athens GA",
  "Columbus GA",
  "Albany GA",
  "Warner Robins GA",
  "Valdosta GA",
  "Gainesville GA",
  "Rome GA",
];

// Query variants per metro — captures firms that title themselves
// "real estate attorney", "closing attorney", or "title attorney"
// (different SEO patterns).
const QUERY_VARIANTS = [
  "real estate attorney",
  "real estate closing attorney",
  "closing attorney",
  "title attorney",
  "residential closing attorney",
];

// Chains / non-ICP filters. Cliros ICP is solo + small-firm GA closing
// attorneys (1-10 attorneys). National brands serve corporate, not closings.
const CHAIN_TOKENS = [
  "legalzoom",
  "rocket lawyer",
  "avvo",
  "lawyers.com",
  "findlaw",
  "justia",
  "lex group",
  "law depot",
  "us legal",
  "nolo",
  "hyatt legal",
  // National personal-injury / mass-tort firms that list "real estate" as a
  // secondary practice but don't focus on closings — ICP mismatch for cliros.
  "morgan & morgan",
  "morgan and morgan",
  "for the people",
  "the gov't lawyers",
  "1-800-law-firm",
  // Big-firm chains that don't do residential closings as a focus
  "alston & bird",
  "king & spalding",
  "kilpatrick townsend",
  "morris manning",
  "smith gambrell",
  "troutman pepper",
  "eversheds sutherland",
  "dla piper",
  "greenberg traurig",
];

interface ScrapedPlace {
  name?: string;
  phone?: string | null;
  website?: string | null;
  email?: string | null;
  emails?: string[] | null;
  rating?: number | null;
  reviews?: number | null;
  address?: string | null;
  street?: string | null;
  city?: string | null;
  state?: string | null;
  state_code?: string | null;
  postal_code?: string | null;
  country_code?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  place_id?: string | null;
  google_id?: string | null;
  county?: string | null;
  category?: string | null;
  subtypes?: string | null;
}

interface ScrapeStats {
  fetched: number;
  inserted: number;
  updated: number;
  skipped_chain: number;
  skipped_no_contact: number;
  skipped_dupe: number;
  errors: number;
}

function isCloseCandidate(place: ScrapedPlace): boolean {
  const name = (place.name || "").toLowerCase();
  if (!name) return false;
  for (const tok of CHAIN_TOKENS) {
    if (name.includes(tok)) return false;
  }
  // Must be in GA — Leadsscraper sometimes returns adjacent-state results
  const stateCode = (place.state_code || place.state || "").toUpperCase();
  if (stateCode && stateCode !== "GA") return false;
  // Category must signal legal / law / attorney (paranoia: Maps returns
  // misc results when the query has a city qualifier)
  const cat = (place.category || "").toLowerCase();
  const subt = (place.subtypes || "").toLowerCase();
  const allCat = `${cat} ${subt}`;
  if (!/(attorney|law|legal|lawyer)/.test(allCat)) return false;
  return true;
}

function extractAttorneyFirstName(businessName: string): string | null {
  // Patterns: "John Smith, Attorney at Law", "Smith Law Firm",
  // "Law Office of John Smith", "Smith & Jones LLP"
  const patterns = [
    /^law offices? of ([a-z]+) [a-z]/i,
    /^([a-z]+) [a-z]+,?\s+(attorney|esquire|esq)/i,
    /^([a-z]+) [a-z]+ law (firm|office)/i,
  ];
  for (const re of patterns) {
    const m = businessName.match(re);
    if (m && m[1] && m[1].length >= 2) {
      return m[1].charAt(0).toUpperCase() + m[1].slice(1).toLowerCase();
    }
  }
  return null;
}

function placeToRow(place: ScrapedPlace, source: string, county?: string) {
  const email =
    place.email ||
    (Array.isArray(place.emails) && place.emails.length > 0
      ? place.emails[0]
      : null) ||
    null;

  const businessName = place.name || "";
  const attorneyFirstName = extractAttorneyFirstName(businessName);

  return {
    business_name: businessName,
    business_type: "re_attorney",
    attorney_first_name: attorneyFirstName,
    email,
    email_status: email ? "scraped" : null,
    phone: place.phone ?? null,
    website: place.website ?? null,
    street_address: place.street || place.address || null,
    city: place.city ?? null,
    county: place.county || county || null,
    state: (place.state_code || place.state || "GA").toUpperCase(),
    zip: place.postal_code ?? null,
    country: place.country_code || "US",
    latitude: place.latitude ?? null,
    longitude: place.longitude ?? null,
    google_place_id: place.place_id || place.google_id || null,
    google_rating: place.rating ?? null,
    google_review_count: place.reviews ?? null,
    outreach_status: email || place.phone ? "new" : "no_contact",
    source,
    raw_data: place as unknown as Record<string, unknown>,
  };
}

async function getBalance(): Promise<number | null> {
  try {
    const res = await fetch(`${API_BASE}/profile/balance`, {
      headers: { "X-API-KEY": API_KEY! },
    });
    if (!res.ok) return null;
    const j = (await res.json()) as { balance?: number };
    return typeof j.balance === "number" ? j.balance : null;
  } catch {
    return null;
  }
}

async function searchPlaces(
  query: string,
  opts: { limit?: number; enrichments?: string } = {},
): Promise<ScrapedPlace[]> {
  const params = new URLSearchParams({
    query,
    limit: String(opts.limit ?? 40),
    async: "false",
    region: "US",
    language: "en",
  });
  if (opts.enrichments) params.set("enrichments", opts.enrichments);

  const res = await fetch(`${API_BASE}/google-maps-search?${params}`, {
    headers: { "X-API-KEY": API_KEY! },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(
      `Leadsscraper ${res.status}: ${body.slice(0, 200)}`,
    );
  }
  const json = (await res.json()) as { data?: ScrapedPlace[][] };
  return json.data?.[0] ?? [];
}

async function upsertProspect(
  supabase: SupabaseClient,
  row: ReturnType<typeof placeToRow>,
  stats: ScrapeStats,
): Promise<void> {
  if (row.google_place_id) {
    const { data: existing } = await supabase
      .schema("cliros")
      .from("prospects")
      .select("id")
      .eq("google_place_id", row.google_place_id)
      .maybeSingle();
    if (existing?.id) {
      const { error } = await supabase
        .schema("cliros")
        .from("prospects")
        .update(row)
        .eq("id", existing.id);
      if (error) {
        console.error(`  update error: ${error.message}`);
        stats.errors++;
      } else {
        stats.updated++;
      }
      return;
    }
  }
  const { error } = await supabase
    .schema("cliros")
    .from("prospects")
    .insert(row);
  if (error) {
    if (error.message?.includes("duplicate")) {
      stats.skipped_dupe++;
    } else {
      console.error(`  insert error: ${error.message}`);
      stats.errors++;
    }
    return;
  }
  stats.inserted++;
}

interface CliArgs {
  metros: string[];
  dryRun: boolean;
  all: boolean;
  limit: number;
  enrichContacts: boolean;
  enrichEmails: boolean;
  emailConcurrency: number;
  emailMax: number;
  emailOffset: number;
}

function parseArgs(argv: string[]): CliArgs {
  const out: CliArgs = {
    metros: [],
    dryRun: false,
    all: false,
    limit: 40,
    enrichContacts: false,
    enrichEmails: false,
    emailConcurrency: 5,
    emailMax: 0,
    emailOffset: 0,
  };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--metro" || a === "-m") {
      out.metros.push(argv[++i] || "");
    } else if (a === "--all") {
      out.all = true;
    } else if (a === "--dry-run") {
      out.dryRun = true;
    } else if (a === "--enrich-emails") {
      out.enrichEmails = true;
    } else if (a === "--maps-enrichment") {
      out.enrichContacts = true;
    } else if (a === "--limit") {
      out.limit = parseInt(argv[++i] || "40", 10);
    } else if (a === "--offset") {
      out.emailOffset = parseInt(argv[++i] || "0", 10);
    } else if (a === "--concurrency") {
      out.emailConcurrency = parseInt(argv[++i] || "5", 10);
    } else if (a === "--email-max") {
      out.emailMax = parseInt(argv[++i] || "0", 10);
    }
  }
  return out;
}

// ─── Phase 2: email enrichment for rows with website but no email ───
// Calls Leadsscraper /emails-and-contacts on each firm's website. Filters
// for emails matching the firm's domain (firm-owned > third-party). Falls
// back to first email if no domain match.

interface EmailRecord {
  value?: string;
  source?: string;
}

interface ContactsResponse {
  data?: Array<{
    emails?: EmailRecord[] | string[];
    phones?: Array<{ value?: string }>;
    site_data?: { title?: string };
  }>;
}

function extractDomain(website: string | null): string | null {
  if (!website) return null;
  try {
    const url = website.startsWith("http") ? website : `https://${website}`;
    const host = new URL(url).hostname.toLowerCase();
    return host.replace(/^www\./, "");
  } catch {
    return null;
  }
}

async function findContactsForDomain(
  domain: string,
): Promise<{ emails: string[]; phones: string[]; siteTitle: string }> {
  const params = new URLSearchParams({
    query: domain,
    async: "false",
  });
  const res = await fetch(
    `${API_BASE}/emails-and-contacts?${params}`,
    { headers: { "X-API-KEY": API_KEY! } },
  );
  if (!res.ok) {
    return { emails: [], phones: [], siteTitle: "" };
  }
  const json = (await res.json()) as ContactsResponse;
  const data = json.data?.[0] ?? {};
  const rawEmails = data.emails ?? [];
  const emails: string[] = [];
  for (const e of rawEmails) {
    const val = typeof e === "string" ? e : e.value;
    if (val && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
      emails.push(val.toLowerCase());
    }
  }
  const phones = (data.phones ?? [])
    .map((p) => p.value)
    .filter((v): v is string => Boolean(v));
  const siteTitle = data.site_data?.title ?? "";
  return { emails, phones, siteTitle };
}

function pickBestEmail(emails: string[], domain: string | null): string | null {
  if (emails.length === 0) return null;
  const cleaned = emails.filter(isUsableEmail);
  if (cleaned.length === 0) return null;
  if (!domain) return cleaned[0];
  // 1) exact firm-domain match (e.g. info@firmdomain.com)
  const firmMatch = cleaned.find((e) => e.endsWith(`@${domain}`));
  if (firmMatch) return firmMatch;
  // 2) generic outreach addresses on any close-domain variant
  const generic = cleaned.find((e) =>
    /^(info|contact|hello|attorney|legal|office|admin|reception)@/.test(e),
  );
  if (generic) return generic;
  // 3) first reasonable-looking email
  return cleaned[0];
}

const JUNK_EMAIL_SUFFIXES = [
  "sentry.io",
  "wixpress.com",
  "example.com",
  "google.com",
  "facebook.com",
  "instagram.com",
  "linkedin.com",
  "twitter.com",
  "youtube.com",
  "cloudflare.com",
  "schema.org",
  "w3.org",
  "png",
  "jpg",
  "jpeg",
  "gif",
  "svg",
  "webp",
];

const EMAIL_RE =
  /[a-z0-9._%+-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+/gi;

function isUsableEmail(email: string): boolean {
  const lower = email.toLowerCase().trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(lower)) return false;
  if (JUNK_EMAIL_SUFFIXES.some((s) => lower.endsWith(`@${s}`) || lower.endsWith(`.${s}`)))
    return false;
  if (/^(noreply|no-reply|donotreply|postmaster|webmaster|abuse)@/.test(lower))
    return false;
  return true;
}

function extractEmailsFromHtml(html: string): string[] {
  const found = new Set<string>();
  for (const m of html.match(EMAIL_RE) ?? []) {
    if (isUsableEmail(m)) found.add(m.toLowerCase());
  }
  for (const m of html.match(/mailto:([^\s"'<>?]+)/gi) ?? []) {
    const addr = m.replace(/^mailto:/i, "").split("?")[0];
    if (isUsableEmail(addr)) found.add(addr.toLowerCase());
  }
  return [...found];
}

async function crawlWebsiteForEmails(website: string): Promise<string[]> {
  let origin: string;
  try {
    const base = website.startsWith("http") ? website : `https://${website}`;
    origin = new URL(base).origin;
  } catch {
    return [];
  }

  const paths = ["", "/contact", "/contact-us", "/about", "/about-us", "/team"];
  const found = new Set<string>();

  for (const path of paths) {
    const url = `${origin}${path}`;
    try {
      const res = await fetch(url, {
        signal: AbortSignal.timeout(10_000),
        headers: {
          "User-Agent":
            "Mozilla/5.0 (compatible; ClirosOutreach/1.0; +https://cliros.ai)",
          Accept: "text/html",
        },
        redirect: "follow",
      });
      if (!res.ok) continue;
      const ctype = res.headers.get("content-type") || "";
      if (!ctype.includes("text/html") && !ctype.includes("text/plain")) continue;
      for (const e of extractEmailsFromHtml(await res.text())) found.add(e);
      if (found.size >= 3) break;
    } catch {
      // try next path
    }
  }

  return [...found];
}

async function enrichOneProspect(
  row: { id: string; business_name: string; website: string | null; email: string | null },
): Promise<{ bestEmail: string | null; phones: string[]; siteTitle: string; source: string }> {
  const domain = extractDomain(row.website);
  if (!domain) return { bestEmail: null, phones: [], siteTitle: "", source: "no_domain" };

  const leadsscraper = await findContactsForDomain(domain);
  let bestEmail = pickBestEmail(leadsscraper.emails, domain);
  let source = bestEmail ? "leadsscraper" : "";

  if (!bestEmail) {
    const crawled = await crawlWebsiteForEmails(row.website!);
    bestEmail = pickBestEmail(crawled, domain);
    if (bestEmail) source = "local_crawl";
  }

  return {
    bestEmail,
    phones: leadsscraper.phones,
    siteTitle: leadsscraper.siteTitle,
    source: bestEmail ? source : "none",
  };
}

async function runEmailEnrichment(
  supabase: SupabaseClient,
  opts: { concurrency: number; max: number; offset: number },
): Promise<void> {
  console.log(
    `\n=== phase 2: email enrichment (offset=${opts.offset}, limit=${opts.max || "all"}) ===`,
  );

  const batchSize = opts.max > 0 ? opts.max : 2000;
  const query = supabase
    .schema("cliros")
    .from("prospects")
    .select("id, business_name, website, email")
    .is("email", null)
    .not("website", "is", null)
    .eq("do_not_contact", false)
    .order("id", { ascending: true })
    .range(opts.offset, opts.offset + batchSize - 1);

  const { data: rows, error } = await query;
  if (error) {
    console.error(`  query error: ${error.message}`);
    return;
  }
  if (!rows || rows.length === 0) {
    console.log("  no rows to enrich (all have emails or no website)");
    return;
  }
  console.log(`  enriching ${rows.length} rows with concurrency=${opts.concurrency}`);

  let found = 0;
  let empty = 0;
  let errors = 0;
  let leadsscraperHits = 0;
  let crawlHits = 0;

  // Concurrent worker pool
  let cursor = 0;
  async function worker(workerId: number): Promise<void> {
    while (cursor < rows.length) {
      const idx = cursor++;
      const row = rows[idx];
      try {
        const { bestEmail, phones, siteTitle, source } = await enrichOneProspect({
          id: row.id as string,
          business_name: row.business_name as string,
          website: row.website as string | null,
          email: row.email as string | null,
        });
        const update: Record<string, unknown> = {
          email_status: bestEmail
            ? source
            : siteTitle.toLowerCase().includes("hugedomains")
              ? "parked_domain"
              : "no_emails_found",
          email_verified_at: bestEmail ? new Date().toISOString() : null,
        };
        if (bestEmail) update.email = bestEmail;
        if (!row.email && phones[0]) update.phone = phones[0];

        const { error: updErr } = await supabase
          .schema("cliros")
          .from("prospects")
          .update(update)
          .eq("id", row.id);
        if (updErr) {
          errors++;
          console.error(`  [w${workerId}] update err: ${updErr.message}`);
        } else if (bestEmail) {
          found++;
          if (source === "leadsscraper") leadsscraperHits++;
          if (source === "local_crawl") crawlHits++;
          if (found % 25 === 0) {
            console.log(
              `  [progress] enriched ${found}/${rows.length} (${idx + 1} processed)`,
            );
          }
        } else {
          empty++;
        }
      } catch (err) {
        errors++;
        console.error(
          `  [w${workerId}] ${row.business_name}: ${(err as Error).message}`,
        );
      }
    }
  }

  const workers = Array.from({ length: opts.concurrency }, (_, i) =>
    worker(i + 1),
  );
  await Promise.all(workers);

  console.log(`\n  email enrichment done:`);
  console.log(`    found:        ${found}`);
  console.log(`    leadsscraper: ${leadsscraperHits}`);
  console.log(`    local_crawl:  ${crawlHits}`);
  console.log(`    empty:        ${empty}`);
  console.log(`    errors:       ${errors}`);
}

async function main() {
  const args = parseArgs(process.argv);

  const shouldScrape = args.all || args.metros.length > 0;
  if (!shouldScrape && !args.enrichEmails) {
    console.error(
      "Usage: npx tsx scripts/scrape_ga_attorneys.ts (--metro 'Atlanta GA' | --all) [--enrich-emails] [--dry-run]",
    );
    console.error(
      "Or:    npx tsx scripts/scrape_ga_attorneys.ts --enrich-emails  (enrich existing rows only)",
    );
    process.exit(1);
  }

  const supabase = createClient(SUPABASE_URL!, SERVICE_KEY!);
  const startBalance = await getBalance();
  console.log(
    `Starting balance: $${startBalance?.toFixed(2) ?? "??"}  · dry-run=${args.dryRun}`,
  );

  // ─── Phase 1: scrape Google Maps for firm metadata ───
  if (shouldScrape) {
    const metros =
      args.all && args.metros.length === 0 ? GA_METROS : args.metros;
    console.log(`\n=== phase 1: Google Maps scrape (${metros.length} metros) ===`);

    const stats: ScrapeStats = {
      fetched: 0,
      inserted: 0,
      updated: 0,
      skipped_chain: 0,
      skipped_no_contact: 0,
      skipped_dupe: 0,
      errors: 0,
    };

    for (const metro of metros) {
      for (const variant of QUERY_VARIANTS) {
        const query = `${variant} ${metro}`;
        console.log(`\n  scraping: ${query}`);
        let places: ScrapedPlace[] = [];
        try {
          places = await searchPlaces(query, {
            limit: args.limit,
            enrichments: args.enrichContacts ? "contacts" : undefined,
          });
        } catch (err) {
          console.error(`    error: ${(err as Error).message}`);
          stats.errors++;
          continue;
        }
        console.log(`    fetched ${places.length}`);
        stats.fetched += places.length;

        for (const place of places) {
          if (!place.name) continue;
          if (!isCloseCandidate(place)) {
            stats.skipped_chain++;
            continue;
          }
          if (!place.email && !place.phone && !place.website) {
            stats.skipped_no_contact++;
            continue;
          }
          const row = placeToRow(place, "leadsscraper");
          if (args.dryRun) {
            console.log(
              `    [dry] ${row.business_name} | ${row.email ?? "no-email"} | ${row.city ?? "?"} ${row.state ?? "?"}`,
            );
            continue;
          }
          await upsertProspect(supabase, row, stats);
        }

        // brief pause between queries to avoid rate limits
        await new Promise((r) => setTimeout(r, 1500));
      }
    }

    console.log(`\n  phase 1 summary:`);
    console.log(`    fetched:         ${stats.fetched}`);
    console.log(`    inserted:        ${stats.inserted}`);
    console.log(`    updated:         ${stats.updated}`);
    console.log(`    chain-filtered:  ${stats.skipped_chain}`);
    console.log(`    no-contact:      ${stats.skipped_no_contact}`);
    console.log(`    dupe:            ${stats.skipped_dupe}`);
    console.log(`    errors:          ${stats.errors}`);
  }

  // ─── Phase 2: email enrichment ───
  if (args.enrichEmails && !args.dryRun) {
    // --limit on enrich-only runs caps the batch size; default = full queue (2000)
    const emailLimit =
      args.emailMax > 0
        ? args.emailMax
        : args.enrichEmails && !shouldScrape
          ? process.argv.includes("--limit")
            ? args.limit
            : 0
          : args.limit;
    await runEmailEnrichment(supabase, {
      concurrency: args.emailConcurrency,
      max: emailLimit,
      offset: args.emailOffset,
    });
  } else if (args.enrichEmails) {
    console.log("\n=== phase 2 skipped (dry-run) ===");
  }

  const endBalance = await getBalance();
  console.log(
    `\nbalance: $${startBalance?.toFixed(2) ?? "??"} → $${endBalance?.toFixed(2) ?? "??"}`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
