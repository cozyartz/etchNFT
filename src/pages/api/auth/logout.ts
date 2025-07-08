import { createAuth } from "../../../lib/auth";

export const GET = async ({ cookies, redirect, locals }) => {
  const db = locals.runtime.env.DB as D1Database;
  const auth = createAuth(db);

  const sessionId = cookies.get(auth.sessionCookieName)?.value;
  if (sessionId) {
    await auth.invalidateSession(sessionId);
    cookies.delete(auth.sessionCookieName);
  }
  return redirect("/");
};
