'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  Search, 
  Filter, 
  Download, 
  Eye, 
  CheckCircle, 
  XCircle, 
  Clock,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  X,
  User,
  Phone,
  Mail,
  MapPin,
  Award,
  FileText,
  Building2,
  Briefcase,
  Calendar,
  RefreshCw,
  FileWarning,
  CheckCircle2,
  History,
  Archive,
  PhoneCall,
  GraduationCap,
  BookOpen,
  UserX
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { apiClient, API_ENDPOINTS } from '@/lib/api/client';
import { useAuth } from '@/hooks/useAuth';
import { useI18n } from '@/lib/i18n/I18nProvider';

interface Application {
  id: string;
  user_name: string;
  user_email?: string;
  user_phone: string;
  license_type_name: string;
  license_type_code?: string;
  license_type?: string;
  status: string;
  status_display: string;
  region_name?: string;
  region?: string;
  workplace?: string;
  job_title?: string;
  coaching_years?: number;
  documents_count?: number;
  submitted_at: string;
  reviewed_at?: string;
  reviewed_by_name?: string;
  rejection_reason?: string;
  admin_notes?: string;
  queue_number?: number | null;
  queue_total?: number | null;
  is_offline?: boolean;
  timeline?: Array<{
    action: string;
    note: string;
    created_at: string;
    created_by_name: string;
  }>;
  documents?: Array<{
    id: string;
    doc_type: string;
    doc_type_display: string;
    file_url: string;
    file_name: string;
    file_size: number;
    mime_type: string;
    is_verified: boolean;
    uploaded_at: string;
  }>;
}

interface ApplicationsTableProps {
  showAll?: boolean;
}

const statusConfig: Record<string, { tKey: string; color: string; bgColor: string; icon: any }> = {
  pending:         { tKey: 'applications.status.pending',         color: '#F39C12', bgColor: '#F39C12/10', icon: Clock },
  under_review:    { tKey: 'applications.status.under_review',    color: '#3498DB', bgColor: '#3498DB/10', icon: Eye },
  additional_docs: { tKey: 'applications.status.additional_docs', color: '#E67E22', bgColor: '#E67E22/10', icon: Clock },
  approved:        { tKey: 'applications.status.approved',        color: '#27AE60', bgColor: '#27AE60/10', icon: CheckCircle },
  // O'qish workflow
  called:          { tKey: 'applications.status.called',          color: '#9B59B6', bgColor: '#9B59B6/10', icon: Phone },
  studying:        { tKey: 'applications.status.studying',        color: '#1ABC9C', bgColor: '#1ABC9C/10', icon: Award },
  completed:       { tKey: 'applications.status.completed',       color: '#2C3E50', bgColor: '#2C3E50/10', icon: CheckCircle },
  no_show:         { tKey: 'applications.status.no_show',         color: '#95A5A6', bgColor: '#95A5A6/10', icon: XCircle },
  // Rejected/cancelled
  rejected:        { tKey: 'applications.status.rejected',        color: '#E74C3C', bgColor: '#E74C3C/10', icon: XCircle },
  cancelled:       { tKey: 'applications.status.cancelled',       color: '#7F8C8D', bgColor: '#7F8C8D/10', icon: Archive },
};

