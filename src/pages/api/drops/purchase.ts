import type { APIRoute } from "astro";
import {
  createPurchase,
  getDrop,
  getDropItem,
  updateDropItem,
} from "../../../lib/drops";
import type { PurchaseDropRequest } from "../../../types/drops";

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const db = locals.runtime?.env?.DB as D1Database;

    if (!db) {
      return new Response(
        JSON.stringify({
          error: "Database not available in current environment",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const data: PurchaseDropRequest = await request.json();

    // Validate required fields
    if (
      !data.drop_id ||
      !data.drop_item_id ||
      !data.customer_email ||
      !data.customer_name
    ) {
      return new Response(
        JSON.stringify({
          error:
            "Missing required fields: drop_id, drop_item_id, customer_email, customer_name",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Verify drop exists and is active
    const drop = await getDrop(db, data.drop_id);
    if (!drop) {
      return new Response(JSON.stringify({ error: "Drop not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Check if drop is live
    const now = new Date();
    const isLive =
      drop.is_active &&
      (!drop.launch_date || drop.launch_date <= now) &&
      (!drop.end_date || drop.end_date > now);

    if (!isLive) {
      return new Response(
        JSON.stringify({ error: "Drop is not currently live" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Verify item exists and is available
    const item = await getDropItem(db, data.drop_item_id);
    if (!item) {
      return new Response(JSON.stringify({ error: "Item not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!item.is_available || item.is_sold) {
      return new Response(
        JSON.stringify({ error: "Item is not available for purchase" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Check if item is ready for etching
    if (item.laser_file_status !== "ready") {
      return new Response(
        JSON.stringify({ error: "Item is not ready for etching yet" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Create the purchase
    const purchase = await createPurchase(db, data);

    // Reserve the item (mark as sold for now, will be updated based on payment)
    await updateDropItem(db, data.drop_item_id, {
      is_sold: true,
      reserved_until: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes reservation
    });

    return new Response(
      JSON.stringify({
        success: true,
        purchase,
        message:
          "Purchase created successfully. Complete payment to confirm order.",
      }),
      {
        status: 201,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Error creating purchase:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
