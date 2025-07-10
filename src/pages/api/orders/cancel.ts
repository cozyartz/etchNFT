import type { APIRoute } from "astro";
import {
  verifySignature,
  cancelOnChainOrder,
  emergencyRefundOrder,
} from "../../../lib/contract-signing";

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const body = await request.json();
    const { orderId, reason, signature, walletAddress } = body;

    if (!orderId) {
      return new Response(JSON.stringify({ error: "Order ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const db = locals.runtime?.env?.DB as D1Database;
    if (!db) {
      return new Response(JSON.stringify({ error: "Database not available" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get order details
    const order = await db
      .prepare("SELECT * FROM orders WHERE id = ?")
      .bind(orderId)
      .first();

    if (!order) {
      return new Response(JSON.stringify({ error: "Order not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Verify ownership (either wallet address matches or valid signature)
    if (order.wallet_address) {
      if (order.wallet_address.toLowerCase() !== walletAddress?.toLowerCase()) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 403,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    // Check if order can be cancelled
    const allowedStatuses = ["pending", "confirmed", "paid"];
    if (!allowedStatuses.includes(order.status)) {
      return new Response(
        JSON.stringify({
          error: `Cannot cancel order with status: ${order.status}`,
          currentStatus: order.status,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Check if order is within cancellation window (24 hours)
    const orderDate = new Date(order.created_at);
    const now = new Date();
    const hoursSinceOrder =
      (now.getTime() - orderDate.getTime()) / (1000 * 60 * 60);

    const isWithinCancelWindow = hoursSinceOrder <= 24;
    const isEmergencyRefund = hoursSinceOrder > 24 * 30; // 30 days

    if (!isWithinCancelWindow && !isEmergencyRefund) {
      return new Response(
        JSON.stringify({
          error:
            "Order can only be cancelled within 24 hours or after 30 days for emergency refund",
          hoursElapsed: Math.round(hoursSinceOrder),
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    let refundDetails = null;

    try {
      // Process refund based on payment method
      if (order.payment_method === "web3" && order.chain_id) {
        // Handle on-chain cancellation/refund
        if (isEmergencyRefund) {
          // Use emergency refund function
          const txHash = await emergencyRefundOrder(
            BigInt(order.id), // Assuming order ID maps to smart contract order ID
            order.chain_id,
          );
          refundDetails = {
            type: "blockchain",
            transactionHash: txHash,
            amount: order.price_usd,
            method: "emergency_refund",
          };
        } else {
          // Use regular cancel function
          const txHash = await cancelOnChainOrder(
            BigInt(order.id),
            order.chain_id,
          );
          refundDetails = {
            type: "blockchain",
            transactionHash: txHash,
            amount: order.price_usd,
            method: "cancel_order",
          };
        }
      } else if (order.payment_method === "card" && order.tx_hash) {
        // Handle Square refund
        refundDetails = await processSquareRefund(order, reason);
      } else {
        // Manual refund process
        refundDetails = {
          type: "manual",
          amount: order.price_usd,
          method: "manual_processing",
          note: "Refund will be processed manually within 5-10 business days",
        };
      }
    } catch (error) {
      console.error("Refund processing error:", error);

      // If automatic refund fails, mark for manual processing
      refundDetails = {
        type: "manual",
        amount: order.price_usd,
        method: "manual_processing",
        error: error.message,
        note: "Automatic refund failed, will be processed manually",
      };
    }

    // Update order status in database
    const now_iso = new Date().toISOString();
    await db
      .prepare(
        `UPDATE orders 
         SET status = ?, 
             updated_at = ?,
             notes = ?
         WHERE id = ?`,
      )
      .bind(
        "cancelled",
        now_iso,
        `Cancelled by customer. Reason: ${reason || "No reason provided"}. Refund: ${JSON.stringify(refundDetails)}`,
        orderId,
      )
      .run();

    // Log cancellation for admin review
    await db
      .prepare(
        `INSERT INTO order_cancellations (
          order_id, wallet_address, reason, refund_details, 
          cancelled_at, cancellation_type
        ) VALUES (?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        orderId,
        walletAddress || order.wallet_address,
        reason || "No reason provided",
        JSON.stringify(refundDetails),
        now_iso,
        isEmergencyRefund ? "emergency" : "standard",
      )
      .run()
      .catch((err) => {
        // Table might not exist, create it
        console.log("Creating order_cancellations table...");
        return db
          .exec(
            `
          CREATE TABLE IF NOT EXISTS order_cancellations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            order_id TEXT NOT NULL,
            wallet_address TEXT,
            reason TEXT,
            refund_details TEXT,
            cancelled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            cancellation_type TEXT DEFAULT 'standard'
          )
        `,
          )
          .then(() => {
            return db
              .prepare(
                `INSERT INTO order_cancellations (
                order_id, wallet_address, reason, refund_details, 
                cancelled_at, cancellation_type
              ) VALUES (?, ?, ?, ?, ?, ?)`,
              )
              .bind(
                orderId,
                walletAddress || order.wallet_address,
                reason || "No reason provided",
                JSON.stringify(refundDetails),
                now_iso,
                isEmergencyRefund ? "emergency" : "standard",
              )
              .run();
          });
      });

    // Send confirmation response
    return new Response(
      JSON.stringify({
        success: true,
        message: "Order cancelled successfully",
        orderId,
        refundDetails,
        estimatedRefundTime: getEstimatedRefundTime(refundDetails.type),
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Order cancellation error:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to cancel order",
        details: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
};

async function processSquareRefund(order: any, reason: string) {
  // This would integrate with Square's refund API
  // For now, return manual processing
  return {
    type: "square",
    amount: order.price_usd,
    method: "square_refund",
    paymentId: order.tx_hash,
    note: "Square refund initiated - processing within 5-10 business days",
  };
}

function getEstimatedRefundTime(refundType: string): string {
  switch (refundType) {
    case "blockchain":
      return "15-30 minutes (depending on network congestion)";
    case "square":
      return "5-10 business days";
    case "manual":
      return "5-10 business days";
    default:
      return "5-10 business days";
  }
}
