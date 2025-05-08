import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@shared': path.resolve(__dirname, './shared')
    }
  },
  build: {
    rollupOptions: {
      output: {
        // manualChunks removed for clean, error-free build
      },
      external: (id) => {
        // Only externalize packages you truly want to provide via CDN or similar
        return [
          'recharts',
          'react-hook-form',
          'react-datepicker',
          'react-datepicker/dist/react-datepicker.css',
          'cmdk',
          'vaul'
        ].includes(id);
      }
    },
    chunkSizeWarningLimit: 1000, // Increase the warning limit to 1000KB
    sourcemap: true
  },
  optimizeDeps: {
    include: ['@supabase/supabase-js']
  }
}) 