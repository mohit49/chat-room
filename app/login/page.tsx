'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/lib/contexts/AuthContext';
import { api } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const { user, loading, isAuthenticated, login } = useAuth();
  const [mobileNumber, setMobileNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'mobile' | 'otp'>('mobile');
  const [localError, setLocalError] = useState('');
  const [mockOtp, setMockOtp] = useState('');
  const [networkInfo, setNetworkInfo] = useState<any>(null);

  // Fetch network information on component mount
  useEffect(() => {
    const fetchNetworkInfo = async () => {
      try {
        // Use the API client to get the proper URL
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
        const response = await fetch(`${apiUrl}/network-info`);
        const data = await response.json();
        if (data.success) {
          setNetworkInfo(data);
        }
      } catch (error) {
        console.error('Failed to fetch network info:', error);
        // Don't show error to user, just log it
      }
    };

    fetchNetworkInfo();
  }, []);

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');

    try {
      console.log('Sending OTP request for:', mobileNumber);
      const data = await api.sendOTP(mobileNumber);
      console.log('Response data:', data);
      
      if (data.success) {
        setStep('otp');
        if (data.mockOTP) {
          setMockOtp(data.mockOTP);
        }
      } else {
        setLocalError(data.error || 'Failed to send OTP');
      }
    } catch (err) {
      console.error('Send OTP error:', err);
      setLocalError('Failed to send OTP. Please try again.');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');

    const success = await login(mobileNumber, otp);
    
    if (success) {
      console.log('Login successful, redirect will be handled automatically');
    } else {
      setLocalError('Login failed. Please try again.');
    }
  };

  // Show loading while checking authentication
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

  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <Card className="w-full max-w-md mx-4">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Welcome</CardTitle>
          <CardDescription className="text-center">
            {step === 'mobile' 
              ? 'Enter your mobile number to continue'
              : 'Enter the OTP sent to your mobile'}
          </CardDescription>
          {step === 'mobile' && (
            <div className="mt-4 space-y-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  <p className="text-sm text-blue-800 font-medium">Demo Mode</p>
                </div>
                <p className="text-xs text-blue-700 mt-2">
                  A random 6-digit OTP will be generated and displayed below for any mobile number you enter.
                </p>
              </div>
              
              {networkInfo && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <p className="text-sm text-green-800 font-medium">Network Access URLs</p>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="text-xs text-green-700">
                      <p className="font-medium">Local Access:</p>
                      <p className="font-mono bg-white px-2 py-1 rounded border">{networkInfo.localhost.frontend}</p>
                    </div>
                    
                    {networkInfo.network.length > 0 && (
                      <div className="text-xs text-green-700">
                        <p className="font-medium">Network Access (for other devices):</p>
                        <div className="space-y-1 mt-1">
                          {networkInfo.network.map((ip: any, index: number) => (
                            <div key={index} className="bg-white px-2 py-1 rounded border">
                              <p className="font-mono">{ip.frontend}</p>
                              <p className="text-green-600 text-xs">({ip.interface}: {ip.address})</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
                    <p className="font-medium">💡 Demo Instructions:</p>
                    <ul className="mt-1 space-y-1">
                      {networkInfo.demo.instructions.map((instruction: string, index: number) => (
                        <li key={index}>{instruction}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardHeader>
        <CardContent>
          {step === 'mobile' ? (
            <form onSubmit={handleSendOTP} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="mobile">Mobile Number</Label>
                <Input
                  id="mobile"
                  type="tel"
                  placeholder="+1 234 567 8900"
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value)}
                  required
                />
                {mockOtp && (
                  <div className="p-4 bg-green-50 border-2 border-green-300 rounded-lg shadow-sm">
                    <div className="flex items-center space-x-2 mb-3">
                      <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                      <p className="text-sm font-semibold text-green-800">Your OTP is Ready!</p>
                    </div>
                    <div className="bg-white p-3 rounded border border-green-200 mb-3">
                      <p className="text-center text-2xl font-mono font-bold text-green-900 tracking-wider">
                        {mockOtp}
                      </p>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-green-600">
                        <p>⏰ Expires in 5 minutes</p>
                        <p className="italic">For local development only</p>
                      </div>
                      <button
                        type="button"
                        className="px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors font-medium"
                        onClick={() => {
                          navigator.clipboard.writeText(mockOtp);
                          alert(`OTP ${mockOtp} copied to clipboard!`);
                        }}
                      >
                        📋 Copy OTP
                      </button>
                    </div>
                  </div>
                )}
              </div>
              {localError && <p className="text-sm text-red-500">{localError}</p>}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Sending...' : 'Send OTP'}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="otp">Enter OTP</Label>
                <div className="relative">
                  <Input
                    id="otp"
                    type="text"
                    placeholder="123456"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    required
                    maxLength={6}
                    className="pr-20"
                  />
                  {mockOtp && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="absolute right-1 top-1 h-8 px-2 text-xs"
                      onClick={() => setOtp(mockOtp)}
                    >
                      Fill
                    </Button>
                  )}
                </div>
                {mockOtp && (
                  <div className="p-4 bg-green-50 border-2 border-green-300 rounded-lg shadow-sm">
                    <div className="flex items-center space-x-2 mb-3">
                      <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                      <p className="text-sm font-semibold text-green-800">Demo Mode - Your OTP</p>
                    </div>
                    <div className="bg-white p-3 rounded border border-green-200 mb-3">
                      <p className="text-center text-2xl font-mono font-bold text-green-900 tracking-wider">
                        {mockOtp}
                      </p>
                    </div>
                    <div className="text-xs text-green-600 text-center">
                      <p>⏰ Expires in 5 minutes • For local development only</p>
                    </div>
                  </div>
                )}
              </div>
              {localError && <p className="text-sm text-red-500">{localError}</p>}
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setStep('mobile')}
                  className="flex-1"
                  disabled={loading}
                >
                  Back
                </Button>
                <Button type="submit" className="flex-1" disabled={loading}>
                  {loading ? 'Verifying...' : 'Verify & Login'}
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}



