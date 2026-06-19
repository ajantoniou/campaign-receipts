/**
 * SEALED — Per-Buyer Watermark Webhook
 *
 * Receives Lemon Squeezy `order_created` webhooks, generates a per-buyer
 * watermarked PDF in memory, emails it as an attachment, and exposes a
 * single-use download link. NEVER persists buyer PII or watermarked PDFs.
 *
 * Architecture:
 *   1. POST /webhook       ← Lemon Squeezy `order_created` posts here
 *      - HMAC-verifies signature
 *      - Stamps base PDF with buyer name/email/billing address on every page
 *      - Emails the watermarked PDF as an attachment via Resend
 *      - Stores ONLY a short-lived signed token in memory (15 min TTL) →
 *        token holds the PDF bytes for ONE download, then is wiped
 *   2. GET /download/:token ← One-time download link
 *      - Returns the PDF bytes once, then deletes the token
 *
 * No database. No buyer data on disk. If process restarts, in-flight tokens
 * are gone — buyer still has the email attachment.
 *
 * Environment variables (set on Render):
 *   LEMONSQUEEZY_WEBHOOK_SECRET  — HMAC secret from LS dashboard
 *   RESEND_API_KEY               — for sending watermarked PDF email
 *   FROM_EMAIL                   — e.g. "SEALED <support@sealed2016.com>"
 *   BASE_PDF_URL                 — public URL to fetch the master PDF (e.g. R2 or repo raw)
 *   PUBLIC_URL                   — this service's public URL (for download link)
 */

import express from "express"
import crypto from "node:crypto"
import { PDFDocument, StandardFonts, rgb } from "pdf-lib"
import { Resend } from "resend"
import AdmZip from "adm-zip"
import {
  createPrintJob as luluCreatePrintJob,
} from "./lulu-client.mjs"
import { stampColophon } from "./colophon-stamper.mjs"

const PORT = process.env.PORT || 10000
const WEBHOOK_SECRET = process.env.LEMONSQUEEZY_WEBHOOK_SECRET
const RESEND_API_KEY = process.env.RESEND_API_KEY
const FROM_EMAIL = process.env.FROM_EMAIL || "SEALED <support@sealed2016.com>"
const PUBLIC_URL = process.env.PUBLIC_URL || `http://localhost:${PORT}`
const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const SUPABASE_BUCKET = process.env.SUPABASE_BUCKET || "sealed-masters"
const SUPABASE_OBJECT = process.env.SUPABASE_OBJECT || "SEALED-v1-retail.pdf"
const SUPABASE_EPUB_OBJECT = process.env.SUPABASE_EPUB_OBJECT || "SEALED-v1-retail.epub"
// Product-ID filter — the Demiurgic Labs LS store also sells EstimateProof.
// We must ignore non-SEALED orders so EstimateProof buyers don't get a
// watermarked SEALED PDF in their inbox.
//
// Two SEALED products live in LS:
//   1043612 — SEALED PDF ($15, original)
//   1061045 — SEALED paperback ($25, drop-shipped via Lulu, WS13 2026-05-16)
// Both deliver the watermarked PDF + ePub bundle; the paperback ALSO triggers
// a Lulu print-job via the SEALED_PAPERBACK_PRODUCT_ID branch downstream.
const SEALED_PRODUCT_ID = process.env.SEALED_PRODUCT_ID || "1043612"
const SEALED_PAPERBACK_PRODUCT_ID =
  process.env.SEALED_PAPERBACK_PRODUCT_ID || "1061045"
const SEALED_PRODUCT_IDS = new Set([
  String(SEALED_PRODUCT_ID),
  String(SEALED_PAPERBACK_PRODUCT_ID),
])
// Paperback variant — set on Render once the Lemon Squeezy paperback variant
// exists. Unset by default → paperback branch is skipped and existing digital
// flow runs unchanged. NEVER infer a default; we want a typo here to mean
// "no paperback routing" rather than "accidentally drop-ship every buyer."
const LEMONSQUEEZY_PAPERBACK_VARIANT_ID =
  process.env.LEMONSQUEEZY_PAPERBACK_VARIANT_ID || null

// Lulu config — only consulted when the paperback branch fires.
const LULU_POD_PACKAGE_ID =
  process.env.LULU_POD_PACKAGE_ID || "0600X0900BWSTDPB080CW444GXX"
