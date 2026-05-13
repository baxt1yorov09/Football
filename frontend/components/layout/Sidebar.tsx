'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  FileText, 
  Award, 
  PlusCircle, 
  User, 
  Settings,
  ChevronRight
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useI18n } from '@/lib/i18n/I18nProvider';

export function Sidebar() {
  const pathname = usePathname();
  const { t } = useI18n();

  const menuItems = [
    { icon: LayoutDashboard, label: t('nav.dashboard'), href: '/dashboard' },
    { icon: FileText, label: t('nav.applications'), href: '/applications' },
    { icon: Award, label: t('nav.licenses'), href: '/licenses' },
    { icon: PlusCircle, label: t('nav.apply'), href: '/apply' },
    { icon: User, label: t('nav.profile'), href: '/profile' },
    { icon: Settings, label: t('nav.settings'), href: '/settings' },
  ];

  return (
    <aside className="fixed left-0 top-16 bottom-0 w-64 bg-white border-r border-gray-200 overflow-y-auto">
      <nav className="p-4 space-y-2">
        {menuItems.map((item, index) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');

          return (
            <motion.div
              key={item.href}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Link
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
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
              </Link>
            </motion.div>
          );
        })}
      </nav>

      {/* Quick Apply Button */}
      <div className="p-4 mt-4">
        <Link
          href="/apply/D"
          className="flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-r from-[#F39C12] to-[#E67E22] text-white rounded-xl font-medium shadow-lg hover:shadow-xl transition-shadow"
        >
          <PlusCircle className="w-5 h-5" />
          {t('nav.apply')}
        </Link>
      </div>
    </aside>
  );
}

export default Sidebar;
