/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      animation: {
        'pulse-success': 'pulse 0.5s ease-in-out',
        'pulse-error': 'pulse 0.5s ease-in-out',
        'scale-up': 'scale-up 0.3s ease-in-out',
      },
      keyframes: {
        'scale-up': {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.05)' },
          '100%': { transform: 'scale(1)' },
        }
      }
    },
  },
  plugins: [],
}
