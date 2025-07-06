import type { APIRoute } from 'astro';
import { auth } from "../../lib/auth";
import { getDatabase } from "../../lib/db"; // assume your DB client is exported from here

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies, redirect, url }) => {
  const sessionCookie = cookies.get(auth.sessionCookieName)?.value ?? '';
  const session = await auth.validateSession(sessionCookie);

  if (!session) {
    return redirect('/api/auth/login/github');
  }

  const id = url.searchParams.get('id');
  if (!id) {
    return new Response('Missing order ID', { status: 400 });
  }

  const db = getDatabase(); // your own method that returns a prepared client (e.g. D1, sqlite, better-sqlite3, etc.)

  try {
    await db
      .prepare(`UPDATE orders SET status = 'etched', updated_at = CURRENT_TIMESTAMP WHERE id = ?`)
      .bind(id)
      .run();

    console.log(`[ADMIN] Marked order ${id} as etched`);
  } catch (err) {
    console.error('[DB ERROR]', err);
    return new Response('Database error', { status: 500 });
  }

  return redirect('/admin');
};
