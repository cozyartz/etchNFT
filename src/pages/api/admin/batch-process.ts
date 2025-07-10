import type { APIRoute } from "astro";
import { requireAdmin } from "../../../lib/auth";
import { processBatchImages } from "../../../lib/image-processing";
import {
  getDropItems,
  updateDropItem,
  getDesignTemplate,
} from "../../../lib/drops";

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies, locals }) => {
  // Require admin authentication
  const user = await requireAdmin({ cookies, locals } as any);
  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const db = locals.runtime.env.DB as D1Database;
    const { drop_id, template_id, options = {} } = await request.json();

    // Validate required fields
    if (!drop_id || !template_id) {
      return new Response(
        JSON.stringify({
          error: "Missing required fields: drop_id, template_id",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Get the design template
    const template = await getDesignTemplate(db, template_id);
    if (!template) {
      return new Response(JSON.stringify({ error: "Template not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get all pending items for this drop
    const allItems = await getDropItems(db, drop_id);
    const pendingItems = allItems.filter(
      (item) => item.laser_file_status === "pending",
    );

    if (pendingItems.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: "No pending items to process",
          results: [],
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Update all items to processing status
    await Promise.all(
      pendingItems.map((item) =>
        updateDropItem(db, item.id, {
          laser_file_status: "processing",
          processing_notes: "Batch processing started...",
        }),
      ),
    );

    // Process all images in batch
    const batchResult = await processBatchImages(
      pendingItems,
      template,
      options,
    );

    // Update items based on results
    const updatePromises = batchResult.results.map(async (result) => {
      if (result.success) {
        await updateDropItem(db, result.item_id, {
          laser_file_url: result.processed_url,
          laser_file_status: "ready",
          processing_notes: "Batch processing completed successfully",
        });
      } else {
        await updateDropItem(db, result.item_id, {
          laser_file_status: "failed",
          processing_notes: result.error || "Batch processing failed",
        });
      }
    });

    await Promise.all(updatePromises);

    const successCount = batchResult.results.filter((r) => r.success).length;
    const failureCount = batchResult.results.filter((r) => !r.success).length;

    return new Response(
      JSON.stringify({
        success: true,
        message: `Batch processing completed. ${successCount} successful, ${failureCount} failed.`,
        results: batchResult.results,
        summary: {
          total: pendingItems.length,
          successful: successCount,
          failed: failureCount,
        },
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Error in batch processing:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
