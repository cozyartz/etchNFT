import type { APIRoute } from "astro";
import { requirePermissionWithAudit } from "../../../lib/auth";
import { getDatabase } from "../../../lib/db";

export const prerender = false;

export const GET: APIRoute = async (context) => {
  const user = await requirePermissionWithAudit(
    context,
    "system.audit",
    "view_audit_logs",
    "audit_logs",
  );
  if (user instanceof Response) return user;

  try {
    const db = getDatabase(context);
    const url = new URL(context.request.url);
    const limit = parseInt(url.searchParams.get("limit") || "50");
    const offset = parseInt(url.searchParams.get("offset") || "0");
    const userId = url.searchParams.get("userId");
    const action = url.searchParams.get("action");
    const resource = url.searchParams.get("resource");

    let query = `
      SELECT 
        al.id,
        al.user_id,
        al.action,
        al.resource,
        al.resource_id,
        al.details,
        al.ip_address,
        al.user_agent,
        al.created_at,
        u.email as user_email,
        u.github_id as user_github_id
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE 1=1
    `;

    const params: any[] = [];

    if (userId) {
      query += " AND al.user_id = ?";
      params.push(userId);
    }

    if (action) {
      query += " AND al.action = ?";
      params.push(action);
    }

    if (resource) {
      query += " AND al.resource = ?";
      params.push(resource);
    }

    query += " ORDER BY al.created_at DESC LIMIT ? OFFSET ?";
    params.push(limit, offset);

    const logs = await db
      .prepare(query)
      .bind(...params)
      .all();

    // Get total count for pagination
    let countQuery = "SELECT COUNT(*) as total FROM audit_logs WHERE 1=1";
    const countParams: any[] = [];

    if (userId) {
      countQuery += " AND user_id = ?";
      countParams.push(userId);
    }

    if (action) {
      countQuery += " AND action = ?";
      countParams.push(action);
    }

    if (resource) {
      countQuery += " AND resource = ?";
      countParams.push(resource);
    }

    const totalResult = await db
      .prepare(countQuery)
      .bind(...countParams)
      .first();
    const total = totalResult?.total || 0;

    return new Response(
      JSON.stringify({
        logs: logs.results,
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total,
        },
      }),
      {
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Error fetching audit logs:", error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch audit logs" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
};
