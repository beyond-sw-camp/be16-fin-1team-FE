import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    proxy: {
      "/user-service": {
        target: "http://localhost:8080",
        changeOrigin: true,
      },
      // 백엔드 프록시 설정
      '/stone': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/stone/, '/workspace-service/stone'),
      },
    },
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@Project': fileURLToPath(new URL('./src/views/Project', import.meta.url))
    }
  }
})
