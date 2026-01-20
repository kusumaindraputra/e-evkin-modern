/**
 * Axios API Client with interceptors, timeout, and retry logic
 * Provides global error handling and automatic token refresh
 */

import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { message } from 'antd';
import API_BASE_URL from '../config/api';

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second
const TIMEOUT = 30000; // 30 seconds

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add auth token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Get token from localStorage (zustand persist)
    const authStorage = localStorage.getItem('auth-storage');
    if (authStorage) {
      try {
        const parsed = JSON.parse(authStorage);
        const token = parsed?.state?.token;
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      } catch (e) {
        console.error('Failed to parse auth storage:', e);
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle errors and retry logic
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retryCount?: number };
    
    // Initialize retry count
    if (!originalRequest._retryCount) {
      originalRequest._retryCount = 0;
    }

    // Handle specific error types
    if (error.response) {
      const status = error.response.status;
      
      // Unauthorized - redirect to login
      if (status === 401) {
        localStorage.removeItem('auth-storage');
        if (window.location.pathname !== '/login') {
          message.error('Sesi Anda telah berakhir. Silakan login kembali.');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
      
      // Forbidden
      if (status === 403) {
        message.error('Anda tidak memiliki akses ke resource ini.');
        return Promise.reject(error);
      }
      
      // Server error - retry if applicable
      if (status >= 500 && (originalRequest._retryCount ?? 0) < MAX_RETRIES) {
        originalRequest._retryCount = (originalRequest._retryCount ?? 0) + 1;
        console.warn(`Retry attempt ${originalRequest._retryCount} for ${originalRequest.url}`);
        
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * (originalRequest._retryCount ?? 1)));
        return apiClient(originalRequest);
      }
    }
    
    // Network error - retry
    if (error.code === 'ECONNABORTED' || error.message === 'Network Error') {
      if ((originalRequest._retryCount ?? 0) < MAX_RETRIES) {
        originalRequest._retryCount = (originalRequest._retryCount ?? 0) + 1;
        console.warn(`Network retry attempt ${originalRequest._retryCount} for ${originalRequest.url}`);
        
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * (originalRequest._retryCount ?? 1)));
        return apiClient(originalRequest);
      }
      
      message.error('Koneksi jaringan bermasalah. Silakan coba lagi.');
    }
    
    // Timeout error
    if (error.code === 'ECONNABORTED') {
      message.error('Request timeout. Server tidak merespons.');
    }

    return Promise.reject(error);
  }
);

export default apiClient;

// Helper function for API calls with loading state
export const withLoading = async <T>(
  promise: Promise<T>,
  setLoading?: (loading: boolean) => void
): Promise<T> => {
  try {
    setLoading?.(true);
    return await promise;
  } finally {
    setLoading?.(false);
  }
};
