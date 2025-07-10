'use client';
import React, { useState, useEffect } from 'react';
import { useAccount, useWalletClient, useChainId } from 'wagmi';
import { useCart } from './CartContext';
import { 
  signOrderMessage, 
  createOnChainOrder, 
  parseEthAmount, 
  isChainSupported,
  type OrderSignature 
} from '../../lib/contract-signing';

interface Web3CheckoutProps {
  form: {
    name: string;
    email: string;
    addressLine: string;
    city: string;
    country: string;
    method: 'card' | 'crypto';
  };
  onSuccess?: (orderIds: string[]) => void;
  onError?: (error: string) => void;
}

export default function Web3Checkout({ form, onSuccess, onError }: Web3CheckoutProps) {
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const chainId = useChainId();
  const { cart, clearCart } = useCart();
  
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'sign' | 'confirm' | 'process'>('sign');
  const [signatures, setSignatures] = useState<OrderSignature[]>([]);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState(false);

  // Price per NFT in ETH (example: 0.025 ETH = ~$45 at $1800 ETH)
  const pricePerNft = '0.025';

  useEffect(() => {
    if (!isConnected) {
      setError('Please connect your wallet to continue');
    } else if (!isChainSupported(chainId)) {
      setError(`Chain ${chainId} is not supported. Please switch to a supported network.`);
    } else {
      setError('');
    }
  }, [isConnected, chainId]);

  const handleSignOrders = async () => {
    if (!address || !walletClient || !isConnected) {
      setError('Wallet not connected');
      return;
    }

    if (cart.length === 0) {
      setError('No items in cart');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const orderSignatures: OrderSignature[] = [];

      for (const nft of cart) {
        // Validate NFT data
        if (!nft.name || !nft.token_id || !nft.contract_address) {
          throw new Error(`Invalid NFT data for ${nft.name || 'unknown NFT'}`);
        }

        const orderId = `${Date.now()}-${nft.token_id}`;
        
        const signature = await signOrderMessage(
          orderId,
          address,
          {
            name: nft.name,
            tokenId: nft.token_id,
            contractAddress: nft.contract_address as `0x${string}`,
            price: pricePerNft
          },
          walletClient
        );

        orderSignatures.push(signature);
      }

      setSignatures(orderSignatures);
      setStep('confirm');
    } catch (err: any) {
      console.error('Signing error:', err);
      let errorMessage = 'Failed to sign orders';
      
      if (err.message?.includes('User rejected')) {
        errorMessage = 'Signature rejected by user';
      } else if (err.message?.includes('network')) {
        errorMessage = 'Network error. Please check your connection';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmOrders = async () => {
    if (!address || !walletClient || signatures.length === 0) {
      setError('No signatures available');
      return;
    }

    setLoading(true);
    setError('');
    setStep('process');

    try {
      const orderIds: string[] = [];
      const totalAmount = parseEthAmount((cart.length * parseFloat(pricePerNft)).toString());

      // Create on-chain orders
      for (const signature of signatures) {
        const txHash = await createOnChainOrder(
          signature.orderId,
          address,
          parseEthAmount(signature.itemDetails.price),
          chainId,
          walletClient
        );

        // Submit order to backend
        const response = await fetch('/api/web3-order', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            form,
            signature,
            txHash,
            chainId,
            cart: cart.find(item => item.token_id === signature.itemDetails.tokenId)
          })
        });

        if (!response.ok) {
          throw new Error('Failed to submit order to backend');
        }

        const result = await response.json();
        orderIds.push(result.orderId);
      }

      setSuccess(true);
      clearCart();
      onSuccess?.(orderIds);
    } catch (err: any) {
      console.error('Order creation error:', err);
      setError(err.message || 'Failed to create orders');
      onError?.(err.message || 'Failed to create orders');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setStep('sign');
    setSignatures([]);
    setError('');
  };

  if (!isConnected) {
    return (
      <div className="glass p-6 rounded-xl text-center">
        <h2 className="text-xl font-bold text-white mb-4">Web3 Payment</h2>
        <p className="text-gray-400 mb-4">Please connect your wallet to continue with Web3 payment</p>
        <div className="text-red-400 text-sm">Wallet not connected</div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="glass p-6 rounded-xl text-center">
        <h2 className="text-xl font-bold text-green-400 mb-4">🎉 Orders Confirmed!</h2>
        <p className="text-gray-300 mb-4">Your NFTs are now being etched into reality.</p>
        <p className="text-sm text-gray-400">You'll receive email updates on the progress.</p>
      </div>
    );
  }

  return (
    <div className="glass p-6 rounded-xl">
      <h2 className="text-xl font-bold text-white mb-4">Web3 Payment</h2>
      
      {error && (
        <div className="bg-red-500/20 border border-red-500 text-red-400 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="mb-4">
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <span>Connected:</span>
          <span className="text-white font-mono">{address?.slice(0, 6)}...{address?.slice(-4)}</span>
        </div>
        <div className="text-sm text-gray-400 mt-1">
          Chain: {chainId} {isChainSupported(chainId) ? '✅' : '❌'}
        </div>
      </div>

      <div className="mb-6">
        <h3 className="text-lg font-semibold text-white mb-2">Order Summary</h3>
        <div className="space-y-2">
          {cart.map((nft, index) => (
            <div key={index} className="flex justify-between items-center p-3 bg-zinc-800 rounded">
              <div className="flex items-center gap-3">
                <img 
                  src={nft.image_url} 
                  alt={nft.name}
                  className="w-10 h-10 rounded object-cover"
                />
                <div>
                  <p className="text-white font-semibold text-sm">{nft.name}</p>
                  <p className="text-gray-400 text-xs">{nft.collection_name}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-white font-semibold">{pricePerNft} ETH</p>
                <p className="text-gray-400 text-xs">≈ $45 USD</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 p-3 bg-zinc-900 rounded">
          <div className="flex justify-between items-center">
            <span className="text-white font-semibold">Total:</span>
            <div className="text-right">
              <p className="text-white font-bold">{(cart.length * parseFloat(pricePerNft)).toFixed(3)} ETH</p>
              <p className="text-gray-400 text-sm">≈ ${(cart.length * 45)} USD</p>
            </div>
          </div>
        </div>
      </div>

      {step === 'sign' && (
        <div className="space-y-4">
          <div className="text-sm text-gray-400">
            <p>Step 1: Sign order verification messages</p>
            <p className="mt-1">This confirms your intent to purchase physical etched versions of your NFTs.</p>
          </div>
          <button
            onClick={handleSignOrders}
            disabled={loading || !isChainSupported(chainId)}
            className="w-full bg-accent text-black py-3 rounded-lg font-bold hover:bg-white transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Signing...' : `Sign ${cart.length} Order${cart.length > 1 ? 's' : ''}`}
          </button>
        </div>
      )}

      {step === 'confirm' && (
        <div className="space-y-4">
          <div className="text-sm text-gray-400">
            <p>Step 2: Confirm and submit orders</p>
            <p className="mt-1">This will create on-chain orders and charge your wallet.</p>
          </div>
          <div className="bg-zinc-800 p-4 rounded">
            <p className="text-white font-semibold mb-2">✅ Orders Signed Successfully</p>
            <p className="text-gray-400 text-sm">{signatures.length} signature{signatures.length > 1 ? 's' : ''} ready for submission</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleCancel}
              disabled={loading}
              className="flex-1 bg-gray-600 text-white py-3 rounded-lg font-bold hover:bg-gray-700 transition disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmOrders}
              disabled={loading}
              className="flex-1 bg-accent text-black py-3 rounded-lg font-bold hover:bg-white transition disabled:opacity-50"
            >
              {loading ? 'Processing...' : 'Confirm & Pay'}
            </button>
          </div>
        </div>
      )}

      {step === 'process' && (
        <div className="space-y-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent mx-auto mb-4"></div>
            <p className="text-white font-semibold">Processing Orders...</p>
            <p className="text-gray-400 text-sm">Creating on-chain orders and submitting to fulfillment</p>
          </div>
        </div>
      )}
    </div>
  );
}