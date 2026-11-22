import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  build: {
    // 直接产出到 nginx 镜像里 COPY 的目录，省掉手工拷贝。
    outDir: '../nginx/dist',
    emptyOutDir: true
  },
  server: {
    port: 5174,
    host: true
  }
})
