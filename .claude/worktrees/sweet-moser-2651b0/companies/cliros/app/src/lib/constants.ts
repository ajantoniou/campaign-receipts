/* ─── Cliros Constants ─── */

export const SITE_NAME = "Cliros";
export const SITE_TAGLINE = "Title intelligence in minutes, not days.";
export const SITE_DOMAIN = "cliros.ai";
export const SITE_URL =
  process.env.NODE_ENV === "production"
    ? "https://cliros.ai"
    : "http://localhost:3000";

// Pricing (cents)
export const PRICING = {
  QUICK_LIEN: { cents: 2500, label: "Quick Lien Check", min: 2500, max: 5000 },
  FULL_SEARCH: { cents: 10000, label: "Full Title Search" },
  FULL_SEARCH_AOL: { cents: 15000, label: "Full Search + AOL Draft" },
  PRO_MONTHLY: { cents: 49900, label: "Pro", includedReports: 10 },
  FIRM_MONTHLY: { cents: 99900, label: "Firm", includedReports: 25 },
} as const;

// Free trial
export const FREE_TRIAL_REPORTS = 3;

// Supported launch states (Phase 1)
export const LAUNCH_STATES = ["GA", "NC", "MA"] as const;

// Search status progression
export const SEARCH_STEPS = [
  { key: "pending", label: "Initializing search...", duration: 800 },
  { key: "searching", label: "Searching county records...", duration: 1400 },
  { key: "analyzing", label: "Analyzing chain of title...", duration: 1300 },
  { key: "complete", label: "Report ready!", duration: 0 },
] as const;
