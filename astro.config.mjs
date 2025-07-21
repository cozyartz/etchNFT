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
      'import.meta.env.PUBLIC_PAYPAL_CLIENT_ID': JSON.stringify(process.env.PUBLIC_PAYPAL_CLIENT_ID ?? ''),
      'import.meta.env.PUBLIC_WALLETCONNECT_PROJECT_ID': JSON.stringify(process.env.PUBLIC_WALLETCONNECT_PROJECT_ID ?? ''),
      'import.meta.env.ALCHEMY_API_KEY': JSON.stringify(process.env.ALCHEMY_API_KEY ?? ''),
      'import.meta.env.ALCHEMY_ETH_MAINNET_URL': JSON.stringify(process.env.ALCHEMY_ETH_MAINNET_URL ?? ''),
      'import.meta.env.ALCHEMY_POLYGON_MAINNET_URL': JSON.stringify(process.env.ALCHEMY_POLYGON_MAINNET_URL ?? ''),
      'import.meta.env.ALCHEMY_BASE_MAINNET_URL': JSON.stringify(process.env.ALCHEMY_BASE_MAINNET_URL ?? '')
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
