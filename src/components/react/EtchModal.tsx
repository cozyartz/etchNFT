'use client';

import React, { useState, useEffect } from 'react';
import { useCart } from './CartContext';
import Toast from './Toast';

type NFT = {
  name: string;
  image_url: string;
  collection_name: string;
  token_id: string;
  contract_address: string;
};

type Props = {
  nft: NFT;
  address: string;
  onClose: () => void;
};

export default function EtchModal({ nft, address, onClose }: Props) {
  const { addToCart } = useCart();
  const [showToast, setShowToast] = useState(false);

  const [form, setForm] = useState({
    name: '',
    email: '',
    addressLine: '',
    city: '',
    country: '',
    method: 'card' // 'card' | 'crypto'
  });

  // Autofill from localStorage if returning user
  useEffect(() => {
    const saved = localStorage.getItem('etchUser');
    if (saved) setForm(JSON.parse(saved));
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Save to localStorage
    localStorage.setItem('etchUser', JSON.stringify(form));

    // Add NFT to cart
    addToCart({
      name: nft.name,
      image_url: nft.image_url,
      collection_name: nft.collection_name,
      token_id: nft.token_id,
      contract_address: nft.contract_address
    });

    // Toast feedback
    setShowToast(true);

    // Close modal after slight delay
    setTimeout(() => {
      onClose();

      // Redirect to checkout (Astro-safe)
      if (typeof window !== 'undefined') {
        window.location.href = '/checkout';
      }
    }, 1000);
  };

  const handleViewOrders = () => {
    if (typeof window !== 'undefined') {
      window.location.href = '/my-orders';
    }
  };
  return (
    <>
      {showToast && <Toast message="Added to cart. Redirecting..." />}
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 sm:px-0">
        <div className="bg-white dark:bg-zinc-900 text-black dark:text-white p-6 rounded-lg max-w-lg w-full shadow-xl relative animate-fadeIn">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 text-sm text-gray-400 hover:text-white"
            aria-label="Close"
          >
            ✕
          </button>

          <h2 className="text-xl font-bold mb-2 drop-shadow text-accent">
            Etch: {nft.name}
          </h2>

          <img
            src={nft.image_url}
            alt={nft.name}
            className="w-full h-48 object-cover rounded mb-4 border border-zinc-700"
          />

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              className="w-full p-2 rounded bg-zinc-100 dark:bg-zinc-800"
              name="name"
              required
              placeholder="Your Full Name"
              value={form.name}
              onChange={handleChange}
            />
            <input
              className="w-full p-2 rounded bg-zinc-100 dark:bg-zinc-800"
              name="email"
              type="email"
              required
              placeholder="Email Address"
              value={form.email}
              onChange={handleChange}
            />
            <input
              className="w-full p-2 rounded bg-zinc-100 dark:bg-zinc-800"
              name="addressLine"
              required
              placeholder="Shipping Address"
              value={form.addressLine}
              onChange={handleChange}
            />
            <input
              className="w-full p-2 rounded bg-zinc-100 dark:bg-zinc-800"
              name="city"
              required
              placeholder="City"
              value={form.city}
              onChange={handleChange}
            />
            <input
              className="w-full p-2 rounded bg-zinc-100 dark:bg-zinc-800"
              name="country"
              required
              placeholder="Country"
              value={form.country}
              onChange={handleChange}
            />

            <select
              name="method"
              value={form.method}
              onChange={handleChange}
              className="w-full p-2 rounded bg-zinc-100 dark:bg-zinc-800"
            >
              <option value="card">Pay with Card (Square)</option>
              <option value="crypto">Pay with Crypto</option>
            </select>

            <button
              type="submit"
              className="w-full bg-accent text-black py-2 rounded font-bold hover:bg-white transition"
            >
              Continue to Checkout →
            </button>

            <button
              type="button"
              onClick={handleViewOrders}
              className="w-full mt-2 bg-zinc-700 text-white py-2 rounded font-bold hover:bg-zinc-600 transition text-sm"
            >
              View My Orders
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
