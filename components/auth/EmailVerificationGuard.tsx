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
  showInlineMessage?: boolean;
  blockInteraction?: boolean;
}

export function EmailVerificationGuard({ 
  children, 
  feature = 'this feature',
  showInlineMessage = false,
  blockInteraction = true
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

  // If email is not verified, show restriction
  if (showInlineMessage) {
    return (
      <div className="space-y-4">
        <Alert className="border-amber-200 bg-amber-50">
          <Shield className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            <div className="flex items-center justify-between">
              <div>
                <strong>Email Verification Required</strong>
                <p className="text-sm mt-1">
                  Please verify your email address to access {feature}.
                </p>
              </div>
              <Mail className="h-5 w-5 text-amber-600" />
            </div>
          </AlertDescription>
        </Alert>
        
        {/* Show verification banner */}
        <EmailVerificationBanner />
        
        {/* Show disabled content if blockInteraction is false */}
        {!blockInteraction && (
          <div className="opacity-50 pointer-events-none">
            {children}
          </div>
        )}
      </div>
    );
  }

  // Block interaction completely - don't render children
  if (blockInteraction) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center space-y-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
        <div className="p-4 bg-amber-100 rounded-full">
          <Lock className="h-8 w-8 text-amber-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Email Verification Required
          </h3>
          <p className="text-gray-600 mb-4">
            You need to verify your email address before you can access {feature}.
          </p>
          <p className="text-sm text-gray-500">
            Check your inbox for a verification email or request a new one below.
          </p>
        </div>
        
        {/* Show verification banner */}
        <div className="w-full max-w-md">
          <EmailVerificationBanner />
        </div>
      </div>
    );
  }

  // Fallback - render children with warning
  return (
    <div className="space-y-4">
      <Alert className="border-red-200 bg-red-50">
        <Shield className="h-4 w-4 text-red-600" />
        <AlertDescription className="text-red-800">
          <strong>Access Restricted:</strong> Email verification required for {feature}.
        </AlertDescription>
      </Alert>
      {children}
    </div>
  );
}

// Higher-order component for easy wrapping
export function withEmailVerification<P extends object>(
  Component: React.ComponentType<P>,
  feature?: string,
  options?: { showInlineMessage?: boolean; blockInteraction?: boolean }
) {
  return function EmailVerifiedComponent(props: P) {
    return (
      <EmailVerificationGuard 
        feature={feature}
        showInlineMessage={options?.showInlineMessage}
        blockInteraction={options?.blockInteraction}
      >
        <Component {...props} />
      </EmailVerificationGuard>
    );
  };
}

export default EmailVerificationGuard;
