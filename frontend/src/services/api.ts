import axios, { AxiosInstance, AxiosError, AxiosResponse } from 'axios';
import { useAuthStore } from '../store/authStore';
import { CSRFProtection, rateLimiter } from '../utils/security';

/**
 * Enhanced API Error interface
 */
export interface ApiError extends Error {
  status: number;
  data: any;
  isNetworkError: boolean;
  isTimeoutError: boolean;
  isServerError: boolean;
  isClientError: boolean;
}

/**
 * Create enhanced API error
 */
const createApiError = (error: AxiosError): ApiError => {
  const status = error.response?.status || 0;
  const message = 
    (error.response?.data as any)?.message ||
    (error.response?.data as any)?.error ||
    error.message;

  const apiError = new Error(message) as ApiError;
  apiError.name = 'ApiError';
  apiError.status = status;
  apiError.data = error.response?.data;
  apiError.isNetworkError = !error.response && !!error.request;
  apiError.isTimeoutError = error.code === 'ECONNABORTED';
  apiError.isServerError = status >= 500;
  apiError.isClientError = status >= 400 && status < 500;

  return apiError;
};

/**
 * Create and configure Axios API client with interceptors
 * - Request interceptor: Adds JWT token and CSRF protection to Authorization header
 * - Response interceptor: Handles errors and token refresh
 * Requirement 3.4.2: Handle API errors gracefully
 * Requirement 3.2.3: CSRF protection
 * Requirement 3.2.4: Rate limiting on client side
 */
const createApiClient = (): AxiosInstance => {
  const apiClient = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4001',
    timeout: 10000,
    withCredentials: true, // Include cookies for httpOnly token
  });

  /**
   * Request Interceptor: Add JWT token, CSRF protection, and rate limiting
   * Requirement 2.2: Implement JWT token handling in request interceptor
   * Requirement 3.2.3: CSRF protection
   * Requirement 3.2.4: Rate limiting
   */
  apiClient.interceptors.request.use(
    (config) => {
      // Check rate limit for API calls
      if (!rateLimiter.isAllowed('api-calls')) {
        const timeUntilReset = rateLimiter.getTimeUntilReset('api-calls');
        throw new Error(`API rate limit exceeded. Please wait ${Math.ceil(timeUntilReset / 1000)} seconds.`);
      }

      const authStore = useAuthStore.getState();
      const token = authStore.token;

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      // Add CSRF token for state-changing requests
      if (['post', 'put', 'patch', 'delete'].includes(config.method?.toLowerCase() || '')) {
        config.headers['X-CSRF-Token'] = CSRFProtection.getToken();
      }

      // Add request timestamp for timeout tracking
      (config as any).metadata = { startTime: Date.now() };

      return config;
    },
    (error) => {
      return Promise.reject(createApiError(error));
    }
  );

  /**
   * Response Interceptor: Handle errors and token refresh
   * Requirement 2.3: Implement error handling in response interceptor
   */
  apiClient.interceptors.response.use(
    (response: AxiosResponse) => {
      // Add response time to metadata
      const config = response.config as any;
      if (config.metadata) {
        config.metadata.endTime = Date.now();
        config.metadata.duration = config.metadata.endTime - config.metadata.startTime;
      }

      return response;
    },
    async (error: AxiosError) => {
      const originalRequest = error.config as any;

      // Handle 401 Unauthorized - Token expired
      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;

        try {
          // Attempt to refresh token (would be implemented with backend)
          const authStore = useAuthStore.getState();
          
          // For now, just logout and redirect
          authStore.logout();
          
          // Only redirect if we're not already on the login page
          if (window.location.pathname !== '/login') {
            window.location.href = '/login';
          }
        } catch (refreshError) {
          return Promise.reject(createApiError(error));
        }
      }

      // Create enhanced error object
      return Promise.reject(createApiError(error));
    }
  );

  return apiClient;
};

/**
 * API client instance
 */
export const apiClient = createApiClient();

/**
 * Health check endpoint
 */
export const healthCheck = async (): Promise<boolean> => {
  try {
    await apiClient.get('/health');
    return true;
  } catch (error) {
    return false;
  }
};

/**
 * Check if error is retryable
 */
export const isRetryableError = (error: ApiError): boolean => {
  // Retry on network errors, timeouts, and 5xx server errors
  return (
    error.isNetworkError ||
    error.isTimeoutError ||
    error.isServerError ||
    error.status === 429 // Rate limit
  );
};

/**
 * Check if error requires authentication
 */
export const requiresAuth = (error: ApiError): boolean => {
  return error.status === 401;
};

/**
 * Check if error is a client error (4xx)
 */
export const isClientError = (error: ApiError): boolean => {
  return error.isClientError && error.status !== 401;
};

export default apiClient;
