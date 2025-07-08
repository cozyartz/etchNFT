import type { APIRoute } from "astro";
import { createAuth } from "../../lib/auth";

export const prerender = false;

export const POST: APIRoute = async ({
  request,
  cookies,
  redirect,
  locals,
}) => {
  const db = locals.runtime.env.DB as D1Database;
  const auth = createAuth(db);

  const sessionCookie = cookies.get(auth.sessionCookieName)?.value ?? "";
  const { session } = await auth.validateSession(sessionCookie);

  if (!session) {
    return redirect("/admin/login");
  }

  const formData = await request.formData();
  const id = formData.get("id") as string;

  if (!id) {
    return new Response("Missing order ID", { status: 400 });
  }

  try {
    await db
      .prepare(
        `UPDATE orders SET status = 'etched', updated_at = datetime('now') WHERE id = ?`,
      )
      .bind(id)
      .run();

    console.log(`[ADMIN] Marked order ${id} as etched`);
  } catch (err) {
    console.error("[DB ERROR]", err);
    return new Response("Database error", { status: 500 });
  }

  return redirect("/admin/admin");
};
