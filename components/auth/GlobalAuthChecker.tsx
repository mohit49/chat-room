'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/lib/contexts/AuthContext';

interface GlobalAuthCheckerProps {
  children: React.ReactNode;
}

// Simple route configuration
const PUBLIC_ROUTES = ['/login', '/signup', '/forgot-password', '/reset-password', '/'];
const AUTH_REDIRECT_ROUTES = ['/login', '/signup', '/forgot-password', '/reset-password'];

export function GlobalAuthChecker({ children }: GlobalAuthCheckerProps) {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [hasRedirected, setHasRedirected] = useState(false);

  useEffect(() => {
    // Reset redirect flag when pathname changes
    setHasRedirected(false);
  }, [pathname]);

  useEffect(() => {
    // Don't do anything while loading or if already redirected
    if (loading || hasRedirected) {
      return;
    }

    const isPublic = PUBLIC_ROUTES.includes(pathname);
    const isAuthRedirect = AUTH_REDIRECT_ROUTES.includes(pathname);

    console.log('🔐 GlobalAuthChecker:', {
      pathname,
      isAuthenticated,
      loading,
      isPublic,
      isAuthRedirect,
      hasRedirected
    });

    // If user is not authenticated and trying to access protected route
    if (!isAuthenticated && !isPublic) {
      console.log('🔐 User not authenticated, redirecting to login');
      setHasRedirected(true);
      router.push('/login');
      return;
    }

    // If user is authenticated and on auth redirect route (like login page)
    if (isAuthenticated && isAuthRedirect) {
      console.log('🔐 User is authenticated, redirecting to home');
      setHasRedirected(true);
      router.push('/home');
      return;
    }

    // If user is on root path, redirect based on auth status
    if (pathname === '/') {
      const redirectTo = isAuthenticated ? '/home' : '/login';
      console.log(`🔐 User ${isAuthenticated ? 'authenticated' : 'not authenticated'}, redirecting to ${redirectTo}`);
      setHasRedirected(true);
      router.push(redirectTo);
      return;
    }

    console.log('🔐 GlobalAuthChecker: No redirect needed, allowing access to', pathname);

  }, [isAuthenticated, loading, pathname, router, hasRedirected]);

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Checking authentication...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
