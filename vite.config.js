import { defineConfig } from 'vite'

export default defineConfig({
  root: '.',
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: './src/main.js'
      },
      output: {
        entryFileNames: 'app.bundle.js',
        chunkFileNames: 'chunks/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]'
      }
    },
    minify: 'terser',
    sourcemap: true,
    target: 'es2015'
  },
  server: {
    port: 3000,
    open: true
  }
})
