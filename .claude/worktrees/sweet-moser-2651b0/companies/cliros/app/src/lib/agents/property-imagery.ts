/* ─── Property visuals (Street View + Static Map) ───
   Fetches a front-of-house photo and a parcel-pin map for the address,
   caches them in Supabase Storage under properties/<id>/imagery/, and
   writes the storage paths back to cliros.properties.imagery JSONB.

   WHY a one-time fetch: Street View Static is $0.007/image and Maps Static
   is $0.002/image. We pay ~$0.009 per property the first time and serve
   signed URLs from storage thereafter. Re-runs of the same address skip
   the API call because dedupe in /api/search/queue updates the existing
   property row.

   WHY non-fatal: imagery is a quality nice-to-have. If the Google API is
   throttled or the address has no Street View coverage, the PDF renders
   without the hero strip rather than blocking the report.
*/

import { createClient } from "@supabase/supabase-js";
import { uploadDocument, getDocumentUrl } from "../document-storage";

const STREETVIEW_BASE = "https://maps.googleapis.com/maps/api/streetview";
const STATICMAP_BASE = "https://maps.googleapis.com/maps/api/staticmap";

function apiKey(): string | null {
  return (
    process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY ||
    process.env.CLIROS_GOOGLE_PLACES_API_KEY ||
    process.env.GOOGLE_MAPS_API_KEY ||
    null
  );
}

function adminCliros() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { db: { schema: "cliros" }, auth: { persistSession: false } }
  );
}

export interface PropertyImagery {
  streetviewStoragePath?: string;
  mapStoragePath?: string;
  capturedAt?: string;
  streetviewMissing?: boolean;
  mapMissing?: boolean;
}

interface FetchOk {
  ok: true;
  buf: Buffer;
}
interface FetchSkip {
  ok: false;
  reason: string;
}

