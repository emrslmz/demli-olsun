import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    host: true,
  },
  build: {
    target: 'es2020',
    chunkSizeWarningLimit: 1600,
    // Vite 8 Rolldown kullanır: Rollup'taki `manualChunks` karşılığı `codeSplitting.groups`.
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            { name: 'phaser', test: /node_modules[\\/]phaser/ },
            { name: 'vendor', test: /node_modules[\\/](vue|@vue|pinia|mitt)/ },
          ],
        },
      },
    },
  },
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
  },
})
