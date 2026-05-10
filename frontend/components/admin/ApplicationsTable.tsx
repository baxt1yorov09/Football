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
  ChevronRight
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
  user_phone: string;
  license_type_name: string;
  status: string;
  status_display: string;
  submitted_at: string;
  reviewed_at?: string;
  reviewed_by_name?: string;
  rejection_reason?: string;
  region?: string;
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

  const filteredApplications = applications.filter(app => {
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
              ) : paginatedApplications.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-gray-500">
                    Arizalar topilmadi
                  </td>
                </tr>
              ) : paginatedApplications.map((application, index) => {
                const status = statusConfig[application.status as keyof typeof statusConfig];
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
                        <p className="font-medium text-gray-900">{application.user_name}</p>
                        <p className="text-sm text-gray-500">{application.user_phone}</p>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="text-sm font-medium">{application.license_type_name}</span>
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
                    <td className="p-4 text-sm text-gray-600">{application.region || '-'}</td>
                    <td className="p-4">
                      {application.reviewed_by_name ? (
                        <span className="text-sm text-gray-600">{application.reviewed_by_name}</span>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-2">
                        <Button variant="ghost" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
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
  );
}

export default ApplicationsTable;
