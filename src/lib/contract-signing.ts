// src/lib/contract-signing.ts
import { parseEther, parseUnits } from "viem";
import {
  writeContract,
  waitForTransactionReceipt,
  signMessage,
} from "wagmi/actions";
import { getWalletClient } from "@wagmi/core";
import { mainnet, polygon, base, optimism } from "wagmi/chains";

export interface ContractConfig {
  address: `0x${string}`;
  abi: any[];
  chainId: number;
}

export interface SignatureData {
  message: string;
  signature: `0x${string}`;
  address: `0x${string}`;
  timestamp: number;
}

export interface OrderSignature {
  orderId: string;
  customerAddress: `0x${string}`;
  itemDetails: {
    name: string;
    tokenId: string;
    contractAddress: `0x${string}`;
    price: string;
  };
  signature: `0x${string}`;
  timestamp: number;
}

// Get contract address from environment variables
function getContractAddress(chainId: number): `0x${string}` {
  switch (chainId) {
    case mainnet.id:
      return (import.meta.env.ETCHNFT_CONTRACT_MAINNET ||
        "0x0000000000000000000000000000000000000000") as `0x${string}`;
    case polygon.id:
      return (import.meta.env.ETCHNFT_CONTRACT_POLYGON ||
        "0x0000000000000000000000000000000000000000") as `0x${string}`;
    case base.id:
      return (import.meta.env.ETCHNFT_CONTRACT_BASE ||
        "0x0000000000000000000000000000000000000000") as `0x${string}`;
    case optimism.id:
      return (import.meta.env.ETCHNFT_CONTRACT_OPTIMISM ||
        "0x0000000000000000000000000000000000000000") as `0x${string}`;
    case 11155111: // Sepolia
      return (import.meta.env.ETCHNFT_CONTRACT_SEPOLIA ||
        "0x0000000000000000000000000000000000000000") as `0x${string}`;
    case 80001: // Mumbai
      return (import.meta.env.ETCHNFT_CONTRACT_MUMBAI ||
        "0x0000000000000000000000000000000000000000") as `0x${string}`;
    case 84532: // Base Sepolia
      return (import.meta.env.ETCHNFT_CONTRACT_BASE_SEPOLIA ||
        "0x0000000000000000000000000000000000000000") as `0x${string}`;
    default:
      return "0x0000000000000000000000000000000000000000" as `0x${string}`;
  }
}

// EtchNFT contract configurations for different chains
export const ETCHNFT_CONTRACTS: Record<number, ContractConfig> = {
  [mainnet.id]: {
    address: getContractAddress(mainnet.id),
    abi: ETCHNFT_ABI,
    chainId: mainnet.id,
  },
  [polygon.id]: {
    address: getContractAddress(polygon.id),
    abi: ETCHNFT_ABI,
    chainId: polygon.id,
  },
  [base.id]: {
    address: getContractAddress(base.id),
    abi: ETCHNFT_ABI,
    chainId: base.id,
  },
  [optimism.id]: {
    address: getContractAddress(optimism.id),
    abi: ETCHNFT_ABI,
    chainId: optimism.id,
  },
  // Testnets
  11155111: {
    address: getContractAddress(11155111),
    abi: ETCHNFT_ABI,
    chainId: 11155111,
  },
  80001: {
    address: getContractAddress(80001),
    abi: ETCHNFT_ABI,
    chainId: 80001,
  },
  84532: {
    address: getContractAddress(84532),
    abi: ETCHNFT_ABI,
    chainId: 84532,
  },
};

