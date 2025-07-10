import type { APIRoute } from "astro";
import { randomUUID } from "crypto";
import { generateCertSVG } from "../../lib/cert";
import { processImageForLaser } from "../../lib/image-processing";

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const body = await request.json();
    const { form, customUpload, payment } = body;

    if (!form || !customUpload) {
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

    // Verify the custom upload exists
    const uploadResult = await db
      .prepare(`SELECT * FROM custom_uploads WHERE id = ?`)
      .bind(customUpload.id)
      .first();

    if (!uploadResult) {
      return new Response(
        JSON.stringify({ error: "Custom upload not found" }),
        {
          status: 404,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const orderId = randomUUID();
    const now = new Date().toISOString();

    // Generate certificate SVG for custom upload
    const certSVG = generateCertSVG({
      name: uploadResult.name,
      collection: "Custom Upload",
      image_url: uploadResult.image_data_url,
      token_id: uploadResult.id,
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
          <text x="275" y="100" fill="#888" font-family="Arial" font-size="12">Custom Artwork</text>
          <text x="275" y="120" fill="#888" font-family="Arial" font-size="10">ID: {{token_id}}</text>
        </svg>`,
        material: "wood",
        image_max_width: 200,
        image_max_height: 200,
      };

      const processResult = await processImageForLaser(
        uploadResult.image_data_url,
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

    // Create order
    await db
      .prepare(
        `
        INSERT INTO orders (
          id, wallet_address, nft_name, nft_image, collection,
          token_id, contract_address, payment_method, network, tx_hash,
          price_usd, full_name, email, address_line, city, country,
          plaque_svg_url, cert_url, status, email_sent, notes,
          source_type, custom_upload_id, created_at, updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      )
      .bind(
        orderId,
        "", // no wallet address for custom uploads
        uploadResult.name,
        uploadResult.image_data_url,
        "Custom Upload",
        uploadResult.id,
        "", // no contract address for custom uploads
        payment?.method || "card",
        payment?.provider || "",
        payment?.token || "",
        45.0, // hardcoded price for now
        form.name,
        form.email,
        form.addressLine,
        form.city,
        form.country,
        plaqueSVG,
        `/cert/${orderId}`,
        "paid", // Mark as paid for card payments
        true,
        `Custom upload order - ${payment?.method || "card"}`,
        "custom", // source_type
        customUpload.id, // custom_upload_id
        now,
        now,
      )
      .run();

    // Update upload status
    await db
      .prepare(`UPDATE custom_uploads SET status = 'ordered' WHERE id = ?`)
      .bind(customUpload.id)
      .run();

    return new Response(
      JSON.stringify({
        success: true,
        order_id: orderId,
        message: "Custom upload order created successfully",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (err: any) {
    console.error("custom-order.ts error:", err);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
