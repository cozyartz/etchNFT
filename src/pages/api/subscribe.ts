import type { APIRoute } from "astro";

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  const form = await request.formData();
  const email = form.get("email")?.toString().trim();

  if (!email || !email.includes("@")) {
    return new Response("Invalid email", { status: 400 });
  }

  const db = locals.runtime.env.DB;

  try {
    await db
      .prepare("INSERT INTO subscribers (email) VALUES (?)")
      .bind(email)
      .run();
  } catch (err: any) {
    if (err.message.includes("UNIQUE")) {
      return Response.redirect("/success", 302);
    }
    console.error("[Subscribe Error]", err);
    return new Response("Internal Error", { status: 500 });
  }

  return Response.redirect("/success", 302);
};
