import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Served from https://<user>.github.io/Blackpoint-Lab/app/
// (portfolio landing remains at the repo Pages root)
export default defineConfig({
  base: '/Blackpoint-Lab/app/',
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
})
