'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Header } from '@/components/layout/Header';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminStatsOverview } from '@/components/admin/AdminStatsOverview';
import { ApplicationsTableNew } from '@/components/admin/ApplicationsTableNew';
import { RecentActivity } from '@/components/admin/RecentActivity';
import { QuickActions } from '@/components/admin/QuickActions';
import SettingsPanel from '@/components/admin/SettingsPanel';
import { UsersPanel } from '@/components/admin/UsersPanel';
import { ReportsPanel } from '@/components/admin/ReportsPanel';
import { 
  Search, Filter, Plus, Download, Eye, Edit, Trash2, MoreVertical,
  CheckCircle, XCircle, Clock, FileText, Award, Users, BarChart3,
  Settings, Mail, Phone, MapPin, Calendar, TrendingUp, TrendingDown,
  Activity, Database, Lock, Bell, Globe, Save, ChevronDown, ChevronUp,
  Shield, Zap, Printer, Share2, ArrowUpRight, ArrowDownRight,
  CreditCard, Building2, Briefcase, GraduationCap, FileCheck,
  AlertCircle, Info, X, ChevronLeft, ChevronRight, RefreshCw,
  Loader2
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/lib/i18n/I18nProvider';

// ============ LICENSES MANAGEMENT PANEL (Real API) ============
interface APILicense {
  id: string;
  license_number: string;
  user: { id: string; full_name: string; phone: string; email: string; initials: string; avatar_url: string | null };
  license_type: { id: number; code: string; name: string; color: string; category: string };
  region: string;
  status: 'active' | 'expired' | 'suspended' | 'revoked';
  status_display: string;
  issued_at: string;
  expires_at: string;
  days_left: number;
  is_expiring_soon: boolean;
  pdf_url: string;
  qr_code_url: string;
}

interface APIStats {
  total: number;
  active: number;
  expired: number;
  suspended: number;
  revoked: number;
  expiring_soon: number;
  growth: { total: number; active: number; expired: number; suspended: number };
}

function licApi(path: string, method: string = 'GET', body?: any): Promise<any> {
  const token = (typeof window !== 'undefined' &&
    (localStorage.getItem('adminAccessToken') || localStorage.getItem('accessToken'))) || '';
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  return fetch(path, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  }).then(async (r) => {
    if (!r.ok) {
      const err = await r.json().catch(() => ({}));
      throw new Error(err.detail || err.error || `HTTP ${r.status}`);
    }
    const ct = r.headers.get('content-type') || '';
    return ct.includes('application/json') ? r.json() : r;
  });
}

