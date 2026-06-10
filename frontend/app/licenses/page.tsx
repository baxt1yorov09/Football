'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, Download, Eye, Award, CheckCircle, XCircle, Clock,
  AlertCircle, RefreshCw, FileText, Calendar, MapPin, X,
  ShieldCheck, QrCode, Plus, Sparkles,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { SmartSidebar } from '@/components/layout/SmartSidebar';
import { useAuth } from '@/hooks/useAuth';
import { useI18n } from '@/lib/i18n/I18nProvider';
import Link from 'next/link';

// ============ Types ============
interface MyLicense {
  id: string;
  license_number: string;
  license_type_code: string;
  license_type_name: string;
  license_type_category: string;
  color_hex: string;
  region: string;
  status: 'active' | 'expired' | 'suspended' | 'revoked';
  status_display: string;
  issued_at: string;
  expires_at: string;
  days_left: number;
  is_expiring_soon: boolean;
  is_active: boolean;
  pdf_url: string;
  qr_code_url: string;
  verification_url: string;
}

interface APIResponse {
  count: number;
  summary: {
    total: number;
    active: number;
    expired: number;
    suspended: number;
    expiring_soon: number;
  };
  results: MyLicense[];
}

// ============ Helpers ============
function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('accessToken') || localStorage.getItem('adminAccessToken');
}

const STATUS_CFG: Record<MyLicense['status'], { tKey: string; bg: string; text: string; ring: string; icon: any }> = {
  active:    { tKey: 'licenses.status.active',    bg: 'bg-green-50',  text: 'text-green-700',  ring: 'ring-green-200', icon: CheckCircle },
  expired:   { tKey: 'licenses.status.expired',   bg: 'bg-red-50',    text: 'text-red-700',    ring: 'ring-red-200',   icon: XCircle },
  suspended: { tKey: 'licenses.status.suspended', bg: 'bg-amber-50',  text: 'text-amber-700',  ring: 'ring-amber-200', icon: Clock },
  revoked:   { tKey: 'licenses.status.revoked',   bg: 'bg-gray-50',   text: 'text-gray-700',   ring: 'ring-gray-200',  icon: XCircle },
};

function formatDate(iso: string, locale: string = 'uz'): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString(locale === 'ru' ? 'ru-RU' : 'uz-UZ', {
      day: '2-digit', month: 'long', year: 'numeric',
    });
  } catch { return iso; }
}

