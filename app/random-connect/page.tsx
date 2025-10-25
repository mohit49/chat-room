'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useSocket } from '@/lib/contexts/SocketContext';

// Dynamically import RandomChatWidget with no SSR to avoid hydration issues
const RandomChatWidget = dynamic(() => import('@/components/chat/RandomChatWidget'), {
  ssr: false,
  loading: () => (
    <div className="h-screen w-screen fixed inset-0 bg-black flex items-center justify-center">
      <div className="text-center text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4"></div>
        <p className="text-gray-400">Loading Random Connect...</p>
      </div>
    </div>
  ),
});

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
        <p className="mt-2 text-sm text-gray-600">Loading...</p>
      </div>
    </div>
  );
}

function ConnectingScreen({ onGoHome }: { onGoHome: () => void }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Connecting...
          </h2>
          <p className="text-gray-600 mb-6">
            Please wait while we establish your connection.
          </p>
          <button 
            onClick={onGoHome}
            className="w-full px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            Go to Home
          </button>
        </div>
      </div>
    </div>
  );
}

export default function RandomConnectPage() {
  const { user, isAuthenticated, loading } = useAuth();
  const { socket, connected, connectionConfirmed } = useSocket();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  // Handle client-side mounting to avoid hydration issues
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, loading, router]);

  const handleGoHome = () => {
    router.push('/home');
  };

  // Show loading during SSR and initial client mount
  if (!mounted || loading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    return null;
  }

  // Show connecting message if socket is not connected yet
  if (!socket || !connected || !connectionConfirmed) {
    return <ConnectingScreen onGoHome={handleGoHome} />;
  }

  return (
    <div className="h-screen w-screen fixed inset-0 bg-black">
      <RandomChatWidget />
    </div>
  );
}
