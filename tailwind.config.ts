import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
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
        sans: ['DM Sans', 'sans-serif'],
        display: ['Playfair Display', 'serif'],
      },
    },
  },
  plugins: [],
};

export default config;
