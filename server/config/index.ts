import dotenv from 'dotenv';
import os from 'os';

// Load environment variables based on NODE_ENV
if (process.env.NODE_ENV === 'production') {
  dotenv.config({ path: '.env.production' });
} else {
  dotenv.config({ path: 'local.env' });
}

// Function to get network IP addresses for CORS
function getNetworkIPsForCORS(): string[] {
  const interfaces = os.networkInterfaces();
  const addresses: string[] = [];

  for (const name of Object.keys(interfaces)) {
    const iface = interfaces[name];
    if (iface) {
      for (const addr of iface) {
        // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
        if (addr.family === 'IPv4' && !addr.internal) {
          addresses.push(`http://${addr.address}:3000`);
          addresses.push(`http://${addr.address}:3002`);
        }
      }
    }
  }

  return addresses;
}

// Function to get CORS origins based on environment
function getCorsOrigins(): string[] {
  const origins: string[] = [];
  
  // Add localhost origins for development
  if (process.env.NODE_ENV === 'development') {
    origins.push('http://localhost:3000', 'http://localhost:3002');
  }
  
  // Add domain origins for production
  if (process.env.NODE_ENV === 'production') {
    const domain = process.env.DOMAIN || 'flipychat.com';
    const useHttps = process.env.USE_HTTPS === 'true' || process.env.NODE_ENV === 'production';
    const protocol = useHttps ? 'https' : 'http';
    
    origins.push(`${protocol}://${domain}`);
    origins.push(`${protocol}://www.${domain}`);
    
    // Add HTTP version if HTTPS is enabled (for redirects)
    if (useHttps) {
      origins.push(`http://${domain}`);
      origins.push(`http://www.${domain}`);
    }
  }
  
  // Add explicit CORS origins from environment
  if (process.env.CORS_ORIGIN) {
    origins.push(process.env.CORS_ORIGIN);
  }
  
  // Add additional CORS origins
  if (process.env.ADDITIONAL_CORS_ORIGINS) {
    const additionalOrigins = process.env.ADDITIONAL_CORS_ORIGINS.split(',').map(origin => origin.trim());
    origins.push(...additionalOrigins);
  }
  
  // Add network IPs for development
  if (process.env.NODE_ENV === 'development') {
    origins.push(...getNetworkIPsForCORS());
  }
  
  return [...new Set(origins)].filter(Boolean);
}

export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || (process.env.NODE_ENV === 'production' ? '80' : '3001'), 10),
  
  jwt: {
    secret: process.env.JWT_SECRET || 'fallback-secret-key',
    expiresIn: '1d',
  },
  
  cors: {
    origin: getCorsOrigins(),
    credentials: true,
  },
  
  database: {
    url: process.env.DATABASE_URL || 'mongodb://localhost:27017/chat-app',
  },
  
  api: {
    prefix: '/api',
    version: 'v1',
  },
  
  // Domain configuration for production
  domain: {
    name: process.env.DOMAIN || 'flipychat.com',
    useHttps: process.env.USE_HTTPS === 'true' || process.env.NODE_ENV === 'production',
    sslCertPath: process.env.SSL_CERT_PATH,
    sslKeyPath: process.env.SSL_KEY_PATH,
  },
} as const;

export default config;



