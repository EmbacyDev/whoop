import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Relative base so the build works when deployed under any GitHub Pages
// project path (https://<user>.github.io/<repo>/) without hardcoding the
// repo name here.
export default defineConfig({
  base: './',
  plugins: [react()],
  resolve: {
    // Prevent duplicate React copies when multiple Vite processes share/corrupt
    // the prebundle cache (classic "Invalid hook call" / blank cream page).
    dedupe: ['react', 'react-dom'],
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
});