// ============ MAIN ============
export default function LicensesPage() {
  const { t, locale } = useI18n();
  const router = useRouter();
  const { user } = useAuth();
  const [redirecting, setRedirecting] = useState(false);

  // Admin'larni admin paneliga yo'naltirish
  useEffect(() => {
    // Faqat /admin/login orqali kirgan adminlarni admin paneliga yo'naltiramiz.
    const hasAdminToken =
      typeof window !== 'undefined' && !!localStorage.getItem('adminAccessToken');
    if (hasAdminToken) {
      setRedirecting(true);
      router.replace('/admin?tab=licenses');
    }
  }, [user, router]);

  const [data, setData] = useState<APIResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [detailLic, setDetailLic] = useState<MyLicense | null>(null);

  const fetchData = useCallback(async (initial = false) => {
    try {
      if (initial) setLoading(true); else setRefreshing(true);
      setError(null);
      const token = getToken();
      const r = await fetch('/api/licenses/', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        throw new Error(err.detail || err.error || `HTTP ${r.status}`);
      }
      const payload: APIResponse = await r.json();
      setData(payload);
    } catch (e: any) {
      setError(e.message || 'Yuklab bo\'lmadi');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(true); }, [fetchData]);

  const filtered = useMemo(() => {
    if (!data) return [];
    const term = search.trim().toLowerCase();
    return data.results.filter((l) => {
      const matchesSearch = !term ||
        l.license_number.toLowerCase().includes(term) ||
        l.license_type_name.toLowerCase().includes(term) ||
        l.license_type_code.toLowerCase().includes(term);
      const matchesStatus = statusFilter === 'all' || l.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [data, search, statusFilter]);

  const handleDownloadPdf = async (lic: MyLicense) => {
    // Agar pdf_url bo'lsa, to'g'ridan-to'g'ri ochamiz, aks holda backend generatsiya
    if (lic.pdf_url) {
      window.open(lic.pdf_url, '_blank');
      return;
    }
    try {
      const token = getToken();
      const r = await fetch(`/api/licenses/${lic.id}/pdf/`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!r.ok) throw new Error('PDF hozircha mavjud emas');
      const blob = await r.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${lic.license_number}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      alert(e.message || 'PDF olishda xatolik');
    }
  };

  if (redirecting) {
    return (
      <div className="min-h-screen bg-[#F4F6F9] flex items-center justify-center">
        <div className="text-center text-gray-500">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2" />
          <p className="text-sm">Admin paneliga yo'naltirilmoqda...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F6F9]">
      <Header />
      <SmartSidebar />

      <main className="lg:ml-64 pt-16">
        <div className="p-4 lg:p-8 max-w-7xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 flex items-start justify-between flex-wrap gap-4"
          >
            <div>
              <h1 className="text-3xl font-bold text-[#0D3B6E] flex items-center gap-3">
                <ShieldCheck className="w-8 h-8 text-[#1A56A0]" />
                {t('licenses.title')}
              </h1>
              <p className="text-gray-600 mt-1">
                {t('licenses.subtitle')}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => fetchData(false)}
                disabled={refreshing}
                className="p-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-50 transition-all"
                title={t('licenses.refresh')}
              >
                <RefreshCw className={`w-4 h-4 text-gray-500 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
              <Link
                href="/apply"
                className="flex items-center gap-2 px-4 py-2.5 bg-[#1A56A0] hover:bg-[#0D3B6E] text-white rounded-xl text-sm font-medium transition-all shadow-lg shadow-blue-500/25"
              >
                <Plus className="w-4 h-4" />
                {t('licenses.new_application')}
              </Link>
            </div>
          </motion.div>

          {/* Summary cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[
              { key: 'total',         label: t('licenses.kpi.total'),         icon: Award,       color: '#1A56A0' },
              { key: 'active',        label: t('licenses.kpi.active'),        icon: CheckCircle, color: '#27AE60' },
              { key: 'expired',       label: t('licenses.kpi.expired'),       icon: AlertCircle, color: '#E74C3C' },
              { key: 'expiring_soon', label: t('licenses.kpi.expiring_soon'), icon: Clock,       color: '#F39C12' },
            ].map((card, idx) => {
              const Icon = card.icon;
              const value = data?.summary ? (data.summary as any)[card.key] : 0;
              return (
                <motion.div
                  key={card.key}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: card.color + '15' }}
                    >
                      <Icon className="w-5 h-5" style={{ color: card.color }} />
                    </div>
                  </div>
                  {loading ? (
                    <>
                      <div className="h-7 w-12 bg-gray-100 rounded animate-pulse mb-1" />
                      <div className="h-4 w-24 bg-gray-50 rounded animate-pulse" />
                    </>
                  ) : (
                    <>
                      <p className="text-2xl font-bold text-gray-900">{Number(value || 0).toLocaleString('uz-UZ')}</p>
                      <p className="text-sm text-gray-500 mt-0.5">{card.label}</p>
                    </>
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* Expiring soon banner */}
          {data?.summary && data.summary.expiring_soon > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl flex items-center gap-3"
            >
              <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-5 h-5 text-amber-600" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-amber-900">
                  {t('licenses.expiring_banner_title', { n: data.summary.expiring_soon })}
                </p>
                <p className="text-sm text-amber-700 mt-0.5">
                  {t('licenses.expiring_banner_subtitle')}
                </p>
              </div>
              <Link
                href="/apply"
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-medium transition-all whitespace-nowrap"
              >
                {t('licenses.renew')}
              </Link>
            </motion.div>
          )}

          {/* Filters */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-6 bg-white rounded-xl shadow-sm border border-gray-100 p-4"
          >
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder={t('licenses.search_placeholder')}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A56A0]"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#1A56A0]"
              >
                <option value="all">{t('licenses.filter_all')}</option>
                <option value="active">{t('licenses.status.active')}</option>
                <option value="expired">{t('licenses.status.expired')}</option>
                <option value="suspended">{t('licenses.status.suspended')}</option>
                <option value="revoked">{t('licenses.status.revoked')}</option>
              </select>
            </div>
          </motion.div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3 mb-4">
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-700 flex-1">{error}</p>
              <button onClick={() => fetchData(true)} className="text-sm text-red-700 underline">
                {t('licenses.retry')}
              </button>
            </div>
          )}

          {/* Content */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-xl border border-gray-100 p-6 animate-pulse">
                  <div className="h-6 w-32 bg-gray-200 rounded mb-3" />
                  <div className="h-4 w-full bg-gray-100 rounded mb-2" />
                  <div className="h-4 w-3/4 bg-gray-100 rounded mb-4" />
                  <div className="h-10 w-full bg-gray-100 rounded" />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              hasFilter={!!search || statusFilter !== 'all'}
              total={data?.summary.total || 0}
              onReset={() => { setSearch(''); setStatusFilter('all'); }}
              t={t}
            />
          ) : (
            <motion.div
              initial="hidden"
              animate="show"
              variants={{ show: { transition: { staggerChildren: 0.05 } } }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            >
              {filtered.map((lic) => (
                <LicenseCard
                  key={lic.id}
                  lic={lic}
                  onView={() => setDetailLic(lic)}
                  onDownload={() => handleDownloadPdf(lic)}
                  t={t}
                  locale={locale}
                />
              ))}
            </motion.div>
          )}
        </div>
      </main>

      {/* Detail modal */}
      <LicenseDetailModal
        lic={detailLic}
        onClose={() => setDetailLic(null)}
        onDownload={handleDownloadPdf}
        t={t}
        locale={locale}
      />
    </div>
  );
}

// ============ LICENSE CARD ============
function LicenseCard({ lic, onView, onDownload, t, locale }: {
  lic: MyLicense;
  onView: () => void;
  onDownload: () => void;
  t: (k: string, vars?: any) => string;
  locale: string;
}) {
  const sc = STATUS_CFG[lic.status];
  const StatusIcon = sc.icon;

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20 },
        show:   { opacity: 1, y: 0 },
      }}
      whileHover={{ y: -4 }}
      transition={{ type: 'spring', stiffness: 300 }}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-xl transition-shadow"
    >
      {/* Colored top stripe */}
      <div className="h-2" style={{ backgroundColor: lic.color_hex }} />

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
              style={{ backgroundColor: lic.color_hex }}
            >
              {lic.license_type_code}
            </div>
            <div className="min-w-0">
              <p className="text-xs text-gray-500 uppercase tracking-wider">Litsenziya</p>
              <p className="font-mono font-bold text-gray-900 text-sm truncate">{lic.license_number}</p>
            </div>
          </div>
          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${sc.bg} ${sc.text}`}>
            <StatusIcon className="w-3 h-3" />
            {t(sc.tKey)}
          </span>
        </div>

        {/* Type name */}
        <div className="mb-4">
          <p className="text-xs text-gray-500 mb-0.5">{t('licenses.detail.license_type')}</p>
          <p className="font-semibold text-gray-900">{lic.license_type_name}</p>
        </div>

        {/* Region */}
        {lic.region && (
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
            <MapPin className="w-4 h-4 text-gray-400" />
            {lic.region}
          </div>
        )}

        {/* Dates */}
        <div className="grid grid-cols-2 gap-3 pb-4 mb-4 border-b border-gray-100">
          <div>
            <p className="text-xs text-gray-500 mb-0.5">{t('licenses.issued')}</p>
            <p className="text-sm font-medium text-gray-900">{formatDate(lic.issued_at, locale)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-0.5">{t('licenses.expires')}</p>
            <p className={`text-sm font-medium ${
              lic.status === 'expired' ? 'text-red-600' :
              lic.is_expiring_soon ? 'text-amber-600' : 'text-gray-900'
            }`}>
              {formatDate(lic.expires_at, locale)}
            </p>
          </div>
        </div>

        {/* Days countdown */}
        {lic.status === 'active' && (
          <div className={`mb-4 p-2.5 rounded-lg text-center text-sm font-medium ${
            lic.is_expiring_soon ? 'bg-amber-50 text-amber-700' : 'bg-green-50 text-green-700'
          }`}>
            {lic.is_expiring_soon
              ? `⚠ ${t('licenses.days_left_warning', { n: lic.days_left })}`
              : t('licenses.days_left', { n: lic.days_left })}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={onView}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-gray-200 hover:border-[#1A56A0] hover:bg-blue-50 hover:text-[#1A56A0] rounded-lg text-sm font-medium text-gray-700 transition-all"
          >
            <Eye className="w-4 h-4" />
            {t('licenses.view')}
          </button>
          <button
            onClick={onDownload}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-[#1A56A0] hover:bg-[#0D3B6E] text-white rounded-lg text-sm font-medium transition-all"
          >
            <Download className="w-4 h-4" />
            PDF
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ============ EMPTY STATE ============
function EmptyState({ hasFilter, total, onReset, t }: {
  hasFilter: boolean;
  total: number;
  onReset: () => void;
  t: (k: string, vars?: any) => string;
}) {
  if (hasFilter) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
        <Search className="w-16 h-16 mx-auto text-gray-300 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('licenses.no_match_title')}</h3>
        <p className="text-sm text-gray-500 mb-6">{t('licenses.no_match_subtitle')}</p>
        <button
          onClick={onReset}
          className="px-5 py-2.5 bg-[#1A56A0] hover:bg-[#0D3B6E] text-white rounded-xl text-sm font-medium transition-all"
        >
          {t('licenses.reset_filters')}
        </button>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-blue-50 via-white to-indigo-50 rounded-2xl border border-blue-100 p-12 text-center">
      <div className="w-20 h-20 mx-auto mb-5 bg-gradient-to-br from-[#1A56A0] to-[#0D3B6E] rounded-2xl flex items-center justify-center shadow-lg">
        <Sparkles className="w-10 h-10 text-white" />
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-2">
        {t('licenses.empty_title')}
      </h3>
      <p className="text-sm text-gray-600 max-w-md mx-auto mb-6">
        {t('licenses.empty_subtitle')}
      </p>
      <Link
        href="/apply"
        className="inline-flex items-center gap-2 px-6 py-3 bg-[#1A56A0] hover:bg-[#0D3B6E] text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-blue-500/25"
      >
        <Plus className="w-4 h-4" />
        {t('licenses.empty_action')}
      </Link>
    </div>
  );
}

// ============ DETAIL MODAL ============
function LicenseDetailModal({ lic, onClose, onDownload, t, locale }: {
  lic: MyLicense | null;
  onClose: () => void;
  onDownload: (lic: MyLicense) => void;
  t: (k: string, vars?: any) => string;
  locale: string;
}) {
  return (
    <AnimatePresence>
      {lic && (
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
            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
          >
            {/* Top banner */}
            <div
              className="px-6 py-8 text-white relative"
              style={{ background: `linear-gradient(135deg, ${lic.color_hex} 0%, #0D3B6E 100%)` }}
            >
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-lg transition-all"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-white/20 backdrop-blur rounded-2xl flex items-center justify-center text-2xl font-bold">
                  {lic.license_type_code}
                </div>
                <div>
                  <p className="text-sm text-white/80 uppercase tracking-wider">{t('licenses.detail.license_number')}</p>
                  <p className="font-mono font-bold text-2xl">{lic.license_number}</p>
                  <p className="text-sm text-white/90 mt-1">{lic.license_type_name}</p>
                </div>
              </div>
            </div>

            <div className="p-6">
              {/* Status */}
              <div className="mb-5 flex items-center gap-3">
                {(() => {
                  const sc = STATUS_CFG[lic.status];
                  const Icon = sc.icon;
                  return (
                    <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ring-1 ${sc.bg} ${sc.text} ${sc.ring}`}>
                      <Icon className="w-4 h-4" />
                      {t(sc.tKey)}
                    </span>
                  );
                })()}
                {lic.status === 'active' && (
                  <span className={`text-sm font-medium ${
                    lic.is_expiring_soon ? 'text-amber-600' : 'text-gray-500'
                  }`}>
                    {lic.is_expiring_soon
                      ? `⚠ ${t('licenses.days_left_warning', { n: lic.days_left })}`
                      : t('licenses.days_left', { n: lic.days_left })}
                  </span>
                )}
              </div>

              {/* Details grid */}
              <div className="space-y-3 mb-5">
                {[
                  { label: t('licenses.detail.license_type'), value: lic.license_type_name, icon: Award },
                  { label: t('licenses.detail.type_code'),    value: lic.license_type_code, icon: FileText },
                  { label: t('licenses.detail.category'),     value: lic.license_type_category, icon: ShieldCheck },
                  { label: t('licenses.detail.region'),       value: lic.region || '—', icon: MapPin },
                  { label: t('licenses.detail.issued_date'),  value: formatDate(lic.issued_at, locale), icon: Calendar },
                  { label: t('licenses.detail.expiry_date'),  value: formatDate(lic.expires_at, locale), icon: Calendar },
                ].map((row) => {
                  const Icon = row.icon;
                  return (
                    <div key={row.label} className="flex items-center gap-3 py-2.5 border-b border-gray-100 last:border-b-0">
                      <Icon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <span className="text-sm text-gray-500 w-36">{row.label}</span>
                      <span className="text-sm font-medium text-gray-900 flex-1 text-right">{row.value}</span>
                    </div>
                  );
                })}
              </div>

              {/* Verification info */}
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl mb-5">
                <div className="flex items-start gap-3">
                  <ShieldCheck className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-blue-900">{t('licenses.detail.verification_title')}</p>
                    <p className="text-xs text-blue-700 mt-0.5">
                      {t('licenses.detail.verification_subtitle')}
                    </p>
                    <code className="block mt-2 text-xs font-mono bg-white px-2 py-1 rounded border border-blue-200 break-all">
                      {lic.id}
                    </code>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-all"
                >
                  {t('licenses.detail.close')}
                </button>
                <button
                  onClick={() => onDownload(lic)}
                  className="flex-1 py-2.5 bg-[#1A56A0] hover:bg-[#0D3B6E] text-white rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  {t('licenses.detail.download_pdf')}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
