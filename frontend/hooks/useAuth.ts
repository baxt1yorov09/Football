'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiClient, API_ENDPOINTS } from '@/lib/api/client';
import { useUserStore } from '@/store/userStore';

interface User {
  id: string;
  phone: string;
  full_name: string;
  role: string;
  region?: any;
  is_onboarded?: boolean;
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

  // Tokenlarni saqlash + cookie'larga yozish (login va 2FA login uchun umumiy)
  const persistSession = (access: string, refresh: string, user: any) => {
    localStorage.setItem('accessToken', access);
    localStorage.setItem('refreshToken', refresh);

    // Eski admin sessionidan qolgan tokenlarni tozalash (sidebar leakage)
    localStorage.removeItem('adminAccessToken');
    localStorage.removeItem('adminRefreshToken');
    localStorage.removeItem('adminUser');
    if (typeof document !== 'undefined') {
      document.cookie = 'adminAccessToken=; path=/; max-age=0';
      document.cookie = 'adminRefreshToken=; path=/; max-age=0';
      document.cookie = `accessToken=${access}; path=/; max-age=900`;
      document.cookie = `refreshToken=${refresh}; path=/; max-age=2592000`;
    }

    setState({ user, isLoading: false, isAuthenticated: true });
  };

  const login = useCallback(async (phone: string, code: string) => {
    try {
      const response = await apiClient.post(API_ENDPOINTS.auth.verifyOtp, {
        phone,
        code,
      });

      // O'chirilgan hisob — tiklash imkoniyati
      if (response.data?.account_deleted) {
        return {
          success: true,
          accountDeleted: true,
          restoreToken: response.data.restore_token as string,
          daysLeft: response.data.days_left as number,
          message: response.data.message as string,
        };
      }

      // 2FA gate: foydalanuvchi 2FA yoqgan bo'lsa, JWT yo'q — 2FA bosqichi kerak
      if (response.data?.requires_2fa) {
        return {
          success: true,
          requires2FA: true,
          twoFactorToken: response.data.two_factor_token as string,
          expiresIn: response.data.expires_in as number,
        };
      }

      const { access, refresh, user, is_new_user } = response.data;
      if (!is_new_user) {
        persistSession(access, refresh, user);
      } else {
        // Yangi user uchun ham tokenlarni saqlaymiz, lekin state'ni keyin to'ldiramiz
        localStorage.setItem('accessToken', access);
        localStorage.setItem('refreshToken', refresh);
        if (typeof document !== 'undefined') {
          document.cookie = `accessToken=${access}; path=/; max-age=900`;
          document.cookie = `refreshToken=${refresh}; path=/; max-age=2592000`;
        }
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

  // 2FA kirish bosqichi — TOTP yoki recovery kod bilan
  const verify2FA = useCallback(async (twoFactorToken: string, code: string) => {
    try {
      const response = await apiClient.post('/auth/2fa-login', {
        two_factor_token: twoFactorToken,
        code,
      });
      const { access, refresh, user, is_new_user, used_recovery_code } = response.data;
      persistSession(access, refresh, user);
      return {
        success: true,
        isNewUser: is_new_user,
        usedRecoveryCode: !!used_recovery_code,
        user,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.detail || "Noto'g'ri kod",
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
      // Oddiy tokenlar
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      // Admin tokenlari (agar bor bo'lsa) — sidebar leakage'ni oldini olish
      localStorage.removeItem('adminAccessToken');
      localStorage.removeItem('adminRefreshToken');
      localStorage.removeItem('adminUser');
      // Cookie'lar
      if (typeof document !== 'undefined') {
        document.cookie = 'adminAccessToken=; path=/; max-age=0';
        document.cookie = 'adminRefreshToken=; path=/; max-age=0';
      }
      setState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
      });
      // Global user store'ni tozalash (avatar_url va boshqa cached maydonlar)
      try {
        useUserStore.getState().clearUser();
      } catch {}
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

  // O'chirilgan hisobni tiklash
  const restoreAccount = useCallback(async (restoreToken: string) => {
    try {
      const response = await apiClient.post('/auth/restore-account', {
        restore_token: restoreToken,
      });
      const { access, refresh, user } = response.data;
      persistSession(access, refresh, user);
      return { success: true, user, message: response.data.message };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || "Hisobni tiklashda xatolik",
      };
    }
  }, []);

  return {
    ...state,
    login,
    verify2FA,
    logout,
    updateProfile,
    restoreAccount,
  };
}

export default useAuth;
