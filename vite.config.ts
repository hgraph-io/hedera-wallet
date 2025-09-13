import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

// Helper to get __dirname in ESM
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
console.log(__dirname)
// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      'vite-plugin-node-polyfills/shims/buffer': resolve(
        __dirname,
        'node_modules',
        'vite-plugin-node-polyfills',
        'shims',
        'buffer',
        'dist',
        'index.cjs',
      ),
      'vite-plugin-node-polyfills/shims/global': resolve(
        __dirname,
        'node_modules',
        'vite-plugin-node-polyfills',
        'shims',
        'global',
        'dist',
        'index.cjs',
      ),
    },
  },
})
