'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

type Order = {
  id: string;
  nft_name: string;
  nft_image: string;
  collection: string;
  token_id: string;
  contract_address: string;
  payment_method: string;
  network: string;
  price_usd: number;
  status: string;
  created_at: string;
  updated_at: string;
  cert_url: string;
  plaque_svg_url: string;
  full_name: string;
  address_line: string;
  city: string;
  country: string;
};

type Props = {
  userEmail?: string;
};

const statusConfig = {
  pending: { color: 'text-yellow-400', bg: 'bg-yellow-400/10', icon: 'fa-clock' },
  paid: { color: 'text-blue-400', bg: 'bg-blue-400/10', icon: 'fa-credit-card' },
  processing: { color: 'text-purple-400', bg: 'bg-purple-400/10', icon: 'fa-cog' },
  etched: { color: 'text-green-400', bg: 'bg-green-400/10', icon: 'fa-check' },
  shipped: { color: 'text-cyan-400', bg: 'bg-cyan-400/10', icon: 'fa-truck' },
  delivered: { color: 'text-emerald-400', bg: 'bg-emerald-400/10', icon: 'fa-home' },
  failed: { color: 'text-red-400', bg: 'bg-red-400/10', icon: 'fa-times' }
};

export default function OrderHistory({ userEmail }: Props) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState(userEmail || '');
  const [error, setError] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const fetchOrders = async () => {
    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/orders/user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch orders');
      }

      setOrders(data.orders || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load order history');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userEmail) {
      fetchOrders();
    }
  }, [userEmail]);

  const getStatusDisplay = (status: string) => {
    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending;
    return config;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTotalSpent = () => {
    return orders.reduce((total, order) => total + (order.price_usd || 0), 0);
  };

  return (
    <div className="space-y-6">
      {/* Email Input */}
      {!userEmail && (
        <div className="glass p-6 rounded-xl">
          <h2 className="text-xl font-bold text-white mb-4">
            <i className="fa-solid fa-search mr-2"></i>
            Find Your Orders
          </h2>
          <div className="flex gap-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email address"
              className="flex-1 px-4 py-2 rounded-lg bg-zinc-800 text-white border border-zinc-600 focus:border-accent focus:outline-none"
              onKeyPress={(e) => e.key === 'Enter' && fetchOrders()}
            />
            <button
              onClick={fetchOrders}
              disabled={loading}
              className="bg-accent text-black px-6 py-2 rounded-lg font-semibold hover:bg-white transition disabled:opacity-50"
            >
              {loading ? (
                <i className="fa-solid fa-spinner fa-spin"></i>
              ) : (
                'Search'
              )}
            </button>
          </div>
          {error && (
            <p className="text-red-400 text-sm mt-2">{error}</p>
          )}
        </div>
      )}

      {/* Order Statistics */}
      {orders.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="glass p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-accent">{orders.length}</div>
            <div className="text-sm text-gray-400">Total Orders</div>
          </div>
          <div className="glass p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-green-400">${getTotalSpent().toFixed(2)}</div>
            <div className="text-sm text-gray-400">Total Spent</div>
          </div>
          <div className="glass p-4 rounded-lg text-center">
            <div className="text-2xl font-bold text-purple-400">
              {orders.filter(o => o.status === 'delivered').length}
            </div>
            <div className="text-sm text-gray-400">Delivered</div>
          </div>
        </div>
      )}

      {/* Orders List */}
      {loading ? (
        <div className="glass p-8 rounded-xl text-center">
          <div className="animate-spin text-4xl text-accent mb-4">
            <i className="fa-solid fa-spinner"></i>
          </div>
          <p className="text-gray-400">Loading your order history...</p>
        </div>
      ) : orders.length > 0 ? (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-white">
            <i className="fa-solid fa-history mr-2"></i>
            Your Order History
          </h2>
          
          {orders.map((order, index) => {
            const statusDisplay = getStatusDisplay(order.status);
            
            return (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="glass p-6 rounded-xl hover:bg-zinc-800/50 transition cursor-pointer"
                onClick={() => setSelectedOrder(order)}
              >
                <div className="flex items-center gap-4">
                  {/* NFT Image */}
                  <div className="w-16 h-16 rounded-lg overflow-hidden bg-zinc-700 flex-shrink-0">
                    {order.nft_image ? (
                      <img
                        src={order.nft_image}
                        alt={order.nft_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-500">
                        <i className="fa-solid fa-image"></i>
                      </div>
                    )}
                  </div>

                  {/* Order Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-white truncate">
                          {order.nft_name || 'Untitled NFT'}
                        </h3>
                        <p className="text-sm text-gray-400">{order.collection}</p>
                        <p className="text-xs text-gray-500">
                          Order #{order.id.slice(0, 8)}... • {formatDate(order.created_at)}
                        </p>
                      </div>
                      
                      <div className="text-right flex-shrink-0">
                        <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${statusDisplay.bg} ${statusDisplay.color}`}>
                          <i className={`fa-solid ${statusDisplay.icon} mr-1`}></i>
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </div>
                        <p className="text-sm text-white mt-1">${order.price_usd?.toFixed(2)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {order.cert_url && (
                      <a
                        href={order.cert_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-accent hover:text-white transition"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <i className="fa-solid fa-certificate"></i>
                      </a>
                    )}
                    <i className="fa-solid fa-chevron-right text-gray-400"></i>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : email && !loading ? (
        <div className="glass p-8 rounded-xl text-center">
          <div className="text-4xl text-gray-400 mb-4">
            <i className="fa-solid fa-inbox"></i>
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">No Orders Found</h3>
          <p className="text-gray-400 mb-6">
            We couldn't find any orders associated with this email address.
          </p>
          <a
            href="/gallery"
            className="bg-accent text-black px-6 py-2 rounded-full font-bold hover:bg-white transition"
          >
            Start Etching →
          </a>
        </div>
      ) : null}

      {/* Order Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">Order Details</h2>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="text-gray-400 hover:text-white transition"
                >
                  <i className="fa-solid fa-times text-xl"></i>
                </button>
              </div>

              <div className="space-y-6">
                {/* NFT Details */}
                <div className="flex items-center gap-4 p-4 bg-zinc-800 rounded-lg">
                  <div className="w-20 h-20 rounded-lg overflow-hidden bg-zinc-700">
                    {selectedOrder.nft_image ? (
                      <img
                        src={selectedOrder.nft_image}
                        alt={selectedOrder.nft_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-500">
                        <i className="fa-solid fa-image"></i>
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{selectedOrder.nft_name}</h3>
                    <p className="text-sm text-gray-400">{selectedOrder.collection}</p>
                    <p className="text-xs text-gray-500">Token #{selectedOrder.token_id}</p>
                  </div>
                </div>

                {/* Order Info */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">Order ID:</span>
                    <p className="font-mono text-white">{selectedOrder.id}</p>
                  </div>
                  <div>
                    <span className="text-gray-400">Status:</span>
                    <p className={`font-semibold ${getStatusDisplay(selectedOrder.status).color}`}>
                      {selectedOrder.status.charAt(0).toUpperCase() + selectedOrder.status.slice(1)}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-400">Price:</span>
                    <p className="text-white">${selectedOrder.price_usd?.toFixed(2)}</p>
                  </div>
                  <div>
                    <span className="text-gray-400">Payment:</span>
                    <p className="text-white capitalize">{selectedOrder.payment_method}</p>
                  </div>
                  <div>
                    <span className="text-gray-400">Ordered:</span>
                    <p className="text-white">{formatDate(selectedOrder.created_at)}</p>
                  </div>
                  <div>
                    <span className="text-gray-400">Updated:</span>
                    <p className="text-white">{formatDate(selectedOrder.updated_at)}</p>
                  </div>
                </div>

                {/* Shipping Address */}
                <div>
                  <h4 className="font-semibold text-white mb-2">Shipping Address</h4>
                  <div className="bg-zinc-800 p-4 rounded-lg text-sm text-gray-300">
                    <p>{selectedOrder.full_name}</p>
                    <p>{selectedOrder.address_line}</p>
                    <p>{selectedOrder.city}, {selectedOrder.country}</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  {selectedOrder.cert_url && (
                    <a
                      href={selectedOrder.cert_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 bg-accent text-black text-center py-2 px-4 rounded-lg font-semibold hover:bg-white transition"
                    >
                      <i className="fa-solid fa-certificate mr-2"></i>
                      View Certificate
                    </a>
                  )}
                  <a
                    href={`/orders?id=${selectedOrder.id}`}
                    className="flex-1 bg-zinc-700 text-white text-center py-2 px-4 rounded-lg font-semibold hover:bg-zinc-600 transition"
                  >
                    <i className="fa-solid fa-truck mr-2"></i>
                    Track Order
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}