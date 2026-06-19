/* ─── LemonSqueezy Client for Cliros ─── */
/* Handles checkout creation and webhook verification for $200/report payments */

const LS_API_BASE = "https://api.lemonsqueezy.com/v1";

function getApiKey(): string {
  const key = process.env.LEMONSQUEEZY_API_KEY;
  if (!key) throw new Error("LEMONSQUEEZY_API_KEY not configured");
  return key;
}

async function lsFetch(endpoint: string, options: RequestInit = {}) {
  const res = await fetch(`${LS_API_BASE}${endpoint}`, {
    ...options,
    headers: {
      Accept: "application/vnd.api+json",
      "Content-Type": "application/vnd.api+json",
      Authorization: `Bearer ${getApiKey()}`,
      ...options.headers,
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`LemonSqueezy API error ${res.status}: ${text}`);
  }

  return res.json();
}

// Product config
export const CLIROS_REPORT_PRICE_CENTS = 20000; // $200.00
export const CLIROS_FREE_REPORT_LIMIT = 5;

/* ─── Report Packages (Prepaid Single Payments) ───
   Per business-plan.md: attorneys buy report packages up-front to
   reduce A/R risk. Floor per-report price = $200 (committed buyers).
   Three tiers under one LS product, exposed as variants:
      1 report   → $250   ($250/ea — anchor; pay for convenience)
      5 reports  → $1,100 ($220/ea — 12% off; solo commitment)
     25 reports  → $5,000 ($200/ea — 20% off; standard firm rate,
                            also LS per-transaction cap ceiling)
   No refunds, but generous credits/re-runs via support@cliros.ai.
   Reports expire 12 months from purchase. Volume past 25 → alex@cliros.ai.

   Setup (LS dashboard):
   1. Create ONE single-payment product, then add 3 variants.
   2. Set env vars (one variant ID per tier):
      LEMONSQUEEZY_PACKAGE_1_VARIANT_ID
      LEMONSQUEEZY_PACKAGE_5_VARIANT_ID
      LEMONSQUEEZY_PACKAGE_25_VARIANT_ID
*/

export type PackageSize = 1 | 5 | 25;

const PACKAGE_CONFIG: Record<PackageSize, { priceCents: number; envVar: string }> = {
  1:  { priceCents:  25_000, envVar: "LEMONSQUEEZY_PACKAGE_1_VARIANT_ID"  },
  5:  { priceCents: 110_000, envVar: "LEMONSQUEEZY_PACKAGE_5_VARIANT_ID"  },
  25: { priceCents: 500_000, envVar: "LEMONSQUEEZY_PACKAGE_25_VARIANT_ID" },
};

export function packagePriceCents(size: PackageSize): number {
  return PACKAGE_CONFIG[size].priceCents;
}

/** Create a hosted checkout for a package purchase. */
export async function createPackageCheckout(params: {
  size: PackageSize;
  userId: string;
  userEmail: string;
  successUrl: string;
}): Promise<{ url: string; priceCents: number }> {
  const storeId = process.env.LEMONSQUEEZY_STORE_ID;
  const cfg = PACKAGE_CONFIG[params.size];
  const variantId = process.env[cfg.envVar];
  if (!storeId || !variantId) {
    throw new Error(`LemonSqueezy package variant not configured (${cfg.envVar})`);
  }

  const data = await lsFetch("/checkouts", {
    method: "POST",
    body: JSON.stringify({
      data: {
        type: "checkouts",
        attributes: {
          checkout_data: {
            email: params.userEmail,
            custom: {
              user_id: params.userId,
              kind: `package_${params.size}`,
              package_size: String(params.size),
            },
          },
          checkout_options: { embed: false, media: false, logo: true },
          product_options: {
            redirect_url: params.successUrl,
            receipt_thank_you_note: `Thanks! ${params.size} reports added to your dashboard. Reports expire 12 months from today.`,
          },
        },
        relationships: {
          store: { data: { type: "stores", id: storeId } },
          variant: { data: { type: "variants", id: variantId } },
        },
      },
    }),
  });
  return { url: data.data.attributes.url, priceCents: cfg.priceCents };
}

/* ─── Metered (Usage-Based) Subscription ───
   "Card on file" for paralegals. LS is Merchant of Record: they collect
   tax, absorb chargebacks, handle PCI. We just report usage.

   One-time LS dashboard setup:
   1. Create a Subscription product priced at $200/unit, billed monthly,
      "Usage is metered?" ON, "Sum of usage during period" aggregation.
   2. Set LEMONSQUEEZY_METERED_VARIANT_ID in env.

   Per-attorney flow:
   1. Attorney clicks "Save card on file" → createMeteredCheckout()
      → LS hosts a $0 checkout that captures card and starts
      a metered subscription.
   2. Webhook subscription_created → we store ls_subscription_id +
      ls_subscription_item_id on users table.
   3. Every report past the free trial → recordReportUsage()
      increments the meter by 1. LS charges $200 at billing cycle.
*/

/** $0 checkout that subscribes the attorney to the metered Reports plan.
 *  They never see a charge here — just card capture. */
export async function createMeteredCheckout(params: {
  userId: string;
  userEmail: string;
  successUrl: string;
}): Promise<{ url: string }> {
  const storeId = process.env.LEMONSQUEEZY_STORE_ID;
  const variantId = process.env.LEMONSQUEEZY_METERED_VARIANT_ID;
  if (!storeId || !variantId) {
    throw new Error("LemonSqueezy metered variant not configured (LEMONSQUEEZY_METERED_VARIANT_ID)");
  }

  const data = await lsFetch("/checkouts", {
    method: "POST",
    body: JSON.stringify({
      data: {
        type: "checkouts",
        attributes: {
          checkout_data: {
            email: params.userEmail,
            custom: { user_id: params.userId, kind: "metered_signup" },
          },
          checkout_options: { embed: false, media: false, logo: true },
          product_options: {
            redirect_url: params.successUrl,
            receipt_thank_you_note: "Card saved. Paralegals can now run reports without re-entering payment.",
          },
        },
        relationships: {
          store: { data: { type: "stores", id: storeId } },
          variant: { data: { type: "variants", id: variantId } },
        },
      },
    }),
  });
  return { url: data.data.attributes.url };
}

/** Fetch subscription + first subscription_item_id (the meter handle). */
export async function getSubscriptionItemId(subscriptionId: string): Promise<string | null> {
  const data = await lsFetch(`/subscriptions/${subscriptionId}?include=subscription-items`);
  const item = data?.included?.find(
    (x: { type: string; id: string }) => x.type === "subscription-items"
  );
  return item?.id || null;
}

/** Record one report's worth of usage. LS charges the saved card at the
 *  billing cycle close. Throws on failure — caller must NOT count this
 *  against the attorney's free trial if it raises. */
export async function recordReportUsage(params: {
  subscriptionItemId: string;
  reportId: string;
}): Promise<string> {
  const data = await lsFetch("/usage-records", {
    method: "POST",
    body: JSON.stringify({
      data: {
        type: "usage-records",
        attributes: { quantity: 1, action: "increment" },
        relationships: {
          "subscription-item": {
            data: { type: "subscription-items", id: params.subscriptionItemId },
          },
        },
      },
    }),
  });
  return data?.data?.id || "";
}

/** Offsetting decrement usage record for a refunded report.
 *  LS doesn't expose usage-record deletion — the documented pattern is to
 *  post a counter-record that nets the original quantity to zero. Within
 *  the same billing period the customer is not charged for the report.
 *  Caller must already know the subscription_item_id for the user.
 */
export async function decrementReportUsage(_params: {
  reportId: string;
}): Promise<string> {
  // We need the user's subscription_item_id to post the counter-record.
  // The caller (refundReport) doesn't have it on the report row, so this
  // resolves via the users table. Imported lazily by refund.ts to keep
  // the module side-effect-free.
  throw new Error("decrementReportUsage requires subscriptionItemId — call decrementReportUsageBySubItem instead");
}

export async function decrementReportUsageBySubItem(params: {
  subscriptionItemId: string;
  reportId: string;
}): Promise<string> {
  const data = await lsFetch("/usage-records", {
    method: "POST",
    body: JSON.stringify({
      data: {
        type: "usage-records",
        attributes: { quantity: 1, action: "decrement" },
        relationships: {
          "subscription-item": {
            data: { type: "subscription-items", id: params.subscriptionItemId },
          },
        },
      },
    }),
  });
  return data?.data?.id || "";
}

/** Card brand + last4 for display on the Billing page. */
export async function getSubscriptionCardInfo(subscriptionId: string): Promise<{
  brand: string;
  last4: string;
  status: string;
  renewsAt?: string;
} | null> {
  const data = await lsFetch(`/subscriptions/${subscriptionId}`);
  const attrs = data?.data?.attributes;
  if (!attrs) return null;
  return {
    brand: attrs.card_brand || "card",
    last4: attrs.card_last_four || "····",
    status: attrs.status || "unknown",
    renewsAt: attrs.renews_at || undefined,
  };
}

/**
 * Create a LemonSqueezy checkout for a single report purchase.
 * Uses the checkout API to create a hosted checkout URL.
 */
export async function createReportCheckout(params: {
  userId: string;
  reportId: string;
  address: string;
  userEmail: string;
  successUrl: string;
}): Promise<{ url: string }> {
  const storeId = process.env.LEMONSQUEEZY_STORE_ID;
  const variantId = process.env.LEMONSQUEEZY_CLIROS_VARIANT_ID;

  if (!storeId || !variantId) {
    throw new Error("LemonSqueezy store/variant not configured");
  }

  const data = await lsFetch("/checkouts", {
    method: "POST",
    body: JSON.stringify({
      data: {
        type: "checkouts",
        attributes: {
          checkout_data: {
            email: params.userEmail,
            custom: {
              user_id: params.userId,
              report_id: params.reportId,
              address: params.address,
            },
          },
          product_options: {
            name: "Cliros Title Search Report",
            description: `Title search report for: ${params.address}`,
            redirect_url: params.successUrl,
          },
        },
        relationships: {
          store: { data: { type: "stores", id: storeId } },
          variant: { data: { type: "variants", id: variantId } },
        },
      },
    }),
  });

  return { url: data.data.attributes.url };
}

/**
 * Verify a LemonSqueezy webhook signature
 */
export function verifyWebhookSignature(
  rawBody: string,
  signature: string
): boolean {
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
  if (!secret) return false;

  // LemonSqueezy uses HMAC-SHA256
  const crypto = require("crypto");
  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(rawBody);
  const digest = hmac.digest("hex");

  // timingSafeEqual throws on length mismatch — guard so a malformed/garbage
  // signature returns false (clean rejection) instead of throwing a 500, which
  // would make LemonSqueezy retry the webhook.
  const sigBuf = Buffer.from(signature, "hex");
  const digestBuf = Buffer.from(digest, "hex");
  if (sigBuf.length !== digestBuf.length) return false;

  return crypto.timingSafeEqual(sigBuf, digestBuf);
}

/**
 * List products in the store (useful for finding variant IDs)
 */
export async function listProducts() {
  const storeId = process.env.LEMONSQUEEZY_STORE_ID;
  return lsFetch(`/products?filter[store_id]=${storeId}`);
}

/**
 * List variants for a product
 */
export async function listVariants(productId: string) {
  return lsFetch(`/variants?filter[product_id]=${productId}`);
}
