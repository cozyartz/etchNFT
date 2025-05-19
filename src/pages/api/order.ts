import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
  const body = await request.json();

  if (body.method === 'card') {
    const resp = await fetch('https://connect.squareupsandbox.com/v2/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${import.meta.env.SQUARE_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        idempotency_key: crypto.randomUUID(),
        amount_money: {
          amount: 4900, // $49.00
          currency: 'USD'
        },
        source_id: body.paymentPayload.sourceId,
        location_id: import.meta.env.SQUARE_LOCATION_ID
      })
    });

    const data = await resp.json();
    if (!resp.ok) return new Response(JSON.stringify(data), { status: 400 });

    // TODO: Save order info to DB
    return new Response(JSON.stringify({ success: true }));
  }

  return new Response(JSON.stringify({ success: false }), { status: 400 });
};
