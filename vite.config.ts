import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(() => {
  return {
    plugins: [react()],
    define: {
      // Maps the user's Vercel environment variable to the strict process.env.API_KEY expected by the SDK
      'process.env.API_KEY': JSON.stringify(process.env.NEXT_PUBLIC_GEMINI_API_KEY || '')
    },
    build: {
      outDir: 'dist',
    }
  };
});