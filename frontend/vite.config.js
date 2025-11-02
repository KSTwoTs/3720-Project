import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173, // optional; use whatever you like
    proxy: {
      // LLM service (natural language parsing + confirm)
      '/api/llm': {
        target: 'http://localhost:7001',
        changeOrigin: true,
      },
      // Admin service (only if you call it from the browser)
      '/api/admin': {
        target: 'http://localhost:5001',
        changeOrigin: true,
        // If admin server expects plain /api/... you can rewrite:
        // rewrite: (path) => path.replace(/^\/api\/admin/, '/api'),
      },
      // Client service (events + purchase) — catch-all for the rest of /api
      '^/api(?!/llm)(?!/admin)': {
        target: 'http://localhost:6001',
        changeOrigin: true,
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/setupTests.js', // use existing setup file
    css: true,               // (optional) allow importing CSS in tests
    restoreMocks: true,
  },
});
