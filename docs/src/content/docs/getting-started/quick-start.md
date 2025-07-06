---
title: Quick Start Guide
description: Get up and running with EtchNFT in minutes
---

# Quick Start Guide

This guide will help you get EtchNFT running locally for development or create your first physical NFT collectible.

## For Users: Creating Your First Collectible

### Step 1: Visit EtchNFT
Navigate to [etchnft.com](https://etchnft.com) in your browser.

### Step 2: Connect Your Wallet
1. Click "Connect Wallet" in the navigation
2. Choose your preferred wallet (MetaMask, WalletConnect, etc.)
3. Approve the connection request
4. Your NFTs will automatically load

### Step 3: Browse Your Collection
- View NFTs from all supported networks
- Click on any NFT to see details
- Use filters to find specific collections or traits

### Step 4: Customize Your Order
1. Click "Etch This NFT" on your chosen piece
2. Select material (wood, acrylic, metal, fabric)
3. Choose size and finishing options
4. Preview the laser etching layout

### Step 5: Complete Your Order
1. Add to cart and review your selection
2. Choose payment method (card or crypto)
3. Enter shipping information
4. Complete payment and receive confirmation

### Step 6: Track Your Order
- Check order status in "My Orders"
- Receive email updates on progress
- Track shipping once items are sent

## For Developers: Local Development

### Prerequisites
- Node.js 18+ and npm
- A Cloudflare account for deployment
- Environment variables (see [Environment Setup](/getting-started/environment/))

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/cozyartz/etchNFT.git
   cd etchNFT
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   npm run setup:env
   # Edit .env with your API keys
   ```

4. **Validate environment**
   ```bash
   npm run check:env
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

6. **Open in browser**
   Navigate to `http://localhost:4321`

### Key Development Commands

```bash
# Development
npm run dev          # Start dev server
npm run build        # Build for production
npm run preview      # Preview production build

# Utilities
npm run format       # Format code with Prettier
npm run clean        # Clean build artifacts
npm run deploy       # Build and deploy to Cloudflare

# Environment
npm run setup:env    # Generate .env from template
npm run check:env    # Validate required variables
```

### Project Structure

```
src/
├── components/      # Astro and React components
├── layouts/         # Page layouts and templates
├── lib/            # Utility functions and configurations
├── pages/          # Route pages and API endpoints
├── styles/         # Global CSS and Tailwind config
└── types/          # TypeScript type definitions

public/             # Static assets
migrations/         # Database schema and migrations
scripts/           # Build and deployment scripts
```

### Next Steps

- Read the [Installation Guide](/getting-started/installation/) for detailed setup
- Explore the [Architecture Overview](/architecture/overview/) to understand the system
- Check out the [API Reference](/api/overview/) for integration details
- Review [Development Guidelines](/development/guide/) for contributing

## Need Help?

- **Documentation**: Browse these docs for detailed guides
- **GitHub Issues**: Report bugs or request features
- **Community**: Join our Discord for support and discussion

## What's Next?

Now that you're up and running, explore:

- [Environment Setup](/getting-started/environment/) - Configure API keys and services
- [Architecture Overview](/architecture/overview/) - Understand the system design
- [API Reference](/api/overview/) - Integrate with EtchNFT's APIs
- [Contributing](/development/contributing/) - Help improve the platform