// src/lib/auth.ts
import { Lucia } from 'lucia';
import { github } from '@lucia-auth/oauth/providers';
import { astro } from 'lucia/middleware';
import { D1Adapter } from '@lucia-auth/adapter-sqlite';

export const auth = new Lucia(new D1Adapter(Bun.env.DB), {
  middleware: astro(),
  sessionCookie: {
    name: 'etchnft_session',
    expires: false,
  },
  env: import.meta.env.DEV ? 'DEV' : 'PROD',
});

export const githubAuth = github(auth, {
  clientId: import.meta.env.GITHUB_CLIENT_ID,
  clientSecret: import.meta.env.GITHUB_CLIENT_SECRET,
  redirectUri: 'http://localhost:4321/api/auth/callback/github', // Change on deploy
});

declare module 'lucia' {
  interface Register {
    Auth: typeof auth;
    DatabaseUserAttributes: {
      github_id: string;
      email: string;
    };
  }
}
