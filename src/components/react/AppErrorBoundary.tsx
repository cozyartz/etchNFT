import React from 'react';
import { ErrorBoundary } from './ErrorBoundary';

interface Props {
  children: React.ReactNode;
}

export default function AppErrorBoundary({ children }: Props) {
  const handleError = (error: Error, errorInfo: React.ErrorInfo) => {
    // Additional app-level error handling
    console.error('App-level error:', error, errorInfo);
    
    // Track error analytics
    if (typeof window !== 'undefined' && import.meta.env.PROD) {
      // Send to analytics service
      try {
        if ('gtag' in window) {
          (window as any).gtag('event', 'exception', {
            description: error.message,
            fatal: true,
          });
        }
      } catch (analyticsError) {
        console.error('Failed to track error in analytics:', analyticsError);
      }
    }
  };

  return (
    <ErrorBoundary onError={handleError}>
      {children}
    </ErrorBoundary>
  );
}