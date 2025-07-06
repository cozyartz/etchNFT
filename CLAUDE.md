# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

EtchNFT is a web3 project that bridges digital NFTs with physical items through laser engraving. Users can connect their wallets, view their NFTs, and order physical etched versions. The application uses Astro with React components, deployed on Cloudflare Workers with D1 database.

## Development Commands

- `npm run dev` - Start development server
- `npm run build` - Build for production  
- `npm run preview` - Preview production build
- `npm run astro` - Run Astro CLI commands
- `npm run format` - Format code with Prettier
- `npm run clean` - Clean build artifacts and dependencies
- `npm run setup:env` - Generate .env file from .env.example
- `npm run check:env` - Validate required environment variables
- `npm run deploy` - Build and deploy to Cloudflare Pages

Note: The README mentions `pnpm` but package.json uses `npm` scripts. Use `npm` for consistency with the package.json configuration.

## Architecture

### Frontend Stack
- **Astro** with server-side rendering (`output: 'server'`)
- **React** components in `src/components/react/`
- **Tailwind CSS** for styling
- **RainbowKit/Wagmi** for wallet connections
- **Viem/Ethers** for blockchain interactions

### Backend & Database
- **Cloudflare Workers** deployment (via `@astrojs/cloudflare` adapter)
- **D1 SQLite database** bound as `DB` in wrangler.toml
- **Lucia** for authentication (GitHub OAuth)
- Database access via `getDatabase()` from `src/lib/db.ts`
- **Multichain wallet support** - Ethereum, Solana, and Farcaster integration

### Key Database Tables
- `users` - GitHub OAuth user accounts
- `sessions` - Lucia auth sessions  
- `orders` - NFT etching orders with fulfillment tracking
- `subscribers` - Email newsletter subscribers

### API Routes Structure
- `src/pages/api/auth/` - Authentication endpoints
- `src/pages/api/nfts/[address].ts` - NFT metadata fetching
- `src/pages/api/order.ts` - Order processing
- `src/pages/api/cert/[id].ts` - Certificate generation

### State Management
- **CartContext** (`src/components/react/CartContext.tsx`) - Shopping cart state
- **Local storage** for cart persistence
- **Wagmi hooks** for wallet state

### Environment & Configuration
- Environment variables defined in `astro.config.mjs` vite.define
- Square payment integration (`PUBLIC_SQUARE_APP_ID`, `PUBLIC_SQUARE_LOCATION_ID`)
- D1 database binding configured in `wrangler.toml`
- Node.js compatibility enabled for Lucia auth
- Required environment variables: `SIMPLEHASH_API_KEY`, `COINBASE_COMMERCE_API_KEY`, `RESEND_API_KEY`
- Optional: `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` for admin access
- Use `npm run check:env` to validate environment setup

### Authentication Flow

- GitHub OAuth via Lucia auth (`src/lib/auth.ts`)
- Session validation with `requireUser()` helper
- Admin routes protected in `src/pages/admin/`

### Order Processing

- Cart items stored in React context
- Order submission creates D1 database records
- Email confirmations sent via `src/lib/email.ts`
- Certificate URLs generated as `/cert/{orderId}`

### Deployment

- Cloudflare Workers with D1 database
- Uses compatibility flags: `nodejs_compat`
- TypeScript with strict Astro config
