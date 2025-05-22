import { auth } from '../../../lib/auth';

export const GET = async ({ cookies, redirect }) => {
  const sessionId = cookies.get(auth.sessionCookieName)?.value;
  if (sessionId) {
    await auth.invalidateSession(sessionId);
    cookies.delete(auth.sessionCookieName);
  }
  return redirect('/');
};
