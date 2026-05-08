import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';

// API client configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

// Create axios instance
export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add auth token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          throw new Error('No refresh token');
        }

        // Refresh token request
        const response = await axios.post(`${API_BASE_URL}/auth/refresh/`, {
          refresh: refreshToken,
        });

        const { access } = response.data;
        localStorage.setItem('accessToken', access);

        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${access}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Token refresh failed, logout user
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/auth';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// API endpoints
export const API_ENDPOINTS = {
  // Auth
  auth: {
    sendOTP: '/auth/send-otp/',
    verifyOTP: '/auth/verify-otp/',
    refresh: '/auth/refresh/',
    logout: '/auth/logout/',
    regions: '/auth/regions/',
  },
  // Users
  users: {
    me: '/users/me/',
    profile: '/users/me/',
    avatar: '/users/me/avatar/',
  },
  // License Types
  licenseTypes: '/license-types/',
  // Applications
  applications: {
    list: '/applications/',
    detail: (id: string) => `/applications/${id}/`,
    resubmit: (id: string) => `/applications/${id}/resubmit/`,
    timeline: (id: string) => `/applications/${id}/timeline/`,
  },
  // Licenses
  licenses: {
    list: '/licenses/',
    detail: (id: string) => `/licenses/${id}/`,
    pdf: (id: string) => `/licenses/${id}/pdf/`,
    qr: (id: string) => `/licenses/${id}/qr/`,
  },
  // Notifications
  notifications: {
    list: '/notifications/',
    read: (id: string) => `/notifications/${id}/read/`,
    readAll: '/notifications/read-all/',
  },
  // Admin
  admin: {
    applications: '/admin/applications/',
    licenses: '/admin/licenses/',
    users: '/admin/users/',
    statistics: '/admin/statistics/',
    reports: '/admin/reports/export/',
    auditLogs: '/admin/audit-logs/',
  },
  // Public
  verify: (licenseId: string) => `/verify/${licenseId}/`,
};

export default apiClient;