// EtchNFT Contract ABI (complete interface)
export const ETCHNFT_ABI = [
  // Main Functions
  {
    inputs: [
      { name: "externalOrderId", type: "string" },
      { name: "originalContract", type: "address" },
      { name: "originalTokenId", type: "uint256" },
      { name: "metadataURI", type: "string" },
    ],
    name: "createOrder",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      { name: "orderId", type: "uint256" },
      { name: "newStatus", type: "uint8" },
    ],
    name: "updateOrderStatus",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "orderId", type: "uint256" },
      { name: "tokenURI", type: "string" },
    ],
    name: "fulfillOrder",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "orderId", type: "uint256" }],
    name: "cancelOrder",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "orderId", type: "uint256" }],
    name: "emergencyRefund",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },

  // View Functions
  {
    inputs: [{ name: "orderId", type: "uint256" }],
    name: "getOrder",
    outputs: [
      {
        components: [
          { name: "orderId", type: "uint256" },
          { name: "customer", type: "address" },
          { name: "externalOrderId", type: "string" },
          { name: "amount", type: "uint256" },
          { name: "status", type: "uint8" },
          { name: "createdAt", type: "uint256" },
          { name: "updatedAt", type: "uint256" },
          { name: "originalContract", type: "address" },
          { name: "originalTokenId", type: "uint256" },
          { name: "metadataURI", type: "string" },
          { name: "escrowReleased", type: "bool" },
          { name: "mintedTokenId", type: "uint256" },
        ],
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "externalOrderId", type: "string" }],
    name: "getOrderByExternalId",
    outputs: [
      {
        components: [
          { name: "orderId", type: "uint256" },
          { name: "customer", type: "address" },
          { name: "externalOrderId", type: "string" },
          { name: "amount", type: "uint256" },
          { name: "status", type: "uint8" },
          { name: "createdAt", type: "uint256" },
          { name: "updatedAt", type: "uint256" },
          { name: "originalContract", type: "address" },
          { name: "originalTokenId", type: "uint256" },
          { name: "metadataURI", type: "string" },
          { name: "escrowReleased", type: "bool" },
          { name: "mintedTokenId", type: "uint256" },
        ],
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "customer", type: "address" }],
    name: "getCustomerOrders",
    outputs: [{ name: "", type: "uint256[]" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getTotalOrders",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getTotalTokens",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },

  // Admin Functions
  {
    inputs: [
      { name: "operator", type: "address" },
      { name: "authorized", type: "bool" },
    ],
    name: "setFulfillmentOperator",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "_feePercentage", type: "uint256" }],
    name: "setPlatformFeePercentage",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "pause",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "unpause",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },

  // Constants
  {
    inputs: [],
    name: "ORDER_TIMEOUT",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "platformFeePercentage",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },

  // Events
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "orderId", type: "uint256" },
      { indexed: true, name: "customer", type: "address" },
      { indexed: false, name: "externalOrderId", type: "string" },
      { indexed: false, name: "amount", type: "uint256" },
      { indexed: false, name: "originalContract", type: "address" },
      { indexed: false, name: "originalTokenId", type: "uint256" },
    ],
    name: "OrderCreated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "orderId", type: "uint256" },
      { indexed: false, name: "oldStatus", type: "uint8" },
      { indexed: false, name: "newStatus", type: "uint8" },
    ],
    name: "OrderStatusUpdated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "orderId", type: "uint256" },
      { indexed: false, name: "refundAmount", type: "uint256" },
    ],
    name: "OrderCancelled",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, name: "orderId", type: "uint256" },
      { indexed: false, name: "mintedTokenId", type: "uint256" },
    ],
    name: "OrderFulfilled",
    type: "event",
  },
] as const;

/**
 * Sign a message for order verification
 */
export async function signOrderMessage(
  orderId: string,
  customerAddress: `0x${string}`,
  itemDetails: OrderSignature["itemDetails"],
  walletClient: any,
): Promise<OrderSignature> {
  const timestamp = Date.now();

  const message = `EtchNFT Order Verification
Order ID: ${orderId}
Customer: ${customerAddress}
Item: ${itemDetails.name}
Token ID: ${itemDetails.tokenId}
Contract: ${itemDetails.contractAddress}
Price: ${itemDetails.price} ETH
Timestamp: ${timestamp}

By signing this message, you confirm your order for a physical etched version of this NFT.`;

  try {
    const signature = await signMessage({
      message,
      account: customerAddress,
    });

    return {
      orderId,
      customerAddress,
      itemDetails,
      signature,
      timestamp,
    };
  } catch (error) {
    console.error("Failed to sign order message:", error);
    throw new Error("Failed to sign order message");
  }
}

/**
 * Create an on-chain order
 */
export async function createOnChainOrder(
  externalOrderId: string,
  originalContract: `0x${string}`,
  originalTokenId: bigint,
  metadataURI: string,
  amount: bigint,
  chainId: number,
): Promise<`0x${string}`> {
  const contract = ETCHNFT_CONTRACTS[chainId];

  if (!contract) {
    throw new Error(`Contract not deployed on chain ${chainId}`);
  }

  try {
    const txHash = await writeContract({
      address: contract.address,
      abi: contract.abi,
      functionName: "createOrder",
      args: [externalOrderId, originalContract, originalTokenId, metadataURI],
      value: amount,
    });

    // Wait for transaction confirmation
    await waitForTransactionReceipt({
      hash: txHash,
      chainId,
    });

    return txHash;
  } catch (error) {
    console.error("Failed to create on-chain order:", error);
    throw new Error("Failed to create on-chain order");
  }
}

/**
 * Cancel an order and get refund
 */
export async function cancelOnChainOrder(
  orderId: bigint,
  chainId: number,
): Promise<`0x${string}`> {
  const contract = ETCHNFT_CONTRACTS[chainId];

  if (!contract) {
    throw new Error(`Contract not deployed on chain ${chainId}`);
  }

  try {
    const txHash = await writeContract({
      address: contract.address,
      abi: contract.abi,
      functionName: "cancelOrder",
      args: [orderId],
    });

    // Wait for transaction confirmation
    await waitForTransactionReceipt({
      hash: txHash,
      chainId,
    });

    return txHash;
  } catch (error) {
    console.error("Failed to cancel order:", error);
    throw new Error("Failed to cancel order");
  }
}

/**
 * Emergency refund for orders past timeout
 */
