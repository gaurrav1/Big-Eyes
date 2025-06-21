import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { crx } from '@crxjs/vite-plugin';
import manifest from './public/manifest.json';

const __dirname = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  base: './',
  build: {
    assetsInlineLimit: 0,
    outDir: 'target',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: '[name].js',
        assetFileNames: '[name].[ext]',
      },
    },
  },
  plugins: [react(), crx( {manifest} )],
})
