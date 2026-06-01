'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  FileText,
  Award,
  User,
  Settings,
  ChevronRight,
  X,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useI18n } from '@/lib/i18n/I18nProvider';

export function Sidebar() {
  const pathname = usePathname();
  const { t } = useI18n();
  const [mobileOpen, setMobileOpen] = useState(false);

  const menuItems = [
    { icon: LayoutDashboard, label: t('nav.dashboard'), href: '/dashboard' },
    { icon: FileText, label: t('nav.applications'), href: '/applications' },
    { icon: Award, label: t('nav.licenses'), href: '/licenses' },
    { icon: User, label: t('nav.profile'), href: '/profile' },
    { icon: Settings, label: t('nav.settings'), href: '/settings' },
  ];

  // Listen for hamburger toggles from Header (mobile)
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

  const navContent = (onItemClick?: () => void) => (
    <>
      <nav className="p-4 space-y-2">
        {menuItems.map((item, index) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          return (
            <motion.div
              key={item.href}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Link
                href={item.href}
                onClick={onItemClick}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  isActive
                    ? 'bg-[#2E7D32]/10 text-[#2E7D32] font-medium'
                    : 'text-gray-600 hover:bg-[#2E7D32]/5 hover:text-[#2E7D32]'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
                {isActive && <ChevronRight className="w-4 h-4 ml-auto" />}
              </Link>
            </motion.div>
          );
        })}
      </nav>

      <div className="p-4 mt-4">
        <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
          <Link
            href="/apply"
            onClick={onItemClick}
            className="group relative flex items-center justify-center gap-2 w-full py-3 overflow-hidden rounded-xl font-semibold text-white shadow-lg hover:shadow-xl transition-shadow bg-gradient-to-r from-[#1B5E20] via-[#2E7D32] to-[#43A047]"
          >
            {/* Maydon chiziqlari (football pitch stripes) */}
            <span className="pointer-events-none absolute inset-0 bg-[repeating-linear-gradient(90deg,rgba(255,255,255,0.08)_0px,rgba(255,255,255,0.08)_14px,transparent_14px,transparent_28px)]" />
            {/* Markaziy oq chiziq */}
            <span className="pointer-events-none absolute top-0 bottom-0 left-1/2 w-px -translate-x-1/2 bg-white/15" />

            {/* Futbol to'pi */}
            <span aria-hidden="true" className="relative z-10 text-lg leading-none">
              ⚽
            </span>
            <span className="relative z-10">{t('nav.apply')}</span>
          </Link>
        </motion.div>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop sidebar — always visible from lg breakpoint */}
      <aside className="hidden lg:block fixed left-0 top-16 bottom-0 w-64 bg-white border-r border-gray-200 overflow-y-auto">
        {navContent()}
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
              className="lg:hidden fixed left-0 top-0 bottom-0 w-64 bg-white border-r border-gray-200 overflow-y-auto z-50 pt-4"
            >
              <div className="flex items-center justify-between px-4 mb-2">
                <span className="font-semibold text-[#0D3B6E]">{t('nav.portal')}</span>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-gray-100"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              {navContent(() => setMobileOpen(false))}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

export default Sidebar;
