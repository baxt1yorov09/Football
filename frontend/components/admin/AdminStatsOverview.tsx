'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Users, FileText, Award, TrendingUp, TrendingDown,
  Calendar, Clock, CheckCircle, XCircle, RefreshCw,
  AlertCircle, MapPin, Activity, ChevronRight,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

// ============ Types ============
interface Overview {
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
  new_licenses_this_month: number;
}

interface Changes {
  applications_month_pct: number;
  applications_week_pct: number;
  approved_pct: number;
  users_pct: number;
  licenses_pct: number;
}

interface PeriodStat {
  applications: number;
  approved: number;
  rejected: number;
  pending: number;
}

interface Periods {
  today: PeriodStat;
  yesterday: PeriodStat;
  week: PeriodStat;
  month: PeriodStat;
}

interface LicenseDistribution {
  license_type__name_uz: string | null;
  license_type__code: string | null;
  license_type__color_hex: string | null;
  count: number;
}

interface RegionStat {
  region__name_uz: string;
  count: number;
}

interface MonthlyTrend {
  month: string;
  count: number;
  approved: number;
  rejected: number;
}

interface RecentApp {
  id: string;
  full_name: string;
  license_type: string | null;
  region: string | null;
  status: string;
  submitted_at: string;
}

interface DashboardData {
  overview: Overview;
  changes: Changes;
  periods: Periods;
  license_distribution: LicenseDistribution[];
  region_stats: RegionStat[];
  monthly_trend: MonthlyTrend[];
  recent_activity: RecentApp[];
  server_time: string;
}

// ============ Helpers ============
function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('adminAccessToken') || localStorage.getItem('accessToken');
}

const STATUS_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  pending: { bg: 'bg-amber-50', text: 'text-amber-700', label: 'Kutilmoqda' },
  under_review: { bg: 'bg-blue-50', text: 'text-blue-700', label: "Ko'rib chiqilmoqda" },
  additional_docs: { bg: 'bg-orange-50', text: 'text-orange-700', label: "Qo'shimcha hujjat" },
  approved: { bg: 'bg-green-50', text: 'text-green-700', label: 'Tasdiqlangan' },
  rejected: { bg: 'bg-red-50', text: 'text-red-700', label: 'Rad etilgan' },
  cancelled: { bg: 'bg-gray-50', text: 'text-gray-700', label: 'Bekor qilingan' },
};

