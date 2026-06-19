// Brand tokens for all AgentCompanies portfolio sites that ship video.
// Mirrors each company's brand book / tailwind.config — keep in sync.
//
// Sources:
//   nt-ministry      → companies/nt-ministry/brand/visual-system.md
//   campaign-receipts → companies/campaign-receipts/tailwind.config.js
//   estimateproof    → companies/estimateproof/brand/brand-book-v1.md
//   sealed           → companies/concise-sealed/tailwind.config.js

export type BrandId = "nt-ministry" | "campaign-receipts" | "estimateproof" | "sealed" | "cliros" | "healthbrew";

export type BrandTokens = {
  id: BrandId;
  name: string;
  palette: {
    bg: string;
    bgAccent: string;
    ink: string;
    surface: string;
    accent: string;        // civic-red equivalent
    accentAlt?: string;    // civic-blue equivalent
    gold?: string;
    muted?: string;
    rule?: string;
    inkSoft?: string;
    accentText: string;
    captionBg: string;
    captionText: string;
  };
  type: {
    display: string;       // headlines (Instrument Serif, Lora, Merriweather)
    body: string;          // running text
    mono?: string;         // citation / data
  };
  motion: {
    fadeFrames: number;
    holdFrames: number;
  };
};

export const sealed: BrandTokens = {
  id: "sealed",
  name: "SEALED",
  palette: {
    bg: "#faf7ef",         // parchment
    bgAccent: "#f4ede0",
    ink: "#0f1f3a",        // navy
    surface: "#fdfbf6",
    accent: "#a4243b",     // civic-red
    accentAlt: "#2a4d7c",  // civic-blue
    gold: "#b08a3e",
    accentText: "#faf7ef",
    captionBg: "rgba(15, 31, 58, 0.9)",
    captionText: "#faf7ef",
  },
  type: {
    display: "Instrument Serif",
    body: "Lora",
    mono: "IBM Plex Mono",
  },
  motion: { fadeFrames: 6, holdFrames: 75 },
};

export const campaignReceipts: BrandTokens = {
  id: "campaign-receipts",
  name: "Campaign Receipts",
  palette: {
    bg: "#f4ede0",
    bgAccent: "#ece2cd",
    ink: "#0f1f3a",
    surface: "#faf7ef",
    accent: "#a4243b",
    accentAlt: "#2a4d7c",
    gold: "#b08a3e",
    accentText: "#faf7ef",
    captionBg: "rgba(15, 31, 58, 0.92)",
    captionText: "#faf7ef",
  },
  type: {
    display: "Instrument Serif",
    body: "Lora",
    mono: "IBM Plex Mono",
  },
  motion: { fadeFrames: 6, holdFrames: 75 },
};

export const ntMinistry: BrandTokens = {
  id: "nt-ministry",
  name: "New Testament Only",
  palette: {
    bg: "#1a2332",
    bgAccent: "#d4745f",
    ink: "#2b2b2b",
    surface: "#f4f1e8",
    accent: "#d4745f",
    accentText: "#f4f1e8",
    captionBg: "rgba(26, 35, 50, 0.85)",
    captionText: "#f4f1e8",
  },
  type: { display: "Merriweather", body: "Inter" },
  motion: { fadeFrames: 9, holdFrames: 90 },
};

export const estimateProof: BrandTokens = {
  id: "estimateproof",
  name: "ServiceLedger / CarStack",
  palette: {
    bg: "#0b1220",
    bgAccent: "#111827",
    ink: "#e2e8f0",
    surface: "#111827",
    accent: "#34d399",
    accentText: "#0b1220",
    captionBg: "rgba(17, 24, 39, 0.92)",
    captionText: "#e2e8f0",
  },
  type: { display: "Inter", body: "Inter" },
  motion: { fadeFrames: 8, holdFrames: 90 },
};

export const cliros: BrandTokens = {
  id: "cliros",
  name: "Cliros",
  palette: {
    bg: "#FAF8F3",
    bgAccent: "#F2EEE3",
    ink: "#1A1A1A",
    surface: "#FFFFFF",
    accent: "#1A1A1A",
    accentText: "#FAF8F3",
    captionBg: "rgba(26, 26, 26, 0.92)",
    captionText: "#FAF8F3",
  },
  type: { display: "Instrument Serif", body: "Inter", mono: "IBM Plex Mono" },
  motion: { fadeFrames: 8, holdFrames: 80 },
};

export const healthbrew: BrandTokens = {
  id: "healthbrew",
  name: "HealthBrew",
  palette: {
    bg: "#F5EDD8",          // cream
    bgAccent: "#F8F1DF",
    ink: "#1F2A2E",         // deep slate
    surface: "#FFFFFF",
    accent: "#2A6F8E",      // Mediterranean blue
    accentAlt: "#6B7F3A",   // olive
    gold: "#D9A441",
    accentText: "#FFFFFF",
    captionBg: "rgba(31, 42, 46, 0.92)",
    captionText: "#F5EDD8",
  },
  type: { display: "Fraunces", body: "Inter" },
  motion: { fadeFrames: 10, holdFrames: 60 },
};

export const BRANDS: Record<BrandId, BrandTokens> = {
  "nt-ministry": ntMinistry,
  "campaign-receipts": campaignReceipts,
  estimateproof: estimateProof,
  sealed,
  cliros,
  healthbrew,
};

export const resolveBrand = (id?: string): BrandTokens => {
  if (!id) return sealed;
  return BRANDS[id as BrandId] ?? sealed;
};
