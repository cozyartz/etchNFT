import { githubAuth, auth } from '../../../../lib/auth';

export const GET = async ({ url, cookies, redirect }) => {
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');

  const storedState = cookies.get('github_oauth_state')?.value ?? null;

  if (!code || !state || state !== storedState) {
    return new Response('Invalid request', { status: 400 });
  }

  try {
    const tokens = await githubAuth.validateAuthorizationCode(code);
    
    // Fetch user info from GitHub API
    const response = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${tokens.accessToken}`,
      },
    });
    
    const githubUser = await response.json();
    
    // Create user and session (simplified - would need proper database in production)
    const userId = `github_${githubUser.id}`;
    const session = await auth.createSession(userId, {
      github_id: githubUser.id,
      email: githubUser.email
    });
    
    const sessionCookie = auth.createSessionCookie(session.id);
    cookies.set(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);

    return redirect('/admin/subscribers');
  } catch (err) {
    console.error('GitHub auth error:', err);
    return new Response('Auth error', { status: 500 });
  }
};
