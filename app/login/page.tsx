'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/lib/contexts/AuthContext';
import { Eye, EyeOff, Mail, Lock, User, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function LoginPage() {
  const router = useRouter();
  const { user, loading, isAuthenticated, register, login } = useAuth();
  const { toast } = useToast();
  
  // Dynamic gradient backgrounds
  const gradients = [
    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', // Purple
    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', // Pink-Red
    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', // Blue-Cyan
    'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)', // Green-Cyan
    'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', // Pink-Yellow
    'linear-gradient(135deg, #30cfd0 0%, #330867 100%)', // Cyan-Purple
    'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)', // Soft Pastels
    'linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)', // Soft Pink
    'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)', // Peach
    'linear-gradient(135deg, #ff6e7f 0%, #bfe9ff 100%)', // Coral-Blue
    'linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 100%)', // Lavender-Blue
    'linear-gradient(135deg, #f8b195 0%, #f67280 100%)', // Coral-Rose
    'linear-gradient(135deg, #fbc2eb 0%, #a6c1ee 100%)', // Pink-Blue
    'linear-gradient(135deg, #fdcbf1 0%, #e6dee9 100%)', // Soft Purple
    'linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)', // Sky Blue
  ];
  
  // Select random gradient on mount
  const [backgroundGradient] = useState(() => {
    const randomIndex = Math.floor(Math.random() * gradients.length);
    return gradients[randomIndex];
  });
  
  // Login state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  
  // Register state
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerUsername, setRegisterUsername] = useState('');
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  
  // Common state
  const [localError, setLocalError] = useState('');
  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [mockOtp, setMockOtp] = useState('');

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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');

    if (!loginEmail || !loginPassword) {
      setLocalError('Please fill in all fields');
      return;
    }

    const success = await login(loginEmail, loginPassword);
    
    if (success) {
      console.log('Login successful, redirect will be handled automatically');
      toast({
        title: 'Login Successful',
        description: 'Welcome back to FlipyChat!',
      });
    } else {
      setLocalError('Invalid email or password. Please try again.');
      toast({
        title: 'Login Failed',
        description: 'Invalid email or password',
        variant: 'destructive',
      });
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');

    if (!registerEmail || !registerPassword || !registerUsername) {
      setLocalError('Please fill in all fields');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(registerEmail)) {
      setLocalError('Please enter a valid email address');
      return;
    }

    // Validate password strength
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;
    if (registerPassword.length < 8 || !passwordRegex.test(registerPassword)) {
      setLocalError('Password must be at least 8 characters with 1 uppercase, 1 lowercase, and 1 number');
      return;
    }

    // Validate username
    const usernameRegex = /^[a-zA-Z0-9][a-zA-Z0-9_\-\.!@#$%^&*()+=]{2,19}$/;
    if (!usernameRegex.test(registerUsername)) {
      setLocalError('Username must be 3-20 characters, start with letter/number, no spaces');
      return;
    }

    const result = await register(registerEmail, registerPassword, registerUsername);
    
    if (result.success) {
      setMockOtp(result.verificationOTP || '');
      toast({
        title: 'Registration Successful!',
        description: 'Please check your email for the verification code.',
      });
      // Don't redirect - let user stay to verify email or they'll see the banner on home
    } else {
      setLocalError('Registration failed. Email or username may already be in use.');
      toast({
        title: 'Registration Failed',
        description: 'Email or username may already be in use.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div 
      className="flex items-center justify-center min-h-screen md:px-4 px-0 relative overflow-hidden"
      style={{ background: backgroundGradient }}
    >
      {/* Animated gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-black/20 to-transparent"></div>
      
      {/* Floating orbs for extra effect */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      
      <Card className="w-full max-w-md md:max-w-md relative z-10 backdrop-blur-sm bg-white/95 dark:bg-gray-900/95 shadow-2xl md:rounded-lg rounded-none min-h-screen md:min-h-0">
        <CardHeader>
          {/* FlipyChat Logo */}
          <div className="flex justify-center mb-0">
            <img 
              src="/logo-icon.png" 
              alt="FlipyChat Logo" 
              className="h-16 w-16 rounded-xl shadow-lg hover:scale-105 transition-transform duration-300" 
            />
          </div>
          
          <CardTitle className="text-2xl font-bold text-center">Welcome to FlipyChat</CardTitle>
          <CardDescription className="text-center">
            Chat with random strangers instantly
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'login' | 'register')} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Register</TabsTrigger>
            </TabsList>

            {/* Login Tab */}
            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email" className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email
                  </Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="your@email.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="login-password" className="flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="login-password"
                      type={showLoginPassword ? 'text' : 'password'}
                      placeholder="Enter your password"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      required
                      autoComplete="current-password"
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPassword(!showLoginPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showLoginPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {localError && activeTab === 'login' && (
                  <p className="text-sm text-red-500">{localError}</p>
                )}

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Logging in...' : 'Login'}
                </Button>
              </form>
            </TabsContent>

            {/* Register Tab */}
            <TabsContent value="register">
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="register-email" className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email
                  </Label>
                  <Input
                    id="register-email"
                    type="email"
                    placeholder="your@email.com"
                    value={registerEmail}
                    onChange={(e) => setRegisterEmail(e.target.value)}
                    required
                    autoComplete="email"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="register-username" className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Username
                  </Label>
                  <Input
                    id="register-username"
                    type="text"
                    placeholder="johndoe"
                    value={registerUsername}
                    onChange={(e) => setRegisterUsername(e.target.value.toLowerCase())}
                    required
                    autoComplete="username"
                    minLength={3}
                    maxLength={20}
                  />
                  <p className="text-xs text-gray-500">
                    3-20 characters, alphanumeric and special characters allowed
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="register-password" className="flex items-center gap-2">
                    <Lock className="h-4 w-4" />
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      id="register-password"
                      type={showRegisterPassword ? 'text' : 'password'}
                      placeholder="Create a strong password"
                      value={registerPassword}
                      onChange={(e) => setRegisterPassword(e.target.value)}
                      required
                      autoComplete="new-password"
                      minLength={8}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showRegisterPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500">
                    At least 8 characters with 1 uppercase, 1 lowercase, and 1 number
                  </p>
                </div>

                {localError && activeTab === 'register' && (
                  <p className="text-sm text-red-500">{localError}</p>
                )}

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Creating Account...' : 'Create Account'}
                </Button>

                {/* Show verification OTP in development */}
                {mockOtp && process.env.NODE_ENV !== 'production' && (
                  <div className="p-4 bg-green-50 dark:bg-green-950 border-2 border-green-300 dark:border-green-700 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <p className="text-sm font-semibold text-green-800 dark:text-green-200">
                        Account Created! Verification OTP:
                      </p>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-3 rounded border border-green-300 dark:border-green-700 text-center">
                      <p className="text-2xl font-mono font-bold text-green-900 dark:text-green-100 tracking-wider">
                        {mockOtp}
                      </p>
                    </div>
                    <p className="text-xs text-green-700 dark:text-green-300 mt-2 text-center">
                      You can verify your email now or later from your profile
                    </p>
                  </div>
                )}
                
                {mockOtp && process.env.NODE_ENV === 'production' && (
                  <div className="p-4 bg-blue-50 dark:bg-blue-950 border-2 border-blue-300 dark:border-blue-700 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Mail className="h-5 w-5 text-blue-600" />
                      <p className="text-sm font-semibold text-blue-800 dark:text-blue-200">
                        Verification email sent to {registerEmail}
                      </p>
                    </div>
                    <p className="text-xs text-blue-700 dark:text-blue-300 mt-2">
                      Please check your inbox and enter the OTP to verify your account
                    </p>
                  </div>
                )}
              </form>
            </TabsContent>
          </Tabs>

          <div className="mt-6 text-center text-sm text-gray-600">
            <p>
              By continuing, you agree to our{' '}
              <a href="/privacy-policy" className="text-blue-600 hover:underline">
                Terms & Privacy Policy
              </a>
            </p>
            <p className="mt-2 text-xs">
              This platform is for users 16 years and older
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
