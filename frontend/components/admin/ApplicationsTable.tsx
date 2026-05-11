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
  Trash2,
  Edit3,
  AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { apiClient, API_ENDPOINTS } from '@/lib/api/client';
import { useAuth } from '@/hooks/useAuth';

interface Application {
  id: string;
  user_name: string;
  user_phone: string;
  license_type_name?: string;
  license_type_code?: string;
  license_type?: number | string;
  status: string;
  status_display: string;
  submitted_at: string;
  reviewed_at?: string;
  reviewed_by_name?: string;
  rejection_reason?: string;
  region?: string;
  region_name?: string;
  workplace?: string;
  job_title?: string;
  coaching_years?: number;
  admin_note?: string;
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

export function ApplicationsTable({ showAll = false }: ApplicationsTableProps) {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedApplication, setSelectedApplication] = useState<string | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Drawer state for viewing details
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  
  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [appToDelete, setAppToDelete] = useState<Application | null>(null);
  const [deleting, setDeleting] = useState(false);
  
  // Edit dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [appToEdit, setAppToEdit] = useState<Application | null>(null);
  const [editFormData, setEditFormData] = useState({
    workplace: '',
    job_title: '',
    coaching_years: '',
  });
  const [editing, setEditing] = useState(false);

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
      const data = response.data;
      // Admin endpoint returns { applications, statistics }
      // User endpoint returns array directly or { applications }
      const apps = isAdmin 
        ? response.data.applications 
        : (response.data.applications || response.data);
      
      setApplications(apps || []);
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

  // Open drawer to view details
  const openDrawer = (app: Application) => {
    console.log('Opening drawer for app:', app);
    console.log('Workplace:', app.workplace);
    console.log('Job title:', app.job_title);
    console.log('Coaching years:', app.coaching_years);
    setSelectedApp(app);
    setDrawerOpen(true);
  };

  // Debug drawer state
  useEffect(() => {
    console.log('Drawer state changed:', { drawerOpen, selectedApp: !!selectedApp });
  }, [drawerOpen, selectedApp]);

  // Open delete dialog
  const openDeleteDialog = (app: Application) => {
    setAppToDelete(app);
    setDeleteDialogOpen(true);
  };

  // Delete application
  const handleDelete = async () => {
    if (!appToDelete) return;
    
    try {
      setDeleting(true);
      await apiClient.delete(`/applications/${appToDelete.id}/`);
      
      // Remove from list
      setApplications(prev => prev.filter(app => app.id !== appToDelete.id));
      setDeleteDialogOpen(false);
      setAppToDelete(null);
    } catch (err: any) {
      console.error('Error deleting application:', err);
      alert(err.response?.data?.error || 'Arizani o\'chirishda xatolik yuz berdi');
    } finally {
      setDeleting(false);
    }
  };

  // Open edit dialog
  const openEditDialog = (app: Application) => {
    setAppToEdit(app);
    setEditFormData({
      workplace: app.workplace || '',
      job_title: app.job_title || '',
      coaching_years: app.coaching_years ? String(app.coaching_years) : '',
    });
    setEditDialogOpen(true);
  };

  // Edit application
  const handleEdit = async () => {
    if (!appToEdit) return;
    
    try {
      setEditing(true);
      const response = await apiClient.patch(`/applications/${appToEdit.id}/`, {
        workplace: editFormData.workplace,
        job_title: editFormData.job_title,
        coaching_years: editFormData.coaching_years ? parseInt(editFormData.coaching_years) : null,
      });
      
      // Update in list
      setApplications(prev => prev.map(app => 
        app.id === appToEdit.id ? { ...app, ...response.data } : app
      ));
      setEditDialogOpen(false);
      setAppToEdit(null);
    } catch (err: any) {
      console.error('Error editing application:', err);
      alert(err.response?.data?.error || 'Arizani tahrirlashda xatolik yuz berdi');
    } finally {
      setEditing(false);
    }
  };

