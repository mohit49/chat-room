// Application constants

export const API_ENDPOINTS = {
  AUTH: {
    SEND_OTP: '/auth/send-otp',
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
  },
  USER: {
    PROFILE: '/user/profile',
    LOCATION: '/user/location',
    SEARCH: '/user/search',
    UPDATE_MOBILE: '/user/update-mobile',
    MESSAGES: '/user/messages',
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
  AUTH_TOKEN: 'token',
  USER_DATA: 'userData',
} as const;

export const ERROR_MESSAGES = {
  UNAUTHORIZED: 'Access denied. Please login again.',
  INVALID_TOKEN: 'Invalid or expired token',
  INVALID_CREDENTIALS: 'Invalid credentials',
  SERVER_ERROR: 'Internal server error. Please try again.',
  NETWORK_ERROR: 'Network error. Please check your connection.',
  MOBILE_REQUIRED: 'Mobile number is required',
  OTP_REQUIRED: 'OTP is required',
} as const;

export const SUCCESS_MESSAGES = {
  OTP_SENT: 'OTP sent successfully',
  LOGIN_SUCCESS: 'Login successful',
  LOGOUT_SUCCESS: 'Logged out successfully',
  PROFILE_UPDATED: 'Profile updated successfully',
  LOCATION_UPDATED: 'Location updated successfully',
} as const;

