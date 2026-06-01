'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Header } from '@/components/layout/Header';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Search, Filter, Download, Eye, CheckCircle, XCircle, Clock, FileText,
  Calendar, MapPin, Phone, Mail, User, ChevronLeft, ChevronRight, 
  MoreVertical, AlertCircle, CheckSquare, Square, X, RefreshCw, Send,
  FileCheck, FileWarning, FileX, Archive, TrendingUp, TrendingDown,
  Building2, Briefcase, Award
} from 'lucide-react';
import { useRouter } from 'next/navigation';

// Types
interface Application {
  id: string;
  user_name: string;
  user_phone: string;
  user_email: string;
  license_type_name: string;
  license_type_code: string;
  region_name: string;
  status: 'pending' | 'under_review' | 'additional_docs' | 'approved' | 'rejected' | 'cancelled';
  status_display: string;
  workplace?: string;
  job_title?: string;
  coaching_years?: number;
  submitted_at: string;
  reviewed_at?: string;
  reviewed_by_name?: string;
  documents_count: number;
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
  rejection_reason?: string;
  admin_note?: string;
  timeline?: any[];
  queue_number?: number;
  queue_total?: number;
  is_offline?: boolean;
}

interface Statistics {
  total: number;
  pending: number;
  under_review: number;
  approved: number;
  rejected: number;
  additional_docs: number;
}

