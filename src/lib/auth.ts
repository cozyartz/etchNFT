import type { APIContext } from "astro";
import { Lucia } from "lucia";
import { GitHub } from "arctic";

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

// Admin user configurations
const ADMIN_EMAILS = [
  'cozy2963@gmail.com',
  'andrea@cozyartzmedia.com', 
  'cozy@etchnft.com',
  'amy@etchnft.com'
];

const ADMIN_GITHUB_USERNAMES = [
  'Cozyartz',
  'grammar-nerd'
];

export async function isAdminUser(db: D1Database, user: any): Promise<boolean> {
  if (!user) return false;
  
  // Check if user email is in admin list
  if (user.email && ADMIN_EMAILS.includes(user.email)) {
    return true;
  }
  
  // Check if GitHub username is in admin list
  if (user.githubId && ADMIN_GITHUB_USERNAMES.includes(user.githubId)) {
    return true;
  }
  
  return false;
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
    return context.redirect("/admin/login");
  }
  
  return user;
}
