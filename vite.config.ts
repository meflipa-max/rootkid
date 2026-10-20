import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    // app installabile: il service worker tiene in cache il gioco (funziona anche offline)
    // e a ogni pubblicazione scarica la versione nuova; quando applicarla lo decide src/lib/pwa.ts
    VitePWA({
      registerType: 'prompt',
      injectRegister: false,
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Core a Core',
        short_name: 'Core a Core',
        description: 'Gestisci la pizzeria e impara le ricette giocando.',
        lang: 'it',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#f3eadb',
        theme_color: '#f3eadb',
        icons: [
          { src: '/pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/pwa-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/pwa-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,webmanifest}'],
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
        navigateFallback: '/index.html',
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            // personaggi, arredi e HDRI: pesanti, cambiano di rado
            urlPattern: ({ url }) => url.pathname.startsWith('/models/'),
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'modelli', expiration: { maxEntries: 60 } },
          },
          {
            urlPattern: ({ url }) => url.origin === 'https://fonts.googleapis.com',
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'font-css' },
          },
          {
            urlPattern: ({ url }) => url.origin === 'https://fonts.gstatic.com',
            handler: 'CacheFirst',
            options: { cacheName: 'font-file', expiration: { maxEntries: 30, maxAgeSeconds: 365 * 864e2 }, cacheableResponse: { statuses: [0, 200] } },
          },
        ],
      },
    }),
  ],
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
