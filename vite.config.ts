import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd())

  return {
    plugins: [vue()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src')
      }
    },
    server: {
      proxy: {
        '/monitor/api': {
          target: 'http://localhost:8080',
          changeOrigin: true,
        }
      },
      port: 3000,
      open: true
    }
  }
})