import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: process.env.VITE_BASE_PATH ?? '/',
  plugins: [react()],
  build: {
    // R3F/Three is lazy-loaded behind capsule/collection screens; keep the initial chunk below 500 kB.
    chunkSizeWarningLimit: 900
  },
  server: {
    host: '0.0.0.0',
    port: 5173
  }
});
