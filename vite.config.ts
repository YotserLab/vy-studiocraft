import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      port: 34567,
      strictPort: true,
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
      proxy: {
        // render service (Remotion/Gemini + mídia) :8090 — paths específicos primeiro
        '/api/render': { target: 'http://localhost:8090', changeOrigin: true },
        '/api/rendered': { target: 'http://localhost:8090', changeOrigin: true },
        '/api/gemini': { target: 'http://localhost:8090', changeOrigin: true },
        '/rendered': { target: 'http://localhost:8090', changeOrigin: true },
        '/thumbnails': { target: 'http://localhost:8090', changeOrigin: true },
        '/previews': { target: 'http://localhost:8090', changeOrigin: true },
        '/rendercomp-thumbs': { target: 'http://localhost:8090', changeOrigin: true },
        '/cache': { target: 'http://localhost:8090', changeOrigin: true },
        // API principal Go :8080
        '/api': {
          target: process.env.API_PROXY_TARGET || 'http://localhost:8080',
          changeOrigin: true,
        },
      },
    },
  };
});
