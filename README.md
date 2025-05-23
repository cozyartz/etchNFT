# 🌿 Tokn420

**tokn420.cc** — A decentralized cannabis culture protocol.  
Built by patients. Powered by culture. On-chain for impact.

This project is a dark-mode, glowing-green Astro app with animated UI, wallet integration, and an on-chain mint experience — EVM or Solana, your choice.

---

## 🧠 What It Does

- 💫 Custom mint page with animated CTA
- 🔗 Wallet connect via EVM or Phantom
- 🎨 Motion UI + Tailwind + neon theme
- 🧾 Zine system powered by Astro content collections
- 🔄 Optional: Divvi referral SDK (EVM)
- 🌱 Grants-ready open web3 project

---

## ⚙️ Tech Stack

| Feature        | Stack                         |
|----------------|-------------------------------|
| UI             | Astro + Tailwind + React      |
| Animations     | Framer Motion                 |
| Wallets (EVM)  | `viem` + MetaMask             |
| Wallets (Sol)  | `@solana/web3.js` + Phantom   |
| Notifications  | `react-hot-toast`             |
| Markdown Zines | Astro content collections     |

---

## 🚀 Getting Started

```bash
pnpm install
pnpm dev

src/
├── pages/            # Astro route pages (e.g. index.astro, mint.astro)
├── components/
│   └── react/        # React components like MintWithDivvi.tsx
├── styles/           # Tailwind + custom CSS
├── abi/              # Zora or Solana ABI files (EVM only)
├── content/zine/     # Markdown-based zine entries


🧾 License
MIT — Andrea Cozart-Lundin & Tokn420 Collective
https://tokn420.cc