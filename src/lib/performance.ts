// Production-ready performance optimization utilities

export class PerformanceOptimizer {
  private static instance: PerformanceOptimizer;
  private resourceObserver?: PerformanceObserver;
  private preloadedResources = new Set<string>();
  
  static getInstance(): PerformanceOptimizer {
    if (!PerformanceOptimizer.instance) {
      PerformanceOptimizer.instance = new PerformanceOptimizer();
    }
    return PerformanceOptimizer.instance;
  }

  constructor() {
    if (typeof window !== 'undefined') {
      this.init();
    }
  }

  private init() {
    // Monitor resource loading performance
    this.initResourceObserver();
    
    // Preload critical resources
    this.preloadCriticalResources();
    
    // Set up intersection observer for lazy loading
    this.setupLazyLoading();
    
    // Optimize images
    this.optimizeImages();
  }

  private initResourceObserver() {
    if ('PerformanceObserver' in window) {
      try {
        this.resourceObserver = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry) => {
            if (entry.entryType === 'resource') {
              const resourceEntry = entry as PerformanceResourceTiming;
              
              // Log slow resources
              if (resourceEntry.duration > 1000) {
                console.warn(`Slow resource: ${resourceEntry.name} took ${resourceEntry.duration}ms`);
              }
              
              // Track failed resources
              if (resourceEntry.transferSize === 0 && resourceEntry.decodedBodySize === 0) {
                console.error(`Failed to load resource: ${resourceEntry.name}`);
              }
            }
          });
        });
        
        this.resourceObserver.observe({ entryTypes: ['resource'] });
      } catch (error) {
        console.warn('Resource observer not supported:', error);
      }
    }
  }

  private preloadCriticalResources() {
    const criticalResources = [
      // PayPal SDK (if not already loaded)
      `https://www.paypal.com/sdk/js?client-id=${import.meta.env.PUBLIC_PAYPAL_CLIENT_ID}&currency=USD&intent=capture&components=buttons`,
      
      // Web3 provider detection
      '/src/lib/web3-providers.js',
      
      // Critical API endpoints
      '/api/nfts/user',
    ];

    criticalResources.forEach(resource => {
      this.preloadResource(resource, 'script');
    });
  }

  public preloadResource(url: string, type: 'script' | 'style' | 'font' | 'image' = 'script') {
    if (this.preloadedResources.has(url)) {
      return; // Already preloaded
    }

    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = url;
    
    switch (type) {
      case 'script':
        link.as = 'script';
        break;
      case 'style':
        link.as = 'style';
        break;
      case 'font':
        link.as = 'font';
        link.crossOrigin = 'anonymous';
        break;
      case 'image':
        link.as = 'image';
        break;
    }

    document.head.appendChild(link);
    this.preloadedResources.add(url);
  }

  private setupLazyLoading() {
    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            if (img.dataset.src) {
              img.src = img.dataset.src;
              img.removeAttribute('data-src');
              imageObserver.unobserve(img);
            }
          }
        });
      }, {
        rootMargin: '50px 0px', // Start loading 50px before entering viewport
      });

      // Observe all images with data-src
      document.querySelectorAll('img[data-src]').forEach(img => {
        imageObserver.observe(img);
      });
    }
  }

  private optimizeImages() {
    // Add loading="lazy" to images that don't have it
    document.querySelectorAll('img:not([loading])').forEach(img => {
      const imageEl = img as HTMLImageElement;
      // Don't lazy load images above the fold
      const rect = imageEl.getBoundingClientRect();
      if (rect.top > window.innerHeight) {
        imageEl.loading = 'lazy';
      }
    });
  }

  // Cache management
  public clearResourceCache() {
    this.preloadedResources.clear();
  }

  // Memory optimization
  public optimizeMemory() {
    // Force garbage collection if available
    if ('gc' in window) {
      (window as any).gc();
    }
    
    // Clear large unused objects
    this.clearResourceCache();
  }

  // Connection-aware optimization
  public adaptToConnection() {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      
      if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
        // Disable heavy features for slow connections
        this.disableHeavyFeatures();
      } else if (connection.effectiveType === '4g') {
        // Enable all features for fast connections
        this.enableAllFeatures();
      }
    }
  }

  private disableHeavyFeatures() {
    // Disable animations
    document.documentElement.style.setProperty('--animation-duration', '0s');
    
    // Reduce image quality
    document.querySelectorAll('img').forEach(img => {
      if (img.srcset && !img.dataset.originalSrcset) {
        img.dataset.originalSrcset = img.srcset;
        // Use lower resolution images
        img.srcset = img.srcset.replace(/\s\d+w/g, ' 480w');
      }
    });
    
    console.log('Heavy features disabled for slow connection');
  }

  private enableAllFeatures() {
    // Restore original settings
    document.documentElement.style.removeProperty('--animation-duration');
    
    // Restore original image quality
    document.querySelectorAll('img[data-original-srcset]').forEach(img => {
      const imgEl = img as HTMLImageElement;
      if (imgEl.dataset.originalSrcset) {
        imgEl.srcset = imgEl.dataset.originalSrcset;
        delete imgEl.dataset.originalSrcset;
      }
    });
    
    console.log('All features enabled for fast connection');
  }

  // Service Worker registration
  public async registerServiceWorker() {
    if ('serviceWorker' in navigator && import.meta.env.PROD) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('Service Worker registered:', registration);
        
        // Update available
        registration.addEventListener('updatefound', () => {
          console.log('Service Worker update available');
          // Optionally prompt user to refresh
        });
        
        return registration;
      } catch (error) {
        console.error('Service Worker registration failed:', error);
      }
    }
  }

  // Critical resource monitoring
  public monitorCriticalResources() {
    const criticalResources = [
      'https://www.paypal.com',
      'https://eth-mainnet.g.alchemy.com',
      'https://polygon-mainnet.g.alchemy.com',
    ];

    criticalResources.forEach(async (resource) => {
      try {
        const start = performance.now();
        await fetch(resource, { mode: 'no-cors' });
        const duration = performance.now() - start;
        
        if (duration > 5000) {
          console.warn(`Critical resource ${resource} is slow: ${duration}ms`);
        }
      } catch (error) {
        console.error(`Critical resource ${resource} failed:`, error);
      }
    });
  }

  // Cleanup
  public destroy() {
    if (this.resourceObserver) {
      this.resourceObserver.disconnect();
    }
    this.clearResourceCache();
  }
}

// Auto-initialize performance optimizer
export const performanceOptimizer = PerformanceOptimizer.getInstance();

// Utility functions
export const preloadRoute = (path: string) => {
  performanceOptimizer.preloadResource(path, 'script');
};

export const optimizeForConnection = () => {
  performanceOptimizer.adaptToConnection();
};

export const registerSW = () => {
  return performanceOptimizer.registerServiceWorker();
};

// Image optimization helper
export const optimizeImage = (src: string, width?: number, quality?: number): string => {
  const url = new URL(src, window.location.origin);
  
  if (width) {
    url.searchParams.set('w', width.toString());
  }
  
  if (quality) {
    url.searchParams.set('q', quality.toString());
  }
  
  // Add format optimization
  if ('webp' in document.createElement('canvas').getContext('2d')!) {
    url.searchParams.set('f', 'webp');
  }
  
  return url.toString();
};