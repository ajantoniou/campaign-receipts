// ViralPack — creator-facing share package on politician dossier.
//
// Per ChatGPT audit + 4-expert panel TikTok creator persona (2026-05-20):
// "If you do this I'll repost 3x/week from your site forever." Give a
// creator a copy-paste caption, a copy-paste source line, and two
// download formats (1080x1350 for Instagram/X/LinkedIn, 1080x1920 for
// TikTok/Reels/Shorts) — no thinking required.
//
// Server-rendered for the data (we already have the claim from
// lib/build-claim-sentence.ts); CopyChip is the only client piece.
//
// Renders nothing if claim is null (politician with no FEC/scorecard
// data we can confidently surface). Caller decides whether to skip
// the block entirely or render its own fallback.

import { type ClaimData } from '@/lib/build-claim-sentence'
import CopyChip from './CopyChip'

type Props = {
  /** Politician slug — used to build the PNG download URLs. */
  slug: string
  /** Pre-computed claim data from buildClaim(slug). Null = no render. */
  claim: ClaimData | null
}

export default function ViralPack({ slug, claim }: Props) {
  if (!claim) return null

  return (
    <div className="rounded-lg border border-line bg-paper-2 p-4 sm:p-5">
      <div className="flex items-baseline justify-between gap-2 mb-3 flex-wrap">
        <div className="font-mono text-[10px] uppercase tracking-[0.22em] text-broken inline-flex items-center gap-2">
          <span className="size-1.5 rounded-full bg-broken" aria-hidden />
          Viral Pack · for creators
        </div>
        <span className="font-mono text-[9px] uppercase tracking-[0.16em] text-ink-3">
          {claim.citeId}
        </span>
      </div>

      <ul className="m-0 p-0 list-none space-y-3">
        {/* Caption */}
        <li className="flex flex-col gap-2 sm:flex-row sm:items-start sm:gap-4">
          <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-3 shrink-0 w-[88px] pt-[2px]">
            Caption
          </span>
          <div className="flex-1 min-w-0 flex items-start justify-between gap-3 flex-wrap">
            <p className="font-sans text-[13px] sm:text-[14px] leading-[1.45] text-ink m-0 flex-1 min-w-[200px]">
              {claim.caption}
            </p>
            <CopyChip value={claim.caption} label="Copy caption" copiedLabel="Copied" />
          </div>
        </li>

        {/* Source line */}
        <li className="flex flex-col gap-2 sm:flex-row sm:items-start sm:gap-4">
          <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-3 shrink-0 w-[88px] pt-[2px]">
            Source
          </span>
          <div className="flex-1 min-w-0 flex items-start justify-between gap-3 flex-wrap">
            <p className="font-sans text-[13px] leading-[1.45] text-ink-2 m-0 flex-1 min-w-[200px]">
              {claim.sourceLine}
            </p>
            <CopyChip value={claim.sourceLine} label="Copy source" copiedLabel="Copied" />
          </div>
        </li>

        {/* Strip PNG (square-ish, IG/X/LI) */}
        <li className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:gap-4 pt-2 border-t border-dotted border-line">
          <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-3 shrink-0 w-[88px]">
            Strip PNG
          </span>
          <a
            href={`/api/card/strip/${slug}`}
            download
            className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink hover:text-amber-text transition-colors underline underline-offset-4 decoration-line hover:decoration-amber-text"
          >
            ↓ 1080×1350 · Instagram / X / LinkedIn
          </a>
        </li>

        {/* Vertical (1080x1920, TikTok / Reels / Shorts) */}
        <li className="flex flex-col gap-2 sm:flex-row sm:items-baseline sm:gap-4">
          <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-3 shrink-0 w-[88px]">
            Vertical
          </span>
          <a
            href={`/api/card/strip/${slug}?format=vertical`}
            download
            className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink hover:text-amber-text transition-colors underline underline-offset-4 decoration-line hover:decoration-amber-text"
          >
            ↓ 1080×1920 · TikTok / Reels / Shorts
          </a>
        </li>
      </ul>
    </div>
  )
}
