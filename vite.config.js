import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(() => {
  return {
    plugins: [react()],
    server: {
      watch: {
        ignored: ['**/*.md', '**/backend/**']
      },
      proxy: {
        '/api': {
          target: 'http://localhost:5000',
          changeOrigin: true
        }
      }
    },
    build: {
      chunkSizeWarningLimit: 2000
    }
  };
});