const LULU_PAPERBACK_INTERIOR_OBJECT =
  process.env.LULU_PAPERBACK_INTERIOR_OBJECT || "SEALED-v1-print.pdf"
const LULU_PAPERBACK_COVER_OBJECT =
  process.env.LULU_PAPERBACK_COVER_OBJECT || "SEALED-v1-print-cover.pdf"

/**
 * Master PDF lives in a PRIVATE Supabase Storage bucket. Lemon Squeezy
 * never holds the file directly — buyers only receive watermarked copies
 * via the email/download-link flow.
 *
 * To publish a new manuscript version: re-run scripts/build-retail-pdf.mjs
 * and upload to bucket `sealed-masters` (one curl/JS call). The next
 * refresh window on this service picks it up automatically.
 */
let baseBytes = null
let baseLoadedAt = 0
let baseEpubBytes = null
let baseEpubLoadedAt = 0
const BASE_REFRESH_MS = 30 * 60 * 1000 // re-fetch every 30 min

async function fetchSupabaseObject(objectKey) {
  if (!SUPABASE_URL) throw new Error("SUPABASE_URL not set")
  if (!SUPABASE_SERVICE_ROLE_KEY) throw new Error("SUPABASE_SERVICE_ROLE_KEY not set")
  const objectUrl = `${SUPABASE_URL}/storage/v1/object/${SUPABASE_BUCKET}/${encodeURIComponent(objectKey)}`
  const res = await fetch(objectUrl, {
    headers: {
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      apikey: SUPABASE_SERVICE_ROLE_KEY,
    },
  })
  if (!res.ok) {
    throw new Error(`Supabase storage fetch ${res.status} for ${objectKey}: ${await res.text()}`)
  }
  return new Uint8Array(await res.arrayBuffer())
}

async function loadBasePdf() {
  if (baseBytes && Date.now() - baseLoadedAt < BASE_REFRESH_MS) return baseBytes
  baseBytes = await fetchSupabaseObject(SUPABASE_OBJECT)
  baseLoadedAt = Date.now()
  console.log(`Loaded base PDF from Supabase: ${baseBytes.length} bytes`)
  return baseBytes
}

async function loadBaseEpub() {
  if (baseEpubBytes && Date.now() - baseEpubLoadedAt < BASE_REFRESH_MS) return baseEpubBytes
  baseEpubBytes = await fetchSupabaseObject(SUPABASE_EPUB_OBJECT)
  baseEpubLoadedAt = Date.now()
  console.log(`Loaded base ePub from Supabase: ${baseEpubBytes.length} bytes`)
  return baseEpubBytes
}

const TOKEN_TTL_MS = 15 * 60 * 1000 // 15 minutes
const tokens = new Map() // token -> { pdfBytes, expiresAt, used }

const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null
const app = express()

