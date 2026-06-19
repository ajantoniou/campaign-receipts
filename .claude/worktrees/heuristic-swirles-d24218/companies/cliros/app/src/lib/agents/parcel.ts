/* ─── Parcel Anchor Agent ───
   Queries county GIS ArcGIS REST endpoints to resolve an address into:
   - ParcelID (the authoritative property anchor)
   - Owner of record
   - Assessed/appraised values
   - Subdivision / lot / block
   - Land acreage

   This is the FIRST step in the title search pipeline. Without a parcel
   match, GSCCCA falls back to keyword name-search which produces garbage
   (e.g. searching "PEACHTREE" matches every railway company with that
   word in its name). No parcel ⇒ block the report, don't fabricate.

   Free, no API key. Currently covers:
   - Fulton (PropertyMapViewer MapServer)
   - More counties added as we expand state coverage.
*/

import axios from "axios";

export interface ParcelAnchor {
  parcelId: string;
  owner: string;
  ownerMailingAddress?: string;
  siteAddress: string;
  county: string;
  subdivision?: string;
  subdivisionLot?: string;
  subdivisionBlock?: string;
  landAcres?: number;
  totalAppraisedValue?: number;
  totalAssessedValue?: number;
  landUseCode?: string;
  classCode?: string;
  livingUnits?: number;
  taxYear?: number;
  rawAttributes: Record<string, unknown>;
}

/* ── Address parsing ── */

interface ParsedAddress {
  addrNumber: string;
  preDir?: string;
  streetName: string;
  suffix?: string;
  posDir?: string;
  city?: string;
  state: string;
  zip?: string;
}

const DIRECTIONS = new Set(["N", "S", "E", "W", "NE", "NW", "SE", "SW"]);
const SUFFIXES = new Set([
  "ST", "STREET", "AVE", "AVENUE", "RD", "ROAD", "DR", "DRIVE",
  "BLVD", "BOULEVARD", "LN", "LANE", "CT", "COURT", "CIR", "CIRCLE",
  "PL", "PLACE", "WAY", "TER", "TERRACE", "PKWY", "PARKWAY",
  "HWY", "HIGHWAY", "TRL", "TRAIL", "PT", "POINT", "PLZ", "PLAZA",
  "SQ", "SQUARE", "ALY", "ALLEY", "WALK", "WALKWAY", "RUN", "PASS",
  "XING", "CROSSING", "RIDGE", "RDG", "PATH", "ROW", "LOOP",
]);

// Map common variants to the canonical form Fulton's index uses (no period, all caps)
const SUFFIX_CANONICAL: Record<string, string> = {
  STREET: "ST", AVENUE: "AVE", ROAD: "RD", DRIVE: "DR",
  BOULEVARD: "BLVD", LANE: "LN", COURT: "CT", CIRCLE: "CIR",
  PLACE: "PL", TERRACE: "TER", PARKWAY: "PKWY", HIGHWAY: "HWY",
  TRAIL: "TRL", POINT: "PT", PLAZA: "PLZ", SQUARE: "SQ",
  ALLEY: "ALY", CROSSING: "XING", RIDGE: "RDG",
};

export function parseStreetAddress(fullAddress: string): ParsedAddress | null {
  // Expect: "1394 Peachtree Battle Ave NW, Atlanta, GA 30318"
  const parts = fullAddress.split(",").map((p) => p.trim());
  if (parts.length === 0 || !parts[0]) return null;

  const street = parts[0].toUpperCase();
  const city = parts[1] || undefined;
  const stateZip = parts[2] || "";
  const stateMatch = stateZip.match(/([A-Z]{2})\s*(\d{5})?/);
  const state = stateMatch?.[1] || "GA";
  const zip = stateMatch?.[2];

  const tokens = street.split(/\s+/);
  if (tokens.length === 0) return null;

  // First token must be a number (street number)
  const addrNumber = tokens.shift();
  if (!addrNumber || !/^\d+$/.test(addrNumber)) return null;

  // Optional pre-directional (N MAIN ST)
  let preDir: string | undefined;
  if (tokens.length > 1 && DIRECTIONS.has(tokens[0])) {
    preDir = tokens.shift();
  }

  // Last token might be a post-directional (PEACHTREE ST NE)
  let posDir: string | undefined;
  if (tokens.length >= 2 && DIRECTIONS.has(tokens[tokens.length - 1])) {
    posDir = tokens.pop();
  }

  // Now last token (if multiple remain) might be a street suffix
  let suffix: string | undefined;
  if (tokens.length >= 2 && SUFFIXES.has(tokens[tokens.length - 1])) {
    const raw = tokens.pop()!;
    suffix = SUFFIX_CANONICAL[raw] || raw;
  }

  const streetName = tokens.join(" ");
  if (!streetName) return null;

  return { addrNumber, preDir, streetName, suffix, posDir, city, state, zip };
}

