import type { APIRoute } from 'astro';

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return new Response(JSON.stringify({ error: 'Email is required' }), { 
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const db = locals.runtime.env.DB as D1Database;

    // Fetch all orders for this email
    const orders = await db.prepare(`
      SELECT 
        id, nft_name, nft_image, collection, token_id, contract_address,
        payment_method, network, price_usd, status, created_at, updated_at,
        cert_url, plaque_svg_url, full_name, address_line, city, country
      FROM orders 
      WHERE email = ? 
      ORDER BY created_at DESC
    `).bind(email).all();

    return new Response(JSON.stringify({ 
      orders: orders.results || [],
      total: orders.results?.length || 0
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (err: any) {
    console.error('User orders fetch error:', err);
    return new Response(JSON.stringify({ error: 'Failed to fetch orders' }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};