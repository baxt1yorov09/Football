'use client';

import { useState } from 'react';
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

interface ApplicationsTableProps {
  showAll?: boolean;
}

const applications = [
  {
    id: 'APP-2026-001234',
    applicant: 'Jasur Karimov',
    licenseType: 'PRO Litsenziya',
    submittedAt: '08.05.2026 14:30',
    status: 'under_review',
    phone: '+998 90 123-45-67',
    region: 'Toshkent',
    reviewer: 'Admin User',
  },
  {
    id: 'APP-2026-001233',
    applicant: 'Azizbek Toshmatov',
    licenseType: 'A Litsenziya',
    submittedAt: '08.05.2026 12:15',
    status: 'pending',
    phone: '+998 91 234-56-78',
    region: 'Samarqand',
    reviewer: null,
  },
  {
    id: 'APP-2026-001232',
    applicant: 'Dilfuza Rahimova',
    licenseType: 'C Litsenziya',
    submittedAt: '08.05.2026 10:45',
    status: 'approved',
    phone: '+998 99 345-67-89',
    region: 'Farg\'ona',
    reviewer: 'Admin User',
  },
  {
    id: 'APP-2026-001231',
    applicant: 'Bobur Alimov',
    licenseType: 'D Litsenziya',
    submittedAt: '07.05.2026 16:20',
    status: 'rejected',
    phone: '+998 93 456-78-90',
    region: 'Buxoro',
    reviewer: 'Admin User',
  },
  {
    id: 'APP-2026-001230',
    applicant: 'Gulnora Karimova',
    licenseType: 'B Litsenziya',
    submittedAt: '07.05.2026 14:10',
    status: 'additional_docs',
    phone: '+998 94 567-89-01',
    region: 'Xorazm',
    reviewer: 'Admin User',
  },
];

const statusConfig = {
  pending: { label: 'Kutilmoqda', color: '#F39C12', bgColor: '#F39C12/10', icon: Clock },
  under_review: { label: 'Ko\'rib chiqilmoqda', color: '#3498DB', bgColor: '#3498DB/10', icon: Eye },
  additional_docs: { label: 'Qo\'shimcha hujjatlar', color: '#E67E22', bgColor: '#E67E22/10', icon: Clock },
  approved: { label: 'Tasdiqlangan', color: '#27AE60', bgColor: '#27AE60/10', icon: CheckCircle },
  rejected: { label: 'Rad etilgan', color: '#E74C3C', bgColor: '#E74C3C/10', icon: XCircle },
};

export function ApplicationsTable({ showAll = false }: ApplicationsTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedApplication, setSelectedApplication] = useState<string | null>(null);

  const filteredApplications = applications.filter(app => {
    const matchesSearch = app.applicant.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         app.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
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
              {paginatedApplications.map((application, index) => {
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
                        <p className="font-medium text-gray-900">{application.applicant}</p>
                        <p className="text-sm text-gray-500">{application.phone}</p>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="text-sm font-medium">{application.licenseType}</span>
                    </td>
                    <td className="p-4 text-sm text-gray-600">{application.submittedAt}</td>
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
                    <td className="p-4 text-sm text-gray-600">{application.region}</td>
                    <td className="p-4">
                      {application.reviewer ? (
                        <span className="text-sm text-gray-600">{application.reviewer}</span>
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
