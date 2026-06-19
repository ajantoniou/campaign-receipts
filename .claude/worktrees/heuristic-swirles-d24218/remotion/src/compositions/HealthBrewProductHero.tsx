import { AbsoluteFill } from 'remotion'
import { resolveBrand } from '../brand/tokens'
import { loadAllFonts } from '../brand/fonts'

loadAllFonts()

// HealthBrewProductHero — 1080×1080 square still for product listings.
// Used as the LemonSqueezy subscription product image. Brand-quiet:
// the mug, the tagline, and a small Holi-inspired pastel splash bloom.

export type HealthBrewProductHeroProps = {
  brand?: string
  headline?: string
  subline?: string
}

export const HealthBrewProductHero: React.FC<HealthBrewProductHeroProps> = ({
  brand = 'healthbrew',
  headline = 'Brew more good days.',
  subline = 'A nightly habit tracker & journal.',
}) => {
  const b = resolveBrand(brand)
  const ink = b.palette.ink
  const blue = b.palette.accent
  const olive = b.palette.accentAlt ?? '#6B7F3A'
  const gold = b.palette.gold ?? '#D9A441'
  const terracotta = '#C25A3C'

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(180deg, ${b.palette.bgAccent} 0%, ${b.palette.bg} 100%)`,
        fontFamily: b.type.body,
      }}
    >
      {/* Pastel splash bloom — top-right Holi accent */}
      <AbsoluteFill style={{ opacity: 0.85 }}>
        <svg viewBox="0 0 1080 1080" width="1080" height="1080">
          <defs>
            <filter id="ls-blur" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="20" />
            </filter>
          </defs>
          <ellipse cx="900" cy="180" rx="220" ry="140" fill="#F3B7C3" opacity="0.55" filter="url(#ls-blur)" transform="rotate(-12 900 180)" />
          <ellipse cx="980" cy="280" rx="150" ry="90" fill="#F5E6A3" opacity="0.55" filter="url(#ls-blur)" transform="rotate(18 980 280)" />
          <ellipse cx="160" cy="900" rx="200" ry="120" fill="#D8C5E8" opacity="0.50" filter="url(#ls-blur)" transform="rotate(24 160 900)" />
          <ellipse cx="320" cy="980" rx="180" ry="100" fill="#C8E0CC" opacity="0.55" filter="url(#ls-blur)" transform="rotate(-8 320 980)" />
          <ellipse cx="80" cy="120" rx="120" ry="80" fill="#F6CFAE" opacity="0.55" filter="url(#ls-blur)" transform="rotate(-22 80 120)" />
        </svg>
      </AbsoluteFill>

      {/* The mug — large, centered-low */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          marginTop: -60,
        }}
      >
        <svg viewBox="0 0 320 320" width="380" height="380" aria-hidden>
          {/* Mug body */}
          <path
            d="M70 130 H230 V250 A30 30 0 0 1 200 280 H100 A30 30 0 0 1 70 250 Z"
            fill={blue}
          />
          {/* Inner highlight */}
          <ellipse cx="150" cy="138" rx="74" ry="10" fill="#1E536B" opacity="0.35" />
          {/* Handle */}
          <path
            d="M230 158 H262 A28 28 0 0 1 262 218 H230"
            stroke={blue}
            strokeWidth="14"
            fill="none"
            strokeLinecap="round"
          />
          {/* Three steam strands — sound mind, sound body, the giving */}
          <path d="M105 95 C 105 75, 125 75, 125 55" stroke={olive} strokeWidth="9" strokeLinecap="round" fill="none" />
          <path d="M150 100 C 150 78, 170 78, 170 58" stroke={terracotta} strokeWidth="9" strokeLinecap="round" fill="none" />
          <path d="M195 95 C 195 75, 215 75, 215 55" stroke={gold} strokeWidth="9" strokeLinecap="round" fill="none" />
        </svg>
      </div>

      {/* Headline + subline */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 760,
          textAlign: 'center',
          color: ink,
          padding: '0 80px',
        }}
      >
        <div
          style={{
            fontFamily: 'Inter, system-ui, sans-serif',
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            fontSize: 18,
            color: '#1E536B',
            fontWeight: 600,
            marginBottom: 18,
          }}
        >
          HealthBrew
        </div>
        <div
          style={{
            fontFamily: b.type.display,
            fontSize: 96,
            fontWeight: 700,
            lineHeight: 1.02,
            letterSpacing: '-0.02em',
          }}
        >
          {headline}
        </div>
        <div
          style={{
            fontFamily: b.type.display,
            fontSize: 32,
            color: '#3A4A4F',
            marginTop: 22,
            fontStyle: 'italic',
            letterSpacing: '-0.005em',
          }}
        >
          {subline}
        </div>
      </div>
    </AbsoluteFill>
  )
}
