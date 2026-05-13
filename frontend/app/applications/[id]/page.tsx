'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, FileText, Clock, CheckCircle, XCircle, Eye,
  Calendar, MapPin, Phone, User, Award, AlertCircle, Trash2,
  RefreshCw, ExternalLink, Download, MessageSquare, FileCheck,
  Loader2, X,
} from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import Link from 'next/link';
import { invalidateDashboard } from '@/hooks/useUserDashboard';

// ============ Types ============
interface ApplicationDoc {
  id: string;
  type: string;
  type_display?: string;
  file_url: string;
  uploaded_at: string;
  filename?: string;
}

interface Application {
  id: string;
  full_name: string;
  phone: string;
  status: string;
  license_type?: { id: number; code: string; name_uz: string; color_hex?: string };
  license_type_name?: string;
  license_type_code?: string;
  region?: { id: number; name_uz: string } | string;
  region_name?: string;
  workplace?: string;
  job_title?: string;
  coaching_years?: number;
  prev_license_date?: string | null;
  license_validity_start?: string | null;
  license_validity_end?: string | null;
  admin_note?: string;
  rejection_reason?: string;
  submitted_at: string;
  reviewed_at?: string | null;
  documents?: ApplicationDoc[];
}

interface TimelineEntry {
  id: string;
  action: string;
  note: string;
  created_at: string;
  created_by_name?: string;
}

// ============ Helpers ============
function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('accessToken') || localStorage.getItem('adminAccessToken');
}

const STATUS_CFG: Record<string, { label: string; bg: string; text: string; ring: string; icon: any }> = {
  pending:         { label: 'Kutilmoqda',          bg: 'bg-amber-50',  text: 'text-amber-700',  ring: 'ring-amber-200',  icon: Clock },
  under_review:    { label: "Ko'rib chiqilmoqda",  bg: 'bg-blue-50',   text: 'text-blue-700',   ring: 'ring-blue-200',   icon: Eye },
  additional_docs: { label: "Qo'shimcha hujjat",   bg: 'bg-orange-50', text: 'text-orange-700', ring: 'ring-orange-200', icon: FileText },
  approved:        { label: 'Tasdiqlangan',        bg: 'bg-green-50',  text: 'text-green-700',  ring: 'ring-green-200',  icon: CheckCircle },
  license_issued:  { label: 'Litsenziya berildi',  bg: 'bg-green-50',  text: 'text-green-700',  ring: 'ring-green-200',  icon: Award },
  rejected:        { label: 'Rad etilgan',         bg: 'bg-red-50',    text: 'text-red-700',    ring: 'ring-red-200',    icon: XCircle },
  cancelled:       { label: 'Bekor qilingan',      bg: 'bg-gray-50',   text: 'text-gray-700',   ring: 'ring-gray-200',   icon: XCircle },
};

const TIMELINE_ACTIONS: Record<string, { label: string; color: string; icon: any }> = {
  created:          { label: 'Ariza yaratildi',     color: '#3498DB', icon: FileText },
  submitted:        { label: 'Yuborildi',           color: '#3498DB', icon: FileCheck },
  under_review:     { label: "Ko'rib chiqilmoqda",  color: '#3498DB', icon: Eye },
  additional_docs:  { label: "Qo'shimcha hujjat",   color: '#E67E22', icon: FileText },
  approved:         { label: 'Tasdiqlandi',         color: '#27AE60', icon: CheckCircle },
  rejected:         { label: 'Rad etildi',          color: '#E74C3C', icon: XCircle },
  cancelled:        { label: 'Bekor qilindi',       color: '#95A5A6', icon: XCircle },
  license_issued:   { label: 'Litsenziya berildi',  color: '#27AE60', icon: Award },
  note_added:       { label: 'Izoh qo\'shildi',     color: '#9B59B6', icon: MessageSquare },
};

function formatDate(iso?: string | null, withTime = true): string {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    return d.toLocaleString('uz-UZ', {
      day: '2-digit', month: 'long', year: 'numeric',
      ...(withTime ? { hour: '2-digit', minute: '2-digit' } : {}),
    });
  } catch { return String(iso); }
}