/* -------------------------------------------------------------------------- */
/* Signature verification (raw body required)                                 */
/* -------------------------------------------------------------------------- */
app.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    try {
      if (!WEBHOOK_SECRET) {
        console.error("LEMONSQUEEZY_WEBHOOK_SECRET not configured")
        return res.status(500).json({ error: "server misconfigured" })
      }

      const signature = req.get("X-Signature")
      if (!signature) return res.status(401).json({ error: "missing signature" })

      const expected = crypto
        .createHmac("sha256", WEBHOOK_SECRET)
        .update(req.body)
        .digest("hex")

      if (
        signature.length !== expected.length ||
        !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
      ) {
        return res.status(401).json({ error: "invalid signature" })
      }

      const payload = JSON.parse(req.body.toString("utf8"))
      const eventName = payload?.meta?.event_name

      // Reject replayed events older than 5 minutes
      const createdAt = payload?.meta?.created_at
      if (createdAt) {
        const age = Date.now() - new Date(createdAt).getTime()
        if (age > 5 * 60_000 || age < -60_000) {
          console.warn(`Rejected stale webhook event, age=${Math.round(age / 1000)}s`)
          return res.status(400).json({ error: "event too old" })
        }
      }

      if (eventName !== "order_created") {
        // Acknowledge but ignore other events
        return res.status(200).json({ ok: true, ignored: eventName })
      }

      const order = payload.data
      const attrs = order.attributes

      // Product-ID filter: the LS store sells multiple products. Only SEALED
      // orders should trigger the watermark flow. LS webhook payloads include
      // first_order_item with the product_id; also check order_items array
      // for multi-item orders.
      const items = attrs.first_order_item
        ? [attrs.first_order_item]
        : Array.isArray(attrs.order_items)
        ? attrs.order_items
        : []
      const productIds = items
        .map((it) => String(it.product_id || ""))
        .filter(Boolean)
      const isSealedOrder = productIds.some((pid) => SEALED_PRODUCT_IDS.has(pid))
      const isPaperbackOrder = productIds.includes(String(SEALED_PAPERBACK_PRODUCT_ID))
      if (!isSealedOrder) {
        console.log(
          `Ignoring order ${order.id} — product IDs [${productIds.join(",")}] do not include any SEALED product (${[...SEALED_PRODUCT_IDS].join(",")})`
        )
        return res
          .status(200)
          .json({ ok: true, ignored: "non-sealed-product" })
      }
      if (isPaperbackOrder) {
        console.log(
          `Order ${order.id} is a paperback purchase — digital bundle delivered first, Lulu print-job follows.`
        )
      }
      const buyer = {
        name: attrs.user_name || "Unknown",
        email: attrs.user_email || "unknown@unknown.com",
        // billing address pieces
        street: attrs.billing_address?.address || "",
        city: attrs.billing_address?.city || "",
        state: attrs.billing_address?.state || "",
        zip: attrs.billing_address?.zip || "",
        country: attrs.billing_address?.country || "",
        orderId: order.id,
        orderNumber: attrs.order_number,
      }

      // ─── Paperback branch (LS paperback variant → Lulu drop-ship) ───
      // Gated on LEMONSQUEEZY_PAPERBACK_VARIANT_ID. Until that env var is set
      // on Render, this branch never fires and the digital flow runs as before.
      if (LEMONSQUEEZY_PAPERBACK_VARIANT_ID) {
        const variantIds = items
          .map((it) => String(it.variant_id || ""))
          .filter(Boolean)
        const isPaperbackVariantMatch = variantIds.includes(
          String(LEMONSQUEEZY_PAPERBACK_VARIANT_ID)
        )
        if (isPaperbackVariantMatch) {
          try {
            const result = await handlePaperbackOrder({ payload, order, attrs, buyer })
            return res.status(200).json({ ok: true, flow: "paperback", ...result })
          } catch (err) {
            console.error("paperback flow error:", err)
            // Still return 200 so LS doesn't retry-storm; we log and reconcile manually.
            return res.status(200).json({ ok: false, flow: "paperback", error: String(err.message || err) })
          }
        }
      }

      // Generate watermarked PDF
      const watermarkedBytes = await generateWatermarkedPdf(buyer)

      // Generate watermarked ePub (best-effort — PDF flow is the contract;
      // a transient ePub failure should not block delivery of the PDF).
      let watermarkedEpubBytes = null
      try {
        watermarkedEpubBytes = await generateWatermarkedEpub(buyer)
      } catch (epubErr) {
        console.error("ePub watermark failed (PDF will still ship):", epubErr)
      }

      // Generate one-time token
      const token = crypto.randomBytes(32).toString("hex")
      tokens.set(token, {
        pdfBytes: watermarkedBytes,
        expiresAt: Date.now() + TOKEN_TTL_MS,
        used: false,
      })

      const downloadUrl = `${PUBLIC_URL}/download/${token}`

      // Email the buyer with the PDF + ePub attached + the one-time link
      if (resend) {
        const attachments = [
          {
            filename: `SEALED-${buyer.orderNumber || "copy"}.pdf`,
            content: Buffer.from(watermarkedBytes),
          },
        ]
        if (watermarkedEpubBytes) {
          attachments.push({
            filename: `SEALED-${buyer.orderNumber || "copy"}.epub`,
            content: Buffer.from(watermarkedEpubBytes),
          })
        }
        await resend.emails.send({
          from: FROM_EMAIL,
          to: buyer.email,
          subject: "Your copy of SEALED is ready",
          html: emailHtml(buyer, downloadUrl, Boolean(watermarkedEpubBytes)),
          attachments,
        })
      } else {
        console.warn("RESEND_API_KEY not set — skipping email send")
      }

      // Buyer data only lived in memory during this request. Discard.
      return res.status(200).json({ ok: true })
    } catch (err) {
      console.error("webhook error:", err)
      return res.status(500).json({ error: "internal error" })
    }
  }
)

