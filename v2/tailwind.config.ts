import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // VIXCELL brand palette — derived from the existing site
        brand: {
          bg:        '#0c0c0e',
          bg2:       '#131316',
          bg3:       '#1a1a1f',
          surface:   'rgba(255,255,255,0.04)',
          border:    'rgba(255,255,255,0.08)',
          borderH:   'rgba(255,255,255,0.16)',
          text:      '#e8e8ed',
          text2:     '#a8a8b3',
          text3:     '#6b6b75',
          gold:      '#c8a35c',
          goldH:     '#d4b06a',
          goldDim:   'rgba(200,163,92,0.12)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['ui-monospace', 'SF Mono', 'Monaco', 'Consolas', 'monospace'],
      },
      keyframes: {
        fadeUp:    { from: { opacity: '0', transform: 'translateY(20px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        blink:     { '0%,49%': { opacity: '1' }, '50%,100%': { opacity: '0.2' } },
        typingDot: { '0%,60%,100%': { transform: 'translateY(0)', opacity: '0.4' }, '30%': { transform: 'translateY(-4px)', opacity: '1' } },
      },
      animation: {
        fadeUp:    'fadeUp 0.7s cubic-bezier(0.16,1,0.3,1)',
        blink:     'blink 0.9s steps(1) infinite',
        typingDot: 'typingDot 1.4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
export default config
