/** @type {import('tailwindcss').Config} */
/**
 * Admin tokens mirror storefront — driven by brand CSS variables.
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
      },
      fontFamily: {
        brand: ['var(--brand-font-body)', 'system-ui', 'sans-serif'],
        display: ['var(--brand-font-heading)', 'Georgia', 'serif'],
      },
      boxShadow: {
        'soft': '0 8px 30px -12px rgba(28, 25, 23, 0.12)',
      },
    },
  },
  plugins: [],
}