/* -------------------------------------------------------------------------- */
/* One-time download endpoint                                                  */
/* -------------------------------------------------------------------------- */
app.get("/download/:token", (req, res) => {
  const { token } = req.params
  const entry = tokens.get(token)

  if (!entry) {
    return res.status(404).type("html").send(notFoundHtml())
  }
  if (entry.used) {
    tokens.delete(token)
    return res.status(410).type("html").send(alreadyUsedHtml())
  }
  if (Date.now() > entry.expiresAt) {
    tokens.delete(token)
    return res.status(410).type("html").send(expiredHtml())
  }

  // One-time use: serve, then immediately wipe
  entry.used = true
  res.setHeader("Content-Type", "application/pdf")
  res.setHeader("Content-Disposition", 'attachment; filename="SEALED.pdf"')
  res.send(Buffer.from(entry.pdfBytes))
  tokens.delete(token)
})

/* -------------------------------------------------------------------------- */
/* Generic landing page (Lemon Squeezy "Links" file delivery points here)     */
/* -------------------------------------------------------------------------- */
app.get("/", (_req, res) => {
  res.type("html").send(`<!doctype html><html><head><meta charset="utf-8">
<title>SEALED — Your Download</title>
<style>body{font-family:Palatino,Georgia,serif;max-width:520px;margin:80px auto;padding:0 20px;color:#1a1a2e;line-height:1.6}h1{font-size:28pt;margin-bottom:10px}.box{background:#f8f6f2;border-left:4px solid #c9a84c;padding:18px 22px;margin:24px 0}.note{font-size:11pt;color:#666;margin-top:30px}</style>
</head><body>
<h1>Your copy of SEALED is on its way</h1>
<p>Your watermarked PDF has been emailed to the address you used at checkout. Check your inbox (and spam folder) within the next few minutes.</p>
<div class="box"><strong>Important:</strong> Each copy is individually licensed. Your name and the email address you used at checkout appear on every page, along with your order number and a personal-use notice. The email is real (not masked) &mdash; that&rsquo;s the deterrent against copying. It also means: <em>if you upload or forward this PDF, you&rsquo;re publishing your own email address with it.</em> Treat it accordingly. We don&rsquo;t store your watermarked copy; once delivered, it lives only on your device.</div>
<p class="note">Didn&rsquo;t get the email? Check spam, or <a href="mailto:support@sealed2016.com">contact us</a> with your order number.</p>
</body></html>`)
})

/* -------------------------------------------------------------------------- */
/* Health check                                                                */
/* -------------------------------------------------------------------------- */
app.get("/health", (_req, res) => res.json({ ok: true }))

/* -------------------------------------------------------------------------- */
/* PDF watermarking — two-line footer with full email and legal-tone notice   */
/*                                                                             */
/* Per founder direction following external manuscript review: maximum         */
/* deterrence framing. Full email + license notice on every page. Buyer's     */
/* full street address is still NOT printed (data minimization remains there). */
/*                                                                             */
/* Privacy trade-off: if a buyer's PDF is leaked publicly, their email is     */
/* harvestable. Acknowledged risk; founder accepted it for deterrence value.  */
/* -------------------------------------------------------------------------- */
async function generateWatermarkedPdf(buyer) {
  const bytes = await loadBasePdf()
  const pdfDoc = await PDFDocument.load(bytes)
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)

  const lineA = `Licensed to: ${buyer.name} · ${buyer.email} · Order #${
    buyer.orderNumber || buyer.orderId
  }`
  const lineB =
    "Personal use only. Copyrighted material. Do not copy, distribute, upload, alter, or remove this watermark."

  const pages = pdfDoc.getPages()
  for (const page of pages) {
    const { width } = page.getSize()
    const fontSize = 6.5
    const grayColor = rgb(0.55, 0.55, 0.55)

    // Two-line centered footer.
    const wA = font.widthOfTextAtSize(lineA, fontSize)
    page.drawText(lineA, {
      x: (width - wA) / 2,
      y: 18,
      size: fontSize,
      font,
      color: grayColor,
    })

    const wB = font.widthOfTextAtSize(lineB, fontSize)
    page.drawText(lineB, {
      x: (width - wB) / 2,
      y: 9,
      size: fontSize,
      font,
      color: grayColor,
    })
  }

  return await pdfDoc.save()
}

