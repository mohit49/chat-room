'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/lib/api';
import { Loader2, Phone, Shield } from 'lucide-react';

interface MobileNumberUpdateProps {
  currentMobileNumber: string;
  onSuccess: () => void;
}

export default function MobileNumberUpdate({ currentMobileNumber, onSuccess }: MobileNumberUpdateProps) {
  const [step, setStep] = useState<'input' | 'verify'>('input');
  const [newMobileNumber, setNewMobileNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validate mobile number
    if (!newMobileNumber.trim()) {
      setError('Please enter a mobile number');
      return;
    }

    if (newMobileNumber === currentMobileNumber) {
      setError('New mobile number is the same as current one');
      return;
    }

    // Basic validation for 10-digit number
    if (!/^\d{10}$/.test(newMobileNumber)) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }

    try {
      setLoading(true);
      const response = await api.sendOTP(newMobileNumber);
      
      if (response.success) {
        setSuccess('OTP sent to ' + newMobileNumber);
        setStep('verify');
      } else {
        setError(response.error || 'Failed to send OTP');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!otp.trim()) {
      setError('Please enter the OTP');
      return;
    }

    if (!/^\d{6}$/.test(otp)) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }

    try {
      setLoading(true);
      
      // Call update mobile number API with OTP verification
      const response = await api.updateMobileNumber(newMobileNumber, otp);
      
      if (response.success) {
        setSuccess('Mobile number updated successfully!');
        setTimeout(() => {
          onSuccess();
        }, 1500);
      } else {
        setError(response.error || 'Failed to verify OTP');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to verify OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setError('');
    setOtp('');
    
    try {
      setLoading(true);
      const response = await api.sendOTP(newMobileNumber);
      
      if (response.success) {
        setSuccess('OTP resent successfully!');
      } else {
        setError(response.error || 'Failed to resend OTP');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to resend OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setStep('input');
    setOtp('');
    setError('');
    setSuccess('');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Phone className="h-5 w-5" />
          Update Mobile Number
        </CardTitle>
        <CardDescription>
          Current mobile number: {currentMobileNumber}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {step === 'input' ? (
          <form onSubmit={handleSendOTP} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newMobileNumber">New Mobile Number</Label>
              <Input
                id="newMobileNumber"
                type="tel"
                placeholder="Enter 10-digit mobile number"
                value={newMobileNumber}
                onChange={(e) => setNewMobileNumber(e.target.value.replace(/\D/g, ''))}
                maxLength={10}
                disabled={loading}
              />
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                {error}
              </div>
            )}

            {success && (
              <div className="text-sm text-green-600 bg-green-50 p-3 rounded-md">
                {success}
              </div>
            )}

            <Button type="submit" disabled={loading || !newMobileNumber} className="w-full">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending OTP...
                </>
              ) : (
                <>
                  <Shield className="mr-2 h-4 w-4" />
                  Send OTP
                </>
              )}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOTP} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="otp">Enter OTP</Label>
              <Input
                id="otp"
                type="text"
                placeholder="Enter 6-digit OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                maxLength={6}
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground">
                OTP sent to {newMobileNumber}
              </p>
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                {error}
              </div>
            )}

            {success && (
              <div className="text-sm text-green-600 bg-green-50 p-3 rounded-md">
                {success}
              </div>
            )}

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleBack}
                disabled={loading}
                className="flex-1"
              >
                Back
              </Button>
              <Button type="submit" disabled={loading || !otp} className="flex-1">
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  'Verify OTP'
                )}
              </Button>
            </div>

            <Button
              type="button"
              variant="link"
              onClick={handleResendOTP}
              disabled={loading}
              className="w-full"
            >
              Resend OTP
            </Button>
          </form>
        )}
      </CardContent>
    </Card>
  );
}

