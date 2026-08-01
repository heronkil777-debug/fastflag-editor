import path from 'path';
import { fileURLToPath } from 'url';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  build: {
    // Gera chunks separados para melhor cache do navegador
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks
          'vendor-react': ['react', 'react-dom'],
          'vendor-zustand': ['zustand', 'zundo'],
          'vendor-utils': ['clsx', 'tailwind-merge', 'zod'],
          // Electron-related (carregados apenas no main process, não no renderer)
        },
      },
    },
    // Não minificar HTML para debugging mais fácil (opcional)
    minify: 'esbuild',
  },
});
