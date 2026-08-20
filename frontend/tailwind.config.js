/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        graphite: {
          950: '#161510',
          900: '#1B1A15',
          800: '#26241D',
          700: '#332F25',
          600: '#443F30',
        },
        parchment: {
          50: '#FBF9F2',
          100: '#F5F0E1',
          200: '#EDE6D0',
          300: '#E1D6B8',
        },
        marigold: {
          400: '#E4B84A',
          500: '#D9A62E',
          600: '#B98620',
          700: '#8F6417',
        },
        stamp: {
          500: '#A23B2E',
          600: '#832E24',
        },
        ledger: {
          400: '#4F8A83',
          500: '#2F6E68',
          600: '#245450',
        },
      },
      fontFamily: {
        display: ['"Fraunces"', 'serif'],
        body: ['"Public Sans"', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
      boxShadow: {
        ticket: '0 1px 0 rgba(255,255,255,0.5) inset, 0 12px 30px -12px rgba(22,21,16,0.45)',
      },
    },
  },
  plugins: [],
};
