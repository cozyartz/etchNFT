import type { APIRoute } from 'astro';
import { randomUUID } from 'crypto';
import { sendConfirmationEmail } from '../../lib/email.ts';

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const body = await request.json();
    const { form, cart, payment } = body;

    if (!form || !cart || !Array.isArray(cart) || cart.length === 0) {
      return new Response(JSON.stringify({ error: 'Invalid payload' }), { status: 400 });
    }

    const db = locals.runtime.env.DB as D1Database;

    for (const nft of cart) {
      const id = randomUUID();
      const now = new Date().toISOString();

      await db.prepare(`
        INSERT INTO orders (
          id, wallet_address, nft_name, nft_image, collection,
          token_id, contract_address, payment_method, network, tx_hash,
          price_usd, full_name, email, address_line, city, country,
          plaque_svg_url, cert_url, status, email_sent, notes,
          created_at, updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        id,
        '', // optional wallet address
        nft.name,
        nft.image_url,
        nft.collection_name,
        nft.token_id,
        nft.contract_address,
        payment?.method || 'card',
        payment?.provider || '',
        payment?.token || '',
        45.00, // hardcoded price for now
        form.name,
        form.email,
        form.addressLine,
        form.city,
        form.country,
        null,
        `/cert/${id}`,
        'pending',
        true,
        '',
        now,
        now
      ).run();

      // Send confirmation
      await sendConfirmationEmail(form.email, id);
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err: any) {
    console.error('order.ts error:', err);
    return new Response(JSON.stringify({ error: 'Internal error' }), { status: 500 });
  }
};
