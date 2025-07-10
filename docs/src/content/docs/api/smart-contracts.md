---
title: Smart Contracts
description: EtchNFT smart contract integration and escrow system
---

# Smart Contract Integration

EtchNFT uses smart contracts to provide secure escrow functionality for Web3 payments, ensuring customer protection and transparent order processing.

## Contract Overview

The EtchNFT smart contract system provides:

- **Escrow Protection**: Customer funds are held in smart contract escrow until order completion
- **Multi-Chain Support**: Deployed on Ethereum, Polygon, Base, and Optimism
- **Admin Controls**: Emergency refund capabilities with proper authorization
- **Transparency**: All transactions are verifiable on-chain

## Contract Addresses

### Mainnet Deployments

```
Ethereum Mainnet: 0x0000000000000000000000000000000000000000
Polygon Mainnet:  0x0000000000000000000000000000000000000000
Base Mainnet:     0x0000000000000000000000000000000000000000
Optimism Mainnet: 0x0000000000000000000000000000000000000000
```

### Testnet Deployments

```
Sepolia Testnet:      0x0000000000000000000000000000000000000000
Mumbai Testnet:       0x0000000000000000000000000000000000000000
Base Sepolia Testnet: 0x0000000000000000000000000000000000000000
```

## Core Functions

### Create Order with Escrow

```solidity
function createOrder(
    uint256 orderId,
    string memory nftContract,
    uint256 tokenId,
    string memory shippingDetails
) external payable
```

Creates a new order with escrow protection.

**Parameters:**
- `orderId`: Unique order identifier
- `nftContract`: NFT contract address being etched
- `tokenId`: Token ID within the contract
- `shippingDetails`: Encrypted shipping information

**Requirements:**
- Must send exact order amount in ETH
- Order ID must be unique
- Caller must own the specified NFT

### Complete Order

```solidity
function completeOrder(uint256 orderId) external onlyAdmin
```

Completes an order and releases escrow funds to EtchNFT.

**Parameters:**
- `orderId`: Order ID to complete

**Requirements:**
- Only admin can call this function
- Order must exist and be in pending status

### Cancel Order

```solidity
function cancelOrder(uint256 orderId) external
```

Cancels an order and refunds the customer.

**Parameters:**
- `orderId`: Order ID to cancel

**Requirements:**
- Can only be called by the order creator
- Order must be within 24-hour cancellation window or after 30-day emergency period

### Emergency Refund

```solidity
function emergencyRefund(uint256 orderId) external onlyAdmin
```

Admin function for emergency refunds in case of issues.

**Parameters:**
- `orderId`: Order ID to refund

**Requirements:**
- Only admin can call this function
- Order must exist

## Events

The contract emits the following events:

### OrderCreated

```solidity
event OrderCreated(
    uint256 indexed orderId,
    address indexed customer,
    uint256 amount,
    string nftContract,
    uint256 tokenId
);
```

### OrderCompleted

```solidity
event OrderCompleted(
    uint256 indexed orderId,
    address indexed customer,
    uint256 amount
);
```

### OrderCancelled

```solidity
event OrderCancelled(
    uint256 indexed orderId,
    address indexed customer,
    uint256 refundAmount,
    string reason
);
```

### EmergencyRefund

```solidity
event EmergencyRefund(
    uint256 indexed orderId,
    address indexed customer,
    uint256 refundAmount,
    address admin
);
```

## Integration Examples

### Web3 Order Creation

```typescript
import { ethers } from 'ethers';

const contract = new ethers.Contract(
  contractAddress,
  abi,
  signer
);

// Create order with escrow
const tx = await contract.createOrder(
  orderId,
  nftContractAddress,
  tokenId,
  encryptedShippingDetails,
  { value: ethers.parseEther("0.05") }
);

await tx.wait();
```

### Order Status Checking

```typescript
// Get order details
const order = await contract.orders(orderId);

console.log({
  customer: order.customer,
  amount: order.amount,
  status: order.status,
  createdAt: order.createdAt
});
```

### Customer Cancellation

```typescript
// Cancel order (within 24 hours or after 30 days)
const tx = await contract.cancelOrder(orderId);
await tx.wait();
```

## Security Features

### Access Control

- **Admin Functions**: Only authorized admin wallets can complete orders or process emergency refunds
- **Customer Protection**: Only order creators can cancel their own orders
- **Time-Based Controls**: Cancellation windows enforce fair policies

### Financial Security

- **Escrow Protection**: Customer funds are locked until order completion
- **Reentrancy Guards**: Protection against reentrancy attacks
- **Overflow Protection**: SafeMath operations prevent integer overflow
- **Emergency Controls**: Admin can process refunds in exceptional circumstances

### Audit Trail

- **Event Logging**: All actions emit events for transparency
- **On-Chain Verification**: Order status and transactions are publicly verifiable
- **Immutable Records**: Blockchain provides permanent audit trail

## Gas Optimization

The contracts are optimized for gas efficiency:

- **Struct Packing**: Efficient storage layout
- **Batch Operations**: Support for multiple orders in single transaction
- **Minimal Storage**: Only essential data stored on-chain
- **Event-Based Indexing**: Off-chain indexing for complex queries

## Deployment Process

### Requirements

- Hardhat development environment
- Network configuration for target chains
- Admin wallet for contract ownership
- Sufficient native tokens for deployment

### Deployment Script

```bash
# Install dependencies
npm install

# Compile contracts
npx hardhat compile

# Deploy to testnet
npx hardhat run scripts/deploy.js --network sepolia

# Deploy to mainnet
npx hardhat run scripts/deploy.js --network mainnet
```

### Verification

```bash
# Verify contract on Etherscan
npx hardhat verify --network mainnet <contract-address>
```

## Monitoring and Analytics

### Order Metrics

- Total orders created
- Average order value
- Completion rate
- Cancellation rate

### Financial Metrics

- Total volume processed
- Funds in escrow
- Revenue generated
- Refund amounts

### Performance Metrics

- Gas usage per transaction
- Transaction confirmation times
- Contract interaction success rate

## Support and Resources

- **Contract Source Code**: [GitHub Repository](https://github.com/cozyartz/etchNFT/tree/main/contracts)
- **Deployment Documentation**: [CONTRACT_DEPLOYMENT.md](https://github.com/cozyartz/etchNFT/blob/main/CONTRACT_DEPLOYMENT.md)
- **Security Audit**: Available upon request
- **Bug Bounty**: Contact security@etchnft.com for vulnerability disclosure

## Future Enhancements

### Planned Features

- **Multi-Token Support**: Accept ERC-20 tokens for payment
- **Subscription Models**: Recurring payment handling
- **Cross-Chain Bridge**: Transfer orders between networks
- **DAO Integration**: Community governance for contract upgrades

### Upgrade Path

The contracts use a proxy pattern for upgrades:

- **Transparent Proxy**: Admin-controlled upgrades
- **Timelock**: Delayed execution for security
- **Community Review**: Public announcement of upgrade proposals
- **Emergency Pause**: Circuit breaker for critical issues

This smart contract system provides a secure, transparent, and efficient foundation for EtchNFT's Web3 payment processing and order management.