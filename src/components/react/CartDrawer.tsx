'use client';
import { useCart } from './CartContext';
import { useRouter } from 'next/router'; // Use if you're SSR with routing

export default function CartDrawer() {
  const { cart, removeFromCart, clearCart } = useCart();

  return (
    <div className="space-y-4">
      {cart.length === 0 ? (
        <p className="text-gray-400">No items in your cart yet.</p>
      ) : (
        <>
          {cart.map((item, i) => (
            <div key={i} className="border-b border-zinc-700 pb-3">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-semibold">{item.name}</p>
                  <p className="text-xs text-zinc-400">{item.collection_name}</p>
                </div>
                <button
                  onClick={() => removeFromCart(item.token_id)}
                  className="text-red-400 text-xs hover:underline"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}

          <div className="flex justify-between items-center mt-6">
            <button
              onClick={clearCart}
              className="text-xs text-pink-400 underline"
            >
              Clear Cart
            </button>

            <a
              href="/checkout"
              className="bg-accent text-black px-4 py-2 rounded-full font-bold text-sm hover:bg-white transition"
            >
              Checkout →
            </a>
          </div>
        </>
      )}
    </div>
  );
}
