'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Header } from '@/components/layout/Header';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminStatsOverview } from '@/components/admin/AdminStatsOverview';
import { ApplicationsTableNew } from '@/components/admin/ApplicationsTableNew';
import { RecentActivity } from '@/components/admin/RecentActivity';
import { QuickActions } from '@/components/admin/QuickActions';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState('overview');

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

          {activeTab === 'licenses' && (
            <div>
              <h2 className="text-2xl font-bold text-[#0D3B6E] mb-6">
                Litsenziyalar boshqaruvi
              </h2>
              <div className="bg-white rounded-xl shadow-lg p-6">
                <p className="text-gray-500">Litsenziyalar boshqaruvi tez kunda...</p>
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div>
              <h2 className="text-2xl font-bold text-[#0D3B6E] mb-6">
                Foydalanuvchilar boshqaruvi
              </h2>
              <div className="bg-white rounded-xl shadow-lg p-6">
                <p className="text-gray-500">Foydalanuvchilar boshqaruvi tez kunda...</p>
              </div>
            </div>
          )}

          {activeTab === 'reports' && (
            <div>
              <h2 className="text-2xl font-bold text-[#0D3B6E] mb-6">
                Hisobotlar
              </h2>
              <div className="bg-white rounded-xl shadow-lg p-6">
                <p className="text-gray-500">Hisobotlar tez kunda...</p>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div>
              <h2 className="text-2xl font-bold text-[#0D3B6E] mb-6">
                Sozlamalar
              </h2>
              <div className="bg-white rounded-xl shadow-lg p-6">
                <p className="text-gray-500">Sozlamalar tez kunda...</p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
