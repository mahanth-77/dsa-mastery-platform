import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  server: {
    // Run `npm run dev` in worker/ (wrangler dev) to serve the account API locally.
    proxy: { '/api': 'http://localhost:8787' },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
