import { defineConfig } from 'vite';

// base './' keeps every asset path relative, so the site works at https://<user>.github.io/<repo>/ and inside Google Sites.
export default defineConfig({
  base: './',
  build: {
    target: 'es2022',
    chunkSizeWarningLimit: 700,
    rollupOptions: { output: { manualChunks: (id) => (id.includes('node_modules/three') ? 'three' : undefined) } },
  },
  server: { host: true },
});