function relativeTime(iso: string): string {
  try {
    const diff = (Date.now() - new Date(iso).getTime()) / 1000;
    if (diff < 60) return 'Hozirgina';
    if (diff < 3600) return `${Math.floor(diff / 60)} daqiqa oldin`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} soat oldin`;
    if (diff < 604800) return `${Math.floor(diff / 86400)} kun oldin`;
    return formatDate(iso, false);
  } catch { return iso; }
}

function getLicenseTypeInfo(app: Application | null) {
  if (!app) return { code: '', name: '', color: '#1A56A0' };
  if (app.license_type && typeof app.license_type === 'object') {
    return {
      code: app.license_type.code || app.license_type_code || '',
      name: app.license_type.name_uz || app.license_type_name || '',
      color: app.license_type.color_hex || '#1A56A0',
    };
  }
  return {
    code: app.license_type_code || '',
    name: app.license_type_name || '',
    color: '#1A56A0',
  };
}

function getRegionName(app: Application | null) {
  if (!app) return '';
  if (app.region && typeof app.region === 'object') return app.region.name_uz;
  if (typeof app.region === 'string') return app.region;
  return app.region_name || '';
}

// ============ MAIN PAGE ============
export default function ApplicationDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const appId = params?.id;

  const [app, setApp] = useState<Application | null>(null);
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const [showCancel, setShowCancel] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<ApplicationDoc | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchData = useCallback(async (initial = false) => {
    if (!appId) return;
    try {
      if (initial) setLoading(true); else setRefreshing(true);
      setError(null);
      const token = getToken();
      const r = await fetch(`/api/applications/${appId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (r.status === 404) {
        setError('Ariza topilmadi');
        return;
      }
      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        throw new Error(err.detail || err.error || `HTTP ${r.status}`);
      }
      const data = await r.json();
      setApp(data.application || data);
      setTimeline(data.timeline || []);
    } catch (e: any) {
      setError(e.message || 'Yuklab bo\'lmadi');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [appId]);

  useEffect(() => { fetchData(true); }, [fetchData]);

  const handleCancel = async () => {
    if (!appId) return;
    setCancelling(true);
    try {
      const token = getToken();
      const r = await fetch(`/api/applications/${appId}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        throw new Error(err.error || err.detail || `HTTP ${r.status}`);
      }
      invalidateDashboard();
      showToast('Ariza bekor qilindi');
      setShowCancel(false);
      fetchData(false);
    } catch (e: any) {
      showToast(e.message, 'error');
    } finally {
      setCancelling(false);
    }
  };

  // ── Loading ──────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-[#F4F6F9]">
        <Header />
        <Sidebar />
        <main className="ml-64 pt-16">
          <div className="p-8 max-w-5xl mx-auto space-y-6">
            <div className="h-8 w-48 bg-gray-200 rounded animate-pulse" />
            <div className="h-32 bg-gray-100 rounded-2xl animate-pulse" />
            <div className="grid grid-cols-3 gap-6">
              <div className="col-span-2 space-y-4">
                <div className="h-64 bg-gray-100 rounded-2xl animate-pulse" />
                <div className="h-48 bg-gray-100 rounded-2xl animate-pulse" />
              </div>
              <div className="h-96 bg-gray-100 rounded-2xl animate-pulse" />
            </div>
          </div>
        </main>
      </div>
    );
  }

  // ── Error / Not found ─────────────────
  if (error || !app) {
    return (
      <div className="min-h-screen bg-[#F4F6F9]">
        <Header />
        <Sidebar />
        <main className="ml-64 pt-16">
          <div className="p-8 max-w-3xl mx-auto">
            <button
              onClick={() => router.push('/applications')}
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-[#1A56A0] mb-6"
            >
              <ArrowLeft className="w-4 h-4" />
              Arizalar ro'yxatiga qaytish
            </button>
            <div className="bg-white rounded-2xl border border-red-200 p-12 text-center shadow-sm">
              <div className="w-20 h-20 mx-auto mb-4 bg-red-50 rounded-2xl flex items-center justify-center">
                <AlertCircle className="w-10 h-10 text-red-500" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                {error === 'Ariza topilmadi' ? 'Ariza topilmadi' : 'Xatolik'}
              </h2>
              <p className="text-sm text-gray-600 mb-6">
                {error || 'Ariza ma\'lumotlarini yuklab bo\'lmadi'}
              </p>
              <div className="flex gap-3 justify-center">
                <Link
                  href="/applications"
                  className="px-5 py-2.5 border border-gray-200 hover:bg-gray-50 rounded-xl text-sm font-medium text-gray-700"
                >
                  Arizalar ro'yxati
                </Link>
                <button
                  onClick={() => fetchData(true)}
                  className="px-5 py-2.5 bg-[#1A56A0] hover:bg-[#0D3B6E] text-white rounded-xl text-sm font-medium"
                >
                  Qayta urinish
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const sc = STATUS_CFG[app.status] || STATUS_CFG.pending;
  const StatusIcon = sc.icon;
  const lt = getLicenseTypeInfo(app);
  const region = getRegionName(app);
  const canCancel = ['pending', 'under_review'].includes(app.status);

  return (
    <div className="min-h-screen bg-[#F4F6F9]">
      <Header />
      <Sidebar />

      <main className="ml-64 pt-16">
        <div className="p-8 max-w-5xl mx-auto">
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

          {/* Back button + Refresh */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => router.push('/applications')}
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-[#1A56A0] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Arizalar ro'yxati
            </button>
            <button
              onClick={() => fetchData(false)}
              disabled={refreshing}
              className="p-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-50"
              title="Yangilash"
            >
              <RefreshCw className={`w-4 h-4 text-gray-500 ${refreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Top Status Banner */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-6"
          >
            <div className="h-2" style={{ backgroundColor: lt.color }} />
            <div className="p-6">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="flex items-start gap-4 min-w-0">
                  <div
                    className="w-14 h-14 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                    style={{ backgroundColor: lt.color }}
                  >
                    {lt.code || <Award className="w-6 h-6" />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Ariza</p>
                    <h1 className="text-xl font-bold text-gray-900 break-all">
                      #{app.id.slice(0, 8).toUpperCase()}
                    </h1>
                    <p className="text-sm text-gray-600 mt-1">{lt.name || '—'}</p>
                  </div>
                </div>
                <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ring-1 ${sc.bg} ${sc.text} ${sc.ring}`}>
                  <StatusIcon className="w-4 h-4" />
                  {sc.label}
                </span>
              </div>

              {/* Rejection reason if rejected */}
              {app.status === 'rejected' && app.rejection_reason && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl">
                  <p className="text-xs font-medium text-red-900 mb-1">Rad etish sababi</p>
                  <p className="text-sm text-red-800">{app.rejection_reason}</p>
                </div>
              )}

              {/* Admin note */}
              {app.admin_note && (
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                  <p className="text-xs font-medium text-blue-900 mb-1 flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5" />
                    Admin izohi
                  </p>
                  <p className="text-sm text-blue-800">{app.admin_note}</p>
                </div>
              )}

              {/* Additional docs needed */}
              {app.status === 'additional_docs' && (
                <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-xl flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-orange-500 flex-shrink-0" />
                  <p className="text-sm text-orange-800 flex-1">
                    Qo'shimcha hujjatlar yuklash so'ralgan. Yuqoridagi admin izohini o'qing.
                  </p>
                </div>
              )}
            </div>
          </motion.div>

          {/* Main grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Details + Documents */}
            <div className="lg:col-span-2 space-y-6">
              {/* Applicant info */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6"
              >
                <h2 className="text-base font-bold text-[#0D3B6E] mb-4 flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Ariza ma'lumotlari
                </h2>
                <div className="space-y-3">
                  {[
                    { icon: User,     label: 'F.I.O',           value: app.full_name || '—' },
                    { icon: Phone,    label: 'Telefon',         value: app.phone || '—' },
                    { icon: MapPin,   label: 'Hudud',           value: region || '—' },
                    { icon: Award,    label: 'Litsenziya turi', value: lt.name || '—' },
                    { icon: FileText, label: 'Ish joyi',        value: app.workplace || '—' },
                    { icon: FileText, label: 'Lavozim',         value: app.job_title || '—' },
                    { icon: Clock,    label: 'Murabbiylik tajribasi', value: app.coaching_years ? `${app.coaching_years} yil` : '—' },
                    { icon: Calendar, label: 'Oldingi litsenziya', value: formatDate(app.prev_license_date, false) },
                  ].map((row) => {
                    const Icon = row.icon;
                    return (
                      <div key={row.label} className="flex items-start gap-3 py-2.5 border-b border-gray-100 last:border-b-0">
                        <Icon className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-gray-500 w-44 flex-shrink-0">{row.label}</span>
                        <span className="text-sm font-medium text-gray-900 flex-1 break-words">{row.value}</span>
                      </div>
                    );
                  })}
                </div>
              </motion.div>

              {/* Documents */}
              {app.documents && app.documents.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6"
                >
                  <h2 className="text-base font-bold text-[#0D3B6E] mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Hujjatlar ({app.documents.length})
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {app.documents.map((doc) => (
                      <div
                        key={doc.id}
                        className="p-3 border border-gray-200 rounded-xl flex items-center gap-3 hover:border-[#1A56A0] hover:bg-blue-50/30 transition-all cursor-pointer"
                        onClick={() => setPreviewDoc(doc)}
                      >
                        <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                          <FileText className="w-5 h-5 text-[#1A56A0]" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {doc.type_display || doc.type}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {doc.filename || formatDate(doc.uploaded_at, false)}
                          </p>
                        </div>
                        <Eye className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Cancel action */}
              {canCancel && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center justify-between flex-wrap gap-3"
                >
                  <div className="flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-red-500" />
                    <div>
                      <p className="text-sm font-medium text-red-900">Arizani bekor qilmoqchimisiz?</p>
                      <p className="text-xs text-red-700 mt-0.5">Faqat ko'rib chiqilmagan arizalarni bekor qilish mumkin</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowCancel(true)}
                    className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Bekor qilish
                  </button>
                </motion.div>
              )}
            </div>

            {/* Right: Timeline */}
            <div>
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sticky top-24"
              >
                <h2 className="text-base font-bold text-[#0D3B6E] mb-5 flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Hodisalar tarixi
                </h2>

                {/* Dates summary */}
                <div className="space-y-2 mb-5 pb-5 border-b border-gray-100">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Yuborilgan</span>
                    <span className="font-medium text-gray-900">{formatDate(app.submitted_at)}</span>
                  </div>
                  {app.reviewed_at && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Ko'rib chiqilgan</span>
                      <span className="font-medium text-gray-900">{formatDate(app.reviewed_at)}</span>
                    </div>
                  )}
                </div>

                {/* Timeline list */}
                {timeline.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-6">Hodisalar yo'q</p>
                ) : (
                  <div className="relative space-y-4 pl-6">
                    <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-gray-100" />
                    {timeline.map((entry, idx) => {
                      const cfg = TIMELINE_ACTIONS[entry.action] || {
                        label: entry.action, color: '#95A5A6', icon: Clock,
                      };
                      const Icon = cfg.icon;
                      return (
                        <motion.div
                          key={entry.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.2 + idx * 0.05 }}
                          className="relative"
                        >
                          <div
                            className="absolute -left-6 top-0 w-5 h-5 rounded-full border-2 border-white flex items-center justify-center"
                            style={{ backgroundColor: cfg.color }}
                          >
                            <Icon className="w-2.5 h-2.5 text-white" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{cfg.label}</p>
                            {entry.note && (
                              <p className="text-xs text-gray-600 mt-0.5 break-words">{entry.note}</p>
                            )}
                            <p className="text-xs text-gray-400 mt-1">{relativeTime(entry.created_at)}</p>
                            {entry.created_by_name && (
                              <p className="text-xs text-gray-400">{entry.created_by_name}</p>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            </div>
          </div>
        </div>
      </main>

      {/* Cancel confirmation modal */}
      <AnimatePresence>
        {showCancel && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => !cancelling && setShowCancel(false)}
            className="fixed inset-0 bg-black/60 z-[80] flex items-center justify-center p-4"
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
                <h3 className="font-semibold text-gray-900">Arizani bekor qilishni tasdiqlang</h3>
              </div>
              <p className="text-sm text-gray-600 mb-5">
                Arizangiz bekor qilinadi va keyinroq qayta yuborish kerak bo'ladi. Davom etasizmi?
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowCancel(false)}
                  disabled={cancelling}
                  className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 disabled:opacity-50"
                >
                  Yo'q
                </button>
                <button
                  onClick={handleCancel}
                  disabled={cancelling}
                  className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-sm font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {cancelling && <Loader2 className="w-4 h-4 animate-spin" />}
                  Ha, bekor qilish
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Document preview */}
      <AnimatePresence>
        {previewDoc && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setPreviewDoc(null)}
            className="fixed inset-0 bg-black/80 z-[80] flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
            >
              <div className="flex items-center justify-between p-4 border-b border-gray-100">
                <div className="min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate">
                    {previewDoc.type_display || previewDoc.type}
                  </h3>
                  <p className="text-xs text-gray-500">{formatDate(previewDoc.uploaded_at)}</p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <a
                    href={previewDoc.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 hover:bg-gray-100 rounded-lg"
                    title="Yangi oynada ochish"
                  >
                    <ExternalLink className="w-4 h-4 text-gray-600" />
                  </a>
                  <a
                    href={previewDoc.file_url}
                    download
                    className="p-2 hover:bg-gray-100 rounded-lg"
                    title="Yuklab olish"
                  >
                    <Download className="w-4 h-4 text-gray-600" />
                  </a>
                  <button
                    onClick={() => setPreviewDoc(null)}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <X className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-auto bg-gray-50 flex items-center justify-center p-4">
                {(() => {
                  const url = previewDoc.file_url;
                  const ext = url.split('?')[0].split('.').pop()?.toLowerCase() || '';
                  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) {
                    return <img src={url} alt={previewDoc.type} className="max-w-full max-h-full object-contain" />;
                  }
                  if (ext === 'pdf') {
                    return <iframe src={url} className="w-full h-full min-h-[70vh]" title="PDF" />;
                  }
                  return (
                    <div className="text-center">
                      <FileText className="w-16 h-16 mx-auto text-gray-300 mb-3" />
                      <p className="text-sm text-gray-600 mb-3">Bu fayl turini bevosita ko'rsatib bo'lmaydi</p>
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-[#1A56A0] text-white rounded-lg text-sm"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Yangi oynada ochish
                      </a>
                    </div>
                  );
                })()}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
