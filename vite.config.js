import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: { port: 4382 },
  // VITE_BASE_URL is set in GitHub Actions to /repo-name/
  // Leave blank for local dev or a custom domain
  base: process.env.VITE_BASE_URL || '/'
})
