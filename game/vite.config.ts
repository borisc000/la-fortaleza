import { defineConfig } from 'vite';

// BASE_PATH lets the build be served from a subpath (GitHub Pages: /la-fortaleza/). Local dev and preview use '/'.
export default defineConfig({
  base: process.env.BASE_PATH ?? '/',
  build: { rollupOptions: { input: { game: 'index.html', models: 'model-lab.html' } } },
});
