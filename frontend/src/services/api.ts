import axios from 'axios';
import type { AxiosInstance, AxiosError } from 'axios';

const API_BASE_URL = (import.meta.env.VITE_API_URL as string) || 'http://localhost:4444';

class ApiClient {
  public client: AxiosInstance;

  constructor(baseURL: string) {
    this.client = axios.create({
      baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add response interceptor to handle errors
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Clear auth data on 401
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Health endpoint
  async getHealth() {
    const response = await this.client.get<{
      status: string;
      timestamp: string;
      uptime: number;
      version?: string;
      environment?: string;
    }>('/health');
    return response.data;
  }

  // Metrics endpoint
  async getMetrics() {
    const response = await this.client.get<string>('/metrics', {
      responseType: 'text' as any,
    });
    return response.data;
  }

  // Example endpoints
  async getExample() {
    const response = await this.client.get<{
      message: string;
      timestamp: string;
      requestId: string;
      traceId: string;
      data: {
        items: Array<{ id: number; name: string; value: number }>;
      };
    }>('/api/example');
    return response.data;
  }

  async createExample(data: { name: string; value: number }) {
    const response = await this.client.post<{
      message: string;
      item: {
        id: number;
        name: string;
        value: number;
        createdAt: string;
      };
    }>('/api/example', data);
    return response.data;
  }

  async testError() {
    const response = await this.client.get<{
      message: string;
      tip?: string;
    }>('/api/example/error');
    return response.data;
  }

  // Auth endpoints
  async login(email: string, password: string) {
    const response = await this.client.post<{
      success: boolean;
      message: string;
      user: {
        id: string;
        username: string;
        email: string;
        isActive: boolean;
        createdAt: string;
        updatedAt: string;
      };
      token: string;
    }>('/api/auth/login', { email, password });
    return response.data;
  }

  async register(data: { username: string; email: string; password: string }) {
    const response = await this.client.post<{
      success: boolean;
      message: string;
      user: {
        id: string;
        username: string;
        email: string;
        isActive: boolean;
        createdAt: string;
        updatedAt: string;
      };
      token: string;
    }>('/api/auth/register', data);
    return response.data;
  }

  // User endpoints (protected)
  async getProfile() {
    const response = await this.client.get<{
      success: boolean;
      user: {
        id: string;
        email: string;
        username: string;
        isActive: boolean;
        createdAt: string;
        updatedAt: string;
      };
    }>('/api/user/profile');
    return response.data;
  }

  async updateProfile(data: { username?: string; email?: string }) {
    const response = await this.client.put<{
      success: boolean;
      message: string;
      user: {
        id: string;
        email: string;
        username: string;
        isActive: boolean;
        createdAt: string;
        updatedAt: string;
      };
    }>('/api/user/profile', data);
    return response.data;
  }
}

const apiClient = new ApiClient(API_BASE_URL);

// Export both the client instance and the axios instance for auth context
export default apiClient.client;
export { apiClient };