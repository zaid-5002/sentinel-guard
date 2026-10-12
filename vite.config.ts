import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@sentinel-guard/core': fileURLToPath(
        new URL('./packages/sentinel-guard/src/index.ts', import.meta.url)
      ),
    },
  },
});
