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
        main: resolve(import.meta.dirname, 'index.html'),
        app: resolve(import.meta.dirname, 'app/index.html'),
        authCallback: resolve(import.meta.dirname, 'auth/callback/index.html'),
        blog: resolve(import.meta.dirname, 'blog/index.html'),
        blogAdobeStock: resolve(import.meta.dirname, 'blog/adobe-stock-fotograf-nasil-satilir.html'),
        blogKeyword: resolve(import.meta.dirname, 'blog/stok-fotograf-anahtar-kelime-rehberi.html'),
        blogEcommerce: resolve(import.meta.dirname, 'blog/e-ticaret-urun-fotografi-seo.html'),
        blogShutterstock: resolve(import.meta.dirname, 'blog/shutterstock-satici-rehberi.html'),
        blogMarketplacesTr: resolve(import.meta.dirname, 'blog/e-ticaret-pazaryerleri-rehberi.html'),
        blogMarketplacesEn: resolve(import.meta.dirname, 'blog/e-commerce-marketplaces-guide.html'),
        blogAiStockTr: resolve(import.meta.dirname, 'blog/yapay-zeka-stok-fotograf-satma-rehberi.html'),
        blogAiStockEn: resolve(import.meta.dirname, 'blog/selling-ai-generated-stock-photos.html'),
        blogImageSeoTr: resolve(import.meta.dirname, 'blog/e-ticaret-gorsel-seo-alt-text-rehberi.html'),
        blogImageSeoEn: resolve(import.meta.dirname, 'blog/e-commerce-image-seo-alt-text-guide.html'),
        blogEtsySeoTr: resolve(import.meta.dirname, 'blog/etsy-urun-fotografciligi-ve-seo-rehberi.html'),
        blogEtsySeoEn: resolve(import.meta.dirname, 'blog/etsy-product-photography-and-seo-guide.html'),
        blogMidjourneyPromptTr: resolve(import.meta.dirname, 'blog/midjourney-stok-fotograf-prompt-ve-kalite-rehberi.html'),
        blogMidjourneyPromptEn: resolve(import.meta.dirname, 'blog/midjourney-stock-photography-prompts-and-quality-guide.html'),
        blogMetadataLimitsTr: resolve(import.meta.dirname, 'blog/stok-fotograf-etsy-metadata-sinirlari.html'),
        blogMetadataLimitsEn: resolve(import.meta.dirname, 'blog/stock-photo-etsy-metadata-limits.html'),
        toolMetadataCheckerTr: resolve(import.meta.dirname, 'araclar/metadata-kontrol/index.html'),
        toolMetadataCheckerEn: resolve(import.meta.dirname, 'en/tools/metadata-checker/index.html')
      },
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/@supabase/')) return 'supabase';
          if (id.includes('node_modules/i18next')) return 'i18n';
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