export function ApplicationsTableNew({ showAll = false }: ApplicationsTableProps) {
  const { user } = useAuth();
  const { t, locale } = useI18n();
  // Lazy initializer: birinchi render'dayoq to'g'ri qiymatni olamiz.
  // Aks holda useEffect ishlamasdan turib fetch user-endpoint'ga ketadi va
  // "Arizalar topilmadi" qisqa vaqt ko'rinadi (race condition).
  const [hasAdminToken, setHasAdminToken] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return !!localStorage.getItem('adminAccessToken');
  });

  // Token keyinchalik o'zgarishi mumkin (login/logout) — qayta o'qiymiz
  useEffect(() => {
    const sync = () => setHasAdminToken(!!localStorage.getItem('adminAccessToken'));
    window.addEventListener('storage', sync);
    return () => window.removeEventListener('storage', sync);
  }, []);

  const isAdmin = hasAdminToken
    || user?.role === 'super_admin'
    || user?.role === 'region_admin'
    || user?.role === 'admin';
  
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [regionFilter, setRegionFilter] = useState('all');
  const [licenseTypeFilter, setLicenseTypeFilter] = useState('all');
  const [levelFilter, setLevelFilter] = useState<number | null>(null);
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number } | null>(null);
  const typeDropdownRef = useRef<HTMLDivElement>(null);
  const typeButtonRef = useRef<HTMLButtonElement>(null);
  const [regions, setRegions] = useState<Array<{ id: number; name_uz: string; name_ru?: string }>>([]);
  const [licenseTypes, setLicenseTypes] = useState<Array<{ code: string; name_uz: string; name_ru?: string; color_hex?: string }>>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedApplication, setSelectedApplication] = useState<string | null>(null);
  const [showDrawer, setShowDrawer] = useState(false);
  const [selectedAppDetails, setSelectedAppDetails] = useState<Application | null>(null);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [adminNote, setAdminNote] = useState('');
  const [previewDoc, setPreviewDoc] = useState<{name: string, url: string} | null>(null);
  // Call confirmation modal
  const [showCallModal, setShowCallModal] = useState(false);
  // Offline application create modal
  const [showOfflineModal, setShowOfflineModal] = useState(false);
  const [offlineLoading, setOfflineLoading] = useState(false);
  const [offlineError, setOfflineError] = useState('');
  const [offlineForm, setOfflineForm] = useState({
    full_name: '',
    phone: '',
    license_type: '',
    region: '',
    workplace: '',
    job_title: '',
    coaching_years: '',
    queue_date: new Date().toISOString().split('T')[0],
    status: 'pending',
  });
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Debounce search input
  useEffect(() => {
    const tt = setTimeout(() => setDebouncedSearch(searchTerm.trim()), 350);
    return () => clearTimeout(tt);
  }, [searchTerm]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, statusFilter, regionFilter, licenseTypeFilter, levelFilter]);

  // Close type dropdown on outside click
  useEffect(() => {
    if (!showTypeDropdown) return;
    const handler = (e: MouseEvent) => {
      const t = e.target as Node;
      const insideTrigger = typeButtonRef.current && typeButtonRef.current.contains(t);
      const insideMenu = typeDropdownRef.current && typeDropdownRef.current.contains(t);
      if (!insideTrigger && !insideMenu) {
        setShowTypeDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showTypeDropdown]);

  // Compute dropdown position when opened (fixed -> escapes Card's overflow-hidden)
  useEffect(() => {
    if (!showTypeDropdown || !typeButtonRef.current) return;
    const DROPDOWN_WIDTH = 384; // w-96
    const MARGIN = 8;
    const compute = () => {
      if (!typeButtonRef.current) return;
      const r = typeButtonRef.current.getBoundingClientRect();
      const vw = window.innerWidth;
      let left = r.left;
      if (left + DROPDOWN_WIDTH + MARGIN > vw) {
        left = Math.max(MARGIN, vw - DROPDOWN_WIDTH - MARGIN);
      }
      if (left < MARGIN) left = MARGIN;
      setDropdownPos({ top: r.bottom + 4, left });
    };
    compute();
    // Scroll paytida dropdown'ni yopamiz (header bilan to'qnashmasligi uchun),
    // lekin dropdown ICHIDAGI ro'yxat scroll'iga teginmaymiz.
    const onScroll = (e: Event) => {
      const target = e.target as Node | null;
      if (target && typeDropdownRef.current && typeDropdownRef.current.contains(target)) {
        return;
      }
      setShowTypeDropdown(false);
    };
    window.addEventListener('resize', compute);
    window.addEventListener('scroll', onScroll, true);
    return () => {
      window.removeEventListener('resize', compute);
      window.removeEventListener('scroll', onScroll, true);
    };
  }, [showTypeDropdown]);

  // Load regions and license types for filter dropdowns
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch('/api/auth/regions');
        if (r.ok) {
          const j = await r.json();
          setRegions(Array.isArray(j) ? j : (j.results || []));
        }
      } catch {}
      try {
        const token = localStorage.getItem('adminAccessToken') || localStorage.getItem('accessToken');
        const r2 = await fetch('/api/licenses/types/', {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (r2.ok) {
          const j = await r2.json();
          setLicenseTypes(Array.isArray(j?.results) ? j.results : []);
        }
      } catch {}
    })();
  }, []);

  useEffect(() => {
    fetchApplications();
  }, [isAdmin, debouncedSearch, statusFilter, regionFilter, licenseTypeFilter, levelFilter]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      setError(null);

      // Use admin endpoint for admins, user endpoint for regular users
      const baseEndpoint = isAdmin
        ? API_ENDPOINTS.applications.adminList
        : API_ENDPOINTS.applications.list;

      // Server-side filtering (admin endpoint qo'llab-quvvatlaydi)
      const params = new URLSearchParams();
      if (isAdmin) {
        if (statusFilter !== 'all') params.append('status', statusFilter);
        if (regionFilter !== 'all') params.append('region', regionFilter);
        if (licenseTypeFilter !== 'all') params.append('license_type', licenseTypeFilter);
        if (levelFilter != null) params.append('level', String(levelFilter));
        if (debouncedSearch) params.append('search', debouncedSearch);
      }
      const qs = params.toString();
      const endpoint = qs ? `${baseEndpoint}?${qs}` : baseEndpoint;

      const response = await apiClient.get(endpoint);
      
      // Handle different response formats
      // Admin: { applications, statistics }
      // User: [] or { applications }
      let apps = [];
      if (Array.isArray(response.data)) {
        apps = response.data;
      } else if (response.data?.applications) {
        apps = response.data.applications;
      }
        
      setApplications(apps);
    } catch (err: any) {
      console.error('Error fetching applications:', err);
      if (err.response?.status === 403) {
        setError(t('admin.apps_table.permission_error'));
      } else {
        setError(t('admin.apps_table.load_error'));
      }
    } finally {
      setLoading(false);
    }
  };

  // Ensure applications is always an array
  const safeApplications = Array.isArray(applications) ? applications : [];
  
  // Admin uchun filterlar server-side qo'llaniladi.
  // Oddiy foydalanuvchi uchun esa client-side filterlash kerak (uning endpoint'i filter qabul qilmaydi).
  const filteredApplications = isAdmin
    ? safeApplications
    : safeApplications.filter((app: Application) => {
        const userName = app?.user_name || '';
        const appId = app?.id || '';
        const appStatus = app?.status || '';
        const term = debouncedSearch.toLowerCase();
        const matchesSearch = !term ||
          userName.toLowerCase().includes(term) ||
          appId.toLowerCase().includes(term);
        const matchesStatus = statusFilter === 'all' || appStatus === statusFilter;
        return matchesSearch && matchesStatus;
      });

  const totalPages = Math.ceil(filteredApplications.length / 10);
  const paginatedApplications = filteredApplications.slice(
    (currentPage - 1) * 10,
    currentPage * 10
  );

  const openDrawer = (app: Application) => {
    setSelectedAppDetails(app);
    setAdminNote(app.admin_notes || '');
    setShowDrawer(true);
  };

  const postAction = async (applicationId: string, body: any) => {
    const adminToken = localStorage.getItem('adminAccessToken');
    const regularToken = localStorage.getItem('accessToken');
    const token = adminToken || regularToken;
    const response = await fetch(`/api/applications/admin/${applicationId}/action`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || `HTTP ${response.status}`);
    }
    return response.json();
  };

  const handleApprove = async (applicationId: string) => {
    try {
      setActionLoading(applicationId);
      await postAction(applicationId, {
        action: 'approve',
        note: adminNote || 'Ariza tasdiqlandi'
      });
      await fetchApplications();
      setShowDrawer(false);
    } catch (err: any) {
      console.error('Tasdiqlashda xatolik:', err);
      alert(`Tasdiqlashda xatolik: ${err.message || err}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (applicationId: string) => {
    if (!rejectionReason.trim()) return;
    try {
      setActionLoading(applicationId);
      await postAction(applicationId, {
        action: 'reject',
        note: adminNote,
        rejection_reason: rejectionReason
      });
      await fetchApplications();
      setShowRejectModal(false);
      setShowDrawer(false);
      setRejectionReason('');
    } catch (err: any) {
      console.error('Rad etishda xatolik:', err);
      alert(`Rad etishda xatolik: ${err.message || err}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRequestDocs = async (applicationId: string) => {
    try {
      setActionLoading(applicationId);
      await postAction(applicationId, {
        action: 'request_docs',
        note: adminNote || 'Qo\'shimcha hujjatlar talab qilindi'
      });
      await fetchApplications();
      setShowDrawer(false);
    } catch (err: any) {
      console.error('Hujjat so\'rashda xatolik:', err);
      alert(`Hujjat so'rashda xatolik: ${err.message || err}`);
    } finally {
      setActionLoading(null);
    }
  };

  // === O'QISH WORKFLOW ACTION HANDLERS ===
  const handleCall = async (applicationId: string) => {
    try {
      setActionLoading(applicationId);
      await postAction(applicationId, {
        action: 'call',
        note: adminNote || 'Telefon qilib o\'qishga chaqirildi'
      });
      await fetchApplications();
      setShowDrawer(false);
    } catch (err: any) {
      console.error('Chaqirishda xatolik:', err);
      alert(`Chaqirishda xatolik: ${err.message || err}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleStartStudy = async (applicationId: string) => {
    try {
      setActionLoading(applicationId);
      await postAction(applicationId, {
        action: 'start_study',
        note: adminNote || 'O\'qishni boshladi'
      });
      await fetchApplications();
      setShowDrawer(false);
    } catch (err: any) {
      console.error('O\'qishni boshlashda xatolik:', err);
      alert(`O'qishni boshlashda xatolik: ${err.message || err}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleComplete = async (applicationId: string) => {
    try {
      setActionLoading(applicationId);
      await postAction(applicationId, {
        action: 'complete',
        note: adminNote || 'O\'qib bitirdi (arxivga o\'tkazildi)'
      });
      await fetchApplications();
      setShowDrawer(false);
    } catch (err: any) {
      console.error('Arxivlashda xatolik:', err);
      alert(`Arxivlashda xatolik: ${err.message || err}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleNoShow = async (applicationId: string) => {
    try {
      setActionLoading(applicationId);
      await postAction(applicationId, {
        action: 'no_show',
        note: adminNote || 'Chaqirildi lekin kelmadi'
      });
      await fetchApplications();
      setShowDrawer(false);
    } catch (err: any) {
      console.error('Kelmadi statusida xatolik:', err);
      alert(`Kelmadi statusida xatolik: ${err.message || err}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleOfflineCreate = async () => {
    if (!offlineForm.full_name.trim() || !offlineForm.license_type || !offlineForm.region || !offlineForm.queue_date) {
      setOfflineError(locale === 'ru'
        ? 'Ф.И.О, тип лицензии, регион и дата обязательны'
        : "F.I.O, litsenziya turi, hudud va sana majburiy");
      return;
    }
    setOfflineLoading(true);
    setOfflineError('');
    try {
      await apiClient.post(API_ENDPOINTS.applications.adminOfflineCreate, {
        ...offlineForm,
        coaching_years: offlineForm.coaching_years ? parseInt(offlineForm.coaching_years) : 0,
        region: parseInt(offlineForm.region),
      });
      setShowOfflineModal(false);
      setOfflineForm({ full_name: '', phone: '', license_type: '', region: '', workplace: '', job_title: '', coaching_years: '', queue_date: new Date().toISOString().split('T')[0], status: 'pending' });
      await fetchApplications();
    } catch (err: any) {
      setOfflineError(err?.response?.data?.detail || err?.response?.data?.error || err?.message || 'Xatolik');
    } finally {
      setOfflineLoading(false);
    }
  };

  const handleStatusChange = async (applicationId: string, newStatus: string) => {
    try {
      await apiClient.patch(`${API_ENDPOINTS.applications.detail(applicationId)}`, {
        status: newStatus
      });
      fetchApplications(); // Refresh data
    } catch (error) {
      console.error('Error updating application status:', error);
    }
  };

  const handleExport = () => {
    if (filteredApplications.length === 0) return;
    const headers = [
      t('admin.apps_table.app_id'),
      t('admin.apps_table.applicant'),
      t('applications.fields.phone'),
      t('admin.table.license'),
      t('admin.table.status'),
      t('applications.submitted_at'),
      t('applications.fields.region'),
      t('applications.fields.workplace'),
      t('applications.fields.job_title'),
      t('applications.fields.coaching_years'),
    ];
    const rows = filteredApplications.map((app: Application) => [
      app.id,
      app.user_name || '',
      app.user_phone || '',
      app.license_type_code || app.license_type_name || '',
      (() => { const sc = statusConfig[app.status as keyof typeof statusConfig]; return sc ? t(sc.tKey) : app.status; })(),
      new Date(app.submitted_at).toLocaleDateString(locale === 'ru' ? 'ru-RU' : 'uz-UZ'),
      app.region_name || app.region || '',
      app.workplace || '',
      app.job_title || '',
      app.coaching_years !== undefined ? app.coaching_years : '',
    ]);
    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `arizalar_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-bold text-[#0D3B6E]">
          {showAll ? t('admin.apps_table.all_applications') : t('admin.recent_apps')}
        </CardTitle>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <Button
              size="sm"
              onClick={() => setShowOfflineModal(true)}
              className="bg-[#1A56A0] hover:bg-[#0D3B6E] text-white"
              title={locale === 'ru' ? 'Офлайн заявка' : 'Offline ariza'}
            >
              <FileText className="w-4 h-4 mr-2" />
              {locale === 'ru' ? 'Офлайн заявка' : 'Offline ariza'}
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={filteredApplications.length === 0}
            title={t('admin.lic_panel.export')}
          >
            <Download className="w-4 h-4 mr-2" />
            {t('admin.lic_panel.export')}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {/* Filters */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  placeholder={t('applications.search_placeholder')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12"
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                title={t('admin.table.status')}
              >
                <option value="all">{t('common.all')}</option>
                <option value="pending">{t('applications.status.pending')}</option>
                <option value="under_review">{t('applications.status.under_review')}</option>
                <option value="additional_docs">{t('applications.status.additional_docs')}</option>
                <option value="approved">{t('applications.status.approved')}</option>
                <option value="called">Telefon qilib chaqirilgan</option>
                <option value="studying">O'qiyotgan</option>
                <option value="rejected">{t('applications.status.rejected')}</option>
                <option value="cancelled">{t('applications.status.cancelled')}</option>
                <option value="completed">O'qib bitirgan (arxiv)</option>
                <option value="no_show">Kelmadi (arxiv)</option>
              </select>

              {isAdmin && (
                <>
                  <select
                    value={regionFilter}
                    onChange={(e) => setRegionFilter(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    title={locale === 'ru' ? 'Регион' : 'Hudud'}
                  >
                    <option value="all">
                      {locale === 'ru' ? 'Все регионы' : 'Barcha hududlar'}
                    </option>
                    {regions.map((r) => (
                      <option key={r.id} value={r.id}>
                        {locale === 'ru' ? (r.name_ru || r.name_uz) : r.name_uz}
                      </option>
                    ))}
                  </select>

                  {(() => {
                    const HIDDEN_CODES = [
                      'E', 'F',
                      'TEMPORARY', 'SPECIAL', 'INTERNATIONAL', 'HONORARY',
                      'RENEWAL_E', 'RENEWAL_F', 'RENEWAL_D',
                      'SPECIALIST', 'ASSISTANT',
                    ];
                    const LEVEL_CODES = ['GK', 'FITNESS', 'FUTSAL'];
                    const renameToCandidates = (name: string) => locale === 'ru'
                      ? name.replace(/лицензи[ияей]+/gi, 'список кандидатов')
                      : name
                          .replace(/murabbiylik litsenziyasi/gi, 'nomzodlar ro\'yxati')
                          .replace(/litsenziyasi/gi, 'nomzodlar ro\'yxati')
                          .replace(/litsenziya/gi, 'nomzodlar ro\'yxati');

                    type Item = { code: string; name: string; level?: number };
                    const baseItems: Item[] = [
                      { code: 'MANAGEMENT', name: locale === 'ru' ? 'Список кандидатов на менеджмент' : 'Menejment nomzodlar ro\'yxati' },
                      { code: 'RENEWAL_PRO', name: locale === 'ru' ? 'Список кандидатов на продление PRO' : 'PRO yangilash nomzodlar ro\'yxati' },
                      ...licenseTypes
                        .filter((tp) => !HIDDEN_CODES.includes(tp.code))
                        .map((tp) => ({
                          code: tp.code,
                          name: renameToCandidates(locale === 'ru' ? (tp.name_ru || tp.name_uz) : tp.name_uz),
                        })),
                    ];
                    // GK / FITNESS / FUTSAL ni 3 ta daraja bilan kengaytiramiz
                    const items: Item[] = baseItems.flatMap((it) => {
                      if (!LEVEL_CODES.includes(it.code)) return [it];
                      return [1, 2, 3].map((lvl) => ({
                        code: it.code,
                        level: lvl,
                        name: `${it.name} · ${locale === 'ru' ? 'Уровень' : 'Daraja'} ${lvl}`,
                      }));
                    });

                    // Joriy tanlovni ko'rsatish
                    let buttonLabel: string;
                    if (licenseTypeFilter === 'all') {
                      buttonLabel = locale === 'ru' ? 'Все типы' : 'Barcha toifalar';
                    } else {
                      const cur = items.find((it) => it.code === licenseTypeFilter && (it.level ?? null) === levelFilter)
                        || items.find((it) => it.code === licenseTypeFilter);
                      buttonLabel = cur ? `${cur.code} — ${cur.name}` : licenseTypeFilter;
                    }

                    return (
                      <>
                        <button
                          ref={typeButtonRef}
                          type="button"
                          onClick={() => setShowTypeDropdown((v) => !v)}
                          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white inline-flex items-center gap-2"
                          title={locale === 'ru' ? 'Тип лицензии' : 'Litsenziya turi'}
                        >
                          <span className="whitespace-nowrap">{buttonLabel}</span>
                          <ChevronDown className="w-4 h-4 text-gray-500 flex-shrink-0" />
                        </button>

                        {showTypeDropdown && dropdownPos && (
                          <div
                            ref={typeDropdownRef}
                            className="fixed z-[60] w-96 bg-white border border-gray-200 rounded-lg shadow-lg py-1"
                            style={{ top: dropdownPos.top, left: dropdownPos.left, overflow: 'visible' }}
                          >
                            <button
                              type="button"
                              onClick={() => {
                                setLicenseTypeFilter('all');
                                setLevelFilter(null);
                                setShowTypeDropdown(false);
                              }}
                              className={`w-full text-left px-3 py-2 text-sm hover:bg-blue-50 ${
                                licenseTypeFilter === 'all' ? 'bg-blue-50 text-[#1A56A0] font-medium' : ''
                              }`}
                            >
                              {locale === 'ru' ? 'Все типы' : 'Barcha toifalar'}
                            </button>

                            <div className="max-h-80 overflow-y-auto">
                            {items.map((it, idx) => {
                              const isActive = licenseTypeFilter === it.code && (levelFilter ?? null) === (it.level ?? null);
                              return (
                                <button
                                  key={`${it.code}-${it.level ?? 'x'}-${idx}`}
                                  type="button"
                                  onClick={() => {
                                    setLicenseTypeFilter(it.code);
                                    setLevelFilter(it.level ?? null);
                                    setShowTypeDropdown(false);
                                  }}
                                  className={`w-full text-left px-3 py-2 text-sm hover:bg-blue-50 ${
                                    isActive ? 'bg-blue-50 text-[#1A56A0] font-medium' : ''
                                  }`}
                                >
                                  <span className="font-mono text-xs text-gray-500 mr-1.5">{it.code}</span>
                                  <span className="break-words">{it.name}</span>
                                </button>
                              );
                            })}
                            </div>
                          </div>
                        )}
                      </>
                    );
                  })()}

                  {(statusFilter !== 'all' || regionFilter !== 'all' || licenseTypeFilter !== 'all' || levelFilter != null || searchTerm) && (
                    <button
                      type="button"
                      onClick={() => {
                        setStatusFilter('all');
                        setRegionFilter('all');
                        setLicenseTypeFilter('all');
                        setLevelFilter(null);
                        setSearchTerm('');
                      }}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 flex items-center gap-1"
                      title={locale === 'ru' ? 'Сбросить фильтры' : 'Filterlarni tozalash'}
                    >
                      <X className="w-4 h-4" />
                      {locale === 'ru' ? 'Сбросить' : 'Tozalash'}
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('admin.apps_table.app_id')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('admin.apps_table.applicant')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('admin.table.license')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('admin.table.status')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {locale === 'ru' ? 'Очередь' : 'Navbat'}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('applications.submitted_at')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('admin.apps_table.actions')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {error ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center">
                    <div className="text-red-500 mb-2">{error}</div>
                    <button 
                      onClick={fetchApplications}
                      className="text-blue-500 hover:text-blue-700 underline"
                    >
                      {t('common.retry')}
                    </button>
                  </td>
                </tr>
              ) : loading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-500">
                    {t('common.loading')}
                  </td>
                </tr>
              ) : paginatedApplications.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-gray-500">
                    {t('admin.apps_table.no_applications')}
                  </td>
                </tr>
              ) : paginatedApplications.map((app: Application, index: number) => (
                <tr key={app.id} className={`hover:bg-gray-50 ${app.is_offline ? 'border-l-4 border-l-orange-400' : ''}`}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {app.id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{app.user_name}</div>
                      <div className="text-sm text-gray-500">{app.user_phone}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <span title={app.license_type_name} className="font-medium">
                      {app.license_type_code || app.license_type_name || '—'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge
                      variant="outline"
                      style={{
                        borderColor: statusConfig[app.status as keyof typeof statusConfig]?.color,
                        color: statusConfig[app.status as keyof typeof statusConfig]?.color,
                        backgroundColor: statusConfig[app.status as keyof typeof statusConfig]?.bgColor,
                      }}
                    >
                      {(() => { const sc = statusConfig[app.status as keyof typeof statusConfig]; return sc ? t(sc.tKey) : app.status; })()}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {app.queue_number ? (
                      <div className="flex items-center gap-1">
                        <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-blue-100 text-blue-800 font-bold text-xs">{app.queue_number}</span>
                        {app.queue_total && <span className="text-xs text-gray-400">/ {app.queue_total}</span>}
                      </div>
                    ) : (
                      <span className="text-gray-300 text-sm">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(app.submitted_at).toLocaleDateString(locale === 'ru' ? 'ru-RU' : 'uz-UZ')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-1.5">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => openDrawer(app)}
                        title={t('common.view')}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      {isAdmin && (app.status === 'pending' || app.status === 'under_review' || app.status === 'additional_docs') && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleApprove(app.id)}
                            disabled={actionLoading === app.id}
                            className="text-green-600 border-green-200 hover:bg-green-50 hover:text-green-700"
                            title={t('applications.status.approved')}
                          >
                            {actionLoading === app.id ? (
                              <RefreshCw className="w-4 h-4 animate-spin" />
                            ) : (
                              <CheckCircle className="w-4 h-4" />
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedAppDetails(app);
                              setShowRejectModal(true);
                            }}
                            disabled={actionLoading === app.id}
                            className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                            title={t('applications.status.rejected')}
                          >
                            <XCircle className="w-4 h-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                {locale === 'ru'
                  ? `${(currentPage - 1) * 10 + 1}–${Math.min(currentPage * 10, filteredApplications.length)} из ${filteredApplications.length}`
                  : `${(currentPage - 1) * 10 + 1} dan ${Math.min(currentPage * 10, filteredApplications.length)} gacha ${filteredApplications.length} ta`}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm text-gray-700">
                  {currentPage} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>

      {/* Application Details Drawer */}
      {showDrawer && selectedAppDetails && (
        <div 
          className="fixed inset-0 bg-black/50 z-50 flex justify-end"
          onClick={() => setShowDrawer(false)}
        >
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="w-full max-w-2xl bg-white h-full shadow-2xl overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-6 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-[#0D3B6E] to-[#1A56A0] text-white">
              <div>
                <h2 className="text-xl font-bold">
                  {t('admin.apps_table.app_id')} #{selectedAppDetails.id.slice(-6)}
                </h2>
                <p className="text-sm text-white/70 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {new Date(selectedAppDetails.submitted_at).toLocaleString(locale === 'ru' ? 'ru-RU' : 'uz-UZ')}
                </p>
              </div>
              <button 
                onClick={() => setShowDrawer(false)}
                className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-all"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Status Banner */}
              <div 
                className="p-4 rounded-xl flex items-center gap-3"
                style={{ 
                  backgroundColor: `${statusConfig[selectedAppDetails.status as keyof typeof statusConfig]?.color}15`,
                  border: `1px solid ${statusConfig[selectedAppDetails.status as keyof typeof statusConfig]?.color}30`
                }}
              >
                {(() => {
                  const StatusIcon = statusConfig[selectedAppDetails.status as keyof typeof statusConfig]?.icon || Clock;
                  return <StatusIcon 
                    className="w-6 h-6" 
                    style={{ color: statusConfig[selectedAppDetails.status as keyof typeof statusConfig]?.color }}
                  />;
                })()}
                <div>
                  <p className="font-semibold" style={{ 
                    color: statusConfig[selectedAppDetails.status as keyof typeof statusConfig]?.color 
                  }}>
                    {selectedAppDetails.status_display}
                  </p>
                  <p className="text-sm text-gray-600">
                    {selectedAppDetails.status === 'pending' && t('admin.apps_table.status_pending_desc')}
                    {selectedAppDetails.status === 'under_review' && t('admin.apps_table.status_review_desc')}
                    {selectedAppDetails.status === 'approved' && t('admin.apps_table.status_approved_desc')}
                    {selectedAppDetails.status === 'rejected' && `${t('admin.apps_table.status_rejected_prefix')}${selectedAppDetails.rejection_reason || t('common.empty')}`}
                    {selectedAppDetails.status === 'additional_docs' && t('admin.apps_table.status_docs_desc')}
                  </p>
                </div>
              </div>

              {/* Applicant Info */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <User className="w-5 h-5 text-[#1A56A0]" />
                  {t('admin.apps_table.coach_info')}
                </h3>
                <div className="bg-gray-50 rounded-xl p-4 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-[#1A56A0]/10 rounded-lg flex items-center justify-center">
                        <User className="w-5 h-5 text-[#1A56A0]" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">F.I.O</p>
                        <p className="font-medium text-gray-900">{selectedAppDetails.user_name || t('admin.apps_table.unknown')}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                        <Phone className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Telefon</p>
                        <p className="font-medium text-gray-900">{selectedAppDetails.user_phone || t('admin.apps_table.unknown')}</p>
                      </div>
                    </div>
                    {selectedAppDetails.user_email && (
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Mail className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Email</p>
                          <p className="font-medium text-gray-900">{selectedAppDetails.user_email}</p>
                        </div>
                      </div>
                    )}
                    {(selectedAppDetails.region_name || selectedAppDetails.region) && (
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                          <MapPin className="w-5 h-5 text-orange-600" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Hudud</p>
                          <p className="font-medium text-gray-900">{selectedAppDetails.region_name || selectedAppDetails.region}</p>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {selectedAppDetails.workplace && (
                    <div className="pt-3 border-t border-gray-200">
                      <div className="flex items-center gap-2 text-gray-600">
                        <Building2 className="w-4 h-4" />
                        <span className="text-sm"><strong>{t('applications.fields.workplace')}:</strong> {selectedAppDetails.workplace}</span>
                      </div>
                    </div>
                  )}
                  {selectedAppDetails.job_title && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Briefcase className="w-4 h-4" />
                      <span className="text-sm"><strong>{t('applications.fields.job_title')}:</strong> {selectedAppDetails.job_title}</span>
                    </div>
                  )}
                  {selectedAppDetails.coaching_years !== undefined && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Award className="w-4 h-4" />
                      <span className="text-sm"><strong>{t('applications.fields.coaching_years')}:</strong> {selectedAppDetails.coaching_years} {t('applications.fields.years')}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* License Info */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Award className="w-5 h-5 text-[#1A56A0]" />
                  {t('applications.info_title')}
                </h3>
                <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between py-2 border-b border-gray-200">
                    <span className="text-gray-600">{t('applications.fields.license_type')}</span>
                    <Badge 
                      className="px-3 py-1 text-sm font-semibold"
                      style={{ 
                        backgroundColor: selectedAppDetails.license_type_code === 'PRO' ? '#E74C3C' : '#3498DB',
                        color: 'white'
                      }}
                      title={selectedAppDetails.license_type_name}
                    >
                      {selectedAppDetails.license_type_code || selectedAppDetails.license_type_name || selectedAppDetails.license_type || t('admin.apps_table.unknown')}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-gray-200">
                    <span className="text-gray-600">{t('applications.docs_title')}</span>
                    <span className="font-medium text-gray-900">{selectedAppDetails.documents_count || 0}</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-gray-200">
                    <span className="text-gray-600">{t('admin.table.status')}</span>
                    <Badge 
                      className="px-3 py-1"
                      style={{ 
                        backgroundColor: statusConfig[selectedAppDetails.status as keyof typeof statusConfig]?.color || '#95A5A6',
                        color: 'white'
                      }}
                    >
                      {(() => { const sc = statusConfig[selectedAppDetails.status as keyof typeof statusConfig]; return sc ? t(sc.tKey) : selectedAppDetails.status_display; })()}
                    </Badge>
                  </div>
                  {selectedAppDetails.reviewed_by_name && (
                    <div className="flex items-center justify-between py-2">
                      <span className="text-gray-600">{t('admin.apps_table.reviewed_by')}</span>
                      <span className="font-medium text-gray-900">{selectedAppDetails.reviewed_by_name}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Documents */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-[#1A56A0]" />
                  {t('applications.docs_title')}
                </h3>
                <div className="space-y-2">
                  {selectedAppDetails.documents && selectedAppDetails.documents.length > 0 ? (
                    selectedAppDetails.documents.map((doc) => {
                      const sizeKb = doc.file_size ? `${Math.round(doc.file_size / 1024)} KB` : '';
                      return (
                        <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                              <FileText className="w-5 h-5 text-blue-600" />
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-gray-900 truncate">{doc.file_name || doc.doc_type_display}</p>
                              <p className="text-xs text-gray-500">{doc.doc_type_display}{sizeKb ? ` • ${sizeKb}` : ''}</p>
                            </div>
                          </div>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="text-blue-600 hover:bg-blue-50 flex-shrink-0 ml-3"
                            onClick={() => setPreviewDoc({ name: doc.file_name || doc.doc_type_display, url: doc.file_url })}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            {t('common.view')}
                          </Button>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-sm text-gray-500 text-center py-4">{t('admin.no_data')}</p>
                  )}
                </div>
              </div>

              {/* Admin Notes */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <History className="w-5 h-5 text-[#1A56A0]" />
                  {t('applications.admin_note')}
                </h3>
                <textarea
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  placeholder={t('applications.rejection_reason')}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1A56A0] resize-none min-h-[100px]"
                />
              </div>

              {/* Timeline */}
              {selectedAppDetails.timeline && selectedAppDetails.timeline.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <History className="w-5 h-5 text-[#1A56A0]" />
                    {t('applications.timeline_title')}
                  </h3>
                  <div className="space-y-3">
                    {selectedAppDetails.timeline.map((item, index) => (
                      <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className="w-2 h-2 bg-[#1A56A0] rounded-full mt-2" />
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{item.action}</p>
                          <p className="text-sm text-gray-600">{item.note}</p>
                          <p className="text-xs text-gray-400 mt-1">
                            {new Date(item.created_at).toLocaleString(locale === 'ru' ? 'ru-RU' : 'uz-UZ')} • {item.created_by_name}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              {isAdmin && (
                <div className="sticky bottom-0 bg-white pt-4 pb-2 border-t border-gray-200 space-y-3">
                  {/* Initial review actions */}
                  {(selectedAppDetails.status === 'pending' || selectedAppDetails.status === 'under_review' || selectedAppDetails.status === 'additional_docs') && (
                    <>
                      <div className="flex gap-3">
                        <button
                          onClick={() => handleApprove(selectedAppDetails.id)}
                          disabled={actionLoading === selectedAppDetails.id}
                          className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                        >
                          {actionLoading === selectedAppDetails.id ? (
                            <RefreshCw className="w-5 h-5 animate-spin" />
                          ) : (
                            <CheckCircle2 className="w-5 h-5" />
                          )}
                          {t('admin.apps_table.approve')}
                        </button>
                        <button
                          onClick={() => setShowRejectModal(true)}
                          className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all font-medium"
                        >
                          <XCircle className="w-5 h-5" />
                          {t('admin.apps_table.reject')}
                        </button>
                      </div>
                      <button
                        onClick={() => handleRequestDocs(selectedAppDetails.id)}
                        disabled={actionLoading === selectedAppDetails.id}
                        className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-orange-100 text-orange-700 rounded-xl hover:bg-orange-200 transition-all disabled:opacity-50 font-medium"
                      >
                        {actionLoading === selectedAppDetails.id ? (
                          <RefreshCw className="w-5 h-5 animate-spin" />
                        ) : (
                          <FileWarning className="w-5 h-5" />
                        )}
                        {t('admin.apps_table.request_docs')}
                      </button>
                    </>
                  )}

                  {/* Approved → Call for study */}
                  {selectedAppDetails.status === 'approved' && (
                    <button
                      onClick={() => setShowCallModal(true)}
                      disabled={actionLoading === selectedAppDetails.id}
                      className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-all disabled:opacity-50 font-medium"
                    >
                      {actionLoading === selectedAppDetails.id ? (
                        <RefreshCw className="w-5 h-5 animate-spin" />
                      ) : (
                        <PhoneCall className="w-5 h-5" />
                      )}
                      Telefon qilib chaqirish
                    </button>
                  )}

                  {/* Called → Start study */}
                  {selectedAppDetails.status === 'called' && (
                    <button
                      onClick={() => handleStartStudy(selectedAppDetails.id)}
                      disabled={actionLoading === selectedAppDetails.id}
                      className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition-all disabled:opacity-50 font-medium"
                    >
                      {actionLoading === selectedAppDetails.id ? (
                        <RefreshCw className="w-5 h-5 animate-spin" />
                      ) : (
                        <BookOpen className="w-5 h-5" />
                      )}
                      O'qishni boshladi
                    </button>
                  )}

                  {/* Studying → Complete or No Show */}
                  {selectedAppDetails.status === 'studying' && (
                    <div className="space-y-2">
                      <button
                        onClick={() => handleComplete(selectedAppDetails.id)}
                        disabled={actionLoading === selectedAppDetails.id}
                        className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gray-800 text-white rounded-xl hover:bg-gray-900 transition-all disabled:opacity-50 font-medium"
                      >
                        {actionLoading === selectedAppDetails.id ? (
                          <RefreshCw className="w-5 h-5 animate-spin" />
                        ) : (
                          <GraduationCap className="w-5 h-5" />
                        )}
                        O'qib bitirdi (arxivga)
                      </button>
                      <button
                        onClick={() => handleNoShow(selectedAppDetails.id)}
                        disabled={actionLoading === selectedAppDetails.id}
                        className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gray-400 text-white rounded-xl hover:bg-gray-500 transition-all disabled:opacity-50 font-medium"
                      >
                        {actionLoading === selectedAppDetails.id ? (
                          <RefreshCw className="w-5 h-5 animate-spin" />
                        ) : (
                          <UserX className="w-5 h-5" />
                        )}
                        Kelmadi (arxivga)
                      </button>
                    </div>
                  )}

                  {/* Archived status message */}
                  {(selectedAppDetails.status === 'completed' || selectedAppDetails.status === 'no_show') && (
                    <div className="p-4 bg-gray-100 rounded-xl text-center">
                      <p className="text-gray-600">
                        <Archive className="w-5 h-5 inline mr-1" />
                        Arxivga o'tkazilgan
                      </p>
                    </div>
                  )}

                  {/* Already processed message for rejected */}
                  {selectedAppDetails.status === 'rejected' && (
                    <div className="p-4 bg-red-50 rounded-xl text-center">
                      <p className="text-red-600">
                        {t('applications.title')} <span className="font-semibold">{selectedAppDetails.status_display}</span>
                      </p>
                      {selectedAppDetails.rejection_reason && (
                        <p className="text-sm text-red-600 mt-1">{t('admin.apps_table.rejection_reason_prefix')}{selectedAppDetails.rejection_reason}</p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div 
          className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4"
          onClick={() => setShowRejectModal(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-2xl p-6 w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <XCircle className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">{t('applications.status.rejected')}</h3>
              <p className="text-gray-600">{t('applications.rejection_reason')}</p>
            </div>

            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder={t('applications.rejection_reason')}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 resize-none mb-6 min-h-[100px]"
            />

            <div className="flex gap-3">
              <button
                onClick={() => setShowRejectModal(false)}
                className="flex-1 px-6 py-3 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-medium"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={() => selectedAppDetails && handleReject(selectedAppDetails.id)}
                disabled={!rejectionReason.trim() || actionLoading === selectedAppDetails?.id}
                className="flex-1 px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all disabled:opacity-50 font-medium"
              >
                {actionLoading === selectedAppDetails?.id ? t('admin.apps_table.processing') : t('admin.apps_table.reject')}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Call Confirmation Modal */}
      {showCallModal && selectedAppDetails && (
        <div 
          className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4"
          onClick={() => setShowCallModal(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-2xl p-6 w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <PhoneCall className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {locale === 'ru' ? 'Звонок кандидату' : 'Nomzodga qo\'ng\'iroq'}
              </h3>
              <p className="text-gray-600 mb-4">
                {locale === 'ru' 
                  ? 'Позвоните по указанному номеру и подтвердите готовность к обучению'
                  : "Ko'rsatilgan raqamga qo'ng'iroq qiling va o'qishga tayyorligini tasdiqlang"}
              </p>
              
              {/* Phone number display */}
              <div className="bg-gray-50 rounded-xl p-4 mb-4">
                <p className="text-sm text-gray-500 mb-1">
                  {locale === 'ru' ? 'Телефон номер:' : 'Telefon raqam:'}
                </p>
                <p className="text-2xl font-bold text-purple-600 font-mono">
                  {selectedAppDetails.user_phone || '—'}
                </p>
              </div>

              <p className="text-sm text-gray-500">
                {locale === 'ru' 
                  ? 'После разговора отметьте результат:'
                  : "Suhbatdan keyin natijani belgilang:"}
              </p>
            </div>

            <div className="space-y-3">
              {/* Yes - Spoke and confirmed */}
              <button
                onClick={() => {
                  setShowCallModal(false);
                  handleCall(selectedAppDetails.id);
                }}
                disabled={actionLoading === selectedAppDetails.id}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition-all disabled:opacity-50 font-medium"
              >
                {actionLoading === selectedAppDetails.id ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <CheckCircle className="w-5 h-5" />
                )}
                {locale === 'ru' ? 'Да, договорились (Обучается)' : "Ha, keldi (O'qiydi)"}
              </button>

              {/* No - Did not answer / rejected */}
              <button
                onClick={() => {
                  setShowCallModal(false);
                  // Open reject modal with pre-filled reason
                  setRejectionReason(locale === 'ru' 
                    ? 'Не отвечает / Отказался от обучения' 
                    : "Javob bermaydi / O'qishdan bosh tortdi");
                  setShowRejectModal(true);
                }}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all font-medium"
              >
                <XCircle className="w-5 h-5" />
                {locale === 'ru' ? 'Нет, не дозвонился / Отказ' : "Yo'q, javob bermadi / Bekor"}
              </button>

              {/* Cancel */}
              <button
                onClick={() => setShowCallModal(false)}
                className="w-full px-6 py-3 border border-gray-200 text-gray-500 rounded-xl hover:bg-gray-50 transition-all text-sm"
              >
                {locale === 'ru' ? 'Отмена' : 'Bekor qilish'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Document Preview Modal */}
      {previewDoc && (
        <div 
          className="fixed inset-0 bg-black/80 z-[70] flex items-center justify-center p-4"
          onClick={() => setPreviewDoc(null)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#1A56A0]" />
                {previewDoc.name}
              </h3>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => window.open(previewDoc.url, '_blank')}
                >
                  <Download className="w-4 h-4 mr-1" />
                  {t('common.download')}
                </Button>
                <button 
                  onClick={() => setPreviewDoc(null)}
                  className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            {/* Preview Content */}
            <div className="flex-1 overflow-auto p-4 bg-gray-100 flex items-center justify-center min-h-[50vh]">
              {previewDoc.name.endsWith('.pdf') ? (
                <iframe 
                  src={previewDoc.url} 
                  className="w-full h-[60vh] border-0 rounded-lg"
                  title={previewDoc.name}
                />
              ) : previewDoc.name.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                <img 
                  src={previewDoc.url} 
                  alt={previewDoc.name}
                  className="max-w-full max-h-[60vh] object-contain rounded-lg shadow-lg"
                />
              ) : (
                <div className="text-center p-8">
                  <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">{t('common.error')}</p>
                  <Button onClick={() => window.open(previewDoc.url, '_blank')}>
                    <Download className="w-4 h-4 mr-2" />
                    {t('common.download')}
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}

      {/* Offline Application Create Modal */}
      {showOfflineModal && (
        <div
          className="fixed inset-0 bg-black/50 z-[70] flex items-center justify-center p-4"
          onClick={() => !offlineLoading && setShowOfflineModal(false)}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl"
          >
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-xl font-bold text-gray-900">
                  {locale === 'ru' ? 'Добавить офлайн заявку' : "Offline ariza qo'shish"}
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  {locale === 'ru' ? 'Из бумажного списка в платформу' : 'Daftardagi arizani platformaga kiritish'}
                </p>
              </div>
              <button
                onClick={() => !offlineLoading && setShowOfflineModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {offlineError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                {offlineError}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">F.I.O *</label>
                <input
                  type="text"
                  value={offlineForm.full_name}
                  onChange={(e) => setOfflineForm(f => ({ ...f, full_name: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A56A0]"
                  placeholder="Ism Familiya Otasining ismi"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {locale === 'ru' ? 'Телефон' : 'Telefon raqam'}
                </label>
                <input
                  type="text"
                  value={offlineForm.phone}
                  onChange={(e) => setOfflineForm(f => ({ ...f, phone: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A56A0]"
                  placeholder="+998..."
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {locale === 'ru' ? 'Тип лицензии *' : 'Litsenziya turi *'}
                  </label>
                  <select
                    value={offlineForm.license_type}
                    onChange={(e) => setOfflineForm(f => ({ ...f, license_type: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A56A0] bg-white"
                  >
                    <option value="">{locale === 'ru' ? 'Выберите' : 'Tanlang'}</option>
                    {licenseTypes.length > 0 ? licenseTypes.map(lt => (
                      <option key={lt.code} value={lt.code}>{lt.code} - {locale === 'ru' ? (lt.name_ru || lt.name_uz) : lt.name_uz}</option>
                    )) : (
                      <>
                        <option value="PRO">PRO</option>
                        <option value="A">A</option>
                        <option value="B">B</option>
                        <option value="C">C</option>
                        <option value="D">D</option>
                      </>
                    )}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {locale === 'ru' ? 'Регион *' : 'Hudud *'}
                  </label>
                  <select
                    value={offlineForm.region}
                    onChange={(e) => setOfflineForm(f => ({ ...f, region: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A56A0] bg-white"
                  >
                    <option value="">{locale === 'ru' ? 'Выберите' : 'Tanlang'}</option>
                    {regions.map(r => (
                      <option key={r.id} value={r.id}>{locale === 'ru' ? (r.name_ru || r.name_uz) : r.name_uz}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {locale === 'ru' ? 'Дата очереди (из журнала) *' : 'Navbat sanasi (daftarga yozilgan sana) *'}
                </label>
                <input
                  type="date"
                  value={offlineForm.queue_date}
                  onChange={(e) => setOfflineForm(f => ({ ...f, queue_date: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A56A0]"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {locale === 'ru' ? 'Место работы' : 'Ish joyi'}
                  </label>
                  <input
                    type="text"
                    value={offlineForm.workplace}
                    onChange={(e) => setOfflineForm(f => ({ ...f, workplace: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A56A0]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {locale === 'ru' ? 'Опыт (лет)' : 'Tajriba (yil)'}
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={offlineForm.coaching_years}
                    onChange={(e) => setOfflineForm(f => ({ ...f, coaching_years: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A56A0]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {locale === 'ru' ? 'Статус' : 'Holat'}
                </label>
                <select
                  value={offlineForm.status}
                  onChange={(e) => setOfflineForm(f => ({ ...f, status: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A56A0] bg-white"
                >
                  <option value="pending">{t('applications.status.pending')}</option>
                  <option value="under_review">{t('applications.status.under_review')}</option>
                  <option value="approved">{t('applications.status.approved')}</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowOfflineModal(false)}
                disabled={offlineLoading}
                className="flex-1 px-6 py-3 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-all disabled:opacity-50"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleOfflineCreate}
                disabled={offlineLoading}
                className="flex-1 px-6 py-3 bg-[#1A56A0] text-white rounded-xl hover:bg-[#0D3B6E] transition-all disabled:opacity-50 font-medium flex items-center justify-center gap-2"
              >
                {offlineLoading && <RefreshCw className="w-4 h-4 animate-spin" />}
                {offlineLoading
                  ? (locale === 'ru' ? 'Сохранение...' : 'Saqlanmoqda...')
                  : (locale === 'ru' ? 'Добавить' : "Qo'shish")}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </Card>
  );
}
