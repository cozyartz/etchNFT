import type { APIRoute } from 'astro';

export const prerender = false;

export const GET: APIRoute = async ({ params, locals }) => {
  const db = locals.runtime.env.DB;
  const id = params.id;

  // Fetch the order from Cloudflare D1
  const result = await db
    .prepare('SELECT * FROM orders WHERE id = ?')
    .bind(id)
    .first();

  if (!result) {
    return new Response('Not Found', { status: 404 });
  }

  const {
    full_name,
    nft_name,
    collection,
    wallet_address,
    network = 'Polygon'
  } = result;

  const svg = `
<svg width="800" height="418" xmlns="http://www.w3.org/2000/svg">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@600&display=swap');
    .title { font: 600 40px 'Space Grotesk', sans-serif; fill: #00f0ff; }
    .label { font: 600 22px 'Space Grotesk', sans-serif; fill: #ffffff; }
    .meta  { font: 400 16px 'Space Grotesk', sans-serif; fill: #888; }
  </style>
  <rect width="100%" height="100%" fill="#0b0b0f" rx="20" />
  <text x="50%" y="20%" text-anchor="middle" class="title">EtchNFT Certificate</text>
  <text x="50%" y="40%" text-anchor="middle" class="label">${nft_name}</text>
  <text x="50%" y="52%" text-anchor="middle" class="meta">Collection: ${collection}</text>
  <text x="50%" y="62%" text-anchor="middle" class="meta">Issued to: ${full_name}</text>
  <text x="50%" y="72%" text-anchor="middle" class="meta">Wallet: ${wallet_address}</text>
  <text x="50%" y="85%" text-anchor="middle" class="meta">Verified on ${network}</text>
</svg>
  `.trim();

  return new Response(svg, {
    headers: {
      'Content-Type': 'image/svg+xml',
      'Cache-Control': 'public, max-age=3600'
    }
  });
};
