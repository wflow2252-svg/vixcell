import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // VIXCELL brand palette — derived from the existing site
        brand: {
          bg:        '#000000',
          bg2:       '#09090B',
          bg3:       '#121214',
          surface:   'rgba(255,255,255,0.02)',
          border:    '#1F1F23',
          borderH:   '#8B5CF6',
          text:      '#FFFFFF',
          text2:     '#A1A1AA',
          text3:     '#71717A',
          gold:      '#8B5CF6',
          goldH:     '#7C3AED',
          goldDim:   'rgba(139,92,246,0.1)',
        },
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Cairo', 'system-ui', '-apple-system', 'sans-serif'],
        serif: ['Playfair Display', 'Instrument Serif', 'serif'],
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
