/* ─── Chain of title display + data-quality filters ───
   GSCCCA name-index rows often include junk (Unknown, lot numbers, self-transfers).
   UI shows recent conveyances first; full history in appendix / show-more.
*/

export const CHAIN_DISPLAY_YEARS = 10;
export const CHAIN_DEFAULT_VISIBLE = 15;

export interface ChainRow {
  grantor?: string;
  grantee?: string;
  recordedDate?: string;
  date?: string;
  type?: string;
  instrument?: string;
  instrumentType?: string;
  book?: string;
  page?: string;
  bookPage?: string;
  consideration?: number;
}

/** Party name is index noise — not a real grantor/grantee for chain display. */
export function isJunkPartyName(name?: string): boolean {
  const s = (name || "").trim();
  if (!s) return true;
  const u = s.toUpperCase();
  if (u === "UNKNOWN" || u === "UNK" || u === "N/A" || u === "NONE") return true;
  if (/^\d+$/.test(s)) return true;
  if (/^(LOT|BLOCK|UNIT|SUBDIVISION|SEC|SECTION)\b/i.test(s)) return true;
  if (s.length <= 2) return true;
  return false;
}

export function isSelfTransfer(grantor?: string, grantee?: string): boolean {
  const g = (grantor || "").trim().toUpperCase();
  const e = (grantee || "").trim().toUpperCase();
  if (!g || !e) return false;
  return g === e;
}

/** Drop rows that should never appear in a conveyance timeline. */
export function isJunkChainEntry(e: ChainRow): boolean {
  if (isSelfTransfer(e.grantor, e.grantee)) return true;
  if (isJunkPartyName(e.grantor) && isJunkPartyName(e.grantee)) return true;
  return false;
}

export function chainEntryDate(e: ChainRow): number {
  return new Date(e.recordedDate || e.date || "").getTime() || 0;
}

export function formatInstrumentLabel(e: ChainRow): string {
  const raw = (e.instrumentType || e.instrument || e.type || "").trim();
  if (!raw) return "DEED";
  const u = raw.toUpperCase();
  if (u.length <= 6 && /^[A-Z]+$/.test(u)) return u;
  if (u === "OTHER") return "RECORD";
  return raw.replace(/_/g, " ").toUpperCase();
}

export function prepareChainForDisplay(
  entries: ChainRow[],
  opts?: { years?: number; maxVisible?: number },
): {
  recentSorted: ChainRow[];
  visible: ChainRow[];
  hiddenRecentCount: number;
  olderCount: number;
  totalCount: number;
  filteredJunkCount: number;
} {
  const years = opts?.years ?? CHAIN_DISPLAY_YEARS;
  const maxVisible = opts?.maxVisible ?? CHAIN_DEFAULT_VISIBLE;
  const cutoff = new Date();
  cutoff.setFullYear(cutoff.getFullYear() - years);

  const cleaned = entries.filter((e) => !isJunkChainEntry(e));
  const filteredJunkCount = entries.length - cleaned.length;

  const recentSorted = [...cleaned]
    .filter((e) => {
      const t = chainEntryDate(e);
      return t >= cutoff.getTime();
    })
    .sort((a, b) => chainEntryDate(b) - chainEntryDate(a));

  const olderCount = cleaned.filter((e) => chainEntryDate(e) < cutoff.getTime()).length;
  const visible = recentSorted.slice(0, maxVisible);
  const hiddenRecentCount = Math.max(0, recentSorted.length - visible.length);

  return {
    recentSorted,
    visible,
    hiddenRecentCount,
    olderCount,
    totalCount: cleaned.length,
    filteredJunkCount,
  };
}
