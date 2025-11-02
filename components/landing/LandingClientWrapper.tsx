'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/AuthContext';

interface LandingClientWrapperProps {
  children: React.ReactNode;
}

export default function LandingClientWrapper({ children }: LandingClientWrapperProps) {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  // Redirect authenticated users to home
  // Use a timeout to avoid blocking crawlers - render content immediately
  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.push('/home');
    }
  }, [isAuthenticated, loading, router]);

  // IMPORTANT: Always render children immediately for SEO/crawling
  // Don't show loading screen as it blocks crawlers and creates white flash
  // The page content is server-rendered and should be visible immediately
  
  // Don't show landing page to authenticated users (but still render initially)
  if (!loading && isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}

