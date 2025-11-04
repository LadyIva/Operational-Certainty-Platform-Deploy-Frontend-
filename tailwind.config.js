// tailwind.config.js

/** @type {import('tailwindcss').Config} */
export default {
  // 👇 This is the crucial fix for the warning
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}