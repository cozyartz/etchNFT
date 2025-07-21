'use client';
import { useEffect, useRef, useState } from 'react';
import { useCart } from './CartContext';
import { trackPayPalEvent } from '../../lib/analytics';

type PayPalProps = {
  form: {
    name: string;
    email: string;
    addressLine: string;
    city: string;
    country: string;
    method: 'paypal' | 'crypto';
  };
};

declare global {
  interface Window {
    paypal?: any;
  }
}

export default function PayPalCheckout({ form }: PayPalProps) {
  const { cart, clearCart } = useCart();
  const paypalRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const total = cart.length * 29; // $29 per NFT

  useEffect(() => {
    // Check if PayPal SDK is available
    if (!window.paypal) {
      setError('PayPal SDK not loaded. Please refresh the page.');
      setLoading(false);
      return;
    }

    // Validate client configuration
    if (!import.meta.env.PUBLIC_PAYPAL_CLIENT_ID) {
      setError('PayPal is not properly configured.');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const paypalButtons = window.paypal.Buttons({
      createOrder: async () => {
        try {
          trackPayPalEvent('create_order_start', { total, itemCount: cart.length });
          const response = await fetch('/api/paypal/create-order', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              cart,
              form,
              total
            }),
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            const errorMessage = errorData.error || `Server error: ${response.status}`;
            throw new Error(errorMessage);
          }

          const data = await response.json();
          if (!data.id) {
            throw new Error('Invalid response from PayPal order creation');
          }

          trackPayPalEvent('create_order_success', { orderId: data.id });
          return data.id;
        } catch (error) {
          console.error('Error creating PayPal order:', error);
          const userMessage = error instanceof Error ? error.message : 'Failed to create order. Please try again.';
          setError(userMessage);
          throw error;
        }
      },

      onApprove: async (data: any) => {
        try {
          const response = await fetch('/api/paypal/capture-order', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              orderID: data.orderID,
              form,
              cart
            }),
          });

          if (!response.ok) {
            throw new Error('Failed to capture PayPal payment');
          }

          const result = await response.json();
          
          if (result.success) {
            clearCart();
            window.location.href = '/order-success?orderId=' + result.orderIds.join(',');
          } else {
            throw new Error(result.error || 'Payment capture failed');
          }
        } catch (error) {
          console.error('Error capturing PayPal payment:', error);
          setError('Payment failed. Please try again.');
        }
      },

      onError: (err: any) => {
        console.error('PayPal error:', err);
        setError('PayPal encountered an error. Please try again.');
      },

      onCancel: () => {
        console.log('PayPal payment cancelled by user');
      },

      style: {
        layout: 'vertical',
        color: 'gold',
        shape: 'rect',
        label: 'paypal'
      }
    });

    if (paypalRef.current) {
      paypalRef.current.innerHTML = '';
      paypalButtons.render(paypalRef.current)
        .then(() => {
          setLoading(false);
        })
        .catch((error: any) => {
          console.error('Error rendering PayPal buttons:', error);
          setError('Failed to load PayPal. Please refresh and try again.');
          setLoading(false);
        });
    }

    return () => {
      if (paypalRef.current) {
        paypalRef.current.innerHTML = '';
      }
    };
  }, [cart, form, total]);

  if (loading) {
    return (
      <div className="text-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent mx-auto mb-4"></div>
        <p>Loading PayPal...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8">
        <div className="bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-700 rounded-lg p-4 mb-4">
          <p className="text-red-700 dark:text-red-300">{error}</p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="bg-accent text-black px-4 py-2 rounded-full hover:bg-white transition"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 p-4 bg-zinc-100 dark:bg-zinc-800 rounded-lg">
        <h3 className="font-semibold mb-2">Order Summary</h3>
        <div className="flex justify-between">
          <span>{cart.length} NFT{cart.length !== 1 ? 's' : ''}</span>
          <span>${total}.00</span>
        </div>
      </div>
      
      <div ref={paypalRef} className="min-h-[200px]" />
      
      <p className="text-xs text-gray-500 mt-4 text-center">
        Your NFT will be physically etched and shipped to the address provided above.
      </p>
    </div>
  );
}