/**
 * Lulu Direct API client (Node ESM).
 *
 * Exposes:
 *   - getAccessToken()             — OAuth client_credentials, cached
 *   - calculatePrintCost(opts)     — POST /print-job-cost-calculations/
 *   - createPrintJob(opts)         — POST /print-jobs/
 *   - getPrintJob(id)              — GET  /print-jobs/{id}/
 *   - getCoverDimensions(opts)     — POST /cover-dimensions/ (spine width)
 *
 * Env (read from /Applications/DrAntoniou Projects/AgentCompanies/.env):
 *   LULU_BASE_URL    — e.g. https://api.lulu.com
 *   LULU_BASIC_AUTH  — base64 of "client_key:client_secret"
 *
 * NEVER logs the bearer token or the basic auth blob.
 */

const BASE_URL = process.env.LULU_BASE_URL || "https://api.lulu.com"
const BASIC_AUTH = process.env.LULU_BASIC_AUTH

let cachedToken = null
let cachedTokenExpiresAt = 0

class LuluApiError extends Error {
  constructor(message, { status, body, path } = {}) {
    super(message)
    this.name = "LuluApiError"
    this.status = status
    this.body = body
    this.path = path
  }
}

async function readBodySafely(res) {
  const ct = res.headers.get("content-type") || ""
  try {
    if (ct.includes("application/json")) return await res.json()
    return await res.text()
  } catch {
    return null
  }
}

export async function getAccessToken() {
  if (!BASIC_AUTH) throw new Error("LULU_BASIC_AUTH not set in env")
  const now = Date.now()
  if (cachedToken && now < cachedTokenExpiresAt) return cachedToken

  const tokenUrl = `${BASE_URL}/auth/realms/glasstree/protocol/openid-connect/token`
  const res = await fetch(tokenUrl, {
    method: "POST",
    headers: {
      Authorization: `Basic ${BASIC_AUTH}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  })
  if (!res.ok) {
    const body = await readBodySafely(res)
    // Do NOT include body if it might echo back the basic auth; Lulu doesn't, but be defensive.
    throw new LuluApiError("Lulu OAuth token request failed", {
      status: res.status,
      body,
      path: "/auth/realms/glasstree/protocol/openid-connect/token",
    })
  }
  const data = await res.json()
  const ttlSec = data.expires_in || 3600
  cachedToken = data.access_token
  // Refresh at 90% of TTL
  cachedTokenExpiresAt = now + Math.floor(ttlSec * 900)
  return cachedToken
}

async function authedFetch(pathname, { method = "GET", body, query } = {}) {
  const token = await getAccessToken()
  let url = `${BASE_URL}${pathname}`
  if (query && Object.keys(query).length) {
    const qs = new URLSearchParams(query).toString()
    url += `?${qs}`
  }
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: "application/json",
  }
  if (body !== undefined) headers["Content-Type"] = "application/json"
  const res = await fetch(url, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) {
    const responseBody = await readBodySafely(res)
    throw new LuluApiError(
      `Lulu ${method} ${pathname} failed: HTTP ${res.status}`,
      { status: res.status, body: responseBody, path: pathname }
    )
  }
  return await readBodySafely(res)
}

/**
 * Cost calculation for a print job WITHOUT placing the order.
 * Pass shippingAddress + lineItems. Pricing returned per Lulu Direct schema.
 *
 * @param {object} opts
 * @param {Array<{pod_package_id: string, page_count: number, quantity: number}>} opts.lineItems
 * @param {object} opts.shippingAddress  Lulu shipping_address payload
 * @param {string} [opts.shippingLevel]  e.g. "MAIL", "PRIORITY_MAIL", "GROUND_HD", "EXPEDITED", "EXPRESS"
 */
export async function calculatePrintCost({ lineItems, shippingAddress, shippingLevel = "MAIL" }) {
  if (!Array.isArray(lineItems) || lineItems.length === 0)
    throw new Error("calculatePrintCost: lineItems required")
  if (!shippingAddress) throw new Error("calculatePrintCost: shippingAddress required")
  return await authedFetch("/print-job-cost-calculations/", {
    method: "POST",
    body: {
      line_items: lineItems,
      shipping_address: shippingAddress,
      shipping_option: shippingLevel,
    },
  })
}

/**
 * Create a real print job. production_delay lets us cancel during the delay
 * window. external_id is the idempotency hook we use to dedupe re-tries.
 */
export async function createPrintJob({
  externalId,
  contactEmail,
  shippingAddress,
  shippingLevel = "MAIL",
  lineItems,
  productionDelay = 60,
}) {
  if (!externalId) throw new Error("createPrintJob: externalId required")
  if (!contactEmail) throw new Error("createPrintJob: contactEmail required")
  if (!shippingAddress) throw new Error("createPrintJob: shippingAddress required")
  if (!Array.isArray(lineItems) || lineItems.length === 0)
    throw new Error("createPrintJob: lineItems required")
  return await authedFetch("/print-jobs/", {
    method: "POST",
    body: {
      external_id: externalId,
      contact_email: contactEmail,
      shipping_address: shippingAddress,
      shipping_level: shippingLevel,
      line_items: lineItems,
      production_delay: productionDelay,
    },
  })
}

export async function getPrintJob(id) {
  if (!id) throw new Error("getPrintJob: id required")
  return await authedFetch(`/print-jobs/${id}/`)
}

/**
 * Cover dimensions — returns spine + total cover width/height for a given
 * pod_package_id + interior_page_count + page_thickness.
 */
export async function getCoverDimensions({ podPackageId, pageCount, unit = "inch" }) {
  if (!podPackageId) throw new Error("getCoverDimensions: podPackageId required")
  if (!pageCount) throw new Error("getCoverDimensions: pageCount required")
  return await authedFetch("/cover-dimensions/", {
    method: "POST",
    body: {
      pod_package_id: podPackageId,
      interior_page_count: pageCount,
      unit,
    },
  })
}

export { LuluApiError }
