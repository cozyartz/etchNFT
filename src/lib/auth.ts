import type { APIContext } from 'astro';
import { Lucia } from 'lucia';
import { GitHub } from 'arctic';

// Simple in-memory adapter for now (would need proper database adapter in production)
const adapter = {
  async getSession(sessionId: string) {
    // This would query your database
    return null;
  },
  async setSession(session: any) {
    // This would store in your database
  },
  async deleteSession(sessionId: string) {
    // This would delete from your database
  },
  async deleteUserSessions(userId: string) {
    // This would delete all user sessions
  },
  async updateSessionExpiration(sessionId: string, expiresAt: Date) {
    // This would update session expiration
  }
};

export const auth = new Lucia(adapter, {
  sessionCookie: {
    attributes: {
      secure: import.meta.env.MODE === 'production'
    }
  },
  getUserAttributes: (attributes) => ({
    githubId: attributes.github_id,
    email: attributes.email
  })
});

export const githubAuth = new GitHub(
  import.meta.env.GITHUB_CLIENT_ID || '',
  import.meta.env.GITHUB_CLIENT_SECRET || ''
);

export async function requireUser(context: APIContext) {
  const sessionId = context.cookies.get(auth.sessionCookieName)?.value ?? null;
  
  if (!sessionId) {
    return context.redirect('/');
  }
  
  const { session, user } = await auth.validateSession(sessionId);
  
  if (!session) {
    return context.redirect('/');
  }

  return user;
}
