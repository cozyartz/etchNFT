'use client';
import { useCart } from './CartContext';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { ShoppingCart, X, Image, CreditCard } from 'lucide-react';

export default function CartToggle() {
  const { cart } = useCart();
  const [open, setOpen] = useState(false);

  const handleOpen = () => {
    setOpen(true);
    toast.success('Cart opened', {
      duration: 1000,
      icon: '🛒',
    });
  };

  return (
    <>
      <motion.button
        onClick={handleOpen}
        className="relative p-2 rounded-lg border border-primary/30 bg-retro-dark hover:bg-primary/10 transition-all duration-300 group"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <ShoppingCart className="text-primary group-hover:animate-pulse" size={20} />
        <AnimatePresence>
          {cart.length > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -top-2 -right-2 text-xs bg-gradient-to-r from-primary to-secondary text-black rounded-full px-1.5 font-bold animate-pulse"
            >
              {cart.length}
            </motion.span>
          )}
        </AnimatePresence>
        <div className="absolute inset-0 bg-primary/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-lg"></div>
      </motion.button>

      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
              onClick={() => setOpen(false)}
            />
            
            {/* Cart Drawer */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'tween', duration: 0.3 }}
              className="fixed top-0 right-0 w-full max-w-md h-full glass-strong border-l border-primary/30 p-6 z-50 scan-lines"
            >
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-cyber text-white tracking-wider flex items-center gap-2">
                  <ShoppingCart size={24} />Your Cart
                </h2>
                <motion.button
                  onClick={() => setOpen(false)}
                  className="btn-ghost text-sm px-3 py-1"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <X size={16} className="mr-1" />Close
                </motion.button>
              </div>
              
              {/* Cart Content */}
              <div className="h-full overflow-y-auto">
                {cart.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-1/2 text-center">
                    <ShoppingCart className="text-primary/30 mb-4" size={96} />
                    <p className="text-gray-400 font-cyber">Your cart is empty</p>
                    <p className="text-sm text-gray-500 mt-2">Add some NFTs to get started</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {cart.map((item, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="card-retro p-4"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center">
                            <Image className="text-primary" size={20} />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-cyber text-white text-sm">{item.name}</h3>
                            <p className="text-xs text-gray-400">{item.collection}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-primary font-bold">${item.price}</p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                    
                    <motion.button
                      className="btn-cyber w-full mt-6"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <CreditCard size={16} className="mr-2" />Checkout
                    </motion.button>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
