'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Plus, Download, Eye, Edit, Trash2, MoreVertical, RefreshCw, X,
  Users, Award, Shield, Activity, MapPin, Phone, Mail, Calendar, Clock,
  CheckCircle, XCircle, AlertCircle, UserCheck, UserX, Key, FileText,
  ChevronLeft, ChevronRight, Loader2, Briefcase, Building2,
} from 'lucide-react';
import { useI18n } from '@/lib/i18n/I18nProvider';

// ════════════════════════════════════════════════════════════════════
// Types
// ════════════════════════════════════════════════════════════════════
interface AdminUser {
  id: string;
  phone: string;
  email: string;
  full_name: string;
  initials: string;
  first_name?: string;
  last_name?: string;
  middle_name?: string;
  birth_date?: string | null;
  gender?: string;
  workplace?: string;
  job_title?: string;
  coaching_years?: number;
  role: string;
  role_display: string;
  region_id: number | null;
  region: string;
  region_ru?: string;
  is_active: boolean;
  is_onboarded: boolean;
  two_factor_enabled?: boolean;
  avatar_url?: string;
  created_at?: string;
  last_login?: string | null;
  applications_count?: number;
  licenses_count?: number;
  active_licenses_count?: number;
}

interface UserStats {
  total: number;
  active: number;
  inactive: number;
  coaches: number;
  admins: number;
  active_now: number;
  new_this_month: number;
  growth: { total: number; coaches: number; admins: number };
  by_role: Array<{ role: string; count: number }>;
  by_region: Array<{ region__id: number; region__name_uz: string; region__name_ru: string; count: number }>;
}

interface RegionItem {
  id: number;
  name_uz: string;
  name_ru: string;
  code: string;
}

