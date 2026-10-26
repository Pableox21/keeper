import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: true,
    port: 5173,
    strictPort: true,
    hmr: { clientPort: 3110 },
    // Docker en Windows no propaga los eventos inotify del bind mount: sin sondeo,
    // Vite sirve módulos viejos y hay que reiniciar el contenedor tras cada cambio.
    watch: { usePolling: true, interval: 300 }
  }
})
