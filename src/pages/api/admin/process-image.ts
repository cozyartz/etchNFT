import type { APIRoute } from 'astro';
import { requireAdmin } from '../../../lib/auth';
import { 
  processImageForLaser, 
  validateImageForLaser, 
  createThumbnail,
  saveProcessedFile
} from '../../../lib/image-processing';
import { 
  getDropItem, 
  updateDropItem, 
  getDesignTemplate 
} from '../../../lib/drops';
import { randomUUID } from 'crypto';

export const prerender = false;

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
    const { item_id, template_id, options = {} } = await request.json();
    
    // Validate required fields
    if (!item_id || !template_id) {
      return new Response(JSON.stringify({ 
        error: 'Missing required fields: item_id, template_id' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Get the drop item
    const item = await getDropItem(db, item_id);
    if (!item) {
      return new Response(JSON.stringify({ error: 'Item not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Get the design template
    const template = await getDesignTemplate(db, template_id);
    if (!template) {
      return new Response(JSON.stringify({ error: 'Template not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Update item status to processing
    await updateDropItem(db, item_id, {
      laser_file_status: 'processing',
      processing_notes: 'Starting image processing...'
    });
    
    // Validate image first
    const validation = await validateImageForLaser(item.original_image_url);
    if (!validation.valid) {
      await updateDropItem(db, item_id, {
        laser_file_status: 'failed',
        processing_notes: `Validation failed: ${validation.issues.join(', ')}`
      });
      
      return new Response(JSON.stringify({ 
        error: 'Image validation failed',
        issues: validation.issues,
        recommendations: validation.recommendations
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Process the image
    const result = await processImageForLaser(
      item.original_image_url,
      template,
      options
    );
    
    if (!result.success) {
      await updateDropItem(db, item_id, {
        laser_file_status: 'failed',
        processing_notes: result.error || 'Processing failed'
      });
      
      return new Response(JSON.stringify({ 
        error: 'Image processing failed',
        details: result.error
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Create thumbnail
    const thumbnailUrl = await createThumbnail(item.original_image_url);
    
    // Store laser file record in database
    const laserFileId = randomUUID();
    const now = new Date().toISOString();
    
    await db.prepare(`
      INSERT INTO laser_files (
        id, drop_item_id, template_id, original_file_url, processed_file_url,
        file_format, processing_status, processing_algorithm, processing_time_ms,
        contrast_score, detail_score, engraving_quality,
        recommended_power, recommended_speed, recommended_passes,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      laserFileId,
      item_id,
      template_id,
      item.original_image_url,
      result.processed_url,
      'svg',
      'completed',
      'auto-enhance',
      result.processing_time_ms,
      result.quality_metrics?.contrast_score || 0,
      result.quality_metrics?.detail_score || 0,
      result.quality_metrics?.engraving_quality || 'good',
      result.recommended_settings?.power || 60,
      result.recommended_settings?.speed || 1000,
      result.recommended_settings?.passes || 1,
      now,
      now
    ).run();
    
    // Update the drop item
    await updateDropItem(db, item_id, {
      laser_file_url: result.processed_url,
      laser_file_status: 'ready',
      thumbnail_url: thumbnailUrl,
      processing_notes: `Processing completed successfully in ${result.processing_time_ms}ms`
    });
    
    return new Response(JSON.stringify({
      success: true,
      laser_file_id: laserFileId,
      processed_url: result.processed_url,
      thumbnail_url: thumbnailUrl,
      quality_metrics: result.quality_metrics,
      recommended_settings: result.recommended_settings,
      processing_time_ms: result.processing_time_ms,
      validation: validation
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Error processing image:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};