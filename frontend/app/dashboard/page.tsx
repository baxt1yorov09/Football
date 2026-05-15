'use client';

import { motion } from 'framer-motion';
import { Header } from '@/components/layout/Header';
import { SmartSidebar } from '@/components/layout/SmartSidebar';
import { StatsOverview } from '@/components/dashboard/StatsOverview';
import { ActiveLicenses } from '@/components/dashboard/ActiveLicenses';
import { RecentApplications } from '@/components/dashboard/RecentApplications';
import { NotificationsPanel } from '@/components/dashboard/NotificationsPanel';
import { useAuth } from '@/hooks/useAuth';
import { useI18n } from '@/lib/i18n/I18nProvider';

export default function DashboardPage() {
  const { user } = useAuth();
  const { t, locale } = useI18n();

  return (
    <div className="min-h-screen bg-[#F4F6F9]">
      <Header />
      <SmartSidebar />
      
      <main className="ml-64 pt-16">
        <div className="p-8">
          {/* Welcome Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-3xl font-bold text-[#0D3B6E]">
              {t('dashboard.welcome_back', { name: user?.full_name || t('header.coach') })} 👋
            </h1>
            <p className="text-gray-600 mt-1">
              {(() => {
                const date = new Date();
                const daysUz = ['yakshanba', 'dushanba', 'seshanba', 'chorshanba', 'payshanba', 'juma', 'shanba'];
                const monthsUz = ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr'];
                const daysRu = ['воскресенье', 'понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота'];
                const monthsRu = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
                const days = locale === 'ru' ? daysRu : daysUz;
                const months = locale === 'ru' ? monthsRu : monthsUz;
                const dayName = days[date.getDay()];
                const day = date.getDate();
                const monthName = months[date.getMonth()];
                const year = date.getFullYear();
                return locale === 'ru'
                  ? `${dayName}, ${day} ${monthName} ${year}`
                  : `${dayName}, ${day}-${monthName}, ${year}`;
              })()}
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
