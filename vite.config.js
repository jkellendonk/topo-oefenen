import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      workbox: {
        // Default globPatterns only cover js/css/html — explicitly include the map
        // photos too, so every pack works fully offline once it's been opened once.
        globPatterns: ['**/*.{js,css,html,svg,png,webp,ico,webmanifest}'],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
      },
      manifest: {
        name: 'Topo Oefenen',
        short_name: 'Topo Oefenen',
        description: 'Oefen topografie van Europa met kaarten, meerkeuze en een toetsmodus.',
        lang: 'nl',
        start_url: '.',
        display: 'standalone',
        background_color: '#FAFAF8',
        theme_color: '#2F9FE0',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
    }),
  ],
  server: {
    host: true,
  },
})
