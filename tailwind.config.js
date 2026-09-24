/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          green: '#16A34A',
          darkGreen: '#15803D',
          lightGreen: '#DCFCE7',
          blue: '#2563EB',
          darkBlue: '#1D4ED8',
          lightBlue: '#DBEAFE',
          bg: '#F8FAFC',
          darkText: '#0F172A',
          mutedText: '#64748B',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
