import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'https://wasteex.onrender.com/api', // 🎯 Forward /api calls to backend
    },
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
