/* ─── Core domain types for Cliros ─── */

export type SearchStatus =
  | "pending"
  | "searching"
  | "analyzing"
  | "complete"
  | "failed";

export type DefectSeverity = "critical" | "major" | "minor" | "info";

export interface PropertyAddress {
  street: string;
  city: string;
  state: string;
  zip: string;
  county?: string;
  fullAddress: string;
}

export interface ParcelInfo {
  parcelId: string;
  county: string;
  state: string;
  legalDescription?: string;
  propertyType?: string;
  acreage?: number;
  assessedValue?: number;
  taxYear?: number;
}

export interface DeedRecord {
  id: string;
  type:
    | "warranty"
    | "limited_warranty"
    | "quitclaim"
    | "special_warranty"
    | "trustee"
    | "executor"          // ESTD — Deed from Estate
    | "gift"              // GIFD
    | "foreclosure"       // FCD — Deed under Power of Sale
    | "sheriff"           // SHFD
    | "tax_sale"          // TAXD
    | "right_of_way"      // RWD
    | "timber"            // TIMD
    | "gas_oil_mineral"   // GOMD
    | "corrective"        // Corrective warranty / quit-claim
    | "court_order"       // ORD — partition / condemnation / etc.
    | "registry_transfer" // REGD
    | "other";
  bookPage?: string;
  instrumentNumber?: string;
  recordedDate: string;
  grantor: string;
  grantee: string;
  consideration?: number;
  notes?: string;
}

export interface LienRecord {
  id: string;
  type:
    | "mortgage"
    | "judgment"
    | "tax"
    | "mechanics"
    | "hoa"
    | "irs"
    | "state"
    | "ucc"
    | "other";
  status: "active" | "released" | "partial" | "unknown";
  creditor: string;
  amount?: number;
  recordedDate: string;
  releasedDate?: string;
  bookPage?: string;
  instrumentNumber?: string;
  notes?: string;
  /** Original SD book-page cited on a cancellation/release row */
  referencedBookPage?: string;
  /** True when this SD was recorded with the current owner's vesting WD
   *  (purchase-money mortgage). Still legally a lien, but not a curative
   *  item — the buyer pays it off at THEIR next sale, not this attorney's
   *  closing. Attorneys still want to see it (loan amount, lender contact
   *  for verification), but it shouldn't drive the marketability label. */
  isPurchaseMoney?: boolean;
}

export interface Easement {
  id: string;
  type: "utility" | "access" | "drainage" | "conservation" | "other";
  description: string;
  recordedDate?: string;
  bookPage?: string;
}

export interface TitleDefect {
  id: string;
  severity: DefectSeverity;
  category: string;
  title: string;
  description: string;
  recommendation: string;
  relatedRecordIds?: string[];
  statute_citation?: string;
  book_page_citation?: string;
}

export interface ChainOfTitle {
  entries: DeedRecord[];
  breaks: string[]; // descriptions of any breaks in chain
  yearsSearched: number;
  startDate: string;
  endDate: string;
}

export interface PropertyImageryRef {
  streetviewStoragePath?: string;
  mapStoragePath?: string;
  capturedAt?: string;
  streetviewMissing?: boolean;
  mapMissing?: boolean;
}

export interface TitleSearchReport {
  id: string;
  userId: string;
  address: PropertyAddress;
  parcel: ParcelInfo;
  chainOfTitle: ChainOfTitle;
  liens: LienRecord[];
  easements: Easement[];
  defects: TitleDefect[];
  status: SearchStatus;
  createdAt: string;
  completedAt?: string;
  summary: string;
  riskScore: number; // 0-100, 0 = clean title
  /** Tom Calloway's persisted AOL draft (post aol_lock). PDF wraps it in firm letterhead. */
  aolDraft?: string;
  /** Optional attorney-edited notes for the client report (plain text). */
  clientReportDraft?: string;
  /** Hero imagery (Street View + Static Map) cached on the property row. */
  imagery?: PropertyImageryRef | Record<string, unknown>;
}

export type { AttorneyActionPlan, ActionPlanItem } from "./attorney-action-plan";

export interface AOLDraft {
  id: string;
  reportId: string;
  content: string; // markdown or HTML of the AOL
  fannieMaeCompliant: boolean;
  generatedAt: string;
  status: "draft" | "reviewed" | "signed";
}

/* ─── Pricing tiers ─── */

export type ProductTier =
  | "quick_lien"
  | "full_search"
  | "full_search_aol"
  | "pro_monthly"
  | "firm_monthly";

export interface PricingTier {
  tier: ProductTier;
  name: string;
  priceUsd: number;
  priceType: "per_report" | "monthly";
  includedReports?: number;
  features: string[];
}

/* ─── User ─── */

export interface User {
  id: string;
  email: string;
  name: string;
  role: "attorney" | "agent" | "investor" | "title_company" | "other";
  state?: string;
  barNumber?: string;
  freeReportsUsed: number;
  freeReportsTotal: number; // default 3
  subscriptionTier?: ProductTier;
  stripeCustomerId?: string;
  createdAt: string;
}