function LicensesPanel() {
  const { t, locale } = useI18n();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');
  const [selectedLicenses, setSelectedLicenses] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Real data
  const [stats, setStats] = useState<APIStats | null>(null);
  const [licenses, setLicenses] = useState<APILicense[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [detailLic, setDetailLic] = useState<APILicense | null>(null);
  const [revokeLic, setRevokeLic] = useState<APILicense | null>(null);
  const [editLic, setEditLic] = useState<APILicense | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [bulkAction, setBulkAction] = useState<null | 'revoke' | 'suspend' | 'activate' | 'extend'>(null);

  // Toast
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const currentRole = useMemo(() => {
    if (typeof window === 'undefined') return null;
    try {
      const u = JSON.parse(localStorage.getItem('adminUser') || 'null');
      return u?.role || null;
    } catch { return null; }
  }, []);
  const canWrite = currentRole && ['super_admin', 'region_admin', 'staff'].includes(currentRole);
  const canRevoke = currentRole === 'super_admin';

  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState('');
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchQuery), 400);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const loadData = useCallback(async (initial = false) => {
    try {
      if (initial) setLoading(true); else setRefreshing(true);
      setError(null);

      const params = new URLSearchParams();
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (filterStatus) params.set('status', filterStatus);
      if (filterType) params.set('license_type', filterType);
      params.set('limit', String(itemsPerPage));
      params.set('offset', String((currentPage - 1) * itemsPerPage));

      const [s, l] = await Promise.all([
        licApi('/api/licenses/admin/stats/'),
        licApi(`/api/licenses/admin/list/?${params.toString()}`),
      ]);
      setStats(s);
      setLicenses(l.results || []);
      setTotal(l.count || 0);
    } catch (e: any) {
      setError(e.message || 'Yuklab bo\'lmadi');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [debouncedSearch, filterStatus, filterType, currentPage]);

  useEffect(() => { loadData(true); }, []); // eslint-disable-line
  useEffect(() => { loadData(false); }, [loadData]); // eslint-disable-line

  // Reset selection on page/filter change
  useEffect(() => { setSelectedLicenses([]); }, [currentPage, filterStatus, filterType, debouncedSearch]);

  // ── Actions ──────────────────────────────
  const handleRevoke = async (id: string, reason: string) => {
    try {
      await licApi(`/api/licenses/admin/${id}/revoke/`, 'POST', { reason });
      showToast(t('common.success'));
      setRevokeLic(null);
      loadData(false);
    } catch (e: any) {
      showToast(e.message, 'error');
    }
  };

  const handleSuspend = async (id: string, reason: string) => {
    try {
      await licApi(`/api/licenses/admin/${id}/update/`, 'PATCH', { action: 'suspend', reason });
      showToast(t('common.success'));
      setEditLic(null);
      loadData(false);
    } catch (e: any) {
      showToast(e.message, 'error');
    }
  };

  const handleActivate = async (id: string) => {
    try {
      await licApi(`/api/licenses/admin/${id}/update/`, 'PATCH', { action: 'activate' });
      showToast(t('common.success'));
      setEditLic(null);
      loadData(false);
    } catch (e: any) {
      showToast(e.message, 'error');
    }
  };

  const handleExtend = async (id: string, days: number) => {
    try {
      await licApi(`/api/licenses/admin/${id}/update/`, 'PATCH', { extends_days: days });
      showToast(t('common.success'));
      setEditLic(null);
      loadData(false);
    } catch (e: any) {
      showToast(e.message, 'error');
    }
  };

  const handleExport = async () => {
    try {
      const params = new URLSearchParams();
      if (filterStatus) params.set('status', filterStatus);
      if (filterType) params.set('license_type', filterType);
      const token = localStorage.getItem('adminAccessToken') || localStorage.getItem('accessToken') || '';
      const r = await fetch(`/api/licenses/admin/export/?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const blob = await r.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `uff_litsenziyalar_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      showToast(t('common.success'));
    } catch (e: any) {
      showToast(e.message, 'error');
    }
  };

  const handleBulkAction = async (action: 'revoke' | 'suspend' | 'activate' | 'extend', extra?: { reason?: string; days?: number }) => {
    try {
      const body: any = { ids: selectedLicenses, action, ...extra };
      const r = await licApi('/api/licenses/admin/bulk/', 'POST', body);
      showToast(t('common.success'));
      setSelectedLicenses([]);
      setBulkAction(null);
      loadData(false);
    } catch (e: any) {
      showToast(e.message, 'error');
    }
  };

  const totalPages = Math.max(1, Math.ceil(total / itemsPerPage));
  const toggleSelectAll = () =>
    setSelectedLicenses(
      selectedLicenses.length === licenses.length ? [] : licenses.map(l => l.id)
    );
  const toggleSelect = (id: string) =>
    setSelectedLicenses(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);

  // ── Status/Type config ───────────────────
  const STATUS_CFG: Record<string, { label: string; bg: string; text: string; icon: any }> = {
    active:    { label: t('licenses.status.active'),    bg: 'bg-green-50',  text: 'text-green-700',  icon: CheckCircle },
    expired:   { label: t('licenses.status.expired'),   bg: 'bg-red-50',    text: 'text-red-700',    icon: XCircle },
    suspended: { label: t('licenses.status.suspended'), bg: 'bg-amber-50',  text: 'text-amber-700',  icon: Clock },
    revoked:   { label: t('licenses.status.revoked'),   bg: 'bg-gray-50',   text: 'text-gray-700',   icon: XCircle },
  };

  const STAT_CARDS = [
    { key: 'total',     label: t('licenses.kpi.total'),         icon: Award,       color: '#1A56A0', filter: '' },
    { key: 'active',    label: t('licenses.kpi.active'),        icon: CheckCircle, color: '#27AE60', filter: 'active' },
    { key: 'expired',   label: t('licenses.kpi.expired'),       icon: AlertCircle, color: '#E74C3C', filter: 'expired' },
    { key: 'suspended', label: t('licenses.status.suspended'),  icon: Clock,       color: '#F39C12', filter: 'suspended' },
  ];

  // Pagination range
  const pageNumbers = useMemo(() => {
    const range: number[] = [];
    const maxButtons = 5;
    let start = Math.max(1, currentPage - 2);
    let end = Math.min(totalPages, start + maxButtons - 1);
    if (end - start + 1 < maxButtons) start = Math.max(1, end - maxButtons + 1);
    for (let i = start; i <= end; i++) range.push(i);
    return range;
  }, [currentPage, totalPages]);

  return (
    <div className="space-y-6">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-20 right-6 z-[100] px-4 py-3 rounded-xl shadow-lg text-white text-sm font-medium ${
              toast.type === 'success' ? 'bg-green-600' : 'bg-red-600'
            }`}
          >
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('admin.lic_panel.title')}</h1>
          <p className="text-gray-500 mt-1">{t('admin.lic_panel.subtitle')}</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => loadData(false)}
            disabled={refreshing}
            className="p-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-50 transition-all"
            title={t('admin.refresh')}
          >
            <RefreshCw className={`w-4 h-4 text-gray-500 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-all"
          >
            <Download className="w-5 h-5" />
            {t('admin.lic_panel.export')}
          </button>
          {canWrite && (
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#1A56A0] text-white rounded-xl hover:bg-[#0D3B6E] transition-all shadow-lg shadow-blue-500/25"
            >
              <Plus className="w-5 h-5" />
              {t('admin.lic_panel.new_license')}
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {STAT_CARDS.map((card, index) => {
          const Icon = card.icon;
          const value = stats ? (stats as any)[card.key] : 0;
          const growth = stats ? (stats.growth as any)[card.key] : 0;
          const TrendIcon = growth >= 0 ? TrendingUp : TrendingDown;
          const isActive = filterStatus === card.filter;
          return (
            <motion.button
              key={card.key}
              type="button"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => { setFilterStatus(card.filter); setCurrentPage(1); }}
              className={`text-left bg-white rounded-xl p-5 border shadow-sm hover:shadow-md transition-all ${
                isActive ? 'border-[#1A56A0] ring-2 ring-[#1A56A0]/20' : 'border-gray-100'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: card.color + '15' }}
                >
                  <Icon className="w-5 h-5" style={{ color: card.color }} />
                </div>
                {stats && growth !== undefined && (
                  <div className={`flex items-center gap-1 text-xs font-medium ${
                    growth >= 0 ? 'text-green-600' : 'text-red-500'
                  }`}>
                    <TrendIcon className="w-3 h-3" />
                    {Math.abs(growth)}%
                  </div>
                )}
              </div>
              {loading && !stats ? (
                <>
                  <div className="h-7 w-20 bg-gray-100 rounded animate-pulse mb-1" />
                  <div className="h-4 w-28 bg-gray-50 rounded animate-pulse" />
                </>
              ) : (
                <>
                  <p className="text-2xl font-bold text-gray-900">
                    {Number(value || 0).toLocaleString(locale === 'ru' ? 'ru-RU' : 'uz-UZ')}
                  </p>
                  <p className="text-sm text-gray-500 mt-0.5">{card.label}</p>
                </>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Expiring soon banner */}
      {stats && stats.expiring_soon > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-3"
        >
          <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0" />
          <p className="text-sm text-amber-800 flex-1">
            {t('licenses.expiring_banner_title', { n: stats.expiring_soon })}
          </p>
        </motion.div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder={t('common.search')}
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A56A0] focus:border-transparent"
            />
          </div>
          <div className="flex gap-3">
            <select
              value={filterStatus}
              onChange={(e) => { setFilterStatus(e.target.value); setCurrentPage(1); }}
              className="px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A56A0] bg-white"
            >
              <option value="">{t('licenses.filter_all')}</option>
              <option value="active">{t('licenses.status.active')}</option>
              <option value="expired">{t('licenses.status.expired')}</option>
              <option value="suspended">{t('licenses.status.suspended')}</option>
              <option value="revoked">{t('licenses.status.revoked')}</option>
            </select>
            <select
              value={filterType}
              onChange={(e) => { setFilterType(e.target.value); setCurrentPage(1); }}
              className="px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A56A0] bg-white"
            >
              <option value="">{t('licenses.filter_all')}</option>
              {['D','C','B','A','PRO','GK_1','GK_2','GK_3',
                'FITNESS_1','FITNESS_2','FITNESS_3',
                'FUTSAL_1','FUTSAL_2','FUTSAL_3',
                'BEACH','SELEK','PSYCH'].map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      <AnimatePresence>
        {selectedLicenses.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-[#1A56A0] text-white rounded-xl p-4 flex items-center justify-between flex-wrap gap-3"
          >
            <p className="font-medium">{selectedLicenses.length}</p>
            <div className="flex gap-2 flex-wrap">
              {canWrite && (
                <button
                  onClick={() => handleBulkAction('activate')}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500 hover:bg-green-600 rounded-lg text-xs font-medium"
                >
                  <CheckCircle className="w-3.5 h-3.5" />
                  {t('admin.lic_panel.activate')}
                </button>
              )}
              {canWrite && (
                <button
                  onClick={() => setBulkAction('suspend')}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 rounded-lg text-xs font-medium"
                >
                  <Clock className="w-3.5 h-3.5" />
                  {t('admin.lic_panel.suspend')}
                </button>
              )}
              {canRevoke && (
                <button
                  onClick={() => setBulkAction('revoke')}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500 hover:bg-red-600 rounded-lg text-xs font-medium"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  {t('admin.lic_panel.revoke')}
                </button>
              )}
              <button
                onClick={() => setSelectedLicenses([])}
                className="p-1.5 hover:bg-white/20 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700 flex-1">{error}</p>
          <button onClick={() => loadData(false)} className="text-sm text-red-700 underline">
            {t('common.retry')}
          </button>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-4 py-4 text-left w-10">
                  <input
                    type="checkbox"
                    checked={selectedLicenses.length === licenses.length && licenses.length > 0}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-gray-300 text-[#1A56A0] focus:ring-[#1A56A0]"
                  />
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('admin.table.license')}</th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('admin.table.owner')}</th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('admin.table.type')}</th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{t('admin.table.status')}</th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Berilgan</th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Muddati</th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 8 }).map((_, j) => (
                      <td key={j} className="px-4 py-4">
                        <div className="h-5 bg-gray-100 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : licenses.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-16 text-center text-gray-400">
                    <Award className="w-12 h-12 mx-auto mb-2 opacity-20" />
                    <p className="text-sm">{t('admin.lic_panel.not_found')}</p>
                  </td>
                </tr>
              ) : (
                licenses.map((lic, index) => {
                  const sc = STATUS_CFG[lic.status] || STATUS_CFG.active;
                  const StatusIcon = sc.icon;
                  const isSelected = selectedLicenses.includes(lic.id);
                  return (
                    <motion.tr
                      key={lic.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: Math.min(index * 0.03, 0.3) }}
                      className={`hover:bg-gray-50 transition-colors ${isSelected ? 'bg-blue-50/50' : ''}`}
                    >
                      <td className="px-4 py-4">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelect(lic.id)}
                          className="w-4 h-4 rounded border-gray-300 text-[#1A56A0] focus:ring-[#1A56A0]"
                        />
                      </td>
                      <td className="px-4 py-4">
                        <div className="font-mono font-semibold text-sm text-gray-900">{lic.license_number}</div>
                        <div className="text-xs text-gray-500">{lic.region || '—'}</div>
                        {lic.is_expiring_soon && (
                          <div className="text-xs text-amber-600 font-medium mt-0.5">
                            ⚠ {lic.days_left} kun qoldi
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-[#1A56A0] to-[#0D3B6E] rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                            {lic.user.initials}
                          </div>
                          <div className="min-w-0">
                            <div className="font-medium text-gray-900 truncate">{lic.user.full_name}</div>
                            <div className="text-sm text-gray-500">{lic.user.phone}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span
                          className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold text-white"
                          style={{ backgroundColor: lic.license_type.color }}
                          title={lic.license_type.name}
                        >
                          {lic.license_type.code}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${sc.bg} ${sc.text}`}>
                          <StatusIcon className="w-3.5 h-3.5" />
                          {sc.label}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-600">{lic.issued_at}</td>
                      <td className="px-4 py-4">
                        <div className={`text-sm font-medium ${
                          lic.status === 'expired' ? 'text-red-600' :
                          lic.is_expiring_soon ? 'text-amber-600' : 'text-gray-700'
                        }`}>
                          {lic.expires_at}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setDetailLic(lic)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                            title="Ko'rish"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {canWrite && lic.status !== 'revoked' && (
                            <button
                              onClick={() => setEditLic(lic)}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-all"
                              title="Tahrirlash"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                          )}
                          {canRevoke && lic.status !== 'revoked' && (
                            <button
                              onClick={() => setRevokeLic(lic)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                              title="Bekor qilish"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                          {lic.pdf_url && (
                            <a
                              href={lic.pdf_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 text-gray-400 hover:bg-gray-100 hover:text-[#1A56A0] rounded-lg transition-all"
                              title="PDF yuklab olish"
                            >
                              <Download className="w-4 h-4" />
                            </a>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {total > 0 && (
          <div className="px-4 py-4 border-t border-gray-100 flex items-center justify-between flex-wrap gap-3">
            <p className="text-sm text-gray-500">
              Showing {(currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, total)} of {total}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              {pageNumbers.map(p => (
                <button
                  key={p}
                  onClick={() => setCurrentPage(p)}
                  className={`w-9 h-9 rounded-lg text-sm font-medium transition-all ${
                    currentPage === p
                      ? 'bg-[#1A56A0] text-white'
                      : 'hover:bg-gray-100 text-gray-600'
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Modals ──────────────────────────── */}
      <LicenseDetailModal lic={detailLic} onClose={() => setDetailLic(null)} />
      <LicenseRevokeModal
        lic={revokeLic}
        onClose={() => setRevokeLic(null)}
        onConfirm={handleRevoke}
      />
      <LicenseEditModal
        lic={editLic}
        onClose={() => setEditLic(null)}
        onSuspend={handleSuspend}
        onActivate={handleActivate}
        onExtend={handleExtend}
      />
      <LicenseCreateModal
        open={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={() => { setShowCreate(false); loadData(false); showToast('Litsenziya yaratildi'); }}
      />
      <BulkReasonModal
        open={bulkAction === 'revoke' || bulkAction === 'suspend'}
        title={bulkAction === 'revoke' ? 'Bekor qilish' : "To'xtatish"}
        danger={bulkAction === 'revoke'}
        onClose={() => setBulkAction(null)}
        onConfirm={(reason) => handleBulkAction(bulkAction as any, { reason })}
      />
    </div>
  );
}

// ============ MODALS ============
function ModalShell({ open, onClose, children, maxW = 'max-w-md' }: { open: boolean; onClose: () => void; children: React.ReactNode; maxW?: string }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 z-[80] flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className={`bg-white rounded-2xl shadow-2xl w-full ${maxW}`}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function LicenseDetailModal({ lic, onClose }: { lic: APILicense | null; onClose: () => void }) {
  if (!lic) return null;
  return (
    <ModalShell open={!!lic} onClose={onClose} maxW="max-w-lg">
      <div className="p-6">
        <div className="flex items-start justify-between mb-5">
          <div>
            <h3 className="text-xl font-bold text-gray-900">{lic.license_number}</h3>
            <p className="text-sm text-gray-500 mt-1">{lic.license_type.name}</p>
          </div>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400" /></button>
        </div>
        <div className="space-y-3 text-sm">
          {[
            ['Egasi', lic.user.full_name],
            ['Telefon', lic.user.phone],
            ['Email', lic.user.email || '—'],
            ['Viloyat', lic.region || '—'],
            ['Tur kodi', lic.license_type.code],
            ['Holati', lic.status_display],
            ['Berilgan', lic.issued_at],
            ['Tugaydi', lic.expires_at],
            ['Qolgan', lic.days_left > 0 ? `${lic.days_left} kun` : 'Tugagan'],
          ].map(([k, v]) => (
            <div key={k as string} className="flex justify-between py-2 border-b border-gray-100">
              <span className="text-gray-500">{k}</span>
              <span className="font-medium text-gray-900 text-right">{v}</span>
            </div>
          ))}
        </div>
        {lic.pdf_url && (
          <a
            href={lic.pdf_url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#1A56A0] text-white rounded-xl hover:bg-[#0D3B6E] transition-all"
          >
            <Download className="w-4 h-4" />
            PDF yuklab olish
          </a>
        )}
      </div>
    </ModalShell>
  );
}

function LicenseRevokeModal({ lic, onClose, onConfirm }: {
  lic: APILicense | null;
  onClose: () => void;
  onConfirm: (id: string, reason: string) => void;
}) {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  useEffect(() => { if (lic) setReason(''); }, [lic]);
  if (!lic) return null;

  const handle = async () => {
    if (!reason.trim()) return;
    setLoading(true);
    await onConfirm(lic.id, reason.trim());
    setLoading(false);
  };

  return (
    <ModalShell open={!!lic} onClose={onClose}>
      <div className="p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
            <AlertCircle className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Litsenziyani bekor qilish</h3>
            <p className="text-xs text-red-500 font-mono">{lic.license_number}</p>
          </div>
          <button onClick={onClose} className="ml-auto"><X className="w-5 h-5 text-gray-400" /></button>
        </div>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={4}
          placeholder="Bekor qilish sababi (majburiy)..."
          className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-200 resize-none mb-4"
        />
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600">
            Bekor
          </button>
          <button
            onClick={handle}
            disabled={loading || !reason.trim()}
            className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Bekor qilish
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

function LicenseEditModal({ lic, onClose, onSuspend, onActivate, onExtend }: {
  lic: APILicense | null;
  onClose: () => void;
  onSuspend: (id: string, reason: string) => void;
  onActivate: (id: string) => void;
  onExtend: (id: string, days: number) => void;
}) {
  const [mode, setMode] = useState<'extend' | 'suspend' | 'activate'>('extend');
  const [days, setDays] = useState(365);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (lic) {
      setMode(lic.status === 'suspended' ? 'activate' : 'extend');
      setDays(365);
      setReason('');
    }
  }, [lic]);
  if (!lic) return null;

  const handle = async () => {
    setLoading(true);
    if (mode === 'extend') await onExtend(lic.id, days);
    else if (mode === 'suspend' && reason.trim()) await onSuspend(lic.id, reason.trim());
    else if (mode === 'activate') await onActivate(lic.id);
    setLoading(false);
  };

  return (
    <ModalShell open={!!lic} onClose={onClose}>
      <div className="p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-semibold text-gray-900">Tahrirlash</h3>
            <p className="text-xs text-gray-500 font-mono">{lic.license_number}</p>
          </div>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400" /></button>
        </div>

        {/* Mode tabs */}
        <div className="flex gap-2 mb-4 bg-gray-50 p-1 rounded-xl">
          <button
            onClick={() => setMode('extend')}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${mode === 'extend' ? 'bg-white shadow-sm text-[#1A56A0]' : 'text-gray-500'}`}
          >
            Muddat uzaytirish
          </button>
          {lic.status === 'active' && (
            <button
              onClick={() => setMode('suspend')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${mode === 'suspend' ? 'bg-white shadow-sm text-amber-600' : 'text-gray-500'}`}
            >
              To'xtatish
            </button>
          )}
          {lic.status === 'suspended' && (
            <button
              onClick={() => setMode('activate')}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${mode === 'activate' ? 'bg-white shadow-sm text-green-600' : 'text-gray-500'}`}
            >
              Faollashtirish
            </button>
          )}
        </div>

        {mode === 'extend' && (
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">Necha kunga uzaytirish? (1-730)</label>
            <input
              type="number"
              min={1}
              max={730}
              value={days}
              onChange={(e) => setDays(Math.max(1, Math.min(730, Number(e.target.value) || 1)))}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1A56A0]"
            />
            <div className="flex gap-2">
              {[30, 90, 180, 365, 730].map(d => (
                <button
                  key={d}
                  onClick={() => setDays(d)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                    days === d ? 'bg-[#1A56A0] text-white border-[#1A56A0]' : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  {d} kun
                </button>
              ))}
            </div>
          </div>
        )}

        {mode === 'suspend' && (
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={4}
            placeholder="To'xtatish sababi (majburiy)..."
            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-200 resize-none"
          />
        )}

        {mode === 'activate' && (
          <p className="text-sm text-gray-600 p-4 bg-green-50 rounded-xl">
            Litsenziya yana faollashtirilsinmi?
          </p>
        )}

        <div className="flex gap-2 mt-5">
          <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600">
            Bekor
          </button>
          <button
            onClick={handle}
            disabled={loading || (mode === 'suspend' && !reason.trim())}
            className={`flex-1 py-2.5 text-white rounded-xl text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2 ${
              mode === 'suspend' ? 'bg-amber-500 hover:bg-amber-600' :
              mode === 'activate' ? 'bg-green-500 hover:bg-green-600' :
              'bg-[#1A56A0] hover:bg-[#0D3B6E]'
            }`}
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Saqlash
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

function LicenseCreateModal({ open, onClose, onCreated }: {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [userId, setUserId] = useState('');
  const [typeCode, setTypeCode] = useState('D');
  const [days, setDays] = useState(365);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async () => {
    setErr(null);
    if (!userId.trim()) { setErr('Foydalanuvchi ID majburiy'); return; }
    setLoading(true);
    try {
      await licApi('/api/licenses/admin/create/', 'POST', {
        user_id: userId.trim(),
        license_type_code: typeCode,
        expires_days: days,
      });
      onCreated();
      setUserId('');
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalShell open={open} onClose={onClose}>
      <div className="p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold text-gray-900">Yangi litsenziya</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400" /></button>
        </div>

        {err && (
          <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{err}</div>
        )}

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Foydalanuvchi ID (UUID)</label>
            <input
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              placeholder="UUID..."
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#1A56A0]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Litsenziya turi</label>
            <select
              value={typeCode}
              onChange={(e) => setTypeCode(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1A56A0]"
            >
              {['D','C','B','A','PRO','GK_1','GK_2','GK_3',
                'FITNESS_1','FITNESS_2','FITNESS_3',
                'FUTSAL_1','FUTSAL_2','FUTSAL_3',
                'BEACH','SELEK','PSYCH'].map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Amal qilish muddati (kunda)</label>
            <input
              type="number"
              min={1}
              max={3650}
              value={days}
              onChange={(e) => setDays(Math.max(1, Math.min(3650, Number(e.target.value) || 1)))}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1A56A0]"
            />
          </div>
        </div>

        <div className="flex gap-2 mt-5">
          <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600">
            Bekor
          </button>
          <button
            onClick={submit}
            disabled={loading}
            className="flex-1 py-2.5 bg-[#1A56A0] hover:bg-[#0D3B6E] text-white rounded-xl text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Yaratish
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

function BulkReasonModal({ open, title, danger, onClose, onConfirm }: {
  open: boolean;
  title: string;
  danger?: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}) {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  useEffect(() => { if (open) setReason(''); }, [open]);

  const handle = async () => {
    if (!reason.trim()) return;
    setLoading(true);
    await onConfirm(reason.trim());
    setLoading(false);
  };

  return (
    <ModalShell open={open} onClose={onClose}>
      <div className="p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-semibold text-gray-900">{title}: Ommaviy amal</h3>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400" /></button>
        </div>
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={4}
          placeholder="Sabab (majburiy)..."
          className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1A56A0] resize-none mb-4"
        />
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600">
            Bekor
          </button>
          <button
            onClick={handle}
            disabled={loading || !reason.trim()}
            className={`flex-1 py-2.5 text-white rounded-xl text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2 ${
              danger ? 'bg-red-500 hover:bg-red-600' : 'bg-amber-500 hover:bg-amber-600'
            }`}
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Tasdiqlash
          </button>
        </div>
      </div>
    </ModalShell>
  );
}


// ============ REPORTS PANEL ============


// ============ MAIN ADMIN PAGE ============
export default function AdminPage() {
  const { t } = useI18n();
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  // Auth tekshiruvi
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('adminAccessToken');
      if (!token) {
        router.push('/admin/login');
      } else {
        setIsAuthenticated(true);
      }
      setIsLoading(false);
    };
    checkAuth();
  }, [router]);

  // Loading holatida
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F4F6F9] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-[#1A56A0] animate-spin mx-auto mb-4" />
          <p className="text-gray-600">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  // Auth bo'lmasa hech narsa ko'rsatma
  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-[#F4F6F9]">
      <Header />
      <AdminSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="ml-64 pt-16">
        <div className="p-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-3xl font-bold text-[#0D3B6E]">
              {t('admin.panel')}
            </h1>
            <p className="text-gray-600 mt-1">
              {t('admin.subtitle')}
            </p>
          </motion.div>

          {activeTab === 'overview' && (
            <div className="space-y-8">
              <AdminStatsOverview />
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <ApplicationsTableNew />
                </div>
                <div className="space-y-6">
                  <QuickActions />
                  <RecentActivity />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'applications' && (
            <div>
              <ApplicationsTableNew showAll={true} />
            </div>
          )}

          {activeTab === 'licenses' && <LicensesPanel />}
          {activeTab === 'users' && <UsersPanel />}
          {activeTab === 'reports' && <ReportsPanel />}
          {activeTab === 'settings' && <SettingsPanel />}
        </div>
      </main>
    </div>
  );
}
