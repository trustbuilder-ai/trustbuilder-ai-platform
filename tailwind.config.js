/** @type {import('tailwindcss').Config} */
export default {
  content: [
    // Only scan wargames-related files
    "./src/pages/wargames/**/*.{js,jsx,ts,tsx,css}",
    "./src/layouts/WargamesLayout.{jsx,css}",
  ],
  important: '.wargames-challenge-container',
  theme: {
    extend: {},
  },
  plugins: [],
}