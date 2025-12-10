import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  // 載入環境變數，第二個參數設為 process.cwd() 或 '.'
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react()],
    base: './', // 關鍵：設定相對路徑，讓 GitHub Pages 能找到 CSS/JS
    define: {
      'process.env.API_KEY': JSON.stringify(env.VITE_API_KEY)
    }
  }
})