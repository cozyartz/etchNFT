// @ts-check
import 'dotenv/config';
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import cloudflare from '@astrojs/cloudflare'; // ✅ REQUIRED for Workers + D1

// https://astro.build/config
export default defineConfig({
  output: 'server', // ✅ Required for SSR (Cloudflare Workers)
  adapter: cloudflare(), // ✅ Enables Worker deployment
  integrations: [
    react(),
    tailwind()
  ],
  vite: {
    define: {
      'import.meta.env.PUBLIC_SQUARE_APP_ID': JSON.stringify(process.env.PUBLIC_SQUARE_APP_ID),
      'import.meta.env.PUBLIC_SQUARE_LOCATION_ID': JSON.stringify(process.env.PUBLIC_SQUARE_LOCATION_ID)
    }
  }
});
