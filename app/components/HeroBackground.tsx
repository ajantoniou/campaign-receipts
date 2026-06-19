'use client'

export default function HeroBackground() {
  return (
    <div className="absolute inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* Grid */}
      <div className="absolute inset-0 bg-hero-grid" />
      {/* Glow */}
      <div className="absolute inset-0 bg-hero-glow" />
      {/* Subtle vignette at bottom */}
      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-ink-950 via-ink-950/50 to-transparent" />
    </div>
  )
}
