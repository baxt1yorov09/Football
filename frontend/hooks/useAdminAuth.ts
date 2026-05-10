'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { clearAdminTokens, getAdminToken, getAdminUser } from '@/lib/adminAuth';

const ALLOWED_ROLES = ['super_admin', 'region_admin', 'viewer'];

export function useAdminAuth() {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [admin, setAdmin] = useState<any>(null);

  useEffect(() => {
    const token = getAdminToken();
    const user = getAdminUser();

    // Token yoki user yo'q
    if (!token || !user) {
      clearAdminTokens();
      router.replace(`/admin/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }

    // Role tekshiruvi
    if (!ALLOWED_ROLES.includes(user.role)) {
      clearAdminTokens();
      router.replace('/admin/login?error=no_permission');
      return;
    }

    // Token muddatini tekshiramiz (JWT payload decode)
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const isExpired = payload.exp * 1000 < Date.now();

      if (isExpired) {
        // Refresh qilishga urinamiz
        refreshAdminToken().then(success => {
          if (!success) {
            clearAdminTokens();
            router.replace('/admin/login?error=session_expired');
          } else {
            setAdmin(user);
            setIsAuthorized(true);
            setIsLoading(false);
          }
        });
        return;
      }
    } catch {
      clearAdminTokens();
      router.replace('/admin/login');
      return;
    }

    setAdmin(user);
    setIsAuthorized(true);
    setIsLoading(false);
  }, [pathname]);

  const logout = useCallback(() => {
    clearAdminTokens();
    router.replace('/admin/login');
  }, []);

  return { admin, isLoading, isAuthorized, logout };
}

async function refreshAdminToken(): Promise<boolean> {
  try {
    const refresh = localStorage.getItem('adminRefreshToken');
    if (!refresh) return false;

    const res = await fetch('/api/auth/refresh/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh }),
    });

    if (!res.ok) return false;

    const data = await res.json();
    document.cookie = `adminAccessToken=${data.access}; path=/; max-age=900; SameSite=Strict`;
    localStorage.setItem('adminAccessToken', data.access);
    return true;
  } catch {
    return false;
  }
}