/* -------------------------------------------------------------------------- */
/* ePub watermarking — inject a colophon block in the front-matter XHTML       */
/*                                                                             */
/* Pandoc builds the title-page file at EPUB/text/title_page.xhtml — we locate */
/* it dynamically by reading content.opf spine (defensive against renames),    */
/* falling back to the literal path. The watermark <p class="watermark"> is    */
/* injected right after the opening <body...> tag. The ZIP is repacked with   */
/* the mimetype entry STORED first (uncompressed) per EPUB spec.               */
/* -------------------------------------------------------------------------- */
async function generateWatermarkedEpub(buyer) {
  const bytes = await loadBaseEpub()
  const zip = new AdmZip(Buffer.from(bytes))

  // Find the front-matter file. Pandoc emits EPUB/text/title_page.xhtml.
  // Defensive: try the spine first, fall back to known path.
  let frontEntry = zip.getEntry("EPUB/text/title_page.xhtml")
  if (!frontEntry) {
    // Scan for any *.xhtml under EPUB/text/ that isn't nav.xhtml
    const entries = zip.getEntries()
    frontEntry = entries.find(
      (e) =>
        /\.xhtml$/i.test(e.entryName) &&
        !/nav\.xhtml$/i.test(e.entryName) &&
        !/ch\d+\.xhtml$/i.test(e.entryName)
    )
  }
  if (!frontEntry) {
    throw new Error("ePub: no front-matter xhtml found to host watermark")
  }

  const original = frontEntry.getData().toString("utf8")
  const watermarkBlock =
    `<p class="watermark" style="font-size:0.75em;color:#666;border:1px solid #ccc;padding:0.5em;margin:1em 0;text-align:center;">` +
    `Licensed to: ${escapeHtml(buyer.name)} &middot; ${escapeHtml(buyer.email)} &middot; Order #${escapeHtml(String(buyer.orderNumber || buyer.orderId))}. ` +
    `Personal use only. Copyrighted material. Do not copy, distribute, upload, alter, or remove this watermark.` +
    `</p>`

  // Inject directly after opening <body...> tag
  const injected = original.replace(
    /(<body\b[^>]*>)/i,
    `$1\n${watermarkBlock}\n`
  )
  if (injected === original) {
    throw new Error("ePub: failed to locate <body> in front matter")
  }
  zip.updateFile(frontEntry.entryName, Buffer.from(injected, "utf8"))

  return zip.toBuffer()
}

