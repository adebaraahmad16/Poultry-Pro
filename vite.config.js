import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { apiConfigurationError, configuredApiBase } from './src/services/apiConfig.js';

export default defineConfig(({ command, mode }) => {
  // Vite config runs in Node. Client modules continue to use import.meta.env.
  // Use Vite's own env loading/precedence, including Vercel build variables.
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  if (command === 'build' && process.env.VERCEL === '1') {
    const error = apiConfigurationError(configuredApiBase(env), true, '');
    if (error) throw new Error(error);
  }
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
  }
  };
});
