import type { APIRoute } from 'astro';
import { requireAdmin } from '../../../lib/auth';
import { createDrop, getDrops, getDrop, updateDrop, deleteDrop } from '../../../lib/drops';
import type { CreateDropRequest, DropFilters } from '../../../types/drops';

export const prerender = false;

export const GET: APIRoute = async ({ request, cookies, locals }) => {
  // Require admin authentication
  const user = await requireAdmin({ cookies, locals } as any);
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const db = locals.runtime.env.DB as D1Database;
    const url = new URL(request.url);
    
    // Parse query parameters for filtering
    const filters: DropFilters = {};
    
    if (url.searchParams.get('status')) {
      filters.status = url.searchParams.get('status') as any;
    }
    
    if (url.searchParams.get('product_type')) {
      filters.product_type = url.searchParams.get('product_type') as any;
    }
    
    if (url.searchParams.get('material')) {
      filters.material = url.searchParams.get('material') as any;
    }
    
    if (url.searchParams.get('featured_only') === 'true') {
      filters.featured_only = true;
    }
    
    const drops = await getDrops(db, filters);
    
    return new Response(JSON.stringify({
      success: true,
      drops
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error fetching drops:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

export const POST: APIRoute = async ({ request, cookies, locals }) => {
  // Require admin authentication
  const user = await requireAdmin({ cookies, locals } as any);
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const db = locals.runtime.env.DB as D1Database;
    const data: CreateDropRequest = await request.json();
    
    // Validate required fields
    if (!data.name || !data.price_usd || !data.total_supply || !data.product_type) {
      return new Response(JSON.stringify({ 
        error: 'Missing required fields: name, price_usd, total_supply, product_type' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Create the drop
    const drop = await createDrop(db, user.id, data);
    
    return new Response(JSON.stringify({
      success: true,
      drop
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error creating drop:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};