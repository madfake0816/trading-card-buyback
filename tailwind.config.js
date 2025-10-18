import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // CardFlow Brand Colors
        primary: {
          DEFAULT: '#06B6D4',    // Cyan 500
          light: '#22D3EE',      // Cyan 400
          dark: '#0891B2',       // Cyan 600
        },
        secondary: {
          DEFAULT: '#10B981',    // Emerald 500
          light: '#34D399',      // Emerald 400
          dark: '#059669',       // Emerald 600
        },
        accent: {
          DEFAULT: '#3B82F6',    // Blue 500
          light: '#60A5FA',      // Blue 400
          dark: '#2563EB',       // Blue 600
        },
        dark: {
          DEFAULT: '#0F172A',    // Slate 900
          light: '#1E293B',      // Slate 800
          lighter: '#334155',    // Slate 700
        },
        success: '#10B981',
        warning: '#F59E0B',
        error: '#EF4444',
      },
      backgroundColor: {
        'card': '#1E293B',
        'card-hover': '#334155',
      },
      borderColor: {
        'card': '#334155',
      },
    },
  },
  plugins: [],
};

export default config;