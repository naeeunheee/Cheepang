import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        primary: {
          DEFAULT: '#2B5F9E',
          light: '#3A7BC8',
          dark: '#1A2B3C',
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
