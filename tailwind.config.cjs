/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  theme: {
    extend: {
      colors: {
        purple: "#202232",
      },
      fontFamily: {
        sans: "Inter, Arial, sans-serif",
        mono: "'JetBrains Mono', monospace",
      },
    },
  },
  darkMode: "media",
  plugins: [require("@tailwindcss/typography")],
};