// API client
const apiClient = {
  get: async (url: string) => {
    const token = localStorage.getItem('adminAccessToken');
    const response = await fetch(`/api/applications${url}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!response.ok) throw new Error('API Error');
    return response.json();
  },
  post: async (url: string, data: any) => {
    const token = localStorage.getItem('adminAccessToken');
    const response = await fetch(`/api/applications${url}`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('API Error');
    return response.json();
  }
};

export default function AdminApplicationsPage() {
  const [activeTab, setActiveTab] = useState('applications');
  const [applications, setApplications] = useState<Application[]>([]);
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [regionFilter, setRegionFilter] = useState('all');
  const [licenseTypeFilter, setLicenseTypeFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedApplications, setSelectedApplications] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showDrawer, setShowDrawer] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [viewingDocument, setViewingDocument] = useState<{ url: string; name: string; mime: string } | null>(null);
  const [regions, setRegions] = useState<Array<{ id: number; name_uz: string }>>([]);
  const [showOfflineModal, setShowOfflineModal] = useState(false);
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
  const [offlineLoading, setOfflineLoading] = useState(false);
  const [offlineError, setOfflineError] = useState('');
  const router = useRouter();
  const itemsPerPage = 10;

  // Load regions for filter
  useEffect(() => {
    fetch('/api/auth/regions')
      .then(res => res.ok ? res.json() : [])
      .then(data => setRegions(Array.isArray(data) ? data : (data.results || [])))
      .catch(() => setRegions([]));
  }, []);

  // Load applications
  const loadApplications = async () => {
    try {
      setLoading(true);
      setError('');
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (regionFilter !== 'all') params.append('region', regionFilter);
      if (licenseTypeFilter !== 'all') params.append('license_type', licenseTypeFilter);
      if (searchQuery) params.append('search', searchQuery);
      if (dateFrom) params.append('date_from', dateFrom);
      if (dateTo) params.append('date_to', dateTo);
      params.append('page', currentPage.toString());
      params.append('page_size', itemsPerPage.toString());

      const response = await apiClient.get(`/admin/all?${params.toString()}`);
      
      if (response.applications) {
        setApplications(response.applications);
        setStatistics(response.statistics);
        setTotalPages(Math.ceil(response.statistics.total / itemsPerPage));
      }
    } catch (err) {
      setError('Arizalarni yuklashda xatolik');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApplications();
  }, [statusFilter, regionFilter, licenseTypeFilter, searchQuery, dateFrom, dateTo, currentPage]);

  // Auto refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(loadApplications, 30000);
    return () => clearInterval(interval);
  }, [statusFilter, regionFilter, licenseTypeFilter, searchQuery, dateFrom, dateTo, currentPage]);

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; color: string; icon: any }> = {
      pending: { label: 'Kutilmoqda', color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: Clock },
      under_review: { label: 'Ko\'rib chiqilmoqda', color: 'bg-blue-100 text-blue-800 border-blue-200', icon: Eye },
      additional_docs: { label: 'Hujjat kerak', color: 'bg-orange-100 text-orange-800 border-orange-200', icon: FileWarning },
      approved: { label: 'Tasdiqlangan', color: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle },
      rejected: { label: 'Rad etilgan', color: 'bg-red-100 text-red-800 border-red-200', icon: XCircle },
      cancelled: { label: 'Bekor qilingan', color: 'bg-gray-100 text-gray-700 border-gray-200', icon: Archive },
    };
    const statusConfig = config[status] || config.pending;
    const Icon = statusConfig.icon;
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${statusConfig.color}`}>
        <Icon className="w-3.5 h-3.5" />
        {statusConfig.label}
      </span>
    );
  };

  const getLicenseBadge = (code?: string, name?: string) => {
    if (!code && !name) {
      return <span className="text-gray-400 text-xs">—</span>;
    }
    const colors: Record<string, string> = {
      PRO: 'bg-purple-100 text-purple-800',
      A: 'bg-blue-100 text-blue-800',
      B: 'bg-green-100 text-green-800',
      C: 'bg-orange-100 text-orange-800',
      D: 'bg-red-100 text-red-800',
    };
    const label = code || name || '';
    return <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${colors[code || ''] || 'bg-gray-100 text-gray-800'}`} title={name || ''}>{label}</span>;
  };

  const handleOfflineCreate = async () => {
    if (!offlineForm.full_name.trim() || !offlineForm.license_type || !offlineForm.region || !offlineForm.queue_date) {
      setOfflineError('F.I.O, litsenziya turi, hudud va sana majburiy');
      return;
    }
    setOfflineLoading(true);
    setOfflineError('');
    try {
      const token = localStorage.getItem('adminAccessToken');
      const res = await fetch('/api/applications/admin/offline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          ...offlineForm,
          coaching_years: offlineForm.coaching_years ? parseInt(offlineForm.coaching_years) : 0,
          region: parseInt(offlineForm.region),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.detail || data?.error || 'Xatolik');
      }
      setShowOfflineModal(false);
      setOfflineForm({ full_name: '', phone: '', license_type: '', region: '', workplace: '', job_title: '', coaching_years: '', queue_date: new Date().toISOString().split('T')[0], status: 'pending' });
      await loadApplications();
    } catch (err: any) {
      setOfflineError(err.message || 'Xatolik yuz berdi');
    } finally {
      setOfflineLoading(false);
    }
  };

  // Handle application actions
  const handleApprove = async (applicationId: string) => {
    setActionLoading(applicationId);
    try {
      await apiClient.post(`/admin/${applicationId}/action`, {
        action: 'approve',
        note: 'Ariza tasdiqlandi'
      });
      await loadApplications();
      setShowDrawer(false);
    } catch (err) {
      setError('Tasdiqlashda xatolik');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (applicationId: string) => {
    if (!rejectionReason.trim()) {
      setError('Rad etish sababini kiriting');
      return;
    }
    setActionLoading(applicationId);
    try {
      await apiClient.post(`/admin/${applicationId}/action`, {
        action: 'reject',
        note: 'Ariza rad etildi',
        rejection_reason: rejectionReason
      });
      await loadApplications();
      setShowRejectModal(false);
      setShowDrawer(false);
      setRejectionReason('');
    } catch (err) {
      setError('Rad etishda xatolik');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRequestDocs = async (applicationId: string) => {
    setActionLoading(applicationId);
    try {
      await apiClient.post(`/admin/${applicationId}/action`, {
        action: 'request_docs',
        note: 'Qo\'shimcha hujjatlar talab qilindi'
      });
      await loadApplications();
      setShowDrawer(false);
    } catch (err) {
      setError('Hujjat so\'rashda xatolik');
    } finally {
      setActionLoading(null);
    }
  };

  const openDrawer = (application: Application) => {
    console.log('Opening drawer for:', application.id, application.user_name);
    setSelectedApplication(application);
    setShowDrawer(true);
    console.log('showDrawer set to true');
  };

  const toggleSelectAll = () => {
    if (selectedApplications.length === applications.length) {
      setSelectedApplications([]);
    } else {
      setSelectedApplications(applications.map(app => app.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedApplications(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleBulkApprove = async () => {
    if (selectedApplications.length === 0) return;
    setActionLoading('bulk');
    try {
      await Promise.all(
        selectedApplications.map(id => 
          apiClient.post(`/admin/${id}/action`, {
            action: 'approve',
            note: 'Ommaviy tasdiqlash'
          })
        )
      );
      await loadApplications();
      setSelectedApplications([]);
    } catch (err) {
      setError('Ommaviy tasdiqlashda xatolik');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F6F9]">
      <Header />
      <AdminSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="lg:ml-64 pt-16">
        <div className="p-4 lg:p-8">
          {/* Error Message */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3"
            >
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
              <button 
                onClick={() => setError('')}
                className="ml-auto p-1 text-red-400 hover:text-red-600"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-3xl font-bold text-[#0D3B6E]">
              Arizalar boshqaruvi
            </h1>
            <p className="text-gray-600 mt-1">
              Barcha litsenziya arizalarini ko'rish va boshqarish
            </p>
          </motion.div>

          {/* Stats Cards */}
          {statistics && (
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
              {[
                { label: 'Jami arizalar', value: statistics.total, icon: FileText, color: 'blue', trend: null },
                { label: 'Kutilmoqda', value: statistics.pending, icon: Clock, color: 'yellow', trend: 'up' },
                { label: "Ko'rilmoqda", value: statistics.under_review, icon: Eye, color: 'blue', trend: null },
                { label: 'Tasdiqlangan', value: statistics.approved, icon: CheckCircle, color: 'green', trend: 'up' },
                { label: 'Rad etilgan', value: statistics.rejected, icon: XCircle, color: 'red', trend: 'down' },
              ].map((stat, index) => {
                const Icon = stat.icon;
                const TrendIcon = stat.trend === 'up' ? TrendingUp : stat.trend === 'down' ? TrendingDown : null;
                return (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                        <Icon className={`w-5 h-5 text-${stat.color}-600`} />
                      </div>
                      {TrendIcon && (
                        <div className={`flex items-center gap-1 text-sm font-medium text-${stat.color}-600`}>
                          <TrendIcon className="w-4 h-4" />
                          <span>+{Math.floor(Math.random() * 20)}%</span>
                        </div>
                      )}
                    </div>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                    <p className="text-sm text-gray-500">{stat.label}</p>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Filters */}
          <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm mb-6">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex-1 min-w-[300px] relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Qidirish (ID, F.I.O, telefon...)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A56A0] focus:border-transparent"
                />
              </div>
              
              <div className="flex gap-3">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A56A0] bg-white"
                >
                  <option value="all">Barcha holatlar</option>
                  <option value="pending">Kutilmoqda</option>
                  <option value="under_review">Ko'rib chiqilmoqda</option>
                  <option value="additional_docs">Hujjat kerak</option>
                  <option value="approved">Tasdiqlangan</option>
                  <option value="rejected">Rad etilgan</option>
                  <option value="cancelled">Bekor qilingan</option>
                </select>
                
                <select
                  value={regionFilter}
                  onChange={(e) => setRegionFilter(e.target.value)}
                  className="px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A56A0] bg-white"
                >
                  <option value="all">Barcha hududlar</option>
                  {regions.map(r => (
                    <option key={r.id} value={r.id}>{r.name_uz}</option>
                  ))}
                </select>
                
                <select
                  value={licenseTypeFilter}
                  onChange={(e) => setLicenseTypeFilter(e.target.value)}
                  className="px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A56A0] bg-white"
                >
                  <option value="all">Barcha litsenziyalar</option>
                  <option value="PRO">Professional</option>
                  <option value="A">A toifali</option>
                  <option value="B">B toifali</option>
                  <option value="C">C toifali</option>
                  <option value="D">D toifali</option>
                </select>
                
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A56A0]"
                  placeholder="Sana dan"
                />
                
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A56A0]"
                  placeholder="Sana gacha"
                />
              </div>

              <div className="flex gap-2">
                <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-all">
                  <Download className="w-5 h-5" />
                  Excel yuklash
                </button>
                <button 
                  onClick={loadApplications}
                  className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-all"
                >
                  <RefreshCw className="w-5 h-5" />
                  Yangilash
                </button>
                <button
                  onClick={() => setShowOfflineModal(true)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-[#1A56A0] text-white rounded-xl hover:bg-[#0D3B6E] transition-all font-medium"
                >
                  <FileText className="w-5 h-5" />
                  Offline ariza
                </button>
              </div>
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedApplications.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <input 
                  type="checkbox" 
                  checked={selectedApplications.length === applications.length}
                  onChange={toggleSelectAll}
                  className="w-4 h-4 rounded border-gray-300 text-[#1A56A0] focus:ring-[#1A56A0]"
                />
                <p className="text-blue-900 font-medium">
                  {selectedApplications.length} ta ariza tanlandi
                </p>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={handleBulkApprove}
                  disabled={actionLoading === 'bulk'}
                  className="px-4 py-2 bg-white text-blue-700 rounded-lg hover:bg-blue-100 transition-all text-sm font-medium disabled:opacity-50"
                >
                  {actionLoading === 'bulk' ? 'Ishlanmoqda...' : 'Tasdiqlash'}
                </button>
                <button className="px-4 py-2 bg-white text-red-700 rounded-lg hover:bg-red-50 transition-all text-sm font-medium">
                  Rad etish
                </button>
                <button 
                  onClick={() => setSelectedApplications([])}
                  className="p-2 text-blue-700 hover:bg-blue-100 rounded-lg transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          )}

          {/* Applications Table */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                Arizalar ro'yxati ({applications.length})
              </h2>
              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  checked={selectedApplications.length === applications.length && applications.length > 0}
                  onChange={toggleSelectAll}
                  className="w-4 h-4 rounded border-gray-300 text-[#1A56A0] focus:ring-[#1A56A0]"
                />
                <span className="text-sm text-gray-500">Barchasini tanlash</span>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="px-4 py-4 text-left">
                      <input 
                        type="checkbox" 
                        checked={selectedApplications.length === applications.length && applications.length > 0}
                        onChange={toggleSelectAll}
                        className="w-4 h-4 rounded border-gray-300 text-[#1A56A0] focus:ring-[#1A56A0]"
                      />
                    </th>
                    <th className="px-4 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Ariza №</th>
                    <th className="px-4 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Murabbiy</th>
                    <th className="px-4 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Litsenziya</th>
                    <th className="px-4 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Hudud</th>
                    <th className="px-4 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Navbat</th>
                    <th className="px-4 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Sana</th>
                    <th className="px-4 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Holat</th>
                    <th className="px-4 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Amallar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-12 text-center">
                        <RefreshCw className="w-8 h-8 text-[#1A56A0] animate-spin mx-auto mb-4" />
                        <p className="text-gray-500">Yuklanmoqda...</p>
                      </td>
                    </tr>
                  ) : applications.map((app) => {
                    const isSelected = selectedApplications.includes(app.id);
                    return (
                      <tr key={app.id} className={`hover:bg-gray-50 transition-colors ${isSelected ? 'bg-blue-50/50' : ''} ${app.is_offline ? 'border-l-4 border-l-orange-400' : ''}`}>
                        <td className="px-4 py-4">
                          <input 
                            type="checkbox" 
                            checked={isSelected}
                            onChange={() => toggleSelect(app.id)}
                            className="w-4 h-4 rounded border-gray-300 text-[#1A56A0] focus:ring-[#1A56A0]"
                          />
                        </td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-sm text-gray-900">{app.id.slice(-4)}</span>
                            {app.is_offline && <span className="text-xs bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded font-medium">offline</span>}
                          </div>
                        </td>
                        <td className="px-4 py-4">
                          <div>
                            <p className="font-medium text-gray-900">{app.user_name}</p>
                            <p className="text-sm text-gray-500">{app.user_phone}</p>
                          </div>
                        </td>
                        <td className="px-4 py-4">{getLicenseBadge(app.license_type_code, app.license_type_name)}</td>
                        <td className="px-4 py-4 text-gray-600">{app.region_name}</td>
                        <td className="px-4 py-4">
                          {app.queue_number ? (
                            <div className="flex items-center gap-1">
                              <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-800 font-bold text-sm">{app.queue_number}</span>
                              {app.queue_total && <span className="text-xs text-gray-400">/ {app.queue_total}</span>}
                            </div>
                          ) : (
                            <span className="text-gray-400 text-xs">—</span>
                          )}
                        </td>
                        <td className="px-4 py-4 text-gray-600 text-sm">
                          {new Date(app.submitted_at).toLocaleDateString('uz-UZ')}
                        </td>
                        <td className="px-4 py-4">{getStatusBadge(app.status)}</td>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-1">
                            <button 
                              onClick={() => openDrawer(app)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                              title="Ko'rish"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            {app.status === 'pending' || app.status === 'under_review' ? (
                              <>
                                <button 
                                  onClick={() => handleApprove(app.id)}
                                  disabled={actionLoading === app.id}
                                  className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-all disabled:opacity-50"
                                  title="Tasdiqlash"
                                >
                                  {actionLoading === app.id ? (
                                    <RefreshCw className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <CheckCircle className="w-4 h-4" />
                                  )}
                                </button>
                                <button 
                                  onClick={() => {
                                    setSelectedApplication(app);
                                    setShowRejectModal(true);
                                  }}
                                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                  title="Rad etish"
                                >
                                  <XCircle className="w-4 h-4" />
                                </button>
                              </>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {!loading && applications.length === 0 && (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Arizalar topilmadi</p>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-4 py-4 border-t border-gray-100 flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  Sahifa {currentPage} / {totalPages}
                </p>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum = i + 1;
                    if (totalPages > 5 && currentPage > 3) pageNum = currentPage - 2 + i;
                    if (pageNum > totalPages) pageNum = totalPages - 4 + i;
                    if (pageNum < 1) pageNum = 1;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-9 h-9 rounded-lg text-sm font-medium transition-all ${
                          currentPage === pageNum 
                            ? 'bg-[#1A56A0] text-white' 
                            : 'hover:bg-gray-100 text-gray-600'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
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

          {/* Application Details Drawer */}
          <AnimatePresence>
            {showDrawer && selectedApplication && (
              <motion.div
                key="drawer-overlay"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 z-[100]"
                onClick={() => setShowDrawer(false)}
              >
                <motion.div
                  initial={{ x: '100%' }}
                  animate={{ x: 0 }}
                  exit={{ x: '100%' }}
                  transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                  className="absolute right-0 top-0 h-full w-full max-w-2xl bg-white shadow-2xl overflow-y-auto"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="p-6">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <h2 className="text-xl font-bold text-gray-900">
                          Ariza #{selectedApplication.id.slice(-4)}
                        </h2>
                        <p className="text-sm text-gray-500">
                          Yuborilgan: {new Date(selectedApplication.submitted_at).toLocaleString('uz-UZ')}
                        </p>
                      </div>
                      <button 
                        onClick={() => setShowDrawer(false)}
                        className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Applicant Info */}
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <User className="w-5 h-5" />
                        Murabbiy ma'lumotlari
                      </h3>
                      <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-gray-500">F.I.O</p>
                            <p className="font-medium text-gray-900">{selectedApplication.user_name}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Telefon</p>
                            <p className="font-medium text-gray-900">{selectedApplication.user_phone}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Email</p>
                            <p className="font-medium text-gray-900">{selectedApplication.user_email}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-500">Hudud</p>
                            <p className="font-medium text-gray-900">{selectedApplication.region_name}</p>
                          </div>
                        </div>
                        {selectedApplication.workplace && (
                          <div>
                            <p className="text-sm text-gray-500">Ish joyi</p>
                            <p className="font-medium text-gray-900">{selectedApplication.workplace}</p>
                          </div>
                        )}
                        {selectedApplication.job_title && (
                          <div>
                            <p className="text-sm text-gray-500">Lavozim</p>
                            <p className="font-medium text-gray-900">{selectedApplication.job_title}</p>
                          </div>
                        )}
                        {selectedApplication.coaching_years && (
                          <div>
                            <p className="text-sm text-gray-500">Tajriba</p>
                            <p className="font-medium text-gray-900">{selectedApplication.coaching_years} yil</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* License Info */}
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <FileCheck className="w-5 h-5" />
                        Ariza ma'lumotlari
                      </h3>
                      <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Litsenziya turi</span>
                          {getLicenseBadge(selectedApplication.license_type_code, selectedApplication.license_type_name)}
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Holat</span>
                          {getStatusBadge(selectedApplication.status)}
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-gray-600">Hujjatlar soni</span>
                          <span className="font-medium text-gray-900">{selectedApplication.documents_count} ta</span>
                        </div>
                        {selectedApplication.queue_number && (
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600">Navbat raqami</span>
                            <span className="inline-flex items-center gap-1 font-bold text-blue-700">
                              #{selectedApplication.queue_number}
                              {selectedApplication.queue_total && <span className="text-gray-400 font-normal text-sm">/ {selectedApplication.queue_total}</span>}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Documents */}
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <FileText className="w-5 h-5" />
                        Hujjatlar
                      </h3>
                      <div className="space-y-2">
                        {selectedApplication.documents && selectedApplication.documents.length > 0 ? (
                          selectedApplication.documents.map((doc) => (
                            <div key={doc.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <div className="flex items-center gap-3 min-w-0 flex-1">
                                {doc.is_verified ? (
                                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                                ) : (
                                  <FileText className="w-5 h-5 text-gray-400 flex-shrink-0" />
                                )}
                                <div className="min-w-0">
                                  <p className="text-gray-700 truncate">{doc.file_name || doc.doc_type_display}</p>
                                  <p className="text-xs text-gray-400">{doc.doc_type_display}</p>
                                </div>
                              </div>
                              <button
                                onClick={() => setViewingDocument({ url: doc.file_url, name: doc.file_name, mime: doc.mime_type })}
                                className="text-blue-600 hover:text-blue-700 text-sm font-medium flex-shrink-0 ml-3"
                              >
                                Ko'rish
                              </button>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-gray-500 text-center py-4">Hujjatlar topilmadi</p>
                        )}
                      </div>
                    </div>

                    {/* Admin Note */}
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Mail className="w-5 h-5" />
                        Admin izohi
                      </h3>
                      <textarea
                        placeholder="Sabab yozing..."
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#1A56A0] resize-none"
                        rows={3}
                      />
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                      {(selectedApplication.status === 'pending' || selectedApplication.status === 'under_review') ? (
                        <>
                          <button
                            onClick={() => handleApprove(selectedApplication.id)}
                            disabled={actionLoading === selectedApplication.id}
                            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all disabled:opacity-50"
                          >
                            {actionLoading === selectedApplication.id ? (
                              <RefreshCw className="w-5 h-5 animate-spin" />
                            ) : (
                              <CheckCircle className="w-5 h-5" />
                            )}
                            Tasdiqlash
                          </button>
                          <button
                            onClick={() => setShowRejectModal(true)}
                            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all"
                          >
                            <XCircle className="w-5 h-5" />
                            Rad etish
                          </button>
                          <button
                            onClick={() => handleRequestDocs(selectedApplication.id)}
                            disabled={actionLoading === selectedApplication.id}
                            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-orange-600 text-white rounded-xl hover:bg-orange-700 transition-all disabled:opacity-50"
                          >
                            {actionLoading === selectedApplication.id ? (
                              <RefreshCw className="w-5 h-5 animate-spin" />
                            ) : (
                              <FileWarning className="w-5 h-5" />
                            )}
                            Hujjat so'rash
                          </button>
                        </>
                      ) : (
                        <div className="w-full p-4 bg-gray-50 rounded-xl text-center">
                          <p className="text-gray-600">
                            Ariza {selectedApplication.status_display}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Offline Application Create Modal */}
          <AnimatePresence>
            {showOfflineModal && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
                onClick={() => setShowOfflineModal(false)}
              >
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  transition={{ type: 'spring', damping: 30, stiffness: 300 }}
                  className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">Offline ariza qo'shish</h3>
                      <p className="text-sm text-gray-500 mt-1">Daftardagi arizani platformaga kiritish</p>
                    </div>
                    <button onClick={() => setShowOfflineModal(false)} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg">
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {offlineError && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{offlineError}</div>
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
                      <label className="block text-sm font-medium text-gray-700 mb-1">Telefon raqam</label>
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
                        <label className="block text-sm font-medium text-gray-700 mb-1">Litsenziya turi *</label>
                        <select
                          value={offlineForm.license_type}
                          onChange={(e) => setOfflineForm(f => ({ ...f, license_type: e.target.value }))}
                          className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A56A0] bg-white"
                        >
                          <option value="">Tanlang</option>
                          <option value="PRO">Professional</option>
                          <option value="A">A toifali</option>
                          <option value="B">B toifali</option>
                          <option value="C">C toifali</option>
                          <option value="D">D toifali</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Hudud *</label>
                        <select
                          value={offlineForm.region}
                          onChange={(e) => setOfflineForm(f => ({ ...f, region: e.target.value }))}
                          className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A56A0] bg-white"
                        >
                          <option value="">Tanlang</option>
                          {regions.map(r => (
                            <option key={r.id} value={r.id}>{r.name_uz}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Navbat sanasi (daftarga yozilgan sana) *</label>
                      <input
                        type="date"
                        value={offlineForm.queue_date}
                        onChange={(e) => setOfflineForm(f => ({ ...f, queue_date: e.target.value }))}
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A56A0]"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Ish joyi</label>
                        <input
                          type="text"
                          value={offlineForm.workplace}
                          onChange={(e) => setOfflineForm(f => ({ ...f, workplace: e.target.value }))}
                          className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A56A0]"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Tajriba (yil)</label>
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
                      <label className="block text-sm font-medium text-gray-700 mb-1">Holat</label>
                      <select
                        value={offlineForm.status}
                        onChange={(e) => setOfflineForm(f => ({ ...f, status: e.target.value }))}
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A56A0] bg-white"
                      >
                        <option value="pending">Kutilmoqda</option>
                        <option value="under_review">Ko'rib chiqilmoqda</option>
                        <option value="approved">Tasdiqlangan</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex gap-3 mt-6">
                    <button
                      onClick={() => setShowOfflineModal(false)}
                      className="flex-1 px-6 py-3 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-all"
                    >
                      Bekor qilish
                    </button>
                    <button
                      onClick={handleOfflineCreate}
                      disabled={offlineLoading}
                      className="flex-1 px-6 py-3 bg-[#1A56A0] text-white rounded-xl hover:bg-[#0D3B6E] transition-all disabled:opacity-50 font-medium"
                    >
                      {offlineLoading ? 'Saqlanmoqda...' : 'Qo\'shish'}
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Reject Modal */}
          <AnimatePresence>
            {showRejectModal && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
                onClick={() => setShowRejectModal(false)}
              >
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  transition={{ type: 'spring', damping: 30, stiffness: 300 }}
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
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 resize-none mb-6"
                    rows={4}
                  />

                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowRejectModal(false)}
                      className="flex-1 px-6 py-3 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-all"
                    >
                      Bekor qilish
                    </button>
                    <button
                      onClick={() => selectedApplication && handleReject(selectedApplication.id)}
                      disabled={!rejectionReason.trim() || actionLoading === selectedApplication?.id}
                      className="flex-1 px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all disabled:opacity-50"
                    >
                      {actionLoading === selectedApplication?.id ? 'Ishlanmoqda...' : 'Rad etish'}
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Document Viewer Modal */}
          <AnimatePresence>
            {viewingDocument && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4"
                onClick={() => setViewingDocument(null)}
              >
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  className="bg-white rounded-2xl w-full max-w-4xl h-[90vh] flex flex-col overflow-hidden"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <div className="flex items-center gap-3 min-w-0">
                      <FileText className="w-5 h-5 text-gray-500 flex-shrink-0" />
                      <h3 className="font-semibold text-gray-900 truncate">{viewingDocument.name}</h3>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <a
                        href={viewingDocument.url}
                        download={viewingDocument.name}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-all"
                        title="Yuklab olish"
                      >
                        <Download className="w-5 h-5" />
                      </a>
                      <button
                        onClick={() => setViewingDocument(null)}
                        className="p-2 text-gray-400 hover:text-gray-600 rounded-lg"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                  <div className="flex-1 overflow-auto bg-gray-50 flex items-center justify-center">
                    {viewingDocument.mime?.startsWith('image/') || /\.(jpe?g|png|gif|webp|bmp)$/i.test(viewingDocument.url) ? (
                      <img
                        src={viewingDocument.url}
                        alt={viewingDocument.name}
                        className="max-w-full max-h-full object-contain"
                      />
                    ) : viewingDocument.mime === 'application/pdf' || /\.pdf$/i.test(viewingDocument.url) ? (
                      <iframe
                        src={viewingDocument.url}
                        title={viewingDocument.name}
                        className="w-full h-full border-0"
                      />
                    ) : (
                      <div className="text-center p-8">
                        <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-600 mb-4">Bu hujjatni ko'rib bo'lmaydi</p>
                        <a
                          href={viewingDocument.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 px-4 py-2 bg-[#1A56A0] text-white rounded-lg hover:bg-[#0D3B6E] transition-all"
                        >
                          <Download className="w-4 h-4" />
                          Yuklab olish
                        </a>
                      </div>
                    )}
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
