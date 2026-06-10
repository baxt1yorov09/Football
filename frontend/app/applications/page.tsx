'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { X, RefreshCw } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { SmartSidebar } from '@/components/layout/SmartSidebar';
import { ApplicationsTable } from '@/components/admin/ApplicationsTable';
import { useAuth } from '@/hooks/useAuth';
import { useI18n } from '@/lib/i18n/I18nProvider';

export default function ApplicationsPage() {
  const { t } = useI18n();
  const router = useRouter();
  const { user } = useAuth();
  const [redirecting, setRedirecting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Admin'larni admin paneliga yo'naltirish
  useEffect(() => {
    // Faqat /admin/login orqali kirgan adminlarni admin paneliga yo'naltiramiz.
    const hasAdminToken =
      typeof window !== 'undefined' && !!localStorage.getItem('adminAccessToken');
    if (hasAdminToken) {
      setRedirecting(true);
      router.replace('/admin?tab=applications');
    }
  }, [user, router]);

  // Debounce search to avoid filtering on every keystroke
  useEffect(() => {
    const tm = setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => clearTimeout(tm);
  }, [searchTerm]);

  if (redirecting) {
    return (
      <div className="min-h-screen bg-[#F4F6F9] flex items-center justify-center">
        <div className="text-center text-gray-500">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2" />
          <p className="text-sm">Admin paneliga yo'naltirilmoqda...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F6F9]">
      <Header />
      <SmartSidebar />
      
      <main className="lg:ml-64 pt-16">
        <div className="p-4 lg:p-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-3xl font-bold text-[#0D3B6E]">
              {t('applications.title')}
            </h1>
            <p className="text-gray-600 mt-1">
              {t('applications.subtitle')}
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
              <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder={t('applications.search_placeholder') || t('common.search')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 pr-9 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                    aria-label="clear"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="all">{t('common.all')}</option>
                  <option value="pending">{t('applications.status.pending')}</option>
                  <option value="under_review">{t('applications.status.under_review')}</option>
                  <option value="additional_docs">{t('applications.status.additional_docs')}</option>
                  <option value="approved">{t('applications.status.approved')}</option>
                  <option value="rejected">{t('applications.status.rejected')}</option>
                </select>
              </div>
            </div>
          </motion.div>

          {/* Applications Table */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <ApplicationsTable
              showAll={true}
              externalSearch={debouncedSearch}
              externalStatusFilter={statusFilter}
              hideFilters={true}
            />
          </motion.div>
        </div>
      </main>
    </div>
  );
}
