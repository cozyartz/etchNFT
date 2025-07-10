import type { APIRoute } from "astro";
import { requirePermissionWithAudit } from "../../../../lib/auth";
import { getDatabase } from "../../../../lib/db";

export const prerender = false;

export const GET: APIRoute = async (context) => {
  const user = await requirePermissionWithAudit(
    context,
    "roles.read",
    "view_role",
    "roles",
    context.params.id,
  );
  if (user instanceof Response) return user;

  try {
    const db = getDatabase(context);
    const roleId = context.params.id;

    // Get role details
    const role = await db
      .prepare(
        "SELECT id, name, description, is_system FROM roles WHERE id = ?",
      )
      .bind(roleId)
      .first();

    if (!role) {
      return new Response(JSON.stringify({ error: "Role not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get role permissions
    const permissions = await db
      .prepare(
        `
        SELECT p.id, p.name, p.description, p.resource, p.action
        FROM permissions p
        INNER JOIN role_permissions rp ON p.id = rp.permission_id
        WHERE rp.role_id = ?
      `,
      )
      .bind(roleId)
      .all();

    return new Response(
      JSON.stringify({ role, permissions: permissions.results }),
      {
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Error fetching role:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch role" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

export const PUT: APIRoute = async (context) => {
  const user = await requirePermissionWithAudit(
    context,
    "roles.update",
    "update_role",
    "roles",
    context.params.id,
  );
  if (user instanceof Response) return user;

  try {
    const db = getDatabase(context);
    const roleId = context.params.id;
    const { name, description, permissions } = await context.request.json();

    // Check if role exists and is not system role
    const existingRole = await db
      .prepare("SELECT is_system FROM roles WHERE id = ?")
      .bind(roleId)
      .first();

    if (!existingRole) {
      return new Response(JSON.stringify({ error: "Role not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (existingRole.is_system) {
      return new Response(
        JSON.stringify({ error: "Cannot modify system roles" }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Update role
    await db
      .prepare(
        "UPDATE roles SET name = ?, description = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
      )
      .bind(name, description, roleId)
      .run();

    // Update permissions
    if (permissions) {
      // Remove existing permissions
      await db
        .prepare("DELETE FROM role_permissions WHERE role_id = ?")
        .bind(roleId)
        .run();

      // Add new permissions
      for (const permissionId of permissions) {
        await db
          .prepare(
            "INSERT INTO role_permissions (role_id, permission_id) VALUES (?, ?)",
          )
          .bind(roleId, permissionId)
          .run();
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error updating role:", error);
    return new Response(JSON.stringify({ error: "Failed to update role" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

export const DELETE: APIRoute = async (context) => {
  const user = await requirePermissionWithAudit(
    context,
    "roles.delete",
    "delete_role",
    "roles",
    context.params.id,
  );
  if (user instanceof Response) return user;

  try {
    const db = getDatabase(context);
    const roleId = context.params.id;

    // Check if role exists and is not system role
    const existingRole = await db
      .prepare("SELECT is_system FROM roles WHERE id = ?")
      .bind(roleId)
      .first();

    if (!existingRole) {
      return new Response(JSON.stringify({ error: "Role not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (existingRole.is_system) {
      return new Response(
        JSON.stringify({ error: "Cannot delete system roles" }),
        {
          status: 403,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Delete role (cascading deletes will handle role_permissions and user_roles)
    await db.prepare("DELETE FROM roles WHERE id = ?").bind(roleId).run();

    return new Response(JSON.stringify({ success: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error deleting role:", error);
    return new Response(JSON.stringify({ error: "Failed to delete role" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
