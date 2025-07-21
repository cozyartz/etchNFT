// @ts-check
import 'dotenv/config';
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwind from '@astrojs/tailwind';
import cloudflare from '@astrojs/cloudflare';

// Validate critical environment variables
const requiredEnvVars = {
  PUBLIC_PAYPAL_CLIENT_ID: process.env.PUBLIC_PAYPAL_CLIENT_ID,
  PAYPAL_CLIENT_SECRET: process.env.PAYPAL_CLIENT_SECRET,
};

const missingVars = Object.entries(requiredEnvVars)
  .filter(([key, value]) => !value)
  .map(([key]) => key);

if (missingVars.length > 0) {
  console.warn(`⚠️  Missing environment variables: ${missingVars.join(', ')}`);
  console.warn('PayPal integration may not work properly without these variables');
}

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
        external: ['crypto'], // ✅ Correct location for Rollup bundling
        output: {
          manualChunks: {
            // Core vendor libraries
            'vendor-react': ['react', 'react-dom'],
            'vendor-web3': ['@rainbow-me/rainbowkit', 'wagmi', 'viem', 'ethers'],
            'vendor-wallet': ['@solana/wallet-adapter-react', '@solana/web3.js'],
            'vendor-ui': ['framer-motion', '@headlessui/react', 'lucide-react'],
            'vendor-crypto': ['alchemy-sdk', '@coinbase/cdp-sdk'],
            'vendor-paypal': ['@paypal/paypal-server-sdk'],
            
            // Separate large language bundles
            'i18n-core': ['react-hot-toast'],
          }
        }
      },
      chunkSizeWarningLimit: 1000 // Increase limit to 1MB for cleaner builds
    }
  }
});
