import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  plugins: [
    {
      name: 'multi-page-redirect',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          // Normalize URL using dummy base
          const url = new URL(req.url, 'http://localhost');
          const pathname = url.pathname;
          
          if (pathname === '/app' || pathname === '/auth/callback') {
            res.writeHead(301, { 
              Location: pathname + '/' + url.search + url.hash 
            });
            res.end();
          } else {
            next();
          }
        });
      }
    }
  ],
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        app: resolve(__dirname, 'app/index.html'),
        authCallback: resolve(__dirname, 'auth/callback/index.html')
      }
    }
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true
      }
    }
  }
});
