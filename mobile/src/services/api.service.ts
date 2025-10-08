// API Service for React Native
import axios, { AxiosInstance, AxiosError } from 'axios';
import { API_BASE_URL, API_ENDPOINTS, ERROR_MESSAGES } from '../constants';
import {
  ApiResponse,
  AuthResponse,
  UpdateProfileRequest,
  UpdateLocationRequest,
} from '../types';
import { getToken, removeToken } from './storage.service';

class ApiService {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      async (config) => {
        const token = await getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        if (error.response?.status === 401 || error.response?.status === 403) {
          // Clear auth data
          await removeToken();
          // Note: Navigation will be handled by useAuth hook
        }
        return Promise.reject(error);
      }
    );
  }

  // Auth endpoints
  async sendOTP(mobileNumber: string): Promise<ApiResponse> {
    try {
      const response = await this.api.post(API_ENDPOINTS.AUTH.SEND_OTP, {
        mobileNumber,
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async login(mobileNumber: string, otp: string): Promise<AuthResponse> {
    try {
      const response = await this.api.post(API_ENDPOINTS.AUTH.LOGIN, {
        mobileNumber,
        otp,
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async logout(): Promise<ApiResponse> {
    try {
      const response = await this.api.post(API_ENDPOINTS.AUTH.LOGOUT);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // User endpoints
  async getProfile(): Promise<ApiResponse> {
    try {
      const response = await this.api.get(API_ENDPOINTS.USER.PROFILE);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async updateProfile(data: UpdateProfileRequest): Promise<ApiResponse> {
    try {
      const response = await this.api.put(API_ENDPOINTS.USER.PROFILE, data);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async updateLocation(data: UpdateLocationRequest): Promise<ApiResponse> {
    try {
      const response = await this.api.put(API_ENDPOINTS.USER.LOCATION, data);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Username endpoints
  async checkUsername(username: string): Promise<ApiResponse> {
    try {
      const response = await this.api.get(`${API_ENDPOINTS.USERNAME.CHECK}?username=${encodeURIComponent(username)}`);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  async updateUsername(username: string): Promise<ApiResponse> {
    try {
      const response = await this.api.put(API_ENDPOINTS.USERNAME.UPDATE, { username });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  private handleError(error: any): Error {
    if (axios.isAxiosError(error)) {
      if (error.response) {
        return new Error(error.response.data?.error || ERROR_MESSAGES.SERVER_ERROR);
      } else if (error.request) {
        return new Error(ERROR_MESSAGES.NETWORK_ERROR);
      }
    }
    return new Error(ERROR_MESSAGES.SERVER_ERROR);
  }
}

export const apiService = new ApiService();

