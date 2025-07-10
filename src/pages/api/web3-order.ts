import type { APIRoute } from "astro";
import { randomUUID } from "crypto";
import { verifySignature } from "../../lib/contract-signing";
import { generateCertSVG } from "../../lib/cert";
import { processImageForLaser } from "../../lib/image-processing";

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const body = await request.json();
    const { form, signature, txHash, chainId, cart } = body;

    // Validate required fields
    if (!form || !signature || !txHash || !chainId || !cart) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
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

    // Verify the signature
    const message = `EtchNFT Order Verification
Order ID: ${signature.orderId}
Customer: ${signature.customerAddress}
Item: ${signature.itemDetails.name}
Token ID: ${signature.itemDetails.tokenId}
Contract: ${signature.itemDetails.contractAddress}
Price: ${signature.itemDetails.price} ETH
Timestamp: ${signature.timestamp}

By signing this message, you confirm your order for a physical etched version of this NFT.`;

    const isValidSignature = await verifySignature(
      message,
      signature.signature,
      signature.customerAddress,
    );

    if (!isValidSignature) {
      return new Response(JSON.stringify({ error: "Invalid signature" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Generate certificate SVG
    const certSVG = generateCertSVG({
      name: cart.name,
      collection: cart.collection_name,
      image_url: cart.image_url,
      token_id: cart.token_id,
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
        cart.image_url,
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

    // Create order in database
    const orderId = randomUUID();
    const now = new Date().toISOString();
    const priceUSD = parseFloat(signature.itemDetails.price) * 1800; // Assuming 1 ETH = $1800

    await db
      .prepare(
        `
      INSERT INTO orders (
        id, wallet_address, nft_name, nft_image, collection,
        token_id, contract_address, payment_method, network, tx_hash,
        price_usd, full_name, email, address_line, city, country,
        plaque_svg_url, cert_url, status, email_sent, notes,
        created_at, updated_at, web3_signature, chain_id
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
      )
      .bind(
        orderId,
        signature.customerAddress,
        cart.name,
        cart.image_url,
        cart.collection_name,
        cart.token_id,
        cart.contract_address,
        "web3",
        `ethereum-${chainId}`,
        txHash,
        priceUSD,
        form.name,
        form.email,
        form.addressLine,
        form.city,
        form.country,
        plaqueSVG,
        `/cert/${orderId}`,
        "confirmed", // Web3 orders are immediately confirmed
        false, // Email will be sent separately
        `Web3 payment on chain ${chainId}. Original order ID: ${signature.orderId}`,
        now,
        now,
        JSON.stringify(signature),
        chainId,
      )
      .run();

    // TODO: Send confirmation email
    // await sendOrderConfirmationEmail(form.email, orderId, cart);

    return new Response(
      JSON.stringify({
        success: true,
        orderId,
        message: "Web3 order created successfully",
        certificateUrl: `/cert/${orderId}`,
      }),
      {
        status: 201,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Web3 order error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
