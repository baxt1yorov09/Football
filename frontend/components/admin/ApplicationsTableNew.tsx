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
  History
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { apiClient, API_ENDPOINTS } from '@/lib/api/client';
import { useAuth } from '@/hooks/useAuth';

interface Application {
  id: string;
  user_name: string;
  user_email?: string;
  user_phone: string;
  license_type_name: string;
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
}

interface ApplicationsTableProps {
  showAll?: boolean;
}

const statusConfig = {
  pending: { label: 'Kutilmoqda', color: '#F39C12', bgColor: '#F39C12/10', icon: Clock },
  under_review: { label: 'Ko\'rib chiqilmoqda', color: '#3498DB', bgColor: '#3498DB/10', icon: Eye },
  additional_docs: { label: 'Qo\'shimcha hujjatlar', color: '#E67E22', bgColor: '#E67E22/10', icon: Clock },
  approved: { label: 'Tasdiqlangan', color: '#27AE60', bgColor: '#27AE60/10', icon: CheckCircle },
  rejected: { label: 'Rad etilgan', color: '#E74C3C', bgColor: '#E74C3C/10', icon: XCircle },
};

export function ApplicationsTableNew({ showAll = false }: ApplicationsTableProps) {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  
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
        setError('Ruxsat yo\'q: Admin huquqlari talab qilinadi');
      } else {
        setError('Arizalarni yuklashda xatolik yuz berdi');
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

  const handleApprove = async (applicationId: string) => {
    try {
      setActionLoading(applicationId);
      await apiClient.post(`/api/applications/admin/${applicationId}/action`, {
        action: 'approve',
        note: adminNote || 'Ariza tasdiqlandi'
      });
      await fetchApplications();
      setShowDrawer(false);
    } catch (err) {
      console.error('Tasdiqlashda xatolik:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (applicationId: string) => {
    if (!rejectionReason.trim()) return;
    try {
      setActionLoading(applicationId);
      await apiClient.post(`/api/applications/admin/${applicationId}/action`, {
        action: 'reject',
        note: adminNote,
        rejection_reason: rejectionReason
      });
      await fetchApplications();
      setShowRejectModal(false);
      setShowDrawer(false);
      setRejectionReason('');
    } catch (err) {
      console.error('Rad etishda xatolik:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRequestDocs = async (applicationId: string) => {
    try {
      setActionLoading(applicationId);
      await apiClient.post(`/api/applications/admin/${applicationId}/action`, {
        action: 'request_docs',
        note: adminNote || 'Qo\'shimcha hujjatlar talab qilindi'
      });
      await fetchApplications();
      setShowDrawer(false);
    } catch (err) {
      console.error('Hujjat so\'rashda xatolik:', err);
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

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-bold text-[#0D3B6E]">
          {showAll ? 'Barcha arizalar' : 'So\'nggi arizalar'}
        </CardTitle>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
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
                  placeholder="Arizachi yoki ID bo'yicha qidirish..."
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
                <option value="all">Barcha statuslar</option>
                <option value="pending">Kutilmoqda</option>
                <option value="under_review">Ko'rib chiqilmoqda</option>
                <option value="additional_docs">Qo'shimcha hujjatlar</option>
                <option value="approved">Tasdiqlangan</option>
                <option value="rejected">Rad etilgan</option>
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
                  Ariza ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Arizachi
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Litsenziya
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sana
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amallar
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
                      Qayta urinish
                    </button>
                  </td>
                </tr>
              ) : loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500">
                    Yuklanmoqda...
                  </td>
                </tr>
              ) : paginatedApplications.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500">
                    Arizalar topilmadi
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
                    {app.license_type_name}
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
                      {statusConfig[app.status as keyof typeof statusConfig]?.label}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(app.submitted_at).toLocaleDateString('uz-UZ')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => openDrawer(app)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <select
                        value={app.status}
                        onChange={(e) => handleStatusChange(app.id, e.target.value)}
                        className="px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      >
                        <option value="pending">Kutilmoqda</option>
                        <option value="under_review">Ko'rib chiqilmoqda</option>
                        <option value="additional_docs">Qo'shimcha hujjatlar</option>
                        <option value="approved">Tasdiqlangan</option>
                        <option value="rejected">Rad etilgan</option>
                      </select>
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
                {(currentPage - 1) * 10 + 1} dan {Math.min(currentPage * 10, filteredApplications.length)} gacha {filteredApplications.length} ta
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
                  Ariza #{selectedAppDetails.id.slice(-6)}
                </h2>
                <p className="text-sm text-white/70 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {new Date(selectedAppDetails.submitted_at).toLocaleString('uz-UZ')}
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
                    {selectedAppDetails.status === 'pending' && 'Yangi ariza, ko\'rib chiqish talab etiladi'}
                    {selectedAppDetails.status === 'under_review' && 'Admin tomonidan ko\'rib chiqilmoqda'}
                    {selectedAppDetails.status === 'approved' && 'Ariza tasdiqlandi, litsenziya berildi'}
                    {selectedAppDetails.status === 'rejected' && `Rad etildi: ${selectedAppDetails.rejection_reason || 'Sabab ko\'rsatilmagan'}`}
                    {selectedAppDetails.status === 'additional_docs' && 'Qo\'shimcha hujjatlar talab qilinmoqda'}
                  </p>
                </div>
              </div>

              {/* Applicant Info */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <User className="w-5 h-5 text-[#1A56A0]" />
                  Murabbiy ma'lumotlari
                </h3>
                <div className="bg-gray-50 rounded-xl p-4 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-[#1A56A0]/10 rounded-lg flex items-center justify-center">
                        <User className="w-5 h-5 text-[#1A56A0]" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">F.I.O</p>
                        <p className="font-medium text-gray-900">{selectedAppDetails.user_name || 'Noma\'lum'}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                        <Phone className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">Telefon</p>
                        <p className="font-medium text-gray-900">{selectedAppDetails.user_phone || 'Noma\'lum'}</p>
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
                        <span className="text-sm"><strong>Ish joyi:</strong> {selectedAppDetails.workplace}</span>
                      </div>
                    </div>
                  )}
                  {selectedAppDetails.job_title && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Briefcase className="w-4 h-4" />
                      <span className="text-sm"><strong>Lavozim:</strong> {selectedAppDetails.job_title}</span>
                    </div>
                  )}
                  {selectedAppDetails.coaching_years !== undefined && (
                    <div className="flex items-center gap-2 text-gray-600">
                      <Award className="w-4 h-4" />
                      <span className="text-sm"><strong>Tajriba:</strong> {selectedAppDetails.coaching_years} yil</span>
                    </div>
                  )}
                </div>
              </div>

              {/* License Info */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Award className="w-5 h-5 text-[#1A56A0]" />
                  Ariza ma'lumotlari
                </h3>
                <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between py-2 border-b border-gray-200">
                    <span className="text-gray-600">Litsenziya turi</span>
                    <Badge 
                      className="px-3 py-1 text-sm font-semibold"
                      style={{ 
                        backgroundColor: selectedAppDetails.license_type_name?.includes('PRO') ? '#E74C3C' : '#3498DB',
                        color: 'white'
                      }}
                    >
                      {selectedAppDetails.license_type_name || selectedAppDetails.license_type || 'Noma\'lum'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-gray-200">
                    <span className="text-gray-600">Hujjatlar soni</span>
                    <span className="font-medium text-gray-900">{selectedAppDetails.documents_count || 0} ta</span>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-gray-200">
                    <span className="text-gray-600">Holat</span>
                    <Badge 
                      className="px-3 py-1"
                      style={{ 
                        backgroundColor: statusConfig[selectedAppDetails.status as keyof typeof statusConfig]?.color || '#95A5A6',
                        color: 'white'
                      }}
                    >
                      {selectedAppDetails.status_display}
                    </Badge>
                  </div>
                  {selectedAppDetails.reviewed_by_name && (
                    <div className="flex items-center justify-between py-2">
                      <span className="text-gray-600">Ko'rib chiqqan</span>
                      <span className="font-medium text-gray-900">{selectedAppDetails.reviewed_by_name}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Documents */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-[#1A56A0]" />
                  Hujjatlar
                </h3>
                <div className="space-y-2">
                  {[
                    { name: 'passport.pdf', size: '245 KB', type: 'pdf' },
                    { name: 'rasm_3x4.jpg', size: '180 KB', type: 'image' },
                    { name: 'c_litsenziya.pdf', size: '320 KB', type: 'pdf' }
                  ].map((doc, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <FileText className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{doc.name}</p>
                          <p className="text-xs text-gray-500">{doc.size}</p>
                        </div>
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-blue-600 hover:bg-blue-50"
                        onClick={() => {
                          // Hujjat URL'sini yaratish - backend dan kelgan haqiqiy URL bo'lishi kerak
                          // Test uchun placeholder rasmlar:
                          const placeholderUrls: Record<string, string> = {
                            'rasm_3x4.jpg': 'https://placehold.co/400x500/1A56A0/white?text=3x4+Rasm',
                            'passport.pdf': 'https://placehold.co/600x800/0D3B6E/white?text=Passport+PDF',
                            'c_litsenziya.pdf': 'https://placehold.co/600x800/E74C3C/white?text=C+License+PDF'
                          };
                          const docUrl = placeholderUrls[doc.name] || `/api/applications/${selectedAppDetails?.id}/documents/${doc.name}`;
                          setPreviewDoc({ name: doc.name, url: docUrl });
                        }}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Ko'rish
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Admin Notes */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <History className="w-5 h-5 text-[#1A56A0]" />
                  Admin izohi
                </h3>
                <textarea
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  placeholder="Sabab yozing..."
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1A56A0] resize-none min-h-[100px]"
                />
              </div>

              {/* Timeline */}
              {selectedAppDetails.timeline && selectedAppDetails.timeline.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <History className="w-5 h-5 text-[#1A56A0]" />
                    Faoliyat tarixi
                  </h3>
                  <div className="space-y-3">
                    {selectedAppDetails.timeline.map((item, index) => (
                      <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className="w-2 h-2 bg-[#1A56A0] rounded-full mt-2" />
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{item.action}</p>
                          <p className="text-sm text-gray-600">{item.note}</p>
                          <p className="text-xs text-gray-400 mt-1">
                            {new Date(item.created_at).toLocaleString('uz-UZ')} • {item.created_by_name}
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
                      Tasdiqlash
                    </button>
                    <button
                      onClick={() => setShowRejectModal(true)}
                      className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all font-medium"
                    >
                      <XCircle className="w-5 h-5" />
                      Rad etish
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
                    Qo'&apos;shimcha hujjat so'rash
                  </button>
                </div>
              )}

              {/* Already processed message */}
              {isAdmin && (selectedAppDetails.status === 'approved' || selectedAppDetails.status === 'rejected') && (
                <div className="p-4 bg-gray-50 rounded-xl text-center">
                  <p className="text-gray-600">
                    Ariza <span className="font-semibold">{selectedAppDetails.status_display}</span>
                  </p>
                  {selectedAppDetails.rejection_reason && (
                    <p className="text-sm text-red-600 mt-1">Sabab: {selectedAppDetails.rejection_reason}</p>
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
              <h3 className="text-xl font-bold text-gray-900 mb-2">Arizani rad etish</h3>
              <p className="text-gray-600">Rad etish sababini kiriting</p>
            </div>

            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Sababni batafsil yozing..."
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 resize-none mb-6 min-h-[100px]"
            />

            <div className="flex gap-3">
              <button
                onClick={() => setShowRejectModal(false)}
                className="flex-1 px-6 py-3 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-medium"
              >
                Bekor qilish
              </button>
              <button
                onClick={() => selectedAppDetails && handleReject(selectedAppDetails.id)}
                disabled={!rejectionReason.trim() || actionLoading === selectedAppDetails?.id}
                className="flex-1 px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all disabled:opacity-50 font-medium"
              >
                {actionLoading === selectedAppDetails?.id ? 'Ishlanmoqda...' : 'Rad etish'}
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
                  Yuklab olish
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
                  <p className="text-gray-600 mb-4">Bu faylni ko'rish mumkin emas</p>
                  <Button onClick={() => window.open(previewDoc.url, '_blank')}>
                    <Download className="w-4 h-4 mr-2" />
                    Yuklab olish
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
