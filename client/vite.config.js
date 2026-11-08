import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // During local development, forward /api/* to the Express server.
      '/api': 'http://localhost:8080',
    },
  },
});