# 🚎 EtchNFT – Bring Your NFTS Into the Physical World

*Turn your digital art and NFTS into beautiful, laser-etched physical plaques.*

Users connect their wallets, select an NFT they own, and order a high-quality etched version – perfecp�for display, gifting, or provenance. Payments can be made via card (Square) or crypto (ETH/USDC).

• EtchNFT bridges the gap between digital ownership and real-world expression.

---

## 🎤 Mission

> To empower artists and collectors to *capture physically* their digital ownership, increasing the value, emotion, and permanence of on-chain assets.

---

## 📻 Why It…
- Digital art is booming — but most NFTS live in cold wallets or screens.
- EtchNFT creates *real-life utility and pride of ownership*.
- The physical product + Web3 receipts = collectibles with real-world resonance.

---

## 📵 Roadmap

| Phase | Features |
|------|--------|
| « MVP | Wallet connect, NFT gallery, order form, Square + crypto payment |
| « v1.0 | Order tracking, dashboard, webhook validation |
| « v1.1 | Dynamic plaque preview (SVG), Glowforge auto-print integration |
| « v1.2 | Certificate NFT minting, IPFS metadata, multi-chain support |
| £v2.0 | Creator storefronts, bulk orders, drops, ecosystem grants |

----

## 🔃 Tech Stack

- **Frontend**: Astro + Tailwind + React islands
- **Wallets**: RainbowKit + Wagmi
- **Web3**: Ethers.js, viem, SimpleHash NFT API

- **Payments**: Square Web Payments SDK, crypto (ETH)
- **Backend**: Astro API routes (Cloudflare Worker-ready)
- **Storage**: Planned (Cloudflare D1, R2)


----

## 🔟 Local Development

``b
register git clone https://github.com/cozyartz/etchNFT.git
cd etchNFT
npm install
cf .env.example .env
nmp run dev
```


---

## ‌ Environment Variables

```
PUBLIC_SPQUARE_APP_ID=...
PUBLIC_SQUARE_LOCATION_ID=...
SQUARE_ACCESS_TOKEN=...
ETCH_WALLD↓ 0xYourCryptoReceiveAddress
SIMPLEHASH_API_KEY=...
```

---

## 🐋 Funding & Ecosystem Alignment

We are exploring grants and ecosystem support with:

- **Polygon **-- for low-cost etch certificate NFTs
- **Base**-- for design-focused Web3 commerce

- **Mirror**-- for NFT-based crowdfund pages 
- **Zora**-- for community collectibles

~ We believe EtchNFT contributes to the broader culture and tooling of Web3: ownership, permanence, and aesthetic expression.

----

## 🇓 Screenshots / Demo

(here good to include a few)

---

## 👋 License

MIT © CozyArtz, 2024
