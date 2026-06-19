/* ─── Building Permits Agent ───
   City-by-city permit data lookup. Coverage expands as we onboard attorneys
   in new jurisdictions.

   Data sources (free, no API key):
   - City of Atlanta: ArcGIS CSV dump (~38K rows, refreshed daily via
     `scripts/refresh_atlanta_permits.ts`, queried from
     cliros.permits_cache_atlanta)
   - Future: Decatur, Sandy Springs, Marietta, Roswell, Alpharetta, etc.

   Defect rules surfaced to the AOL panel:
   - Permit Issued + applied >90 days ago + no Finaled date
     → MAJOR defect: open work, mechanics-lien window
   - Permit Cancelled or Expired with valuation >$10k
     → MINOR defect: stale work; verify with seller
*/

import { createClient } from "@supabase/supabase-js";

export interface PermitRecord {
  source: string;
  permitNumber: string;
  permitType?: string;
  workDescription?: string;
  appliedDate?: string;
  issuedDate?: string;
  finaledDate?: string;
  status?: string;
  declaredValue?: number;
  applicant?: string;
  contractor?: string;
  contractorLicense?: string;
  rawAttributes?: Record<string, unknown>;
}

export interface PermitsResult {
  covered: boolean;       // did the property fall in a covered jurisdiction?
  jurisdiction?: string;  // e.g. "City of Atlanta"
  permits: PermitRecord[];
  noteForReport?: string; // user-facing line for the report
}

/* ── Coverage table ── */

interface CoverageEntry {
  jurisdiction: string;
  /** Heuristic that decides whether a given address belongs to this jurisdiction. */
  matches: (address: string, county?: string) => boolean;
  /** Fetcher returns permits for the address; undefined → fail gracefully. */
  fetch: (address: string) => Promise<PermitRecord[]>;
}

function admin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { db: { schema: "cliros" }, auth: { persistSession: false } }
  );
}

const COVERAGE: CoverageEntry[] = [
  // City of Atlanta — Fulton & DeKalb addresses with Atlanta city limits.
  // City addressing is the most reliable signal (zip alone isn't — 30318 spans
  // Atlanta + unincorporated Fulton). We accept Atlanta if "Atlanta" is the city
  // portion of the address. If the parcel anchor knows the parcel is inside
  // city limits we'd defer to that — but for v1 string match is enough.
  {
    jurisdiction: "City of Atlanta",
    matches: (address) => /,\s*atlanta\s*,/i.test(address),
    fetch: fetchAtlantaPermits,
  },
];

/* ── Public API ── */

export async function fetchPermitsForProperty(
  address: string,
  county?: string
): Promise<PermitsResult> {
  for (const entry of COVERAGE) {
    if (entry.matches(address, county)) {
      try {
        const permits = await entry.fetch(address);
        return {
          covered: true,
          jurisdiction: entry.jurisdiction,
          permits,
          noteForReport:
            permits.length === 0
              ? `${entry.jurisdiction} permits searched — no records found for this address.`
              : `${entry.jurisdiction} permits: ${permits.length} record${permits.length === 1 ? "" : "s"} reviewed.`,
        };
      } catch (err) {
        console.error(`[permits] ${entry.jurisdiction} fetch failed:`, err);
        return {
          covered: true,
          jurisdiction: entry.jurisdiction,
          permits: [],
          noteForReport: `${entry.jurisdiction} permits unavailable at search time (data source temporarily down).`,
        };
      }
    }
  }
  return {
    covered: false,
    permits: [],
    noteForReport:
      "Building permits not yet available for this jurisdiction. We're adding cities as attorneys in those areas come online — let us know if you'd like priority coverage.",
  };
}

/* ── Atlanta handler (queries cached CSV in Supabase) ── */

