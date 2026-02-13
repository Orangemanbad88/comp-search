import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: 'class',
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        burgundy: {
          DEFAULT: '#1a1a2e',
          dark: '#16162a',
          light: '#2a2a3e',
        },
        walnut: {
          DEFAULT: '#475569',
          dark: '#334155',
          light: '#64748b',
        },
        gold: {
          DEFAULT: '#d4a00a',
          light: '#e8b810',
          muted: '#c49a08',
        },
        cream: {
          DEFAULT: '#f8fafc',
          dark: '#f1f5f9',
        },
        ivory: '#ffffff',
        charcoal: {
          DEFAULT: '#0f172a',
          light: '#1e293b',
        },
        parchment: '#f1f5f9',
      },
      fontFamily: {
        display: ['Playfair Display', 'Georgia', 'serif'],
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      boxShadow: {
        'premium': '0 4px 6px -1px rgba(15, 23, 42, 0.05), 0 10px 15px -3px rgba(15, 23, 42, 0.08)',
        'premium-lg': '0 10px 15px -3px rgba(15, 23, 42, 0.08), 0 20px 25px -5px rgba(15, 23, 42, 0.1)',
        'inner-premium': 'inset 0 2px 4px rgba(15, 23, 42, 0.05)',
      },
    },
  },
  plugins: [],
};
export default config;
