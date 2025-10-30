/// <reference types="vitest" />

import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    globals: true,
    coverage: {
      reporter: ['text', 'json', 'html'],
    },
    exclude: [
      'e2e/**', 
      'playwright.config.ts', 
      'e2e/**/**',
      '**/node_modules/**',
      'node_modules/**'
    ],
    alias: {
      '@': path.resolve(__dirname, './')
    }
  }
})