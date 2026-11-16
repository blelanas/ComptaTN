import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    // '@/x' → '<root>/src/x' (Vite resolves leading '/' from the project root).
    alias: [{ find: /^@\//, replacement: '/src/' }],
  },
  server: { port: 5173 },
});
