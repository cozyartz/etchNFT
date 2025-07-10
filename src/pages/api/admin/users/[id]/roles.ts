import type { APIRoute } from "astro";
import {
  requirePermissionWithAudit,
  assignRole,
  removeRole,
} from "../../../../../lib/auth";
import { getDatabase } from "../../../../../lib/db";

export const prerender = false;

export const POST: APIRoute = async (context) => {
  const user = await requirePermissionWithAudit(
    context,
    "roles.assign",
    "assign_role",
    "users",
    context.params.id,
  );
  if (user instanceof Response) return user;

  try {
    const db = getDatabase(context);
    const userId = context.params.id;
    const { roleId, expiresAt } = await context.request.json();

    if (!roleId) {
      return new Response(JSON.stringify({ error: "Role ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Check if user exists
    const userExists = await db
      .prepare("SELECT id FROM users WHERE id = ?")
      .bind(userId)
      .first();

    if (!userExists) {
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Check if role exists
    const roleExists = await db
      .prepare("SELECT id FROM roles WHERE id = ?")
      .bind(roleId)
      .first();

    if (!roleExists) {
      return new Response(JSON.stringify({ error: "Role not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    const expiration = expiresAt ? new Date(expiresAt) : undefined;
    await assignRole(db, userId, roleId, user.id, expiration);

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error assigning role:", error);
    return new Response(JSON.stringify({ error: "Failed to assign role" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

export const DELETE: APIRoute = async (context) => {
  const user = await requirePermissionWithAudit(
    context,
    "roles.assign",
    "remove_role",
    "users",
    context.params.id,
  );
  if (user instanceof Response) return user;

  try {
    const db = getDatabase(context);
    const userId = context.params.id;
    const url = new URL(context.request.url);
    const roleId = url.searchParams.get("roleId");

    if (!roleId) {
      return new Response(JSON.stringify({ error: "Role ID is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    await removeRole(db, userId, roleId);

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error removing role:", error);
    return new Response(JSON.stringify({ error: "Failed to remove role" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
