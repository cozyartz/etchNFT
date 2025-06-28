import type { APIRoute } from 'astro';

export const prerender = false;

export const GET: APIRoute = async ({ params, locals }) => {
  const db = locals.runtime.env.DB;
  const id = params.id;

  try {
    // Fetch the order from Cloudflare D1
    const result = await db
      .prepare('SELECT * FROM orders WHERE id = ?')
      .bind(id)
      .first();

    if (!result) {
      return new Response('Certificate not found', { status: 404 });
    }

    // For now, redirect to SVG version
    // In production, you'd convert SVG to PNG using a service like Puppeteer
    return Response.redirect(`/cert/${id}/preview.svg`, 302);
    
  } catch (error) {
    console.error('Certificate preview error:', error);
    return new Response('Error generating certificate', { status: 500 });
  }
};