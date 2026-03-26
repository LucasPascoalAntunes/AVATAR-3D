import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: false,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/three')) return 'three';
          if (id.includes('@react-three/fiber') || id.includes('@react-three/drei') || id.includes('@react-three/postprocessing')) return 'r3f';
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom') || id.includes('node_modules/zustand') || id.includes('node_modules/framer-motion')) return 'vendor';
        },
      },
    },
  },
});
