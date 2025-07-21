import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
  try {
    const analyticsData = await request.json();
    
    // Validate analytics data
    if (!analyticsData.action || !analyticsData.category) {
      return new Response(JSON.stringify({ error: 'Invalid analytics data' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Get client information
    const clientIP = request.headers.get('CF-Connecting-IP') || 
                     request.headers.get('X-Forwarded-For') || 
                     'unknown';
                     
    const userAgent = request.headers.get('User-Agent') || 'unknown';

    // Create analytics record
    const analyticsRecord = {
      timestamp: analyticsData.timestamp || new Date().toISOString(),
      client_ip: clientIP,
      user_agent: userAgent,
      session_id: analyticsData.session_id,
      user_id: analyticsData.user_id,
      action: analyticsData.action,
      category: analyticsData.category,
      label: analyticsData.label,
      value: analyticsData.value,
      page_url: analyticsData.page_url,
      referrer: analyticsData.referrer,
      custom_parameters: analyticsData.custom_parameters ? 
        JSON.stringify(analyticsData.custom_parameters) : null,
    };

    // Log for monitoring (in production, send to your analytics service)
    if (import.meta.env.DEV) {
      console.log('Analytics Event:', JSON.stringify(analyticsRecord, null, 2));
    }

    // In production, you would:
    // 1. Store in your analytics database
    // 2. Send to services like Mixpanel, Amplitude, or custom analytics
    // 3. Forward to Google Analytics via Measurement Protocol
    
    // Example: Store in D1 database
    // await storeAnalyticsEvent(analyticsRecord, locals.runtime?.env?.DB);

    // Example: Forward to external analytics service
    // await forwardToAnalyticsService(analyticsRecord);

    return new Response(JSON.stringify({ 
      success: true,
      message: 'Analytics event recorded'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Analytics processing error:', error);
    
    return new Response(JSON.stringify({ 
      error: 'Failed to process analytics event' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

// Optional: Store analytics in D1 database
async function storeAnalyticsEvent(record: any, db?: D1Database) {
  if (!db) return;
  
  try {
    await db.prepare(`
      INSERT INTO analytics_events (
        timestamp, client_ip, user_agent, session_id, user_id,
        action, category, label, value, page_url, referrer, custom_parameters
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      record.timestamp,
      record.client_ip,
      record.user_agent,
      record.session_id,
      record.user_id,
      record.action,
      record.category,
      record.label,
      record.value,
      record.page_url,
      record.referrer,
      record.custom_parameters
    ).run();
  } catch (error) {
    console.error('Failed to store analytics event:', error);
  }
}

// Optional: Forward to external analytics service
async function forwardToAnalyticsService(record: any) {
  try {
    // Example: Send to Mixpanel
    // await fetch('https://api.mixpanel.com/track', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({
    //     event: `${record.category}_${record.action}`,
    //     properties: {
    //       distinct_id: record.user_id || record.session_id,
    //       ...JSON.parse(record.custom_parameters || '{}'),
    //     }
    //   })
    // });

    // Example: Send to Google Analytics via Measurement Protocol
    // const params = new URLSearchParams({
    //   v: '1',
    //   tid: 'UA-XXXXX-X', // Your GA tracking ID
    //   cid: record.user_id || record.session_id,
    //   t: 'event',
    //   ec: record.category,
    //   ea: record.action,
    //   el: record.label,
    //   ev: record.value?.toString(),
    // });
    // await fetch('https://www.google-analytics.com/collect', {
    //   method: 'POST',
    //   body: params
    // });
  } catch (error) {
    console.error('Failed to forward to analytics service:', error);
  }
}