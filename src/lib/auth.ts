import type { APIContext } from "astro";
import { Lucia } from "lucia";
import { GitHub } from "arctic";
import { checkAdminRateLimit, checkAuthRateLimit } from "./rate-limiter";

// D1 Database adapter for Lucia
class D1Adapter {
  private db: D1Database;

  constructor(db: D1Database) {
    this.db = db;
  }

  async getSession(sessionId: string) {
    const result = await this.db
      .prepare("SELECT * FROM sessions WHERE id = ?")
      .bind(sessionId)
      .first();

    if (!result) return null;

    return {
      id: result.id as string,
      userId: result.user_id as string,
      expiresAt: new Date(result.expires_at as string),
      ...result,
    };
  }

  async setSession(session: any) {
    await this.db
      .prepare(
        "INSERT OR REPLACE INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)",
      )
      .bind(session.id, session.userId, session.expiresAt.toISOString())
      .run();
  }

  async deleteSession(sessionId: string) {
    await this.db
      .prepare("DELETE FROM sessions WHERE id = ?")
      .bind(sessionId)
      .run();
  }

  async deleteUserSessions(userId: string) {
    await this.db
      .prepare("DELETE FROM sessions WHERE user_id = ?")
      .bind(userId)
      .run();
  }

  async updateSessionExpiration(sessionId: string, expiresAt: Date) {
    await this.db
      .prepare("UPDATE sessions SET expires_at = ? WHERE id = ?")
      .bind(expiresAt.toISOString(), sessionId)
      .run();
  }
}

export function createAuth(db: D1Database) {
  const adapter = new D1Adapter(db);

  return new Lucia(adapter, {
    sessionCookie: {
      attributes: {
        secure: import.meta.env.MODE === "production",
      },
    },
    getUserAttributes: (attributes) => ({
      githubId: attributes.github_id,
      email: attributes.email,
    }),
  });
}

export const githubAuth = new GitHub(
  import.meta.env.GITHUB_CLIENT_ID || "",
  import.meta.env.GITHUB_CLIENT_SECRET || "",
);

// Types for RBAC system
export interface Role {
  id: string;
  name: string;
  description: string;
  is_system: boolean;
}

export interface Permission {
  id: string;
  name: string;
  description: string;
  resource: string;
  action: string;
}

export interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  resource: string;
  resource_id?: string;
  details?: string;
  ip_address?: string;
  user_agent?: string;
  created_at: Date;
}

// Get user roles from database
export async function getUserRoles(
  db: D1Database,
  userId: string,
): Promise<Role[]> {
  const result = await db
    .prepare(
      `
      SELECT r.id, r.name, r.description, r.is_system
      FROM roles r
      INNER JOIN user_roles ur ON r.id = ur.role_id
      WHERE ur.user_id = ? AND (ur.expires_at IS NULL OR ur.expires_at > datetime('now'))
    `,
    )
    .bind(userId)
    .all();

  return result.results as Role[];
}

// Get user permissions from database
export async function getUserPermissions(
  db: D1Database,
  userId: string,
): Promise<Permission[]> {
  const result = await db
    .prepare(
      `
      SELECT DISTINCT p.id, p.name, p.description, p.resource, p.action
      FROM permissions p
      INNER JOIN role_permissions rp ON p.id = rp.permission_id
      INNER JOIN user_roles ur ON rp.role_id = ur.role_id
      WHERE ur.user_id = ? AND (ur.expires_at IS NULL OR ur.expires_at > datetime('now'))
    `,
    )
    .bind(userId)
    .all();

  return result.results as Permission[];
}

// Check if user has a specific permission
export async function hasPermission(
  db: D1Database,
  userId: string,
  permission: string,
): Promise<boolean> {
  const result = await db
    .prepare(
      `
      SELECT 1
      FROM permissions p
      INNER JOIN role_permissions rp ON p.id = rp.permission_id
      INNER JOIN user_roles ur ON rp.role_id = ur.role_id
      WHERE ur.user_id = ? AND p.name = ? AND (ur.expires_at IS NULL OR ur.expires_at > datetime('now'))
      LIMIT 1
    `,
    )
    .bind(userId, permission)
    .first();

  return !!result;
}

// Check if user has any admin role
export async function isAdminUser(db: D1Database, user: any): Promise<boolean> {
  if (!user) return false;

  const roles = await getUserRoles(db, user.id);
  return roles.length > 0;
}

// Check if user has super admin role
export async function isSuperAdmin(
  db: D1Database,
  userId: string,
): Promise<boolean> {
  const result = await db
    .prepare(
      `
      SELECT 1
      FROM user_roles ur
      INNER JOIN roles r ON ur.role_id = r.id
      WHERE ur.user_id = ? AND r.id = 'role_super_admin' AND (ur.expires_at IS NULL OR ur.expires_at > datetime('now'))
      LIMIT 1
    `,
    )
    .bind(userId)
    .first();

  return !!result;
}

