/**
 * Lemon Squeezy checkout URLs. Override via Render env vars per-variant when
 * new tiers ship; defaults below are real, curl-tested checkout URLs from
 * the live `creativelabs2016` Lemon Squeezy store (variant id 1636597,
 * SEALED PDF $15). The store is publicly buyable.
 *
 * Bundle / Dashboard / Movie / Hardcover variants are added below as they
 * are published. Until then, all extra-tier links route to the PDF checkout
 * so a stray button never lands on a 404.
 */
const SEALED_PDF_DEFAULT =
  'https://creativelabs2016.lemonsqueezy.com/checkout/buy/90308e58-3e24-40fa-b9be-269480ef8767';

// Paperback — listed on Lulu Bookstore 2026-05-18 with real ISBN
// 978-1-105-29182-1. Lulu acts as merchant of record, prints, ships, and
// collects sales tax. Royalty: ~$15.58 per $25 sale. Buyer leaves
// sealed2016.com for checkout on lulu.com, which is on-brand (Lulu IS the
// printer; this is "drop-shipped from our printer").
//
// Previous Lemon Squeezy paperback URL (variant 1663649) is now an orphan;
// LS doesn't support physical goods + shipping addresses, so it was always
// going to fail under real traffic. Archived in LS dashboard.
const SEALED_PAPERBACK_DEFAULT =
  'https://www.lulu.com/shop/peter-oliver/sealed-the-2016-promises-before-the-deals/paperback/product-84d7e29.html';

export const sealedCheckoutUrls = {
  standard:
    process.env.NEXT_PUBLIC_SEALED_CHECKOUT_STANDARD_URL ?? SEALED_PDF_DEFAULT,
  bundle:
    process.env.NEXT_PUBLIC_SEALED_CHECKOUT_BUNDLE_URL ?? SEALED_PDF_DEFAULT,
  dashboard:
    process.env.NEXT_PUBLIC_SEALED_CHECKOUT_DASHBOARD_URL ?? SEALED_PDF_DEFAULT,
  movie:
    process.env.NEXT_PUBLIC_SEALED_CHECKOUT_MOVIE_URL ?? SEALED_PDF_DEFAULT,
  hardcover:
    process.env.NEXT_PUBLIC_SEALED_CHECKOUT_HARDCOVER_URL ??
    SEALED_PAPERBACK_DEFAULT,
  paperback:
    process.env.NEXT_PUBLIC_SEALED_CHECKOUT_PAPERBACK_URL ??
    SEALED_PAPERBACK_DEFAULT,
} as const;

export const paperbackCheckoutUrl = sealedCheckoutUrls.paperback;