async function fetchStreetView(address: string, key: string): Promise<FetchOk | FetchSkip> {
  // Metadata endpoint tells us if Google has imagery without burning a quota
  // unit on a fallback "no imagery" pin. Free for the metadata call.
  const meta = new URL(STREETVIEW_BASE + "/metadata");
  meta.searchParams.set("location", address);
  meta.searchParams.set("key", key);
  try {
    const metaResp = await fetch(meta.toString());
    if (!metaResp.ok) {
      return { ok: false, reason: `metadata HTTP ${metaResp.status}` };
    }
    const metaJson = (await metaResp.json()) as { status?: string };
    if (metaJson.status !== "OK") {
      return { ok: false, reason: `metadata status=${metaJson.status || "UNKNOWN"}` };
    }
  } catch (err) {
    return {
      ok: false,
      reason: `metadata fetch failed: ${err instanceof Error ? err.message : String(err)}`,
    };
  }

  const img = new URL(STREETVIEW_BASE);
  img.searchParams.set("size", "640x400");
  img.searchParams.set("location", address);
  img.searchParams.set("fov", "75");
  img.searchParams.set("pitch", "0");
  img.searchParams.set("source", "outdoor");
  img.searchParams.set("return_error_code", "true");
  img.searchParams.set("key", key);
  try {
    const resp = await fetch(img.toString());
    if (!resp.ok) {
      return { ok: false, reason: `streetview HTTP ${resp.status}` };
    }
    const buf = Buffer.from(await resp.arrayBuffer());
    if (buf.length < 1000) {
      return { ok: false, reason: `streetview payload too small (${buf.length} bytes)` };
    }
    return { ok: true, buf };
  } catch (err) {
    return {
      ok: false,
      reason: `streetview fetch failed: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

async function fetchStaticMap(address: string, key: string): Promise<FetchOk | FetchSkip> {
  const img = new URL(STATICMAP_BASE);
  img.searchParams.set("size", "640x400");
  img.searchParams.set("zoom", "18");
  img.searchParams.set("maptype", "satellite");
  img.searchParams.set("center", address);
  img.searchParams.append("markers", `color:0xA24E3C|size:mid|${address}`);
  img.searchParams.set("key", key);
  try {
    const resp = await fetch(img.toString());
    if (!resp.ok) {
      return { ok: false, reason: `staticmap HTTP ${resp.status}` };
    }
    const buf = Buffer.from(await resp.arrayBuffer());
    if (buf.length < 1000) {
      return { ok: false, reason: `staticmap payload too small (${buf.length} bytes)` };
    }
    return { ok: true, buf };
  } catch (err) {
    return {
      ok: false,
      reason: `staticmap fetch failed: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

/** Fetch + cache property imagery. Idempotent — returns the existing record
    if the property already has imagery captured. */
export async function ensurePropertyImagery(
  propertyId: string,
  address: string
): Promise<PropertyImagery | null> {
  const db = adminCliros();
  const { data: existing } = await db
    .from("properties")
    .select("imagery")
    .eq("id", propertyId)
    .maybeSingle();
  if (existing?.imagery) {
    return existing.imagery as PropertyImagery;
  }

  const key = apiKey();
  if (!key) {
    console.warn("[property-imagery] no Google API key configured; skipping.");
    return null;
  }

  // The upload helper writes into the report-documents bucket because that's
  // the only one provisioned for the project. We use property-scoped folders
  // (no report_id collision) and store the path in properties.imagery.
  const folderReportId = `property-${propertyId}`;
  const imagery: PropertyImagery = {
    capturedAt: new Date().toISOString(),
  };

  const svResult = await fetchStreetView(address, key);
  if (svResult.ok) {
    try {
      const stored = await uploadDocument(
        folderReportId,
        "imagery",
        "streetview.jpg",
        svResult.buf,
        "image/jpeg",
        { source: "google-streetview-static", address }
      );
      imagery.streetviewStoragePath = stored.storagePath;
    } catch (err) {
      console.warn("[property-imagery] streetview upload failed:", err);
      imagery.streetviewMissing = true;
    }
  } else {
    console.log(`[property-imagery] streetview skipped: ${svResult.reason}`);
    imagery.streetviewMissing = true;
  }

  const mapResult = await fetchStaticMap(address, key);
  if (mapResult.ok) {
    try {
      const stored = await uploadDocument(
        folderReportId,
        "imagery",
        "staticmap.png",
        mapResult.buf,
        "image/png",
        { source: "google-staticmap", address }
      );
      imagery.mapStoragePath = stored.storagePath;
    } catch (err) {
      console.warn("[property-imagery] staticmap upload failed:", err);
      imagery.mapMissing = true;
    }
  } else {
    console.log(`[property-imagery] staticmap skipped: ${mapResult.reason}`);
    imagery.mapMissing = true;
  }

  // Persist (even if both missing — so we don't retry on every re-run).
  await db.from("properties").update({ imagery }).eq("id", propertyId);
  return imagery;
}

/** Convert the cached storage paths to signed URLs usable by Playwright +
    the browser. 1-hour expiry is plenty for a single render pass. Accepts
    a loose Record so callers can pass a row from supabase without casting. */
export async function resolveImageryUrls(
  imagery: PropertyImagery | Record<string, unknown> | null | undefined
): Promise<{ streetviewUrl?: string; mapUrl?: string }> {
  if (!imagery) return {};
  const rec = imagery as Record<string, unknown>;
  const sv =
    typeof rec.streetviewStoragePath === "string" ? rec.streetviewStoragePath : undefined;
  const mp = typeof rec.mapStoragePath === "string" ? rec.mapStoragePath : undefined;
  const out: { streetviewUrl?: string; mapUrl?: string } = {};
  if (sv) {
    try {
      out.streetviewUrl = await getDocumentUrl(sv, 3600);
    } catch (err) {
      console.warn("[property-imagery] could not sign streetview:", err);
    }
  }
  if (mp) {
    try {
      out.mapUrl = await getDocumentUrl(mp, 3600);
    } catch (err) {
      console.warn("[property-imagery] could not sign map:", err);
    }
  }
  return out;
}
