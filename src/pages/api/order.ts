import type { APIRoute } from "astro";
import { randomUUID } from "crypto";
import { generateCertSVG } from "../../lib/cert";
import { processImageForLaser } from "../../lib/image-processing";

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const body = await request.json();
    const { form, cart, payment } = body;

    if (!form || !cart || !Array.isArray(cart) || cart.length === 0) {
      return new Response(JSON.stringify({ error: "Invalid payload" }), {
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

      // Process image for laser engraving and generate SVG
      let plaqueSVG = null;
      try {
        const defaultTemplate = {
          id: "default",
          name: "Default Template",
          template_svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300">
            <rect width="400" height="300" fill="#1a1a1a" stroke="#00ff00" stroke-width="2"/>
            <image href="{{image_url}}" x="50" y="50" width="200" height="200" />
            <text x="275" y="80" fill="#00ff00" font-family="Arial" font-size="16" font-weight="bold">{{nft_name}}</text>
            <text x="275" y="100" fill="#888" font-family="Arial" font-size="12">{{collection_name}}</text>
            <text x="275" y="120" fill="#888" font-family="Arial" font-size="10">Token: {{token_id}}</text>
          </svg>`,
          material: "wood",
          image_max_width: 200,
          image_max_height: 200,
        };

        const processResult = await processImageForLaser(
          nft.image_url,
          defaultTemplate,
          {
            vectorize: true,
            contrast_enhancement: true,
            target_width: 200,
            target_height: 200,
          },
        );

        if (processResult.success) {
          plaqueSVG = processResult.processed_url;
        }
      } catch (error) {
        console.warn(
          "SVG processing failed, continuing without plaque SVG:",
          error,
        );
      }

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
          payment?.method || "paypal",
          payment?.provider || "",
          payment?.token || "",
          29.0, // updated price per NFT
          form.name,
          form.email,
          form.addressLine,
          form.city,
          form.country,
          plaqueSVG,
          `/cert/${id}`,
          "paid", // Mark as paid for PayPal payments
          true,
          `PayPal payment - ${payment?.method || "paypal"}`,
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
