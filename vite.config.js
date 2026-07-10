import { defineConfig, loadEnv } from 'vite';
import { resolve } from 'path';

export default defineConfig(({ mode }) => {
  // Load env variables from system process.env and .env files
  const env = loadEnv(mode, process.cwd(), '');
  const supabaseUrl = env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
  const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
  const geminiApiKey = env.VITE_GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY || '';

  return {
    define: {
      // Explicitly inject these variables into the bundle to bypass Vite environment loading issues in some CI environments
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(supabaseUrl),
      'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(supabaseAnonKey),
      'import.meta.env.VITE_GEMINI_API_KEY': JSON.stringify(geminiApiKey),
    },
    esbuild: {
      pure: mode === 'production' ? ['console.log', 'console.debug', 'console.info'] : []
    },
    plugins: [
    {
      name: 'multi-page-redirect',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          // Normalize URL using dummy base
          const url = new URL(req.url, 'http://localhost');
          const pathname = url.pathname;
          
          if (pathname === '/app' || pathname === '/auth/callback' || pathname === '/blog') {
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
        authCallback: resolve(__dirname, 'auth/callback/index.html'),
        blog: resolve(__dirname, 'blog/index.html'),
        blogAdobeStock: resolve(__dirname, 'blog/adobe-stock-fotograf-nasil-satilir.html'),
        blogKeyword: resolve(__dirname, 'blog/stok-fotograf-anahtar-kelime-rehberi.html'),
        blogEcommerce: resolve(__dirname, 'blog/e-ticaret-urun-fotografi-seo.html'),
        blogShutterstock: resolve(__dirname, 'blog/shutterstock-satici-rehberi.html')
      },
      output: {
        manualChunks: {
          supabase: ['@supabase/supabase-js'],
          i18n: ['i18next', 'i18next-browser-languagedetector']
        }
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
  };
});
