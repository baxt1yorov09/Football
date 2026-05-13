'use client';

import Link from 'next/link';
import { Bell, User, LogOut, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/hooks/useNotifications';
import { useI18n } from '@/lib/i18n/I18nProvider';
import { useState, useRef, useEffect } from 'react';

function roleLabel(role: string | undefined, t: (k: string) => string) {
  if (!role) return t('header.user');
  if (role === 'coach') return t('header.coach');
  if (role.includes('admin')) return t('header.admin');
  return t('header.user');
}

export function Header() {
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications({ pollInterval: 30_000 });
  const { locale, setLocale, t } = useI18n();

  const [langOpen, setLangOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setLangOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 z-50">
      <div className="flex items-center justify-between h-full px-4 lg:px-8">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#F39C12] rounded-lg flex items-center justify-center">
            <span className="text-lg font-bold text-white">UFF</span>
          </div>
          <span className="hidden md:block font-semibold text-[#0D3B6E]">
            {t('nav.portal')}
          </span>
        </Link>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {/* Language switcher */}
          <div className="relative" ref={langRef}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLangOpen((v) => !v)}
              className="flex items-center gap-1.5 text-gray-600"
              aria-label="Language"
            >
              <Globe className="w-4 h-4" />
              <span className="text-sm font-medium uppercase">{locale}</span>
            </Button>
            {langOpen && (
              <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden min-w-[140px] z-50">
                {(['uz', 'ru'] as const).map((lng) => (
                  <button
                    key={lng}
                    onClick={() => {
                      setLocale(lng);
                      setLangOpen(false);
                    }}
                    className={`w-full px-4 py-2 text-sm text-left hover:bg-gray-50 transition-colors ${
                      locale === lng ? 'bg-blue-50 text-[#1A56A0] font-medium' : 'text-gray-700'
                    }`}
                  >
                    {t(`languages.${lng}`)}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Notifications */}
          <Link href="/notifications" aria-label={t('nav.notifications')}>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="w-5 h-5 text-gray-600" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </Button>
          </Link>

          {/* User menu */}
          <div className="flex items-center gap-3 pl-4 border-l border-gray-200 ml-2">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-gray-900">
                {user?.full_name || t('header.user')}
              </p>
              <p className="text-xs text-gray-500">{roleLabel(user?.role, t)}</p>
            </div>
            <div className="w-10 h-10 bg-[#1A56A0] rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-white" />
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={logout}
              className="text-gray-500 hover:text-red-500"
              aria-label={t('common.logout')}
            >
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
