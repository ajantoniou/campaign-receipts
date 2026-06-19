/**
 * Lemon Squeezy checkout URLs — the two live SKUs, API-verified 2026-06-11
 * against the `creativelabs2016` store:
 *
 *   - $25 paperback  — product 1061045 "SEALED: The 2016 Promises — Before
 *     the Deals (paperback)", published. LS is the merchant; Lulu drop-ships
 *     the printed copy (ISBN 978-1-105-29182-1; the public Lulu Bookstore
 *     listing still exists but the site's checkout runs through LS per
 *     founder direction 2026-06-11).
 *   - $5 companion PDF — product 1043612 "SEALED: The 2024 Deleted Promises",
 *     published, delivers 2024-deleted-promises-v1.pdf via LS file delivery.
 *
 * The $15 standalone-PDF SKU was retired 2026-05-25 and its checkout UUID
 * (90308e58…) was repurposed in LS for the $5 companion — never label that
 * URL as the 2016 book.
 */
const SEALED_PAPERBACK_DEFAULT =
  'https://creativelabs2016.lemonsqueezy.com/checkout/buy/bf4abcf4-6133-4a7d-8b9f-d013ea1fa1e0';

const DELETED_2024_PDF_DEFAULT =
  'https://creativelabs2016.lemonsqueezy.com/checkout/buy/90308e58-3e24-40fa-b9be-269480ef8767';

export const sealedCheckoutUrls = {
  // Legacy tier keys (standard/bundle/dashboard/movie/hardcover) all route to
  // the paperback so a stray historical button never lands on a 404.
  standard:
    process.env.NEXT_PUBLIC_SEALED_CHECKOUT_STANDARD_URL ??
    SEALED_PAPERBACK_DEFAULT,
  bundle:
    process.env.NEXT_PUBLIC_SEALED_CHECKOUT_BUNDLE_URL ??
    SEALED_PAPERBACK_DEFAULT,
  dashboard:
    process.env.NEXT_PUBLIC_SEALED_CHECKOUT_DASHBOARD_URL ??
    SEALED_PAPERBACK_DEFAULT,
  movie:
    process.env.NEXT_PUBLIC_SEALED_CHECKOUT_MOVIE_URL ??
    SEALED_PAPERBACK_DEFAULT,
  hardcover:
    process.env.NEXT_PUBLIC_SEALED_CHECKOUT_HARDCOVER_URL ??
    SEALED_PAPERBACK_DEFAULT,
  paperback:
    process.env.NEXT_PUBLIC_SEALED_CHECKOUT_PAPERBACK_URL ??
    SEALED_PAPERBACK_DEFAULT,
  deleted2024:
    process.env.NEXT_PUBLIC_SEALED_CHECKOUT_2024_DELETED_URL ??
    DELETED_2024_PDF_DEFAULT,
} as const;

export const paperbackCheckoutUrl = sealedCheckoutUrls.paperback;
export const deletedPromises2024CheckoutUrl = sealedCheckoutUrls.deleted2024;
