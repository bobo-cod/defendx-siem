// src/lib/api/wazuh-client.ts
// Complete Wazuh API client with authentication and error handling

import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { WazuhAPIResponse } from '@/types/wazuh';

interface WazuhAuthResponse {
  data: {
    token: string;
  };
}

class WazuhAPIClient {
  private client: AxiosInstance;
  private token: string | null = null;
  private tokenExpiry: number | null = null;
  private baseURL: string;
  private username: string;
  private password: string;

  constructor() {
    this.baseURL = process.env.WAZUH_API_URL || 'https://localhost:55000';
    this.username = process.env.WAZUH_API_USERNAME || '';
    this.password = process.env.WAZUH_API_PASSWORD || '';

    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
      // Disable SSL verification for self-signed certificates (use carefully in production)
      httpsAgent: {
        rejectUnauthorized: false,
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor - add auth token
    this.client.interceptors.request.use(
      async (config: InternalAxiosRequestConfig) => {
        // Skip auth for login endpoint
        if (config.url?.includes('/security/user/authenticate')) {
          return config;
        }

        // Check if token needs refresh
        if (this.shouldRefreshToken()) {
          await this.authenticate();
        }

        if (this.token && config.headers) {
          config.headers.Authorization = `Bearer ${this.token}`;
        }

        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor - handle errors
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & {
          _retry?: boolean;
        };

        // If 401 and not already retried, try to refresh token
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          await this.authenticate();
          
          if (this.token && originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${this.token}`;
          }
          
          return this.client(originalRequest);
        }

        return Promise.reject(this.handleError(error));
      }
    );
  }

  private shouldRefreshToken(): boolean {
    if (!this.token || !this.tokenExpiry) {
      return true;
    }
    // Refresh if token expires in less than 5 minutes
    return Date.now() > this.tokenExpiry - 5 * 60 * 1000;
  }

  async authenticate(): Promise<void> {
    try {
      const response = await axios.post<WazuhAuthResponse>(
        `${this.baseURL}/security/user/authenticate`,
        {},
        {
          auth: {
            username: this.username,
            password: this.password,
          },
          httpsAgent: {
            rejectUnauthorized: false,
          },
        }
      );

      this.token = response.data.data.token;
      // Wazuh tokens typically expire in 15 minutes (900 seconds)
      this.tokenExpiry = Date.now() + 900 * 1000;
    } catch (error) {
      console.error('Wazuh authentication failed:', error);
      throw new Error('Failed to authenticate with Wazuh API');
    }
  }

  private handleError(error: AxiosError): Error {
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data as any;

      switch (status) {
        case 401:
          return new Error('Unauthorized: Invalid credentials');
        case 403:
          return new Error('Forbidden: Insufficient permissions');
        case 404:
          return new Error('Not found: Resource does not exist');
        case 500:
          return new Error('Internal server error: Wazuh API error');
        default:
          return new Error(
            data?.message || `API error: ${status}`
          );
      }
    } else if (error.request) {
      return new Error('Network error: Cannot reach Wazuh API');
    } else {
      return new Error(error.message || 'Unknown error occurred');
    }
  }

  // Generic GET request
  async get<T>(endpoint: string, params?: any): Promise<WazuhAPIResponse<T>> {
    const response = await this.client.get<WazuhAPIResponse<T>>(endpoint, {
      params,
    });
    return response.data;
  }

  // Generic POST request
  async post<T>(endpoint: string, data?: any): Promise<WazuhAPIResponse<T>> {
    const response = await this.client.post<WazuhAPIResponse<T>>(
      endpoint,
      data
    );
    return response.data;
  }

  // Generic PUT request
  async put<T>(endpoint: string, data?: any): Promise<WazuhAPIResponse<T>> {
    const response = await this.client.put<WazuhAPIResponse<T>>(endpoint, data);
    return response.data;
  }

  // Generic DELETE request
  async delete<T>(endpoint: string): Promise<WazuhAPIResponse<T>> {
    const response = await this.client.delete<WazuhAPIResponse<T>>(endpoint);
    return response.data;
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      await this.get('/');
      return true;
    } catch {
      return false;
    }
  }

  // Get API info
  async getAPIInfo() {
    return this.get('/');
  }
}

// Singleton instance
export const wazuhClient = new WazuhAPIClient();
