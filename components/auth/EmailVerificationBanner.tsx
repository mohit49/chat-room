'use client';

import { useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/lib/contexts/AuthContext';
import { Mail, AlertCircle, CheckCircle, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function EmailVerificationBanner() {
  const { user, emailVerified, verifyEmail, resendVerification } = useAuth();
  const [otp, setOtp] = useState('');
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [mockOtp, setMockOtp] = useState('');
  const { toast } = useToast();

  // Don't show banner if email is verified or user is not authenticated
  if (!user || emailVerified) {
    return null;
  }

  const handleVerify = async () => {
    if (!otp || otp.length !== 6) {
      toast({
        title: 'Invalid OTP',
        description: 'Please enter a 6-digit OTP',
        variant: 'destructive',
      });
      return;
    }

    setIsVerifying(true);
    try {
      const success = await verifyEmail(user.email, otp);
      
      if (success) {
        toast({
          title: 'Email Verified!',
          description: 'Your email has been successfully verified.',
        });
        setShowOtpInput(false);
        setOtp('');
        setMockOtp('');
      } else {
        toast({
          title: 'Verification Failed',
          description: 'Invalid or expired OTP. Please try again.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to verify email. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendVerification = async () => {
    setIsResending(true);
    try {
      const result = await resendVerification(user.email);
      
      if (result.success) {
        setShowOtpInput(true);
        setMockOtp(result.verificationOTP || '');
        toast({
          title: 'Verification Email Sent',
          description: 'Please check your email for the verification code.',
        });
      } else {
        toast({
          title: 'Failed to Send',
          description: 'Could not send verification email. Please try again later.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to resend verification email.',
        variant: 'destructive',
      });
    } finally {
      setIsResending(false);
    }
  };

  return (
    <Alert className="mb-4 border-yellow-500 bg-yellow-50 dark:bg-yellow-950 dark:border-yellow-900">
      <div className="flex items-start gap-3">
        <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-500 mt-0.5" />
        <div className="flex-1">
          <AlertDescription className="text-yellow-800 dark:text-yellow-200">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div className="flex-1">
                <p className="font-semibold mb-1">Email Verification Required</p>
                <p className="text-sm">
                  Please verify your email address <strong>{user.email}</strong> to access all features.
                  {!showOtpInput && ' Check your inbox for the verification code.'}
                </p>
              </div>
              
              {!showOtpInput ? (
                <div className="flex gap-2">
                  <Button
                    onClick={() => setShowOtpInput(true)}
                    variant="outline"
                    size="sm"
                    className="border-yellow-600 text-yellow-800 hover:bg-yellow-100 dark:border-yellow-500 dark:text-yellow-200 dark:hover:bg-yellow-900"
                  >
                    <Mail className="h-4 w-4 mr-2" />
                    Enter Code
                  </Button>
                  <Button
                    onClick={handleResendVerification}
                    disabled={isResending}
                    variant="outline"
                    size="sm"
                    className="border-yellow-600 text-yellow-800 hover:bg-yellow-100 dark:border-yellow-500 dark:text-yellow-200 dark:hover:bg-yellow-900"
                  >
                    {isResending ? 'Sending...' : 'Resend Code'}
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Input
                    type="text"
                    placeholder="123456"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    maxLength={6}
                    className="w-32 bg-white dark:bg-gray-800"
                  />
                  <Button
                    onClick={handleVerify}
                    disabled={isVerifying || otp.length !== 6}
                    size="sm"
                    className="bg-yellow-600 hover:bg-yellow-700 text-white"
                  >
                    {isVerifying ? 'Verifying...' : 'Verify'}
                  </Button>
                  <Button
                    onClick={() => {
                      setShowOtpInput(false);
                      setOtp('');
                      setMockOtp('');
                    }}
                    variant="ghost"
                    size="sm"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>

            {/* Show mock OTP in development */}
            {mockOtp && process.env.NODE_ENV !== 'production' && (
              <div className="mt-3 p-3 bg-green-50 dark:bg-green-950 border-2 border-green-300 dark:border-green-700 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-green-800 dark:text-green-200">Development Mode - Your OTP:</p>
                    <p className="text-2xl font-mono font-bold text-green-900 dark:text-green-100 tracking-wider mt-1">
                      {mockOtp}
                    </p>
                  </div>
                  <Button
                    onClick={() => {
                      setOtp(mockOtp);
                      toast({
                        title: 'OTP Filled',
                        description: 'Click Verify to complete email verification.',
                      });
                    }}
                    size="sm"
                    variant="outline"
                    className="border-green-600 text-green-800 dark:text-green-200"
                  >
                    Fill OTP
                  </Button>
                </div>
              </div>
            )}
          </AlertDescription>
        </div>
      </div>
    </Alert>
  );
}