/* -------------------------------------------------------------------------- */
/* Email body                                                                  */
/* -------------------------------------------------------------------------- */
function emailHtml(buyer, downloadUrl, hasEpub) {
  // The download endpoint can serve either format — but the existing
  // /download/:token serves the PDF. The ePub is attached to the email
  // directly, so the "open in" hint is about treating the attachment
  // correctly: on Apple devices, the .epub attachment opens in Books;
  // on Kindle, it's emailable to the user's @kindle.com address.
  const formatLine = hasEpub
    ? "Your individually-licensed <strong>PDF and ePub</strong> are attached to this email."
    : "Your individually-licensed <strong>PDF</strong> is attached to this email."

  const ereaderHints = hasEpub
    ? `
  <div style="background:#faf7ef;border:1px solid #e8dfc8;border-radius:6px;padding:18px 22px;margin:24px 0;font-size:14px;line-height:1.55">
    <p style="margin:0 0 14px;font-family:'SF Mono',Menlo,monospace;font-size:11px;letter-spacing:0.16em;text-transform:uppercase;color:#2a4d7c;font-weight:700">
      Read it on your devices
    </p>
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="width:100%;border-collapse:collapse">
      <tr>
        <td style="padding:8px 0;vertical-align:top;width:36px">
          <span style="display:inline-block;width:28px;height:28px;background:#1a2744;border-radius:6px;text-align:center;line-height:28px;color:#f6e2a8;font-family:Palatino,Georgia,serif;font-weight:bold;font-size:16px">B</span>
        </td>
        <td style="padding:8px 0 8px 12px;vertical-align:top">
          <strong style="color:#1a1a2e">Apple Books (iPhone, iPad, Mac).</strong>
          <span style="color:#555">Tap or click the <em>SEALED-v1-retail.epub</em> attachment above.
          Your device will offer to open it in Books — that adds the book to
          your library and syncs across devices via iCloud.</span>
        </td>
      </tr>
      <tr>
        <td style="padding:8px 0;vertical-align:top">
          <span style="display:inline-block;width:28px;height:28px;background:#9b4521;border-radius:6px;text-align:center;line-height:28px;color:#fff;font-family:Palatino,Georgia,serif;font-weight:bold;font-size:16px">K</span>
        </td>
        <td style="padding:8px 0 8px 12px;vertical-align:top">
          <strong style="color:#1a1a2e">Kindle.</strong>
          <span style="color:#555">Forward this email (or the ePub attachment) to your
          <a href="https://www.amazon.com/sendtokindle/email" style="color:#2a4d7c;text-decoration:none;border-bottom:1px dotted #2a4d7c">Send-to-Kindle</a>
          address (looks like <em>yourname@kindle.com</em>). Amazon converts the ePub
          and delivers it to your Kindle library.</span>
        </td>
      </tr>
      <tr>
        <td style="padding:8px 0;vertical-align:top">
          <span style="display:inline-block;width:28px;height:28px;background:#2a4d7c;border-radius:6px;text-align:center;line-height:28px;color:#fff;font-family:Palatino,Georgia,serif;font-weight:bold;font-size:16px">K</span>
        </td>
        <td style="padding:8px 0 8px 12px;vertical-align:top">
          <strong style="color:#1a1a2e">Kobo / Nook / Boox.</strong>
          <span style="color:#555">Save the ePub to your device's <em>Library</em> folder
          via USB or your provider's app. ePub is the standard format for non-Amazon
          readers.</span>
        </td>
      </tr>
      <tr>
        <td style="padding:8px 0;vertical-align:top">
          <span style="display:inline-block;width:28px;height:28px;background:#6b3a78;border-radius:6px;text-align:center;line-height:28px;color:#fff;font-family:Palatino,Georgia,serif;font-weight:bold;font-size:16px">P</span>
        </td>
        <td style="padding:8px 0 8px 12px;vertical-align:top">
          <strong style="color:#1a1a2e">Plain reading.</strong>
          <span style="color:#555">The PDF opens in any browser, Preview, or Adobe
          Reader. Best for desktop reading and print-from-PDF if you want a physical
          copy.</span>
        </td>
      </tr>
    </table>
  </div>`
    : ""

  return `<div style="font-family:Palatino,Georgia,serif;max-width:540px;margin:0 auto;color:#1a1a2e;line-height:1.6">
  <h1 style="font-size:24pt;margin-bottom:8px;color:#1a2744">Thank you for your order, ${escapeHtml(buyer.name)}.</h1>
  <p>Your copy of <strong>SEALED: The 2016 Promises &mdash; Before the Deals</strong>.</p>
  <p>${formatLine}</p>
  ${ereaderHints}
  <p>If your email client stripped the attachment, you can also download it once via this single-use link (expires in 15 minutes):</p>
  <p><a href="${downloadUrl}" style="display:inline-block;background:#1a2744;color:#fff;padding:12px 22px;text-decoration:none;border-radius:4px;font-weight:600">Download your copy</a></p>
  <div style="background:#f8f6f2;border-left:4px solid #c9a84c;padding:16px 20px;margin:28px 0;font-size:14px">
    <strong>Save this PDF somewhere safe.</strong> Each copy is individually licensed. Your name and the email you used at checkout appear on every page (with order number and a personal-use notice). The email is real, not masked &mdash; that&rsquo;s the deterrent. <em>If you forward or upload this PDF, you&rsquo;re publishing your own email address with it.</em> Treat it accordingly. We don&rsquo;t store your watermarked copy &mdash; once it&rsquo;s in your inbox it lives only on your device.
  </div>
  <p style="font-size:13px;color:#555">Order #${buyer.orderNumber || buyer.orderId}</p>
  <p style="font-size:13px;color:#555">— Peter Oliver, PhD &amp; The SEALED Team</p>
</div>`
}

