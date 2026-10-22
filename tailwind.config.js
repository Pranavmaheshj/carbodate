/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        clay: {
          bg: '#EEF0FB',
          'dark-bg': '#1B1D2B',
          'dark-surface': '#252840',
          text: '#2B2D42',
          'text-sub': '#6C6F85',
          lime: {
            DEFAULT: '#B8F25B',
            light: '#D2F88D',
            dark: '#85C722',
          },
          sky: {
            DEFAULT: '#7CCBFF',
            light: '#B2E1FF',
            dark: '#40A2EB',
          },
          coral: {
            DEFAULT: '#FF9F8A',
            light: '#FFC2B5',
            dark: '#E76E55',
          },
          lilac: {
            DEFAULT: '#B9A4FF',
            light: '#D7CBFF',
            dark: '#8B6DFF',
          },
          butter: {
            DEFAULT: '#FFD76B',
            light: '#FFE79E',
            dark: '#E5B42C',
          },
        },
      },
      fontFamily: {
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
        heading: ['"Nunito"', '"Baloo 2"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      borderRadius: {
        'clay-card': '32px',
        'clay-btn': '24px',
        'clay-input': '24px',
      },
      boxShadow: {
        'clay-card': '12px 12px 28px rgba(120,120,170,0.28), -10px -10px 24px rgba(255,255,255,0.9), inset 6px 6px 12px rgba(255,255,255,0.7), inset -6px -6px 14px rgba(120,120,170,0.15)',
        'clay-card-dark': '12px 12px 28px rgba(14,15,24,0.7), -8px -8px 20px rgba(255,255,255,0.04), inset 4px 4px 10px rgba(255,255,255,0.08), inset -4px -4px 12px rgba(10,11,18,0.5)',
        'clay-sunken': 'inset 5px 5px 12px rgba(120,120,170,0.25), inset -5px -5px 12px rgba(255,255,255,0.9)',
        'clay-sunken-dark': 'inset 5px 5px 12px rgba(10,11,18,0.7), inset -4px -4px 10px rgba(255,255,255,0.04)',
      },
      animation: {
        'clay-float': 'clayFloat 4s ease-in-out infinite',
        'clay-pulse': 'clayPulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        clayFloat: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-3px)' },
        },
        clayPulse: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.85', transform: 'scale(0.98)' },
        },
      },
    },
  },
  plugins: [],
}
