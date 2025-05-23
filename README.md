# ✨ EtchNFT

**EtchNFT.com** is a hybrid web3 and maker project that brings digital ownership into the physical world.  
We transform your NFTs into beautifully etched, physical items — collectibles, wall art, and commemorative plaques — using precision laser engraving and decentralized metadata.

Whether you’re a collector, artist, or project founder, EtchNFT makes your onchain identity tangible.

---

## 🧠 Project Description

EtchNFT bridges the digital and physical by enabling NFT holders to mint permanent, real-world versions of their digital assets.  
This includes laser-etched plaques, collectible coins, QR-linked displays, and artist-signed editions.  

The project blends:
- Web3 ownership verification (wallet connect, ENS, Farcaster)
- NFT metadata parsing (ERC721, ERC1155)
- Physical fulfillment (via in-house laser engraving)
- Optional inscription onchain (Zora, IPFS)

We're building this to support:
- Artists & collectors wanting high-quality NFT physicals
- Communities doing POAP/commemorative drops
- Curated drops for milestone NFTs or DAO artifacts

---

## 🛠 Tech Stack

| Layer       | Tooling                          |
|-------------|----------------------------------|
| Frontend    | Astro + Tailwind + React         |
| Wallets     | RainbowKit / WalletConnect       |
| NFT Reads   | `viem`, `wagmi`, Alchemy API      |
| Fulfillment | In-house laser (Glowforge / Knight press) |
| Storage     | IPFS / Arweave                   |
| Optional    | Zora mint for onchain inscriptions |
| Frames      | Warpcast / Farcaster Miniapps    |

---

## 🚀 Getting Started

```bash
pnpm install
pnpm dev

🧾 Project Structure
bash
Copy
Edit
src/
├── pages/                # Astro route pages (e.g. index.astro, order.astro)
├── components/           # React + Astro UI
├── lib/                  # Utility functions for ENS, NFT fetch, metadata parse
├── styles/               # Tailwind config + global.css
├── content/              # Dynamic FAQ / drop metadata

✨ Core Features
🖼 View + verify NFT ownership via wallet or ENS

📄 Auto-parse metadata (name, artist, edition, traits)

🪪 Optional POAP/Farcaster profile support

🖨 Submit order for physical laser-etched item

🧾 Email + webhook support for fulfillment pipeline

🔒 Privacy-safe: no custodial wallet access or stored keys

📦 Build
bash
Copy
Edit
pnpm build
pnpm preview
🧪 Future Features
Compressed NFT support (Solana, Backpack)

QR-linked artifact registry (public or private)

Engrave from Farcaster frame claim

DAO mint/print funding drop

Onchain verification badges for physicals

🔗 Live URL
https://etchnft.com

📜 License
MIT — Copyright © 2025
Andrea Cozart-Lundin + EtchNFT Studio