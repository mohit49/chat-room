'use client';

import React from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Mail, Shield, Lock } from 'lucide-react';
import { EmailVerificationBanner } from './EmailVerificationBanner';

interface EmailVerificationGuardProps {
  children: React.ReactNode;
  feature?: string;
  silentRestriction?: boolean; // New prop for silent restrictions
}

export function EmailVerificationGuard({ 
  children, 
  feature = 'this feature',
  silentRestriction = false
}: EmailVerificationGuardProps) {
  const { user, emailVerified } = useAuth();

  // If user is not authenticated, let the auth system handle it
  if (!user) {
    return <>{children}</>;
  }

  // If email is verified, render children normally
  if (emailVerified) {
    return <>{children}</>;
  }

  // Silent restriction - just disable interactions without showing verification UI
  if (silentRestriction) {
    return (
      <div className="opacity-50 pointer-events-none cursor-not-allowed">
        {children}
      </div>
    );
  }

  // Fallback - render children normally (for backward compatibility)
  return <>{children}</>;
}

// Higher-order component for easy wrapping
export function withEmailVerification<P extends object>(
  Component: React.ComponentType<P>,
  feature?: string,
  options?: { silentRestriction?: boolean }
) {
  return function EmailVerifiedComponent(props: P) {
    return (
      <EmailVerificationGuard 
        feature={feature}
        silentRestriction={options?.silentRestriction}
      >
        <Component {...props} />
      </EmailVerificationGuard>
    );
  };
}

export default EmailVerificationGuard;
