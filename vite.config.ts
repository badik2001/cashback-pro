import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // GitHub Pages serves this app from https://<user>.github.io/cashback-pro/,
  // not from the domain root — every asset URL in the built index.html must
  // be prefixed with this path, or the browser requests them from "/" and
  // gets a 404 (which is why the page was blank: index.html loaded, but its
  // <script>/<link> tags 404'd, so no JS ever ran).
  // Building for somewhere else? Override at build time:
  //   VITE_BASE_PATH=/ npm run build        (custom domain / root deploy)
  //   VITE_BASE_PATH=/my-repo/ npm run build (a different repo name)
  base: process.env.VITE_BASE_PATH || '/cashback-pro/',
})
