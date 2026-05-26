import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        arena: {
          950: '#0B0B0F',
          900: '#121218',
          850: '#18181F',
          800: '#1E1E27',
          700: '#2A2A33',
        },
        gold: {
          500: '#D4AF37',
          400: '#F5C542',
          700: '#9A7412',
        },
        pitch: {
          950: '#07110b',
          900: '#0c1f13',
          800: '#14351f',
        },
        lime: {
          400: '#a3e635',
          500: '#84cc16',
        },
      },
    },
  },
  plugins: [],
};

export default config;
