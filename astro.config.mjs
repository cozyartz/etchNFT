// @ts-check
import 'dotenv/config';
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  output: 'server',
  adapter: cloudflare(),
  integrations: [
    react(),
    tailwind()
  ],
  vite: {
    resolve: {
      alias: {
        '@': './src',
      }
    },
    define: {
      'import.meta.env.PUBLIC_SQUARE_APP_ID': JSON.stringify(process.env.PUBLIC_SQUARE_APP_ID ?? ''),
      'import.meta.env.PUBLIC_SQUARE_LOCATION_ID': JSON.stringify(process.env.PUBLIC_SQUARE_LOCATION_ID ?? '')
    },
    ssr: {
      external: ['crypto'] // Exclude from SSR bundling
    },
    build: {
      rollupOptions: {
        external: ['crypto'] // ✅ Correct location for Rollup bundling
      }
    }
  }
});
