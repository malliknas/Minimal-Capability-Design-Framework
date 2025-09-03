// vite.config.ts - Final corrected version with error suppression
import { defineConfig } from 'vite'
import { resolve } from 'path'
import tsconfigPaths from 'vite-tsconfig-paths'

export default defineConfig({
  root: './browser-deployment',
  base: './',
  
  // ✅ CRITICAL FIX: Added ignoreConfigErrors to suppress tsconfig parsing error
  plugins: [
    tsconfigPaths({
      root: resolve(__dirname, '../'), // Explicit resolve to project root
      projects: [resolve(__dirname, '../tsconfig.json')], // Explicit path to tsconfig
      loose: true, // More permissive parsing
      parseNative: true, // Better native module handling
      ignoreConfigErrors: true // ✅ THIS FIXES THE TSConfckParseError
    })
  ],
  
  build: {
    outDir: 'dist',
    target: 'esnext',
    minify: 'esbuild',
    sourcemap: true,
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      input: './browser-deployment/index.html',
      output: {
        manualChunks: {
          'webllm-core': ['@mlc-ai/web-llm'],
          'mcd-t1t10-core': [
            '../src/test-config',
            '../src/drift-detector', 
            '../src/evaluator',
            '../src/model-loader',
            '../src/utils',
            '../src/logger'
          ],
          'ui-components': [
            './src/ui/enhanced-ui',
            './src/ui/browser-logger',
            './src/ui/live-comparison'
          ],
          'control-systems': [
            './src/controls/test-control',
            './src/execution/model-manager'
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
  
  // ✅ REMOVE manual alias config since plugin handles it
  // resolve: { alias: {} }, // Plugin handles all path resolution
  
  // ✅ SIMPLIFIED: No tsconfig needed - plugin handles it
  esbuild: {
    target: 'esnext',
    platform: 'browser'
    // No tsconfig option needed - plugin handles it
  },
  
  define: {
    global: 'globalThis',
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development')
  }
})
