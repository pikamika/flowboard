/// <reference types="vitest/config" />
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { seo } from './config/seoPlugin'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '')
  return {
    plugins: [react(), seo(env.VITE_SITE_URL ?? '', env.VITE_SUPABASE_URL ?? '')],
    test: {
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],
      globalSetup: ['./src/test/globalSetup.ts'],
      css: false,
      // Never let real credentials from .env.local reach a test.
      env: {
        VITE_SUPABASE_URL: 'http://localhost:54321',
        VITE_SUPABASE_PUBLISHABLE_KEY: 'test-publishable-key',
      },
    },
    build: {
      rollupOptions: {
        output: {
          // Separate long-lived vendor code so app changes don't invalidate its cache.
          manualChunks(id) {
            if (id.includes('@supabase')) return 'supabase'
            if (id.includes('node_modules/react')) return 'react'
          },
        },
      },
    },
  }
})
