import type { APIRoute } from "astro";
import { requireAdmin } from "../../../lib/auth";
import { getDesignTemplates } from "../../../lib/drops";

export const prerender = false;

export const GET: APIRoute = async ({ request, cookies, locals }) => {
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
    const url = new URL(request.url);
    const category = url.searchParams.get("category");

    const templates = await getDesignTemplates(db, category || undefined);

    return new Response(
      JSON.stringify({
        success: true,
        templates,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "public, max-age=3600", // Cache for 1 hour
        },
      },
    );
  } catch (error) {
    console.error("Error fetching templates:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
