/** @type {import('tailwindcss').Config} */
export default {
  content: [
    // Wargames-related files
    "./src/features/wargames/**/*.{js,jsx,ts,tsx,css}",
    // Console-related files
    "./src/features/console/**/*.{js,jsx,ts,tsx,css}",
  ],
  important: false, // Allow both wargames and console to use Tailwind
  theme: {
    extend: {},
  },
  plugins: [],
  // Ensure Tailwind doesn't conflict with Radix Themes
  corePlugins: {
    preflight: true, // Keep reset styles
  },
}