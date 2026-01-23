/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        pwc: {
          orange: '#fd5108', 
          black: '#2D2D2D',  
          gray: '#E0E0E0',   
        }
      }
    },
  },
  plugins: [],
}