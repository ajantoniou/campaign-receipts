/* ─── Async Search Queue ───
   POST /api/search/queue { address, county?, lender_loan_no?, internal_file_no?, closing_date? }
   Returns: { report_id, status: 'queued' } immediately.

   The pipeline cron (scripts/run_pipeline_tick.ts) picks up the queued
   report and advances it through searching → permits → panel_review →
   drafting → ready. The dashboard polls /api/reports/[id] for status.

   We do a fast parcel anchor lookup BEFORE queuing — if the parcel doesn't
   exist, we return 422 immediately instead of queuing a doomed search. This
   keeps free-trial counters honest and gives the user instant feedback.
*/

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { resolveParcelAnchor } from "@/lib/agents/parcel";

const SUPPORTED_STATES = new Set(["GA"]);

function extractState(address: string): string | null {
  const afterComma =
    /,\s*(AL|AK|AZ|AR|CA|CO|CT|DE|FL|GA|HI|ID|IL|IN|IA|KS|KY|LA|ME|MD|MA|MI|MN|MS|MO|MT|NE|NV|NH|NJ|NM|NY|NC|ND|OH|OK|OR|PA|RI|SC|SD|TN|TX|UT|VT|VA|WA|WV|WI|WY|DC)\b/i;
  const match = address.match(afterComma);
  return match ? match[1].toUpperCase() : null;
}

function extractCounty(address: string): string | undefined {
  const m = address.match(/(\w+)\s+county/i);
  return m ? m[1] : undefined;
}

