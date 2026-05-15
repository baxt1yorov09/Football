'use client';

/**
 * Real-time statistika paneli — har 30 soniyada avtomatik yangilanadi.
 * `/api/reports/dashboard/` endpointidan haqiqiy ma'lumotlarni oladi.
 */
import { useCallback, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Clock,
  CheckCircle,
  Award,
  Users,
  AlertTriangle,
  RefreshCw,
  TrendingUp,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useI18n } from '@/lib/i18n/I18nProvider';

interface DashboardData {
  overview: {
    total_applications: number;
    pending_applications: number;
    under_review: number;
    approved_total: number;
    rejected_total: number;
    approved_this_month: number;
    total_users: number;
    new_users_this_month: number;
    total_licenses: number;
    active_licenses: number;
    expired_licenses: number;
  };
  periods?: {
    today?: { applications: number; approved: number; rejected: number; pending: number };
  };
}

const REFRESH_MS = 30_000; // 30 soniya

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('adminAccessToken') || localStorage.getItem('accessToken');
}

export function RealtimeStats() {
  const { t, locale } = useI18n();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (initial = false) => {
    try {
      if (initial) setLoading(true);
      else setRefreshing(true);
      setError(null);

      const token = getToken();
      const res = await fetch('/api/reports/dashboard/', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json);
      setLastUpdate(new Date());
    } catch (e: any) {
      setError(e?.message || 'Xatolik');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData(true);
    const interval = setInterval(() => fetchData(false), REFRESH_MS);
    return () => clearInterval(interval);
  }, [fetchData]);

  const numLocale = locale === 'ru' ? 'ru-RU' : 'uz-UZ';
  const fmt = (n: number) => (n ?? 0).toLocaleString(numLocale);

  const ov = data?.overview;
  const today = data?.periods?.today;

  // Statistika kartalari
  const stats = [
    {
      key: 'pending',
      label: t('admin.pending_apps'),
      value: ov ? ov.pending_applications + ov.under_review : 0,
      icon: Clock,
      color: '#E74C3C',
      bg: 'rgba(231, 76, 60, 0.1)',
    },
    {
      key: 'approved_today',
      label: t('admin.approved_today') || 'Bugun tasdiqlandi',
      value: today?.approved ?? 0,
      icon: CheckCircle,
      color: '#27AE60',
      bg: 'rgba(39, 174, 96, 0.1)',
    },
    {
      key: 'active_licenses',
      label: t('admin.active_licenses') || 'Faol litsenziyalar',
      value: ov?.active_licenses ?? 0,
      icon: Award,
      color: '#F39C12',
      bg: 'rgba(243, 156, 18, 0.1)',
    },
    {
      key: 'total_users',
      label: t('admin.total_users') || 'Foydalanuvchilar',
      value: ov?.total_users ?? 0,
      icon: Users,
      color: '#3498DB',
      bg: 'rgba(52, 152, 219, 0.1)',
    },
    {
      key: 'expiring',
      label: t('admin.expired_licenses') || 'Muddati tugagan',
      value: ov?.expired_licenses ?? 0,
      icon: AlertTriangle,
      color: '#E67E22',
      bg: 'rgba(230, 126, 34, 0.1)',
    },
    {
      key: 'today_apps',
      label: t('admin.today_apps') || 'Bugungi arizalar',
      value: today?.applications ?? 0,
      icon: TrendingUp,
      color: '#9B59B6',
      bg: 'rgba(155, 89, 182, 0.1)',
    },
  ];

  const lastUpdateLabel = lastUpdate
    ? lastUpdate.toLocaleTimeString(numLocale, { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : '—';

  return (
    <Card>
      <CardHeader className="pb-3 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-lg font-bold text-[#0D3B6E] flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
            </span>
            {t('admin.realtime_stats')}
          </CardTitle>
          <p className="text-xs text-gray-400 mt-1">
            {refreshing ? (
              <span className="flex items-center gap-1">
                <RefreshCw className="w-3 h-3 animate-spin" />
                Yangilanmoqda...
              </span>
            ) : (
              <>So'nggi yangilanish: {lastUpdateLabel}</>
            )}
          </p>
        </div>
        <button
          onClick={() => fetchData(false)}
          disabled={refreshing}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          title="Yangilash"
        >
          <RefreshCw className={`w-4 h-4 text-gray-500 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        {error && (
          <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
            {error}
          </div>
        )}

        {loading && !data ? (
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="p-4 rounded-xl border border-gray-200 animate-pulse">
                <div className="w-9 h-9 rounded-lg bg-gray-200 mb-3" />
                <div className="h-6 w-12 bg-gray-200 rounded mb-2" />
                <div className="h-3 w-20 bg-gray-100 rounded" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {stats.map((s, idx) => {
              const Icon = s.icon;
              return (
                <motion.div
                  key={s.key}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="p-4 rounded-xl border border-gray-200 hover:border-[#F39C12] hover:shadow-sm transition-all"
                >
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center mb-3"
                    style={{ backgroundColor: s.bg }}
                  >
                    <Icon className="w-4.5 h-4.5" style={{ color: s.color, width: 18, height: 18 }} />
                  </div>
                  <motion.p
                    key={s.value}
                    initial={{ scale: 1.1, opacity: 0.6 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-2xl font-bold text-[#0D3B6E] leading-tight"
                  >
                    {fmt(s.value)}
                  </motion.p>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">{s.label}</p>
                </motion.div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default RealtimeStats;
