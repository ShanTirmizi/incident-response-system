/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        emma: {
          purple: {
            DEFAULT: '#7C3AED',
            dark: '#6D28D9',
            light: '#EDE9FE',
            lighter: '#F5F3FF',
          },
          dark: '#1F2937',
          gray: '#6B7280',
        },
        glass: {
          white: 'rgba(255, 255, 255, 0.70)',
          purple: 'rgba(124, 58, 237, 0.12)',
          green: 'rgba(34, 197, 94, 0.12)',
          red: 'rgba(239, 68, 68, 0.12)',
          amber: 'rgba(245, 158, 11, 0.12)',
          dark: 'rgba(17, 24, 39, 0.85)',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      backdropBlur: {
        xs: '2px',
        '2xl': '40px',
        '3xl': '64px',
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.07)',
        'glass-lg': '0 8px 32px 0 rgba(31, 38, 135, 0.15)',
        'glass-colored': '0 8px 32px 0 rgba(124, 58, 237, 0.15)',
      },
      borderColor: {
        'glass-edge': 'rgba(255, 255, 255, 0.18)',
        'glass-edge-subtle': 'rgba(255, 255, 255, 0.08)',
      },
    },
  },
  plugins: [],
}
