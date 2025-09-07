// vite.config.ts - CORRECTED VERSION WITH VERIFIED FILE PATHS
import { defineConfig } from 'vite'
import { resolve } from 'path'

export default defineConfig({
  // ✅ PRESERVED: Working absolute path resolution
  root: resolve(__dirname, 'browser-deployment'),
  base: './',
  
  build: {
    outDir: 'dist',
    target: 'esnext',
    minify: 'esbuild',
    sourcemap: true,
     
    chunkSizeWarningLimit: 2000, // 2MB instead of 500KB
    rollupOptions: {
      output: {
        
        manualChunks: {
          // Separate WebLLM into its own chunk
          'webllm-core': ['@mlc-ai/web-llm'],
          
          
          'mcd-framework': [
            resolve(__dirname, '../src/test-config'),
            resolve(__dirname, '../src/evaluator'),
            resolve(__dirname, '../src/drift-detector'),
            resolve(__dirname, '../src/model-loader'),
            resolve(__dirname, '../src/logger')
            //
          ],
          
          
          'chapter7-walkthroughs': [
            resolve(__dirname, '../src/domain-walkthroughs'),
            resolve(__dirname, '../src/walkthrough-evaluator')
          ],
          
           
          'ui-components': [
            './src/ui/browser-logger',
            './src/ui/enhanced-ui',
            './src/ui/live-comparison',
            './src/ui/detailed-results',
            './src/ui/walkthrough-ui',
            './src/ui/domain-results'
          ],
          
          
          'control-systems': [
            './src/controls/test-control',
            './src/controls/button-handlers',
            './src/execution/model-manager',
            './src/execution/test-runner',
            './src/execution/trial-executor'
          ],
          
          
          'export-systems': [
            './src/export/result-exporter',
            './src/export/summary-generator'
          ]
        },
        
        
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId
            ? chunkInfo.facadeModuleId.split('/').pop().replace('.ts', '')
            : 'chunk';
          return `js/${facadeModuleId}-[hash].js`;
        },
        
         
        assetFileNames: (assetInfo) => {
          if (assetInfo.name && assetInfo.name.endsWith('.css')) {
            return 'css/[name]-[hash].css';
          }
          return 'assets/[name]-[hash].[ext]';
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
    exclude: ['@mlc-ai/web-llm'],
    include: ['path']
  },
  
  esbuild: {
    target: 'esnext',
    platform: 'browser',
    treeShaking: true
  },
  
  define: {
    global: 'globalThis',
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development')
  },
  
  
  resolve: {
    alias: {
       
      '@root': resolve(__dirname, '../src'),
      '@browser': resolve(__dirname, 'browser-deployment/src'),
      '@ui': resolve(__dirname, 'browser-deployment/src/ui'),
      '@controls': resolve(__dirname, 'browser-deployment/src/controls'),
      '@execution': resolve(__dirname, 'browser-deployment/src/execution'),
      '@export': resolve(__dirname, 'browser-deployment/src/export')
    }
  }
})
