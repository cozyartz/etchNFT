import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ params }) => {
  const { id } = params;

  const metadata = {
    name: `EtchNFT Certificate #${id}`,
    description: 'Official Certificate for Laser-Etched NFT',
    image: `https://etchnft.com/cert/${id}/preview.png`,
    external_url: `https://etchnft.com/cert/${id}`,
    attributes: [
      { trait_type: 'Type', value: 'Etched NFT' },
      { trait_type: 'Network', value: 'Polygon' }
    ]
  };

  return new Response(JSON.stringify(metadata), {
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=3600'
    }
  });
};
