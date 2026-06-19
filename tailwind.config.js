/** @type {import('tailwindcss').Config} */
//
// Tailwind config aligned to claude-design / agent-companies benchmark
// (audit-document aesthetic, paper-warm palette, Instrument Serif +
// Geist + Geist Mono pairing, nonpartisan verdict palette).
//
// Status: MIGRATION IN PROGRESS. The benchmark tokens (paper, line,
// verdict-with-bg-tint, ink-with-only-1/2/3) live alongside legacy
// tokens (ink-{50..950}, parchment-*, authority-*, the old
// kept/broken/partial Tailwind-stock variants). Legacy tokens will
// be removed as each page migrates to benchmark primitives.
//
// Token hierarchy:
//   1. PRIMITIVE  — raw hex (paper, ink, kept, etc.) below in `colors`
//   2. SEMANTIC   — `--shadow-paper`, `--radius-r-lg`, `--ease-paper`
//      live in app/globals.css (CSS custom properties), not here.
//   3. COMPONENT  — `.receipt`, `.stamp`, `.board-row` etc live in
//      app/components.css (we'll create that on this build).

module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      // FONT FAMILIES — Terminal aesthetic
      // ────────────────────────────────────────────────────────────
      fontFamily: {
        // Display = Mono for the Bloomberg Terminal look
        display: ['var(--font-geist-mono)', '"JetBrains Mono"', 'ui-monospace', 'monospace'],
        sans: ['var(--font-geist-sans)', 'Inter', '-apple-system', 'sans-serif'],
        mono: ['var(--font-geist-mono)', '"JetBrains Mono"', 'ui-monospace', 'monospace'],
        editorial: ['var(--font-geist-mono)', '"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },

      // ────────────────────────────────────────────────────────────
      // TYPE SCALE — benchmark sizes (display only; body uses
      // raw Tailwind text-{sm,base,lg} which already covers Geist
      // 14-22px well)
      // ────────────────────────────────────────────────────────────
      fontSize: {
        // Hero H1 (Instrument Serif, fluid)
        'display-xl': ['clamp(3.5rem, 7vw, 5.75rem)', { lineHeight: '0.95', letterSpacing: '-0.025em', fontWeight: '400' }],
        // Section H2
        'display-lg': ['clamp(2.5rem, 5vw, 4.5rem)', { lineHeight: '1.0', letterSpacing: '-0.02em', fontWeight: '400' }],
        // Card / method H3
        'display-md': ['clamp(1.5rem, 2.5vw, 2rem)', { lineHeight: '1.1', letterSpacing: '-0.01em', fontWeight: '400' }],
        // Receipt title
        'display-sm': ['1.625rem', { lineHeight: '1.15', letterSpacing: '-0.01em', fontWeight: '400' }],
        // Stat-tile in-card number
        'stat': ['4.75rem', { lineHeight: '1', letterSpacing: '-0.03em', fontWeight: '400' }],
        // Share-tile mega number (OG image use)
        'bignum': ['13.75rem', { lineHeight: '0.9', letterSpacing: '-0.04em', fontWeight: '400' }],
        // Editorial blockquote (body) / share-tile blockquote
        'quote': ['1.625rem', { lineHeight: '1.25', letterSpacing: '-0.01em', fontWeight: '400' }],
      },

      // ────────────────────────────────────────────────────────────
      // COLORS — benchmark palette
      // ────────────────────────────────────────────────────────────
      colors: {
        // ── Paper (dark mode terminal background) ─────────────
        paper: {
          DEFAULT: '#0D1117',
          2: '#161B22',
          3: '#21262D',
        },
        line: {
          DEFAULT: '#30363D',
          soft: '#21262D',
        },

        // ── Terminal Neon accents ────────────────────────────────────
        neon: {
          green: '#00FF00',
          red: '#FF0000',
        },

        // ── Ink (text + primary light surfaces) ───────────────────
        ink: {
          DEFAULT: '#C9D1D9',
          1: '#C9D1D9',      // benchmark --ink
          2: '#8B949E',      // benchmark --ink-2
          3: '#484F58',      // benchmark --ink-3
          mute: '#8B949E',   // benchmark --mute
          // Legacy aliases (mapped to new light text)
          50: '#C9D1D9',     
          100: '#C9D1D9',    
          200: '#8B949E',    
          300: '#8B949E',    
          400: '#484F58',    
          500: '#484F58',    
          600: '#8B949E',    
          700: '#30363D',    
          800: '#21262D',    
          900: '#161B22',    
          950: '#0D1117',    
        },

        // ── Verdict palette (nonpartisan, fixed across portfolio) ──
        // Each verdict has: stroke (--name), bg fill (--name-bg),
        // soft tint (--name-tint). Stamps use stroke + tint. Bars
        // use stroke. Tile fills use tint.
        kept: {
          DEFAULT: '#4F7A4B',
          bg: '#DCE8D2',
          tint: '#EEF3E2',
          // Legacy 400/500/600 — keep pointing at the benchmark stroke
          // so existing classes don't break. Once migration completes
          // we delete the numbered variants.
          400: '#4F7A4B',
          500: '#4F7A4B',
          600: '#3F6A3B',
        },
        partial: {
          DEFAULT: '#A37222',
          bg: '#F1DDB3',
          tint: '#F6EAC9',
          400: '#A37222',
          500: '#A37222',
          600: '#83621A',
        },
        broken: {
          DEFAULT: '#A8423E',
          bg: '#F1CFCC',
          tint: '#F4DDDA',
          400: '#A8423E',
          500: '#A8423E',
          600: '#88332E',
        },
        pending: {
          DEFAULT: '#4F6480',
          bg: '#D2DBE6',
          tint: '#E1E7EE',
          400: '#4F6480',
          500: '#4F6480',
          600: '#3F5470',
        },
        decide: {
          DEFAULT: '#5C5246',
          bg: '#DCD3BF',
          tint: '#E8E0CC',
          400: '#5C5246',
          500: '#5C5246',
          600: '#4C4236',
        },

        // ── Legacy palettes (DO NOT USE in new components) ────────
        // Slated for removal once every page migrates. Kept now so
        // the existing dark-themed pages keep building.
        // Legacy parchment scale — remapped to paper tokens so legacy
        // markup using bg-parchment-50/border-parchment-200 inherits the
        // benchmark paper-warm look without per-file migration.
        parchment: {
          50: '#FAF6EF',   // → paper (canonical body bg)
          100: '#F4EEDF',  // → paper-2
          200: '#E0D8C3',  // → line (subtle border)
          300: '#EBE3D0',  // → paper-3
        },
        // Legacy authority-blue scale — remapped to ink so legacy
        // text-authority-600/hover:text-authority-700 links render as
        // ink underlines on paper (matches benchmark voice). Lost the
        // blue tint, gained readability and brand consistency.
        authority: {
          400: '#3D3833',  // → ink-2
          500: '#1A1815',  // → ink
          600: '#1A1815',  // → ink (canonical link color on paper)
          700: '#1A1815',  // → ink (hover same; underline opacity = visual diff)
        },
      },

      // ────────────────────────────────────────────────────────────
      // RADII — benchmark
      // ────────────────────────────────────────────────────────────
      borderRadius: {
        'r-sm': '4px',
        'r': '8px',
        'r-lg': '14px',
      },

      // ────────────────────────────────────────────────────────────
      // SHADOWS — benchmark
      // ────────────────────────────────────────────────────────────
      boxShadow: {
        paper: '0 1px 0 rgba(26,24,21,0.04), 0 12px 28px -18px rgba(26,24,21,0.18)',
        stamp: '0 0 0 1px rgba(26,24,21,0.05)',
      },

      // ────────────────────────────────────────────────────────────
      // SPACING — benchmark section padding
      // ────────────────────────────────────────────────────────────
      spacing: {
        // Section vertical pad (desktop)
        'section-y': '6rem', // 96px
        // Section horizontal pad
        'section-x': '3rem', // 48px
      },

      // ────────────────────────────────────────────────────────────
      // ANIMATIONS — only what earns its keep. Per design-lead
      // verdict: ScorecardBar fill is the one motion we keep.
      // Hero pulse-dot stays. Nothing else.
      // ────────────────────────────────────────────────────────────
      animation: {
        'fade-in': 'fadeIn 0.6s ease-out forwards',
        'fade-up': 'fadeUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'fill-in': 'fillIn 900ms cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'pulse-dot': 'pulseDot 2s infinite',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        fillIn: {
          from: { transform: 'scaleX(0)', transformOrigin: 'left' },
          to: { transform: 'scaleX(1)', transformOrigin: 'left' },
        },
        pulseDot: {
          '0%':   { transform: 'scale(0.9)', opacity: '0.5' },
          '100%': { transform: 'scale(1.8)', opacity: '0' },
        },
      },

      // ────────────────────────────────────────────────────────────
      // BACKGROUNDS — dotted hero pattern
      // ────────────────────────────────────────────────────────────
      backgroundImage: {
        // Dotted-grid hero texture, masked top-to-bottom.
        'dotted-grid': 'radial-gradient(circle at 1px 1px, rgba(26,24,21,0.07) 1px, transparent 0)',
      },
      backgroundSize: {
        'dotted-grid': '28px 28px',
      },
    },
  },
  plugins: [],
}
