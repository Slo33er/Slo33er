import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          dark: '#0B1F3A',
          blue: '#1479FF',
          cyan: '#1AD4FF',
        },
      },
      boxShadow: {
        glow: '0 10px 30px rgba(20, 121, 255, 0.25)',
      },
    },
  },
  plugins: [],
};

export default config;
