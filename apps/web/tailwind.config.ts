import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
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
