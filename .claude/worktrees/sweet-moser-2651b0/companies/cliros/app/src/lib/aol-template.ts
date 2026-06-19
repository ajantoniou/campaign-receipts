/* ─── Cliros AOL Draft Template ─── */
/* Fannie Mae B7-2-06 compliant Attorney Opinion Letter template.
   Works for attorneys (fills in bar number, firm) and non-attorneys (placeholder fields). */

import type { TitleSearchReport } from "./types";
import { computeTitleMetrics } from "./title-metrics";
import { buildAttorneyActionPlan } from "./attorney-action-plan";

export interface AOLAuthorInfo {
  name: string;
  barNumber?: string;
  firmName?: string;
  firmAddress?: string;
  state?: string;
  email?: string;
}

export function generateAOLDraft(
  report: TitleSearchReport,
  author: AOLAuthorInfo,
  /** Persona-authored opinion / qualification prose. When present, it replaces
   *  the deterministic opinion paragraph. Recitals (SCOPE/CHAIN/LIENS/vesting)
   *  are ALWAYS built from the structured arrays regardless. */
  opinionOverride?: string
): string {
  const now = new Date();
  const today = now.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // BRING-DOWN CAVEAT: a B7-2-06 AOL is relied on by the lender AS OF CLOSING.
  // When the search end date is materially older than the letter date, the
  // intervening period is unsearched (new SDs, judgments, tax liens, lis
  // pendens, federal liens via PACER, intervening conveyances). The draft must
  // require a bring-down search to closing rather than silently speak as of a
  // stale date — a signing attorney would otherwise have to add this himself.
  const bringDownCaveat = (() => {
    const end = report.chainOfTitle.endDate;
    const m = end && /^(\d{4})-(\d{2})-(\d{2})/.exec(end.trim());
    if (!m) return "";
    const endMs = Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    const ageDays = Math.floor((now.getTime() - endMs) / 86_400_000);
    if (ageDays <= 45) return ""; // within a normal title-currency window
    return (
      `\n[BRING-DOWN REQUIRED — the search effective date above is approximately ${ageDays} days ` +
      `before this letter's date. Before signature, the examination MUST be brought down to ` +
      `the closing date (re-search GSCCCA deeds/liens/judgments/lis pendens + PACER federal ` +
      `liens for the interval ${m[1]}-${m[2]}-${m[3]} → closing). This opinion does not cover ` +
      `matters recorded after the effective date.]`
    );
  })();

  // Format a recorded date as YYYY-MM-DD. Parsing a bare "YYYY-MM-DD" via
  // `new Date(...).toLocaleDateString()` treats it as UTC midnight and renders
  // the prior calendar day in US timezones (the "2011-03-28"→"3/27/2011" bug);
  // the persona's defect text uses raw ISO, so the letter showed two dates for
  // one deed. Normalize every recorded date to ISO so the whole letter agrees.
  const recDate = (d?: string | null): string => {
    if (!d) return "—";
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(d.trim());
    if (m) return `${m[1]}-${m[2]}-${m[3]}`;
    const parsed = new Date(d);
    if (Number.isNaN(parsed.getTime())) return d.trim();
    const y = parsed.getFullYear();
    const mo = String(parsed.getMonth() + 1).padStart(2, "0");
    const da = String(parsed.getDate()).padStart(2, "0");
    return `${y}-${mo}-${da}`;
  };

  // Recordable reference for the deliverable: GA name-index records are
  // identified by Book/Page, not instrument number. Lead with Book/Page; append
  // an instrument number ONLY when one is actually present (never "N/A").
  const recordRef = (bookPage?: string | null, instrumentNumber?: string | null): string => {
    const parts: string[] = [];
    if (bookPage) parts.push(`Book/Page: ${bookPage}`);
    if (instrumentNumber) parts.push(`Instrument: ${instrumentNumber}`);
    return parts.length > 0 ? parts.join(" | ") : "Reference: not in index — pull image";
  };

  const activeLiens = report.liens.filter((l) => l.status === "active");
  const hasDefects = report.defects.some(
    (d) => d.severity === "critical" || d.severity === "major"
  );

  // VESTING-QUALIFIER GUARD. When a critical chain break or an unreconciled
  // out-conveyance is open, the record does NOT cleanly show title vested in the
  // current owner — title may have walked OUT of the owner (e.g. a recorded
  // out-deed to an unidentified grantee with no round-trip back). A persona-
  // authored opinion that flatly states "title is vested in X" overstates the
  // record (audit blocker). Detect that condition deterministically so the
  // OPINION section is prefixed with an apparent-vesting caveat regardless of
  // what the persona prose says.
  const vestingClouded = report.defects.some((d) => {
    if (d.severity !== "critical") return false;
    const dx = d as { type?: string; category?: string };
    const t = `${dx.type || dx.category || ""} ${d.title || ""} ${d.description || ""}`.toLowerCase();
    return (
      /chain[\s_-]?break/.test(t) ||
      /out[\s_-]?conveyance/.test(t) ||
      /out[\s_-]?deed/.test(t) ||
      (/unknown/.test(t) && /grantee/.test(t))
    );
  });
  const vestingCaveat = vestingClouded
    ? `[VESTING NOT ESTABLISHED — A critical chain break and/or an unreconciled out-conveyance is open below. Record title is NOT vested in the most-recent in-conveyance grantee until those items are resolved on the recorded images (identify any "Unknown" grantee and obtain a corrective/quitclaim back to the owner, or quiet title under OCGA §23-3-60). The opinion below states the apparent record posture only and opines NO marketable vesting until the curative items are completed.]\n\n`
    : "";

  // The VESTING deed is the most-recent conveyance that puts title INTO the
  // current record owner. The last chain entry (sorted by the upstream pipeline
  // most-recent-last) is the operative vesting instrument — its grantee is the
  // current owner. We must NOT pick an OUT-deed (a conveyance FROM the owner to
  // someone else, e.g. the 2011 Bk 50217-66 deed to an 'Unknown' grantee): an
  // out-deed is never the source of the insured legal description. Deriving the
  // owner from the most-recent conveyance's grantee — rather than filtering on
  // loose, inconsistently-spelled deed-type strings ("quitclaim" vs
  // "quit_claim") — is robust to those data variants.
  const sortedByDateDesc = [...report.chainOfTitle.entries].sort(
    (a, b) => new Date(b.recordedDate).getTime() - new Date(a.recordedDate).getTime()
  );
  const mostRecentConveyance = sortedByDateDesc[0];
  const currentOwner =
    mostRecentConveyance?.grantee ||
    report.chainOfTitle.entries[report.chainOfTitle.entries.length - 1]?.grantee ||
    "[CURRENT OWNER]";
  // The M&B source is the most-recent conveyance INTO the current owner that
  // actually CARRIES a legal description. A bare quitclaim (e.g. the 2024 QCD
  // Bk 68505-336 conveying a co-tenant's interest) is the most-recent INTO-owner
  // deed but typically carries NO metes-and-bounds — pointing the signing
  // attorney there for the legal description is wrong (audit blocker). Prefer a
  // description-bearing deed type (warranty / grant / corrective family) into the
  // current owner; fall back to any into-owner deed, then the most-recent
  // conveyance, only if no description-bearing deed exists.
  const carriesLegalDescription = (t?: string): boolean => {
    const s = (t || "").toLowerCase().replace(/[\s_-]/g, "");
    // Bare quitclaims and release/cancellation instruments do not carry M&B.
    if (/quit ?claim|quitclaim/.test(t || "") || /^qc/.test(s)) return false;
    return (
      /warranty/.test(s) ||
      /grant/.test(s) ||
      /corrective/.test(s) ||
      /executor|trustee|estate|gift|foreclosure|sheriff|taxsale|courtorder/.test(s)
    );
  };
  const intoOwner = sortedByDateDesc.filter((e) => e.grantee && e.grantee === currentOwner);
  const ownerSurname = (currentOwner.split(/[\s,]+/)[0] || "").toUpperCase();
  const sharesOwnerSurname = (g?: string): boolean =>
    !!ownerSurname && (g || "").toUpperCase().includes(ownerSurname);
  // Oldest-first ordering: the insured M&B is carried by the ROOT description-
  // bearing deed (the earliest warranty in-deed that vests the owner's line),
  // NOT a later warranty deed that may sit on the far side of a chain break, and
  // NOT the bare quitclaim by which the owner most-recently took record title.
  const sortedByDateAsc = [...sortedByDateDesc].reverse();
  const descDeeds = sortedByDateAsc.filter((e) => carriesLegalDescription(e.type));
  const vestingDeed =
    // 1. ROOT description-bearing deed whose grantee shares the owner surname —
    //    e.g. the 2001 MARIETTA ROAD III → EIKHOFF WD at Bk 30998-573 (carries
    //    the insured M&B), preferred over the 2024 bare QCD and over a later WD
    //    across a chain break.
    descDeeds.find((e) => sharesOwnerSurname(e.grantee)) ||
    // 2. else the root description-bearing deed at all (oldest warranty/grant).
    descDeeds[0] ||
    // 3. else the most-recent description-bearing deed INTO the exact owner.
    intoOwner.find((e) => carriesLegalDescription(e.type)) ||
    // 4. else any into-owner deed, then the most-recent conveyance.
    intoOwner[0] ||
    mostRecentConveyance;

  // B7-2-06 requires a real legal description (metes-and-bounds or platted
  // lot), not a tax-parcel reference. A bare parcel id / address echo is NOT a
  // sign-able legal description, so render an explicit required-before-signature
  // marker that points the attorney to the vesting deed image for the M&B.
  const vestingBookPage = vestingDeed?.bookPage;
  const rawLegal = (report.parcel.legalDescription || "").trim();
  const parcelId = (report.parcel.parcelId || "").trim();
  // A sign-able B7-2-06 legal description is a real metes-and-bounds call or a
  // platted lot/block reference — NOT a tax-parcel id with acreage and a
  // "refer to the deed" pointer (that is what the GIS layer returns, and the
  // audit flagged it as non-sign-able). Detect the real thing by its content:
  //   • M&B: directional/distance calls ("thence", "degrees", "feet", "chains")
  //   • platted: "Lot N", "Block N", "Land Lot N", recorded "Plat Book"
  const looksLikeMetesAndBounds =
    /\bthence\b/i.test(rawLegal) ||
    /\bdegrees?\b/i.test(rawLegal) ||
    /\b\d+\s*(feet|ft\.?|chains?|rods?)\b/i.test(rawLegal);
  const looksLikePlattedLot =
    /\b(lot|block)\s+\w+/i.test(rawLegal) ||
    /\bland\s+lot\s+\d+/i.test(rawLegal) ||
    /\bplat\s+book\b/i.test(rawLegal);
  // A tax-parcel reference is disqualifying even if long.
  const looksLikeTaxParcelOnly =
    /\btax\s+parcel\b/i.test(rawLegal) ||
    /\bparcel\s+(id|no|number)\b/i.test(rawLegal) ||
    /\brefer\s+to\b.*\bdeed\b/i.test(rawLegal) ||
    (!!parcelId && rawLegal.includes(parcelId));
  const isSubstantiveLegal =
    rawLegal.length > 0 &&
    (looksLikeMetesAndBounds || looksLikePlattedLot) &&
    !looksLikeTaxParcelOnly;
  // Name the M&B source by its deed type so the attorney is sent to the deed
  // that actually carries the legal description (a warranty in-deed), not a bare
  // quitclaim. When the M&B source differs from the most-recent conveyance, add
  // a same-parcel confirmation note (the two deeds must describe one parcel).
  const vestingDeedTypeLabel = (vestingDeed?.type || "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
  const mbPointer = vestingBookPage
    ? ` — pull from the ${vestingDeedTypeLabel || ""} in-deed at Book/Page ${vestingBookPage}${
        mostRecentConveyance && mostRecentConveyance.bookPage && mostRecentConveyance.bookPage !== vestingBookPage
          ? ` (the legal-description source; confirm it and the most-recent conveyance at Book/Page ${mostRecentConveyance.bookPage} describe the same parcel)`
          : ""
      }`.replace(/\s+/g, " ")
    : "";
  const legalDescriptionField = isSubstantiveLegal
    ? rawLegal
    : `[METES-AND-BOUNDS / PLATTED LOT — REQUIRED BEFORE SIGNATURE${mbPointer}]`;

  // OPINION VESTING-HONESTY TRANSFORM. A banner that says "ignore the verb I'm
  // about to use" does NOT cure an affirmative "title is vested in X" sentence
  // (audit blocker M1). When vesting is clouded, deterministically REWRITE any
  // "vested in <owner>" clause in the persona-authored opinion to the honest
  // "the most-recent in-conveyance names X as grantee; record title is NOT
  // vested in X until the curative items are resolved" phrasing — so the
  // operative sentence itself never overstates, with or without the banner.
  const applyVestingHonesty = (opinion: string): string => {
    if (!vestingClouded || !opinion) return opinion;
    const ownerEsc = currentOwner.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    // Match the operative "... vested in <OWNER> ..." clause up to the next
    // comma/period and replace the vesting assertion with an honest one.
    const vestedRe = new RegExp(
      `\\brecord title is[^.]*?\\bvested in\\s+${ownerEsc}\\b`,
      "i"
    );
    let out = opinion;
    if (vestedRe.test(out)) {
      out = out.replace(
        vestedRe,
        `the most-recent in-conveyance of record names ${currentOwner} as grantee, but — because a critical chain break and/or an unreconciled out-conveyance is open below — record title is NOT shown vested in ${currentOwner}`
      );
    } else {
      // Fallback: catch a bare "vested in <OWNER>" anywhere in the opinion.
      out = out.replace(
        new RegExp(`\\bvested in\\s+${ownerEsc}\\b`, "ig"),
        `named as the most-recent in-conveyance grantee (record title NOT yet vested) — ${currentOwner}`
      );
    }
    return out;
  };

  const isAttorney = !!author.barNumber && author.barNumber !== "[BAR NUMBER]";
  const authorName = author.name || "[NAME]";
  const state = author.state || "Georgia";

  // Build the author introduction paragraph
  const authorIntro = isAttorney
    ? `I, ${authorName}, a duly licensed attorney in the State of ${state}, Bar Number ${author.barNumber}, of the firm ${author.firmName || "[FIRM NAME]"}, located at ${author.firmAddress || "[FIRM ADDRESS]"}, have been retained to examine the title to the above-referenced property and render this opinion.`
    : `This title opinion has been prepared by ${authorName}${author.firmName ? `, ${author.firmName}` : ""}${author.firmAddress ? `, ${author.firmAddress}` : ""}, based on a comprehensive examination of public records for the above-referenced property.`;

  // Build signature block
  const signatureBlock = isAttorney
    ? `_______________________________
${authorName}, Esq.
${author.firmName || "[FIRM NAME]"}
${author.firmAddress || "[FIRM ADDRESS]"}
Bar Number: ${author.barNumber}
State of ${state}`
    : `_______________________________
${authorName}
${author.firmName || ""}
${author.firmAddress || ""}
${author.email || ""}`.trim();

  return `
ATTORNEY OPINION LETTER
(Pursuant to Fannie Mae Selling Guide B7-2-06)

══════════════════════════════════════════════
  FANNIE MAE B7-2-06 COMPLIANT
  Generated by Cliros.ai
══════════════════════════════════════════════

Date: ${today}

Property Address: ${report.address.fullAddress}
County: ${report.parcel.county || "[COUNTY]"}
State: ${report.parcel.state || "GA"}
Parcel ID: ${report.parcel.parcelId || "[PARCEL ID]"}
Legal Description: ${legalDescriptionField}

TO: [LENDER NAME — REQUIRED BEFORE SIGNATURE]
    [LENDER ADDRESS — REQUIRED BEFORE SIGNATURE]

RE: Attorney Opinion of Title — ${report.address.fullAddress}

Examination Effective Date: ${report.chainOfTitle.endDate || "[EFFECTIVE DATE]"}
(This opinion speaks as of the search end date above, not the date generated.)${bringDownCaveat}

Dear Sir/Madam:

${authorIntro}

SCOPE OF EXAMINATION

The following records have been examined for the above-referenced property:

1. County Recorder records for ${report.parcel.county || "[COUNTY]"} County, ${report.parcel.state || "GA"}, covering a period of ${report.chainOfTitle.yearsSearched || 25} years (${report.chainOfTitle.startDate || "[START DATE]"} through ${report.chainOfTitle.endDate || "[END DATE]"});
2. Deed records reflecting the chain of title (${report.chainOfTitle.entries.length} conveyances reviewed);
3. Mortgage and lien records;
4. Judgment and tax lien records;
5. UCC filing records;
6. Easement and restriction records.

Data Sources Searched:
• GSCCCA (Georgia Superior Court Clerks' Cooperative Authority) — Deeds, liens, UCC filings, PT-61 transfer tax
• Federal Courts — Bankruptcy filings, federal tax liens via CourtListener/PACER
• Georgia Superior Court Records — Judgments, lis pendens

CHAIN OF TITLE

Based on examination of the records, the chain of title for the subject property is ${report.chainOfTitle.breaks.length === 0 ? "unbroken and continuous" : "as follows, with noted breaks"} from ${report.chainOfTitle.startDate || "[START DATE]"} to the present date.

Most recent conveyance:
- Grantor: ${report.chainOfTitle.entries[report.chainOfTitle.entries.length - 1]?.grantor || "[GRANTOR]"}
- Grantee: ${report.chainOfTitle.entries[report.chainOfTitle.entries.length - 1]?.grantee || "[GRANTEE]"}
- Date: ${recDate(report.chainOfTitle.entries[report.chainOfTitle.entries.length - 1]?.recordedDate)}
- ${recordRef(report.chainOfTitle.entries[report.chainOfTitle.entries.length - 1]?.bookPage, report.chainOfTitle.entries[report.chainOfTitle.entries.length - 1]?.instrumentNumber)}

${
  report.chainOfTitle.entries.length > 1
    ? `Full Chain of Title (${report.chainOfTitle.entries.length} conveyances):

${report.chainOfTitle.entries
  .map(
    (e, i) =>
      `${i + 1}. ${e.grantor || "?"} → ${e.grantee || "?"} | ${e.type || "other"} | ${recDate(
        e.recordedDate
      )} | ${recordRef(e.bookPage, e.instrumentNumber)}`
  )
  .join("\n")}`
    : ""
}

LIENS AND ENCUMBRANCES

${
  activeLiens.length === 0
    ? "No active liens or encumbrances were found against the subject property."
    : `The following active liens were found against the subject property:

${activeLiens
  .map(
    (l, i) =>
      `${i + 1}. ${l.type.charAt(0).toUpperCase() + l.type.slice(1)} — ${l.creditor}
   Amount: ${l.amount ? "$" + l.amount.toLocaleString() : "Unknown"}
   Recorded: ${recDate(l.recordedDate)}
   ${recordRef(l.bookPage, l.instrumentNumber)}`
  )
  .join("\n\n")}`
}

EASEMENTS AND RESTRICTIONS

${
  report.easements.length === 0
    ? "No easements or restrictions were found that would materially affect the marketability of title."
    : `The following easements/restrictions were noted:

${report.easements.map((e, i) => `${i + 1}. ${e.type.charAt(0).toUpperCase() + e.type.slice(1)} Easement — ${e.description}`).join("\n")}`
}

TITLE DEFECTS

${
  report.defects.length === 0
    ? "No title defects were found that would materially affect the marketability of title to the subject property."
    : `The following defects were noted and should be addressed prior to closing:

${[...report.defects]
  // Render EVERY defect (critical → major → minor → info) so the count here
  // matches the OPINION qualifications, the action-plan total, and the
  // marketability "N clustered checklist items" — a reader can count them all
  // and the four surfaces agree. Most-serious first.
  .sort((a, b) => {
    const rank: Record<string, number> = { critical: 0, major: 1, minor: 2, info: 3 };
    return (rank[a.severity] ?? 4) - (rank[b.severity] ?? 4);
  })
  .map((d, i) => `${i + 1}. [${d.severity.toUpperCase()}] ${d.title} — ${d.description}\n   Recommendation: ${d.recommendation}`)
  .join("\n\n")}`
}

MARKETABILITY ASSESSMENT

${(() => {
  // Derive the clustered checklist count from the SAME action plan the dossier
  // ships, so the marketability line and the action-plan summary never disagree
  // (the prior audit caught "6 clustered items" here vs "5 items" in the plan —
  // two independent counts). actionPlanTotal makes computeTitleMetrics use the
  // plan's post-clustering, post-dedup total instead of recomputing its own.
  const plan = buildAttorneyActionPlan(report);
  const m = computeTitleMetrics({
    riskScore: report.riskScore,
    liens: report.liens,
    defects: report.defects,
    actionPlanTotal: plan.summary.total,
    autoResolvedReleased: plan.summary.autoResolvedReleased,
    purchaseMoneyMortgageCount: plan.summary.purchaseMoneyMortgageCount,
  });
  return `${m.marketabilityLabel} — ${m.marketabilityDetail}\n\nThis label reflects checklist items derived from indexed records; it is not an insurable-title opinion. The signing attorney verifies indexed records and pulls deed images before issuing the opinion below.`;
})()}

${report.summary || ""}

OPINION

${vestingCaveat}${
  opinionOverride && opinionOverride.trim().length > 0
    ? applyVestingHonesty(opinionOverride.trim())
    : `Based on examination of the records described above, it is the professional opinion that:

${
  !hasDefects && report.chainOfTitle.breaks.length === 0
    ? `1. The title to the subject property is vested in ${currentOwner};

2. The title is marketable and insurable, subject to the liens, easements, and encumbrances noted above;

3. There are no unreleased mortgages, unsatisfied judgments, tax liens, or other encumbrances that would materially affect the marketability of title, other than those specifically identified in this letter;

4. The chain of title is unbroken and continuous for the period examined.`
    : `[REVIEW REQUIRED — Title defects or chain breaks were identified that require professional judgment before this opinion can be completed. Please review the defects noted above and determine whether they can be cured prior to closing.]`
}`
}

This opinion is rendered as of the date hereof and is based solely on the records examined. This opinion does not constitute title insurance and does not protect against defects that may not appear in the public records, including but not limited to: forgery, incapacity, undisclosed heirs, or boundary disputes.

This opinion is issued in compliance with the requirements set forth in the Fannie Mae Selling Guide, Section B7-2-06, and may be relied upon by the lender identified above in connection with the mortgage loan secured by the subject property.

Respectfully submitted,


${signatureBlock}

Date: ${today}


══════════════════════════════════════════════
  GENERATED BY CLIROS.AI
  Fannie Mae B7-2-06 Compliant
══════════════════════════════════════════════
This document was generated using AI-assisted title search technology.
All data sourced from GSCCCA, Georgia Superior Courts, and federal
court records. ${isAttorney ? "The signing attorney verifies the findings and exercises independent professional judgment before issuing the opinion." : "This draft should be reviewed by a licensed attorney before being used for closing purposes."}

Report ID: ${report.id}
Generated: ${today}
  `.trim();
}
