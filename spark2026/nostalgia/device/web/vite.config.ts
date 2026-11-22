import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import UnoCSS from 'unocss/vite'

// 开发时把 /api 代理到本机的「设备固件」后端（见 ../dev.sh）
export default defineConfig({
  plugins: [
    vue(),
    UnoCSS(),
  ],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: process.env.NOSTALGIA_API ?? 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
})
