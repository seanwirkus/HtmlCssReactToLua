import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (id.includes('@babel/standalone')) return 'babel';
          if (id.includes('lucide-react')) return 'icons';
          if (id.includes('react')) return 'react';
          return 'vendor';
        },
      },
    },
  },
});
