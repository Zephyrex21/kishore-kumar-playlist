import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons/*.png', 'images/hero.jpg', 'images/hero.webp'],
      manifest: {
        name: 'Kishore Kumar — Playlist',
        short_name: 'Kishore Kumar',
        description: 'A playlist tribute to Kishore Kumar.',
        start_url: '/',
        display: 'standalone',
        background_color: '#1c0d05',
        theme_color: '#C4491A',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: '/icons/icon-512-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // App shell + static assets cached for offline resilience. Audio
        // files are intentionally NOT precached — they're large and
        // change independently of the app (new uploads to Supabase), so
        // they're left to normal network fetches rather than baked into
        // the service worker's cache list.
        globPatterns: ['**/*.{js,css,html,svg,png,webp,woff2}'],
      },
    }),
  ],
})
