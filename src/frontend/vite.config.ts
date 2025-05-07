import { defineConfig } from 'vite';
import environment from 'vite-plugin-environment';
import react from '@vitejs/plugin-react';
import dotenv from 'dotenv';
import path from "path"


dotenv.config({ path: '../../.env' });

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    environment('all', { prefix: 'CANISTER_' }),
    environment('all', { prefix: 'DFX_' }),
  ],
  server: {
    proxy: {
      "/api": {
        target: "http://127.0.0.1:4943",
        changeOrigin: true,
      },
    },
  },
  resolve: {
    alias: {
      "@declarations": path.resolve(__dirname, "./../declarations"),
      "@": path.resolve(__dirname, "./src"),
    },
  }
})