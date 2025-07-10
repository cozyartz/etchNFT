# ✨ EtchNFT

**Transform your digital NFTs into premium physical collectibles**

EtchNFT bridges the digital and physical worlds by transforming your NFTs into beautifully laser-etched collectibles. Whether you're a collector, artist, or project founder, EtchNFT makes your on-chain identity tangible through precision craftsmanship.

[![Deploy to Cloudflare](https://img.shields.io/badge/Deploy%20to-Cloudflare-orange)](https://dash.cloudflare.com/?to=/:account/pages/new)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue)](https://www.typescriptlang.org/)

🌐 **Live Site**: [etchnft.com](https://etchnft.com)  
📚 **Documentation**: [docs.etchnft.com](https://docs.etchnft.com)  
🐛 **Issues**: [GitHub Issues](https://github.com/cozyartz/etchNFT/issues)

---

## 🚀 Quick Start

### For Users
1. Visit [etchnft.com](https://etchnft.com)
2. Connect your Web3 wallet
3. Browse your NFT collection
4. Select NFTs to transform into physical collectibles
5. Customize materials and finishes
6. Complete your order with crypto or card

### For Developers

```bash
# Clone and install
git clone https://github.com/cozyartz/etchNFT.git
cd etchNFT
npm install

# Set up environment
npm run setup:env
# Edit .env with your API keys

# Start development
npm run dev
```

Visit `http://localhost:4321` to see your local instance.

---

## 🔗 Smart Contract Integration

EtchNFT features a comprehensive smart contract escrow system that provides secure, transparent order processing:

### Key Features
- **Escrow Protection**: Customer funds held in smart contracts until order completion
- **Multi-Chain Deployment**: Ethereum, Polygon, Base, and Optimism support
- **Automated Refunds**: Instant blockchain refunds within cancellation windows
- **Admin Controls**: Emergency refund capabilities with proper authorization
- **Transparency**: All transactions verifiable on-chain

### Contract Addresses
```
Ethereum Mainnet: 0x0000000000000000000000000000000000000000
Polygon Mainnet:  0x0000000000000000000000000000000000000000
Base Mainnet:     0x0000000000000000000000000000000000000000
Optimism Mainnet: 0x0000000000000000000000000000000000000000
```

### Security Features
- **Reentrancy Protection**: Guards against common attack vectors
- **Access Control**: Role-based permissions for admin functions
- **Time-Based Controls**: 24-hour cancellation and 30-day emergency windows
- **Signature Verification**: Cryptographic proof of user authorization

---

## 🏗 Architecture

EtchNFT is built with modern web technologies for performance, scalability, and developer experience:

### Frontend Stack
- **[Astro](https://astro.build)** - Modern web framework with zero JS by default
- **[React](https://react.dev)** - Interactive components where needed
- **[Tailwind CSS](https://tailwindcss.com)** - Utility-first styling
- **[RainbowKit](https://rainbowkit.com)** - Beautiful Web3 wallet connections

### Backend & Infrastructure  
- **[Cloudflare Workers](https://workers.cloudflare.com)** - Edge computing platform
- **[D1 Database](https://developers.cloudflare.com/d1)** - Serverless SQLite database
- **[Lucia Auth](https://lucia-auth.com)** - Secure session management
- **Smart Contracts** - Solidity-based escrow system with multi-chain deployment
- **Multi-chain support** - Ethereum, Polygon, Solana, Base, Optimism

### Integrations
- **Square** - Traditional payment processing with webhooks
- **Coinbase Commerce** - Cryptocurrency payments with webhook confirmations
- **Alchemy SDK** - Multi-chain NFT metadata and ownership verification
- **Resend** - Transactional email delivery
- **Ethers.js** - Smart contract interactions and blockchain connectivity

---

## ✨ Features

### 🔗 Multi-Chain NFT Support
Connect any Web3 wallet to browse NFTs across:
- Ethereum (ERC-721, ERC-1155)
- Polygon (low-cost gaming NFTs)
- Solana (high-performance blockchain)
- Base (Coinbase L2 network)
- Optimism (Ethereum scaling)

### 🎨 Premium Physical Products
Transform NFTs into high-quality collectibles:
- **Laser-etched wood plaques** with natural grain patterns
- **Crystal-clear acrylic displays** with vibrant colors  
- **Brushed metal engravings** for luxury collectibles
- **Custom apparel** with detailed NFT artwork
- **Various sizes** from keepsakes to wall art

### 💳 Flexible Payment Options
- **Traditional**: Credit cards, Apple Pay, Google Pay via Square
- **Crypto**: Bitcoin, Ethereum, and 50+ cryptocurrencies via Coinbase Commerce
- **Smart Contract Escrow**: Web3 payments with blockchain-based customer protection
- **Automated Refunds**: 24-hour cancellation window with instant blockchain refunds
- **Global**: Worldwide shipping with tracking

### 🔐 Security & Privacy
- **Non-custodial**: No private key access or storage
- **Smart Contract Escrow**: Customer funds protected in blockchain escrow
- **Read-only**: Safe NFT browsing without wallet risks
- **Verified ownership**: Real-time blockchain verification
- **Secure payments**: PCI DSS compliant processing with webhook verification
- **RBAC System**: Role-based access control for administrative functions

---

## 🛠 Development

### Prerequisites
- Node.js 18+ and npm
- Cloudflare account for deployment
- API keys for external services

### Environment Setup

1. **Copy environment template**
   ```bash
   npm run setup:env
   ```

2. **Required API Keys**
   ```env
   # Payment Processing
   PUBLIC_SQUARE_APP_ID=your_square_app_id
   PUBLIC_SQUARE_LOCATION_ID=your_square_location_id
   COINBASE_COMMERCE_API_KEY=your_coinbase_key

   # NFT Data (Alchemy SDK)
   ALCHEMY_API_KEY=your_alchemy_api_key
   ALCHEMY_ETH_MAINNET_URL=https://eth-mainnet.g.alchemy.com/v2/your_key
   ALCHEMY_POLYGON_MAINNET_URL=https://polygon-mainnet.g.alchemy.com/v2/your_key
   ALCHEMY_BASE_MAINNET_URL=https://base-mainnet.g.alchemy.com/v2/your_key

   # Smart Contract Deployment
   PRIVATE_KEY=your_wallet_private_key_for_deployment
   ETHERSCAN_API_KEY=your_etherscan_api_key
   POLYGONSCAN_API_KEY=your_polygonscan_api_key
   BASESCAN_API_KEY=your_basescan_api_key

   # Webhook Security
   SQUARE_WEBHOOK_SIGNATURE_KEY=your_square_webhook_key
   COINBASE_WEBHOOK_SECRET=your_coinbase_webhook_secret

   # Admin Access
   ADMIN_API_KEY=your_secure_admin_api_key

   # Email
   RESEND_API_KEY=your_resend_key

   # Authentication (required for admin)
   GITHUB_CLIENT_ID=your_github_client_id
   GITHUB_CLIENT_SECRET=your_github_client_secret
   ```

3. **Validate setup**
   ```bash
   npm run check:env
   ```

### Development Commands

```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build

# Code Quality
npm run format       # Format with Prettier
npm run clean        # Clean build artifacts

# Deployment
npm run deploy       # Deploy to Cloudflare Pages
```

### Project Structure

```
src/
├── components/      # UI components (Astro + React)
│   ├── react/      # Interactive React components
│   └── *.astro     # Static Astro components
├── layouts/        # Page layouts and templates
├── lib/           # Utilities and configurations
│   ├── auth.ts    # Authentication setup
│   ├── db.ts      # Database connection
│   ├── contract-signing.ts # Smart contract interactions
│   ├── rate-limiter.ts # API rate limiting
│   └── wagmi-config.ts # Web3 configuration
├── pages/         # File-based routing
│   ├── api/       # API endpoints
│   │   ├── admin/ # Administrative functions
│   │   ├── orders/ # Order management
│   │   └── webhooks/ # Payment confirmations
│   └── *.astro    # Page components
└── styles/        # Global CSS and Tailwind

contracts/        # Smart contract source code
public/           # Static assets
docs/             # Starlight documentation
legal/            # Legal document templates
migrations/       # Database schema
scripts/          # Build, deployment, and utility scripts
```

---

## 📚 Documentation

Comprehensive documentation is available at [docs.etchnft.com](https://docs.etchnft.com):

- **[Getting Started](https://docs.etchnft.com/getting-started/introduction/)** - Learn about EtchNFT
- **[API Reference](https://docs.etchnft.com/api/overview/)** - Complete API documentation  
- **[Architecture](https://docs.etchnft.com/architecture/overview/)** - System design and components
- **[Development Guide](https://docs.etchnft.com/development/guide/)** - Contributing to the project

### Build Documentation Locally

```bash
cd docs
npm install
npm run dev
```

---

## 🚀 Deployment

EtchNFT is designed for Cloudflare's serverless platform:

### Automatic Deployment
- **Main branch** → Production (`etchnft.com`)
- **Pull requests** → Preview deployments
- **Documentation** → `docs.etchnft.com`

### Manual Deployment
```bash
# Install Wrangler CLI
npm install -g wrangler

# Authenticate with Cloudflare
wrangler auth

# Deploy
npm run deploy
```

### Database Migrations
```bash
# Run migrations
wrangler d1 migrations apply etchnft --local  # Local
wrangler d1 migrations apply etchnft          # Production

# RBAC system migration
node scripts/migrate-rbac.js
```

### Smart Contract Deployment
```bash
# Install contract dependencies
npm install --prefix .

# Compile contracts
npx hardhat compile

# Deploy to testnet
npx hardhat run scripts/deploy.js --network sepolia

# Deploy to mainnet
npx hardhat run scripts/deploy.js --network mainnet

# Verify contracts
npx hardhat verify --network mainnet <contract-address>
```

---

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](https://docs.etchnft.com/development/contributing/) for details.

### Quick Contribution Steps
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes and add tests
4. Commit your changes (`git commit -m 'Add amazing feature'`)
5. Push to the branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

### Development Guidelines
- Follow the existing code style
- Add tests for new features
- Update documentation as needed
- Ensure all checks pass before submitting

---

## 🎯 Use Cases

### For Collectors
Transform your most valuable NFTs into display pieces for your home, office, or gallery.

### For Artists  
Offer physical versions of your digital art to collectors, expanding your revenue streams.

### For Communities
Create commemorative items for DAOs, gaming guilds, and NFT project milestones.

### For Gifts
Give unique, personalized gifts that combine digital ownership with physical presence.

---

## 🔮 Roadmap

### Phase 1: Foundation ✅
- ✅ Multi-chain NFT support (Ethereum, Base, Solana, Polygon)
- ✅ Premium laser etching materials (wood, acrylic, metal)
- ✅ Smart contract escrow system with multi-chain deployment
- ✅ Automated refund processing with 24-hour cancellation window
- ✅ Payment webhook integration (Square, Coinbase Commerce)
- ✅ RBAC user management system with GitHub OAuth
- ✅ Custom NFT upload and minting capabilities
- ✅ Global shipping infrastructure

### Phase 2: Enhanced Features (Q2 2025)
- 🔄 Compressed NFT support (Solana cNFTs)
- 🔄 Farcaster Frame integration
- 🔄 QR-linked artifact registry
- 🔄 AI-powered etching optimization
- 🔄 Mobile application development
- 🔄 Advanced analytics dashboard

### Future Vision
- 📋 DAO treasury integration
- 📋 Artist royalty distributions  
- 📋 Social gifting features
- 📋 Augmented reality previews

---

## 📊 Stats & Performance

- **Global CDN**: 300+ edge locations via Cloudflare
- **Performance**: 95+ Lighthouse scores across all metrics
- **Scalability**: Serverless architecture handles traffic spikes
- **Security**: Smart contract escrow, SOC 2 compliance, PCI DSS payment processing
- **Multi-Chain**: Deployed on 4+ blockchain networks
- **Uptime**: 99.9% availability with automated failover

---

## 📞 Support & Community

- **Documentation**: [docs.etchnft.com](https://docs.etchnft.com)
- **GitHub Issues**: [Report bugs or request features](https://github.com/cozyartz/etchNFT/issues)
- **Email**: [support@etchnft.com](mailto:support@etchnft.com)
- **Twitter**: [@EtchNFT](https://twitter.com/EtchNFT)
- **Discord**: [Join our community](https://discord.gg/etchnft)

---

## 📜 License

MIT License - Copyright © 2025 Andrea Cozart-Lundin + EtchNFT Studio

See [LICENSE](LICENSE) for details.

---

## 🙏 Acknowledgments

Built with amazing open-source tools:
- [Astro](https://astro.build) for the incredible developer experience
- [Cloudflare](https://cloudflare.com) for edge computing platform
- [RainbowKit](https://rainbowkit.com) for seamless Web3 integration
- [Tailwind CSS](https://tailwindcss.com) for rapid UI development

Special thanks to the Web3 community for pushing the boundaries of digital ownership and creative expression.