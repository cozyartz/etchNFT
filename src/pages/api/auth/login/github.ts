import { githubAuth, auth } from '../../../lib/auth';

export const GET = async ({ url, cookies, redirect }) => {
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');

  const storedState = cookies.get('github_oauth_state')?.value ?? null;

  if (!code || !state || state !== storedState) {
    return new Response('Invalid request', { status: 400 });
  }

  try {
    const { getExistingUser, githubUser, createUser } = await githubAuth.validateCallback(code);

    const user = getExistingUser() ?? (await createUser({ attributes: { github_id: githubUser.id, email: githubUser.email } }));
    const session = await auth.createSession(user.userId);
    const sessionCookie = auth.createSessionCookie(session);

    cookies.set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);

    return redirect('/admin/subscribers');
  } catch (err) {
    return new Response('Auth error', { status: 500 });
  }
};
