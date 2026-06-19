/* ─── Cliros Search API Route ─── */
/* POST /api/search { address: string, county?: string }
   Returns: search report with real GSCCCA + PACER data + Claude AI analysis

   Data pipeline:
   1. GSCCCA browser agent → deeds, state liens, UCC, PT-61
   2. PACER REST API → federal tax liens, bankruptcy
   3. Claude AI → risk analysis, defects, AOL draft
   4. Results cached in Supabase
*/

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { executeFullTitleSearch, type TitleSearchResult } from "@/lib/agents/search-orchestrator";

// ─── Supported States (GA first, more coming) ───
const SUPPORTED_STATES = new Set(["GA"]);

function extractState(address: string): string | null {
  // Match state abbreviation after a comma (standard address format: "City, ST ZIP")
  // This avoids false positives from directional suffixes like NE, NW, SE, SW
  const afterComma = /,\s*(AL|AK|AZ|AR|CA|CO|CT|DE|FL|GA|HI|ID|IL|IN|IA|KS|KY|LA|ME|MD|MA|MI|MN|MS|MO|MT|NE|NV|NH|NJ|NM|NY|NC|ND|OH|OK|OR|PA|RI|SC|SD|TN|TX|UT|VT|VA|WA|WV|WI|WY|DC)\b/i;
  const match = address.match(afterComma);
  if (match) return match[1].toUpperCase();

  // Fallback: last 2-letter state code in the string (before ZIP)
  const allMatches = address.match(/\b(AL|AK|AZ|AR|CA|CO|CT|DE|FL|GA|HI|ID|IL|IN|IA|KS|KY|LA|ME|MD|MA|MI|MN|MS|MO|MT|NE|NV|NH|NJ|NM|NY|NC|ND|OH|OK|OR|PA|RI|SC|SD|TN|TX|UT|VT|VA|WA|WV|WI|WY|DC)\b/gi);
  if (allMatches && allMatches.length > 0) {
    // Return the LAST match — state comes after city, directionals come early
    return allMatches[allMatches.length - 1].toUpperCase();
  }
  return null;
}

function extractCounty(address: string): string | undefined {
  // Try to extract county from address if included (e.g., "123 Main St, Atlanta, Fulton County, GA")
  const countyMatch = address.match(/(\w+)\s+county/i);
  return countyMatch ? countyMatch[1] : undefined;
}

// ─── Simple in-memory rate limiter (per-IP, resets on deploy) ───
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 5; // 5 searches per minute (browser agent is slow, protect resources)

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }
  entry.count++;
  return entry.count > RATE_LIMIT_MAX;
}

