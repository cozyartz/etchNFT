import type { APIContext } from 'astro';
import { lucia } from 'lucia';
import { github } from 'lucia/providers';
import { astro } from 'lucia/middleware';

export const auth = lucia({
  env: import.meta.env.MODE === 'development' ? 'DEV' : 'PROD',
  middleware: astro(),
  sessionCookie: {
    expires: false,
  },
  getUserAttributes: (data) => ({
    githubId: data.github_id,
    email: data.email
  })
});

export async function requireUser(context: APIContext) {
  const session = await auth.validateSession(context);

  if (!session?.user) {
    return context.redirect('/'); // deny access
  }

  return session.user;
}
