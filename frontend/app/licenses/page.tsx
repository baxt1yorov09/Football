'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, Download, Eye } from 'lucide-react';

export default function LicensesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const mockLicenses = [
    {
      id: 1,
      licenseNumber: 'L-2024-001',
      fullName: 'Aliyev Karim Botirovich',
      licenseType: 'PRO',
      status: 'active',
      issueDate: '2024-01-15',
      expiryDate: '2025-01-14',
      club: 'Pakhtakor FC'
    },
    {
      id: 2,
      licenseNumber: 'L-2024-002',
      fullName: 'Rahimova Dilnoza Azizovna',
      licenseType: 'A',
      status: 'active',
      issueDate: '2024-02-20',
      expiryDate: '2025-02-19',
      club: 'Bunyodkor FC'
    },
    {
      id: 3,
      licenseNumber: 'L-2024-003',
      fullName: 'Toshmatov Bekzod Shukurullaevich',
      licenseType: 'B',
      status: 'expired',
      issueDate: '2023-03-10',
      expiryDate: '2024-03-09',
      club: 'Lokomotiv FC'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'expired':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Faol';
      case 'expired':
        return 'Muddati o\'tgan';
      case 'pending':
        return 'Kutilmoqda';
      default:
        return status;
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F6F9]">
      <Header />
      <Sidebar />
      
      <main className="ml-64 pt-16">
        <div className="p-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-3xl font-bold text-[#0D3B6E]">
              Litsenziyalar
            </h1>
            <p className="text-gray-600 mt-1">
              Barcha faol litsenziyalarni ko'rish va boshqarish
            </p>
          </motion.div>

          {/* Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-6 bg-white rounded-xl shadow-lg p-6"
          >
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Litsenziya raqami yoki F.I.O. bo'yicha izlash..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Barchasi</option>
                  <option value="active">Faol</option>
                  <option value="expired">Muddati o'tgan</option>
                  <option value="pending">Kutilmoqda</option>
                </select>
              </div>
            </div>
          </motion.div>

          {/* Licenses Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {mockLicenses.map((license, index) => (
              <motion.div
                key={license.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
              >
                <Card className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{license.licenseNumber}</CardTitle>
                      <Badge className={getStatusColor(license.status)}>
                        {getStatusText(license.status)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-gray-600">F.I.O.</p>
                        <p className="font-medium">{license.fullName}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Litsenziya turi</p>
                        <p className="font-medium">{license.licenseType}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Klub</p>
                        <p className="font-medium">{license.club}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600">Berilgan</p>
                          <p className="font-medium">{license.issueDate}</p>
                        </div>
                        <div>
                          <p className="text-gray-600">Tugash</p>
                          <p className="font-medium">{license.expiryDate}</p>
                        </div>
                      </div>
                      <div className="flex gap-2 pt-3">
                        <Button variant="outline" size="sm" className="flex-1">
                          <Eye className="w-4 h-4 mr-2" />
                          Ko'rish
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1">
                          <Download className="w-4 h-4 mr-2" />
                          Yuklab olish
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </main>
    </div>
  );
}
