/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
          950: '#1e1b4b',
        },
        // Neutral dark surfaces — professional desktop look
        surface: {
          950: '#07090d',
          900: '#0b0d12',
          800: '#11141b',
          700: '#161a23',
          600: '#1c212c',
          500: '#242a37',
        },
        line: {
          DEFAULT: '#232936',
          soft: '#1a1f29',
          strong: '#2e3645',
        },
      },
      fontFamily: {
        sans: ['"Inter Variable"', 'system-ui', 'sans-serif'],
        arabic: ['"Cairo Variable"', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
      },
      boxShadow: {
        'card': '0 1px 2px rgba(0,0,0,0.4), 0 4px 16px rgba(0,0,0,0.24)',
        'pop': '0 8px 32px rgba(0,0,0,0.5)',
        'glow': '0 0 20px rgba(99, 102, 241, 0.25)',
        'glow-lg': '0 0 40px rgba(99, 102, 241, 0.3)',
      },
      animation: {
        'fade-in': 'fadeIn 0.25s ease-out',
        'slide-in': 'slideIn 0.25s ease-out',
        'pulse-glow': 'pulseGlow 2.5s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          '0%': { transform: 'translateX(-8px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 12px rgba(99,102,241,0.25)' },
          '50%': { boxShadow: '0 0 24px rgba(99,102,241,0.45)' },
        },
      },
    },
  },
  plugins: [],
}
