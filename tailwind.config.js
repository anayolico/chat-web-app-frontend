/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#07111f',
        panel: '#0d1b2a',
        line: '#1f3449',
        mist: '#d7e2f0',
        accent: '#11c58a',
        accentSoft: '#153e38',
        coral: '#ff7a59'
      },
      boxShadow: {
        float: '0 20px 45px rgba(3, 10, 22, 0.35)'
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif']
      }
    }
  },
  plugins: []
};
