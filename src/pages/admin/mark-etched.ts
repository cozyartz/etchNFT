import type { APIRoute } from 'astro';
import { auth } from '../../../lib/auth';

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies, redirect, url, locals }) => {
  const session = await auth.validateSession(cookies.get(auth.sessionCookieName)?.value ?? '');
  if (!session) {
    return redirect('/api/auth/login/github');
  }

  const id = url.searchParams.get('id');
  if (!id) {
    return new Response('Missing order ID', { status: 400 });
  }

  const db = locals.runtime.env.DB;

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
