/* Vite config for building the frontend react app: https://vite.dev/config/ */
import { defineConfig } from 'vite'
import { config } from 'dotenv';
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: '::',
    port: 8080,
    hmr: {
      protocol: 'ws',
      host: 'localhost',
      port: 24678,
      clientPort: 24678,
      timeout: 1000
    },
    proxy: {
      '/skip-config': {
        target: 'https://api.goskip.dev',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/skip-config/, '/v1/projects/localhost/config/public')
      },
      // encaminha /functions/* para a Edge Function em produção, evitando CORS no dev
      '/functions': {
        target: 'https://cackmzlupxtgtgyljjqy.supabase.co',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path.replace(/^\/functions/, '/functions')
      }
    }
  },
  experimental: {
    enableNativePlugin: true
  },
  build: {
    minify: mode !== 'development',
    sourcemap: mode === 'development',
    rollupOptions: {
      onwarn(warning, warn) {
        if (warning.code === 'MODULE_LEVEL_DIRECTIVE') {
          return
        }
        warn(warning)
      },
    },
  },
  plugins: [react()],
  define: {
    'process.env.NODE_ENV': JSON.stringify(mode ?? process.env.NODE_ENV ?? 'production'),
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'node',
    setupFiles: ['./tests/setup.ts']
  }
}))
