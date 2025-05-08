import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['./src/**/*.{test,spec}.{ts,tsx}'],
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/**',
        '**/*.d.ts',
        '**/*.config.{js,ts}',
      ],
    },
  },
  plugins: react(),
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@shared': resolve(__dirname, './shared'),
    },
  },
}); 