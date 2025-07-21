import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const body = await request.text();
    const signature = request.headers.get('PAYPAL-TRANSMISSION-SIG');
    const certId = request.headers.get('PAYPAL-CERT-ID');
    const transmissionId = request.headers.get('PAYPAL-TRANSMISSION-ID');
    const timestamp = request.headers.get('PAYPAL-TRANSMISSION-TIME');
    
    // Verify webhook signature (in production, you should verify this properly)
    if (!signature || !certId || !transmissionId || !timestamp) {
      console.error('Missing PayPal webhook headers');
      return new Response('Invalid webhook headers', { status: 400 });
    }

    const webhookData = JSON.parse(body);
    const eventType = webhookData.event_type;
    
    console.log('PayPal webhook received:', eventType, JSON.stringify(webhookData, null, 2));

    const db = locals.runtime?.env?.DB as D1Database;
    if (!db) {
      console.error('Database not available');
      return new Response('Database not available', { status: 500 });
    }

    // Handle different PayPal webhook events
    switch (eventType) {
      case 'PAYMENT.CAPTURE.COMPLETED':
        await handlePaymentCompleted(db, webhookData);
        break;
      case 'PAYMENT.CAPTURE.DENIED':
        await handlePaymentDenied(db, webhookData);
        break;
      case 'PAYMENT.CAPTURE.REFUNDED':
        await handlePaymentRefunded(db, webhookData);
        break;
      case 'CHECKOUT.ORDER.APPROVED':
        await handleOrderApproved(db, webhookData);
        break;
      default:
        console.log('Unhandled PayPal event type:', eventType);
    }

    return new Response('OK', { status: 200 });
  } catch (error) {
    console.error('PayPal webhook error:', error);
    return new Response('Webhook processing failed', { status: 500 });
  }
};

async function handlePaymentCompleted(db: D1Database, webhookData: any) {
  const resource = webhookData.resource;
  const orderId = resource.custom_id;
  const captureId = resource.id;
  const amount = resource.amount.value;
  
  if (orderId && orderId.startsWith('etchnft_')) {
    // Update order status to confirmed
    await db.prepare(`
      UPDATE orders 
      SET status = 'confirmed', 
          tx_hash = ?,
          payment_status = 'paid',
          updated_at = ?
      WHERE notes LIKE ?
    `).bind(
      captureId,
      new Date().toISOString(),
      `%${orderId}%`
    ).run();
    
    console.log(`Updated order ${orderId} to confirmed with capture ID ${captureId}`);
  }
}

async function handlePaymentDenied(db: D1Database, webhookData: any) {
  const resource = webhookData.resource;
  const orderId = resource.custom_id;
  
  if (orderId && orderId.startsWith('etchnft_')) {
    // Update order status to failed
    await db.prepare(`
      UPDATE orders 
      SET status = 'failed', 
          payment_status = 'failed',
          updated_at = ?
      WHERE notes LIKE ?
    `).bind(
      new Date().toISOString(),
      `%${orderId}%`
    ).run();
    
    console.log(`Updated order ${orderId} to failed`);
  }
}

async function handlePaymentRefunded(db: D1Database, webhookData: any) {
  const resource = webhookData.resource;
  const captureId = resource.id;
  const refundAmount = resource.amount.value;
  
  // Find order by capture ID and update status
  const order = await db.prepare(`
    SELECT * FROM orders WHERE tx_hash = ?
  `).bind(captureId).first();
  
  if (order) {
    await db.prepare(`
      UPDATE orders 
      SET status = 'refunded', 
          payment_status = 'refunded',
          updated_at = ?,
          notes = COALESCE(notes, '') || ? 
      WHERE id = ?
    `).bind(
      new Date().toISOString(),
      ` PayPal refund of $${refundAmount} processed.`,
      order.id
    ).run();
    
    console.log(`Updated order ${order.id} to refunded ($${refundAmount})`);
  }
}

async function handleOrderApproved(db: D1Database, webhookData: any) {
  const resource = webhookData.resource;
  const orderId = resource.id;
  
  console.log(`PayPal order ${orderId} approved, awaiting capture`);
  // This event typically comes before payment capture
  // We might use this to update order status to 'processing' if needed
}