// Allow long-running GSCCCA searches (up to 5 minutes)
export const maxDuration = 300;

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: "Too many requests — please wait a moment and try again" },
        { status: 429 }
      );
    }

    const body = await request.json();
    const { address, county: requestCounty, prior_owner_name, sale_date, loan_amount, listing_url, buyer_name, buyer_name_2, joint_tenancy } = body;

    // Sanitize optional "Improve accuracy" hints from the new-search form.
    // Same shape as queue/route.ts so the orchestrator sees identical hints
    // whichever endpoint the form posts to.
    const cleanPriorOwner =
      typeof prior_owner_name === "string"
        ? prior_owner_name.trim().replace(/<[^>]*>/g, "").slice(0, 120) || null
        : null;
    const cleanSaleDate =
      typeof sale_date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(sale_date) ? sale_date : null;
    const cleanLoanAmount =
      typeof loan_amount === "number" && Number.isFinite(loan_amount) && loan_amount > 0
        ? Math.round(loan_amount)
        : null;
    // Mirror the queue/route.ts allow-list for listing URLs.
    let cleanListingUrl: string | null = null;
    if (typeof listing_url === "string" && listing_url.trim()) {
      try {
        const u = new URL(listing_url.trim());
        const host = u.hostname.toLowerCase();
        if (
          host === "zillow.com" || host === "www.zillow.com" ||
          host === "redfin.com" || host === "www.redfin.com" ||
          host === "realtor.com" || host === "www.realtor.com"
        ) {
          cleanListingUrl = u.toString();
        }
      } catch { /* invalid URL — leave null */ }
    }

    const cleanBuyerName =
      typeof buyer_name === "string"
        ? buyer_name.trim().replace(/<[^>]*>/g, "").slice(0, 120) || null
        : null;
    const cleanBuyerName2 =
      typeof buyer_name_2 === "string"
        ? buyer_name_2.trim().replace(/<[^>]*>/g, "").slice(0, 120) || null
        : null;
    const cleanJointTenancy = joint_tenancy === true;

    const searchHints =
      cleanPriorOwner || cleanSaleDate || cleanLoanAmount || cleanListingUrl ||
      cleanBuyerName || cleanBuyerName2
        ? {
            priorOwnerName: cleanPriorOwner,
            saleDate: cleanSaleDate,
            loanAmount: cleanLoanAmount,
            listingUrl: cleanListingUrl,
            buyerName: cleanBuyerName,
            buyerName2: cleanBuyerName2,
            jointTenancy: cleanJointTenancy,
          }
        : null;

    // Input validation
    if (!address || typeof address !== "string") {
      return NextResponse.json(
        { error: "Valid property address required" },
        { status: 400 }
      );
    }

    const cleanAddress = address.trim().replace(/<[^>]*>/g, "").slice(0, 300);
    if (cleanAddress.length < 10) {
      return NextResponse.json(
        { error: "Address too short — please enter a full street address (e.g. 123 Main St, Atlanta, GA 30303)" },
        { status: 400 }
      );
    }

    // Address format validation — must look like a real address
    // Require: at least a number + street name + city/state or zip
    const hasStreetNumber = /^\d+\s/.test(cleanAddress);
    const hasComma = cleanAddress.includes(",");
    const hasZipOrState = /\b\d{5}\b/.test(cleanAddress) || /\b[A-Z]{2}\b/.test(cleanAddress);
    if (!hasStreetNumber || !hasComma || !hasZipOrState) {
      return NextResponse.json(
        { error: "Please enter a complete Georgia address with street number, city, and state (e.g. 123 Main St, Atlanta, GA 30303)" },
        { status: 400 }
      );
    }

    // State validation — currently GA only
    const detectedState = extractState(cleanAddress);
    if (detectedState && !SUPPORTED_STATES.has(detectedState)) {
      return NextResponse.json(
        { error: `We don't cover ${detectedState} yet. Currently supported: Georgia (GA). More states coming soon!` },
        { status: 422 }
      );
    }

    // Validate required env vars
    if (!process.env.GSCCCA_USERNAME || !process.env.GSCCCA_PASSWORD) {
      console.error("GSCCCA credentials not configured");
      return NextResponse.json(
        { error: "Service configuration error — contact support" },
        { status: 503 }
      );
    }
    if (!process.env.ANTHROPIC_API_KEY) {
      console.error("ANTHROPIC_API_KEY not configured");
      return NextResponse.json(
        { error: "Service configuration error — contact support" },
        { status: 503 }
      );
    }

    // Get authenticated user from Supabase (cookie or Authorization header)
    const supabase = createServerClient();
    let userId: string | null = null;
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
      const { createClient } = await import("@supabase/supabase-js");

      // Try 1: Authorization header (API clients, curl)
      const authHeader = request.headers.get("authorization") || "";
      if (authHeader.startsWith("Bearer ") && !userId) {
        const token = authHeader.slice(7);
        const tempClient = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
          global: { headers: { Authorization: `Bearer ${token}` } },
        });
        const { data } = await tempClient.auth.getUser();
        userId = data?.user?.id || null;
      }

      // Try 2: Cookie-based auth (browser/dashboard)
      if (!userId) {
        const ref = supabaseUrl.match(/https:\/\/([^.]+)/)?.[1] || "";
        const cookieStr = request.headers.get("cookie") || "";
        const tokenMatch = cookieStr.match(new RegExp(`sb-${ref}-auth-token(?:\\.0)?=([^;]+)`));
        if (tokenMatch) {
          const decoded = decodeURIComponent(tokenMatch[1]);
          const parsed = JSON.parse(decoded);
          if (parsed?.access_token) {
            const tempClient = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
              global: { headers: { Authorization: `Bearer ${parsed.access_token}` } },
            });
            const { data } = await tempClient.auth.getUser();
            userId = data?.user?.id || null;
          }
        }
      }
    } catch {
      console.warn("Could not extract user_id from session");
    }

    // Check free report limit (5 free reports)
    if (userId) {
      const { data: userProfile } = await supabase
        .from("users")
        .select("free_reports_used, free_reports_total")
        .eq("id", userId)
        .single();

      if (userProfile) {
        const used = userProfile.free_reports_used ?? 0;
        const total = userProfile.free_reports_total ?? 5;
        if (used >= total) {
          return NextResponse.json(
            {
              error: "Free report limit reached",
              code: "PAYMENT_REQUIRED",
              message: `You've used all ${total} free reports. Each additional report is $200.`,
              used,
              total,
            },
            { status: 402 }
          );
        }
      }
    }

    // Determine county from request body or address
    const county = requestCounty || extractCounty(cleanAddress);

    // ═══ Execute the full title search pipeline ═══
    // GSCCCA browser agent → PACER API → Claude AI analysis
    let searchResult: TitleSearchResult;
    try {
      searchResult = await executeFullTitleSearch(cleanAddress, county, undefined, searchHints);
    } catch (err) {
      console.error("[Search API] Orchestrator failed:", err);
      return NextResponse.json(
        { error: "Title search failed — please try again. If the problem persists, contact support." },
        { status: 500 }
      );
    }

    // Parcel-not-found is a distinct user-facing error, not a "no data" result.
    // Return 422 so the UI shows a "please verify address" message and we don't
    // count this against the free trial.
    if (searchResult.blocked && searchResult.blockedReason === "PARCEL_NOT_FOUND") {
      return NextResponse.json(
        {
          error: searchResult.summary,
          code: "PARCEL_NOT_FOUND",
          address: cleanAddress,
          county: county || null,
        },
        { status: 422 }
      );
    }

    // Check if any real data sources returned results
    const hasRealData = searchResult.dataSources.gsccca || searchResult.dataSources.courtlistener || searchResult.dataSources.pacer;
    const hasFindings = searchResult.chainOfTitle.entries.length > 0 || searchResult.liens.length > 0;
    const isEmptyReport = !hasRealData && !hasFindings;

    // Compose the response
    const report = {
      id: `rpt_${Date.now()}`,
      status: isEmptyReport ? "no_data" : "complete",
      address: {
        fullAddress: cleanAddress,
        county: county || "",
        state: detectedState || "GA",
      },
      propertyDetails: searchResult.propertyDetails,
      chainOfTitle: searchResult.chainOfTitle,
      liens: searchResult.liens,
      easements: searchResult.easements,
      defects: searchResult.defects,
      summary: searchResult.summary,
      riskScore: searchResult.riskScore,
      dataSources: searchResult.dataSources,
      errors: searchResult.errors,
      noDataFound: isEmptyReport,
      noDataMessage: isEmptyReport
        ? "No records were found for this address. This search does not count against your free reports. Please verify the address is correct and try again."
        : undefined,
      createdAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
    };

    // Persist to Supabase
    console.log("[search] userId:", userId ? userId.slice(0, 8) + "..." : "NULL");
    if (userId) {
      try {
        const parts = cleanAddress.split(",").map((s: string) => s.trim());
        const street = parts[0] || cleanAddress;
        const city = parts[1] || "";
        const stateZip = (parts[2] || "").trim().split(/\s+/);
        const stateCode = stateZip[0] || "GA";
        const zip = stateZip[1] || "";

        // Upsert property
        const { data: propRow } = await supabase
          .from("properties")
          .upsert(
            {
              full_address: cleanAddress,
              street,
              city,
              state: stateCode,
              zip,
              county: county || null,
              parcel_id: null,
              property_type: null,
              assessed_value: null,
              legal_description: null,
              tax_year: null,
            },
            { onConflict: "full_address" }
          )
          .select("id")
          .single();

        const propertyId = propRow?.id;

        if (propertyId) {
          const now = new Date().toISOString();
          const { data: insertedReport, error: insertError } = await supabase.from("search_reports").insert({
            user_id: userId,
            property_id: propertyId,
            tier: "full_search",
            status: isEmptyReport ? "failed" : "complete",
            chain_of_title: searchResult.chainOfTitle.entries,
            chain_breaks: searchResult.chainOfTitle.breaks,
            years_searched: searchResult.chainOfTitle.yearsSearched,
            search_start_date: searchResult.chainOfTitle.startDate || null,
            search_end_date: searchResult.chainOfTitle.endDate || null,
            liens: searchResult.liens,
            easements: searchResult.easements,
            defects: searchResult.defects,
            summary: searchResult.summary,
            risk_score: searchResult.riskScore,
            is_free_trial: true,
            started_at: now,
            completed_at: now,
            data_sources: searchResult.dataSources,
            search_hints: searchHints,
          }).select("id").single();

          if (insertError) {
            console.error("[search] Report insert failed:", insertError.message);
          }

          // Use the real Supabase UUID so "View Full Report" link works
          if (insertedReport?.id) {
            report.id = insertedReport.id;
          }
        }

        // Only count against free trial if real data was found
        if (!isEmptyReport) {
          const { data: currentUser } = await supabase
            .from("users")
            .select("free_reports_used")
            .eq("id", userId)
            .single();

          await supabase
            .from("users")
            .update({ free_reports_used: (currentUser?.free_reports_used ?? 0) + 1 })
            .eq("id", userId);
        }

        // Audit log
        await supabase.from("audit_log").insert({
          user_id: userId,
          action: "search_completed",
          details: {
            address: cleanAddress,
            report_id: report.id,
            risk_score: searchResult.riskScore,
            deeds_found: searchResult.chainOfTitle.entries.length,
            liens_found: searchResult.liens.length,
            data_sources: searchResult.dataSources,
          },
        });
      } catch (err) {
        console.error("Report persistence failed (non-fatal):", err);
      }
    }

    return NextResponse.json(report);
  } catch (error) {
    console.error("Search API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
