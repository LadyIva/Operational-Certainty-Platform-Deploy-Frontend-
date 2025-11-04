// This is the absolute minimal, recommended configuration for modern Tailwind (v3+)
// It resolves the plugin loading issue by removing the outdated 'tailwindcss/nesting'
// entry which was confusing the module system.
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}