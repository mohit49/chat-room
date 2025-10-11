import dotenv from 'dotenv';
import os from 'os';
import path from 'path';

// Load environment variables based on NODE_ENV
const envFile = process.env.NODE_ENV === 'production' ? 'prod.env' : 'local.env';
console.log(`🔧 Loading environment file: ${envFile}`);
dotenv.config({ path: path.resolve(process.cwd(), envFile) });

// Also load .env.local if it exists (for backward compatibility)
dotenv.config({ path: '.env.local' });

// Function to get network IP addresses for CORS
function getNetworkIPsForCORS() {
  const interfaces = os.networkInterfaces();
  const addresses = [];

  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
      if (iface.family === 'IPv4' && !iface.internal) {
        addresses.push(`http://${iface.address}:3000`);
        addresses.push(`http://${iface.address}:3002`);
      }
    }
  }

  return addresses;
}

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || (process.env.NODE_ENV === 'production' ? '80' : '3001'), 10),
  
  jwt: {
    secret: process.env.JWT_SECRET || 'fallback-secret-key',
    expiresIn: '1d',
  },
  
  cors: {
    origin: [
      'http://localhost:3000',
      'http://localhost:3002',
      'https://flipychat.com',
      'http://flipychat.com',
      // Environment-specific URLs
      process.env.FRONTEND_URL,
      process.env.CORS_ORIGIN,
      process.env.ADDITIONAL_CORS_ORIGINS?.split(','),
      ...getNetworkIPsForCORS()
    ].filter(Boolean).flat(),
    credentials: true,
  },
  
  database: {
    url: process.env.DATABASE_URL || 'mongodb://localhost:27017/chat-app',
  },
  
  api: {
    prefix: '/api',
    version: 'v1',
  },
} as const;

export default config;



