// QuillMark — the CampaignReceipts brand glyph. (Name kept for import
// compatibility — see index.ts + Wordmark.tsx; the glyph is now a CAMERA,
// not a feather quill.)
//
// Per founder brand direction 2026-05-30: REPLACE the feather-quill glyph
// (prior "rev-7 / constitutional-fathers' ink pen" direction) with a clean
// CAMERA / SNAPSHOT glyph. The new site thesis is investigative — "the deal,
// caught on camera" (hero = a cash-handoff photographed from a tourist crowd).
// A point-and-shoot camera fits that thesis; the quill did not.
//
// Anatomy (flat, 2-token, crisp — NOT a detailed DSLR):
//   - body     → ink stroke + transparent fill (the camera silhouette)
//   - viewfinder hump → ink (the raised top-plate bump)
//   - lens     → broken-coral ring + fill (the verdict-palette accent, like
//                the plume was — reads as the "shutter/aperture caught it")
//   - shutter button → ink dot, top-right
//
// All colors via direct hex so the icon renders identically inside next/og
// (favicon path) and inline JSX (header path). Inverse swaps to paper-on-ink.

type Props = {
  /** Pixel size (square). Default 22 to match Wordmark cap-height. */
  size?: number
  /** If true, swap to paper-on-ink palette for use on dark surfaces. */
  inverse?: boolean
  className?: string
  /** Hide from a11y tree (decorative). Default true. */
  decorative?: boolean
}

export default function QuillMark({
  size = 22,
  inverse = false,
  className = '',
  decorative = true,
}: Props) {
  const body = inverse ? '#FAF6EF' : '#1A1815'
  const lens = inverse ? '#FAF6EF' : '#A8423E'
  const lensShade = inverse ? '#E0D8C3' : '#8A322F'

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden={decorative ? true : undefined}
      role={decorative ? undefined : 'img'}
      aria-label={decorative ? undefined : 'CampaignReceipts'}
    >
      {/* Viewfinder hump (raised top-plate bump, left of center) */}
      <path
        d="M 9 7 L 9 9.5 L 15 9.5 L 15 7 Z"
        fill={body}
      />
      {/* Camera body — rounded rectangle silhouette */}
      <rect
        x="3.5"
        y="9"
        width="25"
        height="17"
        rx="3"
        stroke={body}
        strokeWidth="2"
        fill="none"
      />
      {/* Lens — broken-coral ring + fill (the verdict-palette accent) */}
      <circle cx="16" cy="17.5" r="5.4" fill={lens} stroke={lensShade} strokeWidth="1.2" />
      {/* Lens inner highlight — paper/body punch-out for a crisp aperture read */}
      <circle cx="16" cy="17.5" r="2" fill={inverse ? '#1A1815' : '#FAF6EF'} />
      {/* Shutter button — ink dot, top-right */}
      <circle cx="24" cy="11.5" r="1.4" fill={lens} />
    </svg>
  )
}
