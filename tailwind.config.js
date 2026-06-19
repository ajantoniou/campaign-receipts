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
        display: ['var(--font-outfit)', 'Outfit', 'sans-serif'],
        mono: ['var(--font-jetbrains)', 'JetBrains Mono', 'monospace'],
      },
      colors: {
        background: '#0B0F19',
        surface: '#111827',
        surfaceHover: '#1F2937',
        border: 'rgba(255, 255, 255, 0.1)',
        primary: {
          DEFAULT: '#3B82F6', // Vibrant Blue
          hover: '#2563EB',
          glow: 'rgba(59, 130, 246, 0.5)',
        },
        accent: {
          DEFAULT: '#8B5CF6', // Vibrant Purple
          hover: '#7C3AED',
          glow: 'rgba(139, 92, 246, 0.5)',
        },
        success: {
          DEFAULT: '#10B981', // Neon Green
          glow: 'rgba(16, 185, 129, 0.4)',
          bg: 'rgba(16, 185, 129, 0.1)',
        },
        danger: {
          DEFAULT: '#EF4444', // Neon Red
          glow: 'rgba(239, 68, 68, 0.4)',
          bg: 'rgba(239, 68, 68, 0.1)',
        },
        text: {
          main: '#F9FAFB',
          muted: '#9CA3AF',
        }
      },
      boxShadow: {
        glow: '0 0 20px -5px var(--tw-shadow-color)',
        glass: '0 8px 32px 0 rgba(0, 0, 0, 0.3)',
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
