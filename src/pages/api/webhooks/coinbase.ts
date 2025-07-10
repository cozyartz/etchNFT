import type { APIRoute } from "astro";
import crypto from "crypto";

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const body = await request.text();
    const signature = request.headers.get("x-cc-webhook-signature");

    if (!signature) {
      return new Response("Missing signature", { status: 400 });
    }

    // Verify webhook signature
    const webhookSecret = import.meta.env.COINBASE_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error("Coinbase webhook secret not configured");
      return new Response("Webhook not configured", { status: 500 });
    }

    const hash = crypto
      .createHmac("sha256", webhookSecret)
      .update(body)
      .digest("hex");

    if (hash !== signature) {
      console.error("Invalid webhook signature");
      return new Response("Invalid signature", { status: 401 });
    }

    const event = JSON.parse(body);
    console.log("Coinbase webhook received:", event.type);

    const db = locals.runtime?.env?.DB as D1Database;
    if (!db) {
      return new Response("Database not available", { status: 500 });
    }

    // Handle different event types
    switch (event.type) {
      case "charge:created":
        await handleChargeCreated(event.data, db);
        break;

      case "charge:confirmed":
        await handleChargeConfirmed(event.data, db);
        break;

      case "charge:failed":
        await handleChargeFailed(event.data, db);
        break;

      case "charge:delayed":
        await handleChargeDelayed(event.data, db);
        break;

      case "charge:pending":
        await handleChargePending(event.data, db);
        break;

      case "charge:resolved":
        await handleChargeResolved(event.data, db);
        break;

      default:
        console.log(`Unhandled Coinbase webhook event: ${event.type}`);
    }

    return new Response("OK", { status: 200 });
  } catch (error) {
    console.error("Coinbase webhook error:", error);
    return new Response("Internal server error", { status: 500 });
  }
};

async function handleChargeCreated(charge: any, db: D1Database) {
  console.log("Charge created:", charge.id);

  try {
    // The charge metadata should contain our order ID
    const orderId = charge.metadata?.order_id;
    if (!orderId) {
      console.error("No order ID found in charge metadata");
      return;
    }

    // Update order with Coinbase charge info
    await db
      .prepare(
        `UPDATE orders 
         SET tx_hash = ?,
             status = ?,
             updated_at = ?,
             notes = ?
         WHERE id = ?`,
      )
      .bind(
        charge.id,
        "pending",
        new Date().toISOString(),
        `Coinbase charge created - Amount: ${charge.pricing?.local?.amount || 0} ${charge.pricing?.local?.currency || "USD"}`,
        orderId,
      )
      .run();

    console.log(`Order ${orderId} updated with Coinbase charge ${charge.id}`);
  } catch (error) {
    console.error("Error handling charge created:", error);
  }
}

async function handleChargeConfirmed(charge: any, db: D1Database) {
  console.log("Charge confirmed:", charge.id);

  try {
    const orderId = charge.metadata?.order_id;
    if (!orderId) {
      console.error("No order ID found in charge metadata");
      return;
    }

    // Update order status to confirmed/paid
    await db
      .prepare(
        `UPDATE orders 
         SET status = ?,
             updated_at = ?,
             notes = ?
         WHERE tx_hash = ? OR id = ?`,
      )
      .bind(
        "paid",
        new Date().toISOString(),
        `Coinbase payment confirmed - Hash: ${charge.payments?.[0]?.transaction_id || "N/A"}`,
        charge.id,
        orderId,
      )
      .run();

    console.log(`Order ${orderId} marked as paid - Coinbase charge confirmed`);
  } catch (error) {
    console.error("Error handling charge confirmed:", error);
  }
}

async function handleChargeFailed(charge: any, db: D1Database) {
  console.log("Charge failed:", charge.id);

  try {
    const orderId = charge.metadata?.order_id;
    if (!orderId) {
      console.error("No order ID found in charge metadata");
      return;
    }

    // Update order status to failed
    await db
      .prepare(
        `UPDATE orders 
         SET status = ?,
             updated_at = ?,
             notes = ?
         WHERE tx_hash = ? OR id = ?`,
      )
      .bind(
        "failed",
        new Date().toISOString(),
        `Coinbase payment failed - Reason: ${charge.failure_reason || "Unknown"}`,
        charge.id,
        orderId,
      )
      .run();

    console.log(`Order ${orderId} marked as failed`);
  } catch (error) {
    console.error("Error handling charge failed:", error);
  }
}

async function handleChargeDelayed(charge: any, db: D1Database) {
  console.log("Charge delayed:", charge.id);

  try {
    const orderId = charge.metadata?.order_id;
    if (!orderId) {
      console.error("No order ID found in charge metadata");
      return;
    }

    // Update order status to pending with note
    await db
      .prepare(
        `UPDATE orders 
         SET status = ?,
             updated_at = ?,
             notes = ?
         WHERE tx_hash = ? OR id = ?`,
      )
      .bind(
        "pending",
        new Date().toISOString(),
        "Coinbase payment delayed - waiting for network confirmation",
        charge.id,
        orderId,
      )
      .run();

    console.log(`Order ${orderId} marked as delayed`);
  } catch (error) {
    console.error("Error handling charge delayed:", error);
  }
}

async function handleChargePending(charge: any, db: D1Database) {
  console.log("Charge pending:", charge.id);

  try {
    const orderId = charge.metadata?.order_id;
    if (!orderId) {
      console.error("No order ID found in charge metadata");
      return;
    }

    // Update order status to pending
    await db
      .prepare(
        `UPDATE orders 
         SET status = ?,
             updated_at = ?,
             notes = ?
         WHERE tx_hash = ? OR id = ?`,
      )
      .bind(
        "pending",
        new Date().toISOString(),
        "Coinbase payment pending - waiting for confirmation",
        charge.id,
        orderId,
      )
      .run();

    console.log(`Order ${orderId} marked as pending`);
  } catch (error) {
    console.error("Error handling charge pending:", error);
  }
}

async function handleChargeResolved(charge: any, db: D1Database) {
  console.log("Charge resolved:", charge.id);

  try {
    const orderId = charge.metadata?.order_id;
    if (!orderId) {
      console.error("No order ID found in charge metadata");
      return;
    }

    // Determine final status based on resolution
    let finalStatus = "paid";
    let statusNote = "Coinbase payment resolved successfully";

    if (charge.payments && charge.payments.length > 0) {
      const payment = charge.payments[0];
      if (payment.status === "CONFIRMED") {
        finalStatus = "paid";
        statusNote = `Coinbase payment confirmed - TX: ${payment.transaction_id}`;
      }
    }

    // Update order status
    await db
      .prepare(
        `UPDATE orders 
         SET status = ?,
             updated_at = ?,
             notes = ?
         WHERE tx_hash = ? OR id = ?`,
      )
      .bind(
        finalStatus,
        new Date().toISOString(),
        statusNote,
        charge.id,
        orderId,
      )
      .run();

    console.log(`Order ${orderId} resolved with status: ${finalStatus}`);
  } catch (error) {
    console.error("Error handling charge resolved:", error);
  }
}
