/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#005542',
          50:  '#e6f2ef',
          100: '#b3d9d0',
          200: '#80c0b0',
          300: '#4da792',
          400: '#268e74',
          500: '#005542',
          600: '#004939',
          700: '#003d30',
          800: '#003127',
          900: '#00251e',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
