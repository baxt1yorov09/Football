'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { apiClient } from '@/lib/api/client';

export interface Notification {
  id: string;
  type: string;
  type_label?: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  read_at: string | null;
}

export interface UseNotificationsOptions {
  /** Auto-refresh unread count every N ms (default 30s). 0 to disable. */
  pollInterval?: number;
  /** Auto-load full list on mount (default false; only count is loaded by default). */
  loadList?: boolean;
  /** Filter for list endpoint */
  filter?: 'all' | 'unread' | 'read';
}

const DEFAULT_POLL = 30_000;

/**
 * Hook for notifications. Provides:
 *  - unreadCount (live, polled)
 *  - notifications list (loaded on demand)
 *  - markRead, markAllRead, remove, refetch
 */
export function useNotifications(options: UseNotificationsOptions = {}) {
  const { pollInterval = DEFAULT_POLL, loadList = false, filter = 'all' } = options;

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isAuthed = useRef(false);

  const checkAuth = () => {
    if (typeof window === 'undefined') return false;
    // Admin sessiyasida bildirishnomalar ham ko'rinishi kerak.
    return Boolean(
      localStorage.getItem('accessToken') || localStorage.getItem('adminAccessToken')
    );
  };

  const fetchUnreadCount = useCallback(async () => {
    if (!checkAuth()) return;
    try {
      // Faqat /admin/login orqali kirgan adminlarda admin_alert ko'rsatamiz.
      const isAdminSession =
        typeof window !== 'undefined' && !!localStorage.getItem('adminAccessToken');
      const params = isAdminSession ? {} : { as_user: 'true' };
      const res = await apiClient.get('/notifications/unread-count/', { params });
      setUnreadCount(res.data.unread_count ?? 0);
      isAuthed.current = true;
    } catch (e: any) {
      // Silently fail for auth issues
      if (e?.response?.status === 401 || e?.response?.status === 403) {
        isAuthed.current = false;
      }
    }
  }, []);

  const fetchList = useCallback(async () => {
    if (!checkAuth()) return;
    setLoading(true);
    setError(null);
    try {
      const params: any = { limit: 100 };
      if (filter === 'unread') params.is_read = 'false';
      else if (filter === 'read') params.is_read = 'true';

      // Faqat /admin/login orqali kirgan adminlarda admin_alert ko'rsatamiz.
      const isAdminSession =
        typeof window !== 'undefined' && !!localStorage.getItem('adminAccessToken');
      if (!isAdminSession) params.as_user = 'true';

      const res = await apiClient.get('/notifications/', { params });
      setNotifications(res.data.results || []);
      setUnreadCount(res.data.unread_count ?? 0);
      setTotalCount(res.data.total_count ?? 0);
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Bildirishnomalarni yuklashda xatolik');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  const markRead = useCallback(async (id: string) => {
    try {
      await apiClient.post(`/notifications/${id}/read/`);
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === id ? { ...n, is_read: true, read_at: new Date().toISOString() } : n
        )
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (e) {
      console.error('markRead failed:', e);
    }
  }, []);

  const markAllRead = useCallback(async () => {
    try {
      await apiClient.post('/notifications/read-all/');
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, is_read: true, read_at: n.read_at || new Date().toISOString() }))
      );
      setUnreadCount(0);
    } catch (e) {
      console.error('markAllRead failed:', e);
    }
  }, []);

  const remove = useCallback(
    async (id: string) => {
      try {
        await apiClient.delete(`/notifications/${id}/`);
        setNotifications((prev) => {
          const removed = prev.find((n) => n.id === id);
          if (removed && !removed.is_read) setUnreadCount((c) => Math.max(0, c - 1));
          return prev.filter((n) => n.id !== id);
        });
        setTotalCount((c) => Math.max(0, c - 1));
      } catch (e) {
        console.error('delete failed:', e);
      }
    },
    []
  );

  // Initial unread count fetch + polling
  useEffect(() => {
    if (!checkAuth()) return;
    
    fetchUnreadCount();
    if (pollInterval > 0) {
      const id = setInterval(() => {
        if (checkAuth()) {
          fetchUnreadCount();
        }
      }, pollInterval);
      return () => clearInterval(id);
    }
  }, [fetchUnreadCount, pollInterval]);

  // Load full list on mount if requested
  useEffect(() => {
    if (loadList) fetchList();
  }, [loadList, fetchList]);

  return {
    notifications,
    unreadCount,
    totalCount,
    loading,
    error,
    fetchList,
    fetchUnreadCount,
    markRead,
    markAllRead,
    remove,
  };
}
