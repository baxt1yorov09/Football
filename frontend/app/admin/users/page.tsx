'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Header } from '@/components/layout/Header';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, MoreVertical, User, Phone, Mail, Edit, Trash2, Eye } from 'lucide-react';

// Mock users data - replace with API call
const mockUsers = [
  { id: 1, name: 'Azizbek Karimov', phone: '+998901234567', email: 'aziz@mail.uz', role: 'coach', status: 'active', region: 'Toshkent', licenses: 2, joined: '2024-01-15' },
  { id: 2, name: 'Dilshod Rahimov', phone: '+998931112233', email: 'dilshod@mail.uz', role: 'coach', status: 'active', region: 'Samarqand', licenses: 1, joined: '2024-02-20' },
  { id: 3, name: 'Nodira Usmanova', phone: '+998997776655', email: 'nodira@mail.uz', role: 'coach', status: 'pending', region: 'Buxoro', licenses: 0, joined: '2024-03-10' },
  { id: 4, name: 'Jasur Tolipov', phone: '+998944443322', email: 'jasur@mail.uz', role: 'admin', status: 'active', region: 'Toshkent', licenses: 0, joined: '2023-12-01' },
  { id: 5, name: 'Sardor Xamidov', phone: '+998955667788', email: 'sardor@mail.uz', role: 'coach', status: 'blocked', region: 'Andijon', licenses: 0, joined: '2024-04-05' },
];

export default function AdminUsersPage() {
  const [activeTab, setActiveTab] = useState('users');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredUsers = mockUsers.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         user.phone.includes(searchQuery) ||
                         user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    const styles = {
      active: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      blocked: 'bg-red-100 text-red-800',
    };
    const labels = {
      active: 'Faol',
      pending: 'Kutilmoqda',
      blocked: 'Bloklangan',
    };
    return <Badge className={styles[status as keyof typeof styles]}>{labels[status as keyof typeof labels]}</Badge>;
  };

  const getRoleBadge = (role: string) => {
    const styles = {
      coach: 'bg-blue-100 text-blue-800',
      admin: 'bg-purple-100 text-purple-800',
    };
    const labels = {
      coach: 'Murabbiy',
      admin: 'Admin',
    };
    return <Badge variant="outline" className={styles[role as keyof typeof styles]}>{labels[role as keyof typeof labels]}</Badge>;
  };

  return (
    <div className="min-h-screen bg-[#F4F6F9]">
      <Header />
      <AdminSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="lg:ml-64 pt-16">
        <div className="p-4 lg:p-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-3xl font-bold text-[#0D3B6E]">
              Foydalanuvchilar boshqaruvi
            </h1>
            <p className="text-gray-600 mt-1">
              Barcha foydalanuvchilarni ko'rish, tahrirlash va boshqarish
            </p>
          </motion.div>

          {/* Filters */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex flex-wrap gap-4 items-center">
                <div className="flex-1 min-w-[300px] relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    placeholder="Qidirish (ism, telefon, email...)"
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
                    <option value="active">Faol</option>
                    <option value="pending">Kutilmoqda</option>
                    <option value="blocked">Bloklangan</option>
                  </select>

                  <Button variant="outline" className="flex items-center gap-2">
                    <Filter className="w-4 h-4" />
                    Filtrlar
                  </Button>
                </div>

                <Button className="bg-[#0D3B6E] hover:bg-[#1A56A0]">
                  + Yangi foydalanuvchi
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Users Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Foydalanuvchilar ro'yxati ({filteredUsers.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Foydalanuvchi</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Aloqa</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Rol</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Status</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Viloyat</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Litsenziyalar</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Qo'shilgan</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600">Amallar</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <User className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{user.name}</p>
                              <p className="text-sm text-gray-500">ID: {user.id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-sm">
                              <Phone className="w-4 h-4 text-gray-400" />
                              {user.phone}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              <Mail className="w-4 h-4 text-gray-400" />
                              {user.email}
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">{getRoleBadge(user.role)}</td>
                        <td className="py-3 px-4">{getStatusBadge(user.status)}</td>
                        <td className="py-3 px-4 text-gray-700">{user.region}</td>
                        <td className="py-3 px-4">
                          <Badge variant="outline">{user.licenses}</Badge>
                        </td>
                        <td className="py-3 px-4 text-gray-500 text-sm">{user.joined}</td>
                        <td className="py-3 px-4">
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm">
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="text-red-500">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {filteredUsers.length === 0 && (
                <div className="text-center py-12">
                  <User className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">Foydalanuvchilar topilmadi</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
