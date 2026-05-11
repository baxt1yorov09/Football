'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiClient, API_ENDPOINTS } from '@/lib/api/client';

interface User {
  id: string;
  phone: string;
  full_name: string;
  role: string;
  region?: any;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
  });

  // Check authentication on mount
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      fetchUser();
    } else {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  const fetchUser = async () => {
    try {
      const response = await apiClient.get(API_ENDPOINTS.auth.me);
      setState({
        user: response.data,
        isLoading: false,
        isAuthenticated: true,
      });
    } catch (error) {
      // Token expired or invalid
      logout();
    }
  };

  const login = useCallback(async (phone: string, code: string) => {
    try {
      console.log('Sending OTP verification:', { phone, code });
      const response = await apiClient.post(API_ENDPOINTS.auth.verifyOtp, {
        phone,
        code,
      });
      console.log('OTP verification response:', response.data);

      const { access, refresh, user, is_new_user } = response.data;

      // Store tokens
      localStorage.setItem('accessToken', access);
      localStorage.setItem('refreshToken', refresh);

      if (!is_new_user) {
        setState({
          user,
          isLoading: false,
          isAuthenticated: true,
        });
      }

      return { success: true, isNewUser: is_new_user, user };
    } catch (error: any) {
      console.error('OTP verification error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.error || error.response?.data?.phone?.[0] || error.response?.data?.code?.[0] || "Autentifikatsiya xatosi",
      };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        await apiClient.post(API_ENDPOINTS.auth.logout, {
          refresh: refreshToken,
        });
      }
    } catch (error) {
      // Ignore logout errors
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      setState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
      });
      // Redirect to auth page
      window.location.href = '/auth';
    }
  }, []);

  const updateProfile = useCallback(async (data: any) => {
    try {
      const response = await apiClient.patch(API_ENDPOINTS.users.me, data);
      setState(prev => ({
        ...prev,
        user: response.data,
      }));
      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || "Profil yangilashda xatolik",
      };
    }
  }, []);

  return {
    ...state,
    login,
    logout,
    updateProfile,
  };
}

export default useAuth;
