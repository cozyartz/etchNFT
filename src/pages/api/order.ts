import type { APIRoute } from "astro";
import { randomUUID } from "crypto";
import { generateCertSVG } from "../../lib/cert";

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const body = await request.json();
    const { form, cart, payment } = body;

    if (!form || !cart || !Array.isArray(cart) || cart.length === 0) {
      return new Response(JSON.stringify({ error: "Invalid payload" }), {
        status: 400,
      });
    }

    const db = locals.runtime.env.DB as D1Database;

    const orderIds = [];

    for (const nft of cart) {
      const id = randomUUID();
      const now = new Date().toISOString();

      // Generate certificate SVG
      const certSVG = generateCertSVG({
        name: nft.name,
        collection: nft.collection_name,
        image_url: nft.image_url,
        token_id: nft.token_id,
      });

      await db
        .prepare(
          `
        INSERT INTO orders (
          id, wallet_address, nft_name, nft_image, collection,
          token_id, contract_address, payment_method, network, tx_hash,
          price_usd, full_name, email, address_line, city, country,
          plaque_svg_url, cert_url, status, email_sent, notes,
          created_at, updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
        )
        .bind(
          id,
          "", // optional wallet address
          nft.name,
          nft.image_url,
          nft.collection_name,
          nft.token_id,
          nft.contract_address,
          payment?.method || "card",
          payment?.provider || "",
          payment?.token || "",
          45.0, // hardcoded price for now
          form.name,
          form.email,
          form.addressLine,
          form.city,
          form.country,
          certSVG,
          `/cert/${id}`,
          "paid", // Mark as paid for card payments
          true,
          `Card payment via Square - ${payment?.method || "card"}`,
          now,
          now,
        )
        .run();

      orderIds.push(id);
    }

    return new Response(
      JSON.stringify({
        success: true,
        order_ids: orderIds,
        message: "Orders created successfully",
      }),
      { status: 200 },
    );
  } catch (err: any) {
    console.error("order.ts error:", err);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
    });
  }
};
