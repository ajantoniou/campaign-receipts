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
        display: ['var(--font-bricolage)', 'Bricolage Grotesque', 'sans-serif'],
        mono: ['var(--font-plex-mono)', 'IBM Plex Mono', 'monospace'],
      },
      colors: {
        background: '#0B0A09', // Near black
        surface: '#11010A', // Near black with slight warm/pink tint
        surfaceHover: '#1A020F',
        border: 'rgba(255, 255, 255, 0.1)',
        primary: {
          DEFAULT: '#F9FAFB', // Near white
          hover: '#E5E7EB',
          glow: 'rgba(255, 255, 255, 0.2)',
        },
        accent: {
          DEFAULT: '#FF005E', // Neon Pink
          hover: '#E60055',
          glow: 'rgba(255, 0, 94, 0.5)',
        },
        success: {
          DEFAULT: '#00FF66', // Neon Green
          glow: 'rgba(0, 255, 102, 0.4)',
          bg: 'rgba(0, 255, 102, 0.1)',
        },
        danger: {
          DEFAULT: '#FF005E', // Use accent pink for danger
          glow: 'rgba(255, 0, 94, 0.4)',
          bg: 'rgba(255, 0, 94, 0.1)',
        },
        text: {
          main: '#F9FAFB',
          muted: '#8A8A8A',
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
