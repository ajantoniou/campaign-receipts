#!/usr/bin/env node
/* ─── Atlanta Permits Daily Refresh ───
   Pulls the City of Atlanta permits CSV (~11.6MB, ~38K rows) from ArcGIS and
   upserts into cliros.permits_cache_atlanta.

   Run via Render cron at 04:00 UTC daily. Idempotent — uses upsert on
   permit_number primary key.
*/

import { createClient } from "@supabase/supabase-js";

const CSV_URL =
  "https://www.arcgis.com/sharing/content/items/655f985f43cc40b4bf2ab7bc73d2169b/data";

interface CsvRow {
  [key: string]: string;
}

function parseCSV(text: string): CsvRow[] {
  // Simple CSV parser that handles quoted fields with embedded commas.
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        field += ch;
      }
    } else {
      if (ch === '"') inQuotes = true;
      else if (ch === ",") {
        row.push(field);
        field = "";
      } else if (ch === "\n") {
        row.push(field);
        rows.push(row);
        row = [];
        field = "";
      } else if (ch === "\r") {
        // skip
      } else {
        field += ch;
      }
    }
  }
  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }
  if (rows.length === 0) return [];
  const headers = rows[0].map((h) => h.trim());
  return rows.slice(1).map((r) => {
    const o: CsvRow = {};
    headers.forEach((h, idx) => {
      o[h] = (r[idx] || "").trim();
    });
    return o;
  });
}

function pickField(row: CsvRow, ...names: string[]): string | undefined {
  for (const n of names) {
    if (n in row && row[n]) return row[n];
    // Case-insensitive fallback
    const key = Object.keys(row).find((k) => k.toLowerCase() === n.toLowerCase());
    if (key && row[key]) return row[key];
  }
  return undefined;
}

function parseDate(s?: string): string | null {
  if (!s) return null;
  // Try Y-M-D, M/D/Y, M/D/YY
  const m1 = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m1) return `${m1[1]}-${m1[2]}-${m1[3]}`;
  const m2 = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
  if (m2) {
    let yr = parseInt(m2[3]);
    if (yr < 100) yr += yr > 50 ? 1900 : 2000;
    return `${yr}-${m2[1].padStart(2, "0")}-${m2[2].padStart(2, "0")}`;
  }
  return null;
}

function parseNumber(s?: string): number | null {
  if (!s) return null;
  const n = parseFloat(s.replace(/[$,]/g, ""));
  return isNaN(n) ? null : n;
}

async function main() {
  console.log(`[permits-refresh] Downloading ${CSV_URL}`);
  const start = Date.now();
  const resp = await fetch(CSV_URL);
  if (!resp.ok) {
    throw new Error(`CSV fetch ${resp.status}: ${resp.statusText}`);
  }
  const text = await resp.text();
  console.log(`[permits-refresh] Downloaded ${(text.length / 1024 / 1024).toFixed(2)} MB in ${Date.now() - start}ms`);

  const rows = parseCSV(text);
  console.log(`[permits-refresh] Parsed ${rows.length} rows`);
  if (rows.length === 0) {
    console.warn("[permits-refresh] No rows parsed — bailing");
    return;
  }
  // Strip BOM from any header on first row
  const firstRow = rows[0];
  for (const k of Object.keys(firstRow)) {
    if (k.startsWith("﻿")) {
      const clean = k.replace("﻿", "");
      for (const r of rows) {
        r[clean] = r[k];
        delete r[k];
      }
    }
  }
  console.log(`[permits-refresh] Sample headers:`, Object.keys(rows[0]).slice(0, 14));

  const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { db: { schema: "cliros" }, auth: { persistSession: false } }
  );

  // City of Atlanta CSV exports a narrow schema: RECORD ID, ADDR FULL LINE#,
  // RECORD TYPE, DATE OPENED, RECORD STATUS, RECORD STATUS DATE, Zoning,
  // CDP Land use, DESCRIPTION, latitude, longitude. No contractor/valuation
  // in the public dataset. We use DATE OPENED as the "applied/issued" date
  // and RECORD STATUS DATE as the finaled-or-most-recent-status date.
  // Status values include: "Issued", "CO Issued" (finaled), "Routed for
  // Review", "In Review", "Cancelled", "Closed/Complete", "Expired".
  const FINALED_STATUSES = new Set(["CO Issued", "Closed/Complete", "Issued/Complete"]);
  const mapped = rows
    .map((r) => {
      const permitNumber = pickField(r, "RECORD ID");
      if (!permitNumber) return null;
      const status = pickField(r, "RECORD STATUS");
      const statusDate = parseDate(pickField(r, "RECORD STATUS DATE"));
      const openedDate = parseDate(pickField(r, "DATE OPENED"));
      // Derive finaled_date when status indicates completion
      const finaled = status && FINALED_STATUSES.has(status) ? statusDate : null;
      return {
        permit_number: permitNumber,
        permit_type: pickField(r, "RECORD TYPE"),
        status,
        description: pickField(r, "DESCRIPTION"),
        address: (pickField(r, "ADDR FULL LINE#") || "").toUpperCase(),
        applied_date: openedDate,
        issued_date: openedDate,  // Atlanta CSV doesn't separate applied vs issued
        finaled_date: finaled,
        declared_value: null,
        applicant: null,
        contractor: null,
        contractor_license: null,
        zoning: pickField(r, "Zoning"),
        latitude: parseNumber(pickField(r, "latitude")),
        longitude: parseNumber(pickField(r, "longitude")),
        raw_attributes: r,
      };
    })
    .filter((r): r is NonNullable<typeof r> => r !== null);

  console.log(`[permits-refresh] Mapped ${mapped.length} rows for upsert`);

  // Batch upsert (PostgREST limit ~1000 rows per call)
  const BATCH = 500;
  let upserted = 0;
  for (let i = 0; i < mapped.length; i += BATCH) {
    const chunk = mapped.slice(i, i + BATCH);
    const { error } = await db.from("permits_cache_atlanta").upsert(chunk, { onConflict: "permit_number" });
    if (error) {
      console.error(`[permits-refresh] batch ${i}-${i + BATCH} failed:`, error.message);
      break;
    }
    upserted += chunk.length;
    if (i % (BATCH * 10) === 0) {
      console.log(`[permits-refresh] upserted ${upserted}/${mapped.length}`);
    }
  }
  console.log(`[permits-refresh] DONE. Upserted ${upserted} rows in ${Date.now() - start}ms`);
}

main().catch((e) => {
  console.error("[permits-refresh] fatal:", e);
  process.exit(1);
});
