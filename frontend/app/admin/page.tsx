'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Header } from '@/components/layout/Header';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminStatsOverview } from '@/components/admin/AdminStatsOverview';
import { ApplicationsTableNew } from '@/components/admin/ApplicationsTableNew';
import { RecentActivity } from '@/components/admin/RecentActivity';
import { QuickActions } from '@/components/admin/QuickActions';
import SettingsPanel from '@/components/admin/SettingsPanel';
import { 
  Search, Filter, Plus, Download, Eye, Edit, Trash2, MoreVertical,
  CheckCircle, XCircle, Clock, FileText, Award, Users, BarChart3,
  Settings, Mail, Phone, MapPin, Calendar, TrendingUp, TrendingDown,
  Activity, Database, Lock, Bell, Globe, Save, ChevronDown, ChevronUp,
  Shield, Zap, Printer, Share2, ArrowUpRight, ArrowDownRight,
  CreditCard, Building2, Briefcase, GraduationCap, FileCheck,
  AlertCircle, Info, X, ChevronLeft, ChevronRight, RefreshCw,
  Loader2
} from 'lucide-react';
import { useRouter } from 'next/navigation';

// ============ LICENSES MANAGEMENT PANEL ============
function LicensesPanel() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [selectedLicenses, setSelectedLicenses] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [showAddModal, setShowAddModal] = useState(false);
  const itemsPerPage = 10;

  const licenses = [
    { id: 'L-2024-001', holder: 'Jasur Karimov', type: 'PRO', category: 'A', status: 'active', issueDate: '2024-01-15', expiryDate: '2027-01-15', region: 'Toshkent', phone: '+998 90 123 45 67', email: 'jasur@example.com' },
    { id: 'L-2024-002', holder: 'Sardor Mamatov', type: 'A', category: 'B', status: 'active', issueDate: '2024-02-20', expiryDate: '2027-02-20', region: 'Samarqand', phone: '+998 90 234 56 78', email: 'sardor@example.com' },
    { id: 'L-2023-045', holder: 'Bobur Tursunov', type: 'B', category: 'C', status: 'expired', issueDate: '2021-03-10', expiryDate: '2024-03-10', region: 'Toshkent', phone: '+998 90 345 67 89', email: 'bobur@example.com' },
    { id: 'L-2024-003', holder: 'Aziz Akmalov', type: 'GK', category: 'Level 1', status: 'active', issueDate: '2024-05-15', expiryDate: '2027-05-15', region: 'Andijon', phone: '+998 90 456 78 90', email: 'aziz@example.com' },
    { id: 'L-2024-004', holder: 'Dilshod Rahimov', type: 'C', category: 'D', status: 'suspended', issueDate: '2023-08-20', expiryDate: '2026-08-20', region: 'Farg\'ona', phone: '+998 90 567 89 01', email: 'dilshod@example.com' },
    { id: 'L-2024-005', holder: 'Mirzo Ulug\'bek', type: 'PRO', category: 'A', status: 'active', issueDate: '2024-06-01', expiryDate: '2027-06-01', region: 'Namangan', phone: '+998 90 678 90 12', email: 'mirzo@example.com' },
  ];

  const statusConfig = {
    active: { label: 'Faol', color: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle },
    expired: { label: 'Muddati o\'tgan', color: 'bg-red-100 text-red-800 border-red-200', icon: XCircle },
    suspended: { label: 'To\'xtatilgan', color: 'bg-yellow-100 text-yellow-800 border-yellow-200', icon: Clock },
    pending: { label: 'Kutilmoqda', color: 'bg-blue-100 text-blue-800 border-blue-200', icon: Clock },
  };

  const typeConfig = {
    PRO: { label: 'Professional', color: 'bg-purple-100 text-purple-800' },
    A: { label: 'A toifali', color: 'bg-blue-100 text-blue-800' },
    B: { label: 'B toifali', color: 'bg-cyan-100 text-cyan-800' },
    C: { label: 'C toifali', color: 'bg-orange-100 text-orange-800' },
    GK: { label: 'Darvozabon', color: 'bg-pink-100 text-pink-800' },
  };

  const filteredLicenses = licenses.filter(license => {
    const matchesSearch = license.holder.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         license.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         license.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || license.status === filterStatus;
    const matchesType = filterType === 'all' || license.type === filterType;
    return matchesSearch && matchesStatus && matchesType;
  });

  const totalPages = Math.ceil(filteredLicenses.length / itemsPerPage);
  const paginatedLicenses = filteredLicenses.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const toggleSelectAll = () => {
    if (selectedLicenses.length === paginatedLicenses.length) {
      setSelectedLicenses([]);
    } else {
      setSelectedLicenses(paginatedLicenses.map(l => l.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedLicenses(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const stats = [
    { label: 'Jami litsenziyalar', value: '1,247', change: '+12%', trend: 'up', icon: Award },
    { label: 'Faol litsenziyalar', value: '1,156', change: '+8%', trend: 'up', icon: CheckCircle },
    { label: 'Muddati o\'tgan', value: '45', change: '-5%', trend: 'down', icon: XCircle },
    { label: 'To\'xtatilgan', value: '46', change: '+2%', trend: 'up', icon: Clock },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Litsenziyalar boshqaruvi</h1>
          <p className="text-gray-500 mt-1">Barcha murabbiylar litsenziyalarini boshqarish</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#1A56A0] text-white rounded-xl hover:bg-[#0D3B6E] transition-all shadow-lg shadow-blue-500/25"
          >
            <Plus className="w-5 h-5" />
            Yangi litsenziya
          </button>
          <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-all">
            <Download className="w-5 h-5" />
            Export
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          const TrendIcon = stat.trend === 'up' ? TrendingUp : TrendingDown;
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
                  <Icon className="w-5 h-5 text-[#1A56A0]" />
                </div>
                <div className={`flex items-center gap-1 text-sm font-medium ${stat.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                  <TrendIcon className="w-4 h-4" />
                  {stat.change}
                </div>
              </div>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-sm text-gray-500">{stat.label}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Qidirish (ID, F.I.O, email, telefon)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A56A0] focus:border-transparent"
            />
          </div>
          <div className="flex gap-3">
            <select 
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A56A0] bg-white"
            >
              <option value="all">Barcha holatlar</option>
              <option value="active">Faol</option>
              <option value="expired">Muddati o'tgan</option>
              <option value="suspended">To'xtatilgan</option>
              <option value="pending">Kutilmoqda</option>
            </select>
            <select 
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A56A0] bg-white"
            >
              <option value="all">Barcha turlar</option>
              <option value="PRO">Professional</option>
              <option value="A">A toifali</option>
              <option value="B">B toifali</option>
              <option value="C">C toifali</option>
              <option value="GK">Darvozabon</option>
            </select>
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button 
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-[#1A56A0]' : 'text-gray-500'}`}
              >
                <FileText className="w-5 h-5" />
              </button>
              <button 
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-[#1A56A0]' : 'text-gray-500'}`}
              >
                <Award className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedLicenses.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between"
        >
          <p className="text-blue-900 font-medium">{selectedLicenses.length} ta litsenziya tanlandi</p>
          <div className="flex gap-2">
            <button className="px-4 py-2 bg-white text-blue-700 rounded-lg hover:bg-blue-100 transition-all text-sm font-medium">
              Yangilash
            </button>
            <button className="px-4 py-2 bg-white text-red-700 rounded-lg hover:bg-red-50 transition-all text-sm font-medium">
              To'xtatish
            </button>
            <button 
              onClick={() => setSelectedLicenses([])}
              className="p-2 text-blue-700 hover:bg-blue-100 rounded-lg transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </motion.div>
      )}

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-4 py-4 text-left">
                  <input 
                    type="checkbox" 
                    checked={selectedLicenses.length === paginatedLicenses.length && paginatedLicenses.length > 0}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 rounded border-gray-300 text-[#1A56A0] focus:ring-[#1A56A0]"
                  />
                </th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Litsenziya</th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Egasi</th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Turi</th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Holat</th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Berilgan</th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Muddati</th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {paginatedLicenses.map((license, index) => {
                const status = statusConfig[license.status as keyof typeof statusConfig];
                const type = typeConfig[license.type as keyof typeof typeConfig] || { label: license.type, color: 'bg-gray-100 text-gray-800' };
                const StatusIcon = status.icon;
                const isSelected = selectedLicenses.includes(license.id);
                return (
                  <motion.tr 
                    key={license.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className={`hover:bg-gray-50 transition-colors ${isSelected ? 'bg-blue-50/50' : ''}`}
                  >
                    <td className="px-4 py-4">
                      <input 
                        type="checkbox" 
                        checked={isSelected}
                        onChange={() => toggleSelect(license.id)}
                        className="w-4 h-4 rounded border-gray-300 text-[#1A56A0] focus:ring-[#1A56A0]"
                      />
                    </td>
                    <td className="px-4 py-4">
                      <div className="font-semibold text-gray-900">{license.id}</div>
                      <div className="text-sm text-gray-500">{license.region}</div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-[#1A56A0] to-[#0D3B6E] rounded-full flex items-center justify-center text-white font-bold text-sm">
                          {license.holder.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{license.holder}</div>
                          <div className="text-sm text-gray-500">{license.phone}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${type.color}`}>
                        {type.label}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${status.color}`}>
                        <StatusIcon className="w-3.5 h-3.5" />
                        {status.label}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-600">{license.issueDate}</td>
                    <td className="px-4 py-4">
                      <div className={`text-sm font-medium ${license.status === 'expired' ? 'text-red-600' : 'text-gray-600'}`}>
                        {license.expiryDate}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-1">
                        <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all" title="Ko'rish">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-all" title="Tahrirlash">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all" title="O'chirish">
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg transition-all" title="Boshqa">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-4 py-4 border-t border-gray-100 flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredLicenses.length)} of {filteredLicenses.length} results
          </p>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`w-9 h-9 rounded-lg text-sm font-medium transition-all ${
                  currentPage === page 
                    ? 'bg-[#1A56A0] text-white' 
                    : 'hover:bg-gray-100 text-gray-600'
                }`}
              >
                {page}
              </button>
            ))}
            <button 
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============ USERS MANAGEMENT PANEL ============
function UsersPanel() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showAddModal, setShowAddModal] = useState(false);

  const users = [
    { id: 1, name: 'Jasur Karimov', email: 'jasur@example.com', phone: '+998 90 123 45 67', role: 'Coach', region: 'Toshkent', status: 'active', lastActive: '2 daqiqa oldin', applications: 3, licenses: 2 },
    { id: 2, name: 'Sardor Mamatov', email: 'sardor@example.com', phone: '+998 90 234 56 78', role: 'Coach', region: 'Samarqand', status: 'active', lastActive: '15 daqiqa oldin', applications: 1, licenses: 1 },
    { id: 3, name: 'Bobur Tursunov', email: 'bobur@example.com', phone: '+998 90 345 67 89', role: 'Admin', region: 'Toshkent', status: 'active', lastActive: '1 soat oldin', applications: 0, licenses: 0 },
    { id: 4, name: 'Aziz Akmalov', email: 'aziz@example.com', phone: '+998 90 456 78 90', role: 'Coach', region: 'Andijon', status: 'inactive', lastActive: '3 kun oldin', applications: 5, licenses: 2 },
    { id: 5, name: 'Dilshod Rahimov', email: 'dilshod@example.com', phone: '+998 90 567 89 01', role: 'Coach', region: 'Farg\'ona', status: 'active', lastActive: '5 soat oldin', applications: 2, licenses: 1 },
    { id: 6, name: 'Mirzo Ulug\'bek', email: 'mirzo@example.com', phone: '+998 90 678 90 12', role: 'Manager', region: 'Namangan', status: 'active', lastActive: '30 daqiqa oldin', applications: 0, licenses: 0 },
  ];

  const roleConfig = {
    Coach: { label: 'Murabbiy', color: 'bg-blue-100 text-blue-800', icon: Award },
    Admin: { label: 'Admin', color: 'bg-purple-100 text-purple-800', icon: Shield },
    Manager: { label: 'Menejer', color: 'bg-green-100 text-green-800', icon: Briefcase },
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.phone.includes(searchQuery);
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    const matchesStatus = filterStatus === 'all' || user.status === filterStatus;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const stats = [
    { label: 'Jami foydalanuvchilar', value: '2,847', change: '+5%', icon: Users },
    { label: 'Murabbiylar', value: '2,456', change: '+8%', icon: Award },
    { label: 'Adminlar', value: '12', change: '0%', icon: Shield },
    { label: 'Faol hozir', value: '234', change: '+12%', icon: Activity },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Foydalanuvchilar boshqaruvi</h1>
          <p className="text-gray-500 mt-1">Tizim foydalanuvchilarini boshqarish</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#1A56A0] text-white rounded-xl hover:bg-[#0D3B6E] transition-all shadow-lg shadow-blue-500/25"
          >
            <Plus className="w-5 h-5" />
            Foydalanuvchi qo'shish
          </button>
          <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-all">
            <Download className="w-5 h-5" />
            Export
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                  <Icon className="w-5 h-5 text-[#1A56A0]" />
                </div>
                <span className="text-sm font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">{stat.change}</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-sm text-gray-500">{stat.label}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Qidirish (F.I.O, email, telefon)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A56A0] focus:border-transparent"
            />
          </div>
          <div className="flex gap-3">
            <select 
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A56A0] bg-white"
            >
              <option value="all">Barcha rollar</option>
              <option value="Coach">Murabbiy</option>
              <option value="Admin">Admin</option>
              <option value="Manager">Menejer</option>
            </select>
            <select 
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A56A0] bg-white"
            >
              <option value="all">Barcha holatlar</option>
              <option value="active">Faol</option>
              <option value="inactive">Faol emas</option>
            </select>
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button 
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-[#1A56A0]' : 'text-gray-500'}`}
              >
                <Award className="w-5 h-5" />
              </button>
              <button 
                onClick={() => setViewMode('list')}
                className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-[#1A56A0]' : 'text-gray-500'}`}
              >
                <FileText className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Users Grid */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredUsers.map((user, index) => {
            const role = roleConfig[user.role as keyof typeof roleConfig] || { label: user.role, color: 'bg-gray-100 text-gray-800', icon: Users };
            const RoleIcon = role.icon;
            return (
              <motion.div
                key={user.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all group"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 bg-gradient-to-br from-[#1A56A0] to-[#0D3B6E] rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-blue-500/25">
                      {user.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{user.name}</h3>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                    {user.status === 'active' ? 'Faol' : 'Faol emas'}
                  </span>
                </div>

                <div className="flex items-center gap-2 mb-4">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium ${role.color}`}>
                    <RoleIcon className="w-3.5 h-3.5" />
                    {role.label}
                  </span>
                  <span className="text-xs text-gray-500 flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {user.region}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500">Arizalar</p>
                    <p className="text-lg font-semibold text-gray-900">{user.applications}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500">Litsenziyalar</p>
                    <p className="text-lg font-semibold text-gray-900">{user.licenses}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <Clock className="w-3.5 h-3.5" />
                    {user.lastActive}
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all">
                      <Eye className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-all">
                      <Edit className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Foydalanuvchi</th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Rol</th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Hudud</th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Holat</th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-500 uppercase">So'ngi faoliyat</th>
                <th className="px-4 py-4 text-left text-xs font-semibold text-gray-500 uppercase">Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredUsers.map((user) => {
                const role = roleConfig[user.role as keyof typeof roleConfig] || { label: user.role, color: 'bg-gray-100 text-gray-800', icon: Users };
                const RoleIcon = role.icon;
                return (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-[#1A56A0] to-[#0D3B6E] rounded-lg flex items-center justify-center text-white font-bold text-sm">
                          {user.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{user.name}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${role.color}`}>
                        <RoleIcon className="w-3.5 h-3.5" />
                        {role.label}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-600">{user.region}</td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                        {user.status === 'active' ? 'Faol' : 'Faol emas'}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-sm text-gray-500">{user.lastActive}</td>
                    <td className="px-4 py-4">
                      <div className="flex gap-1">
                        <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-all">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-all">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-all">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ============ REPORTS PANEL ============
function ReportsPanel() {
  const [dateRange, setDateRange] = useState('last30');
  const [reportType, setReportType] = useState('all');

  const reports = [
    { id: 1, title: 'Oylik hisobot - Yanvar 2026', type: 'monthly', date: '2026-01-31', size: '2.4 MB', downloads: 45, author: 'Admin' },
    { id: 2, title: 'Yillik hisobot 2025', type: 'annual', date: '2025-12-31', size: '5.1 MB', downloads: 128, author: 'Admin' },
    { id: 3, title: 'Litsenziyalar statistikasi Q4', type: 'statistics', date: '2026-01-15', size: '1.2 MB', downloads: 67, author: 'System' },
    { id: 4, title: 'Oylik hisobot - Dekabr 2025', type: 'monthly', date: '2025-12-31', size: '2.3 MB', downloads: 89, author: 'Admin' },
    { id: 5, title: 'Arizalar tahlili 2025', type: 'analytics', date: '2026-01-10', size: '3.5 MB', downloads: 34, author: 'Manager' },
    { id: 6, title: 'Hududlar bo\'yicha hisobot', type: 'regional', date: '2026-01-05', size: '1.8 MB', downloads: 56, author: 'System' },
  ];

  const reportTypes = {
    monthly: { label: 'Oylik', color: 'bg-blue-100 text-blue-800', icon: Calendar },
    annual: { label: 'Yillik', color: 'bg-purple-100 text-purple-800', icon: FileText },
    statistics: { label: 'Statistika', color: 'bg-green-100 text-green-800', icon: BarChart3 },
    analytics: { label: 'Tahlil', color: 'bg-orange-100 text-orange-800', icon: Activity },
    regional: { label: 'Hududiy', color: 'bg-pink-100 text-pink-800', icon: MapPin },
  };

  const quickStats = [
    { label: 'Jami hisobotlar', value: '156', icon: FileText, color: 'blue' },
    { label: 'Yuklanishlar', value: '12.5K', icon: Download, color: 'green' },
    { label: 'Bugun yaratilgan', value: '3', icon: Plus, color: 'purple' },
    { label: 'Oylik hisobotlar', value: '24', icon: Calendar, color: 'orange' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Hisobotlar</h1>
          <p className="text-gray-500 mt-1">Tizim hisobotlari va statistikalar</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2.5 bg-[#1A56A0] text-white rounded-xl hover:bg-[#0D3B6E] transition-all shadow-lg shadow-blue-500/25">
            <Plus className="w-5 h-5" />
            Yangi hisobot
          </button>
          <button className="flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-all">
            <Printer className="w-5 h-5" />
            Chop etish
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {quickStats.map((stat, index) => {
          const Icon = stat.icon;
          const colors: Record<string, string> = {
            blue: 'from-blue-500 to-blue-600',
            green: 'from-green-500 to-green-600',
            purple: 'from-purple-500 to-purple-600',
            orange: 'from-orange-500 to-orange-600',
          };
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className={`bg-gradient-to-br ${colors[stat.color]} rounded-xl p-5 text-white`}
            >
              <Icon className="w-8 h-8 mb-3 opacity-80" />
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-sm opacity-80">{stat.label}</p>
            </motion.div>
          );
        })}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Oylik aktivlik</h3>
            <select className="text-sm border border-gray-200 rounded-lg px-3 py-1.5">
              <option>So'ngi 6 oy</option>
              <option>So'ngi yil</option>
            </select>
          </div>
          <div className="h-64 flex items-end justify-between gap-2">
            {[65, 45, 80, 55, 90, 70, 85, 60, 75, 95, 50, 88].map((height, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <div 
                  className="w-full bg-gradient-to-t from-[#1A56A0] to-[#3B82F6] rounded-t-lg transition-all hover:opacity-80"
                  style={{ height: `${height * 2}px` }}
                />
                <span className="text-xs text-gray-500">{['Yan', 'Fev', 'Mar', 'Apr', 'May', 'Iyn', 'Iyl', 'Avg', 'Sen', 'Okt', 'Noy', 'Dek'][i]}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Litsenziyalar taqsimoti</h3>
            <button className="text-sm text-[#1A56A0] hover:underline">Batafsil</button>
          </div>
          <div className="space-y-4">
            {[
              { label: 'Professional (PRO)', value: 35, color: 'bg-purple-500' },
              { label: 'A toifali', value: 28, color: 'bg-blue-500' },
              { label: 'B toifali', value: 22, color: 'bg-cyan-500' },
              { label: 'C toifali', value: 10, color: 'bg-orange-500' },
              { label: 'Darvozabon', value: 5, color: 'bg-pink-500' },
            ].map((item) => (
              <div key={item.label}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-700">{item.label}</span>
                  <span className="font-medium text-gray-900">{item.value}%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${item.color} rounded-full transition-all duration-1000`}
                    style={{ width: `${item.value}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-4">
          <select 
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A56A0] bg-white"
          >
            <option value="last7">So'ngi 7 kun</option>
            <option value="last30">So'ngi 30 kun</option>
            <option value="last90">So'ngi 3 oy</option>
            <option value="last365">So'ngi yil</option>
          </select>
          <select 
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
            className="px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A56A0] bg-white"
          >
            <option value="all">Barcha turlar</option>
            <option value="monthly">Oylik</option>
            <option value="annual">Yillik</option>
            <option value="statistics">Statistika</option>
            <option value="analytics">Tahlil</option>
          </select>
        </div>
      </div>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reports.map((report, index) => {
          const type = reportTypes[report.type as keyof typeof reportTypes] || { label: report.type, color: 'bg-gray-100 text-gray-800', icon: FileText };
          const TypeIcon = type.icon;
          return (
            <motion.div
              key={report.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm hover:shadow-lg transition-all group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-[#1A56A0]/10 to-[#0D3B6E]/10 rounded-xl flex items-center justify-center">
                  <TypeIcon className="w-6 h-6 text-[#1A56A0]" />
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${type.color}`}>
                  {type.label}
                </span>
              </div>
              
              <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-[#1A56A0] transition-colors">{report.title}</h3>
              
              <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  {report.date}
                </span>
                <span>{report.size}</span>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Download className="w-3.5 h-3.5" />
                    {report.downloads}
                  </span>
                  <span>{report.author}</span>
                </div>
                <div className="flex gap-2">
                  <button className="p-2 text-[#1A56A0] hover:bg-blue-50 rounded-lg transition-all" title="Ko'rish">
                    <Eye className="w-4 h-4" />
                  </button>
                  <button className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-all" title="Yuklash">
                    <Download className="w-4 h-4" />
                  </button>
                  <button className="p-2 text-gray-400 hover:bg-gray-100 rounded-lg transition-all" title="Ulashish">
                    <Share2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}


// ============ MAIN ADMIN PAGE ============
export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  // Auth tekshiruvi
  useEffect(() => {
    const checkAuth = () => {
      const token = localStorage.getItem('adminAccessToken');
      if (!token) {
        router.push('/admin/login');
      } else {
        setIsAuthenticated(true);
      }
      setIsLoading(false);
    };
    checkAuth();
  }, [router]);

  // Loading holatida
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F4F6F9] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-[#1A56A0] animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  // Auth bo'lmasa hech narsa ko'rsatma
  if (!isAuthenticated) return null;

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
              Admin Panel
            </h1>
            <p className="text-gray-600 mt-1">
              O'zbekiston Futbol Federatsiyasi - Boshqaruv tizimi
            </p>
          </motion.div>

          {activeTab === 'overview' && (
            <div className="space-y-8">
              <AdminStatsOverview />
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <ApplicationsTableNew />
                </div>
                <div className="space-y-6">
                  <QuickActions />
                  <RecentActivity />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'applications' && (
            <div>
              <ApplicationsTableNew showAll={true} />
            </div>
          )}

          {activeTab === 'licenses' && <LicensesPanel />}
          {activeTab === 'users' && <UsersPanel />}
          {activeTab === 'reports' && <ReportsPanel />}
          {activeTab === 'settings' && <SettingsPanel />}
        </div>
      </main>
    </div>
  );
}
