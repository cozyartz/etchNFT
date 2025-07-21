import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
  try {
    const errorData = await request.json();
    
    // Validate error data
    if (!errorData.error || !errorData.error.message) {
      return new Response(JSON.stringify({ error: 'Invalid error data' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Rate limiting - prevent spam
    const clientIP = request.headers.get('CF-Connecting-IP') || 
                     request.headers.get('X-Forwarded-For') || 
                     'unknown';
    
    // Log error for monitoring (in production, send to your monitoring service)
    const errorLog = {
      timestamp: new Date().toISOString(),
      clientIP,
      error: {
        name: errorData.error.name,
        message: errorData.error.message,
        stack: errorData.error.stack?.substring(0, 2000), // Limit stack size
      },
      errorInfo: errorData.errorInfo,
      url: errorData.url,
      userAgent: errorData.userAgent?.substring(0, 500), // Limit user agent size
      severity: determineSeverity(errorData.error),
    };

    console.error('Client Error Report:', JSON.stringify(errorLog, null, 2));

    // In production, you would send this to your monitoring service:
    // - Sentry: Sentry.captureException()
    // - DataDog: datadogLogger.error()
    // - CloudWatch: cloudwatchLogger.log()
    // - Custom analytics endpoint

    // Optional: Store in database for analysis
    // await storeErrorInDatabase(errorLog);

    return new Response(JSON.stringify({ 
      success: true, 
      message: 'Error reported successfully' 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (processingError) {
    console.error('Error processing error report:', processingError);
    
    return new Response(JSON.stringify({ 
      error: 'Failed to process error report' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

function determineSeverity(error: any): 'low' | 'medium' | 'high' | 'critical' {
  const message = error.message?.toLowerCase() || '';
  const name = error.name?.toLowerCase() || '';

  // Critical errors
  if (
    name.includes('referenceerror') ||
    name.includes('typeerror') ||
    message.includes('payment') ||
    message.includes('wallet') ||
    message.includes('transaction')
  ) {
    return 'critical';
  }

  // High priority errors
  if (
    message.includes('network') ||
    message.includes('failed to fetch') ||
    message.includes('timeout') ||
    name.includes('syntaxerror')
  ) {
    return 'high';
  }

  // Medium priority errors
  if (
    message.includes('permission') ||
    message.includes('unauthorized') ||
    message.includes('validation')
  ) {
    return 'medium';
  }

  // Default to low
  return 'low';
}

// Optional: Store error in database for analysis
async function storeErrorInDatabase(errorLog: any) {
  // Implementation would depend on your database setup
  // Example with D1:
  /*
  const db = locals.runtime?.env?.DB as D1Database;
  if (db) {
    await db.prepare(`
      INSERT INTO error_logs (
        timestamp, client_ip, error_name, error_message, 
        error_stack, url, user_agent, severity
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      errorLog.timestamp,
      errorLog.clientIP,
      errorLog.error.name,
      errorLog.error.message,
      errorLog.error.stack,
      errorLog.url,
      errorLog.userAgent,
      errorLog.severity
    ).run();
  }
  */
}