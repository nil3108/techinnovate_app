import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

import { cloudflare } from "@cloudflare/vite-plugin";

export default defineConfig({
  plugins: [react(), tailwindcss(), VitePWA({
    registerType: 'autoUpdate',
    workbox: {
      globPatterns: ['**/*.{js,css,html,jpg,jpeg,png,svg,ico,json}'],
      navigateFallback: '/cng-final-test-/index.html',
    },
    manifest: {
      name: 'Techinnovate Fleet CNG',
      short_name: 'CNG Tracker',
      description: 'Fleet CNG Monitoring System',
      start_url: '/cng-final-test-/',
      scope: '/cng-final-test-/',
      display: 'standalone',
      background_color: '#F5F6F8',
      theme_color: '#E10600',
      orientation: 'portrait-primary',
      categories: ['business', 'utilities'],
      icons: [
        { src: '/cng-final-test-/logo.jpg', sizes: '192x192', type: 'image/jpeg', purpose: 'any' },
        { src: '/cng-final-test-/logo.jpg', sizes: '512x512', type: 'image/jpeg', purpose: 'any' },
      ],
    },
  }), cloudflare()],
  base: '/cng-final-test-/',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
})