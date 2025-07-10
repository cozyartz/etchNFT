import type { APIRoute } from "astro";
import { requireUser } from "../../../../lib/auth";
import { getDrop, updateDrop, deleteDrop } from "../../../../lib/drops";

export const prerender = false;

export const GET: APIRoute = async ({ params, cookies, locals }) => {
  // Require admin authentication
  const user = await requireUser({ cookies, locals } as any);
  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const db = locals.runtime.env.DB as D1Database;
    const dropId = params.id;

    if (!dropId) {
      return new Response(JSON.stringify({ error: "Drop ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const drop = await getDrop(db, dropId);

    if (!drop) {
      return new Response(JSON.stringify({ error: "Drop not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        drop,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Error fetching drop:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

export const PUT: APIRoute = async ({ params, request, cookies, locals }) => {
  // Require admin authentication
  const user = await requireUser({ cookies, locals } as any);
  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const db = locals.runtime.env.DB as D1Database;
    const dropId = params.id;
    const updates = await request.json();

    if (!dropId) {
      return new Response(JSON.stringify({ error: "Drop ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Verify drop exists
    const existingDrop = await getDrop(db, dropId);
    if (!existingDrop) {
      return new Response(JSON.stringify({ error: "Drop not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Update the drop
    await updateDrop(db, dropId, updates);

    // Return updated drop
    const updatedDrop = await getDrop(db, dropId);

    return new Response(
      JSON.stringify({
        success: true,
        drop: updatedDrop,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Error updating drop:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

export const DELETE: APIRoute = async ({ params, cookies, locals }) => {
  // Require admin authentication
  const user = await requireUser({ cookies, locals } as any);
  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const db = locals.runtime.env.DB as D1Database;
    const dropId = params.id;

    if (!dropId) {
      return new Response(JSON.stringify({ error: "Drop ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Verify drop exists
    const existingDrop = await getDrop(db, dropId);
    if (!existingDrop) {
      return new Response(JSON.stringify({ error: "Drop not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Delete the drop
    await deleteDrop(db, dropId);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Drop deleted successfully",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Error deleting drop:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
