// API interceptor for handling authentication errors

import { removeAuthToken } from '../auth';

export const handleUnauthorized = () => {
  // Remove token
  removeAuthToken();
  
  // Redirect to login
  if (typeof window !== 'undefined') {
    window.location.href = '/login';
  }
};

export const setupApiInterceptor = () => {
  // This can be used to intercept all API calls
  // For now, we'll handle it in individual API calls
};


