import type { APIRoute } from 'astro';
import { getDrops } from '../../lib/drops';
import type { DropFilters } from '../../types/drops';

export const prerender = false;

export const GET: APIRoute = async ({ request, locals }) => {
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
    
    if (url.searchParams.get('price_min')) {
      filters.price_min = parseFloat(url.searchParams.get('price_min') || '0');
    }
    
    if (url.searchParams.get('price_max')) {
      filters.price_max = parseFloat(url.searchParams.get('price_max') || '0');
    }
    
    if (url.searchParams.get('featured_only') === 'true') {
      filters.featured_only = true;
    }
    
    // Only show active drops or upcoming drops for public API
    if (!filters.status) {
      const drops = await getDrops(db, filters);
      const now = new Date();
      const publicDrops = drops.filter(drop => {
        const isUpcoming = drop.launch_date && drop.launch_date > now;
        const isLive = drop.is_active && (!drop.launch_date || drop.launch_date <= now) && (!drop.end_date || drop.end_date > now);
        return isUpcoming || isLive;
      });
      
      return new Response(JSON.stringify({
        success: true,
        drops: publicDrops
      }), {
        status: 200,
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=300' // Cache for 5 minutes
        }
      });
    }
    
    const drops = await getDrops(db, filters);
    
    return new Response(JSON.stringify({
      success: true,
      drops
    }), {
      status: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300' // Cache for 5 minutes
      }
    });
  } catch (error) {
    console.error('Error fetching drops:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};