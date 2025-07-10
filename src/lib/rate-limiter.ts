/**
 * Simple rate limiter for admin endpoints
 * Uses in-memory storage for simplicity, can be extended to use Redis/KV for production
 */

interface RateLimitInfo {
  count: number;
  resetTime: number;
  lastRequest: number;
}

class RateLimiter {
  private requests: Map<string, RateLimitInfo> = new Map();
  private windowMs: number;
  private maxRequests: number;

  constructor(windowMs: number = 60000, maxRequests: number = 100) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
  }

  private getKey(request: Request): string {
    // Get IP address from various headers
    const ip = this.getClientIP(request);
    const userAgent = request.headers.get("user-agent") || "unknown";
    return `${ip}:${userAgent}`;
  }

  private getClientIP(request: Request): string {
    return (
      request.headers.get("CF-Connecting-IP") ||
      request.headers.get("X-Forwarded-For")?.split(",")[0] ||
      request.headers.get("X-Real-IP") ||
      "unknown"
    );
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, info] of this.requests.entries()) {
      if (now > info.resetTime) {
        this.requests.delete(key);
      }
    }
  }

  public checkLimit(request: Request): {
    allowed: boolean;
    resetTime: number;
    remaining: number;
  } {
    this.cleanup();

    const key = this.getKey(request);
    const now = Date.now();

    let info = this.requests.get(key);

    if (!info || now > info.resetTime) {
      info = {
        count: 0,
        resetTime: now + this.windowMs,
        lastRequest: now,
      };
    }

    info.count++;
    info.lastRequest = now;
    this.requests.set(key, info);

    const allowed = info.count <= this.maxRequests;
    const remaining = Math.max(0, this.maxRequests - info.count);

    return {
      allowed,
      resetTime: info.resetTime,
      remaining,
    };
  }

  public getRemainingTime(request: Request): number {
    const key = this.getKey(request);
    const info = this.requests.get(key);

    if (!info) return 0;

    return Math.max(0, info.resetTime - Date.now());
  }
}

// Global rate limiter instances
const adminRateLimiter = new RateLimiter(60000, 100); // 100 requests per minute
const authRateLimiter = new RateLimiter(300000, 10); // 10 requests per 5 minutes

export function checkAdminRateLimit(request: Request): Response | null {
  const { allowed, resetTime, remaining } =
    adminRateLimiter.checkLimit(request);

  if (!allowed) {
    return new Response(
      JSON.stringify({
        error: "Rate limit exceeded",
        message: "Too many requests. Please try again later.",
        retryAfter: Math.ceil((resetTime - Date.now()) / 1000),
      }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "X-RateLimit-Limit": "100",
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": resetTime.toString(),
          "Retry-After": Math.ceil((resetTime - Date.now()) / 1000).toString(),
        },
      },
    );
  }

  return null;
}

export function checkAuthRateLimit(request: Request): Response | null {
  const { allowed, resetTime, remaining } = authRateLimiter.checkLimit(request);

  if (!allowed) {
    return new Response(
      JSON.stringify({
        error: "Authentication rate limit exceeded",
        message: "Too many authentication attempts. Please try again later.",
        retryAfter: Math.ceil((resetTime - Date.now()) / 1000),
      }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "X-RateLimit-Limit": "10",
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": resetTime.toString(),
          "Retry-After": Math.ceil((resetTime - Date.now()) / 1000).toString(),
        },
      },
    );
  }

  return null;
}

export function addRateLimitHeaders(
  response: Response,
  request: Request,
): Response {
  const { remaining, resetTime } = adminRateLimiter.checkLimit(request);

  response.headers.set("X-RateLimit-Limit", "100");
  response.headers.set("X-RateLimit-Remaining", remaining.toString());
  response.headers.set("X-RateLimit-Reset", resetTime.toString());

  return response;
}
