import type { APIRoute } from 'astro';
import { requireUser } from '../../../lib/auth';
import { createDropItem, getDropItems, updateDropItem } from '../../../lib/drops';
import type { CreateDropItemRequest } from '../../../types/drops';

export const prerender = false;

export const GET: APIRoute = async ({ request, cookies, locals }) => {
  // Require admin authentication
  const user = await requireUser({ cookies, locals } as any);
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const db = locals.runtime.env.DB as D1Database;
    const url = new URL(request.url);
    const dropId = url.searchParams.get('drop_id');
    
    if (!dropId) {
      return new Response(JSON.stringify({ error: 'drop_id parameter is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const items = await getDropItems(db, dropId);
    
    return new Response(JSON.stringify({
      success: true,
      items
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error fetching drop items:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const POST: APIRoute = async ({ request, cookies, locals }) => {
  // Require admin authentication
  const user = await requireUser({ cookies, locals } as any);
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const db = locals.runtime.env.DB as D1Database;
    const { drop_id, ...itemData }: CreateDropItemRequest & { drop_id: string } = await request.json();
    
    // Validate required fields
    if (!drop_id || !itemData.name || !itemData.token_id || !itemData.original_image_url) {
      return new Response(JSON.stringify({ 
        error: 'Missing required fields: drop_id, name, token_id, original_image_url' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Create the drop item
    const item = await createDropItem(db, drop_id, itemData);
    
    return new Response(JSON.stringify({
      success: true,
      item
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error creating drop item:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};