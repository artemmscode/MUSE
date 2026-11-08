/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#070708',
          900: '#0A0A0C',
          850: '#0E0E11',
          800: '#131316',
          750: '#17171B',
          700: '#1D1D22',
          600: '#27272E',
          500: '#35353D',
        },
        bone: {
          50: '#FBFAF7',
          100: '#F2F0EA',
          200: '#E3DFD5',
          300: '#C9C3B6',
          400: '#A39D90',
          500: '#7C776C',
          600: '#5A564E',
        },
        accent: {
          DEFAULT: '#CDBFA3',
          soft: '#E3D8C2',
          deep: '#9C8D71',
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'SF Pro Text',
          'Segoe UI',
          'sans-serif',
        ],
        display: [
          'Inter Tight',
          'Inter',
          '-apple-system',
          'BlinkMacSystemFont',
          'SF Pro Display',
          'Segoe UI',
          'sans-serif',
        ],
        serif: ['Instrument Serif', 'Iowan Old Style', 'Georgia', 'serif'],
      },
      letterSpacing: {
        tightest: '-0.045em',
        tighter: '-0.03em',
      },
      boxShadow: {
        card: '0 24px 80px -32px rgba(0,0,0,0.9)',
        float: '0 18px 50px -20px rgba(0,0,0,0.75)',
        glow: '0 0 0 1px rgba(255,255,255,0.06), 0 30px 90px -40px rgba(205,191,163,0.18)',
      },
      backgroundImage: {
        'grain': "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E\")",
      },
      keyframes: {
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: '0.35' },
          '50%': { opacity: '0.7' },
        },
      },
      animation: {
        shimmer: 'shimmer 1.8s infinite',
        'fade-up': 'fade-up 0.5s cubic-bezier(0.22,1,0.36,1) both',
        'pulse-soft': 'pulse-soft 4s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
