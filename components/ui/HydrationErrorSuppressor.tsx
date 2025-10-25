'use client';

import { useEffect } from 'react';

/**
 * Component to suppress hydration warnings caused by browser extensions
 * Browser extensions like Bitwarden, LastPass, etc. inject attributes like
 * bis_skin_checked="1" which cause harmless hydration warnings
 */
export function HydrationErrorSuppressor() {
  useEffect(() => {
    // Only run in development
    if (process.env.NODE_ENV !== 'development') return;

    const originalError = console.error;
    const originalWarn = console.warn;

    console.error = (...args: any[]) => {
      const errorMessage = args[0]?.toString() || '';
      
      // Suppress hydration warnings caused by browser extensions
      if (
        errorMessage.includes('Hydration') ||
        errorMessage.includes('hydration') ||
        errorMessage.includes('bis_skin_checked') ||
        errorMessage.includes('server rendered HTML') ||
        (errorMessage.includes('Warning') && errorMessage.includes('did not match'))
      ) {
        // Check if it's a browser extension issue
        const hasBrowserExtensionSignature = 
          errorMessage.includes('bis_skin_checked') ||
          args.toString().includes('bis_skin_checked');
        
        if (hasBrowserExtensionSignature) {
          // Silently ignore browser extension hydration warnings
          return;
        }
      }
      
      // Log all other errors normally
      originalError.apply(console, args);
    };

    console.warn = (...args: any[]) => {
      const warnMessage = args[0]?.toString() || '';
      
      // Suppress hydration warnings
      if (
        warnMessage.includes('Hydration') ||
        warnMessage.includes('hydration') ||
        warnMessage.includes('bis_skin_checked')
      ) {
        return;
      }
      
      originalWarn.apply(console, args);
    };

    // Cleanup
    return () => {
      console.error = originalError;
      console.warn = originalWarn;
    };
  }, []);

  return null;
}


