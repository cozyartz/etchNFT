import type { APIRoute } from "astro";

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const body = await request.json();
    const { orderId, reason, refundAmount, adminKey } = body;

    // Verify admin access
    if (!adminKey || adminKey !== import.meta.env.ADMIN_API_KEY) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

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

    // Check if order is eligible for refund
    const eligibleStatuses = ["paid", "confirmed", "in_production", "failed"];
    if (!eligibleStatuses.includes(order.status)) {
      return new Response(
        JSON.stringify({
          error: `Order with status '${order.status}' is not eligible for refund`,
          currentStatus: order.status,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Default refund amount to full order amount if not specified
    const finalRefundAmount = refundAmount || order.price_usd;

    let refundResult = null;

    try {
      // Process refund based on payment method
      if (order.payment_method === "card" && order.tx_hash) {
        refundResult = await processSquareRefund(
          order,
          finalRefundAmount,
          reason,
        );
      } else if (order.payment_method === "web3") {
        refundResult = await processWeb3Refund(
          order,
          finalRefundAmount,
          reason,
        );
      } else {
        refundResult = {
          type: "manual",
          amount: finalRefundAmount,
          method: "manual_processing",
          note: "Manual refund initiated",
        };
      }
    } catch (error) {
      console.error("Refund processing error:", error);
      refundResult = {
        type: "failed",
        amount: finalRefundAmount,
        error: error.message,
        note: "Refund processing failed",
      };
    }

    // Update order status
    const now = new Date().toISOString();
    const newStatus =
      refundResult.type === "failed" ? "refund_failed" : "refunded";

    await db
      .prepare(
        `UPDATE orders 
         SET status = ?, 
             updated_at = ?,
             notes = ?
         WHERE id = ?`,
      )
      .bind(
        newStatus,
        now,
        `Admin refund: ${reason || "No reason provided"}. Amount: $${finalRefundAmount}. Details: ${JSON.stringify(refundResult)}`,
        orderId,
      )
      .run();

    // Log refund for audit trail
    await db
      .prepare(
        `INSERT INTO admin_refunds (
          order_id, refund_amount, reason, refund_details, 
          processed_at, processed_by
        ) VALUES (?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        orderId,
        finalRefundAmount,
        reason || "Admin initiated refund",
        JSON.stringify(refundResult),
        now,
        "admin_api",
      )
      .run()
      .catch((err) => {
        // Create table if it doesn't exist
        return db
          .exec(
            `
          CREATE TABLE IF NOT EXISTS admin_refunds (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            order_id TEXT NOT NULL,
            refund_amount REAL NOT NULL,
            reason TEXT,
            refund_details TEXT,
            processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            processed_by TEXT
          )
        `,
          )
          .then(() => {
            return db
              .prepare(
                `INSERT INTO admin_refunds (
                order_id, refund_amount, reason, refund_details, 
                processed_at, processed_by
              ) VALUES (?, ?, ?, ?, ?, ?)`,
              )
              .bind(
                orderId,
                finalRefundAmount,
                reason || "Admin initiated refund",
                JSON.stringify(refundResult),
                now,
                "admin_api",
              )
              .run();
          });
      });

    return new Response(
      JSON.stringify({
        success: refundResult.type !== "failed",
        message:
          refundResult.type === "failed"
            ? "Refund processing failed"
            : "Refund processed successfully",
        orderId,
        refundAmount: finalRefundAmount,
        refundDetails: refundResult,
        newStatus,
      }),
      {
        status: refundResult.type === "failed" ? 500 : 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Admin refund error:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to process refund",
        details: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
};

async function processSquareRefund(order: any, amount: number, reason: string) {
  // This would integrate with Square's refund API
  // Placeholder implementation
  const squareAccessToken = import.meta.env.SQUARE_ACCESS_TOKEN;

  if (!squareAccessToken) {
    throw new Error("Square access token not configured");
  }

  // Square refund API call would go here
  // For now, return a placeholder response
  return {
    type: "square",
    amount: amount,
    method: "square_api",
    paymentId: order.tx_hash,
    refundId: `refund_${Date.now()}`,
    status: "pending",
    note: `Square refund of $${amount} initiated. Reason: ${reason}`,
  };
}

async function processWeb3Refund(order: any, amount: number, reason: string) {
  // For Web3 orders, the smart contract should handle refunds
  // This would typically involve calling the contract's refund function

  if (!order.chain_id || !order.web3_signature) {
    throw new Error("Missing Web3 order information");
  }

  // Smart contract refund would be handled here
  // For now, return manual processing
  return {
    type: "web3_manual",
    amount: amount,
    method: "manual_crypto_refund",
    walletAddress: order.wallet_address,
    chainId: order.chain_id,
    note: `Manual crypto refund of $${amount} to ${order.wallet_address}. Reason: ${reason}`,
  };
}

// GET endpoint to check refund eligibility
export const GET: APIRoute = async ({ url, locals }) => {
  try {
    const orderId = url.searchParams.get("orderId");
    const adminKey = url.searchParams.get("adminKey");

    if (!adminKey || adminKey !== import.meta.env.ADMIN_API_KEY) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

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

    const eligibleStatuses = ["paid", "confirmed", "in_production", "failed"];
    const isEligible = eligibleStatuses.includes(order.status);

    // Check if already refunded
    const alreadyRefunded = ["refunded", "cancelled", "refund_failed"].includes(
      order.status,
    );

    return new Response(
      JSON.stringify({
        orderId,
        eligible: isEligible,
        currentStatus: order.status,
        alreadyRefunded,
        maxRefundAmount: order.price_usd,
        paymentMethod: order.payment_method,
        orderDate: order.created_at,
        lastUpdated: order.updated_at,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Refund eligibility check error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to check refund eligibility" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
};
