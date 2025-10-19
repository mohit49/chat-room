// API client with better error handling

import { ERROR_MESSAGES } from '@/constants';
import { removeAuthToken, isTokenExpired } from '../auth';
import { getApiUrl } from '../utils/apiUrl';

export class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    try {
      const url = `${this.baseURL}${endpoint}`;
      
      // For FormData, don't set Content-Type - let browser handle it
      const requestOptions: RequestInit = {
        method: options.method,
        body: options.body,
        credentials: 'include',
      };

      // Only add headers if provided
      if (options.headers && Object.keys(options.headers).length > 0) {
        requestOptions.headers = options.headers;
      }
      
      const response = await fetch(url, requestOptions);
      

      // Handle unauthorized (401) or forbidden (403)
      if (response.status === 401) {
        removeAuthToken();
        throw new Error(ERROR_MESSAGES.UNAUTHORIZED);
      }
      
      if (response.status === 403) {
        const data = await response.json();
        throw new Error(data.error || 'Access denied');
      }

      const data = await response.json();

      if (!response.ok) {
        console.error('API Client error response:', data);
        throw new Error(data.error || ERROR_MESSAGES.SERVER_ERROR);
      }

      return data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(ERROR_MESSAGES.NETWORK_ERROR);
    }
  }

  async get<T>(endpoint: string, token?: string): Promise<T> {
    // Check if token is expired before making request
    if (token && isTokenExpired(token)) {
      removeAuthToken();
      throw new Error('Token expired. Please login again.');
    }
    
    return this.request<T>(endpoint, {
      method: 'GET',
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
  }

  async post<T>(endpoint: string, data?: any, token?: string, customHeaders?: Record<string, string>): Promise<T> {
    // Check if token is expired before making request
    if (token && isTokenExpired(token)) {
      removeAuthToken();
      throw new Error('Token expired. Please login again.');
    }
    
    const isFormData = data instanceof FormData;
    
    return this.request<T>(endpoint, {
      method: 'POST',
      body: isFormData ? data : JSON.stringify(data),
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
        ...customHeaders,
      },
    });
  }

  async put<T>(endpoint: string, data?: any, token?: string): Promise<T> {
    // Check if token is expired before making request
    if (token && isTokenExpired(token)) {
      removeAuthToken();
      throw new Error('Token expired. Please login again.');
    }
    
    console.log('API Client PUT request:', {
      endpoint,
      data,
      hasToken: !!token,
      url: `${this.baseURL}${endpoint}`
    });
    
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        'Content-Type': 'application/json',
      },
    });
  }

  async delete<T>(endpoint: string, token?: string): Promise<T> {
    // Check if token is expired before making request
    if (token && isTokenExpired(token)) {
      removeAuthToken();
      throw new Error('Token expired. Please login again.');
    }
    
    return this.request<T>(endpoint, {
      method: 'DELETE',
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
  }
}

const API_URL = getApiUrl();
export const apiClient = new ApiClient(API_URL);


