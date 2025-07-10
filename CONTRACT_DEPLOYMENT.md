# Smart Contract Deployment Guide

This guide will help you deploy the EtchNFT smart contracts to various blockchain networks.

## Prerequisites

1. **Node.js** (v16 or later)
2. **Private Key** with ETH/MATIC/ETH (Base) for deployment
3. **API Keys** for block explorers (for verification)
4. **RPC URLs** from Alchemy (already configured)

## Setup

1. **Install Dependencies:**
   ```bash
   npm install @nomicfoundation/hardhat-toolbox @openzeppelin/contracts hardhat dotenv
   ```

2. **Configure Environment Variables:**
   Add these to your `.env` file:
   ```env
   # Your wallet private key (starts with 0x)
   PRIVATE_KEY=your_actual_private_key_here
   
   # Block explorer API keys (for contract verification)
   ETHERSCAN_API_KEY=your_etherscan_api_key
   POLYGONSCAN_API_KEY=your_polygonscan_api_key
   BASESCAN_API_KEY=your_basescan_api_key
   OPTIMISM_API_KEY=your_optimism_api_key
   ```

3. **Get API Keys:**
   - **Etherscan**: https://etherscan.io/apis
   - **Polygonscan**: https://polygonscan.com/apis
   - **Basescan**: https://basescan.org/apis
   - **Optimism**: https://optimistic.etherscan.io/apis

## Deployment Process

### 1. Test on Testnets First

```bash
# Compile contracts
npx hardhat compile

# Deploy to Sepolia (Ethereum testnet)
npx hardhat run scripts/deploy.js --network sepolia

# Deploy to Mumbai (Polygon testnet) 
npx hardhat run scripts/deploy.js --network mumbai

# Deploy to Base Sepolia
npx hardhat run scripts/deploy.js --network baseSepolia
```

### 2. Deploy to Mainnets

**⚠️ Warning: Make sure you have sufficient funds for gas fees!**

```bash
# Deploy to Ethereum Mainnet
npx hardhat run scripts/deploy.js --network mainnet

# Deploy to Polygon Mainnet
npx hardhat run scripts/deploy.js --network polygon

# Deploy to Base Mainnet
npx hardhat run scripts/deploy.js --network base

# Deploy to Optimism Mainnet
npx hardhat run scripts/deploy.js --network optimism
```

### 3. Update Environment Variables

After each deployment, update your `.env` file with the contract addresses:

```env
# Contract Addresses (update after deployment)
ETCHNFT_CONTRACT_MAINNET=0xYourContractAddressHere
ETCHNFT_CONTRACT_POLYGON=0xYourContractAddressHere
ETCHNFT_CONTRACT_BASE=0xYourContractAddressHere
ETCHNFT_CONTRACT_OPTIMISM=0xYourContractAddressHere

# Testnet addresses
ETCHNFT_CONTRACT_SEPOLIA=0xYourContractAddressHere
ETCHNFT_CONTRACT_MUMBAI=0xYourContractAddressHere
ETCHNFT_CONTRACT_BASE_SEPOLIA=0xYourContractAddressHere
```

## Post-Deployment Setup

### 1. Add Fulfillment Operators

You'll need to add authorized addresses that can fulfill orders:

```javascript
// Example: Add fulfillment operator
const contract = new ethers.Contract(contractAddress, ETCHNFT_ABI, signer);
await contract.setFulfillmentOperator("0xOperatorAddress", true);
```

### 2. Configure Platform Fee

Set your platform fee percentage (in basis points, where 100 = 1%):

```javascript
// Example: Set 2.5% platform fee
await contract.setPlatformFeePercentage(250);
```

### 3. Set Platform Fee Recipient

Update the address that receives platform fees:

```javascript
await contract.setPlatformFeeRecipient("0xYourFeeRecipientAddress");
```

## Network Information

| Network | Chain ID | Gas Token | Block Explorer |
|---------|----------|-----------|----------------|
| Ethereum Mainnet | 1 | ETH | https://etherscan.io |
| Polygon Mainnet | 137 | MATIC | https://polygonscan.com |
| Base Mainnet | 8453 | ETH | https://basescan.org |
| Optimism Mainnet | 10 | ETH | https://optimistic.etherscan.io |
| Sepolia (Test) | 11155111 | ETH | https://sepolia.etherscan.io |
| Mumbai (Test) | 80001 | MATIC | https://mumbai.polygonscan.com |
| Base Sepolia (Test) | 84532 | ETH | https://sepolia.basescan.org |

## Gas Estimates

Approximate deployment costs (varies with network congestion):

| Network | Deployment Cost |
|---------|----------------|
| Ethereum | 0.02 - 0.1 ETH |
| Polygon | 0.1 - 1 MATIC |
| Base | 0.001 - 0.01 ETH |
| Optimism | 0.001 - 0.01 ETH |

## Verification

Contracts are automatically verified during deployment. If verification fails, you can manually verify:

```bash
npx hardhat verify --network mainnet DEPLOYED_CONTRACT_ADDRESS "EtchNFT" "ETCH" "PLATFORM_FEE_RECIPIENT"
```

## Troubleshooting

### Common Issues:

1. **Insufficient Funds**: Make sure your wallet has enough native tokens for gas
2. **Private Key Issues**: Ensure your private key starts with '0x'
3. **Network Issues**: Check RPC URLs and network connectivity
4. **Verification Failed**: Wait a few minutes and try manual verification

### Get Help:

- Check the `deployments/` folder for deployment logs
- Review transaction details on block explorers
- Ensure all environment variables are properly set

## Security Notes

- **Never commit private keys to version control**
- **Use a dedicated deployment wallet**
- **Test thoroughly on testnets first**
- **Consider using a multisig for contract ownership**
- **Audit contracts before mainnet deployment**

## Next Steps

After successful deployment:

1. Update your frontend with the new contract addresses
2. Test the complete order flow
3. Set up monitoring and alerts
4. Prepare for launch! 🚀