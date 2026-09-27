/** @type {import('tailwindcss').Config} */
/**
 * Color tokens map to CSS variables set by applyBrandToDocument()
 * from shared/brand.config.js. Legacy `tz-*` names are kept so
 * existing classNames re-skin without a full rewrite.
 */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'tz-pink': 'rgb(var(--tz-pink) / <alpha-value>)',
        'tz-pink-soft': 'rgb(var(--tz-pink-soft) / <alpha-value>)',
        'tz-blue': 'rgb(var(--tz-blue) / <alpha-value>)',
        'tz-blue-soft': 'rgb(var(--tz-blue-soft) / <alpha-value>)',
        'tz-navy': 'rgb(var(--tz-navy) / <alpha-value>)',
        'tz-cream': 'rgb(var(--tz-cream) / <alpha-value>)',
        'tz-cherry': 'rgb(var(--tz-cherry) / <alpha-value>)',
        brand: {
          primary: 'rgb(var(--tz-pink) / <alpha-value>)',
          secondary: 'rgb(var(--tz-blue) / <alpha-value>)',
          accent: 'rgb(var(--brand-accent-rgb) / <alpha-value>)',
          muted: 'rgb(var(--tz-navy) / <alpha-value>)',
          bg: 'rgb(var(--tz-cream) / <alpha-value>)',
          surface: 'rgb(var(--brand-surface-rgb) / <alpha-value>)',
        },
      },
      fontFamily: {
        brand: ['var(--brand-font-body)', 'system-ui', 'sans-serif'],
        display: ['var(--brand-font-heading)', 'Georgia', 'serif'],
        sans: ['var(--brand-font-body)', 'system-ui', 'sans-serif'],
        serif: ['var(--brand-font-heading)', 'Georgia', 'serif'],
      },
      boxShadow: {
        'soft': '0 8px 30px -12px rgba(28, 25, 23, 0.12)',
        'nav': '0 2px 16px rgba(28, 25, 23, 0.06)',
      },
    },
  },
  plugins: [],
}
