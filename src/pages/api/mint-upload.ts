import type { APIRoute } from "astro";
import { randomUUID } from "crypto";

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const body = await request.json();
    const { userEmail, amount, paymentMethod, walletAddress } = body;

    if (!userEmail || !amount || !paymentMethod) {
      return new Response(
        JSON.stringify({
          error: "Missing required fields: userEmail, amount, paymentMethod",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const db = locals.runtime?.env?.DB as D1Database;

    if (!db) {
      return new Response(JSON.stringify({ error: "Database not available" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    const mintId = randomUUID();
    const now = new Date().toISOString();

    // Create payment methods for different options
    if (paymentMethod === "crypto") {
      const coinbaseApiKey = locals.runtime?.env?.COINBASE_COMMERCE_API_KEY;

      if (!coinbaseApiKey) {
        return new Response(
          JSON.stringify({ error: "Crypto payment service unavailable" }),
          {
            status: 500,
            headers: { "Content-Type": "application/json" },
          },
        );
      }

      // Create Coinbase Commerce charge for minting
      const chargeData = {
        name: "EtchNFT Upload Minting",
        description: "Minting fee for artwork upload privileges",
        pricing_type: "fixed_price",
        local_price: {
          amount: amount.toString(),
          currency: "USD",
        },
        metadata: {
          mint_id: mintId,
          user_email: userEmail,
          purpose: "upload_mint",
        },
        redirect_url: `${new URL(request.url).origin}/upload?mint=${mintId}`,
        cancel_url: `${new URL(request.url).origin}/upload`,
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
        return new Response(
          JSON.stringify({ error: "Failed to create crypto payment" }),
          {
            status: 500,
            headers: { "Content-Type": "application/json" },
          },
        );
      }

      const charge = await coinbaseResponse.json();

      // Store mint record
      await db
        .prepare(
          `
        INSERT INTO upload_mints (
          id, user_email, amount_usd, payment_method, payment_provider,
          charge_id, status, wallet_address, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
        )
        .bind(
          mintId,
          userEmail,
          amount,
          paymentMethod,
          "coinbase_commerce",
          charge.data.id,
          "pending",
          walletAddress || null,
          now,
          now,
        )
        .run();

      return new Response(
        JSON.stringify({
          success: true,
          mint_id: mintId,
          checkout_url: charge.data.hosted_url,
          charge_id: charge.data.id,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      );
    } else if (paymentMethod === "web3") {
      // For web3 payments, create a pending mint that will be completed with signature
      await db
        .prepare(
          `
        INSERT INTO upload_mints (
          id, user_email, amount_usd, payment_method, payment_provider,
          status, wallet_address, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
        )
        .bind(
          mintId,
          userEmail,
          amount,
          paymentMethod,
          "web3_signature",
          "pending",
          walletAddress || null,
          now,
          now,
        )
        .run();

      return new Response(
        JSON.stringify({
          success: true,
          mint_id: mintId,
          message: "Ready for Web3 signature",
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      );
    } else {
      return new Response(
        JSON.stringify({ error: "Unsupported payment method" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }
  } catch (error) {
    console.error("Mint upload error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

export const GET: APIRoute = async ({ request, locals }) => {
  try {
    const url = new URL(request.url);
    const mintId = url.searchParams.get("mintId");
    const userEmail = url.searchParams.get("userEmail");

    if (!mintId && !userEmail) {
      return new Response(
        JSON.stringify({ error: "mintId or userEmail parameter required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const db = locals.runtime?.env?.DB as D1Database;

    if (!db) {
      return new Response(JSON.stringify({ error: "Database not available" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    let result;
    if (mintId) {
      result = await db
        .prepare(
          `
        SELECT id, user_email, amount_usd, payment_method, payment_provider,
               charge_id, status, wallet_address, tx_hash, created_at, updated_at
        FROM upload_mints 
        WHERE id = ?
      `,
        )
        .bind(mintId)
        .first();
    } else {
      result = await db
        .prepare(
          `
        SELECT id, user_email, amount_usd, payment_method, payment_provider,
               charge_id, status, wallet_address, tx_hash, created_at, updated_at
        FROM upload_mints 
        WHERE user_email = ? AND status = 'completed'
        ORDER BY created_at DESC
        LIMIT 1
      `,
        )
        .bind(userEmail)
        .first();
    }

    if (!result) {
      return new Response(JSON.stringify({ error: "Mint record not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        mint: result,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Get mint error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
