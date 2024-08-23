import { defineConfig } from 'vite';
import environment from 'vite-plugin-environment';
import react from '@vitejs/plugin-react';
import dotenv from 'dotenv';

dotenv.config({ path: '../../.env' });

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    environment('all', { prefix: 'CANISTER_' }),
    environment('all', { prefix: 'DFX_' }),
  ],
})