/* ── Fulton County (Atlanta + unincorporated + member cities) ── */

const FULTON_PARCEL_URL =
  "https://gismaps.fultoncountyga.gov/arcgispub2/rest/services/PropertyMapViewer/PropertyMapViewer/MapServer/11/query";

async function queryFultonParcel(parsed: ParsedAddress): Promise<ParcelAnchor | null> {
  // Try progressively looser matches. ArcGIS LIKE is SQL-92, % wildcard.
  const tries: string[] = [];

  // Tier 1: number + exact street + suffix + posDir
  const t1Parts = [`AddrNumber='${parsed.addrNumber}'`, `AddrStreet='${parsed.streetName}'`];
  if (parsed.suffix) t1Parts.push(`AddrSuffix='${parsed.suffix}'`);
  if (parsed.posDir) t1Parts.push(`AddrPosDir='${parsed.posDir}'`);
  tries.push(t1Parts.join(" AND "));

  // Tier 2: number + street + suffix (drop posDir)
  if (parsed.posDir) {
    const t2Parts = [`AddrNumber='${parsed.addrNumber}'`, `AddrStreet='${parsed.streetName}'`];
    if (parsed.suffix) t2Parts.push(`AddrSuffix='${parsed.suffix}'`);
    tries.push(t2Parts.join(" AND "));
  }

  // Tier 3: number + street name only
  tries.push(`AddrNumber='${parsed.addrNumber}' AND AddrStreet='${parsed.streetName}'`);

  // Tier 4: number + street name LIKE (handles "PEACHTREE" vs "PEACHTREE BATTLE")
  tries.push(`AddrNumber='${parsed.addrNumber}' AND AddrStreet LIKE '${parsed.streetName}%'`);

  for (const whereClause of tries) {
    try {
      const resp = await axios.get(FULTON_PARCEL_URL, {
        params: {
          where: whereClause,
          outFields: "*",
          returnGeometry: false,
          f: "json",
        },
        timeout: 15000,
      });
      const features = resp.data?.features || [];
      if (features.length === 1) {
        return featureToAnchor(features[0].attributes, "Fulton");
      }
      // If multiple results, pick the closest match — exact suffix + posDir wins
      if (features.length > 1) {
        const exact = features.find((f: { attributes: Record<string, string | null> }) => {
          const a = f.attributes;
          if (parsed.suffix && (a.AddrSuffix || "").trim() !== parsed.suffix) return false;
          if (parsed.posDir && (a.AddrPosDir || "").trim() !== parsed.posDir) return false;
          return true;
        });
        if (exact) return featureToAnchor(exact.attributes, "Fulton");
        // No exact suffix/posDir match — log and continue to next tier
        console.warn(
          `[Parcel] Fulton: ${features.length} ambiguous matches for "${whereClause}" — moving to next tier`
        );
      }
    } catch (err) {
      console.warn(`[Parcel] Fulton query failed for "${whereClause}":`, err instanceof Error ? err.message : err);
    }
  }
  return null;
}