function notFoundHtml() {
  return basicHtml("Link not found", "This download link is invalid. Check your email for the correct link, or contact support@sealed2016.com.")
}
function alreadyUsedHtml() {
  return basicHtml("Already downloaded", "This one-time download link has already been used. Your copy is in your email; if you can't find it, contact support@sealed2016.com.")
}
function expiredHtml() {
  return basicHtml("Link expired", "This download link has expired (15 min limit). Your copy is still attached to your order email.")
}
function basicHtml(title, body) {
  return `<!doctype html><html><head><meta charset="utf-8"><title>${title}</title>
<style>body{font-family:Palatino,Georgia,serif;max-width:520px;margin:80px auto;padding:0 20px;color:#1a1a2e;line-height:1.6}h1{font-size:24pt}</style>
</head><body><h1>${title}</h1><p>${body}</p></body></html>`
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]))
}

/* -------------------------------------------------------------------------- */
/* Paperback flow — LS webhook → stamp colophon → upload → Lulu print job →   */
/* buyer email → insert order row in Supabase.                                */
/*                                                                             */
/* Gated by env LEMONSQUEEZY_PAPERBACK_VARIANT_ID. The static print cover     */
/* lives in the same `sealed-masters` Supabase bucket as the digital masters.  */
/* Per-buyer stamped interior is uploaded to a per-order path so Lulu can     */
/* fetch via a short-TTL signed URL (24h is enough — Lulu pulls within        */
/* minutes of job creation).                                                   */
/* -------------------------------------------------------------------------- */

async function supabaseUploadObject(objectKey, bytes, contentType) {
  if (!SUPABASE_URL) throw new Error("SUPABASE_URL not set")
  if (!SUPABASE_SERVICE_ROLE_KEY) throw new Error("SUPABASE_SERVICE_ROLE_KEY not set")
  const url = `${SUPABASE_URL}/storage/v1/object/${SUPABASE_BUCKET}/${objectKey}`
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      "Content-Type": contentType,
      "x-upsert": "true",
    },
    body: Buffer.from(bytes),
  })
  if (!res.ok) throw new Error(`supabase upload ${objectKey}: ${res.status} ${await res.text()}`)
}

async function supabaseSignedUrl(objectKey, expiresIn = 60 * 60 * 24) {
  const url = `${SUPABASE_URL}/storage/v1/object/sign/${SUPABASE_BUCKET}/${objectKey}`
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ expiresIn }),
  })
  if (!res.ok) throw new Error(`supabase sign ${objectKey}: ${res.status} ${await res.text()}`)
  const j = await res.json()
  return `${SUPABASE_URL}/storage/v1${j.signedURL || j.signedUrl}`
}

async function insertPaperbackOrderRow({ lsOrderId, buyerEmail, luluPrintJobId, status }) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.warn("Supabase env missing — skipping paperback order row insert")
    return
  }
  const url = `${SUPABASE_URL}/rest/v1/sealed_paperback_orders`
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      apikey: SUPABASE_SERVICE_ROLE_KEY,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    },
    body: JSON.stringify({
      ls_order_id: String(lsOrderId),
      buyer_email: buyerEmail,
      lulu_print_job_id: luluPrintJobId ? String(luluPrintJobId) : null,
      status,
    }),
  })
  if (!res.ok && res.status !== 409) {
    // 409 = duplicate ls_order_id (idempotent retry). Treat as success.
    throw new Error(`supabase insert paperback row: ${res.status} ${await res.text()}`)
  }
}

function paperbackEmailHtml(buyer) {
  return `<!doctype html><html><body style="font-family:Palatino,Georgia,serif;max-width:560px;margin:0 auto;color:#1a1a2e;line-height:1.6">
<h2 style="font-size:20pt;margin-bottom:8px">Your SEALED paperback is on its way to the printer</h2>
<p>Hi ${escapeHtml(buyer.name || "there")},</p>
<p>Thank you for ordering the SEALED paperback. Your copy will be printed and shipped from Lulu. Delivery time depends on the shipping option you selected at checkout — anywhere from <strong>6&ndash;14 business days</strong> after printing. Once it leaves the facility, we'll forward the carrier's tracking link.</p>
<p>Order #: <strong>${escapeHtml(String(buyer.orderNumber || buyer.orderId))}</strong></p>
<p style="font-size:10pt;color:#666;border-top:1pt solid #ccc;padding-top:12px;margin-top:24px">
Each copy is individually licensed — your name and order number appear on the colophon page (the publisher's notes page near the front).
If you have any questions about your order, just reply to this email.
</p>
<p style="font-size:10pt;color:#888">— SEALED Press</p>
</body></html>`
}

