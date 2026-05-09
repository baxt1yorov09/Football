'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Header } from '@/components/layout/Header';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, Download, Eye, CheckCircle, XCircle, Clock, FileText } from 'lucide-react';

// Mock applications data - replace with API call
const mockApplications = [
  { id: 'APP-2024-001', applicant: 'Azizbek Karimov', phone: '+998901234567', licenseType: 'B', status: 'pending', submittedAt: '2024-05-01', region: 'Toshkent', documents: 3 },
  { id: 'APP-2024-002', applicant: 'Dilshod Rahimov', phone: '+998931112233', licenseType: 'C', status: 'approved', submittedAt: '2024-04-28', region: 'Samarqand', documents: 4, approvedAt: '2024-04-30' },
  { id: 'APP-2024-003', applicant: 'Nodira Usmanova', phone: '+998997776655', licenseType: 'A', status: 'rejected', submittedAt: '2024-04-25', region: 'Buxoro', documents: 2, rejectionReason: 'Hujjatlar yetarli emas' },
  { id: 'APP-2024-004', applicant: 'Sardor Xamidov', phone: '+998955667788', licenseType: 'PRO', status: 'pending', submittedAt: '2024-05-02', region: 'Andijon', documents: 5 },
  { id: 'APP-2024-005', applicant: 'Jasur Tolipov', phone: '+998944443322', licenseType: 'D', status: 'approved', submittedAt: '2024-04-20', region: 'Farg\'ona', documents: 3, approvedAt: '2024-04-22' },
];

export default function AdminApplicationsPage() {
  const [activeTab, setActiveTab] = useState('applications');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredApplications = mockApplications.filter(app => {
    const matchesSearch = app.applicant.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         app.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         app.phone.includes(searchQuery);
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
    };
    const labels = {
      pending: 'Kutilmoqda',
      approved: 'Tasdiqlangan',
      rejected: 'Rad etilgan',
    };
    const icons = {
      pending: <Clock className="w-3 h-3 mr-1" />,
      approved: <CheckCircle className="w-3 h-3 mr-1" />,
      rejected: <XCircle className="w-3 h-3 mr-1" />,
    };
    return (
      <Badge className={`${styles[status as keyof typeof styles]} flex items-center`}>
        {icons[status as keyof typeof icons]}
        {labels[status as keyof typeof labels]}
      </Badge>
    );
  };

  const getLicenseBadge = (type: string) => {
    const colors: { [key: string]: string } = {
      PRO: 'bg-purple-100 text-purple-800',
      A: 'bg-blue-100 text-blue-800',
      B: 'bg-green-100 text-green-800',
      C: 'bg-orange-100 text-orange-800',
      D: 'bg-red-100 text-red-800',
    };
    return <Badge className={colors[type] || 'bg-gray-100'}>{type}</Badge>;
  };

  return (
    <div className="min-h-screen bg-[#F4F6F9]">
      <Header />
      <AdminSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="ml-64 pt-16">
        <div className="p-8">
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Jami arizalar</p>
                    <p className="text-2xl font-bold text-[#0D3B6E]">{mockApplications.length}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <FileText className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Kutilmoqda</p>
                    <p className="text-2xl font-bold text-yellow-600">
                      {mockApplications.filter(a => a.status === 'pending').length}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                    <Clock className="w-6 h-6 text-yellow-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Tasdiqlangan</p>
                    <p className="text-2xl font-bold text-green-600">
                      {mockApplications.filter(a => a.status === 'approved').length}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Rad etilgan</p>
                    <p className="text-2xl font-bold text-red-600">
                      {mockApplications.filter(a => a.status === 'rejected').length}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                    <XCircle className="w-6 h-6 text-red-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-4 items-center">
                <div className="flex-1 min-w-[300px] relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    placeholder="Qidirish (ID, ism, telefon...)"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <div className="flex gap-2">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">Barcha statuslar</option>
                    <option value="pending">Kutilmoqda</option>
                    <option value="approved">Tasdiqlangan</option>
                    <option value="rejected">Rad etilgan</option>
                  </select>

                  <Button variant="outline" className="flex items-center gap-2">
                    <Filter className="w-4 h-4" />
                    Filtrlar
                  </Button>
                </div>

                <Button variant="outline" className="flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  Excel yuklash
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Applications Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Arizalar ro'yxati ({filteredApplications.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Ariza ID</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Ariza beruvchi</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Litsenziya turi</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Viloyat</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Hujjatlar</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Yuborilgan</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Amallar</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredApplications.map((app) => (
                      <tr key={app.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <span className="font-mono text-sm text-gray-600">{app.id}</span>
                        </td>
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-medium text-gray-900">{app.applicant}</p>
                            <p className="text-sm text-gray-500">{app.phone}</p>
                          </div>
                        </td>
                        <td className="py-3 px-4">{getLicenseBadge(app.licenseType)}</td>
                        <td className="py-3 px-4">{getStatusBadge(app.status)}</td>
                        <td className="py-3 px-4 text-gray-700">{app.region}</td>
                        <td className="py-3 px-4">
                          <Badge variant="outline">{app.documents} ta</Badge>
                        </td>
                        <td className="py-3 px-4 text-gray-500 text-sm">{app.submittedAt}</td>
                        <td className="py-3 px-4">
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm">
                              <Eye className="w-4 h-4" />
                            </Button>
                            {app.status === 'pending' && (
                              <>
                                <Button variant="ghost" size="sm" className="text-green-600">
                                  <CheckCircle className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" size="sm" className="text-red-600">
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

              {filteredApplications.length === 0 && (
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Arizalar topilmadi</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
