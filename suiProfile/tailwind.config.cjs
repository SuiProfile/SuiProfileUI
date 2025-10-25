/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{ts,tsx,js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#A8E000',
        accent: '#002E1B',
        'background-light': '#F0F0E6',
        'background-dark': '#0A1017',
        'text-light': '#111118',
        'text-dark': '#f0f0f4',
      },
      fontFamily: {
        display: ['Lato', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '0.5rem',
        lg: '0.75rem',
        xl: '1rem',
        full: '9999px',
      },
    },
  },
  plugins: [require('@tailwindcss/forms')],
};
