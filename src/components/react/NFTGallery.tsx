'use client';
import React, { useEffect, useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import EtchModal from './EtchModal';
import { PenTool, Eye, Search, Filter } from 'lucide-react';

type NFT = {
  name: string;
  collection_name: string;
  image_url: string;
  token_id: string;
  contract_address: string;
};

type Props = {
  address: string;
};

export default function NFTGallery({ address }: Props) {
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [selected, setSelected] = useState<NFT | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCollection, setSelectedCollection] = useState('all');

  useEffect(() => {
    async function fetchNFTs() {
      try {
        setError(null);
        setLoading(true);
        
        const res = await fetch(`/api/nfts/${address}`);
        
        if (!res.ok) {
          throw new Error(`Failed to fetch NFTs: ${res.status} ${res.statusText}`);
        }
        
        const json = await res.json();
        setNfts(json.nfts || []);
      } catch (error) {
        console.error('Failed to fetch NFTs:', error);
        setError(error instanceof Error ? error.message : 'Failed to load NFTs');
        setNfts([]);
      } finally {
        setLoading(false);
      }
    }

    if (address) {
      fetchNFTs();
    } else {
      setLoading(false);
    }
  }, [address, retryCount]);

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
  };

  // Get unique collections for filtering
  const collections = useMemo(() => {
    const uniqueCollections = Array.from(new Set(nfts.map(nft => nft.collection_name)));
    return uniqueCollections.sort();
  }, [nfts]);

  // Filter NFTs based on search term and selected collection
  const filteredNfts = useMemo(() => {
    let filtered = nfts;

    // Filter by collection
    if (selectedCollection !== 'all') {
      filtered = filtered.filter(nft => nft.collection_name === selectedCollection);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(nft => 
        nft.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        nft.collection_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    return filtered;
  }, [nfts, searchTerm, selectedCollection]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mb-4"></div>
        <p className="text-gray-400">Loading your NFTs...</p>
      </div>
    );
  }

  if (!address) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg">Connect your wallet to view your NFTs</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="bg-red-900/20 border border-red-500 rounded-lg p-6 max-w-md mx-auto">
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={handleRetry}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded transition"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!nfts.length) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 text-lg mb-4">No NFTs found in this wallet</p>
        <button
          onClick={handleRetry}
          className="text-blue-400 hover:text-blue-300 underline"
        >
          Refresh
        </button>
      </div>
    );
  }

  return (
    <>
      {/* Search and Filter Controls */}
      <div className="mb-6 space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search NFTs by name or collection..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Collection Filter */}
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-400" />
          <select
            value={selectedCollection}
            onChange={(e) => setSelectedCollection(e.target.value)}
            className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-blue-500"
          >
            <option value="all">All Collections ({nfts.length})</option>
            {collections.map(collection => (
              <option key={collection} value={collection}>
                {collection} ({nfts.filter(nft => nft.collection_name === collection).length})
              </option>
            ))}
          </select>
        </div>

        {/* Results Count */}
        {filteredNfts.length !== nfts.length && (
          <p className="text-sm text-gray-400">
            Showing {filteredNfts.length} of {nfts.length} NFTs
          </p>
        )}
      </div>

      {/* NFT Grid */}
      {filteredNfts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg mb-4">No NFTs match your search criteria</p>
          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedCollection('all');
            }}
            className="text-blue-400 hover:text-blue-300 underline"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {filteredNfts.map((nft, index) => (
          <motion.div
            key={`${nft.contract_address}-${nft.token_id}`}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-zinc-800 rounded-lg overflow-hidden shadow-lg hover:scale-[1.02] transition"
          >
            {nft.image_url ? (
              <img
                src={nft.image_url}
                alt={nft.name}
                className="w-full h-60 object-cover"
              />
            ) : (
              <div className="w-full h-60 bg-zinc-700 flex items-center justify-center text-gray-500">
                No Image
              </div>
            )}
            <div className="p-4">
              <h3 className="text-lg font-semibold text-white truncate">
                {nft.name || 'Untitled'}
              </h3>
              <p className="text-sm text-gray-400">{nft.collection_name}</p>
              <div className="flex gap-2 mt-4">
                <button
                  className="flex-1 bg-white text-black font-bold px-4 py-2 rounded hover:bg-gray-200 transition text-sm"
                  onClick={() => setSelected(nft)}
                >
                  <PenTool size={16} className="mr-2" />
                  Etch This
                </button>
                <a
                  href={`/nft/${nft.contract_address}/${nft.token_id}?wallet=${address}`}
                  className="bg-zinc-700 text-white font-bold px-3 py-2 rounded hover:bg-zinc-600 transition text-sm"
                >
                  <Eye size={16} />
                </a>
              </div>
            </div>
          </motion.div>
        ))}
        </div>
      )}

      {selected && (
        <EtchModal nft={selected} address={address} onClose={() => setSelected(null)} />
      )}
    </>
  );
}
