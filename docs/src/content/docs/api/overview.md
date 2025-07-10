---
title: API Overview
description: Complete reference for EtchNFT's REST API endpoints
---

# API Reference

EtchNFT provides a comprehensive REST API for integrating with the platform programmatically. All endpoints are built on Cloudflare Workers for global performance and reliability.

## Base URL

```
https://etchnft.com/api
```

## Authentication

Most API endpoints require authentication using session-based auth with GitHub OAuth.

### Session-Based Authentication

Users authenticate via GitHub OAuth, creating a session managed by Lucia Auth.

```typescript
// Check authentication status
GET /api/auth/session

// GitHub OAuth login
GET /api/auth/login/github

// Logout
POST /api/auth/logout
```

## API Endpoints

### NFT Operations

#### Get NFT Metadata
```http
GET /api/nfts/{contractAddress}?tokenId={tokenId}&network={network}
```

Fetch metadata for a specific NFT including image, attributes, and ownership verification.

**Parameters:**
- `contractAddress` (string): Contract address of the NFT
- `tokenId` (string): Token ID within the contract
- `network` (string): Blockchain network (ethereum, polygon, solana, etc.)

**Response:**
```json
{
  "name": "Cool NFT #1234",
  "description": "An awesome NFT",
  "image": "https://...",
  "attributes": [
    {
      "trait_type": "Background",
      "value": "Blue"
    }
  ],
  "contract": {
    "address": "0x...",
    "name": "Cool Collection",
    "symbol": "COOL"
  }
}
```

### Order Management

#### Create Order
```http
POST /api/order
```

Create a new order for physical NFT collectibles with smart contract escrow support.

**Request Body:**
```json
{
  "items": [
    {
      "nft": {
        "contractAddress": "0x...",
        "tokenId": "1234",
        "network": "ethereum"
      },
      "material": "wood",
      "size": "medium",
      "quantity": 1
    }
  ],
  "shipping": {
    "name": "John Doe",
    "address": "123 Main St",
    "city": "City",
    "state": "State",
    "zip": "12345",
    "country": "US"
  },
  "paymentMethod": "card",
  "web3Options": {
    "walletAddress": "0x...",
    "chainId": 1,
    "useEscrow": true,
    "signature": "0x..."
  }
}
```

**Response:**
```json
{
  "orderId": "order_abc123",
  "status": "pending",
  "total": {
    "amount": 4999,
    "currency": "USD"
  },
  "paymentUrl": "https://..."
}
```

#### Get Order Status
```http
GET /api/orders/{orderId}
```

Get the current status and details of an order.

**Response:**
```json
{
  "id": "order_abc123",
  "status": "processing",
  "items": [...],
  "tracking": {
    "carrier": "UPS",
    "trackingNumber": "1Z...",
    "estimatedDelivery": "2024-01-15"
  },
  "timeline": [
    {
      "status": "confirmed",
      "timestamp": "2024-01-10T10:00:00Z"
    },
    {
      "status": "processing",
      "timestamp": "2024-01-11T14:30:00Z"
    }
  ],
  "web3Details": {
    "escrowContractAddress": "0x...",
    "transactionHash": "0x...",
    "chainId": 1,
    "escrowStatus": "active"
  }
}
```

#### Cancel Order
```http
POST /api/orders/cancel
```

Cancel an order with automatic refund processing. Orders can be cancelled within 24 hours or after 30 days for emergency refunds.

**Request Body:**
```json
{
  "orderId": "order_abc123",
  "reason": "Changed mind",
  "walletAddress": "0x...",
  "signature": "0x..."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Order cancelled successfully",
  "orderId": "order_abc123",
  "refundDetails": {
    "type": "blockchain",
    "transactionHash": "0x...",
    "amount": 49.99,
    "method": "cancel_order"
  },
  "estimatedRefundTime": "15-30 minutes (depending on network congestion)"
}
```

### Smart Contract Integration

#### Create Web3 Order
```http
POST /api/web3-order
```

Create an order with smart contract escrow protection.

