import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request, locals }) => {
  const db = locals.runtime.env.DB as D1Database;

  try {
    const event = await request.json();

    if (
      event?.type === 'charge:confirmed' &&
      event?.data?.metadata?.order_id
    ) {
      const orderId = event.data.metadata.order_id;

      await db
        .prepare(`UPDATE orders SET status = 'paid', updated_at = CURRENT_TIMESTAMP WHERE id = ?`)
        .bind(orderId)
        .run();

      return new Response(JSON.stringify({ success: true }), { status: 200 });
    }

    return new Response('Ignored', { status: 200 });
  } catch (err: any) {
    console.error('Coinbase webhook error:', err);
    return new Response('Error', { status: 500 });
  }
};
