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
  // 移除 safelist，因为我们已经在 theme.extend.colors 中定义了颜色
  // 动态类名如 bg-[#000b1a] 会在运行时生成
}
