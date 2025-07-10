import type { APIRoute } from "astro";
import { randomUUID } from "crypto";

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const body = await request.json();
    const { form, cart } = body;

    if (!form || !cart || !Array.isArray(cart) || cart.length === 0) {
      return new Response(JSON.stringify({ error: "Invalid payload" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const db = locals.runtime?.env?.DB as D1Database;
    const coinbaseApiKey = locals.runtime?.env?.COINBASE_COMMERCE_API_KEY;

    if (!db) {
      return new Response(JSON.stringify({ error: "Database not available" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!coinbaseApiKey) {
      console.error("Missing COINBASE_COMMERCE_API_KEY environment variable");
      return new Response(
        JSON.stringify({ error: "Payment service unavailable" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Calculate total price (assuming $45 per NFT)
    const pricePerItem = 45.0;
    const totalAmount = cart.length * pricePerItem;

    // Generate order ID for tracking
    const orderId = randomUUID();
    const now = new Date().toISOString();

    // Create orders in database first
    for (const nft of cart) {
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
          `${orderId}-${nft.token_id}`, // Unique ID per NFT
          "", // wallet address will be filled when payment confirms
          nft.name,
          nft.image_url,
          nft.collection_name,
          nft.token_id,
          nft.contract_address,
          "crypto",
          "coinbase_commerce",
          "", // tx_hash filled on confirmation
          pricePerItem,
          form.name,
          form.email,
          form.addressLine,
          form.city,
          form.country,
          null,
          `/cert/${orderId}-${nft.token_id}`,
          "pending",
          false, // email sent after payment confirmation
          `Crypto payment via Coinbase Commerce`,
          now,
          now,
        )
        .run();
    }

    // Create Coinbase Commerce charge
    const chargeData = {
      name: `EtchNFT Order - ${cart.length} item${cart.length > 1 ? "s" : ""}`,
      description: `Laser-etched physical NFT collectibles: ${cart.map((nft) => nft.name).join(", ")}`,
      pricing_type: "fixed_price",
      local_price: {
        amount: totalAmount.toFixed(2),
        currency: "USD",
      },
      metadata: {
        order_id: orderId,
        customer_email: form.email,
        customer_name: form.name,
        item_count: cart.length,
      },
      redirect_url: `${new URL(request.url).origin}/success?order=${orderId}`,
      cancel_url: `${new URL(request.url).origin}/checkout`,
    };

    const coinbaseResponse = await fetch(
      "https://api.commerce.coinbase.com/charges",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CC-Api-Key": coinbaseApiKey,
          "X-CC-Version": "2018-03-22",
        },
        body: JSON.stringify(chargeData),
      },
    );

    if (!coinbaseResponse.ok) {
      const errorText = await coinbaseResponse.text();
      console.error("Coinbase Commerce API error:", errorText);

      // Clean up pending orders on failure
      for (const nft of cart) {
        await db
          .prepare("DELETE FROM orders WHERE id = ?")
          .bind(`${orderId}-${nft.token_id}`)
          .run();
      }

      return new Response(
        JSON.stringify({ error: "Failed to create crypto payment" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const charge = await coinbaseResponse.json();

    return new Response(
      JSON.stringify({
        checkout_url: charge.data.hosted_url,
        charge_id: charge.data.id,
        order_id: orderId,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (err: any) {
    console.error("Crypto checkout error:", err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
