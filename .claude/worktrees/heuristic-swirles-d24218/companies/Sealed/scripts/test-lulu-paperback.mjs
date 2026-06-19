/**
 * SEALED — End-to-end Lulu paperback proof print.
 *
 * Pipeline:
 *   1. Build interior + cover PDFs via the build scripts
 *   2. Upload both to Supabase `sealed-masters` bucket
 *   3. Create signed (public-read) URLs Lulu can fetch
 *   4. Cost-preview to 734 Stanhope Ln, Matthews NC 28105 — log JSON
 *   5. Create ONE real print job, production_delay: 60s,
 *      external_id `SEALED-WS13-PROOF-{ts}`, contact alex@antoniou.net
 *   6. Poll status every 30s for 5 min — log transitions
 *   7. Save full transcript to eng/WS13-paperback-proof-print.txt
 *
 * Usage:
 *   node --env-file=../../.env scripts/test-lulu-paperback.mjs
 */

import fs from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { spawnSync } from "node:child_process"
import {
  calculatePrintCost,
  createPrintJob,
  getPrintJob,
} from "../lib/lulu-client.mjs"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, "..")
const ARTIFACTS = path.join(ROOT, "artifacts")
const ENG = path.join(ROOT, "eng")

const INTERIOR_PDF = path.join(ARTIFACTS, "SEALED-v1-print.pdf")
const COVER_PDF = path.join(ARTIFACTS, "SEALED-v1-print-cover.pdf")
const TRANSCRIPT = path.join(ENG, "WS13-paperback-proof-print.txt")

const POD_PACKAGE_ID = "0600X0900BWSTDPB080CW444GXX"

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const BUCKET = "sealed-masters"

const SHIPPING_ADDRESS = {
  name: "Alex Antoniou",
  street1: "734 Stanhope Ln",
  city: "Matthews",
  state_code: "NC",
  country_code: "US",
  postcode: "28105",
  phone_number: "+15555555555",
}

const transcriptLines = []
function log(line, alsoConsole = true) {
  const stamp = new Date().toISOString()
  const msg = typeof line === "string" ? line : JSON.stringify(line, null, 2)
  transcriptLines.push(`[${stamp}] ${msg}`)
  if (alsoConsole) console.log(msg)
}

async function runScript(scriptName) {
  log(`→ Running ${scriptName}...`)
  const r = spawnSync("node", [`scripts/${scriptName}`], {
    stdio: "inherit",
    cwd: ROOT,
    env: process.env,
  })
  if (r.status !== 0) throw new Error(`${scriptName} failed with exit ${r.status}`)
}

async function exists(p) { try { await fs.access(p); return true } catch { return false } }

async function uploadToSupabase(localPath, objectKey, contentType) {
  if (!SUPABASE_URL || !SUPABASE_KEY) throw new Error("SUPABASE env not set")
  const data = await fs.readFile(localPath)
  const url = `${SUPABASE_URL}/storage/v1/object/${BUCKET}/${objectKey}`
  // Use upsert via x-upsert: true so re-runs overwrite.
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${SUPABASE_KEY}`,
      apikey: SUPABASE_KEY,
      "Content-Type": contentType,
      "x-upsert": "true",
    },
    body: data,
  })
  if (!res.ok) {
    const body = await res.text()
    // Some Supabase configs reject re-POST and require PUT; try PUT.
    if (res.status === 409 || res.status === 400) {
      const r2 = await fetch(url, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${SUPABASE_KEY}`,
          apikey: SUPABASE_KEY,
          "Content-Type": contentType,
          "x-upsert": "true",
        },
        body: data,
      })
      if (!r2.ok) throw new Error(`Supabase upload PUT ${objectKey}: ${r2.status} ${await r2.text()}`)
    } else {
      throw new Error(`Supabase upload ${objectKey}: ${res.status} ${body}`)
    }
  }
  log(`  uploaded ${objectKey} (${(data.length / 1024 / 1024).toFixed(2)} MB)`)
}

