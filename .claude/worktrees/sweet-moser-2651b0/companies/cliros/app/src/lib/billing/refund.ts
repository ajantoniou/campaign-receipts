/* ─── Refund helper for unverifiable reports ───
   When the pipeline ends a report in a "could not verify" state (parcel not
   found, panel kill, retry exhaustion) we waive the credit instead of
   charging the user. Idempotent: a re-run that fails again is a no-op
   (UNIQUE constraint on report_refunds.report_id).

   Founder policy (2026-05-23): don't charge for bogus results. Surface a
   "we couldn't validate this address — no charge" outcome and credit the
   debit back to whichever rail consumed it.
*/

import type { SupabaseClient } from "@supabase/supabase-js";

// Cliros uses the `cliros` Postgres schema, not `public`. We want this
// helper callable from any service-role client regardless of which schema
// was bound at construction time. Loosen the generic to `any` — the actual
// table names are hardcoded below so type safety is moot.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySupabaseClient = SupabaseClient<any, any, any, any, any>;

export type RefundReason =
  | "PARCEL_NOT_FOUND"
  | "PANEL_KILL"
  | "MAX_ATTEMPTS"
  | "BILLING_FAILED"
  // Structurally-impossible report: 0 chain conveyances but >=1 lien. The
  // vesting deed was not surfaced (GSCCCA detail-pull cap). Blocked no-charge
  // rather than shipping an empty-chain AOL. See search-orchestrator.ts.
  | "CHAIN_EMPTY_LIENS_PRESENT";

interface RefundResult {
  refunded: boolean;
  creditKind: "package" | "metered" | "free_trial" | "beta_mode" | "none";
  skipped?: "already_refunded" | "free_trial" | "beta_mode" | "no_debit";
}

/**
 * Mark a report as un-billed and reverse its credit debit.
 *
 * Idempotent — second call for the same reportId is a no-op (returns
 * { refunded: false, skipped: "already_refunded" }).
 *
 * Free trial + BETA_MODE rows were never billed → marks the report
 * `billed=false` for UI purposes but performs no credit movement.
 *
 * Package rows: increments users.reports_remaining and adds back to the
 * oldest non-expired package balance (mirror of the debit in queue/route.ts).
 *
 * Metered rows: LemonSqueezy's usage records API doesn't expose deletion;
 * instead we post a `decrement` usage record of quantity 1 to offset the
 * earlier charge within the same billing period. Best-effort: if LS API
 * fails we still mark `billed=false` and log — support can comp manually.
 */
export async function refundReport(
  db: AnySupabaseClient,
  reportId: string,
  reason: RefundReason,
): Promise<RefundResult> {
  // ATOMIC CLAIM (closes the double-refund window). claim_refund inserts the
  // report_refunds audit row FIRST under the UNIQUE(report_id) constraint, and
  // ONLY if the claim is newly taken does it reverse the package/free credit —
  // all in one transaction. A concurrent or retry call gets claimed=false and
  // we do NOT touch LemonSqueezy. This makes the previous TOCTOU race
  // (two callers both passing a SELECT check, both decrementing LS) impossible,
  // and removes the post-LS-call DB-write-fail re-refund hole.
  const { data: claim, error: claimErr } = await db.rpc("claim_refund", {
    p_report: reportId,
    p_reason: reason,
  });
  if (claimErr) {
    console.warn(`[refund] claim_refund RPC failed for ${reportId}:`, claimErr);
    return { refunded: false, creditKind: "none", skipped: "no_debit" };
  }

  const claimed = claim?.claimed === true;
  const claimReason = claim?.reason as string | undefined;
  if (!claimed) {
    if (claimReason === "report_not_found") {
      console.warn(`[refund] report ${reportId} not found — skipping`);
      return { refunded: false, creditKind: "none", skipped: "no_debit" };
    }
    // already_refunded → idempotent no-op
    return { refunded: false, creditKind: "none", skipped: "already_refunded" };
  }

  const creditKind = (claim?.credit_kind as RefundResult["creditKind"]) || "none";

  // Free-trial / package / none rails are fully settled inside claim_refund
  // (no external money call). Only the metered rail needs a LemonSqueezy
  // decrement, posted AFTER the atomic claim so it can never be double-posted.
  if (creditKind === "metered") {
    const lsUsageId = (claim?.ls_usage_record_id as string | undefined) || "";
    let lsOffsetId: string | undefined;
    let ok = false;
    try {
      const { data: userRow } = await db
        .from("users")
        .select("ls_subscription_item_id")
        .eq("id", (claim?.user_id as string) || "")
        .maybeSingle();
      // user_id isn't returned by the RPC; re-read from the report instead.
      let subItemId = userRow?.ls_subscription_item_id as string | undefined;
      if (!subItemId) {
        const { data: rep } = await db
          .from("search_reports")
          .select("user_id")
          .eq("id", reportId)
          .maybeSingle();
        if (rep?.user_id) {
          const { data: u2 } = await db
            .from("users")
            .select("ls_subscription_item_id")
            .eq("id", rep.user_id)
            .maybeSingle();
          subItemId = u2?.ls_subscription_item_id as string | undefined;
        }
      }
      if (subItemId) {
        const { decrementReportUsageBySubItem } = await import("../lemonsqueezy");
        lsOffsetId = await decrementReportUsageBySubItem({
          subscriptionItemId: subItemId,
          reportId,
        });
        ok = true;
      } else {
        console.warn(`[refund] no ls_subscription_item_id for report ${reportId} — skipping LS decrement`);
      }
    } catch (err) {
      console.warn(`[refund] LS decrement failed for ${reportId} (claim already recorded):`, err);
    }
    // Patch the audit row with the offset id / outcome. Best-effort; the claim
    // row already exists, so a failure here never causes a re-refund.
    await db.rpc("patch_refund_ls_usage", {
      p_report: reportId,
      p_ls_offset: lsOffsetId || lsUsageId || null,
      p_ok: ok,
    });
    return { refunded: true, creditKind: "metered" };
  }

  return { refunded: true, creditKind };
}
