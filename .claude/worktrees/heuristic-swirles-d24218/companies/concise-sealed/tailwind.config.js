/** @type {import('tailwindcss').Config} */
const defaultTheme = require('tailwindcss/defaultTheme')

/**
 * Design tokens — civic-trust redesign (May 2026).
 *
 *   Base ............ parchment (#faf7ef / #f4ede0 / #ece2cd)
 *   Ink ............. deep navy (#0f1f3a / #1a2744) — body & display
 *   Civic red ....... #a4243b (muted brick, NOT fire-engine) — BROKEN + key CTAs
 *   Civic blue ...... #2a4d7c (institutional, link/KEPT-leaning)
 *   Gold rule ....... #b08a3e (hairline dividers in trust strip / verdict frame)
 *
 *   Verdicts (one step muted to sit on cream):
 *     KEPT ........ pine #2f6a48
 *     PARTIAL ..... ochre #a86b1a
 *     BROKEN ...... civic-red #a4243b
 *     BLOCKED ..... slate-blue #4a5a78
 *     READER ...... aubergine #6b3a78
 *
 * Type: **Source Serif** body fallback / **Lora** display via next/font.
 * Buttons live in `globals.css` @layer components.
 */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-sealed-body)', ...defaultTheme.fontFamily.sans],
        serif: ['var(--font-sealed-display)', 'Georgia', 'serif'],
        'sealed-display': ['var(--font-sealed-display)', 'Georgia', 'serif'],
      },
      colors: {
        parchment: {
          50: '#fdfbf6',
          100: '#faf7ef',
          200: '#f4ede0',
          300: '#ece2cd',
          400: '#d9caab',
        },
        ink: {
          900: '#0f1f3a',
          800: '#1a2744',
          700: '#2a3656',
          600: '#465475',
          500: '#6b7896',
          400: '#9098ad',
        },
        civic: {
          red: '#a4243b',
          'red-dark': '#7e1a2c',
          'red-soft': '#f1d9dd',
          blue: '#2a4d7c',
          'blue-dark': '#1a3558',
          'blue-soft': '#dde6f1',
          gold: '#b08a3e',
          'gold-soft': '#e8d9b0',
        },
        verdict: {
          kept: '#2f6a48',
          'kept-soft': '#dbe9df',
          partial: '#a86b1a',
          'partial-soft': '#f1e3cb',
          broken: '#a4243b',
          'broken-soft': '#f1d9dd',
          blocked: '#4a5a78',
          'blocked-soft': '#dde2eb',
          reader: '#6b3a78',
          'reader-soft': '#e6dbed',
        },
      },
      letterSpacing: {
        eyebrow: '0.18em',
      },
      boxShadow: {
        'civic-card': '0 1px 2px rgba(15, 31, 58, 0.04), 0 6px 24px rgba(15, 31, 58, 0.06)',
        'civic-lift': '0 2px 8px rgba(15, 31, 58, 0.06), 0 24px 48px rgba(15, 31, 58, 0.09)',
      },
    },
  },
  plugins: [],
}
