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
