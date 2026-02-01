/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'deep-blue': '#000b1a',
        'light-bg': '#f8fafc',
        'light-gray': '#f0f4f8',
        'dark-bg': '#001a33',
        'dark-gray': '#131720',
        'wechat-green': '#07C160',
      },
    },
  },
  plugins: [],
  safelist: [
    {
      pattern: /bg-\[#[0-9a-fA-F]{6}\]/,
    },
  ],
}
