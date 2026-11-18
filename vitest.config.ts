import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vitest/config';

// Generic unit-test scaffold for the frontend (React 19 + Vite + TS).
// Reuses the same '@' alias as vite.config.ts; happy-dom supplies DOM APIs
// (window, history, DOMParser, fetch-adjacent globals) for tests.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, '.'),
    },
  },
  test: {
    environment: 'happy-dom',
    include: ['src/**/*.test.{ts,tsx}'],
  },
});
