'use client';
import { useCart } from './CartContext';
import { useState } from 'react';

export default function CartToggle() {
  const { cart } = useCart();
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="relative text-xl hover:text-accent transition"
      >
        <i className="fa-solid fa-cart-shopping"></i>
        {cart.length > 0 && (
          <span className="absolute -top-2 -right-2 text-xs bg-pink-500 text-black rounded-full px-1.5 font-bold">
            {cart.length}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed top-0 right-0 w-full max-w-md h-full bg-zinc-950 text-white shadow-xl p-6 z-50 transition-all duration-300 border-l border-zinc-700">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Your Cart</h2>
            <button
              className="text-pink-400 text-sm hover:underline"
              onClick={() => setOpen(false)}
            >
              Close
            </button>
          </div>
          <CartDrawer />
        </div>
      )}
    </>
  );
}
