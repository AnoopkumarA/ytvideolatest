import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5177,
    proxy: {
      '/api': {
        target: 'http://localhost:5174',
        changeOrigin: true,
        // Avoid proxy timeouts for long-running downloads/conversions
        proxyTimeout: 0,
        timeout: 0,
        configure: (proxy) => {
          proxy.on('error', (err, req, res) => {
            if (err && err.code === 'ECONNRESET') {
              try {
                res && res.writeHead && res.writeHead(204);
                res && res.end && res.end();
              } catch {}
              return;
            }
            // Fallback: log other errors
            // eslint-disable-next-line no-console
            console.error('[proxy error]', err && err.message ? err.message : err);
          });
        },
      },
      '/downloads': {
        target: 'http://localhost:5174',
        changeOrigin: true,
      },
    },
  },
})


