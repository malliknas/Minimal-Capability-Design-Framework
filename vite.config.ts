// vite.config.ts - FINAL WORKING VERSION
import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  root: resolve(__dirname, 'browser-deployment'),  // Set working directory
  base: './',
  
  build: {
    outDir: resolve(__dirname, 'browser-deployment/dist'),  // Absolute output path
    emptyOutDir: true,
    target: 'esnext',
    minify: 'esbuild',
    sourcemap: true,
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      input: resolve(__dirname, 'browser-deployment/index.html'),  // Absolute input
      output: {
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'js/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          if (assetInfo.name?.endsWith('.css')) {
            return 'css/[name]-[hash].css';
          }
          return 'assets/[name]-[hash].[ext]';
        },
        manualChunks: {
          'webllm-core': ['@mlc-ai/web-llm'],
          'mcd-framework': [
            resolve(__dirname, 'src/test-config'),
            resolve(__dirname, 'src/evaluator'),
            resolve(__dirname, 'src/drift-detector'),
            resolve(__dirname, 'src/model-loader'),
            resolve(__dirname, 'src/logger')
          ],
          'chapter7-walkthroughs': [
            resolve(__dirname, 'src/domain-walkthroughs'),
            resolve(__dirname, 'src/walkthrough-evaluator')
          ]
        }
      }
    }
  },
  
  server: {
    port: 3000,
    host: true,
    open: true,
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp'
    }
  },
  
  optimizeDeps: {
    exclude: ['@mlc-ai/web-llm']
  },
  
  esbuild: {
    target: 'esnext',
    platform: 'browser'
  },
  
  define: {
    global: 'globalThis',
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development')
  },
  
  resolve: {
    alias: {
      '@root': resolve(__dirname, 'src'),
      '@browser': resolve(__dirname, 'browser-deployment/src')
    }
  }
})
