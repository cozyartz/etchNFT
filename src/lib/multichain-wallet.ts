// src/lib/multichain-wallet.ts
import { sdk } from "@farcaster/miniapp-sdk";
import { Connection, PublicKey, clusterApiUrl } from "@solana/web3.js";

export type Chain = "ethereum" | "solana";

export interface ChainConfig {
  name: string;
  symbol: string;
  icon: string;
  color: string;
  rpcUrl: string;
}

export interface WalletState {
  isConnected: boolean;
  address: string | null;
  chain: Chain;
  balance?: string;
}

export interface MintParams {
  type: "plaque" | "tee" | "acrylic";
  chain: Chain;
  recipient: string;
  metadata: {
    name: string;
    description: string;
    image: string;
    attributes: Array<{
      trait_type: string;
      value: string;
    }>;
  };
}

export const CHAIN_CONFIGS: Record<Chain, ChainConfig> = {
  ethereum: {
    name: "Ethereum",
    symbol: "ETH",
    icon: "⟠",
    color: "#627EEA",
    rpcUrl: "https://mainnet.infura.io/v3/YOUR_PROJECT_ID",
  },
  solana: {
    name: "Solana",
    symbol: "SOL",
    icon: "◎",
    color: "#14F195",
    rpcUrl: import.meta.env.HELIUS_API_KEY
      ? `https://mainnet.helius-rpc.com/?api-key=${import.meta.env.HELIUS_API_KEY}`
      : clusterApiUrl("mainnet-beta"),
  },
};

export class MultiChainWallet {
  private ethereumProvider: any = null;
  private solanaProvider: any = null;
  private solanaConnection: Connection | null = null;
  private currentChain: Chain = "ethereum";

  private walletStates: Record<Chain, WalletState> = {
    ethereum: { isConnected: false, address: null, chain: "ethereum" },
    solana: { isConnected: false, address: null, chain: "solana" },
  };

  constructor() {
    this.initializeConnections();
  }

  private async initializeConnections() {
    try {
      // Initialize Solana connection
      this.solanaConnection = new Connection(CHAIN_CONFIGS.solana.rpcUrl);

      // Get providers from SDK
      this.ethereumProvider = await sdk.wallet.getEthereumProvider();
      this.solanaProvider = await sdk.wallet.getSolanaProvider();
    } catch (error) {
      console.error("Failed to initialize wallet connections:", error);
    }
  }

  async connectWallet(chain: Chain): Promise<WalletState> {
    try {
      let address: string | null = null;

      if (chain === "ethereum") {
        // Connect to Ethereum
        if (this.ethereumProvider) {
          const accounts = await this.ethereumProvider.request({
            method: "eth_requestAccounts",
          });
          address = accounts[0];

          // Get balance
          const balance = await this.ethereumProvider.request({
            method: "eth_getBalance",
            params: [address, "latest"],
          });

          this.walletStates.ethereum = {
            isConnected: true,
            address,
            chain: "ethereum",
            balance: (parseInt(balance, 16) / 1e18).toFixed(4),
          };
        } else {
          throw new Error("Ethereum provider not available");
        }
      } else if (chain === "solana") {
        // Connect to Solana
        if (this.solanaProvider) {
          const response = await this.solanaProvider.connect();
          address = response.publicKey.toString();

          // Get balance
          const publicKey = new PublicKey(address);
          const balance = await this.solanaConnection?.getBalance(publicKey);

          this.walletStates.solana = {
            isConnected: true,
            address,
            chain: "solana",
            balance: balance ? (balance / 1e9).toFixed(4) : "0",
          };
        } else {
          throw new Error("Solana provider not available");
        }
      }

      return this.walletStates[chain];
    } catch (error) {
      console.error(`Failed to connect ${chain} wallet:`, error);
      throw error;
    }
  }

  async switchChain(chain: Chain): Promise<void> {
    this.currentChain = chain;

    // Connect to the new chain if not already connected
    if (!this.walletStates[chain].isConnected) {
      await this.connectWallet(chain);
    }
  }

  getCurrentChain(): Chain {
    return this.currentChain;
  }

  getWalletState(chain: Chain): WalletState {
    return this.walletStates[chain];
  }

  getAllWalletStates(): Record<Chain, WalletState> {
    return this.walletStates;
  }

  async mintNFT(params: MintParams): Promise<string> {
    const { chain } = params;
    const walletState = this.walletStates[chain];

    if (!walletState.isConnected || !walletState.address) {
      throw new Error(`${chain} wallet not connected`);
    }

    try {
      let signature: string;

      if (chain === "ethereum") {
        signature = await this.mintEthereumNFT(params);
      } else {
        signature = await this.mintSolanaNFT(params);
      }

      // Share to Farcaster
      await this.shareToFarcaster(params, signature);

      return signature;
    } catch (error) {
      console.error(`Failed to mint NFT on ${chain}:`, error);
      throw error;
    }
  }

  private async mintEthereumNFT(params: MintParams): Promise<string> {
    // TODO: Implement actual Ethereum NFT minting logic
    // For now, return a mock transaction hash
    await new Promise((resolve) => setTimeout(resolve, 2000));

    return `eth_${params.type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async mintSolanaNFT(params: MintParams): Promise<string> {
    // TODO: Implement actual Solana NFT minting logic
    // For now, return a mock transaction signature
    await new Promise((resolve) => setTimeout(resolve, 2000));

    return `sol_${params.type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async shareToFarcaster(
    params: MintParams,
    signature: string,
  ): Promise<void> {
    try {
      const chainConfig = CHAIN_CONFIGS[params.chain];
      const mintEmojis = {
        plaque: "🏆",
        tee: "👕",
        acrylic: "💎",
      };

      const text = `Just minted my custom ${params.type} NFT on @etchnft! ${mintEmojis[params.type]}✨\n\n${chainConfig.icon} Minted on ${chainConfig.name}\n💝 Phygital collectible - own it physically AND digitally.\n\nTx: ${signature}`;

      await sdk.actions.openComposer({
        text,
        embeds: [window.location.href],
      });
    } catch (error) {
      console.error("Failed to share to Farcaster:", error);
    }
  }

  async estimateGas(params: MintParams): Promise<{
    gasEstimate: string;
    gasPrice: string;
    currency: string;
  }> {
    const { chain } = params;

    if (chain === "ethereum") {
      // Mock Ethereum gas estimation
      return {
        gasEstimate: "0.002",
        gasPrice: "25 gwei",
        currency: "ETH",
      };
    } else {
      // Mock Solana fee estimation
      return {
        gasEstimate: "0.00025",
        gasPrice: "0.000005",
        currency: "SOL",
      };
    }
  }

  isWalletConnected(chain: Chain): boolean {
    return this.walletStates[chain].isConnected;
  }

  getAddress(chain: Chain): string | null {
    return this.walletStates[chain].address;
  }

  disconnect(chain: Chain): void {
    this.walletStates[chain] = {
      isConnected: false,
      address: null,
      chain,
      balance: undefined,
    };
  }

  disconnectAll(): void {
    this.disconnect("ethereum");
    this.disconnect("solana");
  }
}

export const multiChainWallet = new MultiChainWallet();