async function getUserId(request: NextRequest): Promise<string | null> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  const authHeader = request.headers.get("authorization") || "";
  if (authHeader.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    const c = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data } = await c.auth.getUser();
    if (data?.user?.id) return data.user.id;
  }
  const ref = supabaseUrl.match(/https:\/\/([^.]+)/)?.[1] || "";
  const cookieStr = request.headers.get("cookie") || "";
  const tokenMatch = cookieStr.match(new RegExp(`sb-${ref}-auth-token(?:\\.0)?=([^;]+)`));
  if (tokenMatch) {
    try {
      const parsed = JSON.parse(decodeURIComponent(tokenMatch[1]));
      if (parsed?.access_token) {
        const c = createClient(supabaseUrl, anonKey, {
          global: { headers: { Authorization: `Bearer ${parsed.access_token}` } },
        });
        const { data } = await c.auth.getUser();
        return data?.user?.id || null;
      }
    } catch { /* fall through */ }
  }
  return null;
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId(request);
    if (!userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const body = await request.json();
    const {
      address,
      county: requestCounty,
      lender_loan_no,
      internal_file_no,
      closing_date,
      issuing_attorney_id,
      // Optional search hints — surfaced via the "Improve accuracy" expander
      // on the new-search form. Each one independently narrows the GSCCCA
      // search; none of them are required.
      prior_owner_name,
      sale_date,
      loan_amount,
      listing_url,
      buyer_name,
      buyer_name_2,
      joint_tenancy,
    } = body;

    // Sanitize hints — short text fields, ISO date, integer cents.
    const cleanPriorOwner =
      typeof prior_owner_name === "string"
        ? prior_owner_name.trim().replace(/<[^>]*>/g, "").slice(0, 120) || null
        : null;
    const cleanSaleDate =
      typeof sale_date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(sale_date)
        ? sale_date
        : null;
    const cleanLoanAmount =
      typeof loan_amount === "number" && Number.isFinite(loan_amount) && loan_amount > 0
        ? Math.round(loan_amount)
        : null;
    // Listing URL: validate as URL + only accept supported hosts (Zillow,
    // Redfin, Realtor.com). Reject anything else so the scraper doesn't get
    // pointed at hostile origins. Short-circuit on parse error.
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

    // Buyer-name fields for the draft warranty deed. Same sanitize pattern
    // as priorOwner. jointTenancy is a boolean toggle on the form.
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

    if (!address || typeof address !== "string") {
      return NextResponse.json({ error: "Valid property address required" }, { status: 400 });
    }
    const cleanAddress = address.trim().replace(/<[^>]*>/g, "").slice(0, 300);
    if (cleanAddress.length < 10) {
      return NextResponse.json(
        { error: "Address too short — please enter a full street address (e.g. 123 Main St, Atlanta, GA 30303)" },
        { status: 400 }
      );
    }

    const detectedState = extractState(cleanAddress);
    if (detectedState && !SUPPORTED_STATES.has(detectedState)) {
      return NextResponse.json(
        { error: `We don't cover ${detectedState} yet. Currently supported: Georgia (GA).` },
        { status: 422 }
      );
    }

    const county = requestCounty || extractCounty(cleanAddress);

    // ── Pre-flight parcel anchor (~1s) ──
    // If the parcel doesn't exist, fail fast — don't queue a doomed search
    // and don't charge against the free trial.
    const anchor = await resolveParcelAnchor(cleanAddress, county);
    if (!anchor) {
      return NextResponse.json(
        {
          error:
            "Could not locate this property in the county tax parcel database. " +
            "Please verify the address spelling, ZIP code, and county.",
          code: "PARCEL_NOT_FOUND",
          address: cleanAddress,
          county: county || null,
        },
        { status: 422 }
      );
    }

    // ── Free-trial check ──
    const db = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { db: { schema: "cliros" }, auth: { persistSession: false } }
    );

    const { data: userProfile } = await db
      .from("users")
      .select("free_reports_used, free_reports_total, reports_remaining, reports_consumed_total, ls_subscription_item_id, ls_subscription_status, monthly_report_cap")
      .eq("id", userId)
      .single();

    // Gate priority: (1) free trial → (2) prepaid package balance →
    // (3) metered subscription → (4) 402 PAYMENT_REQUIRED.
    //
    // BETA MODE: when CLIROS_BETA_MODE=true, everyone gets unlimited free
    // runs while we gather feedback. Cost ceiling is the $2.50 hard cap per
    // report from the persona QC pipeline, so this is self-limiting.
    // Flip the env var off to restore the paywall.
    const BETA_MODE = process.env.CLIROS_BETA_MODE === "true";
    let billingMode: "free" | "package" | "metered" | "blocked" = "blocked";
    if (BETA_MODE) {
      billingMode = "free";
    } else if (userProfile) {
      const used = userProfile.free_reports_used ?? 0;
      const total = userProfile.free_reports_total ?? 5;
      const remaining = userProfile.reports_remaining ?? 0;
      const hasActiveSub =
        !!userProfile.ls_subscription_item_id &&
        (userProfile.ls_subscription_status === "active" || userProfile.ls_subscription_status === "on_trial");

      // Monthly hard cap applies to ANY paid run (package OR metered), not just
      // metered — a compromised account or a runaway script could otherwise burn
      // a whole package balance in minutes. Free-trial runs are exempt (bounded
      // by free_reports_total). Compute once, before choosing the paid rail.
      const cap = userProfile.monthly_report_cap ?? 10;
      const willBePaid = !(used < total); // anything past the free tier is paid
      if (willBePaid) {
        const since = new Date(); since.setDate(1); since.setHours(0,0,0,0);
        const { count: thisMonthCount } = await db
          .from("search_reports")
          .select("*", { count: "exact", head: true })
          .eq("user_id", userId)
          .gte("created_at", since.toISOString())
          .is("is_free_trial", false);
        if ((thisMonthCount ?? 0) >= cap) {
          return NextResponse.json(
            {
              error: "Monthly report cap reached",
              code: "MONTHLY_CAP_REACHED",
              message: `You've reached your monthly limit of ${cap} reports. Email alex@cliros.ai to raise it.`,
              cap,
              this_month: thisMonthCount,
            },
            { status: 402 }
          );
        }
      }

      if (used < total) {
        billingMode = "free";
      } else if (remaining > 0) {
        billingMode = "package";
      } else if (hasActiveSub) {
        billingMode = "metered";
      } else {
        return NextResponse.json(
          {
            error: "Payment method required",
            code: "PAYMENT_REQUIRED",
            message: `You've used all ${total} free reports. Buy a package or save a card on file in Billing.`,
            used,
            total,
          },
          { status: 402 }
        );
      }
    }

    // ── Upsert property with parcel anchor data ──
    const parts = cleanAddress.split(",").map((s: string) => s.trim());
    const street = parts[0] || cleanAddress;
    const city = parts[1] || "";
    const stateZip = (parts[2] || "").trim().split(/\s+/);
    const stateCode = stateZip[0] || detectedState || "GA";
    const zip = stateZip[1] || "";

    const { data: propRow } = await db
      .from("properties")
      .upsert(
        {
          full_address: cleanAddress,
          street,
          city,
          state: stateCode,
          zip,
          county: anchor.county || county || null,
          parcel_id: anchor.parcelId,
          legal_description:
            [anchor.subdivision, anchor.subdivisionLot, anchor.subdivisionBlock]
              .filter(Boolean)
              .join(" / ") || null,
          acreage: anchor.landAcres || null,
          assessed_value: anchor.totalAssessedValue || null,
          tax_year: anchor.taxYear || null,
        },
        { onConflict: "full_address" }
      )
      .select("id")
      .single();

    const propertyId = propRow?.id;
    if (!propertyId) {
      return NextResponse.json({ error: "Could not persist property" }, { status: 500 });
    }

    // ── Dedupe: same (user_id, property_id) re-runs the existing report.
    // Avoids cluttering the dashboard with duplicates and preserves the
    // historical search ID for audit. The "Re-run" replaces stale data on
    // the same row + updates the date.
    const { data: existing } = await db
      .from("search_reports")
      .select("id, pipeline_stage, status")
      .eq("user_id", userId)
      .eq("property_id", propertyId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    let reportId: string;
    if (existing?.id) {
      const inFlight =
        existing.pipeline_stage &&
        !["ready", "delivered", "blocked"].includes(existing.pipeline_stage);
      if (inFlight) {
        return NextResponse.json({
          report_id: existing.id,
          status: "already_running",
          message: "A search for this address is already running — opening the existing report.",
        });
      }
      // Re-run: reset stage + counters, keep ID. Wipe stale attorney_action_plan
      // (otherwise the dashboard banner reads yesterday's "N items" count until
      // the new run reaches drafting). Also clear billed/refund_reason so the
      // no-charge flow starts fresh — if THIS run blocks, refundReport will
      // re-mark it billed=false; if it ships, billed stays true.
      await db
        .from("search_reports")
        .update({
          pipeline_stage: "queued",
          status: "pending",
          panel_verdict: null,
          panel_ship_confidence_pct: null,
          stage_attempts: 0,
          last_error: null,
          failed_at: null,
          completed_at: null,
          started_at: new Date().toISOString(),
          lender_loan_no: lender_loan_no || null,
          internal_file_no: internal_file_no || null,
          closing_date: closing_date || null,
          issuing_attorney_id: issuing_attorney_id || null,
          search_hints: searchHints,
          attorney_action_plan: null,
          billed: true,
          refund_reason: null,
        })
        .eq("id", existing.id);
      // Drop the prior refund audit row so refundReport's idempotency check
      // doesn't no-op when THIS run also blocks. UNIQUE(report_id) on the
      // audit table is intentional — we model "one refund per run" by
      // deleting on re-queue.
      await db.from("report_refunds").delete().eq("report_id", existing.id);
      reportId = existing.id;
    } else {
      const { data: report, error: reportErr } = await db
        .from("search_reports")
        .insert({
          user_id: userId,
          property_id: propertyId,
          tier: "full_search",
          status: "pending",
          pipeline_stage: "queued",
          is_free_trial: billingMode === "free",
          started_at: new Date().toISOString(),
          lender_loan_no: lender_loan_no || null,
          internal_file_no: internal_file_no || null,
          closing_date: closing_date || null,
          issuing_attorney_id: issuing_attorney_id || null,
          search_hints: searchHints,
        })
        .select("id")
        .single();

      if (reportErr || !report) {
        console.error("[queue] insert failed:", reportErr);
        return NextResponse.json({ error: "Could not queue report" }, { status: 500 });
      }
      reportId = report.id;
    }
    const report = { id: reportId };

    // Decrement prepaid package balance ATOMICALLY (oldest non-expired first).
    // debit_report_package does the package decrement + user balance + report
    // stamp in one transaction with row locking, so concurrent runs can't both
    // take the last report and a partial-failure can't desync the balances.
    if (billingMode === "package") {
      const { data: debit, error: debitErr } = await db.rpc("debit_report_package", {
        p_user: userId,
        p_report: report!.id,
      });
      if (debitErr || debit?.debited !== true) {
        // Balance was exhausted between the gate read and here (race), or the
        // RPC failed — block the report and 402 rather than run it unpaid.
        await db.from("search_reports")
          .update({ pipeline_stage: "blocked", last_error: "Billing: no package balance at debit time" })
          .eq("id", report!.id);
        return NextResponse.json(
          {
            error: "Payment method required",
            code: "PAYMENT_REQUIRED",
            message: "Your package balance was just used up. Buy a package or save a card on file in Billing.",
          },
          { status: 402 }
        );
      }
    }

    // If past free trial AND has saved card → record usage so LS charges
    // the card at next billing cycle. Do this AFTER report insert so we
    // have an ID to tag the usage record with.
    if (billingMode === "metered" && userProfile?.ls_subscription_item_id) {
      try {
        const { recordReportUsage } = await import("@/lib/lemonsqueezy");
        const usageRecordId = await recordReportUsage({
          subscriptionItemId: userProfile.ls_subscription_item_id!,
          reportId: report!.id,
        });
        await db.from("search_reports")
          .update({ stripe_payment_id: `ls_usage_${usageRecordId}`, is_free_trial: false, amount_cents: 20000 })
          .eq("id", report!.id);
        console.log(`[queue] LS usage recorded: report=${report!.id} usage=${usageRecordId}`);
      } catch (err) {
        console.error(`[queue] LS usage record failed for ${report!.id}:`, err);
        // Roll back the report so we don't ship a free report
        await db.from("search_reports").update({ pipeline_stage: "blocked", last_error: "Billing failed: could not record usage" }).eq("id", report!.id);
        try {
          const { refundReport } = await import("@/lib/billing/refund");
          await refundReport(db, report!.id, "BILLING_FAILED");
        } catch (e) {
          console.warn(`[queue] refund record failed for ${report!.id}:`, e);
        }
        return NextResponse.json(
          { error: "Could not charge your card on file. Please update payment method in Billing." },
          { status: 402 }
        );
      }
    }

    return NextResponse.json({
      report_id: report!.id,
      status: "queued",
      property: {
        parcel_id: anchor.parcelId,
        owner: anchor.owner,
        county: anchor.county,
        assessed_value: anchor.totalAssessedValue,
        acreage: anchor.landAcres,
      },
      message:
        "Report queued. We'll search county records, run our quality panel, draft the AOL + homeowner summary, and notify you when ready (typically 2-3 minutes).",
    });
  } catch (err) {
    console.error("[queue] error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
