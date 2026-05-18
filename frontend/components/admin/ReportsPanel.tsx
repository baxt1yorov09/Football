'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText, Plus, Download, Trash2, RefreshCw, Search, AlertCircle,
  CheckCircle, XCircle, Clock, BarChart3, Calendar, MapPin, Users, Award,
  X, Loader2, ChevronLeft, ChevronRight, Activity, Sparkles,
} from 'lucide-react';
import { useI18n } from '@/lib/i18n/I18nProvider';
import { adminApi, adminApiDownload } from '@/lib/adminApi';

// ════════════════════════════════════════════════════════════════════
// Types
// ════════════════════════════════════════════════════════════════════
interface ReportRow {
  id: number;
  type: string;
  type_display: string;
  title: string;
  description: string;
  status: 'generating' | 'completed' | 'failed';
  status_display: string;
  file_url: string;
  download_url: string;
  parameters: Record<string, any>;
  generated_by_name: string;
  generated_at: string | null;
  created_at: string;
  download_count: number;
}

interface ReportStats {
  total: number;
  this_month: number;
  today: number;
  completed: number;
  failed: number;
  downloads: number;
  by_type: Array<{ type: string; type_display: string; count: number }>;
}

interface Template {
  key: string;
  title_uz: string;
  title_ru: string;
  description_uz: string;
  description_ru: string;
  icon: string;
  color: string;
}

// ════════════════════════════════════════════════════════════════════
// API helper
// ════════════════════════════════════════════════════════════════════
// adminApi wrapper: 401 paytida avtomatik refresh + login sahifasiga yo'naltirish
function reportApi(path: string, method: string = 'GET', body?: any): Promise<any> {
  return adminApi(path, { method, body });
}

const ICONS: Record<string, any> = {
  FileText, Award, Users, MapPin, Calendar, BarChart3,
};

const STATUS_CFG: Record<string, { bg: string; text: string; icon: any; tKey: string }> = {
  generating: { bg: 'bg-blue-50',  text: 'text-blue-700',  icon: Loader2,      tKey: 'admin.reports_panel.generating' },
  completed:  { bg: 'bg-green-50', text: 'text-green-700', icon: CheckCircle,  tKey: 'admin.reports_panel.completed' },
  failed:     { bg: 'bg-red-50',   text: 'text-red-700',   icon: XCircle,      tKey: 'admin.reports_panel.failed' },
};

