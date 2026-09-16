/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        blinkit: '#f8cb46',
        blinkitDark: '#222222',
        instamart: '#fc8019',
        instamartDark: '#1c1c24'
      }
    },
  },
  plugins: [],
}
