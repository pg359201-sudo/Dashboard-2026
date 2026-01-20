import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  define: {
    // Polyfill process.env for compatibility with existing code if needed,
    // though we updated constants.ts to use import.meta.env as well.
    'process.env': {} 
  }
});