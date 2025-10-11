// Utility function to get the appropriate API URL based on current host
export function getApiUrl(): string {
  // If we have an environment variable, use it
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }

  // If we're on the client side, detect the current host
  if (typeof window !== 'undefined') {
    const currentHost = window.location.hostname;
    
    // If accessing through localhost, use localhost for API
    if (currentHost === 'localhost' || currentHost === '127.0.0.1') {
      return 'http://localhost:3001/api';
    }
    
    // If accessing through network IP, use the same IP for API
    return `http://${currentHost}:3001/api`;
  }

  // Default fallback for server-side rendering
  return process.env.NODE_ENV === 'production' 
    ? 'https://flipychat.com/api'  // Replace with your VPS IP
    : 'http://localhost:3001/api';
}

// Utility function to get the socket URL (API URL without /api)
export function getSocketUrl(): string {
  return getApiUrl().replace('/api', '');
}