  // Filter out cancelled applications and apply search/status filters
  const filteredApplications = applications.filter(app => {
    // Don't show cancelled applications
    if (app.status === 'cancelled') return false;
    
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

  return (
    <>
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
                  className="pl-12 h-10"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-10 px-3 border border-gray-200 rounded-lg focus:outline-none focus:border-[#F39C12]"
              >
                <option value="all">Barcha statuslar</option>
                {Object.entries(statusConfig).map(([key, config]) => (
                  <option key={key} value={key}>{config.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left p-4 font-medium text-gray-700">ID</th>
                <th className="text-left p-4 font-medium text-gray-700">Arizachi</th>
                <th className="text-left p-4 font-medium text-gray-700">Litsenziya turi</th>
                <th className="text-left p-4 font-medium text-gray-700">Yuborilgan</th>
                <th className="text-left p-4 font-medium text-gray-700">Status</th>
                <th className="text-left p-4 font-medium text-gray-700">Region</th>
                <th className="text-left p-4 font-medium text-gray-700">Tekshiruvchi</th>
                <th className="text-center p-4 font-medium text-gray-700">Amallar</th>
              </tr>
            </thead>
            <tbody>
              {error ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center">
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
                  <td colSpan={8} className="p-8 text-center text-gray-500">
                    Yuklanmoqda...
                  </td>
                </tr>
              ) : !user ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center">
                    <div className="text-gray-600 mb-4">
                      <p className="text-lg font-medium mb-2">Tizimga kiring</p>
                      <p className="text-sm">O'z arizalaringizni ko'rish uchun tizimga kiring</p>
                    </div>
                    <a 
                      href="/login"
                      className="inline-block px-6 py-2 bg-[#1A56A0] text-white rounded-lg hover:bg-[#0D3B6E] transition-colors"
                    >
                      Kirish
                    </a>
                  </td>
                </tr>
              ) : paginatedApplications.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-gray-500">
                    <p className="mb-2">Arizalar topilmadi</p>
                    <p className="text-sm text-gray-400">Siz hali hech qanday ariza yubormagansiz</p>
                  </td>
                </tr>
              ) : paginatedApplications.map((application, index) => {
                const status = statusConfig[application.status as keyof typeof statusConfig] || statusConfig.pending;
                const StatusIcon = status.icon;

                return (
                  <motion.tr
                    key={application.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    <td className="p-4 font-mono text-sm">{application.id}</td>
                    <td className="p-4">
                      <div>
                        {(() => {
                          // Agar user_name "Ism kiritilmagan" bo'lsa, kulrang ko'rsat
                          const isEmptyName = !application.user_name || 
                            application.user_name === 'Ism kiritilmagan' ||
                            application.user_name?.startsWith('+') || 
                            application.user_name?.match(/^\d/);
                          
                          return (
                            <>
                              <p className={isEmptyName ? 'text-gray-400 italic' : 'font-medium text-gray-900'}>
                                {isEmptyName ? 'Ism kiritilmagan' : application.user_name}
                              </p>
                              {application.user_phone && (
                                <p className="text-sm text-gray-500">{application.user_phone}</p>
                              )}
                            </>
                          );
                        })()}
                      </div>
                    </td>
                    <td className="p-4">
                      {(() => {
                        // license_type_code or license_type_name or map from ID
                        const code = application.license_type_code || application.license_type_name;
                        if (code) {
                          return (
                            <Badge 
                              className="text-sm font-medium px-3 py-1"
                              style={{ 
                                backgroundColor: code.includes('PRO') ? '#E74C3C' : '#3498DB',
                                color: 'white'
                              }}
                            >
                              {code}
                            </Badge>
                          );
                        }
                        // Map from license_type ID if needed
                        const idToCode: Record<number, string> = {
                          1: 'C', 2: 'B', 3: 'A', 4: 'D', 5: 'PRO',
                          6: 'GK_1', 7: 'GK_2', 8: 'GK_3',
                          9: 'FITNESS_1', 10: 'FITNESS_2', 11: 'FITNESS_3',
                          12: 'SELEK', 13: 'PSYCH',
                          14: 'ANALYTICS_1', 15: 'ANALYTICS_2',
                          16: 'C_RENEWAL', 17: 'B_RENEWAL', 18: 'A_RENEWAL', 19: 'PRO_RENEWAL',
                          20: 'BEACH',
                          21: 'FUTSAL_1', 22: 'FUTSAL_2', 23: 'FUTSAL_3',
                          24: 'FUTSAL_GK_1', 25: 'FUTSAL_GK_2', 26: 'FUTSAL_GK_3'
                        };
                        const mappedCode = typeof application.license_type === 'number' 
                          ? idToCode[application.license_type] 
                          : application.license_type;
                        return (
                          <Badge 
                            className="text-sm font-medium px-3 py-1"
                            style={{ 
                              backgroundColor: mappedCode?.includes('PRO') ? '#E74C3C' : '#3498DB',
                              color: 'white'
                            }}
                          >
                            {mappedCode || 'Noma\'lum'}
                          </Badge>
                        );
                      })()}
                    </td>
                    <td className="p-4 text-sm text-gray-600">{new Date(application.submitted_at).toLocaleDateString('uz-UZ')}</td>
                    <td className="p-4">
                      <Badge 
                        variant="secondary"
                        style={{ 
                          backgroundColor: status.bgColor, 
                          color: status.color,
                          border: 'none'
                        }}
                        className="flex items-center gap-1 w-fit"
                      >
                        <StatusIcon className="w-3 h-3" />
                        {status.label}
                      </Badge>
                    </td>
                    <td className="p-4 text-sm">
                      {application.region_name || application.region ? (
                        <span className="text-gray-900">{application.region_name || application.region}</span>
                      ) : (
                        <span className="text-gray-400 italic">Ko'rsatilmagan</span>
                      )}
                    </td>
                    <td className="p-4">
                      {application.reviewed_by_name ? (
                        <span className="text-sm text-gray-600">{application.reviewed_by_name}</span>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-1">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => openDrawer(application)}
                          title="Ko'rish"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                        
                        {/* Show edit/delete for pending and under_review applications */}
                        {!isAdmin && (application.status === 'pending' || application.status === 'under_review') && (
                          <>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => openEditDialog(application)}
                              title="Tahrirlash"
                              className="text-blue-600 hover:text-blue-800"
                            >
                              <Edit3 className="w-4 h-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => openDeleteDialog(application)}
                              title="O'chirish"
                              className="text-red-600 hover:text-red-800"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {showAll && totalPages > 1 && (
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600">
                {filteredApplications.length} ta arizadan {(currentPage - 1) * 10 + 1}-{Math.min(currentPage * 10, filteredApplications.length)} ko'rsatilmoqda
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-sm font-medium px-3">
                  {currentPage} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>

    {/* Delete Confirmation Dialog */}
    <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
      <DialogContent className="sm:max-w-md bg-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertCircle className="w-5 h-5" />
            Arizani o'chirish
          </DialogTitle>
          <DialogDescription>
            Haqiqatan ham bu arizani o'chirmoqchimisiz? Bu amalni qaytarib bo'lmaydi.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <div className="bg-gray-50 p-3 rounded-md">
            <p className="text-sm"><strong>Ariza ID:</strong> {appToDelete?.id}</p>
            <p className="text-sm"><strong>Litsenziya:</strong> {appToDelete?.license_type_code}</p>
            <p className="text-sm"><strong>Status:</strong> {appToDelete?.status_display}</p>
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => setDeleteDialogOpen(false)}
            disabled={deleting}
          >
            Bekor qilish
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={deleting}
          >
            {deleting ? 'O\'chirilmoqda...' : 'O\'chirish'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {/* Edit Dialog */}
    <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
      <DialogContent className="sm:max-w-md bg-white">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-blue-600">
            <Edit3 className="w-5 h-5" />
            Arizani tahrirlash
          </DialogTitle>
          <DialogDescription>
            Ariza ma'lumotlarini yangilang
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700">Ish joyi</label>
            <Input
              value={editFormData.workplace}
              onChange={(e) => setEditFormData(prev => ({ ...prev, workplace: e.target.value }))}
              placeholder="Ish joyi nomi"
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Lavozim</label>
            <Input
              value={editFormData.job_title}
              onChange={(e) => setEditFormData(prev => ({ ...prev, job_title: e.target.value }))}
              placeholder="Lavozimingiz"
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700">Murabbiylik staji (yil)</label>
            <Input
              type="number"
              value={editFormData.coaching_years}
              onChange={(e) => setEditFormData(prev => ({ ...prev, coaching_years: e.target.value }))}
              placeholder="Masalan: 5"
              className="mt-1"
            />
          </div>
        </div>
        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => setEditDialogOpen(false)}
            disabled={editing}
          >
            Bekor qilish
          </Button>
          <Button
            onClick={handleEdit}
            disabled={editing}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {editing ? 'Saqlanmoqda...' : 'Saqlash'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    {/* Application Details Drawer */}
    {selectedApp && (
      <div className={`fixed inset-0 z-50 overflow-hidden ${drawerOpen ? 'block' : 'hidden'}`}>
        {/* Backdrop */}
        <div 
          className="absolute inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={() => setDrawerOpen(false)}
        />
        
        {/* Drawer Panel */}
        <div className={`absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl transform transition-transform ${
          drawerOpen ? 'translate-x-0' : 'translate-x-full'
        }`}>
          <div className="h-full flex flex-col" style={{ minHeight: '100vh' }}>
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Ariza tafsilotlari</h3>
              <button
                onClick={() => setDrawerOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Content */}
            <div className="flex-1 overflow-y-auto px-6 py-4" style={{ maxHeight: 'calc(100vh - 80px)' }}>
              <div className="space-y-4">
                {/* Application Info */}
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Ariza ma'lumotlari</h4>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">ID:</span>
                      <span className="text-sm font-medium">{selectedApp.id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Litsenziya:</span>
                      <span className="text-sm font-medium">{selectedApp.license_type_code || 'Noma\'lum'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Status:</span>
                      <span className="text-sm font-medium">{selectedApp.status_display}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Yuborilgan:</span>
                      <span className="text-sm font-medium">
                        {new Date(selectedApp.submitted_at).toLocaleDateString('uz-UZ')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Applicant Info */}
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-2">Arizachi</h4>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Ism:</span>
                      <span className="text-sm font-medium">
                        {selectedApp.user_name === 'Ism kiritilmagan' ? (
                          <span className="text-gray-400 italic">Ism kiritilmagan</span>
                        ) : (
                          selectedApp.user_name
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Telefon:</span>
                      <span className="text-sm font-medium">{selectedApp.user_phone}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Viloyat:</span>
                      <span className="text-sm font-medium">
                        {selectedApp.region_name || selectedApp.region || (
                          <span className="text-gray-400 italic">Ko'rsatilmagan</span>
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Work Info */}
                <div className="border-t pt-4 mt-4 bg-blue-50">
                  <h4 className="text-sm font-medium text-gray-500 mb-3">Ish ma'lumotlari</h4>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3 border-2 border-blue-200">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Ish joyi:</span>
                      <span className="text-sm font-medium">
                        {selectedApp.workplace ? selectedApp.workplace : (
                          <span className="text-gray-400 italic">Ko'rsatilmagan</span>
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Lavozim:</span>
                      <span className="text-sm font-medium">
                        {selectedApp.job_title ? selectedApp.job_title : (
                          <span className="text-gray-400 italic">Ko'rsatilmagan</span>
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Murabbiylik staji:</span>
                      <span className="text-sm font-medium">
                        {selectedApp.coaching_years ? `${selectedApp.coaching_years} yil` : (
                          <span className="text-gray-400 italic">Ko'rsatilmagan</span>
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )}
    </>
  );
}

export default ApplicationsTable;
