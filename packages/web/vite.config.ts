import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';
import wasm from 'vite-plugin-wasm';
import topLevelAwait from 'vite-plugin-top-level-await';

export default defineConfig({
  plugins: [react(), tailwindcss(), wasm(), topLevelAwait()],
  envDir: '../../',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@shadow-market/api': path.resolve(__dirname, '../api/src/index.ts'),
      '@shadow-market/contracts': path.resolve(__dirname, '../contracts/src/index.ts'),
      'isomorphic-ws': path.resolve(__dirname, './src/ws-polyfill.js'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor splitting for better caching
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'charts-vendor': ['recharts'],
          'query-vendor': ['@tanstack/react-query'],
        },
      },
    },
    // Optimize chunk size warnings
    chunkSizeWarningLimit: 1000,
    // Enable minification (default is esbuild)
    minify: 'esbuild',
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', '@tanstack/react-query'],
  },
});
