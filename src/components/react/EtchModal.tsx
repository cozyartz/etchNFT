'use client';
import React, { useState, useEffect } from 'react';
import { useSendTransaction, useWaitForTransactionReceipt } from 'wagmi';
import { parseEther } from 'viem';

// Types
type NFT = {
  name: string;
  image_url: string;
  collection_name: string;
  token_id: string;
  contract_address: string;
};

type EtchForm = {
  name: string;
  email: string;
  addressLine: string;
  city: string;
  country: string;
  method: 'card' | 'crypto';
};

type Props = {
  nft: NFT;
  address: string;
  onClose: () => void;
};

// Static — define where crypto is sent
const DESTINATION_ADDRESS = '0xYourReceiveWalletAddress'; // TODO: Replace
const CRYPTO_AMOUNT = '0.02'; // ETH

export default function EtchModal({ nft, address, onClose }: Props) {
  const [form, setForm] = useState<EtchForm>({
    name: '',
    email: '',
    addressLine: '',
    city: '',
    country: '',
    method: 'card',
  });

  const [submitting, setSubmitting] = useState(false);

  const { data: hash, sendTransaction } = useSendTransaction();
  const { isLoading: waitingTx, isSuccess: txConfirmed } = useWaitForTransactionReceipt({
    hash
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    if (form.method === 'crypto') {
      // Send ETH to your address
      sendTransaction({
        to: DESTINATION_ADDRESS,
        value: parseEther(CRYPTO_AMOUNT),
      });
    } else {
      // Card (Square) will be added next
      alert(`Processing Card payment for ${form.name}...`);
      setSubmitting(false);
    }
  };

  // Track confirmed crypto TX
  useEffect(() => {
    if (txConfirmed) {
      // Submit the order to backend
      fetch('/api/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          method: 'crypto',
          txHash: hash,
          shipping: form,
          nft,
          address,
        }),
      }).then(() => {
        alert('Crypto payment received and order placed!');
        onClose();
      });
    }
  }, [txConfirmed]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-zinc-900 text-black dark:text-white p-6 rounded-xl w-full max-w-lg shadow-xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-white"
          aria-label="Close"
        >
          <i className="fa-solid fa-xmark text-xl"></i>
        </button>

        <h2 className="text-2xl font-bold mb-4 text-center">Etch Order: {nft.name}</h2>
        <img
          src={nft.image_url}
          alt={nft.name}
          className="w-full h-48 object-cover rounded mb-6"
        />

        <form onSubmit={handleSubmit} className="space-y-4">
          <input name="name" required placeholder="Full Name" onChange={handleChange}
            className="w-full p-2 rounded bg-zinc-100 dark:bg-zinc-800" />
          <input name="email" type="email" required placeholder="Email"
            onChange={handleChange}
            className="w-full p-2 rounded bg-zinc-100 dark:bg-zinc-800" />
          <input name="addressLine" required placeholder="Address"
            onChange={handleChange}
            className="w-full p-2 rounded bg-zinc-100 dark:bg-zinc-800" />
          <input name="city" required placeholder="City"
            onChange={handleChange}
            className="w-full p-2 rounded bg-zinc-100 dark:bg-zinc-800" />
          <input name="country" required placeholder="Country"
            onChange={handleChange}
            className="w-full p-2 rounded bg-zinc-100 dark:bg-zinc-800" />

          <select
            name="method"
            onChange={handleChange}
            className="w-full p-2 rounded bg-zinc-100 dark:bg-zinc-800"
          >
            <option value="card">💳 Pay with Card (Square)</option>
            <option value="crypto">🪙 Pay with Crypto (ETH)</option>
          </select>

          <button
            type="submit"
            disabled={submitting || waitingTx}
            className="w-full bg-black dark:bg-white text-white dark:text-black py-2 rounded font-bold hover:scale-[1.02] transition"
          >
            {form.method === 'crypto'
              ? waitingTx
                ? 'Waiting for Confirmation...'
                : `Pay ${CRYPTO_AMOUNT} ETH`
              : 'Continue to Card Checkout'}
          </button>
        </form>
      </div>
    </div>
  );
}
