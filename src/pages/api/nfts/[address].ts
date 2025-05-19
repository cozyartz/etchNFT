import type { APIRoute } from 'astro';

export const prerender = false;

export const GET: APIRoute = async ({ params }) => {
  const address = params.address;
  if (!address) {
    return new Response(JSON.stringify({ error: 'Missing address' }), { status: 400 });
  }

  const url = `https://api.simplehash.com/api/v0/nfts/owners?wallet_addresses=${address}&chains=ethereum,polygon,base`;
  const res = await fetch(url, {
    headers: {
      'X-API-KEY': import.meta.env.SIMPLEHASH_API_KEY
    }
  });

  const data = await res.json();
  return new Response(JSON.stringify(data), {
    headers: {
      'Content-Type': 'application/json'
    }
  });
};
