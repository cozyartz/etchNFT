'use client';
import { useEffect, useRef, useState } from 'react';
import { useCart } from './CartContext';

type Props = {
  form: {
    name: string;
    email: string;
    addressLine: string;
    city: string;
    country: string;
    method: 'card' | 'crypto';
  };
};

export default function SquareCheckout({ form }: Props) {
  const { cart, clearCart } = useCart();
  const [isLoading, setIsLoading] = useState(true);
  const [payments, setPayments] = useState<any>(null);
  const [card, setCard] = useState<any>(null);
  const [showCardForm, setShowCardForm] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const applePayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function initialize() {
      if (!window.Square) {
        setError('Square Payments SDK not loaded');
        setIsLoading(false);
        return;
      }

      const appId = import.meta.env.PUBLIC_SQUARE_APP_ID;
      const locationId = import.meta.env.PUBLIC_SQUARE_LOCATION_ID;

      if (!appId || !locationId) {
        setError('Square configuration missing');
        setIsLoading(false);
        return;
      }

      try {
        const p = window.Square.payments(appId, locationId);

        setPayments(p);

        // Try Apple Pay first
        const applePay = await p.applePay();
        const supported = await applePay?.isSupported();

        if (supported && applePayRef.current) {
          await applePay.attach(applePayRef.current);
          setIsLoading(false);

          // Hook into Apple Pay flow
          applePayRef.current.addEventListener('click', async () => {
            const result = await applePay.tokenize();
            if (result.status === 'OK') {
              handleToken(result.token, 'apple');
            } else {
              setError('Apple Pay failed.');
            }
          });

          return;
        }

        // Fallback to card
        const card = await p.card();
        await card.attach('#card-container');
        setCard(card);
        setShowCardForm(true);
        setIsLoading(false);
      } catch (err: any) {
        console.error('Square init error:', err);
        setError('Payment system failed to load. Please try again.');
        setIsLoading(false);
      }
    }

    initialize();
  }, []);

  async function handleToken(token: string, method: 'apple' | 'card') {
    try {
      const res = await fetch('/api/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          form,
          cart,
          payment: {
            method,
            provider: 'square',
            token
          }
        })
      });

      if (!res.ok) throw new Error('Payment failed.');
      setSuccess(true);
      clearCart();
    } catch (err) {
      console.error(err);
      setError('Something went wrong.');
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!card) return;

    const result = await card.tokenize();
    if (result.status === 'OK') {
      handleToken(result.token, 'card');
    } else {
      setError('Card payment failed.');
    }
  }

  return (
    <div className="glass p-6 rounded-xl w-full max-w-lg">
      <h2 className="text-2xl font-bold mb-4 text-white">
        Complete Payment
      </h2>

      {success ? (
        <p className="text-green-400">✅ Payment successful! Your order is being etched.</p>
      ) : (
        <>
          {error && (
            <div className="bg-red-500 text-white px-4 py-2 rounded mb-3">
              {error}
            </div>
          )}

          <div className="mb-4">
            <div ref={applePayRef} id="apple-pay-button" />
          </div>

          {showCardForm && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div id="card-container" className="border rounded bg-zinc-800 p-2" />
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-accent text-black py-2 rounded-full font-bold hover:bg-white transition"
              >
                {isLoading ? 'Loading...' : 'Pay with Card'}
              </button>
            </form>
          )}
        </>
      )}
    </div>
  );
}
