/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        butterpop: ['Butterpop', 'cursive'],
        stretchpro: ['StretchPro', 'sans-serif'],
        // add other custom fonts if needed
      },

      colors: {
        primary: "#335eea",
        primary1: "#5ffd00",
        primary2: "#0b2c5f",
        primary3: "#f8f7f3",
        primary4: "#fafafa",
        primary5: "#f2f1ed",
        primary6: "#0511a8",

        // Design system colors
        'color-primary': '#2563EB',
        'color-primary-dark': '#1E40AF',
        'color-accent': '#39FF14',
        'color-accent-hover': '#9ACC00',
        'color-bg-light': '#F8FAFC',
        'color-bg-surface': '#FFFFFF',
        'color-border': '#E2E8F0',
      },

      borderRadius: {
        'button': '8px',
        'container': '16px',
      },

      maxWidth: {
        'container': '1440px',
      },

      screens: {
        '2xl': '1600px',
      },
    },
  },
  plugins: [],
}