import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: { port: 4382 },
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version || '1.0.0')
  },
  // VITE_BASE_URL is set in GitHub Actions to /repo-name/
  // Leave blank for local dev or a custom domain
  base: process.env.VITE_BASE_URL || '/'
})