// Log admin action for audit trail
export async function logAuditAction(
  db: D1Database,
  userId: string,
  action: string,
  resource: string,
  resourceId?: string,
  details?: any,
  request?: Request,
): Promise<void> {
  const auditId = crypto.randomUUID();
  const ipAddress =
    request?.headers.get("CF-Connecting-IP") ||
    request?.headers.get("X-Forwarded-For") ||
    request?.headers.get("X-Real-IP") ||
    "unknown";
  const userAgent = request?.headers.get("User-Agent") || "unknown";

  await db
    .prepare(
      `
      INSERT INTO audit_logs (id, user_id, action, resource, resource_id, details, ip_address, user_agent)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `,
    )
    .bind(
      auditId,
      userId,
      action,
      resource,
      resourceId,
      details ? JSON.stringify(details) : null,
      ipAddress,
      userAgent,
    )
    .run();
}

// Assign role to user
export async function assignRole(
  db: D1Database,
  userId: string,
  roleId: string,
  grantedBy: string,
  expiresAt?: Date,
): Promise<void> {
  await db
    .prepare(
      `
      INSERT OR REPLACE INTO user_roles (user_id, role_id, granted_by, expires_at)
      VALUES (?, ?, ?, ?)
    `,
    )
    .bind(userId, roleId, grantedBy, expiresAt?.toISOString() || null)
    .run();
}

// Remove role from user
export async function removeRole(
  db: D1Database,
  userId: string,
  roleId: string,
): Promise<void> {
  await db
    .prepare(`DELETE FROM user_roles WHERE user_id = ? AND role_id = ?`)
    .bind(userId, roleId)
    .run();
}

// Get all roles
export async function getAllRoles(db: D1Database): Promise<Role[]> {
  const result = await db
    .prepare(`SELECT id, name, description, is_system FROM roles ORDER BY name`)
    .all();

  return result.results as Role[];
}

// Get all permissions
export async function getAllPermissions(db: D1Database): Promise<Permission[]> {
  const result = await db
    .prepare(
      `SELECT id, name, description, resource, action FROM permissions ORDER BY resource, action`,
    )
    .all();

  return result.results as Permission[];
}

export async function requireUser(context: APIContext) {
  const db = context.locals.runtime.env.DB as D1Database;
  const auth = createAuth(db);

  const sessionId = context.cookies.get(auth.sessionCookieName)?.value ?? null;

  if (!sessionId) {
    return context.redirect("/admin/login");
  }

  const { session, user } = await auth.validateSession(sessionId);

  if (!session) {
    return context.redirect("/admin/login");
  }

  return user;
}

export async function requireAdmin(context: APIContext) {
  const user = await requireUser(context);
  if (user instanceof Response) return user; // Redirect response

  const db = context.locals.runtime.env.DB as D1Database;
  const isAdmin = await isAdminUser(db, user);

  if (!isAdmin) {
    return context.redirect("/admin/login?error=unauthorized");
  }

  return user;
}

// New permission-based authorization functions
export async function requirePermission(
  context: APIContext,
  permission: string,
) {
  // Check rate limit first
  const rateLimitResponse = checkAdminRateLimit(context.request);
  if (rateLimitResponse) return rateLimitResponse;

  const user = await requireUser(context);
  if (user instanceof Response) return user; // Redirect response

  const db = context.locals.runtime.env.DB as D1Database;
  const hasPermissionResult = await hasPermission(db, user.id, permission);

  if (!hasPermissionResult) {
    return context.redirect("/admin/login?error=insufficient_permissions");
  }

  return user;
}

export async function requireSuperAdmin(context: APIContext) {
  const user = await requireUser(context);
  if (user instanceof Response) return user; // Redirect response

  const db = context.locals.runtime.env.DB as D1Database;
  const isSuperAdminResult = await isSuperAdmin(db, user.id);

  if (!isSuperAdminResult) {
    return context.redirect("/admin/login?error=super_admin_required");
  }

  return user;
}

// Helper function to check permission and return user with audit logging
export async function requirePermissionWithAudit(
  context: APIContext,
  permission: string,
  action: string,
  resource: string,
  resourceId?: string,
) {
  // Check rate limit first
  const rateLimitResponse = checkAdminRateLimit(context.request);
  if (rateLimitResponse) return rateLimitResponse;

  const user = await requirePermission(context, permission);
  if (user instanceof Response) return user; // Redirect response

  const db = context.locals.runtime.env.DB as D1Database;

  // Log the action
  await logAuditAction(
    db,
    user.id,
    action,
    resource,
    resourceId,
    { permission, endpoint: context.url.pathname },
    context.request,
  );

  return user;
}

// Enhanced user context with roles and permissions
export interface UserWithRoles {
  id: string;
  email: string;
  githubId: string;
  roles: Role[];
  permissions: Permission[];
  isSuperAdmin: boolean;
}

export async function getUserWithRoles(
  context: APIContext,
): Promise<UserWithRoles | Response> {
  const user = await requireUser(context);
  if (user instanceof Response) return user; // Redirect response

  const db = context.locals.runtime.env.DB as D1Database;
  const roles = await getUserRoles(db, user.id);
  const permissions = await getUserPermissions(db, user.id);
  const isSuperAdminResult = await isSuperAdmin(db, user.id);

  return {
    id: user.id,
    email: user.email,
    githubId: user.githubId,
    roles,
    permissions,
    isSuperAdmin: isSuperAdminResult,
  };
}
