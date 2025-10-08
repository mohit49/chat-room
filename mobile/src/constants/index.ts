// Mobile constants

// Update this with your computer's IP address for Android testing
// Use 'localhost' for iOS simulator
export const API_BASE_URL = __DEV__
  ? 'http://10.0.2.2:3001/api' // Android emulator
  // ? 'http://localhost:3001/api' // iOS simulator
  // ? 'http://YOUR_COMPUTER_IP:3001/api' // Physical device
  : 'https://your-production-api.com/api'; // Production

export const API_ENDPOINTS = {
  AUTH: {
    SEND_OTP: '/auth/send-otp',
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
  },
  USER: {
    PROFILE: '/user/profile',
    LOCATION: '/user/location',
  },
  USERNAME: {
    CHECK: '/username/check',
    UPDATE: '/username/update',
  },
} as const;

export const GENDER_OPTIONS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
] as const;

export const TOKEN_EXPIRY = {
  ACCESS_TOKEN: '7d',
  REFRESH_TOKEN: '30d',
} as const;

export const STORAGE_KEYS = {
  AUTH_TOKEN: '@auth_token',
  USER_DATA: '@user_data',
} as const;

export const ERROR_MESSAGES = {
  UNAUTHORIZED: 'Access denied. Please login again.',
  INVALID_TOKEN: 'Invalid or expired token',
  INVALID_CREDENTIALS: 'Invalid credentials',
  SERVER_ERROR: 'Internal server error. Please try again.',
  NETWORK_ERROR: 'Network error. Please check your connection.',
  MOBILE_REQUIRED: 'Mobile number is required',
  OTP_REQUIRED: 'OTP is required',
  LOCATION_PERMISSION_DENIED: 'Location permission denied',
  LOCATION_UNAVAILABLE: 'Location services unavailable',
} as const;

export const SUCCESS_MESSAGES = {
  OTP_SENT: 'OTP sent successfully',
  LOGIN_SUCCESS: 'Login successful',
  LOGOUT_SUCCESS: 'Logged out successfully',
  PROFILE_UPDATED: 'Profile updated successfully',
  LOCATION_UPDATED: 'Location updated successfully',
} as const;

export const COLORS = {
  primary: '#3b82f6',
  secondary: '#8b5cf6',
  success: '#10b981',
  error: '#ef4444',
  warning: '#f59e0b',
  background: '#ffffff',
  surface: '#f9fafb',
  text: '#111827',
  textSecondary: '#6b7280',
  border: '#e5e7eb',
  inputBackground: '#f3f4f6',
} as const;

export const DARK_COLORS = {
  primary: '#3b82f6',
  secondary: '#8b5cf6',
  success: '#10b981',
  error: '#ef4444',
  warning: '#f59e0b',
  background: '#0f172a',
  surface: '#1e293b',
  text: '#f8fafc',
  textSecondary: '#94a3b8',
  border: '#334155',
  inputBackground: '#1e293b',
} as const;

export const getThemeColors = (isDark: boolean) => {
  return isDark ? DARK_COLORS : COLORS;
};

