import type { APIRoute } from 'astro';
import { captureOrder } from '../../../lib/paypal';

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const { orderID, form, cart } = await request.json();

    if (!orderID) {
      return new Response(JSON.stringify({ error: 'Order ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Capture the PayPal payment
    const captureResult = await captureOrder(orderID);
    
    if (captureResult.status !== 'COMPLETED') {
      return new Response(JSON.stringify({ 
        error: 'Payment not completed',
        status: captureResult.status 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get the database connection
    const db = locals.runtime.env.DB;
    if (!db) {
      throw new Error('Database not available');
    }

    const orderIds: string[] = [];

    // Create orders in database for each NFT in cart
    for (const nft of cart) {
      const orderId = `paypal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      await db.prepare(`
        INSERT INTO orders (
          id, 
          user_email, 
          nft_contract, 
          nft_token_id, 
          nft_image_url, 
          nft_name, 
          nft_collection, 
          shipping_name, 
          shipping_address, 
          shipping_city, 
          shipping_country, 
          payment_method, 
          payment_status, 
          payment_intent_id, 
          amount, 
          created_at, 
          status,
          notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        orderId,
        form.email,
        nft.contract_address,
        nft.token_id,
        nft.image_url,
        nft.name,
        nft.collection_name,
        form.name,
        form.addressLine,
        form.city,
        form.country,
        'paypal',
        'paid',
        orderID,
        29.00,
        new Date().toISOString(),
        'processing',
        `PayPal transaction ID: ${captureResult.purchase_units[0]?.payments?.captures?.[0]?.id || orderID}`
      ).run();

      orderIds.push(orderId);
    }

    return new Response(JSON.stringify({ 
      success: true,
      orderIds,
      paypalOrderId: orderID,
      transactionId: captureResult.purchase_units[0]?.payments?.captures?.[0]?.id
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('PayPal capture order error:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to capture PayPal payment',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};