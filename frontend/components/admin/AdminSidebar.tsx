'use client';

import { useEffect, useState, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FileText,
  Award,
  Users,
  BarChart3,
  Settings,
  Shield,
  ChevronRight,
  X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useI18n } from '@/lib/i18n/I18nProvider';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('adminAccessToken') || localStorage.getItem('accessToken');
}

interface SidebarStats {
  today_apps: number;
  pending: number;
  active_licenses: number;
}

interface AdminSidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export function AdminSidebar({ activeTab, setActiveTab }: AdminSidebarProps) {
  const pathname = usePathname();
  const { t, locale } = useI18n();
  const [stats, setStats] = useState<SidebarStats | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Mobile drawer toggle from header hamburger
  useEffect(() => {
    const onToggle = () => setMobileOpen((v) => !v);
    const onClose = () => setMobileOpen(false);
    window.addEventListener('toggle-sidebar', onToggle as EventListener);
    window.addEventListener('close-sidebar', onClose as EventListener);
    return () => {
      window.removeEventListener('toggle-sidebar', onToggle as EventListener);
      window.removeEventListener('close-sidebar', onClose as EventListener);
    };
  }, []);

  // Close drawer on route change
  useEffect(() => { setMobileOpen(false); }, [pathname]);

  const fetchStats = useCallback(async () => {
    try {
      const token = getToken();
      const res = await fetch('/api/reports/dashboard/', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) return;
      const json = await res.json();
      setStats({
        today_apps: json?.periods?.today?.applications ?? 0,
        pending: (json?.overview?.pending_applications ?? 0) + (json?.overview?.under_review ?? 0),
        active_licenses: json?.overview?.active_licenses ?? 0,
      });
    } catch {
      // silent fail — sidebar shouldn't crash
    }
  }, []);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 60_000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  const numLocale = locale === 'ru' ? 'ru-RU' : 'uz-UZ';
  const fmt = (n: number | undefined) => (n ?? 0).toLocaleString(numLocale);

  const menuItems = [
    { icon: LayoutDashboard, label: t('admin.overview'), id: 'overview' },
    { icon: FileText, label: t('admin.applications'), id: 'applications' },
    { icon: Award, label: t('admin.licenses'), id: 'licenses' },
    { icon: Users, label: t('admin.users'), id: 'users' },
    { icon: BarChart3, label: t('admin.reports'), id: 'reports' },
    { icon: Settings, label: t('admin.settings'), id: 'settings' },
  ];

  const handleNavClick = (id: string) => {
    setActiveTab(id);
    setMobileOpen(false);
  };

  const sidebarBody = (
    <>
      {/* Admin Badge */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-[#1B5E20]/10 to-[#43A047]/10 rounded-lg flex-1">
          <Shield className="w-5 h-5 text-[#2E7D32]" />
          <span className="text-sm font-semibold text-[#2E7D32]">{t('admin.panel')}</span>
        </div>
        <button
          onClick={() => setMobileOpen(false)}
          className="lg:hidden ml-2 p-1.5 rounded-lg hover:bg-gray-100"
          aria-label="Close menu"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>
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
              transition={{ delay: index * 0.05 }}
            >
              <button
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  isActive
                    ? 'bg-[#2E7D32]/10 text-[#2E7D32] font-medium'
                    : 'text-gray-600 hover:bg-[#2E7D32]/5 hover:text-[#2E7D32]'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
                {isActive && <ChevronRight className="w-4 h-4 ml-auto" />}
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
              <span className="font-bold">
                {stats ? fmt(stats.today_apps) : <span className="opacity-50">…</span>}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="opacity-80">{t('admin.pending')}:</span>
              <span className="font-bold">
                {stats ? fmt(stats.pending) : <span className="opacity-50">…</span>}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="opacity-80">{t('admin.active_licenses')}:</span>
              <span className="font-bold">
                {stats ? fmt(stats.active_licenses) : <span className="opacity-50">…</span>}
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:block fixed left-0 top-16 bottom-0 w-64 bg-white border-r border-gray-200 overflow-y-auto">
        {sidebarBody}
      </aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="lg:hidden fixed inset-0 bg-black/40 z-40"
            />
            <motion.aside
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: 'tween', duration: 0.2 }}
              className="lg:hidden fixed left-0 top-0 bottom-0 w-64 bg-white border-r border-gray-200 overflow-y-auto z-50"
            >
              {sidebarBody}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

export default AdminSidebar;
