import type { APIRoute } from 'astro';
import { getDropBySlug, getDropItems } from '../../../lib/drops';

export const prerender = false;

export const GET: APIRoute = async ({ params, locals }) => {
  try {
    const db = locals.runtime.env.DB as D1Database;
    const slug = params.slug;
    
    if (!slug) {
      return new Response(JSON.stringify({ error: 'Slug is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const drop = await getDropBySlug(db, slug);
    
    if (!drop) {
      return new Response(JSON.stringify({ error: 'Drop not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Get available items for this drop
    const allItems = await getDropItems(db, drop.id);
    const availableItems = allItems.filter(item => item.is_available && !item.is_sold);
    
    return new Response(JSON.stringify({
      success: true,
      drop: {
        ...drop,
        available_items: availableItems.length,
        items: availableItems
      }
    }), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300' // Cache for 5 minutes
      }
    });
  } catch (error) {
    console.error('Error fetching drop:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};