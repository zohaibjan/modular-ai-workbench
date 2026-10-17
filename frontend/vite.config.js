import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      '@apps': path.resolve(__dirname, '..', 'apps'),
      // Ensure packages imported by app files outside the root resolve to
      // the single copy in frontend/node_modules
      'react':            path.resolve(__dirname, 'node_modules/react'),
      'react-dom':        path.resolve(__dirname, 'node_modules/react-dom'),
      'react-router-dom': path.resolve(__dirname, 'node_modules/react-router-dom'),
      'axios':            path.resolve(__dirname, 'node_modules/axios'),
      'framer-motion':    path.resolve(__dirname, 'node_modules/framer-motion'),
      'lucide-react':     path.resolve(__dirname, 'node_modules/lucide-react'),
      'react-dropzone':   path.resolve(__dirname, 'node_modules/react-dropzone'),
      'recharts':         path.resolve(__dirname, 'node_modules/recharts'),
      'react-markdown':   path.resolve(__dirname, 'node_modules/react-markdown'),
    },
    dedupe: ['react', 'react-dom', 'react-router-dom'],
    modules: [path.resolve(__dirname, 'node_modules'), 'node_modules'],
  },
  optimizeDeps: {
    include: [
      'axios',
      'framer-motion',
      'react-router-dom',
      'lucide-react',
      'react-dropzone',
      'recharts',
    ],
  },
  server: {
    host: '0.0.0.0',
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
      '/health': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
});
