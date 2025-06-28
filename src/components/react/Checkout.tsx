'use client';
import { useEffect, useState } from 'react';
import { useCart } from './CartContext';
import SquareCheckout from './SquareCheckout';

type FormData = {
  name: string;
  email: string;
  addressLine: string;
  city: string;
  country: string;
  method: 'card' | 'crypto';
};

export default function Checkout() {
  const { cart, clearCart } = useCart();
  const [form, setForm] = useState<FormData>({
    name: '',
    email: '',
    addressLine: '',
    city: '',
    country: '',
    method: 'card'
  });

  const [submitted, setSubmitted] = useState(false);
  const [showCrypto, setShowCrypto] = useState(false);
  const [cryptoUrl, setCryptoUrl] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('etchUser');
    if (saved) setForm(JSON.parse(saved));
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleCryptoCheckout = async () => {
    setSubmitted(true); // Show loading state
    
    const res = await fetch('/api/crypto-checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ form, cart })
    });

    if (!res.ok) {
      setSubmitted(false);
      alert('Failed to launch crypto checkout.');
      return;
    }

    const { checkout_url, order_id } = await res.json();
    setCryptoUrl(checkout_url);
    setShowCrypto(true);
    setSubmitted(false);
    
    // Store order ID for reference
    localStorage.setItem('pendingOrderId', order_id);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    localStorage.setItem('etchUser', JSON.stringify(form));

    if (form.method === 'crypto') {
      handleCryptoCheckout();
    }
  };

  if (submitted) {
    return (
      <div className="text-center p-8">
        <h2 className="text-3xl font-bold text-accent mb-4">🎉 Order Confirmed!</h2>
        <p className="text-white">Your NFT is now being etched into reality.</p>
      </div>
    );
  }

  return (
    <div className="glass p-6 rounded-xl max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Secure Checkout</h1>

      {cart.length === 0 ? (
        <p className="text-gray-400">Your cart is empty.</p>
      ) : (
        <div className="grid sm:grid-cols-2 gap-8">
          <form onSubmit={handleFormSubmit} className="space-y-4">
            <h2 className="text-xl font-semibold mb-2">Shipping Info</h2>

            <input
              name="name"
              required
              placeholder="Full Name"
              value={form.name}
              onChange={handleChange}
              className="w-full p-2 rounded bg-zinc-100 dark:bg-zinc-800"
            />
            <input
              name="email"
              type="email"
              required
              placeholder="Email"
              value={form.email}
              onChange={handleChange}
              className="w-full p-2 rounded bg-zinc-100 dark:bg-zinc-800"
            />
            <input
              name="addressLine"
              required
              placeholder="Address"
              value={form.addressLine}
              onChange={handleChange}
              className="w-full p-2 rounded bg-zinc-100 dark:bg-zinc-800"
            />
            <input
              name="city"
              required
              placeholder="City"
              value={form.city}
              onChange={handleChange}
              className="w-full p-2 rounded bg-zinc-100 dark:bg-zinc-800"
            />
            <input
              name="country"
              required
              placeholder="Country"
              value={form.country}
              onChange={handleChange}
              className="w-full p-2 rounded bg-zinc-100 dark:bg-zinc-800"
            />

            <select
              name="method"
              value={form.method}
              onChange={handleChange}
              className="w-full p-2 rounded bg-zinc-100 dark:bg-zinc-800"
            >
              <option value="card">Pay with Card or Apple Pay</option>
              <option value="crypto">Pay with Web3 Wallet</option>
            </select>

            {form.method === 'crypto' && (
              <button
                type="submit"
                className="bg-pink-500 text-black py-2 px-6 rounded-full font-bold mt-4 hover:bg-white transition"
              >
                Launch Crypto Checkout →
              </button>
            )}
          </form>

          <div>
            <h2 className="text-xl font-semibold mb-2">Your Items</h2>
            <ul className="space-y-4 mb-6">
              {cart.map((nft, idx) => (
                <li
                  key={idx}
                  className="border-b border-zinc-700 pb-4 flex items-center gap-4"
                >
                  <img
                    src={nft.image_url}
                    alt={nft.name}
                    className="w-16 h-16 object-cover rounded"
                  />
                  <div>
                    <p className="font-semibold">{nft.name}</p>
                    <p className="text-xs text-zinc-400">{nft.collection_name}</p>
                  </div>
                </li>
              ))}
            </ul>

            {form.method === 'card' && (
              <SquareCheckout form={form} />
            )}
          </div>
        </div>
      )}

      {/* Coinbase iframe modal */}
      {showCrypto && (
        <div className="fixed inset-0 bg-black/70 z-50 flex justify-center items-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-lg overflow-hidden w-full max-w-2xl h-[80vh] relative shadow-xl">
            <button
              onClick={() => setShowCrypto(false)}
              className="absolute top-2 right-4 text-lg text-zinc-400 hover:text-white"
            >
              ×
            </button>
            <iframe
              src={cryptoUrl}
              className="w-full h-full border-0"
              allow="payment"
            />
          </div>
        </div>
      )}
    </div>
  );
}