function timeAgo(iso: string): string {
  try {
    const diff = (Date.now() - new Date(iso).getTime()) / 1000;
    if (diff < 60) return 'Hozirgina';
    if (diff < 3600) return `${Math.floor(diff / 60)} daqiqa oldin`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} soat oldin`;
    if (diff < 604800) return `${Math.floor(diff / 86400)} kun oldin`;
    return new Date(iso).toLocaleDateString('uz-UZ');
  } catch {
    return iso;
  }
}

function monthLabel(monthIso: string): string {
  // "2026-05" → "May 26"
  try {
    const [y, m] = monthIso.split('-');
    const date = new Date(Number(y), Number(m) - 1, 1);
    return date.toLocaleDateString('uz-UZ', { month: 'short', year: '2-digit' });
  } catch {
    return monthIso;
  }
}

// ============ MAIN COMPONENT ============
export function AdminStatsOverview() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (initial = false) => {
    try {
      if (initial) setLoading(true);
      else setRefreshing(true);
      setError(null);
      const token = getToken();
      const res = await fetch('/api/reports/dashboard/', {
        // Django reports/urls.py has trailing slash
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || err.error || `HTTP ${res.status}`);
      }
      const payload = await res.json();
      setData(payload);
    } catch (e: any) {
      setError(e.message || 'Yuklab bo\'lmadi');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData(true);
    // Auto-refresh every 60s
    const interval = setInterval(() => fetchData(false), 60_000);
    return () => clearInterval(interval);
  }, [fetchData]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-100 p-6 animate-pulse">
            <div className="flex justify-between items-start">
              <div className="space-y-3 flex-1">
                <div className="h-3 bg-gray-200 rounded w-2/3" />
                <div className="h-8 bg-gray-200 rounded w-1/2" />
                <div className="h-3 bg-gray-100 rounded w-1/3" />
              </div>
              <div className="w-12 h-12 bg-gray-200 rounded-xl" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-6 flex items-center gap-3">
        <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0" />
        <div className="flex-1">
          <p className="font-medium text-red-900">Statistikani yuklab bo'lmadi</p>
          <p className="text-sm text-red-700 mt-1">{error}</p>
        </div>
        <button
          onClick={() => fetchData(true)}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
        >
          Qayta urinish
        </button>
      </div>
    );
  }

  const { overview, changes, periods, license_distribution, region_stats, monthly_trend, recent_activity } = data;

  // Top KPI cards
  const kpis = [
    {
      label: 'Jami arizalar',
      value: overview.total_applications.toLocaleString('uz-UZ'),
      change: changes.applications_month_pct,
      sub: `+${overview.new_users_this_month} yangi oy davomida`,
      icon: FileText,
      color: '#3498DB',
    },
    {
      label: 'Faol litsenziyalar',
      value: overview.active_licenses.toLocaleString('uz-UZ'),
      change: changes.licenses_pct,
      sub: `${overview.expired_licenses} ta tugagan`,
      icon: Award,
      color: '#27AE60',
    },
    {
      label: 'Murabbiylar',
      value: overview.total_users.toLocaleString('uz-UZ'),
      change: changes.users_pct,
      sub: `+${overview.new_users_this_month} oy davomida`,
      icon: Users,
      color: '#F39C12',
    },
    {
      label: 'Kutilayotgan arizalar',
      value: (overview.pending_applications + overview.under_review).toLocaleString('uz-UZ'),
      change: -changes.applications_week_pct,
      sub: `${overview.pending_applications} yangi, ${overview.under_review} ko'rilmoqda`,
      icon: Clock,
      color: '#E74C3C',
    },
  ];

  const maxLicCount = Math.max(1, ...license_distribution.map(d => d.count));
  const maxRegCount = Math.max(1, ...region_stats.map(r => r.count));
  const maxMonthCount = Math.max(1, ...monthly_trend.map(m => m.count));

  return (
    <div className="space-y-8">
      {/* Refresh indicator */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500 flex items-center gap-2">
          <Activity className="w-4 h-4" />
          Real vaqt statistika
          {refreshing && <RefreshCw className="w-3 h-3 animate-spin" />}
        </p>
        <button
          onClick={() => fetchData(false)}
          disabled={refreshing}
          className="text-sm px-3 py-1.5 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 flex items-center gap-2 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          Yangilash
        </button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => {
          const Icon = kpi.icon;
          const isUp = kpi.change >= 0;
          const TrendIcon = isUp ? TrendingUp : TrendingDown;
          return (
            <motion.div
              key={kpi.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-600 mb-1 truncate">{kpi.label}</p>
                      <p className="text-3xl font-bold text-[#0D3B6E]">{kpi.value}</p>
                      <div className="flex items-center gap-1 mt-2">
                        <TrendIcon className={`w-4 h-4 ${isUp ? 'text-green-500' : 'text-red-500'}`} />
                        <span className={`text-sm font-medium ${isUp ? 'text-green-500' : 'text-red-500'}`}>
                          {isUp ? '+' : ''}{kpi.change.toFixed(1)}%
                        </span>
                        <span className="text-xs text-gray-500 truncate">vs o'tgan oy</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1 truncate">{kpi.sub}</p>
                    </div>
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: kpi.color + '20' }}
                    >
                      <Icon className="w-6 h-6" style={{ color: kpi.color }} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Period stats + License distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Period stats */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-[#0D3B6E] mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Arizalar statistikasi
            </h3>
            <div className="space-y-3">
              {[
                { key: 'today', label: 'Bugun' },
                { key: 'yesterday', label: 'Kecha' },
                { key: 'week', label: 'Hafta' },
                { key: 'month', label: 'Oy' },
              ].map((p) => {
                const s = (periods as any)[p.key] as PeriodStat;
                return (
                  <div key={p.key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="font-medium text-gray-700">{p.label}</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1.5" title="Yuborilgan">
                        <div className="w-2 h-2 bg-blue-500 rounded-full" />
                        <span className="font-medium">{s.applications}</span>
                      </div>
                      <div className="flex items-center gap-1.5" title="Tasdiqlangan">
                        <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                        <span>{s.approved}</span>
                      </div>
                      <div className="flex items-center gap-1.5" title="Kutilmoqda">
                        <Clock className="w-3.5 h-3.5 text-amber-500" />
                        <span>{s.pending}</span>
                      </div>
                      <div className="flex items-center gap-1.5" title="Rad etilgan">
                        <XCircle className="w-3.5 h-3.5 text-red-500" />
                        <span>{s.rejected}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* License distribution */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-[#0D3B6E] mb-4 flex items-center gap-2">
              <Award className="w-5 h-5" />
              Litsenziyalar taqsimoti
            </h3>
            {license_distribution.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">Ma'lumot yo'q</p>
            ) : (
              <div className="space-y-3">
                {license_distribution.slice(0, 6).map((lic, idx) => {
                  const color = lic.license_type__color_hex || ['#F39C12', '#E67E22', '#1ABC9C', '#3498DB', '#9B59B6', '#E74C3C'][idx % 6];
                  const pct = (lic.count / maxLicCount) * 100;
                  return (
                    <div key={lic.license_type__code || idx}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
                          <span className="text-sm font-medium text-gray-700 truncate">
                            {lic.license_type__name_uz || lic.license_type__code || 'Boshqa'}
                          </span>
                        </div>
                        <span className="text-sm font-semibold text-[#0D3B6E]">{lic.count}</span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.6, delay: idx * 0.05 }}
                          className="h-full rounded-full"
                          style={{ backgroundColor: color }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Regions + Monthly trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top regions */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-[#0D3B6E] mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Hududlar bo'yicha (top 10)
            </h3>
            {region_stats.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">Ma'lumot yo'q</p>
            ) : (
              <div className="space-y-2">
                {region_stats.map((r, idx) => {
                  const pct = (r.count / maxRegCount) * 100;
                  return (
                    <div key={idx} className="flex items-center gap-3">
                      <span className="text-xs text-gray-400 w-5 text-right">{idx + 1}.</span>
                      <span className="text-sm font-medium text-gray-700 w-32 truncate">
                        {r.region__name_uz}
                      </span>
                      <div className="flex-1 h-5 bg-gray-100 rounded-full overflow-hidden relative">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.6, delay: idx * 0.03 }}
                          className="h-full bg-gradient-to-r from-[#1A56A0] to-[#3498DB] rounded-full"
                        />
                      </div>
                      <span className="text-sm font-semibold text-[#0D3B6E] w-10 text-right">{r.count}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Monthly trend chart */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold text-[#0D3B6E] mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              6 oylik trend
            </h3>
            {monthly_trend.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-8">Ma'lumot yo'q</p>
            ) : (
              <>
                <div className="flex items-end justify-between gap-2 h-48">
                  {monthly_trend.map((m, idx) => {
                    const heightPct = (m.count / maxMonthCount) * 100;
                    const approvedPct = m.count > 0 ? (m.approved / m.count) * 100 : 0;
                    return (
                      <div key={m.month} className="flex-1 flex flex-col items-center gap-2 group">
                        <div className="w-full flex flex-col items-center text-xs">
                          <span className="text-gray-500 group-hover:text-gray-700">{m.count}</span>
                        </div>
                        <div className="w-full flex flex-col-reverse h-32 bg-gray-50 rounded-lg overflow-hidden relative">
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: `${heightPct}%` }}
                            transition={{ duration: 0.6, delay: idx * 0.08 }}
                            className="w-full bg-gradient-to-t from-[#1A56A0] to-[#3498DB] rounded-lg relative"
                          >
                            <motion.div
                              initial={{ height: 0 }}
                              animate={{ height: `${approvedPct}%` }}
                              transition={{ duration: 0.6, delay: idx * 0.08 + 0.3 }}
                              className="absolute bottom-0 w-full bg-green-500 opacity-80 rounded-b-lg"
                            />
                          </motion.div>
                        </div>
                        <span className="text-xs text-gray-500 -rotate-45 origin-top-left mt-2 whitespace-nowrap">
                          {monthLabel(m.month)}
                        </span>
                      </div>
                    );
                  })}
                </div>
                <div className="flex items-center justify-center gap-4 mt-6 text-xs text-gray-600">
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 bg-gradient-to-t from-[#1A56A0] to-[#3498DB] rounded" />
                    Jami
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 bg-green-500 rounded" />
                    Tasdiqlangan
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent activity */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-[#0D3B6E] flex items-center gap-2">
              <Activity className="w-5 h-5" />
              So'nggi arizalar
            </h3>
            <span className="text-xs text-gray-400">{recent_activity.length} ta</span>
          </div>
          {recent_activity.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">Hozircha arizalar yo'q</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {recent_activity.map((a) => {
                const sc = STATUS_COLORS[a.status] || STATUS_COLORS.pending;
                return (
                  <div key={a.id} className="py-3 flex items-center gap-3 hover:bg-gray-50 -mx-2 px-2 rounded-lg transition-colors">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#1A56A0] to-[#0D3B6E] flex items-center justify-center text-white font-semibold flex-shrink-0">
                      {(a.full_name || '?').charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 truncate">{a.full_name || 'Noma\'lum'}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                        {a.license_type && <span>{a.license_type}</span>}
                        {a.license_type && a.region && <span>•</span>}
                        {a.region && <span>{a.region}</span>}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${sc.bg} ${sc.text}`}>
                        {sc.label}
                      </span>
                      <p className="text-xs text-gray-400 mt-1">{timeAgo(a.submitted_at)}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default AdminStatsOverview;
