/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        artisanal: {
          50: '#faf8f5',   // Cream/Almond background
          100: '#f4f0e6',  // Warm light gray
          200: '#e6ded0',  // Sand
          300: '#d1c2ab',  // Clay outline
          400: '#bca688',  // Light bronze
          500: '#a3845e',  // Bronze/Gold accent
          600: '#8e6c46',  // Warm brown
          700: '#755436',  // Dark wood
          800: '#5c412a',  // Deep charcoal wood
          900: '#2b1f13',  // Darkest brown
        },
        clay: {
          light: '#e89e7e',
          DEFAULT: '#c86b45', // Terracotta clay
          dark: '#9a4724',
        },
        charcoal: {
          DEFAULT: '#222222', // Slate/charcoal text
          muted: '#555555',
        }
      },
      fontFamily: {
        serif: ['Playfair Display', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
