import type { APIRoute } from "astro";
import crypto from "crypto";

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const body = await request.text();
    const signature = request.headers.get("x-square-signature");

    if (!signature) {
      return new Response("Missing signature", { status: 400 });
    }

    // Verify webhook signature
    const webhookSignatureKey = import.meta.env.SQUARE_WEBHOOK_SIGNATURE_KEY;
    if (!webhookSignatureKey) {
      console.error("Square webhook signature key not configured");
      return new Response("Webhook not configured", { status: 500 });
    }

    const hash = crypto
      .createHmac("sha256", webhookSignatureKey)
      .update(body)
      .digest("base64");

    if (hash !== signature) {
      console.error("Invalid webhook signature");
      return new Response("Invalid signature", { status: 401 });
    }

    const event = JSON.parse(body);
    console.log("Square webhook received:", event.type);

    const db = locals.runtime?.env?.DB as D1Database;
    if (!db) {
      return new Response("Database not available", { status: 500 });
    }

    // Handle different event types
    switch (event.type) {
      case "payment.created":
        await handlePaymentCreated(event.data.object.payment, db);
        break;

      case "payment.updated":
        await handlePaymentUpdated(event.data.object.payment, db);
        break;

      case "refund.created":
        await handleRefundCreated(event.data.object.refund, db);
        break;

      case "refund.updated":
        await handleRefundUpdated(event.data.object.refund, db);
        break;

      default:
        console.log(`Unhandled Square webhook event: ${event.type}`);
    }

    return new Response("OK", { status: 200 });
  } catch (error) {
    console.error("Square webhook error:", error);
    return new Response("Internal server error", { status: 500 });
  }
};

async function handlePaymentCreated(payment: any, db: D1Database) {
  console.log("Payment created:", payment.id);

  try {
    // Find order by payment reference
    const orderId = payment.reference_id || payment.order_id;
    if (!orderId) {
      console.error("No order ID found in payment");
      return;
    }

    // Update order status to confirmed
    await db
      .prepare(
        `UPDATE orders 
         SET status = ?, 
             tx_hash = ?,
             updated_at = ?
         WHERE id = ?`,
      )
      .bind("confirmed", payment.id, new Date().toISOString(), orderId)
      .run();

    console.log(`Order ${orderId} marked as confirmed`);
  } catch (error) {
    console.error("Error handling payment created:", error);
  }
}

async function handlePaymentUpdated(payment: any, db: D1Database) {
  console.log("Payment updated:", payment.id, payment.status);

  try {
    const orderId = payment.reference_id || payment.order_id;
    if (!orderId) {
      console.error("No order ID found in payment");
      return;
    }

    let orderStatus = "pending";

    switch (payment.status) {
      case "COMPLETED":
        orderStatus = "paid";
        break;
      case "FAILED":
      case "CANCELED":
        orderStatus = "failed";
        break;
      case "APPROVED":
        orderStatus = "confirmed";
        break;
      default:
        orderStatus = "pending";
    }

    // Update order status
    await db
      .prepare(
        `UPDATE orders 
         SET status = ?, 
             updated_at = ?,
             notes = ?
         WHERE id = ?`,
      )
      .bind(
        orderStatus,
        new Date().toISOString(),
        `Square payment ${payment.status}`,
        orderId,
      )
      .run();

    console.log(`Order ${orderId} status updated to ${orderStatus}`);
  } catch (error) {
    console.error("Error handling payment updated:", error);
  }
}

async function handleRefundCreated(refund: any, db: D1Database) {
  console.log("Refund created:", refund.id);

  try {
    const paymentId = refund.payment_id;

    // Find order by payment ID
    const order = await db
      .prepare("SELECT * FROM orders WHERE tx_hash = ?")
      .bind(paymentId)
      .first();

    if (!order) {
      console.error("No order found for payment ID:", paymentId);
      return;
    }

    // Update order status to refunded
    await db
      .prepare(
        `UPDATE orders 
         SET status = ?, 
             updated_at = ?,
             notes = ?
         WHERE id = ?`,
      )
      .bind(
        "refunded",
        new Date().toISOString(),
        `Square refund ${refund.id} - Amount: ${refund.amount_money?.amount || 0}`,
        order.id,
      )
      .run();

    console.log(`Order ${order.id} marked as refunded`);
  } catch (error) {
    console.error("Error handling refund created:", error);
  }
}

async function handleRefundUpdated(refund: any, db: D1Database) {
  console.log("Refund updated:", refund.id, refund.status);

  try {
    const paymentId = refund.payment_id;

    // Find order by payment ID
    const order = await db
      .prepare("SELECT * FROM orders WHERE tx_hash = ?")
      .bind(paymentId)
      .first();

    if (!order) {
      console.error("No order found for payment ID:", paymentId);
      return;
    }

    let orderStatus = order.status;

    switch (refund.status) {
      case "COMPLETED":
        orderStatus = "refunded";
        break;
      case "FAILED":
        orderStatus = order.status; // Keep original status
        break;
      case "PENDING":
        orderStatus = "refund_pending";
        break;
    }

    // Update order status
    await db
      .prepare(
        `UPDATE orders 
         SET status = ?, 
             updated_at = ?,
             notes = ?
         WHERE id = ?`,
      )
      .bind(
        orderStatus,
        new Date().toISOString(),
        `Square refund ${refund.status} - ${refund.id}`,
        order.id,
      )
      .run();

    console.log(`Order ${order.id} refund status updated to ${orderStatus}`);
  } catch (error) {
    console.error("Error handling refund updated:", error);
  }
}
