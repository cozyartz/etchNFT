import type { APIRoute } from "astro";
import { sendConfirmationEmail } from "../../lib/email";

export const POST: APIRoute = async ({ request, locals }) => {
  const db = locals.runtime.env.DB as D1Database;

  try {
    const event = await request.json();
    console.log("Coinbase webhook received:", event.type);

    if (event?.type === "charge:confirmed" && event?.data?.metadata?.order_id) {
      const orderId = event.data.metadata.order_id;
      const customerEmail = event.data.metadata.customer_email;
      const paymentInfo = event.data.payments?.[0];

      // Update all orders with this order_id prefix
      const orders = await db
        .prepare(`SELECT * FROM orders WHERE id LIKE ?`)
        .bind(`${orderId}-%`)
        .all();

      if (orders.results.length === 0) {
        console.error(`No orders found for order_id: ${orderId}`);
        return new Response("Order not found", { status: 404 });
      }

      // Update each order with payment confirmation
      for (const order of orders.results) {
        await db
          .prepare(
            `
            UPDATE orders 
            SET status = 'paid', 
                tx_hash = ?, 
                network = ?,
                email_sent = ?,
                updated_at = CURRENT_TIMESTAMP 
            WHERE id = ?
          `,
          )
          .bind(
            paymentInfo?.transaction_id || "",
            paymentInfo?.network || "crypto",
            true,
            order.id,
          )
          .run();
      }

      // Send confirmation email
      if (customerEmail) {
        try {
          await sendConfirmationEmail(customerEmail, orderId);
          console.log(`Confirmation email sent to ${customerEmail}`);
        } catch (emailError) {
          console.error("Failed to send confirmation email:", emailError);
        }
      }

      console.log(
        `Payment confirmed for order ${orderId}, ${orders.results.length} items updated`,
      );
      return new Response(JSON.stringify({ success: true }), { status: 200 });
    }

    // Handle other webhook events
    if (event?.type === "charge:failed" && event?.data?.metadata?.order_id) {
      const orderId = event.data.metadata.order_id;

      // Mark orders as failed
      await db
        .prepare(
          `UPDATE orders SET status = 'failed', updated_at = CURRENT_TIMESTAMP WHERE id LIKE ?`,
        )
        .bind(`${orderId}-%`)
        .run();

      console.log(`Payment failed for order ${orderId}`);
    }

    return new Response("Ignored", { status: 200 });
  } catch (err: any) {
    console.error("Coinbase webhook error:", err);
    return new Response("Error", { status: 500 });
  }
};