function featureToAnchor(
  a: Record<string, string | number | null>,
  county: string
): ParcelAnchor {
  const parts = [
    a.AddrNumber,
    a.AddrPreDir,
    a.AddrStreet,
    a.AddrSuffix,
    a.AddrPosDir,
    a.AddrUntTyp,
    a.AddrUnit,
  ]
    .filter((p) => p && String(p).trim().length > 0)
    .join(" ");

  const ownerMailing = [a.OwnerAddr1, a.OwnerAddr2]
    .filter((p) => p && String(p).trim().length > 0)
    .join(", ");

  return {
    parcelId: String(a.ParcelID || "").trim(),
    owner: String(a.Owner || "").trim(),
    ownerMailingAddress: ownerMailing || undefined,
    siteAddress: parts || String(a.Address || ""),
    county,
    subdivision: a.Subdiv ? String(a.Subdiv).trim() : undefined,
    subdivisionLot: a.SubdivLot ? String(a.SubdivLot).trim() : undefined,
    subdivisionBlock: a.SubdivBlck ? String(a.SubdivBlck).trim() : undefined,
    landAcres: typeof a.LandAcres === "number" ? a.LandAcres : undefined,
    totalAppraisedValue: typeof a.TotAppr === "number" ? a.TotAppr : undefined,
    totalAssessedValue: typeof a.TotAssess === "number" ? a.TotAssess : undefined,
    landUseCode: a.LUCode ? String(a.LUCode).trim() : undefined,
    classCode: a.ClassCode ? String(a.ClassCode).trim() : undefined,
    livingUnits: typeof a.LivUnits === "number" ? a.LivUnits : undefined,
    taxYear: typeof a.TaxYear === "number" ? a.TaxYear : undefined,
    rawAttributes: a as Record<string, unknown>,
  };
}

/* ── Public API ── */

export async function resolveParcelAnchor(
  fullAddress: string,
  county?: string
): Promise<ParcelAnchor | null> {
  const parsed = parseStreetAddress(fullAddress);
  if (!parsed) {
    console.warn(`[Parcel] Could not parse address: "${fullAddress}"`);
    return null;
  }

  const lowerCounty = (county || "").toLowerCase().replace(/\s+county$/i, "").trim();

  // Route to the right county handler. For now Fulton only — add more here.
  if (!lowerCounty || lowerCounty === "fulton") {
    const anchor = await queryFultonParcel(parsed);
    if (anchor) return anchor;
  }

  // If county wasn't specified, try Fulton as a default (Atlanta metro).
  // Future: try DeKalb, Cobb, Gwinnett, Forsyth, Clayton in turn.
  if (!county) {
    const anchor = await queryFultonParcel(parsed);
    if (anchor) return anchor;
  }

  return null;
}

/* ── Owner-name extraction for downstream GSCCCA name search ── */

/**
 * Pull search-worthy tokens out of an owner-of-record string.
 * Handles:
 *   - "SMITH JOHN R" → ["SMITH"] (individual; last name first)
 *   - "SMITH JOHN & SMITH JANE" → ["SMITH"]
 *   - "PEACHTREE 1314 LLC" → ["PEACHTREE 1314"] (drop LLC suffix)
 *   - "THE DEVELOPMENT AUTHORITY OF FULTON COUNTY" → ["DEVELOPMENT AUTHORITY"]
 */
