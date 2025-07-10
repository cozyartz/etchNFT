import type { APIRoute } from "astro";
import {
  requirePermissionWithAudit,
  getAllRoles,
  getAllPermissions,
} from "../../../lib/auth";
import { getDatabase } from "../../../lib/db";

export const prerender = false;

export const GET: APIRoute = async (context) => {
  const user = await requirePermissionWithAudit(
    context,
    "roles.read",
    "view_roles",
    "roles",
  );
  if (user instanceof Response) return user;

  try {
    const db = getDatabase(context);
    const roles = await getAllRoles(db);
    const permissions = await getAllPermissions(db);

    return new Response(JSON.stringify({ roles, permissions }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching roles:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch roles" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

export const POST: APIRoute = async (context) => {
  const user = await requirePermissionWithAudit(
    context,
    "roles.create",
    "create_role",
    "roles",
  );
  if (user instanceof Response) return user;

  try {
    const db = getDatabase(context);
    const { name, description, permissions } = await context.request.json();

    if (!name || !description) {
      return new Response(
        JSON.stringify({ error: "Name and description are required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const roleId = `role_${name.toLowerCase().replace(/\s+/g, "_")}`;

    // Create role
    await db
      .prepare(
        "INSERT INTO roles (id, name, description, is_system) VALUES (?, ?, ?, ?)",
      )
      .bind(roleId, name, description, false)
      .run();

    // Assign permissions to role
    if (permissions && permissions.length > 0) {
      for (const permissionId of permissions) {
        await db
          .prepare(
            "INSERT INTO role_permissions (role_id, permission_id) VALUES (?, ?)",
          )
          .bind(roleId, permissionId)
          .run();
      }
    }

    return new Response(JSON.stringify({ success: true, roleId }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error creating role:", error);
    return new Response(JSON.stringify({ error: "Failed to create role" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