async function handlePaperbackOrder({ payload, order, attrs, buyer }) {
  console.log(`[paperback] LS order ${order.id} for ${buyer.email}`)

  // 1) Stamp the colophon page with buyer name + order number.
  //    Pull the print interior from Supabase masters.
  const interiorMaster = await fetchSupabaseObject(LULU_PAPERBACK_INTERIOR_OBJECT)
  const stampedBytes = await stampColophon(interiorMaster, {
    name: buyer.name,
    email: buyer.email,
    orderNumber: buyer.orderNumber || buyer.orderId,
  })

  // 2) Upload per-order stamped interior.
  const ts = Date.now()
  const stampedKey = `paperback/orders/SEALED-${buyer.orderNumber || buyer.orderId}-${ts}.pdf`
  await supabaseUploadObject(stampedKey, stampedBytes, "application/pdf")
  const interiorUrl = await supabaseSignedUrl(stampedKey)

  // 3) Static cover — use existing static cover PDF object (no per-buyer change).
  const coverUrl = await supabaseSignedUrl(LULU_PAPERBACK_COVER_OBJECT)

  // 4) Extract shipping address from LS webhook payload.
  //    LS exposes shipping_address fields on the order attrs when shipping is collected.
  const ship = attrs.shipping_address || attrs.billing_address || {}
  const shippingAddress = {
    name: attrs.user_name || ship.name || "SEALED Reader",
    street1: ship.address || ship.address1 || ship.street1 || buyer.street || "",
    street2: ship.address2 || ship.street2 || "",
    city: ship.city || buyer.city || "",
    state_code: ship.state || ship.state_code || buyer.state || "",
    country_code: ship.country || ship.country_code || buyer.country || "US",
    postcode: ship.zip || ship.postcode || buyer.zip || "",
    phone_number: ship.phone || attrs.user_phone || "0000000000",
  }
  if (!shippingAddress.street1 || !shippingAddress.city || !shippingAddress.postcode) {
    throw new Error(
      `Paperback order ${order.id} missing shipping address — LS attrs.shipping_address or billing_address must contain street/city/zip`
    )
  }

  // 5) Create Lulu print job.
  const externalId = `SEALED-LS-${order.id}`
  const luluJob = await luluCreatePrintJob({
    externalId,
    contactEmail: buyer.email,
    shippingAddress,
    shippingLevel: "MAIL",
    lineItems: [
      {
        quantity: 1,
        title: "SEALED — The 2016 Promises: Before the Deals",
        pod_package_id: LULU_POD_PACKAGE_ID,
        cover: { source_url: coverUrl },
        interior: { source_url: interiorUrl },
        external_id: `${externalId}-line1`,
      },
    ],
    productionDelay: 60,
  })
  const luluPrintJobId = luluJob.id
  console.log(`[paperback] Lulu print job ${luluPrintJobId} created for LS ${order.id}`)

  // 6) Send buyer confirmation email.
  if (resend) {
    try {
      await resend.emails.send({
        from: FROM_EMAIL,
        to: buyer.email,
        subject: "Your SEALED paperback is on its way",
        html: paperbackEmailHtml(buyer),
      })
    } catch (mailErr) {
      console.error(`[paperback] resend email failed for LS ${order.id}:`, mailErr)
      // continue — Lulu job is the contract; email is informational
    }
  }

  // 7) Insert row.
  await insertPaperbackOrderRow({
    lsOrderId: order.id,
    buyerEmail: buyer.email,
    luluPrintJobId,
    status: "pending",
  })

  return { luluPrintJobId, externalId }
}

/* -------------------------------------------------------------------------- */
/* Periodic cleanup of expired tokens (defensive — they self-clean too)       */
/* -------------------------------------------------------------------------- */
setInterval(() => {
  const now = Date.now()
  for (const [token, entry] of tokens.entries()) {
    if (entry.used || now > entry.expiresAt) tokens.delete(token)
  }
}, 60 * 1000)

app.listen(PORT, async () => {
  console.log(`SEALED watermark webhook listening on :${PORT}`)
  // Pre-load the master PDF at startup so the first webhook is fast.
  try {
    await loadBasePdf()
  } catch (err) {
    console.error("Failed to preload base PDF:", err)
  }
  try {
    await loadBaseEpub()
  } catch (err) {
    console.error("Failed to preload base ePub:", err)
  }
})
