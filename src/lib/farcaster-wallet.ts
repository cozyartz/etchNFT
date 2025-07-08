// src/lib/farcaster-wallet.ts
import { sdk } from "@farcaster/miniapp-sdk";

export interface WalletConnection {
  address: string;
  isConnected: boolean;
  provider: any;
}

export interface MintParams {
  type: "plaque" | "tee" | "acrylic";
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

export class FarcasterWallet {
  private provider: any = null;
  private address: string = "";
  private isConnected: boolean = false;

  async connect(): Promise<WalletConnection> {
    try {
      // Use Farcaster's built-in wallet connection
      const context = await sdk.context;

      if (context.user?.verifiedAddresses?.ethAddresses?.[0]) {
        this.address = context.user.verifiedAddresses.ethAddresses[0];
        this.isConnected = true;

        // Get Ethereum provider if available
        if (typeof window !== "undefined" && (window as any).ethereum) {
          this.provider = (window as any).ethereum;
        }

        return {
          address: this.address,
          isConnected: this.isConnected,
          provider: this.provider,
        };
      }

      throw new Error("No verified Ethereum address found");
    } catch (error) {
      console.error("Failed to connect wallet:", error);
      throw error;
    }
  }

  async mintNFT(params: MintParams): Promise<string> {
    if (!this.isConnected) {
      throw new Error("Wallet not connected");
    }

    try {
      // Mock mint transaction - replace with actual Solana minting logic
      const mintResult = await this.mockMint(params);

      // Share the successful mint to Farcaster
      await this.shareToFarcaster(params, mintResult.signature);

      return mintResult.signature;
    } catch (error) {
      console.error("Mint failed:", error);
      throw error;
    }
  }

  private async mockMint(params: MintParams): Promise<{ signature: string }> {
    // Simulate minting process
    await new Promise((resolve) => setTimeout(resolve, 2000));

    return {
      signature: `mint_${params.type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
  }

  private async shareToFarcaster(
    params: MintParams,
    signature: string,
  ): Promise<void> {
    try {
      const mintEmojis = {
        plaque: "🏆",
        tee: "👕",
        acrylic: "💎",
      };

      const text = `Just minted my custom ${params.type} NFT on @etchnft! ${mintEmojis[params.type]}✨\n\nPhygital collectible - own it physically AND digitally.\n\nTx: ${signature}`;

      await sdk.actions.openComposer({
        text,
        embeds: [window.location.href],
      });
    } catch (error) {
      console.error("Failed to share to Farcaster:", error);
    }
  }

  getAddress(): string {
    return this.address;
  }

  isWalletConnected(): boolean {
    return this.isConnected;
  }
}

export const farcasterWallet = new FarcasterWallet();
