'use client';
import React, { useEffect, useState } from 'react';
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
      try {
        const res = await fetch(`/api/nfts/${address}`);
        const json = await res.json();
        const items = json.nfts || [];
        setNfts(items);
      } catch (err) {
        console.error('Error fetching NFTs:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchNFTs();
  }, [address]);

  if (loading) return <p className="text-gray-400">Loading NFTs...</p>;
  if (!nfts.length) return <p className="text-gray-500">No NFTs found for this wallet.</p>;

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {nfts.map((nft) => (
          <div
            key={`${nft.contract_address}-${nft.token_id}`}
            className="bg-zinc-800 rounded-lg overflow-hidden shadow-lg transition hover:scale-[1.02]"
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
