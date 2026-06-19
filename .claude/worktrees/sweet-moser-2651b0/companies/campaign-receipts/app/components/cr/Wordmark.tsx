// Wordmark — Campaign·Receipts with 7px ink dot replacing the
// middle space. Per claude-design benchmark.
//
// Anatomy:
//   - inline-flex baseline-aligned, gap 6px
//   - Instrument Serif 22px, tracking -0.015em, color --ink
//   - Dot: 7×7px circle, --ink, translateY(-4px) so it sits
//     visually centered with the cap height
//   - Optional tag pill: Geist Mono 10px, uppercase, tracking 0.16em,
//     --ink-3, border 1px --line, padding 3x6, radius 3px,
//     translateY(-2px) — e.g. "BETA", "v3"

// Glyph note (2026-05-30): the leading glyph is now a CAMERA (see
// QuillMark.tsx — name kept for import compatibility). The camera is a
// horizontal silhouette, not a tall feather, so it sits balanced at ~cap
// height; the old 1.25x plume upscale is dropped to ~1.05x.

import Link from 'next/link'
import QuillMark from './QuillMark'

type Props = {
  /** Optional micro-cap tag pill, e.g. "BETA" or "v3" */
  tag?: string
  /** Override size in px. Default 22. */
  size?: number
  /** If true, render as paper-on-ink (use on dark surfaces / footer). */
  inverse?: boolean
  /** Wrapping link href (defaults to "/"). Pass `null` to disable link wrapper. */
  href?: string | null
  /** Show the quill glyph to the left of the wordmark. Default true. */
  icon?: boolean
  className?: string
}

export default function Wordmark({
  tag,
  size = 22,
  inverse = false,
  href = '/',
  icon = true,
  className = '',
}: Props) {
  // Camera glyph is a horizontal silhouette and reads at ~cap height;
  // a touch of upscale (~1.05x) keeps the lens crisp without dominating.
  const glyphSize = Math.round(size * 1.05)
  const inner = (
    <span
      className={`wordmark inline-flex items-center gap-2 ${
        inverse ? 'text-paper [&_.dot]:bg-paper' : ''
      } ${className}`}
      style={{ fontSize: size }}
    >
      {icon && (
        <QuillMark
          size={glyphSize}
          inverse={inverse}
          className="shrink-0"
          decorative
        />
      )}
      <span className="inline-flex items-baseline">
        <span>Campaign</span>
        <span className="dot" aria-hidden />
        <span>Receipts</span>
        {tag && <span className="mono-tag">{tag}</span>}
      </span>
    </span>
  )
  if (href == null) return inner
  return <Link href={href}>{inner}</Link>
}
