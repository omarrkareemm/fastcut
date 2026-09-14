import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// GitHub Pages serves the site from https://<user>.github.io/<repo>/
// so assets must be referenced with a base path.
export default defineConfig({
  base: '/fastcut/',
  plugins: [react()],
  worker: { format: 'es' },
  build: { target: 'esnext' },
});