async function fetchAtlantaPermits(address: string): Promise<PermitRecord[]> {
  const db = admin();
  // Address in the CSV is like "1394 PEACHTREE BATTLE AVE". Normalize input.
  const street = address.split(",")[0]?.trim().toUpperCase() || "";
  if (!street) return [];

  // Match number + first two distinctive words. PostgREST limits LIKE pattern
  // building — use ilike with leading wildcard tolerated by GIN-less idx scan
  // (table is ~38K rows so seq scan + lower(address) idx is fine).
  const pattern = `%${street.replace(/'/g, "''")}%`;
  const { data, error } = await db
    .from("permits_cache_atlanta")
    .select("*")
    .ilike("address", pattern)
    .limit(50);

  if (error) {
    console.warn(`[permits-atlanta] query failed:`, error.message);
    return [];
  }

  type Row = {
    permit_number: string;
    permit_type: string | null;
    description: string | null;
    address: string | null;
    applied_date: string | null;
    issued_date: string | null;
    finaled_date: string | null;
    status: string | null;
    declared_value: number | null;
    applicant: string | null;
    contractor: string | null;
    contractor_license: string | null;
    raw_attributes: Record<string, unknown> | null;
  };

  return (data as Row[] | null || []).map((r) => ({
    source: "atlanta_arcgis",
    permitNumber: r.permit_number,
    permitType: r.permit_type || undefined,
    workDescription: r.description || undefined,
    appliedDate: r.applied_date || undefined,
    issuedDate: r.issued_date || undefined,
    finaledDate: r.finaled_date || undefined,
    status: r.status || undefined,
    declaredValue: r.declared_value ?? undefined,
    applicant: r.applicant || undefined,
    contractor: r.contractor || undefined,
    contractorLicense: r.contractor_license || undefined,
    rawAttributes: r.raw_attributes || undefined,
  }));
}

/* ── Defect derivation ── */

/**
 * Given a list of permits, derive any title defects worth flagging to the
 * panel. Called by the orchestrator after fetchPermitsForProperty.
 */
export function derivePermitDefects(permits: PermitRecord[]): {
  id: string;
  severity: "minor" | "major" | "critical";
  category: string;
  title: string;
  description: string;
  recommendation: string;
}[] {
  const now = Date.now();
  const ninetyDaysMs = 90 * 24 * 60 * 60 * 1000;
  const defects: ReturnType<typeof derivePermitDefects> = [];

  // Open permits past 90 days — mechanics-lien window risk
  const openOld = permits.filter((p) => {
    if (!p.status) return false;
    if (!/^Issued$/i.test(p.status)) return false;
    if (p.finaledDate) return false;
    if (!p.appliedDate) return false;
    return now - new Date(p.appliedDate).getTime() > ninetyDaysMs;
  });

  for (const p of openOld) {
    defects.push({
      id: `permit-open-${p.permitNumber}`,
      severity: "major",
      category: "permits",
      title: `Open permit ${p.permitNumber} past 90 days`,
      description:
        `Permit ${p.permitNumber} (${p.permitType || "type unknown"}) was Issued on ${p.issuedDate || p.appliedDate} ` +
        `and has no Finaled / Certificate of Occupancy date. Work older than 90 days creates a mechanics-lien window ` +
        `risk and may indicate unmarketable title due to unfinished work.`,
      recommendation:
        `Obtain a final-inspection / Certificate of Occupancy from the city or a sworn statement from the contractor ` +
        `confirming work is complete and all subcontractors paid. Consider a lien waiver requirement at closing.`,
    });
  }

  // Cancelled/expired permits with non-trivial valuation — stale-work risk
  const staleHighValue = permits.filter(
    (p) =>
      p.status &&
      /^(Cancelled|Expired)$/i.test(p.status) &&
      (p.declaredValue ?? 0) >= 10000
  );
  for (const p of staleHighValue) {
    defects.push({
      id: `permit-stale-${p.permitNumber}`,
      severity: "minor",
      category: "permits",
      title: `Cancelled/expired permit ${p.permitNumber} ($${p.declaredValue?.toLocaleString()})`,
      description:
        `Permit ${p.permitNumber} for ${p.permitType || "work"} ($${p.declaredValue?.toLocaleString()}) was ${p.status}. ` +
        `Verify whether the underlying work was completed and inspected or abandoned.`,
      recommendation: `Ask the seller for documentation of work status. Inspect to confirm no unpermitted work remains.`,
    });
  }

  return defects;
}