async function signedUrl(objectKey, expiresIn = 60 * 60 * 24) {
  // Do NOT encodeURIComponent the path here — Supabase's sign endpoint
  // expects path segments, not %2F-encoded slashes (and signs the literal
  // path). Encode only the basename if it contained spaces, etc.
  const url = `${SUPABASE_URL}/storage/v1/object/sign/${BUCKET}/${objectKey}`
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${SUPABASE_KEY}`,
      apikey: SUPABASE_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ expiresIn }),
  })
  if (!res.ok) throw new Error(`Supabase sign ${objectKey}: ${res.status} ${await res.text()}`)
  const j = await res.json()
  return `${SUPABASE_URL}/storage/v1${j.signedURL || j.signedUrl}`
}

async function main() {
  await fs.mkdir(ENG, { recursive: true })

  // 1) Build PDFs (skip if SKIP_BUILD=1, useful for retries)
  if (process.env.SKIP_BUILD !== "1") {
    await runScript("build-print-pdf.mjs")
    await runScript("build-print-cover.mjs")
  } else {
    log("SKIP_BUILD=1 — using existing artifacts/SEALED-v1-print{,-cover}.pdf")
  }

  // confirm files
  const intStat = await fs.stat(INTERIOR_PDF)
  const covStat = await fs.stat(COVER_PDF)
  log(`Interior PDF: ${INTERIOR_PDF} (${(intStat.size / 1024 / 1024).toFixed(2)} MB)`)
  log(`Cover PDF:    ${COVER_PDF}    (${(covStat.size / 1024 / 1024).toFixed(2)} MB)`)

  // 2) Upload to Supabase
  const ts = Date.now()
  const intKey = `paperback/SEALED-v1-print-${ts}.pdf`
  const covKey = `paperback/SEALED-v1-print-cover-${ts}.pdf`
  await uploadToSupabase(INTERIOR_PDF, intKey, "application/pdf")
  await uploadToSupabase(COVER_PDF, covKey, "application/pdf")

  // 3) Signed URLs
  const intUrl = await signedUrl(intKey)
  const covUrl = await signedUrl(covKey)
  log(`Interior signed URL: ${intUrl.slice(0, 80)}...`)
  log(`Cover    signed URL: ${covUrl.slice(0, 80)}...`)

  // 4) Cost preview
  log("\n--- Cost preview ---")
  const cost = await calculatePrintCost({
    lineItems: [{ pod_package_id: POD_PACKAGE_ID, page_count: 140, quantity: 1 }],
    shippingAddress: SHIPPING_ADDRESS,
    shippingLevel: "MAIL",
  })
  log(cost)

  // 5) Create real print job
  const externalId = `SEALED-WS13-PROOF-${ts}`
  log(`\n--- Creating print job (external_id=${externalId}) ---`)
  const job = await createPrintJob({
    externalId,
    contactEmail: "alex@antoniou.net",
    shippingAddress: SHIPPING_ADDRESS,
    shippingLevel: "MAIL",
    // NOTE: Do NOT send page_count to /print-jobs/ — Lulu derives it from the
    // fetched interior PDF and returns HTTP 500 if it's supplied client-side.
    // (Cost-calc DOES require page_count; print-jobs forbids it. Painful asymmetry.)
    lineItems: [
      {
        quantity: 1,
        title: "SEALED — The 2016 Promises: Before the Deals",
        pod_package_id: POD_PACKAGE_ID,
        cover: { source_url: covUrl },
        interior: { source_url: intUrl },
        external_id: `${externalId}-line1`,
      },
    ],
    productionDelay: 60,
  })
  log(job)
  const printJobId = job.id
  log(`✓ Print job created: id=${printJobId}`)

  // 6) Poll for 5 minutes, every 30s
  log("\n--- Polling status (every 30s, 5 min cap) ---")
  let lastStatus = job.status?.name || "UNKNOWN"
  log(`t+0s   status=${lastStatus}`)
  const POLL_INTERVAL = 30_000
  const POLL_END = Date.now() + 5 * 60_000
  while (Date.now() < POLL_END) {
    await new Promise((r) => setTimeout(r, POLL_INTERVAL))
    try {
      const cur = await getPrintJob(printJobId)
      const status = cur.status?.name || "UNKNOWN"
      const tElapsed = Math.round((Date.now() - (POLL_END - 5 * 60_000)) / 1000)
      if (status !== lastStatus) {
        log(`t+${tElapsed}s  status: ${lastStatus} → ${status}`)
        log(cur.status || {})
        lastStatus = status
      } else {
        log(`t+${tElapsed}s  status=${status} (no change)`)
      }
    } catch (err) {
      log(`poll error: ${err.message}`)
    }
  }

  log(`\n--- Final ---`)
  log(`print_job_id: ${printJobId}`)
  log(`final_status: ${lastStatus}`)
  log(`external_id:  ${externalId}`)

  await fs.writeFile(TRANSCRIPT, transcriptLines.join("\n"), "utf-8")
  console.log(`\n✓ Transcript saved to ${TRANSCRIPT}`)
}

main().catch(async (err) => {
  log(`FATAL: ${err.stack || err.message}`)
  if (err.body) log(`error body: ${typeof err.body === 'string' ? err.body : JSON.stringify(err.body, null, 2)}`)
  try {
    await fs.mkdir(ENG, { recursive: true })
    await fs.writeFile(TRANSCRIPT, transcriptLines.join("\n"), "utf-8")
  } catch {}
  process.exitCode = 1
})
