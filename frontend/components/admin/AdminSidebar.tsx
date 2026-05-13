'use client';

import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  FileText, 
  Award, 
  Users, 
  BarChart3, 
  Settings,
  Shield,
  ChevronRight
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useI18n } from '@/lib/i18n/I18nProvider';

interface AdminSidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export function AdminSidebar({ activeTab, setActiveTab }: AdminSidebarProps) {
  const pathname = usePathname();
  const { t } = useI18n();

  const menuItems = [
    { icon: LayoutDashboard, label: t('admin.overview'), id: 'overview' },
    { icon: FileText, label: t('admin.applications'), id: 'applications' },
    { icon: Award, label: t('admin.licenses'), id: 'licenses' },
    { icon: Users, label: t('admin.users'), id: 'users' },
    { icon: BarChart3, label: t('admin.reports'), id: 'reports' },
    { icon: Settings, label: t('admin.settings'), id: 'settings' },
  ];

  return (
    <aside className="fixed left-0 top-16 bottom-0 w-64 bg-white border-r border-gray-200 overflow-y-auto">
      {/* Admin Badge */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-[#F39C12]/10 to-[#E67E22]/10 rounded-lg">
          <Shield className="w-5 h-5 text-[#F39C12]" />
          <span className="text-sm font-semibold text-[#F39C12]">{t('admin.panel')}</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="p-4 space-y-2">
        {menuItems.map((item, index) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <button
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  isActive
                    ? 'bg-[#F39C12]/10 text-[#F39C12] font-medium'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-[#1A56A0]'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
                {isActive && (
                  <ChevronRight className="w-4 h-4 ml-auto" />
                )}
              </button>
            </motion.div>
          );
        })}
      </nav>

      {/* Quick Stats */}
      <div className="p-4 mt-4 border-t border-gray-200">
        <div className="p-4 bg-gradient-to-br from-[#0D3B6E] to-[#1A56A0] rounded-xl text-white">
          <h3 className="font-semibold mb-3">{t('admin.stats_title')}</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="opacity-80">{t('admin.today_apps')}:</span>
              <span className="font-bold">12</span>
            </div>
            <div className="flex justify-between">
              <span className="opacity-80">{t('admin.pending')}:</span>
              <span className="font-bold">5</span>
            </div>
            <div className="flex justify-between">
              <span className="opacity-80">{t('admin.active_licenses')}:</span>
              <span className="font-bold">1,247</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}

export default AdminSidebar;