export function extractOwnerSearchNames(owner: string): string[] {
  const cleaned = owner
    .toUpperCase()
    .replace(/[^A-Z0-9 &]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!cleaned) return [];

  // Split on & for joint owners
  const parties = cleaned.split(/\s*&\s*/).map((s) => s.trim()).filter(Boolean);
  const names = new Set<string>();

  const ENTITY_SUFFIXES = new Set([
    "LLC", "INC", "CORP", "CO", "LP", "LLP", "LTD", "PA", "PC", "PLLC",
  ]);
  const STOP_WORDS = new Set([
    "THE", "OF", "AND", "A", "AN", "FOR", "TO", "AT", "IN", "ON",
  ]);

  // Words that signal "this is an organization, not a person"
  const ENTITY_MARKERS = new Set([
    "LLC", "INC", "CORP", "CO", "LP", "LLP", "LTD", "PA", "PC", "PLLC",
    "TRUST", "ESTATE", "AUTHORITY", "DEPARTMENT", "AGENCY", "FOUNDATION",
    "COMPANY", "PARTNERS", "PARTNERSHIP", "ASSOCIATES", "ASSOCIATION",
    "PROPERTIES", "PROPERTY", "HOLDINGS", "INVESTMENTS", "GROUP",
    "ENTERPRISES", "VENTURES", "CAPITAL", "DEVELOPMENT", "MANAGEMENT",
    "CORPORATION", "INSTITUTE", "CHURCH", "BANK", "ASSN", "ASSOC",
  ]);

  for (const party of parties) {
    const tokens = party.split(" ").filter(Boolean);
    if (tokens.length === 0) continue;

    // Heuristic: any organizational marker → treat as entity.
    // Otherwise treat as individual (Fulton stores as "LAST FIRST MIDDLE").
    const isEntity = tokens.some((t) => ENTITY_MARKERS.has(t));

    if (isEntity) {
      // Drop suffix-style tokens and stop words; keep the distinctive part.
      const meaningful = tokens.filter(
        (t) => !ENTITY_SUFFIXES.has(t) && !STOP_WORDS.has(t)
      );
      if (meaningful.length === 0) continue;

      // Find the longest contiguous run of distinctive tokens (drops trailing
      // place qualifiers like "FULTON COUNTY"). For "THE DEVELOPMENT AUTHORITY
      // FULTON COUNTY" → ["DEVELOPMENT", "AUTHORITY"] (no "FULTON COUNTY" since
      // those are place names; tricky to detect heuristically — accept it for now
      // and let GSCCCA name search match on the prefix).
      // For a corporate name like "PEACHTREE 1314 LLC" → "PEACHTREE 1314".
      // For "THE DEVELOPMENT AUTHORITY OF FULTON COUNTY", we want "DEVELOPMENT
      // AUTHORITY" — searchable enough that GSCCCA index returns DAFC.
      // Simple rule: take everything up to and including the entity-marker word,
      // then drop the marker itself if it was a generic descriptor.
      const markerIdx = meaningful.findIndex((t) => ENTITY_MARKERS.has(t));
      let searchName: string;
      if (markerIdx === -1) {
        searchName = meaningful.join(" ");
      } else if (markerIdx === 0) {
        searchName = meaningful.slice(0, 2).join(" ") || meaningful[0];
      } else {
        // Take prefix up to and including the marker, then truncate
        // "DEVELOPMENT AUTHORITY [FULTON COUNTY]" → "DEVELOPMENT AUTHORITY"
        searchName = meaningful.slice(0, markerIdx + 1).join(" ");
      }
      if (searchName) names.add(searchName);
    } else {
      // Individual — Fulton stores as "LAST FIRST MIDDLE". Use last name.
      const lastName = tokens[0];
      if (lastName && lastName.length >= 2) {
        names.add(lastName);
      }
    }
  }

  return Array.from(names);
}

/**
 * Parse an attorney-supplied prior-owner hint into GSCCCA search tokens.
 *
 * Attorneys type natural English from the Purchase & Sale Agreement, not the
 * county tax roll's `LAST FIRST MIDDLE` format. Handle the messy real-world
 * variants so the field actually pays off in 30 seconds of input:
 *
 *   "John R. Smith"               → ["SMITH"]
 *   "Smith, John"                 → ["SMITH"]
 *   "John and Jane Smith"         → ["SMITH"]
 *   "John & Jane Smith"           → ["SMITH"]
 *   "Mr. and Mrs. Smith"          → ["SMITH"]
 *   "John Smith and Jane Doe"     → ["SMITH", "DOE"]
 *   "The Smith Family Trust"      → ["SMITH"]
 *   "Peachtree 1314 LLC"          → ["PEACHTREE", "1314"]   (entity)
 *   "Smith Family Revocable Trust"→ ["SMITH"]
 *
 * Returns surname/distinctive tokens deduplicated, uppercased.
 */
