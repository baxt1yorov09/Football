'use client';

import { motion } from 'framer-motion';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { StatsOverview } from '@/components/dashboard/StatsOverview';
import { ActiveLicenses } from '@/components/dashboard/ActiveLicenses';
import { RecentApplications } from '@/components/dashboard/RecentApplications';
import { NotificationsPanel } from '@/components/dashboard/NotificationsPanel';
import { useAuth } from '@/hooks/useAuth';

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-[#F4F6F9]">
      <Header />
      <Sidebar />
      
      <main className="ml-64 pt-16">
        <div className="p-8">
          {/* Welcome Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-3xl font-bold text-[#0D3B6E]">
              Xush kelibsiz, {user?.full_name || 'Murabbiy'}! 👋
            </h1>
            <p className="text-gray-600 mt-1">
              {new Date().toLocaleDateString('uz-UZ', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </motion.div>

          {/* Stats Overview */}
          <StatsOverview />

          {/* Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
            {/* Active Licenses */}
            <div className="lg:col-span-2">
              <ActiveLicenses />
            </div>

            {/* Notifications */}
            <div>
              <NotificationsPanel />
            </div>
          </div>

          {/* Recent Applications */}
          <div className="mt-8">
            <RecentApplications />
          </div>
        </div>
      </main>
    </div>
  );
}
