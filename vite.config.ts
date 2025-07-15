//make a build target esnext
import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    target: 'esnext'
  },
  server: {
    proxy: {
      '/api': 'http://localhost:3000'
    }
  }
})
