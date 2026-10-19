import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    target: 'es2020',
    // three.js in un file a parte: resta in cache tra un aggiornamento e l'altro
    chunkSizeWarningLimit: 1100,
    rollupOptions: {
      output: {
        manualChunks: (id) => (/node_modules\/(three|@react-three|three-stdlib|troika)/.test(id) ? 'three' : undefined),
      },
    },
  },
});
