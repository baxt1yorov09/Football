'use client';

import { useState, useEffect } from 'react';
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
  Archive
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

const statusConfig = {
  pending:         { tKey: 'applications.status.pending',         color: '#F39C12', bgColor: '#F39C12/10', icon: Clock },
  under_review:    { tKey: 'applications.status.under_review',    color: '#3498DB', bgColor: '#3498DB/10', icon: Eye },
  additional_docs: { tKey: 'applications.status.additional_docs', color: '#E67E22', bgColor: '#E67E22/10', icon: Clock },
  approved:        { tKey: 'applications.status.approved',        color: '#27AE60', bgColor: '#27AE60/10', icon: CheckCircle },
  rejected:        { tKey: 'applications.status.rejected',        color: '#E74C3C', bgColor: '#E74C3C/10', icon: XCircle },
  cancelled:       { tKey: 'applications.status.cancelled',       color: '#7F8C8D', bgColor: '#7F8C8D/10', icon: Archive },
};

export function ApplicationsTableNew({ showAll = false }: ApplicationsTableProps) {
  const { user } = useAuth();
  const { t, locale } = useI18n();
  const [hasAdminToken, setHasAdminToken] = useState(false);

  useEffect(() => {
    setHasAdminToken(!!localStorage.getItem('adminAccessToken'));
  }, []);

  const isAdmin = hasAdminToken
    || user?.role === 'super_admin'
    || user?.role === 'region_admin'
    || user?.role === 'admin';
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
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
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchApplications();
  }, [isAdmin]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Use admin endpoint for admins, user endpoint for regular users
      const endpoint = isAdmin 
        ? API_ENDPOINTS.applications.adminList 
        : API_ENDPOINTS.applications.list;
        
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
  
  const filteredApplications = safeApplications.filter((app: Application) => {
    // Handle undefined/null values safely
    const userName = app?.user_name || '';
    const appId = app?.id || '';
    const appStatus = app?.status || '';
    
    const matchesSearch = userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         appId.toLowerCase().includes(searchTerm.toLowerCase());
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
            <div className="flex gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">{t('common.all')}</option>
                <option value="pending">{t('applications.status.pending')}</option>
                <option value="under_review">{t('applications.status.under_review')}</option>
                <option value="additional_docs">{t('applications.status.additional_docs')}</option>
                <option value="approved">{t('applications.status.approved')}</option>
                <option value="rejected">{t('applications.status.rejected')}</option>
                <option value="cancelled">{t('applications.status.cancelled')}</option>
              </select>
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
                  <td colSpan={6} className="p-8 text-center">
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
                  <td colSpan={6} className="p-8 text-center text-gray-500">
                    {t('common.loading')}
                  </td>
                </tr>
              ) : paginatedApplications.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500">
                    {t('admin.apps_table.no_applications')}
                  </td>
                </tr>
              ) : paginatedApplications.map((app: Application, index: number) => (
                <tr key={app.id} className="hover:bg-gray-50">
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
                          <p className="text-xs text-gray-500">Viloyat</p>
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
              {isAdmin && (selectedAppDetails.status === 'pending' || selectedAppDetails.status === 'under_review' || selectedAppDetails.status === 'additional_docs') && (
                <div className="sticky bottom-0 bg-white pt-4 pb-2 border-t border-gray-200 space-y-3">
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
                </div>
              )}

              {/* Already processed message */}
              {isAdmin && (selectedAppDetails.status === 'approved' || selectedAppDetails.status === 'rejected') && (
                <div className="p-4 bg-gray-50 rounded-xl text-center">
                  <p className="text-gray-600">
                    {t('applications.title')} <span className="font-semibold">{selectedAppDetails.status_display}</span>
                  </p>
                  {selectedAppDetails.rejection_reason && (
                    <p className="text-sm text-red-600 mt-1">{t('admin.apps_table.rejection_reason_prefix')}{selectedAppDetails.rejection_reason}</p>
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
    </Card>
  );
}
