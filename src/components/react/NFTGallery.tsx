'use client';
import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import EtchModal from './EtchModal';

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
  const [selected, setSelected] = useState<NFT | null>(null);

  useEffect(() => {
    async function fetchNFTs() {
      const res = await fetch(`/api/nfts/${address}`);
      const json = await res.json();
      setNfts(json.nfts || []);
      setLoading(false);
    }

    fetchNFTs();
  }, [address]);

  if (loading) return <p className="text-gray-400">Loading NFTs...</p>;
  if (!nfts.length) return <p className="text-gray-500">No NFTs found.</p>;

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {nfts.map((nft, index) => (
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
              <button
                className="mt-4 bg-white text-black font-bold px-4 py-2 rounded hover:bg-gray-200 transition"
                onClick={() => setSelected(nft)}
              >
                <i className="fa-solid fa-pen-nib mr-2"></i>
                Etch This
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {selected && (
        <EtchModal nft={selected} address={address} onClose={() => setSelected(null)} />
      )}
    </>
  );
}