export async function emergencyRefundOrder(
  orderId: bigint,
  chainId: number,
): Promise<`0x${string}`> {
  const contract = ETCHNFT_CONTRACTS[chainId];

  if (!contract) {
    throw new Error(`Contract not deployed on chain ${chainId}`);
  }

  try {
    const txHash = await writeContract({
      address: contract.address,
      abi: contract.abi,
      functionName: "emergencyRefund",
      args: [orderId],
    });

    // Wait for transaction confirmation
    await waitForTransactionReceipt({
      hash: txHash,
      chainId,
    });

    return txHash;
  } catch (error) {
    console.error("Failed to process emergency refund:", error);
    throw new Error("Failed to process emergency refund");
  }
}

/**
 * Verify a signed message
 */
export async function verifySignature(
  message: string,
  signature: `0x${string}`,
  expectedAddress: `0x${string}`,
): Promise<boolean> {
  try {
    const { verifyMessage } = await import("viem");

    return await verifyMessage({
      message,
      signature,
      address: expectedAddress,
    });
  } catch (error) {
    console.error("Failed to verify signature:", error);
    return false;
  }
}

/**
 * Get order details from contract
 */
export async function getOrderDetails(
  orderId: bigint,
  chainId: number,
): Promise<{
  orderId: bigint;
  customer: `0x${string}`;
  externalOrderId: string;
  amount: bigint;
  status: number;
  createdAt: bigint;
  updatedAt: bigint;
  originalContract: `0x${string}`;
  originalTokenId: bigint;
  metadataURI: string;
  escrowReleased: boolean;
  mintedTokenId: bigint;
}> {
  const contract = ETCHNFT_CONTRACTS[chainId];

  if (!contract) {
    throw new Error(`Contract not deployed on chain ${chainId}`);
  }

  try {
    const { readContract } = await import("wagmi/actions");

    const result = await readContract({
      address: contract.address,
      abi: contract.abi,
      functionName: "getOrder",
      args: [orderId],
    });

    return {
      orderId: result.orderId,
      customer: result.customer,
      externalOrderId: result.externalOrderId,
      amount: result.amount,
      status: Number(result.status),
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
      originalContract: result.originalContract,
      originalTokenId: result.originalTokenId,
      metadataURI: result.metadataURI,
      escrowReleased: result.escrowReleased,
      mintedTokenId: result.mintedTokenId,
    };
  } catch (error) {
    console.error("Failed to get order details:", error);
    throw new Error("Failed to get order details");
  }
}

/**
 * Get order details by external ID
 */
export async function getOrderByExternalId(
  externalOrderId: string,
  chainId: number,
): Promise<{
  orderId: bigint;
  customer: `0x${string}`;
  externalOrderId: string;
  amount: bigint;
  status: number;
  createdAt: bigint;
  updatedAt: bigint;
  originalContract: `0x${string}`;
  originalTokenId: bigint;
  metadataURI: string;
  escrowReleased: boolean;
  mintedTokenId: bigint;
}> {
  const contract = ETCHNFT_CONTRACTS[chainId];

  if (!contract) {
    throw new Error(`Contract not deployed on chain ${chainId}`);
  }

  try {
    const { readContract } = await import("wagmi/actions");

    const result = await readContract({
      address: contract.address,
      abi: contract.abi,
      functionName: "getOrderByExternalId",
      args: [externalOrderId],
    });

    return {
      orderId: result.orderId,
      customer: result.customer,
      externalOrderId: result.externalOrderId,
      amount: result.amount,
      status: Number(result.status),
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
      originalContract: result.originalContract,
      originalTokenId: result.originalTokenId,
      metadataURI: result.metadataURI,
      escrowReleased: result.escrowReleased,
      mintedTokenId: result.mintedTokenId,
    };
  } catch (error) {
    console.error("Failed to get order details:", error);
    throw new Error("Failed to get order details");
  }
}

/**
 * Fulfill an order (admin function)
 */
export async function fulfillOrder(
  orderId: bigint,
  chainId: number,
): Promise<`0x${string}`> {
  const contract = ETCHNFT_CONTRACTS[chainId];

  if (!contract) {
    throw new Error(`Contract not deployed on chain ${chainId}`);
  }

  try {
    const txHash = await writeContract({
      address: contract.address,
      abi: contract.abi,
      functionName: "fulfillOrder",
      args: [orderId],
    });

    // Wait for transaction confirmation
    await waitForTransactionReceipt({
      hash: txHash,
      chainId,
    });

    return txHash;
  } catch (error) {
    console.error("Failed to fulfill order:", error);
    throw new Error("Failed to fulfill order");
  }
}

/**
 * Parse ETH amount to wei
 */
export function parseEthAmount(amount: string): bigint {
  return parseEther(amount);
}

/**
 * Format wei to ETH
 */
export function formatEthAmount(wei: bigint): string {
  const { formatEther } = require("viem");
  return formatEther(wei);
}

/**
 * Get supported chains
 */
export function getSupportedChains(): number[] {
  return Object.keys(ETCHNFT_CONTRACTS).map(Number);
}

/**
 * Check if chain is supported
 */
export function isChainSupported(chainId: number): boolean {
  return chainId in ETCHNFT_CONTRACTS;
}
