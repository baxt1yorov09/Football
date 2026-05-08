'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { User, Mail, Phone, Calendar, Shield, Camera, Edit } from 'lucide-react';

export default function ProfilePage() {
  const [isEditing, setIsEditing] = useState(false);

  const mockUser = {
    fullName: 'Aliyev Karim Botirovich',
    email: 'karim.aliyev@example.com',
    phone: '+998 90 123 45 67',
    birthDate: '1990-05-15',
    licenseType: 'PRO',
    licenseNumber: 'L-2024-001',
    licenseStatus: 'active',
    club: 'Pakhtakor FC',
    issueDate: '2024-01-15',
    expiryDate: '2025-01-14'
  };

  return (
    <div className="min-h-screen bg-[#F4F6F9]">
      <Header />
      <Sidebar />
      
      <main className="ml-64 pt-16">
        <div className="p-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 flex items-center justify-between"
          >
            <div>
              <h1 className="text-3xl font-bold text-[#0D3B6E]">
                Profil
              </h1>
              <p className="text-gray-600 mt-1">
                Shaxsiy ma'lumotlaringiz va litsenziyangiz
              </p>
            </div>
            <Button
              onClick={() => setIsEditing(!isEditing)}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Edit className="w-4 h-4" />
              {isEditing ? 'Saqlash' : 'Tahrirlash'}
            </Button>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Profile Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="text-center">
                <CardHeader>
                  <div className="relative inline-block">
                    <div className="w-24 h-24 bg-gray-200 rounded-full mx-auto mb-4 flex items-center justify-center">
                      <User className="w-12 h-12 text-gray-400" />
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="absolute bottom-2 right-0 rounded-full w-8 h-8 p-0"
                    >
                      <Camera className="w-4 h-4" />
                    </Button>
                  </div>
                  <CardTitle className="text-xl">{mockUser.fullName}</CardTitle>
                  <Badge className="bg-green-100 text-green-800">
                    {mockUser.licenseStatus === 'active' ? 'Faol' : 'Faol emas'}
                  </Badge>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 text-left">
                    <div className="flex items-center gap-3">
                      <Mail className="w-4 h-4 text-gray-400" />
                      <span className="text-sm">{mockUser.email}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Phone className="w-4 h-4 text-gray-400" />
                      <span className="text-sm">{mockUser.phone}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      <span className="text-sm">{mockUser.birthDate}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Personal Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="lg:col-span-2"
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Shaxsiy ma'lumotlar
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          F.I.O.
                        </label>
                        <input
                          type="text"
                          value={mockUser.fullName}
                          disabled={!isEditing}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Email
                        </label>
                        <input
                          type="email"
                          value={mockUser.email}
                          disabled={!isEditing}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Telefon
                        </label>
                        <input
                          type="tel"
                          value={mockUser.phone}
                          disabled={!isEditing}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                        />
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Tug\'ilgan sana
                        </label>
                        <input
                          type="date"
                          value={mockUser.birthDate}
                          disabled={!isEditing}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Klub
                        </label>
                        <input
                          type="text"
                          value={mockUser.club}
                          disabled={!isEditing}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* License Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="lg:col-span-3"
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Litsenziya ma'lumotlari
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600">Litsenziya raqami</p>
                      <p className="font-semibold text-lg">{mockUser.licenseNumber}</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600">Litsenziya turi</p>
                      <p className="font-semibold text-lg">{mockUser.licenseType}</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600">Berilgan sana</p>
                      <p className="font-semibold text-lg">{mockUser.issueDate}</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600">Tugash sanasi</p>
                      <p className="font-semibold text-lg">{mockUser.expiryDate}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
}
