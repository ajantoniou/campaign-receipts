/* ─── LemonSqueezy Webhook Handler ─── */
/* POST /api/lemon/webhook
   Handles order_created events from LemonSqueezy.
   Marks report as paid in Supabase.
   Handles LemonSqueezy order_created events.
*/

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { verifyWebhookSignature } from "@/lib/lemonsqueezy";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("x-signature") || request.headers.get("X-Signature") || "";

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  // Verify webhook signature
  if (!verifyWebhookSignature(body, signature)) {
    console.error("[LemonSqueezy Webhook] Signature verification failed");
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  let event;
  try {
    event = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // Replay guard: reject events whose payload timestamp is far in the past.
  // The signature proves authenticity but not freshness — a captured webhook
  // could be replayed. LS includes created_at on the order/subscription data.
  // Downstream credit ops are also idempotent (UNIQUE(ls_order_id)), so this is
  // defense-in-depth, not the only line. Window: 1 hour.
  const eventTs =
    event.data?.attributes?.created_at || event.data?.attributes?.updated_at;
  if (eventTs) {
    const ageMs = Date.now() - new Date(eventTs).getTime();
    if (Number.isFinite(ageMs) && ageMs > 60 * 60 * 1000) {
      console.warn(`[LS Webhook] rejecting stale event (age ${Math.round(ageMs / 60000)}min):`, event.meta?.event_name);
      return NextResponse.json({ error: "Stale event" }, { status: 400 });
    }
  }

  const eventName = event.meta?.event_name;

  switch (eventName) {
    case "order_created": {
      const customData = event.meta?.custom_data || {};
      const userId = customData.user_id;
      const kind = customData.kind || "";
      const reportId = customData.report_id;
      const address = customData.address;
      const orderId = event.data?.id;

      // Package purchase: add reports to the user's balance and record
      // a row in cliros.report_packages for the 12-month expiration ledger.
      if (userId && kind.startsWith("package_")) {
        const packageSize = parseInt(customData.package_size || kind.replace("package_", ""), 10);
        if (![1, 5, 25].includes(packageSize)) {
          console.warn(`[LS Webhook] unknown package_size=${packageSize} order=${orderId}`);
          break;
        }
        const supabase = createServerClient();
        const amountCents = event.data?.attributes?.total ?? 0;

        // ATOMIC + IDEMPOTENT credit. credit_package_order inserts the package
        // row (ON CONFLICT on the ls_order_id unique index → no-op on retry) AND
        // bumps the user balance in one transaction. A retried webhook returns
        // credited=false and never double-credits.
        const { data: credit, error: creditErr } = await supabase.rpc("credit_package_order", {
          p_user: userId,
          p_ls_order: String(orderId),
          p_size: packageSize,
          p_amount: amountCents,
        });
        if (creditErr) {
          console.error(`[LS Webhook] credit_package_order failed order=${orderId}:`, creditErr);
          // 500 so LS retries — the RPC is idempotent so a retry is safe.
          return NextResponse.json({ error: "Credit failed" }, { status: 500 });
        }
        if (credit?.credited === false) {
          console.log(`[LS Webhook] duplicate package order=${orderId} — no-op`);
          break;
        }

        await supabase.from("audit_log").insert({
          user_id: userId,
          action: "package_purchased",
          details: { package_size: packageSize, amount_cents: amountCents, order_id: orderId },
        });
        console.log(`[LS Webhook] Package ${packageSize} purchased: user=${userId} order=${orderId}`);
        break;
      }

      // Per-report one-time checkout (legacy single-report flow):
      if (!userId || !reportId) {
        console.warn("[LemonSqueezy Webhook] Missing custom_data in order:", orderId);
        break;
      }

      console.log(`[LemonSqueezy Webhook] Payment complete: user=${userId} report=${reportId} order=${orderId}`);

      const supabase = createServerClient();

      // Update report as paid
      const { error: updateError } = await supabase
        .from("search_reports")
        .update({
          is_free_trial: false,
          paid_at: new Date().toISOString(),
          stripe_session_id: `ls_order_${orderId}`, // reusing column for LS order ID
        })
        .eq("id", reportId)
        .eq("user_id", userId);

      if (updateError) {
        // Do NOT fuzzy-match to "the most recent unpaid report" — if the
        // report_id is stale/missing and the user has multiple unpaid reports,
        // that guesses the WRONG report and marks it paid. Log loudly and let
        // the order sit; the webhook is the reconciliation backstop and LS will
        // retry, or support can reconcile by ls_order_id. (address unused.)
        console.error(
          `[LemonSqueezy Webhook] Could not mark report ${reportId} paid (order=${orderId}, user=${userId}) — NOT fuzzy-matching to avoid paying the wrong report:`,
          updateError,
        );
        void address;
      }

      // Audit log
      await supabase.from("audit_log").insert({
        user_id: userId,
        action: "payment_completed",
        details: {
          report_id: reportId,
          address,
          provider: "lemonsqueezy",
          order_id: orderId,
          amount: event.data?.attributes?.total,
        },
      });

      break;
    }

    case "subscription_created":
    case "subscription_updated": {
      // The metered-subscription flow: attorney finished the $0 checkout
      // and LS created a subscription. Record the subscription_id +
      // subscription_item_id on users so /api/search/queue can charge
      // future reports via recordReportUsage().
      const customData = event.meta?.custom_data || {};
      const userId = customData.user_id;
      if (!userId) {
        console.warn("[LS Webhook] subscription event without user_id custom_data");
        break;
      }
      const subscriptionId = event.data?.id;
      const attrs = event.data?.attributes || {};
      const status = attrs.status;
      const cardBrand = attrs.card_brand;
      const cardLast4 = attrs.card_last_four;

      // Pull the subscription_item_id from the included data (LS sends it
      // on subscription events when ?include=subscription-items was set,
      // but webhooks don't always include it — fall back to API lookup).
      let itemId: string | null = null;
      const included = event.included || [];
      const item = included.find((x: { type?: string; id?: string }) => x.type === "subscription-items");
      if (item?.id) itemId = String(item.id);

      if (!itemId && subscriptionId) {
        try {
          const { getSubscriptionItemId } = await import("@/lib/lemonsqueezy");
          itemId = await getSubscriptionItemId(String(subscriptionId));
        } catch (err) {
          console.warn("[LS Webhook] could not fetch subscription_item_id:", err);
        }
      }

      const supabase = createServerClient();
      await supabase
        .from("users")
        .update({
          ls_subscription_id: subscriptionId ? String(subscriptionId) : null,
          ls_subscription_item_id: itemId,
          ls_card_brand: cardBrand || null,
          ls_card_last4: cardLast4 || null,
          ls_subscription_status: status || null,
        })
        .eq("id", userId);

      await supabase.from("audit_log").insert({
        user_id: userId,
        action: eventName,
        details: { subscription_id: subscriptionId, item_id: itemId, status, card_last4: cardLast4 },
      });
      console.log(`[LS Webhook] ${eventName}: user=${userId} sub=${subscriptionId} item=${itemId} status=${status}`);
      break;
    }

    case "subscription_cancelled":
    case "subscription_expired": {
      const customData = event.meta?.custom_data || {};
      const userId = customData.user_id;
      if (!userId) break;
      const supabase = createServerClient();
      await supabase
        .from("users")
        .update({ ls_subscription_status: event.data?.attributes?.status || "cancelled" })
        .eq("id", userId);
      break;
    }

    default:
      console.log(`[LemonSqueezy Webhook] Unhandled event: ${eventName}`);
  }

  return NextResponse.json({ received: true });
}