**Request Body:**
```json
{
  "items": [...],
  "walletAddress": "0x...",
  "chainId": 1,
  "signature": "0x...",
  "escrowAmount": "0.05"
}
```

#### Process Refund (Admin)
```http
POST /api/orders/refund
```

Admin endpoint for processing refunds with admin API key authentication.

**Request Body:**
```json
{
  "orderId": "order_abc123",
  "reason": "Quality issue",
  "refundAmount": 49.99,
  "adminKey": "your_admin_api_key"
}
```

### Certificate Generation

#### Get Certificate
```http
GET /api/cert/{orderId}
```

Generate and retrieve a certificate of authenticity for completed orders with blockchain verification.

**Response:**
```json
{
  "certificateId": "cert_xyz789",
  "orderId": "order_abc123",
  "nft": {
    "name": "Cool NFT #1234",
    "contractAddress": "0x...",
    "tokenId": "1234",
    "network": "ethereum"
  },
  "authenticity": {
    "verified": true,
    "timestamp": "2024-01-15T12:00:00Z",
    "blockNumber": 18500000,
    "escrowContract": "0x...",
    "verificationHash": "0x..."
  },
  "certificate": {
    "url": "https://etchnft.com/cert/cert_xyz789",
    "qrCode": "data:image/png;base64,..."
  }
}
```

## Error Handling

All API endpoints return consistent error responses:

```json
{
  "error": {
    "code": "INVALID_NFT",
    "message": "NFT not found or not owned by user",
    "details": {
      "contractAddress": "0x...",
      "tokenId": "1234"
    }
  }
}
```

### Common Error Codes

- `UNAUTHORIZED` (401): Authentication required
- `FORBIDDEN` (403): Insufficient permissions
- `NOT_FOUND` (404): Resource not found
- `INVALID_NFT` (400): NFT validation failed
- `PAYMENT_FAILED` (402): Payment processing error
- `RATE_LIMITED` (429): Too many requests
- `ESCROW_FAILED` (422): Smart contract escrow error
- `REFUND_FAILED` (500): Refund processing error
- `SIGNATURE_INVALID` (400): Invalid wallet signature
- `CHAIN_NOT_SUPPORTED` (400): Unsupported blockchain network

## Rate Limiting

API endpoints are rate limited to prevent abuse:

- **Authentication**: 10 requests per minute
- **NFT Operations**: 100 requests per minute
- **Order Creation**: 5 requests per minute
- **General**: 60 requests per minute

Rate limit headers are included in responses:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

## SDKs and Libraries

### JavaScript/TypeScript
```bash
npm install @etchnft/sdk
```

```typescript
import { EtchNFT } from '@etchnft/sdk';

const client = new EtchNFT({
  apiKey: 'your-api-key',
  baseUrl: 'https://etchnft.com/api'
});

const nft = await client.nfts.get({
  contractAddress: '0x...',
  tokenId: '1234',
  network: 'ethereum'
});
```

### Python
```bash
pip install etchnft-python
```

```python
from etchnft import EtchNFT

client = EtchNFT(api_key='your-api-key')
nft = client.nfts.get(
    contract_address='0x...',
    token_id='1234',
    network='ethereum'
)
```

## Webhooks

EtchNFT supports webhooks for Square and Coinbase Commerce payment confirmations:

### Square Webhooks
```http
POST /api/webhooks/square
```

Receives Square payment notifications with signature verification.

### Coinbase Commerce Webhooks
```http
POST /api/webhooks/coinbase
```

Receives cryptocurrency payment confirmations with HMAC verification.

### Order Status Updates
```json
{
  "event": "order.status_changed",
  "data": {
    "orderId": "order_abc123",
    "status": "shipped",
    "previousStatus": "processing",
    "timestamp": "2024-01-15T12:00:00Z",
    "web3Details": {
      "escrowReleased": true,
      "transactionHash": "0x..."
    }
  }
}
```

Configure webhooks in your account settings or via the API.

## Testing

Use the test environment for development:

```
https://test.etchnft.com/api
```

Test data is automatically reset daily, and no real orders or payments are processed.