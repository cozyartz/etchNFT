import type { APIRoute } from "astro";
import {
  requirePermissionWithAudit,
  assignRole,
  removeRole,
} from "../../../lib/auth";
import { getDatabase } from "../../../lib/db";

export const prerender = false;

export const GET: APIRoute = async (context) => {
  const user = await requirePermissionWithAudit(
    context,
    "users.read",
    "view_users",
    "users",
  );
  if (user instanceof Response) return user;

  try {
    const db = getDatabase(context);

    // Get all users with their roles
    const users = await db
      .prepare(
        `
        SELECT 
          u.id, 
          u.email, 
          u.github_id, 
          u.status, 
          u.last_login,
          u.created_at,
          GROUP_CONCAT(r.name) as roles
        FROM users u
        LEFT JOIN user_roles ur ON u.id = ur.user_id
        LEFT JOIN roles r ON ur.role_id = r.id
        GROUP BY u.id
        ORDER BY u.created_at DESC
      `,
      )
      .all();

    return new Response(JSON.stringify({ users: users.results }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch users" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

export const POST: APIRoute = async (context) => {
  const user = await requirePermissionWithAudit(
    context,
    "users.create",
    "create_user",
    "users",
  );
  if (user instanceof Response) return user;

  try {
    const db = getDatabase(context);
    const { email, github_id, roles, notes } = await context.request.json();

    if (!email && !github_id) {
      return new Response(
        JSON.stringify({ error: "Email or GitHub ID is required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const userId = crypto.randomUUID();

    // Create user
    await db
      .prepare(
        `
        INSERT INTO users (id, email, github_id, status, created_by, notes)
        VALUES (?, ?, ?, 'active', ?, ?)
      `,
      )
      .bind(userId, email, github_id, user.id, notes || null)
      .run();

    // Assign roles
    if (roles && roles.length > 0) {
      for (const roleId of roles) {
        await assignRole(db, userId, roleId, user.id);
      }
    }

    return new Response(JSON.stringify({ success: true, userId }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error creating user:", error);
    return new Response(JSON.stringify({ error: "Failed to create user" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
