import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { readFileSync } from 'node:fs'

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')) as { version: string }

export default defineConfig({
  plugins: [vue()],
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
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
