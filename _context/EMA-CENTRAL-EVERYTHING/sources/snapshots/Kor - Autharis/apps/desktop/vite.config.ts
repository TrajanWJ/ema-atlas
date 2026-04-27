import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Lane G6 — Tauri shell. Vite dev server must run on 5174 (distinct from
// every other surface port: 3000/3001/4000/4010/4020/4030/4040/4321/6006).
const DEV_PORT = 5174;

export default defineConfig({
  plugins: [react()],
  // Tauri expects a relative-base SPA so file:// loads work inside the webview.
  base: './',
  clearScreen: false,
  server: {
    port: DEV_PORT,
    strictPort: true,
    host: '127.0.0.1',
  },
  preview: {
    port: DEV_PORT,
    strictPort: true,
  },
  build: {
    // src-tauri/tauri.conf.json points frontendDist at ../dist
    outDir: 'dist',
    emptyOutDir: true,
    target: 'es2022',
    sourcemap: true,
  },
  envPrefix: ['VITE_', 'TAURI_'],
});