export function parsePriorOwnerHint(input: string): string[] {
  const raw = (input || "").trim();
  if (!raw) return [];

  // Strip honorifics + punctuation, normalize separators.
  const HONORIFICS = /^(MR\.?|MRS\.?|MS\.?|DR\.?|MISS|REV\.?|HON\.?)\s+/gi;
  const cleaned = raw
    .replace(HONORIFICS, "")
    .replace(/\b(MR\.?|MRS\.?|MS\.?|DR\.?|MISS|REV\.?|HON\.?|JR\.?|SR\.?|II|III|IV)\b/gi, " ")
    .replace(/[^A-Za-z0-9,&\s]/g, " ")
    .replace(/\bAND\b/gi, "&")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
  if (!cleaned) return [];

  const ENTITY_MARKERS = new Set([
    "LLC", "INC", "CORP", "CO", "LP", "LLP", "LTD", "PA", "PC", "PLLC",
    "TRUST", "ESTATE", "AUTHORITY", "FOUNDATION", "COMPANY", "PARTNERS",
    "PARTNERSHIP", "ASSOCIATES", "ASSOCIATION", "PROPERTIES", "PROPERTY",
    "HOLDINGS", "INVESTMENTS", "GROUP", "ENTERPRISES", "VENTURES",
    "CAPITAL", "DEVELOPMENT", "MANAGEMENT", "CORPORATION",
  ]);
  const TRUST_DESCRIPTORS = new Set([
    "FAMILY", "REVOCABLE", "IRREVOCABLE", "LIVING", "TESTAMENTARY",
    "CHARITABLE", "MARITAL", "BYPASS",
  ]);
  const STOP = new Set([
    "THE", "OF", "A", "AN", "FOR", "TO", "AT", "IN", "ON", "&",
    "OR", "ETAL", "ET", "AL",
  ]);
  const FIRST_NAME_HINTS = new Set([
    "JOHN", "JANE", "MARY", "JAMES", "ROBERT", "MICHAEL", "WILLIAM",
    "DAVID", "RICHARD", "JOSEPH", "CHARLES", "THOMAS", "DANIEL", "PAUL",
    "MARK", "STEVEN", "ANDREW", "KENNETH", "GEORGE", "BRIAN", "EDWARD",
    "RONALD", "TIMOTHY", "JASON", "JEFFREY", "RYAN", "JACOB", "GARY",
    "NICHOLAS", "ERIC", "JONATHAN", "STEPHEN", "LARRY", "JUSTIN", "SCOTT",
    "BRANDON", "FRANK", "BENJAMIN", "GREGORY", "RAYMOND", "PATRICK",
    "ALEXANDER", "JACK", "DENNIS", "JERRY", "TYLER", "AARON", "HENRY",
    "DOUGLAS", "PETER", "ADAM", "NATHAN", "ZACHARY", "WALTER", "KYLE",
    "HAROLD", "CARL", "JEREMY", "KEITH", "ROGER", "GERALD", "ETHAN",
    "ARTHUR", "TERRY", "CHRISTIAN", "SEAN", "LAWRENCE", "AUSTIN", "JOE",
    "NOAH", "JESSE", "ALBERT", "BRYAN", "BILLY", "BRUCE", "WILLIE", "JORDAN",
    "DYLAN", "ALAN", "RALPH", "GABRIEL", "ROY", "JUAN", "WAYNE", "EUGENE",
    "LOGAN", "RANDY", "LOUIS", "RUSSELL", "VINCENT", "ETHAN", "BOBBY",
    "PHILIP", "JOHNNY", "ELIZABETH", "PATRICIA", "JENNIFER", "LINDA",
    "BARBARA", "SUSAN", "JESSICA", "SARAH", "KAREN", "NANCY", "LISA",
    "BETTY", "DOROTHY", "SANDRA", "ASHLEY", "KIMBERLY", "DONNA", "EMILY",
    "MICHELLE", "CAROL", "AMANDA", "MELISSA", "DEBORAH", "STEPHANIE",
    "REBECCA", "LAURA", "SHARON", "CYNTHIA", "KATHLEEN", "AMY", "ANGELA",
    "SHIRLEY", "ANNA", "BRENDA", "PAMELA", "EMMA", "NICOLE", "HELEN",
    "SAMANTHA", "KATHERINE", "CHRISTINE", "DEBRA", "RACHEL", "CATHERINE",
    "CAROLYN", "JANET", "RUTH", "MARIA", "HEATHER", "DIANE", "VIRGINIA",
    "JULIE", "JOYCE", "VICTORIA", "OLIVIA", "KELLY", "CHRISTINA", "LAUREN",
    "JOAN", "EVELYN", "JUDITH", "ANDREA", "HANNAH", "MEGAN", "CHERYL",
    "JACQUELINE", "MARTHA", "MADISON", "TERESA", "GLORIA", "SARA", "JANICE",
    "ANN", "KATHRYN", "ABIGAIL", "SOPHIA", "FRANCES", "JEAN", "ALICE",
    "JUDY", "ISABELLA", "JULIA", "GRACE", "AMBER", "DENISE", "DANIELLE",
  ]);
  const INITIAL = /^[A-Z]$/;

  const out = new Set<string>();

  // Detect entity (trust / LLC) by markers.
  const hasEntityMarker = cleaned.split(/[\s&]+/).some((t) => ENTITY_MARKERS.has(t));

  if (hasEntityMarker) {
    // Pull the distinctive surname/word — first non-stop, non-marker, non-
    // trust-descriptor, non-initial token. For "THE SMITH FAMILY TRUST",
    // that's SMITH.
    for (const tok of cleaned.split(/[\s&,]+/)) {
      if (!tok || tok.length < 2) continue;
      if (STOP.has(tok) || ENTITY_MARKERS.has(tok) || TRUST_DESCRIPTORS.has(tok)) continue;
      if (INITIAL.test(tok)) continue;
      out.add(tok);
      // For trusts, the first distinctive token is usually the family name —
      // good enough to stop. LLCs may have a multi-word name ("PEACHTREE 1314"),
      // so for non-TRUST entities keep collecting one more.
      if (cleaned.includes("TRUST") || cleaned.includes("ESTATE")) break;
      if (out.size >= 2) break;
    }
    return Array.from(out);
  }

  // Person path. Handle "Last, First" by splitting on the first comma.
  const commaMatch = cleaned.match(/^([A-Z][A-Z'-]+)\s*,\s*(.+)$/);
  if (commaMatch && !FIRST_NAME_HINTS.has(commaMatch[1])) {
    // "SMITH, JOHN" — first chunk is the surname.
    out.add(commaMatch[1]);
    return Array.from(out);
  }

  // Couple pattern: "JOHN & JANE SMITH" or "JOHN AND JANE SMITH" (already
  // normalized to &). The shared surname is the trailing token after the &.
  // Also handle "JOHN SMITH & JANE DOE" (two different surnames).
  const parts = cleaned.split(/\s*&\s*/).map((p) => p.trim()).filter(Boolean);
  if (parts.length >= 2) {
    // Check if all parts share a trailing surname token.
    const trailingSurnameOf = (p: string) => {
      const ts = p.split(/\s+/).filter((t) => t && t.length >= 2 && !STOP.has(t) && !INITIAL.test(t));
      // Return the LAST token that isn't a known first name.
      for (let i = ts.length - 1; i >= 0; i--) {
        if (!FIRST_NAME_HINTS.has(ts[i])) return ts[i];
      }
      return ts[ts.length - 1] || null;
    };
    // Special case "JOHN & JANE SMITH" — only the LAST part has a surname,
    // the earlier parts are bare first names. The shared surname is the
    // trailing surname of the LAST part.
    const lastPart = parts[parts.length - 1];
    const surnameLast = trailingSurnameOf(lastPart);
    const earlierAreFirstNamesOnly = parts.slice(0, -1).every((p) => {
      const ts = p.split(/\s+/).filter(Boolean);
      return ts.every((t) => FIRST_NAME_HINTS.has(t) || INITIAL.test(t) || t.length < 2);
    });
    if (surnameLast && earlierAreFirstNamesOnly) {
      out.add(surnameLast);
      return Array.from(out);
    }
    // General case: each party has its own surname — collect all of them.
    for (const p of parts) {
      const s = trailingSurnameOf(p);
      if (s) out.add(s);
    }
    if (out.size > 0) return Array.from(out);
  }

  // Single person — "John R. Smith" or "Smith John R". Find the surname token.
  const tokens = cleaned.split(/\s+/).filter((t) => t && t.length >= 2 && !STOP.has(t) && !INITIAL.test(t));
  if (tokens.length === 0) return [];
  if (tokens.length === 1) {
    out.add(tokens[0]);
    return Array.from(out);
  }
  // If the FIRST token is a known first name and the LAST isn't, treat as
  // "First Last" → last token is the surname. Otherwise assume county-style
  // "Last First Middle" → first token is the surname.
  const firstIsKnownFirstName = FIRST_NAME_HINTS.has(tokens[0]);
  const lastIsKnownFirstName = FIRST_NAME_HINTS.has(tokens[tokens.length - 1]);
  if (firstIsKnownFirstName && !lastIsKnownFirstName) {
    out.add(tokens[tokens.length - 1]);
  } else {
    out.add(tokens[0]);
  }
  return Array.from(out);
}

