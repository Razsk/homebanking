/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        nordea: {
          50: '#f0f5fa',
          100: '#e1ecf5',
          500: '#0000a0',
          600: '#000088',
          700: '#00006b',
          900: '#0a1033',
        }
      }
    },
  },
  plugins: [],
}
