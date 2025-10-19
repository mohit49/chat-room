import type { NextConfig } from "next";
import dotenv from 'dotenv';

// Load environment variables based on NODE_ENV
if (process.env.NODE_ENV === 'production') {
  dotenv.config({ path: '.env.production' });
} else {
  dotenv.config({ path: 'local.env' });
}

// Function to determine the API URL based on environment
function getApiUrl() {
  // If NEXT_PUBLIC_API_URL is explicitly set, use it
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }

  // For production, check if DOMAIN is set
  if (process.env.NODE_ENV === 'production') {
    const domain = process.env.DOMAIN || 'flipychat.com';
    const useHttps = process.env.USE_HTTPS === 'true' || process.env.NODE_ENV === 'production';
    const protocol = useHttps ? 'https' : 'http';
    return `${protocol}://${domain}/api`;
  }

  // For development, use localhost
  return 'http://localhost:3001/api';
}

const nextConfig: NextConfig = {
  /* config options here */
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_API_URL: getApiUrl(),
  },
  // Remove console logs in production
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'], // Keep error and warn logs
    } : false,
  },
  // Suppress hydration warnings in development
  ...(process.env.NODE_ENV === 'development' && {
    onDemandEntries: {
      maxInactiveAge: 25 * 1000,
      pagesBufferLength: 2,
    },
  }),
  // Allow network access
  experimental: {
    serverComponentsExternalPackages: ['mongoose'],
  },
  // PWA configuration
  async headers() {
    return [
      {
        source: '/manifest.json',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/manifest+json',
          },
        ],
      },
      {
        source: '/sw.js',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/javascript',
          },
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
