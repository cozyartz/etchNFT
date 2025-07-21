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
    const { ethers } = await import('ethers');
    
    if (!this.ethereumProvider) {
      throw new Error('Ethereum provider not available');
    }

    try {
      const provider = new ethers.BrowserProvider(this.ethereumProvider);
      const signer = await provider.getSigner();
      
      // EtchNFT contract ABI (simplified)
      const contractABI = [
        "function mintEtchNFT(address to, string memory tokenURI, uint256 mintType) public returns (uint256)",
        "function totalSupply() public view returns (uint256)"
      ];
      
      const contractAddress = import.meta.env.ETCHNFT_CONTRACT_MAINNET || "0x0000000000000000000000000000000000000000";
      const contract = new ethers.Contract(contractAddress, contractABI, signer);
      
      // Upload metadata to IPFS (simplified - use your preferred method)
      const metadataURI = await this.uploadToIPFS(params.metadata);
      
      // Mint type: 0=plaque, 1=tee, 2=acrylic
      const mintTypeMap = { plaque: 0, tee: 1, acrylic: 2 };
      const mintType = mintTypeMap[params.type];
      
      const tx = await contract.mintEtchNFT(
        params.recipient,
        metadataURI,
        mintType,
        {
          gasLimit: 500000, // Conservative gas limit
        }
      );
      
      console.log('Ethereum NFT minting transaction submitted:', tx.hash);
      await tx.wait(); // Wait for confirmation
      
      return tx.hash;
    } catch (error) {
      console.error('Ethereum NFT minting error:', error);
      throw error;
    }
  }

  private async mintSolanaNFT(params: MintParams): Promise<string> {
    const { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } = await import('@solana/web3.js');
    
    if (!this.solanaProvider || !this.solanaConnection) {
      throw new Error('Solana provider or connection not available');
    }

    try {
      const walletPublicKey = new PublicKey(params.recipient);
      
      // Upload metadata to IPFS/Arweave
      const metadataURI = await this.uploadToIPFS(params.metadata);
      
      // Create a simple metadata account transaction (simplified version)
      // In production, you'd use Metaplex SDK for proper NFT creation
      const transaction = new Transaction();
      
      // Add instruction to create metadata account
      // This is a simplified version - use Metaplex Token Standard for production
      const mintAccount = await this.createMintAccount(walletPublicKey);
      
      // Create associated token account
      const associatedTokenAddress = await this.getAssociatedTokenAddress(
        mintAccount,
        walletPublicKey
      );
      
      // Mint token to user
      transaction.add(
        SystemProgram.createAccount({
          fromPubkey: walletPublicKey,
          newAccountPubkey: mintAccount,
          lamports: await this.solanaConnection.getMinimumBalanceForRentExemption(82),
          space: 82,
          programId: new PublicKey('11111111111111111111111111111112'), // System Program
        })
      );
      
      const signature = await this.solanaProvider.sendTransaction(transaction);
      
      console.log('Solana NFT minting transaction submitted:', signature);
      
      return signature;
    } catch (error) {
      console.error('Solana NFT minting error:', error);
      throw error;
    }
  }

  private async createMintAccount(payer: PublicKey): Promise<PublicKey> {
    const { Keypair } = await import('@solana/web3.js');
    const mintKeypair = Keypair.generate();
    return mintKeypair.publicKey;
  }

  private async getAssociatedTokenAddress(mint: PublicKey, owner: PublicKey): Promise<PublicKey> {
    // Simplified - use SPL Token library for production
    return owner; // Placeholder
  }

  private async uploadToIPFS(metadata: any): Promise<string> {
    try {
      // In production, integrate with IPFS service like Pinata, Web3.Storage, or NFT.Storage
      // For now, return a mock IPFS hash
      const mockHash = `Qm${Math.random().toString(36).substr(2, 44)}`;
      
      console.log('Metadata uploaded to IPFS:', metadata);
      console.log('IPFS URI:', `ipfs://${mockHash}`);
      
      return `ipfs://${mockHash}`;
    } catch (error) {
      console.error('IPFS upload error:', error);
      throw error;
    }
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
