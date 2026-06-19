// CON-89 / Playwright smoke: Next dev must process @tailwind in globals.css (required for postcss pipeline).
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
