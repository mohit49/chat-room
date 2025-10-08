'use client';

// This page will be automatically redirected by GlobalAuthChecker
// No need for manual redirect logic here
export default function Home() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto mb-4"></div>
        <p>Redirecting...</p>
      </div>
    </div>
  );
}