// ════════════════════════════════════════════════════════════════════
// API helper
// ════════════════════════════════════════════════════════════════════
function userApi(path: string, method: string = 'GET', body?: any): Promise<any> {
  const token =
    (typeof window !== 'undefined' &&
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

const ROLE_COLORS: Record<string, { bg: string; text: string; ring: string }> = {
  coach:        { bg: 'bg-blue-50',    text: 'text-blue-700',    ring: 'ring-blue-200' },
  region_admin: { bg: 'bg-amber-50',   text: 'text-amber-700',   ring: 'ring-amber-200' },
  super_admin:  { bg: 'bg-purple-50',  text: 'text-purple-700',  ring: 'ring-purple-200' },
  staff:        { bg: 'bg-green-50',   text: 'text-green-700',   ring: 'ring-green-200' },
  viewer:       { bg: 'bg-gray-50',    text: 'text-gray-700',    ring: 'ring-gray-200' },
};

// ════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════════════════════════════
export function UsersPanel() {
  const { t, locale } = useI18n();

  // Data state
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [regions, setRegions] = useState<RegionItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterRegion, setFilterRegion] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  // Modal state
  const [viewUser, setViewUser] = useState<AdminUser | null>(null);
  const [editUser, setEditUser] = useState<AdminUser | null>(null);
  const [deleteUser, setDeleteUser] = useState<AdminUser | null>(null);
  const [toggleUser, setToggleUser] = useState<AdminUser | null>(null);
  const [resetPwUser, setResetPwUser] = useState<AdminUser | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  // Toast
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Current admin role (from localStorage)
  const currentRole = useMemo(() => {
    if (typeof window === 'undefined') return null;
    try {
      const u = JSON.parse(localStorage.getItem('adminUser') || 'null');
      return u?.role || null;
    } catch { return null; }
  }, []);
  const canWrite = !!currentRole && ['super_admin', 'region_admin', 'staff'].includes(currentRole);
  const canCreateAdmin = currentRole === 'super_admin';
  const canDelete = currentRole === 'super_admin';

  // Debounce search
  useEffect(() => {
    const tm = setTimeout(() => setDebouncedSearch(searchQuery), 400);
    return () => clearTimeout(tm);
  }, [searchQuery]);

  // Fetch regions once
  useEffect(() => {
    userApi('/api/users/admin/regions/').then((r) => {
      setRegions(r.results || []);
    }).catch(() => {});
  }, []);

  // Fetch data
  const loadData = useCallback(async (initial = false) => {
    try {
      if (initial) setLoading(true); else setRefreshing(true);
      setError(null);

      const params = new URLSearchParams();
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (filterRole) params.set('role', filterRole);
      if (filterStatus) params.set('is_active', filterStatus);
      if (filterRegion) params.set('region', filterRegion);
      params.set('limit', String(itemsPerPage));
      params.set('offset', String((currentPage - 1) * itemsPerPage));

      const [s, l] = await Promise.all([
        userApi('/api/users/admin/stats/'),
        userApi(`/api/users/admin/list/?${params.toString()}`),
      ]);
      setStats(s);
      setUsers(l.results || []);
      setTotal(l.count || 0);
    } catch (e: any) {
      setError(e.message || t('common.error'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [debouncedSearch, filterRole, filterStatus, filterRegion, currentPage, t]);

  useEffect(() => { loadData(true); }, []); // eslint-disable-line
  useEffect(() => { loadData(false); }, [loadData]); // eslint-disable-line

  // Reset to page 1 when filters change
  useEffect(() => { setCurrentPage(1); }, [debouncedSearch, filterRole, filterStatus, filterRegion]);

  // Stat cards
  const statCards = [
    { key: 'total',     label: t('admin.users_panel.all_users'),  icon: Users,    color: '#1A56A0', filter: '' },
    { key: 'coaches',   label: t('admin.users_panel.coaches'),    icon: Award,    color: '#27AE60', filter: 'coach' },
    { key: 'admins',    label: t('admin.users_panel.admins'),     icon: Shield,   color: '#9B59B6', filter: 'admins' },
    { key: 'active_now', label: t('admin.users_panel.active_now'), icon: Activity, color: '#F39C12', filter: '' },
  ];

  const totalPages = Math.max(1, Math.ceil(total / itemsPerPage));
  const pageNumbers = useMemo(() => {
    const range: number[] = [];
    const maxButtons = 5;
    let start = Math.max(1, currentPage - 2);
    let end = Math.min(totalPages, start + maxButtons - 1);
    if (end - start + 1 < maxButtons) start = Math.max(1, end - maxButtons + 1);
    for (let i = start; i <= end; i++) range.push(i);
    return range;
  }, [currentPage, totalPages]);

  // ── Actions ──────────────────────────
  const handleToggleActive = async (user: AdminUser) => {
    try {
      await userApi(`/api/users/admin/${user.id}/toggle-active/`, 'POST');
      showToast(t('common.success'));
      setToggleUser(null);
      loadData(false);
    } catch (e: any) {
      showToast(e.message, 'error');
    }
  };

  const handleDelete = async (user: AdminUser) => {
    try {
      await userApi(`/api/users/admin/${user.id}/delete/`, 'DELETE');
      showToast(t('common.success'));
      setDeleteUser(null);
      loadData(false);
    } catch (e: any) {
      showToast(e.message, 'error');
    }
  };

  const handleEdit = async (payload: Partial<AdminUser> & { region_id?: number | null }) => {
    if (!editUser) return;
    try {
      await userApi(`/api/users/admin/${editUser.id}/update/`, 'PATCH', payload);
      showToast(t('common.success'));
      setEditUser(null);
      loadData(false);
    } catch (e: any) {
      showToast(e.message, 'error');
    }
  };

  const handleCreate = async (payload: any) => {
    try {
      await userApi('/api/users/admin/create/', 'POST', payload);
      showToast(t('common.success'));
      setShowCreate(false);
      loadData(false);
    } catch (e: any) {
      showToast(e.message, 'error');
      throw e;
    }
  };

  const handleResetPw = async (newPassword: string) => {
    if (!resetPwUser) return;
    try {
      await userApi(`/api/users/admin/${resetPwUser.id}/reset-password/`, 'POST', { password: newPassword });
      showToast(t('common.success'));
      setResetPwUser(null);
    } catch (e: any) {
      showToast(e.message, 'error');
      throw e;
    }
  };

  const handleExport = async () => {
    try {
      const params = new URLSearchParams();
      if (filterRole) params.set('role', filterRole);
      if (filterStatus) params.set('is_active', filterStatus);
      const token = localStorage.getItem('adminAccessToken') || localStorage.getItem('accessToken') || '';
      const r = await fetch(`/api/users/admin/export/?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const blob = await r.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `uff_foydalanuvchilar_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      showToast(t('common.success'));
    } catch (e: any) {
      showToast(e.message, 'error');
    }
  };

  const formatDate = (iso?: string | null, withTime = false) => {
    if (!iso) return '—';
    try {
      const d = new Date(iso);
      return d.toLocaleDateString(locale === 'ru' ? 'ru-RU' : 'uz-UZ', {
        day: '2-digit', month: 'short', year: 'numeric',
        ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
      });
    } catch { return String(iso); }
  };

  const roleLabel = (role: string) => {
    const map: Record<string, string> = {
      coach: t('admin.users_panel.roles.coach'),
      region_admin: t('admin.users_panel.roles.region_admin'),
      super_admin: t('admin.users_panel.roles.super_admin'),
      staff: t('admin.users_panel.roles.staff'),
      viewer: t('admin.users_panel.roles.viewer'),
    };
    return map[role] || role;
  };

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
          <h1 className="text-2xl font-bold text-gray-900">{t('admin.users_panel.title')}</h1>
          <p className="text-gray-500 mt-1">{t('admin.users_panel.subtitle')}</p>
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
              {t('admin.users_panel.new_user')}
            </button>
          )}
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, index) => {
          const Icon = card.icon;
          const value = stats ? (stats as any)[card.key] : 0;
          const growth = stats?.growth ? (stats.growth as any)[card.key === 'admins' ? 'admins' : card.key === 'coaches' ? 'coaches' : 'total'] : 0;
          return (
            <motion.div
              key={card.key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-all"
            >
              <div className="flex items-center justify-between mb-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: card.color + '15' }}
                >
                  <Icon className="w-5 h-5" style={{ color: card.color }} />
                </div>
                {stats && growth !== undefined && card.key !== 'active_now' && (
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    growth >= 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'
                  }`}>
                    {growth >= 0 ? '+' : ''}{growth}%
                  </span>
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
            </motion.div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder={t('common.search')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A56A0]"
            />
          </div>
          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="px-4 py-2.5 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#1A56A0]"
          >
            <option value="">{t('common.all')}</option>
            <option value="coach">{t('admin.users_panel.roles.coach')}</option>
            <option value="region_admin">{t('admin.users_panel.roles.region_admin')}</option>
            <option value="super_admin">{t('admin.users_panel.roles.super_admin')}</option>
            <option value="staff">{t('admin.users_panel.roles.staff')}</option>
            <option value="viewer">{t('admin.users_panel.roles.viewer')}</option>
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2.5 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#1A56A0]"
          >
            <option value="">{t('common.all')}</option>
            <option value="true">{t('profile.status.active')}</option>
            <option value="false">{t('admin.users_panel.inactive')}</option>
          </select>
          {regions.length > 0 && (
            <select
              value={filterRegion}
              onChange={(e) => setFilterRegion(e.target.value)}
              className="px-4 py-2.5 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#1A56A0]"
            >
              <option value="">{t('common.all')}</option>
              {regions.map((r) => (
                <option key={r.id} value={r.id}>
                  {locale === 'ru' ? r.name_ru : r.name_uz}
                </option>
              ))}
            </select>
          )}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-[#1A56A0]' : 'text-gray-500'}`}
              title="List"
            >
              <FileText className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-[#1A56A0]' : 'text-gray-500'}`}
              title="Grid"
            >
              <Users className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700 flex-1">{error}</p>
          <button onClick={() => loadData(true)} className="text-sm text-red-700 underline">
            {t('common.retry')}
          </button>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="bg-white rounded-xl border border-gray-100 p-8">
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-16 bg-gray-100 rounded-lg animate-pulse" />
            ))}
          </div>
        </div>
      ) : users.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
          <Users className="w-16 h-16 mx-auto text-gray-300 mb-3" />
          <p className="text-lg font-medium text-gray-900">{t('admin.users_panel.not_found')}</p>
        </div>
      ) : viewMode === 'list' ? (
        <UserListView
          users={users}
          onView={setViewUser}
          onEdit={canWrite ? setEditUser : undefined}
          onToggle={canWrite ? setToggleUser : undefined}
          onResetPw={canWrite ? setResetPwUser : undefined}
          onDelete={canDelete ? setDeleteUser : undefined}
          t={t}
          locale={locale}
          formatDate={formatDate}
          roleLabel={roleLabel}
        />
      ) : (
        <UserGridView
          users={users}
          onView={setViewUser}
          onEdit={canWrite ? setEditUser : undefined}
          onToggle={canWrite ? setToggleUser : undefined}
          t={t}
          locale={locale}
          formatDate={formatDate}
          roleLabel={roleLabel}
        />
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-white rounded-xl p-4 border border-gray-100">
          <span className="text-sm text-gray-600">
            {(currentPage - 1) * itemsPerPage + 1}–{Math.min(currentPage * itemsPerPage, total)} / {total}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {pageNumbers.map((p) => (
              <button
                key={p}
                onClick={() => setCurrentPage(p)}
                className={`min-w-[32px] h-8 rounded-lg text-sm font-medium ${
                  p === currentPage ? 'bg-[#1A56A0] text-white' : 'hover:bg-gray-100'
                }`}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg hover:bg-gray-100 disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      <UserDetailModal
        user={viewUser}
        onClose={() => setViewUser(null)}
        t={t}
        locale={locale}
        formatDate={formatDate}
        roleLabel={roleLabel}
      />
      <UserEditModal
        user={editUser}
        regions={regions}
        canEditRole={canCreateAdmin}
        onClose={() => setEditUser(null)}
        onSave={handleEdit}
        t={t}
        locale={locale}
      />
      <UserCreateModal
        open={showCreate}
        regions={regions}
        canCreateAdmin={canCreateAdmin}
        onClose={() => setShowCreate(false)}
        onCreate={handleCreate}
        t={t}
        locale={locale}
      />
      <ConfirmModal
        open={!!toggleUser}
        title={toggleUser?.is_active ? t('admin.users_panel.confirm_deactivate') : t('admin.users_panel.confirm_activate')}
        message={toggleUser?.full_name || toggleUser?.phone || ''}
        confirmLabel={toggleUser?.is_active ? t('admin.users_panel.deactivate') : t('admin.users_panel.activate')}
        confirmColor={toggleUser?.is_active ? 'amber' : 'green'}
        onClose={() => setToggleUser(null)}
        onConfirm={() => toggleUser && handleToggleActive(toggleUser)}
        t={t}
      />
      <ConfirmModal
        open={!!deleteUser}
        title={t('admin.users_panel.confirm_delete')}
        message={`${deleteUser?.full_name || deleteUser?.phone || ''} — ${t('admin.users_panel.delete_warning')}`}
        confirmLabel={t('common.delete')}
        confirmColor="red"
        onClose={() => setDeleteUser(null)}
        onConfirm={() => deleteUser && handleDelete(deleteUser)}
        t={t}
      />
      <ResetPasswordModal
        user={resetPwUser}
        onClose={() => setResetPwUser(null)}
        onConfirm={handleResetPw}
        t={t}
      />
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// LIST VIEW (Table)
// ════════════════════════════════════════════════════════════════════
function UserListView({
  users, onView, onEdit, onToggle, onResetPw, onDelete, t, locale, formatDate, roleLabel,
}: any) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{t('admin.table.user')}</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{t('admin.table.role')}</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{t('admin.table.region')}</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">{t('admin.users_panel.applications_count')}</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase">{t('admin.users_panel.licenses_count')}</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{t('admin.table.status')}</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">{t('admin.users_panel.last_login')}</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase">{t('common.view')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.map((user: AdminUser, idx: number) => {
              const rc = ROLE_COLORS[user.role] || ROLE_COLORS.viewer;
              return (
                <motion.tr
                  key={user.id}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.02 }}
                  className="hover:bg-gray-50"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3 min-w-0">
                      {user.avatar_url ? (
                        <img src={user.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover flex-shrink-0" />
                      ) : (
                        <div className="w-10 h-10 bg-gradient-to-br from-[#1A56A0] to-[#0D3B6E] rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0">
                          {user.initials}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="font-medium text-gray-900 truncate">{user.full_name || '—'}</p>
                        <p className="text-xs text-gray-500 truncate">{user.phone}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${rc.bg} ${rc.text} ring-1 ${rc.ring}`}>
                      {roleLabel(user.role)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-700">
                    {user.region || <span className="text-gray-400">—</span>}
                  </td>
                  <td className="px-4 py-3 text-center text-sm font-medium text-gray-700">
                    {user.applications_count || 0}
                  </td>
                  <td className="px-4 py-3 text-center text-sm font-medium text-gray-700">
                    {user.active_licenses_count || 0}
                  </td>
                  <td className="px-4 py-3">
                    {user.is_active ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700">
                        <CheckCircle className="w-3 h-3" />
                        {t('profile.status.active')}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                        <XCircle className="w-3 h-3" />
                        {t('admin.users_panel.inactive')}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {formatDate(user.last_login, true)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => onView(user)}
                        className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-500 hover:text-[#1A56A0]"
                        title={t('common.view')}
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {onEdit && (
                        <button
                          onClick={() => onEdit(user)}
                          className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-500 hover:text-blue-600"
                          title={t('common.edit')}
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                      )}
                      {onResetPw && (
                        <button
                          onClick={() => onResetPw(user)}
                          className="p-1.5 rounded-lg hover:bg-purple-50 text-gray-500 hover:text-purple-600"
                          title={t('admin.users_panel.reset_password')}
                        >
                          <Key className="w-4 h-4" />
                        </button>
                      )}
                      {onToggle && (
                        <button
                          onClick={() => onToggle(user)}
                          className={`p-1.5 rounded-lg ${user.is_active ? 'hover:bg-amber-50 hover:text-amber-600' : 'hover:bg-green-50 hover:text-green-600'} text-gray-500`}
                          title={user.is_active ? t('admin.users_panel.deactivate') : t('admin.users_panel.activate')}
                        >
                          {user.is_active ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                        </button>
                      )}
                      {onDelete && (
                        <button
                          onClick={() => onDelete(user)}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-gray-500 hover:text-red-600"
                          title={t('common.delete')}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// GRID VIEW
// ════════════════════════════════════════════════════════════════════
function UserGridView({ users, onView, onEdit, onToggle, t, formatDate, roleLabel }: any) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {users.map((user: AdminUser, idx: number) => {
        const rc = ROLE_COLORS[user.role] || ROLE_COLORS.viewer;
        return (
          <motion.div
            key={user.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.04 }}
            className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all p-5"
          >
            <div className="flex items-start gap-3 mb-4">
              {user.avatar_url ? (
                <img src={user.avatar_url} alt="" className="w-14 h-14 rounded-full object-cover flex-shrink-0" />
              ) : (
                <div className="w-14 h-14 bg-gradient-to-br from-[#1A56A0] to-[#0D3B6E] rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                  {user.initials}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-gray-900 truncate">{user.full_name || '—'}</p>
                <p className="text-xs text-gray-500 truncate flex items-center gap-1">
                  <Phone className="w-3 h-3" /> {user.phone}
                </p>
                {user.email && (
                  <p className="text-xs text-gray-500 truncate flex items-center gap-1 mt-0.5">
                    <Mail className="w-3 h-3" /> {user.email}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${rc.bg} ${rc.text} ring-1 ${rc.ring}`}>
                {roleLabel(user.role)}
              </span>
              {user.is_active ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700">
                  <CheckCircle className="w-3 h-3" />
                  {t('profile.status.active')}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                  <XCircle className="w-3 h-3" />
                  {t('admin.users_panel.inactive')}
                </span>
              )}
            </div>

            {user.region && (
              <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-3">
                <MapPin className="w-3.5 h-3.5" />
                {user.region}
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 pb-3 mb-3 border-b border-gray-100">
              <div className="bg-gray-50 rounded-lg p-2">
                <p className="text-xs text-gray-500">{t('admin.users_panel.applications_count')}</p>
                <p className="font-semibold text-gray-900">{user.applications_count || 0}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-2">
                <p className="text-xs text-gray-500">{t('admin.users_panel.licenses_count')}</p>
                <p className="font-semibold text-gray-900">{user.active_licenses_count || 0}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onView(user)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 border border-gray-200 hover:border-[#1A56A0] hover:bg-blue-50 hover:text-[#1A56A0] rounded-lg text-sm font-medium text-gray-700 transition-all"
              >
                <Eye className="w-4 h-4" />
                {t('common.view')}
              </button>
              {onEdit && (
                <button
                  onClick={() => onEdit(user)}
                  className="p-2 border border-gray-200 hover:border-blue-300 hover:bg-blue-50 rounded-lg text-gray-500 hover:text-blue-600 transition-all"
                  title={t('common.edit')}
                >
                  <Edit className="w-4 h-4" />
                </button>
              )}
              {onToggle && (
                <button
                  onClick={() => onToggle(user)}
                  className={`p-2 border border-gray-200 rounded-lg text-gray-500 transition-all ${
                    user.is_active
                      ? 'hover:border-amber-300 hover:bg-amber-50 hover:text-amber-600'
                      : 'hover:border-green-300 hover:bg-green-50 hover:text-green-600'
                  }`}
                  title={user.is_active ? t('admin.users_panel.deactivate') : t('admin.users_panel.activate')}
                >
                  {user.is_active ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                </button>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// MODAL: Detail
// ════════════════════════════════════════════════════════════════════
function UserDetailModal({ user, onClose, t, locale, formatDate, roleLabel }: any) {
  const [detail, setDetail] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) { setDetail(null); return; }
    setLoading(true);
    userApi(`/api/users/admin/${user.id}/`)
      .then(setDetail)
      .catch(() => setDetail(user))
      .finally(() => setLoading(false));
  }, [user]);

  return (
    <AnimatePresence>
      {user && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-[80] bg-black/60 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          >
            <div className="bg-gradient-to-r from-[#1A56A0] to-[#0D3B6E] p-6 text-white relative">
              <button onClick={onClose} className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-lg">
                <X className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-4">
                {user.avatar_url ? (
                  <img src={user.avatar_url} alt="" className="w-16 h-16 rounded-full object-cover border-2 border-white/30" />
                ) : (
                  <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center text-xl font-bold backdrop-blur">
                    {user.initials}
                  </div>
                )}
                <div className="min-w-0">
                  <h2 className="text-xl font-bold truncate">{user.full_name || user.phone}</h2>
                  <p className="text-sm text-white/80">{roleLabel(user.role)}</p>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-[#1A56A0]" />
                </div>
              ) : (
                <>
                  {/* Contact info */}
                  <div className="space-y-2.5">
                    {[
                      { icon: Phone, label: t('applications.fields.phone'), value: detail?.phone },
                      { icon: Mail, label: t('profile.fields.email'), value: detail?.email },
                      { icon: MapPin, label: t('applications.fields.region'), value: locale === 'ru' ? (detail?.region_ru || detail?.region) : detail?.region },
                      { icon: Building2, label: t('applications.fields.workplace'), value: detail?.workplace },
                      { icon: Briefcase, label: t('applications.fields.job_title'), value: detail?.job_title },
                      { icon: Clock, label: t('applications.fields.coaching_years'), value: detail?.coaching_years ? `${detail.coaching_years} ${t('applications.fields.years')}` : '' },
                      { icon: Calendar, label: t('admin.users_panel.registered_at'), value: formatDate(detail?.created_at, true) },
                      { icon: Activity, label: t('admin.users_panel.last_login'), value: formatDate(detail?.last_login, true) },
                    ].filter((r) => r.value).map((row) => {
                      const Icon = row.icon;
                      return (
                        <div key={row.label} className="flex items-start gap-3 py-2 border-b border-gray-100 last:border-b-0">
                          <Icon className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                          <span className="text-sm text-gray-500 w-40 flex-shrink-0">{row.label}</span>
                          <span className="text-sm font-medium text-gray-900 flex-1 break-words">{row.value}</span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Recent applications */}
                  {detail?.recent_applications && detail.recent_applications.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 mt-5 mb-2 flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        {t('admin.users_panel.recent_applications')}
                      </h3>
                      <div className="space-y-2">
                        {detail.recent_applications.map((a: any) => (
                          <div key={a.id} className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg">
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {a.license_type_name || a.license_type_code}
                              </p>
                              <p className="text-xs text-gray-500">{formatDate(a.submitted_at)}</p>
                            </div>
                            <span className="text-xs font-medium text-gray-600 px-2 py-1 bg-white rounded-full">
                              {t(`applications.status.${a.status}`) || a.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Licenses */}
                  {detail?.licenses && detail.licenses.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 mt-5 mb-2 flex items-center gap-2">
                        <Award className="w-4 h-4" />
                        {t('admin.users_panel.recent_licenses')}
                      </h3>
                      <div className="space-y-2">
                        {detail.licenses.map((l: any) => (
                          <div key={l.id} className="flex items-center justify-between p-2.5 bg-gray-50 rounded-lg">
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate font-mono">
                                {l.license_number}
                              </p>
                              <p className="text-xs text-gray-500">{l.license_type_name}</p>
                            </div>
                            <span className="text-xs font-medium text-gray-600 px-2 py-1 bg-white rounded-full">
                              {t(`licenses.status.${l.status}`) || l.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ════════════════════════════════════════════════════════════════════
// MODAL: Edit
// ════════════════════════════════════════════════════════════════════
function UserEditModal({ user, regions, canEditRole, onClose, onSave, t, locale }: any) {
  const [form, setForm] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setForm({
        full_name: user.full_name || '',
        email: user.email || '',
        workplace: user.workplace || '',
        job_title: user.job_title || '',
        coaching_years: user.coaching_years || 0,
        role: user.role,
        region_id: user.region_id ?? '',
        is_active: user.is_active,
      });
    }
  }, [user]);

  const handleSubmit = async () => {
    if (!form) return;
    setSaving(true);
    try {
      const payload: any = { ...form };
      payload.region_id = payload.region_id === '' ? null : Number(payload.region_id);
      payload.coaching_years = Number(payload.coaching_years) || 0;
      if (!canEditRole) delete payload.role;
      await onSave(payload);
    } catch {} finally { setSaving(false); }
  };

  return (
    <AnimatePresence>
      {user && form && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-[80] bg-black/60 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
          >
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">{t('admin.users_panel.edit_user')}</h3>
              <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">{t('applications.fields.full_name')}</label>
                <input
                  type="text"
                  value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A56A0]"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">{t('profile.fields.email')}</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A56A0]"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">{t('applications.fields.workplace')}</label>
                  <input
                    type="text"
                    value={form.workplace}
                    onChange={(e) => setForm({ ...form, workplace: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A56A0]"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">{t('applications.fields.job_title')}</label>
                  <input
                    type="text"
                    value={form.job_title}
                    onChange={(e) => setForm({ ...form, job_title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A56A0]"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">{t('applications.fields.coaching_years')}</label>
                  <input
                    type="number"
                    min={0}
                    value={form.coaching_years}
                    onChange={(e) => setForm({ ...form, coaching_years: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A56A0]"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">{t('applications.fields.region')}</label>
                  <select
                    value={form.region_id}
                    onChange={(e) => setForm({ ...form, region_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#1A56A0]"
                  >
                    <option value="">—</option>
                    {regions.map((r: RegionItem) => (
                      <option key={r.id} value={r.id}>
                        {locale === 'ru' ? r.name_ru : r.name_uz}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              {canEditRole && (
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">{t('admin.table.role')}</label>
                  <select
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#1A56A0]"
                  >
                    <option value="coach">{t('admin.users_panel.roles.coach')}</option>
                    <option value="region_admin">{t('admin.users_panel.roles.region_admin')}</option>
                    <option value="super_admin">{t('admin.users_panel.roles.super_admin')}</option>
                    <option value="staff">{t('admin.users_panel.roles.staff')}</option>
                    <option value="viewer">{t('admin.users_panel.roles.viewer')}</option>
                  </select>
                </div>
              )}
            </div>

            <div className="p-5 border-t border-gray-100 flex gap-2 justify-end">
              <button
                onClick={onClose}
                disabled={saving}
                className="px-4 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="px-4 py-2 bg-[#1A56A0] hover:bg-[#0D3B6E] text-white rounded-lg text-sm font-medium flex items-center gap-2 disabled:opacity-60"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {t('common.save')}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ════════════════════════════════════════════════════════════════════
// MODAL: Create
// ════════════════════════════════════════════════════════════════════
function UserCreateModal({ open, regions, canCreateAdmin, onClose, onCreate, t, locale }: any) {
  const [form, setForm] = useState({
    phone: '',
    full_name: '',
    email: '',
    role: 'coach',
    region_id: '',
    workplace: '',
    job_title: '',
    password: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setForm({ phone: '', full_name: '', email: '', role: 'coach', region_id: '', workplace: '', job_title: '', password: '' });
    }
  }, [open]);

  const submit = async () => {
    if (!form.phone.trim()) return;
    setSaving(true);
    try {
      const payload: any = { ...form };
      payload.region_id = form.region_id === '' ? null : Number(form.region_id);
      if (!form.password) delete payload.password;
      await onCreate(payload);
    } catch {} finally { setSaving(false); }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-[80] bg-black/60 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
          >
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">{t('admin.users_panel.new_user')}</h3>
              <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <div className="p-5 space-y-3">
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">
                  {t('applications.fields.phone')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  placeholder="+998901234567"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A56A0]"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">{t('applications.fields.full_name')}</label>
                <input
                  type="text"
                  value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A56A0]"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">{t('profile.fields.email')}</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A56A0]"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">{t('admin.table.role')}</label>
                  <select
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#1A56A0]"
                  >
                    <option value="coach">{t('admin.users_panel.roles.coach')}</option>
                    {canCreateAdmin && (
                      <>
                        <option value="region_admin">{t('admin.users_panel.roles.region_admin')}</option>
                        <option value="super_admin">{t('admin.users_panel.roles.super_admin')}</option>
                      </>
                    )}
                    <option value="staff">{t('admin.users_panel.roles.staff')}</option>
                    <option value="viewer">{t('admin.users_panel.roles.viewer')}</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">{t('applications.fields.region')}</label>
                  <select
                    value={form.region_id}
                    onChange={(e) => setForm({ ...form, region_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#1A56A0]"
                  >
                    <option value="">—</option>
                    {regions.map((r: RegionItem) => (
                      <option key={r.id} value={r.id}>
                        {locale === 'ru' ? r.name_ru : r.name_uz}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500 mb-1 block">{t('admin.users_panel.new_password')}</label>
                <input
                  type="text"
                  placeholder="—"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A56A0]"
                />
              </div>
            </div>
            <div className="p-5 border-t border-gray-100 flex gap-2 justify-end">
              <button
                onClick={onClose}
                disabled={saving}
                className="px-4 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={submit}
                disabled={saving || !form.phone.trim()}
                className="px-4 py-2 bg-[#1A56A0] hover:bg-[#0D3B6E] text-white rounded-lg text-sm font-medium flex items-center gap-2 disabled:opacity-60"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {t('common.save')}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ════════════════════════════════════════════════════════════════════
// MODAL: Confirm
// ════════════════════════════════════════════════════════════════════
function ConfirmModal({ open, title, message, confirmLabel, confirmColor, onClose, onConfirm, t }: any) {
  const [loading, setLoading] = useState(false);
  const submit = async () => {
    setLoading(true);
    try { await onConfirm(); } finally { setLoading(false); }
  };
  const colorClass = confirmColor === 'red'
    ? 'bg-red-500 hover:bg-red-600'
    : confirmColor === 'amber'
    ? 'bg-amber-500 hover:bg-amber-600'
    : 'bg-green-500 hover:bg-green-600';

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={!loading ? onClose : undefined}
          className="fixed inset-0 z-[90] bg-black/60 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                confirmColor === 'red' ? 'bg-red-50' : confirmColor === 'amber' ? 'bg-amber-50' : 'bg-green-50'
              }`}>
                <AlertCircle className={`w-5 h-5 ${
                  confirmColor === 'red' ? 'text-red-500' : confirmColor === 'amber' ? 'text-amber-500' : 'text-green-500'
                }`} />
              </div>
              <h3 className="font-semibold text-gray-900">{title}</h3>
            </div>
            <p className="text-sm text-gray-600 mb-5">{message}</p>
            <div className="flex gap-2">
              <button
                onClick={onClose}
                disabled={loading}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 disabled:opacity-50"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={submit}
                disabled={loading}
                className={`flex-1 py-2.5 ${colorClass} text-white rounded-xl text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2`}
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ════════════════════════════════════════════════════════════════════
// MODAL: Reset Password
// ════════════════════════════════════════════════════════════════════
function ResetPasswordModal({ user, onClose, onConfirm, t }: any) {
  const [pw, setPw] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => { if (user) setPw(''); }, [user]);

  const submit = async () => {
    if (pw.length < 6) return;
    setLoading(true);
    try { await onConfirm(pw); } catch {} finally { setLoading(false); }
  };

  return (
    <AnimatePresence>
      {user && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={!loading ? onClose : undefined}
          className="fixed inset-0 z-[90] bg-black/60 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center">
                <Key className="w-5 h-5 text-purple-500" />
              </div>
              <h3 className="font-semibold text-gray-900">{t('admin.users_panel.reset_password')}</h3>
            </div>
            <p className="text-sm text-gray-500 mb-3 truncate">{user.full_name || user.phone}</p>
            <input
              type="text"
              autoFocus
              minLength={6}
              placeholder="••••••"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg mb-5 focus:outline-none focus:ring-2 focus:ring-[#1A56A0]"
            />
            <div className="flex gap-2">
              <button
                onClick={onClose}
                disabled={loading}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 disabled:opacity-50"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={submit}
                disabled={loading || pw.length < 6}
                className="flex-1 py-2.5 bg-purple-500 hover:bg-purple-600 text-white rounded-xl text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {t('common.save')}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default UsersPanel;
