/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'sans-serif'],
        serif: ['var(--font-instrument)', 'ui-serif', 'Georgia', 'serif'],
        display: ['var(--font-bricolage)', 'Bricolage Grotesque', 'sans-serif'],
        mono: ['var(--font-plex-mono)', 'IBM Plex Mono', 'monospace'],
      },
      // CR brand (audit-document / paper-receipt family) on a dark device canvas.
      // The neon trading-era palette (#FF005E pink / #00FF66 green) is DEAD — audit
      // 2026-07-02. Accent = civic red, lifted to #D45B54 for dark-bg text (measured
      // 5.11:1 on #0B0A09, AA; raw #B23A3A is 3.35:1 and reserved for paper surfaces).
      colors: {
        background: '#0B0A09', // near-black warm canvas
        surface: '#14110E', // warm near-black (was pink-tinted #11010A)
        surfaceHover: '#1C1814',
        border: 'rgba(255, 255, 255, 0.1)',
        primary: {
          DEFAULT: '#F9FAFB', // Near white
          hover: '#E5E7EB',
          glow: 'rgba(255, 255, 255, 0.2)',
        },
        accent: {
          DEFAULT: '#D45B54', // civic red, dark-bg text-safe (5.11:1)
          hover: '#C94F4F',
          glow: 'rgba(212, 91, 84, 0.45)',
        },
        success: {
          DEFAULT: '#3FA46A', // calm green (6.34:1) — was neon #00FF66
          glow: 'rgba(63, 164, 106, 0.35)',
          bg: 'rgba(63, 164, 106, 0.10)',
        },
        danger: {
          DEFAULT: '#D45B54',
          glow: 'rgba(212, 91, 84, 0.4)',
          bg: 'rgba(212, 91, 84, 0.10)',
        },
        warning: {
          DEFAULT: '#E8A33D', // gold (9.17:1) — was UNDEFINED (border-warning silently no-op'd)
          bg: 'rgba(232, 163, 61, 0.10)',
        },
        // First-class brand tokens — migrate components off hard-coded hexes onto these.
        paper: { DEFAULT: '#F4EFE6', bright: '#FAF6EF', edge: '#EBE3D0' },
        navy: { DEFAULT: '#16263D', ink: '#1A1815' },
        civic: { DEFAULT: '#B23A3A', deep: '#A8423E' },
        gold: { DEFAULT: '#C8861D', bright: '#E8A33D' },
        text: {
          main: '#F9FAFB',
          muted: '#9A948C', // warmed + lifted from #8A8A8A
        }
      },
      boxShadow: {
        glow: '0 0 20px -5px var(--tw-shadow-color)',
        glass: '0 8px 32px 0 rgba(0, 0, 0, 0.3)',
        card: '0 24px 48px -12px rgba(0, 0, 0, 0.8)', // soft large blur, negative spread
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'glass-gradient': 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(255, 255, 255, 0.01) 100%)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        'slide-up': 'slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'pulse-glow': 'pulseGlow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shimmer': 'shimmer 2s infinite linear',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseGlow: {
          '0%, 100%': { opacity: '1', filter: 'brightness(1)' },
          '50%': { opacity: '.8', filter: 'brightness(1.2)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-1000px 0' },
          '100%': { backgroundPosition: '1000px 0' },
        }
      },
    },
  },
  plugins: [],
}