// ════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ════════════════════════════════════════════════════════════════════
export function ReportsPanel() {
  const { t, locale } = useI18n();

  // Data
  const [reports, setReports] = useState<ReportRow[]>([]);
  const [stats, setStats] = useState<ReportStats | null>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // Modals
  const [showGenerate, setShowGenerate] = useState(false);
  const [deleteReport, setDeleteReport] = useState<ReportRow | null>(null);

  // Toast
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Role
  const currentRole = useMemo(() => {
    if (typeof window === 'undefined') return null;
    try {
      const u = JSON.parse(localStorage.getItem('adminUser') || 'null');
      return u?.role || null;
    } catch { return null; }
  }, []);
  const canWrite = !!currentRole && ['super_admin', 'region_admin', 'staff'].includes(currentRole);
  const canDelete = currentRole === 'super_admin';

  // Debounced search
  useEffect(() => {
    const tm = setTimeout(() => setDebouncedSearch(searchQuery), 400);
    return () => clearTimeout(tm);
  }, [searchQuery]);

  // Reset page on filter change
  useEffect(() => { setCurrentPage(1); }, [debouncedSearch, filterType, filterStatus]);

  // Fetch templates once
  useEffect(() => {
    reportApi('/api/reports/admin/templates/').then((r) => {
      setTemplates(r.results || []);
    }).catch(() => {});
  }, []);

  const loadData = useCallback(async (initial = false) => {
    try {
      if (initial) setLoading(true); else setRefreshing(true);
      setError(null);
      const params = new URLSearchParams();
      if (debouncedSearch) params.set('search', debouncedSearch);
      if (filterType) params.set('type', filterType);
      if (filterStatus) params.set('status', filterStatus);
      params.set('limit', String(itemsPerPage));
      params.set('offset', String((currentPage - 1) * itemsPerPage));

      const [s, l] = await Promise.all([
        reportApi('/api/reports/admin/stats/'),
        reportApi(`/api/reports/admin/list/?${params.toString()}`),
      ]);
      setStats(s);
      setReports(l.results || []);
      setTotal(l.count || 0);
    } catch (e: any) {
      setError(e.message || t('common.error'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [debouncedSearch, filterType, filterStatus, currentPage, t]);

  useEffect(() => { loadData(true); }, []); // eslint-disable-line
  useEffect(() => { loadData(false); }, [loadData]); // eslint-disable-line

  // Auto-refresh while any report is "generating"
  useEffect(() => {
    if (reports.some((r) => r.status === 'generating')) {
      const tm = setTimeout(() => loadData(false), 3000);
      return () => clearTimeout(tm);
    }
  }, [reports, loadData]);

  const handleGenerate = async (payload: any) => {
    try {
      await reportApi('/api/reports/admin/generate/', 'POST', payload);
      showToast(t('common.success'));
      setShowGenerate(false);
      loadData(false);
    } catch (e: any) {
      showToast(e.message, 'error');
      throw e;
    }
  };

  const handleDownload = async (r: ReportRow) => {
    try {
      const blob = await adminApiDownload(`/api/reports/admin/${r.id}/download/`);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${r.title.replace(/[^\w\u0400-\u04FF\u0100-\u017F\- ]/g, '')}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      loadData(false);
    } catch (e: any) {
      showToast(e.message, 'error');
    }
  };

  const handleDelete = async (r: ReportRow) => {
    try {
      await reportApi(`/api/reports/admin/${r.id}/delete/`, 'DELETE');
      showToast(t('common.success'));
      setDeleteReport(null);
      loadData(false);
    } catch (e: any) {
      showToast(e.message, 'error');
    }
  };

  // KPI cards
  const kpis = [
    { key: 'total',        label: t('admin.reports_panel.total_reports'), icon: FileText, color: '#3498DB' },
    { key: 'downloads',    label: t('admin.reports_panel.downloads'),     icon: Download, color: '#27AE60' },
    { key: 'today',        label: t('admin.reports_panel.today_created'), icon: Plus,     color: '#9B59B6' },
    { key: 'this_month',   label: t('admin.reports_panel.this_month'),    icon: Calendar, color: '#F39C12' },
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

  const formatDate = (iso?: string | null, withTime = true) => {
    if (!iso) return '—';
    try {
      return new Date(iso).toLocaleString(locale === 'ru' ? 'ru-RU' : 'uz-UZ', {
        day: '2-digit', month: 'short', year: 'numeric',
        ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
      });
    } catch { return iso; }
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
          <h1 className="text-2xl font-bold text-gray-900">{t('admin.reports_panel.title')}</h1>
          <p className="text-gray-500 mt-1">{t('admin.reports_panel.subtitle')}</p>
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
          {canWrite && (
            <button
              onClick={() => setShowGenerate(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-[#1A56A0] text-white rounded-xl hover:bg-[#0D3B6E] transition-all shadow-lg shadow-blue-500/25"
            >
              <Plus className="w-5 h-5" />
              {t('admin.reports_panel.new_report')}
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => {
          const Icon = kpi.icon;
          const value = stats ? (stats as any)[kpi.key] : 0;
          return (
            <motion.div
              key={kpi.key}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm"
            >
              <div className="flex items-center justify-between mb-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: kpi.color + '15' }}
                >
                  <Icon className="w-5 h-5" style={{ color: kpi.color }} />
                </div>
              </div>
              {loading && !stats ? (
                <>
                  <div className="h-7 w-16 bg-gray-100 rounded animate-pulse mb-1" />
                  <div className="h-4 w-24 bg-gray-50 rounded animate-pulse" />
                </>
              ) : (
                <>
                  <p className="text-2xl font-bold text-gray-900">
                    {Number(value || 0).toLocaleString(locale === 'ru' ? 'ru-RU' : 'uz-UZ')}
                  </p>
                  <p className="text-sm text-gray-500 mt-0.5">{kpi.label}</p>
                </>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Template Quick Picker (when no reports yet) */}
      {!loading && reports.length === 0 && !error && templates.length > 0 && (
        <div className="bg-gradient-to-br from-blue-50 via-white to-indigo-50 rounded-2xl border border-blue-100 p-8">
          <div className="text-center mb-6">
            <div className="w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-[#1A56A0] to-[#0D3B6E] rounded-2xl flex items-center justify-center shadow-lg">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">{t('admin.reports_panel.empty')}</h3>
            <p className="text-sm text-gray-600">{t('admin.reports_panel.empty_subtitle')}</p>
          </div>
          {canWrite && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-w-3xl mx-auto">
              {templates.map((tpl) => {
                const Icon = ICONS[tpl.icon] || FileText;
                return (
                  <button
                    key={tpl.key}
                    onClick={() => setShowGenerate(true)}
                    className="bg-white p-4 rounded-xl border border-gray-100 hover:border-[#1A56A0] hover:shadow-md text-left transition-all"
                  >
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center mb-3"
                      style={{ backgroundColor: tpl.color + '15' }}
                    >
                      <Icon className="w-5 h-5" style={{ color: tpl.color }} />
                    </div>
                    <p className="font-semibold text-gray-900 text-sm mb-1">
                      {locale === 'ru' ? tpl.title_ru : tpl.title_uz}
                    </p>
                    <p className="text-xs text-gray-500 line-clamp-2">
                      {locale === 'ru' ? tpl.description_ru : tpl.description_uz}
                    </p>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Filters */}
      {(!loading && reports.length > 0) || debouncedSearch || filterType || filterStatus ? (
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
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2.5 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#1A56A0]"
            >
              <option value="">{t('common.all')}</option>
              <option value="monthly">{t('admin.reports_panel.monthly_reports')}</option>
              <option value="quarterly">Q</option>
              <option value="yearly">{locale === 'ru' ? 'Годовой' : 'Yillik'}</option>
              <option value="custom">{locale === 'ru' ? 'Произвольный' : 'Maxsus'}</option>
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2.5 border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-[#1A56A0]"
            >
              <option value="">{t('common.all')}</option>
              <option value="completed">{t('admin.reports_panel.completed')}</option>
              <option value="generating">{t('admin.reports_panel.generating')}</option>
              <option value="failed">{t('admin.reports_panel.failed')}</option>
            </select>
          </div>
        </div>
      ) : null}

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

      {/* Reports grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 p-5 animate-pulse">
              <div className="h-10 w-10 bg-gray-200 rounded-lg mb-3" />
              <div className="h-4 w-3/4 bg-gray-200 rounded mb-2" />
              <div className="h-3 w-1/2 bg-gray-100 rounded" />
            </div>
          ))}
        </div>
      ) : reports.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {reports.map((r, idx) => {
            const sc = STATUS_CFG[r.status] || STATUS_CFG.generating;
            const StatusIcon = sc.icon;
            // Dinamik tarjima: agar hisobot template asosida yaratilgan bo'lsa
            // va sarlavhasi standart bo'lsa, joriy locale'ga qarab ko'rsatamiz.
            const tplKey = r.parameters?.template as string | undefined;
            const tpl = tplKey ? templates.find((tt) => tt.key === tplKey) : undefined;
            const isDefaultTitle = !!tpl && (r.title === tpl.title_uz || r.title === tpl.title_ru);
            const isDefaultDesc = !!tpl && (r.description === tpl.description_uz || r.description === tpl.description_ru);
            const displayTitle = isDefaultTitle && tpl
              ? (locale === 'ru' ? tpl.title_ru : tpl.title_uz)
              : r.title;
            const displayDesc = isDefaultDesc && tpl
              ? (locale === 'ru' ? tpl.description_ru : tpl.description_uz)
              : r.description;
            return (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03 }}
                className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md p-5 flex flex-col"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-[#1A56A0]" />
                  </div>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${sc.bg} ${sc.text}`}>
                    <StatusIcon className={`w-3 h-3 ${r.status === 'generating' ? 'animate-spin' : ''}`} />
                    {t(sc.tKey)}
                  </span>
                </div>
                <h3 className="font-semibold text-gray-900 line-clamp-2 mb-1">{displayTitle}</h3>
                {displayDesc && (
                  <p className="text-xs text-gray-500 line-clamp-2 mb-3">{displayDesc}</p>
                )}

                <div className="space-y-1.5 mt-auto text-xs text-gray-500">
                  <div className="flex items-center justify-between">
                    <span>{t('admin.reports_panel.created_at')}</span>
                    <span className="font-medium text-gray-700">{formatDate(r.created_at)}</span>
                  </div>
                  {r.generated_by_name && (
                    <div className="flex items-center justify-between">
                      <span>{t('admin.reports_panel.generated_by')}</span>
                      <span className="font-medium text-gray-700 truncate ml-2">{r.generated_by_name}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span>{t('admin.reports_panel.downloads_count')}</span>
                    <span className="font-medium text-gray-700">{r.download_count}</span>
                  </div>
                </div>

                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => handleDownload(r)}
                    disabled={r.status !== 'completed'}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-[#1A56A0] hover:bg-[#0D3B6E] text-white rounded-lg text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Download className="w-4 h-4" />
                    {t('admin.reports_panel.download')}
                  </button>
                  {canDelete && (
                    <button
                      onClick={() => setDeleteReport(r)}
                      className="p-2 border border-gray-200 hover:border-red-300 hover:bg-red-50 hover:text-red-600 rounded-lg text-gray-500 transition-all"
                      title={t('common.delete')}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : null}

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
      <GenerateReportModal
        open={showGenerate}
        templates={templates}
        onClose={() => setShowGenerate(false)}
        onSubmit={handleGenerate}
        t={t}
        locale={locale}
      />
      <ConfirmDeleteModal
        report={deleteReport}
        templates={templates}
        locale={locale}
        onClose={() => setDeleteReport(null)}
        onConfirm={() => deleteReport && handleDelete(deleteReport)}
        t={t}
      />
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════
// MODAL: Generate
// ════════════════════════════════════════════════════════════════════
function GenerateReportModal({ open, templates, onClose, onSubmit, t, locale }: any) {
  const [step, setStep] = useState<'pick' | 'configure'>('pick');
  const [picked, setPicked] = useState<Template | null>(null);
  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [months, setMonths] = useState('12');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setStep('pick');
      setPicked(null);
      setTitle('');
      setStartDate('');
      setEndDate('');
      setMonths('12');
    }
  }, [open]);

  const submit = async () => {
    if (!picked) return;
    setSaving(true);
    try {
      const payload: any = { template: picked.key, language: locale };
      if (title.trim()) payload.title = title.trim();
      if (startDate) payload.start_date = startDate;
      if (endDate) payload.end_date = endDate;
      if (picked.key === 'monthly_activity' && months) payload.months = Number(months);
      await onSubmit(payload);
    } catch {} finally { setSaving(false); }
  };

  const showDateRange = picked && picked.key !== 'monthly_activity' && picked.key !== 'regional';
  const showMonths = picked && picked.key === 'monthly_activity';

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
            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          >
            <div className="p-5 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">
                {step === 'pick'
                  ? t('admin.reports_panel.choose_template')
                  : t('admin.reports_panel.new_report')}
              </h3>
              <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {step === 'pick' ? (
              <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
                {templates.map((tpl: Template) => {
                  const Icon = ICONS[tpl.icon] || FileText;
                  return (
                    <button
                      key={tpl.key}
                      onClick={() => { setPicked(tpl); setStep('configure'); }}
                      className="text-left p-4 rounded-xl border border-gray-200 hover:border-[#1A56A0] hover:bg-blue-50/30 transition-all"
                    >
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center mb-3"
                        style={{ backgroundColor: tpl.color + '15' }}
                      >
                        <Icon className="w-5 h-5" style={{ color: tpl.color }} />
                      </div>
                      <p className="font-semibold text-gray-900 text-sm mb-1">
                        {locale === 'ru' ? tpl.title_ru : tpl.title_uz}
                      </p>
                      <p className="text-xs text-gray-500 line-clamp-2">
                        {locale === 'ru' ? tpl.description_ru : tpl.description_uz}
                      </p>
                    </button>
                  );
                })}
              </div>
            ) : (
              <div className="p-5 space-y-4">
                {picked && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center gap-3">
                    {(() => {
                      const Icon = ICONS[picked.icon] || FileText;
                      return (
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: picked.color + '20' }}
                        >
                          <Icon className="w-5 h-5" style={{ color: picked.color }} />
                        </div>
                      );
                    })()}
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-gray-900 text-sm">
                        {locale === 'ru' ? picked.title_ru : picked.title_uz}
                      </p>
                      <p className="text-xs text-gray-600 line-clamp-1">
                        {locale === 'ru' ? picked.description_ru : picked.description_uz}
                      </p>
                    </div>
                    <button
                      onClick={() => setStep('pick')}
                      className="text-xs text-[#1A56A0] hover:underline flex-shrink-0"
                    >
                      {t('common.edit')}
                    </button>
                  </div>
                )}

                <div>
                  <label className="text-xs font-medium text-gray-500 mb-1 block">
                    {t('admin.reports_panel.title_label')}
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={picked ? (locale === 'ru' ? picked.title_ru : picked.title_uz) : ''}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A56A0]"
                  />
                </div>

                {showDateRange && (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-gray-500 mb-1 block">
                        {t('admin.reports_panel.period_start')}
                      </label>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A56A0]"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 mb-1 block">
                        {t('admin.reports_panel.period_end')}
                      </label>
                      <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A56A0]"
                      />
                    </div>
                  </div>
                )}

                {showMonths && (
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-1 block">
                      {t('admin.reports_panel.months')}
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={36}
                      value={months}
                      onChange={(e) => setMonths(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A56A0]"
                    />
                  </div>
                )}
              </div>
            )}

            {step === 'configure' && (
              <div className="p-5 border-t border-gray-100 flex gap-2 justify-end">
                <button
                  onClick={() => setStep('pick')}
                  disabled={saving}
                  className="px-4 py-2 border border-gray-200 rounded-lg text-sm hover:bg-gray-50"
                >
                  {t('common.back')}
                </button>
                <button
                  onClick={submit}
                  disabled={saving || !picked}
                  className="px-4 py-2 bg-[#1A56A0] hover:bg-[#0D3B6E] text-white rounded-lg text-sm font-medium flex items-center gap-2 disabled:opacity-60"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {t('admin.reports_panel.generate')}
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ════════════════════════════════════════════════════════════════════
// MODAL: Confirm Delete
// ════════════════════════════════════════════════════════════════════
function ConfirmDeleteModal({ report, templates, locale, onClose, onConfirm, t }: any) {
  const [loading, setLoading] = useState(false);
  const submit = async () => {
    setLoading(true);
    try { await onConfirm(); } finally { setLoading(false); }
  };
  // Locale'ga mos sarlavhani aniqlash
  const tplKey: string | undefined = report?.parameters?.template;
  const tpl: Template | undefined = tplKey && Array.isArray(templates)
    ? templates.find((tt: Template) => tt.key === tplKey)
    : undefined;
  const isDefaultTitle = !!tpl && report && (report.title === tpl.title_uz || report.title === tpl.title_ru);
  const displayTitle = isDefaultTitle && tpl
    ? (locale === 'ru' ? tpl.title_ru : tpl.title_uz)
    : report?.title;
  return (
    <AnimatePresence>
      {report && (
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
              <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-red-500" />
              </div>
              <h3 className="font-semibold text-gray-900">{t('admin.reports_panel.confirm_delete')}</h3>
            </div>
            <p className="text-sm text-gray-600 mb-5 break-words">{displayTitle}</p>
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
                className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {t('common.delete')}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default ReportsPanel;
