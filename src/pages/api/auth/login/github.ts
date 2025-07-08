import { githubAuth, createAuth } from "../../../../lib/auth";

export const GET = async ({ url, cookies, redirect, locals }) => {
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");

  const storedState = cookies.get("github_oauth_state")?.value ?? null;

  if (!code || !state || state !== storedState) {
    return new Response("Invalid request", { status: 400 });
  }

  try {
    const db = locals.runtime.env.DB as D1Database;
    const auth = createAuth(db);

    const tokens = await githubAuth.validateAuthorizationCode(code);

    // Fetch user info from GitHub API
    const response = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${tokens.accessToken}`,
      },
    });

    const githubUser = await response.json();

    // Create or update user in database
    const userId = `github_${githubUser.id}`;

    await db
      .prepare(
        `
      INSERT OR REPLACE INTO users (id, github_id, email, username, created_at, updated_at)
      VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))
    `,
      )
      .bind(userId, githubUser.id, githubUser.email, githubUser.login)
      .run();

    // Create session
    const session = await auth.createSession(userId, {
      github_id: githubUser.id,
      email: githubUser.email,
    });

    const sessionCookie = auth.createSessionCookie(session.id);
    cookies.set(
      sessionCookie.name,
      sessionCookie.value,
      sessionCookie.attributes,
    );

    // Clear the state cookie
    cookies.delete("github_oauth_state");

    return redirect("/admin/admin");
  } catch (err) {
    console.error("GitHub auth error:", err);
    return new Response("Auth error", { status: 500 });
  }
};
