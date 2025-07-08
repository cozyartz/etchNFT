'use client';
import React, { createContext, useContext, useState } from 'react';
type ReactNode = React.ReactNode;

export type NFTItem = {
  name: string;
  image_url: string;
  collection_name: string;
  token_id: string;
  contract_address: string;
};

type CartContextType = {
  cart: NFTItem[];
  addToCart: (item: NFTItem) => void;
  removeFromCart: (token_id: string) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<NFTItem[]>([]);

  const addToCart = (item: NFTItem) => {
    setCart(prev => [...prev, item]);
  };

  const removeFromCart = (token_id: string) => {
    setCart(prev => prev.filter(nft => nft.token_id !== token_id));
  };

  const clearCart = () => setCart([]);

  return (
    <CartContext.Provider value={{ cart, addToCart, removeFromCart, clearCart }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside CartProvider');
  return ctx;
}
