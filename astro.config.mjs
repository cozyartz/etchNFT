// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';

// https://astro.build/config
export default defineConfig({
  integrations: [
    react(),
    tailwind()
  ],
  vite: {
    define: {
      // Expose public env vars used by Square SDK (or others)
      'import.meta.env.PUBLIC_SQUARE_APP_ID': JSON.stringify(process.env.PUBLIC_SQUARE_APP_ID),
      'import.meta.env.PUBLIC_SQUARE_LOCATION_ID': JSON.stringify(process.env.PUBLIC_SQUARE_LOCATION_ID)
    }
  }
});
