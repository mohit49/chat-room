// Auth utilities and context

export const getAuthToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token');
  }
  return null;
};

export const setAuthToken = (token: string): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('token', token);
  }
};

export const removeAuthToken = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('token');
    // Dispatch custom event to notify auth context
    window.dispatchEvent(new CustomEvent('authTokenRemoved'));
  }
};

export const isTokenExpired = (token: string): boolean => {
  try {
    // Decode JWT token without verification (we just need the payload)
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    
    const payload = JSON.parse(jsonPayload);
    const currentTime = Math.floor(Date.now() / 1000);
    
    // Check if token is expired (exp field is in seconds)
    return payload.exp < currentTime;
  } catch (error) {
    // If we can't decode the token, consider it expired
    console.error('Error decoding token:', error);
    return true;
  }
};

export const isAuthenticated = (): boolean => {
  const token = getAuthToken();
  if (!token) {
    return false;
  }
  
  // Check if token is expired
  if (isTokenExpired(token)) {
    // Remove expired token
    removeAuthToken();
    return false;
  }
  
  return true;
};



