import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['selector', '[data-theme="dark"]'], // an next-themes-Attribut gekoppelt
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        bg: 'hsl(var(--bg) / <alpha-value>)',
        surface: {
          DEFAULT: 'hsl(var(--surface) / <alpha-value>)',
          sunken: 'hsl(var(--surface-sunken) / <alpha-value>)',
        },
        border: 'hsl(var(--border) / <alpha-value>)',
        ink: {
          DEFAULT: 'hsl(var(--ink) / <alpha-value>)',
          muted: 'hsl(var(--ink-muted) / <alpha-value>)',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent) / <alpha-value>)',
          strong: 'hsl(var(--accent-strong) / <alpha-value>)',
          soft: 'hsl(var(--accent-soft) / <alpha-value>)',
        },
        gold: 'hsl(var(--gold) / <alpha-value>)',
        night: 'hsl(var(--night) / <alpha-value>)',
        positive: 'hsl(var(--positive) / <alpha-value>)',
        danger: 'hsl(var(--danger) / <alpha-value>)',
        focus: 'hsl(var(--focus) / <alpha-value>)',
        // brand-Hex-Skala bleibt als Referenz, wird im JSX NICHT verwendet:
        brand: {
          50: '#FDF8F0',
          100: '#F5E6D0',
          200: '#E8C99A',
          300: '#D4A564',
          400: '#C47D2A',
          500: '#9A5F1A',
          600: '#7A4B15',
          700: '#5A3710',
          800: '#3A230A',
          900: '#1A1005',
        },
      },
      fontFamily: {
        display: ['var(--font-display)', 'Playfair Display', 'serif'],
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        xs: ['var(--text-xs)', 'var(--lh-xs)'],
        sm: ['var(--text-sm)', 'var(--lh-sm)'],
        base: ['var(--text-base)', 'var(--lh-base)'],
        lg: ['var(--text-lg)', 'var(--lh-lg)'],
        xl: ['var(--text-xl)', 'var(--lh-xl)'],
        '2xl': ['var(--text-2xl)', 'var(--lh-2xl)'],
        '3xl': ['var(--text-3xl)', 'var(--lh-3xl)'],
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        full: 'var(--radius-full)',
      },
      boxShadow: {
        1: 'var(--shadow-1)',
        2: 'var(--shadow-2)',
        3: 'var(--shadow-3)',
      },
      gridTemplateColumns: { 24: 'repeat(24, minmax(0, 1fr))' }, // ChainBand
      transitionTimingFunction: {
        enter: 'var(--ease-enter)',
        exit: 'var(--ease-exit)',
      },
      keyframes: {
        breathe: {
          '0%,100%': { opacity: '0.65', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.03)' },
        },
        shake: {
          '0%,100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-4px)' },
          '75%': { transform: 'translateX(4px)' },
        },
      },
      animation: {
        breathe: 'breathe 4s ease-in-out infinite',
        shake: 'shake 150ms ease-in-out 1',
      },
    },
  },
  plugins: [],
};

export default config;
