import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  // Relative asset URLs make the same build work at both a custom domain and
  // a GitHub Pages project path such as /fluke-ii500-report/.
  base: './',
  plugins: [react()],
  build: {
    emptyOutDir: true,
  },
})
