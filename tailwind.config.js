/** @type {import('tailwindcss').Config} */
export default {
  content: [
    // Only scan wargames-related files
    "./src/features/wargames/**/*.{js,jsx,ts,tsx,css}",
  ],
  important: '.wargames-challenge-container',
  theme: {
    extend: {},
  },
  plugins: [],
}