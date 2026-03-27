/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        lime:   '#c6f135',
        teal:   '#4ecdc4',
        purple: '#a78bfa',
        coral:  '#ff6b6b',
        amber:  '#fbbf24',
        blue:   '#60a5fa',
        // App surfaces
        surface: {
          bg:    '#111111',
          card:  '#1e1e1e',
          card2: '#242424',
          modal: '#1a1a1a',
        },
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'SF Pro Display', 'Segoe UI', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
    },
  },
  plugins: [],
}
