/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        dark: {
          950: '#07080b',
          900: '#0b0c10',
          850: '#101217',
          800: '#161820',
          750: '#1c1f2a',
          700: '#252936',
          600: '#353b4d',
          500: '#525a70',
          400: '#828ba0',
          300: '#adb5c7',
          200: '#d1d5db',
          100: '#f1f3f7',
        }
      },
      fontFamily: {
        serif: ['Lora', 'Georgia', 'serif'],
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['JetBrains Mono', 'Menlo', 'monospace'],
      },
    },
  },
  plugins: [],
};