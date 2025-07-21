// Production-ready analytics and monitoring system

interface AnalyticsEvent {
  action: string;
  category: string;
  label?: string;
  value?: number;
  custom_parameters?: Record<string, any>;
}

interface PerformanceMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta?: number;
}

class Analytics {
  private initialized = false;
  private queue: AnalyticsEvent[] = [];

  constructor() {
    if (typeof window !== 'undefined') {
      this.init();
    }
  }

  private async init() {
    try {
      // Initialize Web Vitals tracking
      await this.initWebVitals();
      
      // Initialize error tracking
      this.initErrorTracking();
      
      // Initialize performance monitoring
      this.initPerformanceMonitoring();
      
      this.initialized = true;
      
      // Process queued events
      this.queue.forEach(event => this.track(event));
      this.queue = [];
      
      console.log('Analytics initialized');
    } catch (error) {
      console.error('Analytics initialization failed:', error);
    }
  }

  private async initWebVitals() {
    try {
      const { getCLS, getFID, getFCP, getLCP, getTTFB } = await import('web-vitals');
      
      const sendToAnalytics = (metric: PerformanceMetric) => {
        this.trackPerformance(metric);
      };

      getCLS(sendToAnalytics);
      getFID(sendToAnalytics);
      getFCP(sendToAnalytics);
      getLCP(sendToAnalytics);
      getTTFB(sendToAnalytics);
    } catch (error) {
      console.warn('Web Vitals not available:', error);
    }
  }

  private initErrorTracking() {
    // Global error handler
    window.addEventListener('error', (event) => {
      this.trackError({
        type: 'javascript',
        message: event.error?.message || event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack,
      });
    });

    // Promise rejection handler
    window.addEventListener('unhandledrejection', (event) => {
      this.trackError({
        type: 'promise_rejection',
        message: event.reason?.message || String(event.reason),
        stack: event.reason?.stack,
      });
    });
  }

  private initPerformanceMonitoring() {
    // Monitor slow operations
    if ('PerformanceObserver' in window) {
      try {
        // Monitor long tasks
        const longTaskObserver = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry) => {
            if (entry.duration > 50) {
              this.track({
                action: 'long_task',
                category: 'performance',
                value: entry.duration,
                custom_parameters: {
                  startTime: entry.startTime,
                  duration: entry.duration,
                },
              });
            }
          });
        });
        longTaskObserver.observe({ entryTypes: ['longtask'] });

        // Monitor navigation timing
        const navigationObserver = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry) => {
            if (entry.entryType === 'navigation') {
              const navEntry = entry as PerformanceNavigationTiming;
              this.track({
                action: 'navigation_timing',
                category: 'performance',
                custom_parameters: {
                  domContentLoaded: navEntry.domContentLoadedEventEnd - navEntry.domContentLoadedEventStart,
                  loadComplete: navEntry.loadEventEnd - navEntry.loadEventStart,
                  firstByte: navEntry.responseStart - navEntry.requestStart,
                },
              });
            }
          });
        });
        navigationObserver.observe({ entryTypes: ['navigation'] });
      } catch (error) {
        console.warn('Performance observer not supported:', error);
      }
    }
  }

  // Public API methods
  track(event: AnalyticsEvent) {
    if (!this.initialized) {
      this.queue.push(event);
      return;
    }

    try {
      // Send to Google Analytics (if available)
      if (typeof window.gtag === 'function') {
        window.gtag('event', event.action, {
          event_category: event.category,
          event_label: event.label,
          value: event.value,
          custom_map: event.custom_parameters,
        });
      }

      // Send to custom analytics endpoint
      this.sendToCustomAnalytics(event);

      // Console logging in development
      if (import.meta.env.DEV) {
        console.log('Analytics Event:', event);
      }
    } catch (error) {
      console.error('Analytics tracking failed:', error);
    }
  }

  trackPerformance(metric: PerformanceMetric) {
    this.track({
      action: metric.name,
      category: 'web_vitals',
      value: metric.value,
      custom_parameters: {
        rating: metric.rating,
        delta: metric.delta,
      },
    });
  }

  trackError(error: {
    type: string;
    message: string;
    filename?: string;
    lineno?: number;
    colno?: number;
    stack?: string;
  }) {
    this.track({
      action: 'error',
      category: 'javascript_error',
      label: error.type,
      custom_parameters: {
        message: error.message,
        filename: error.filename,
        lineno: error.lineno,
        colno: error.colno,
        stack: error.stack?.substring(0, 1000), // Limit stack size
        userAgent: navigator.userAgent,
        url: window.location.href,
      },
    });
  }

  trackPageView(path?: string) {
    this.track({
      action: 'page_view',
      category: 'navigation',
      label: path || window.location.pathname,
      custom_parameters: {
        referrer: document.referrer,
        title: document.title,
      },
    });
  }

  trackUserAction(action: string, details?: Record<string, any>) {
    this.track({
      action,
      category: 'user_interaction',
      custom_parameters: details,
    });
  }

  trackConversion(type: string, value?: number, details?: Record<string, any>) {
    this.track({
      action: 'conversion',
      category: 'ecommerce',
      label: type,
      value,
      custom_parameters: details,
    });
  }

  private async sendToCustomAnalytics(event: AnalyticsEvent) {
    try {
      // Send to your custom analytics endpoint
      await fetch('/api/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...event,
          timestamp: new Date().toISOString(),
          session_id: this.getSessionId(),
          user_id: this.getUserId(),
          page_url: window.location.href,
          referrer: document.referrer,
        }),
      });
    } catch (error) {
      // Fail silently to not affect user experience
      if (import.meta.env.DEV) {
        console.error('Custom analytics failed:', error);
      }
    }
  }

  private getSessionId(): string {
    let sessionId = sessionStorage.getItem('analytics_session_id');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('analytics_session_id', sessionId);
    }
    return sessionId;
  }

  private getUserId(): string | null {
    // Return user ID if available (e.g., from authentication)
    return localStorage.getItem('user_id') || null;
  }
}

// Global analytics instance
export const analytics = new Analytics();

// Convenience functions
export const trackEvent = (action: string, category: string, label?: string, value?: number) => {
  analytics.track({ action, category, label, value });
};

export const trackPageView = (path?: string) => {
  analytics.trackPageView(path);
};

export const trackUserAction = (action: string, details?: Record<string, any>) => {
  analytics.trackUserAction(action, details);
};

export const trackConversion = (type: string, value?: number, details?: Record<string, any>) => {
  analytics.trackConversion(type, value, details);
};

// PayPal specific tracking
export const trackPayPalEvent = (event: string, orderData?: any) => {
  analytics.track({
    action: event,
    category: 'paypal',
    custom_parameters: orderData ? {
      order_id: orderData.id,
      amount: orderData.amount,
      items: orderData.items?.length,
    } : undefined,
  });
};

// Web3 specific tracking  
export const trackWeb3Event = (event: string, details?: Record<string, any>) => {
  analytics.track({
    action: event,
    category: 'web3',
    custom_parameters: details,
  });
};

// Extend Window interface for TypeScript
declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}