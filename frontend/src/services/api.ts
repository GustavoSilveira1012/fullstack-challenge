import axios, { AxiosInstance, AxiosError, AxiosResponse } from 'axios';
import { useAuthStore } from '../store/authStore';

/**
 * Create and configure Axios API client with interceptors
 * - Request interceptor: Adds JWT token to Authorization header
 * - Response interceptor: Handles errors and token refresh
 */
const createApiClient = (): AxiosInstance => {
  const apiClient = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4001',
    timeout: 10000,
    withCredentials: true, // Include cookies for httpOnly token
  });

  /**
   * Request Interceptor: Add JWT token to Authorization header
   * Requirement 2.2: Implement JWT token handling in request interceptor
   */
  apiClient.interceptors.request.use(
    (config) => {
      const authStore = useAuthStore.getState();
      const token = authStore.token;

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  /**
   * Response Interceptor: Handle errors and token refresh
   * Requirement 2.3: Implement error handling in response interceptor
   */
  apiClient.interceptors.response.use(
    (response: AxiosResponse) => {
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
          authStore.logout();
          window.location.href = '/login';
        } catch (refreshError) {
          return Promise.reject(refreshError);
        }
      }

      // Handle other errors
      if (error.response) {
        // Server responded with error status
        const errorMessage =
          (error.response.data as any)?.message ||
          (error.response.data as any)?.error ||
          error.message;

        return Promise.reject({
          status: error.response.status,
          message: errorMessage,
          data: error.response.data,
        });
      } else if (error.request) {
        // Request made but no response
        return Promise.reject({
          status: 0,
          message: 'No response from server',
          data: null,
        });
      } else {
        // Error in request setup
        return Promise.reject({
          status: 0,
          message: error.message,
          data: null,
        });
      }
    }
  );

  return apiClient;
};

export const apiClient = createApiClient();

export default apiClient;
