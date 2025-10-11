/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'dark-blue': '#0a1a2f',
        'dark-blue-light': '#152642',
        'yellow-accent': '#FFD700',
        'yellow-dark': '#E6C200',
      },
    },
  },
  plugins: [],
}