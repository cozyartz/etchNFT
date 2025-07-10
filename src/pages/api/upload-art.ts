import type { APIRoute } from "astro";
import { randomUUID } from "crypto";

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const name = formData.get("name") as string;
    const description = formData.get("description") as string;
    const userEmail = formData.get("userEmail") as string;
    const mintTxHash = formData.get("mintTxHash") as string;
    const mintSignature = formData.get("mintSignature") as string;
    const walletAddress = formData.get("walletAddress") as string;

    if (!file || !name || !userEmail) {
      return new Response(
        JSON.stringify({
          error: "Missing required fields: file, name, userEmail",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Validate minting requirement
    if (!mintTxHash && !mintSignature) {
      return new Response(
        JSON.stringify({
          error: "Minting required. Please complete payment to upload artwork.",
        }),
        {
          status: 402,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Validate file type
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/gif",
      "image/webp",
    ];
    if (!allowedTypes.includes(file.type)) {
      return new Response(
        JSON.stringify({
          error:
            "Invalid file type. Please upload JPEG, PNG, GIF, or WebP images.",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return new Response(
        JSON.stringify({ error: "File size too large. Maximum 10MB allowed." }),
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

    // Generate unique ID for the upload
    const uploadId = randomUUID();
    const now = new Date().toISOString();

    // Convert file to base64 for storage (in production, use proper file storage like R2)
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64 = buffer.toString("base64");
    const dataUrl = `data:${file.type};base64,${base64}`;

    // Store upload in database
    try {
      await db
        .prepare(
          `
        INSERT INTO custom_uploads (
          id, user_email, name, description, original_filename, 
          file_type, file_size, image_data_url, status, 
          created_at, updated_at, mint_tx_hash, mint_signature, 
          wallet_address
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
        )
        .bind(
          uploadId,
          userEmail,
          name,
          description || null,
          file.name,
          file.type,
          file.size,
          dataUrl,
          "uploaded",
          now,
          now,
          mintTxHash || null,
          mintSignature || null,
          walletAddress || null,
        )
        .run();

      return new Response(
        JSON.stringify({
          success: true,
          upload_id: uploadId,
          message: "File uploaded successfully",
          data: {
            id: uploadId,
            name,
            description,
            file_type: file.type,
            file_size: file.size,
            image_url: dataUrl,
            status: "uploaded",
            created_at: now,
            mint_tx_hash: mintTxHash,
            wallet_address: walletAddress,
          },
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      );
    } catch (dbError) {
      console.error("Database error:", dbError);
      return new Response(
        JSON.stringify({ error: "Failed to save upload to database" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      );
    }
  } catch (error) {
    console.error("Upload error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

export const GET: APIRoute = async ({ request, locals }) => {
  try {
    const url = new URL(request.url);
    const userEmail = url.searchParams.get("userEmail");

    if (!userEmail) {
      return new Response(
        JSON.stringify({ error: "userEmail parameter is required" }),
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

    const result = await db
      .prepare(
        `
      SELECT id, user_email, name, description, original_filename, 
             file_type, file_size, image_data_url, status, 
             created_at, updated_at, mint_tx_hash, wallet_address
      FROM custom_uploads 
      WHERE user_email = ? 
      ORDER BY created_at DESC
    `,
      )
      .bind(userEmail)
      .all();

    return new Response(
      JSON.stringify({
        success: true,
        uploads: result.results,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Get uploads error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
