import { defineConfig } from 'vite'
import path from 'path';

import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const API_SERVER = 'http://localhost:3002'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // the server builds email links from FRONTEND_URL, so the port must not drift
    port: 5176,
    strictPort: true,
    // one origin for the browser: the login cookie needs no cross-site setup
    proxy: {
      '/api': API_SERVER,
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      'components': path.resolve(__dirname, 'src/components'),
      'utils': path.resolve(__dirname, 'src/lib/utils'),
      'ui': path.resolve(__dirname, 'src/components/ui'),
      'lib': path.resolve(__dirname, 'src/lib'),
      'hooks': path.resolve(__dirname, 'src/hooks'),
    },
  },
})
