'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Bell,
  User,
  LogOut,
  Globe,
  Check,
  CheckCheck,
  Settings,
  FileText,
  Award,
  ChevronDown,
  Inbox,
  Menu,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/hooks/useNotifications';
import { useI18n } from '@/lib/i18n/I18nProvider';

function roleLabel(role: string | undefined, t: (k: string) => string) {
  if (!role) return t('header.user');
  if (role === 'coach') return t('header.coach');
  // Faqat /admin/login orqali kirgan adminlarda "Admin" labeli ko'rinadi.
  // Telefon OTP orqali kirgan adminlar oddiy foydalanuvchi sifatida ko'rsatiladi.
  if (role.includes('admin')) {
    const hasAdminToken =
      typeof window !== 'undefined' && !!localStorage.getItem('adminAccessToken');
    if (hasAdminToken) return t('header.admin');
    return t('header.coach');
  }
  return t('header.user');
}

function relativeTime(iso: string, t: (k: string, vars?: any) => string): string {
  if (!iso) return '';
  const diffMs = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diffMs / 60000);
  if (m < 1) return t('common.just_now');
  if (m < 60) return t('common.minutes_ago', { n: m });
  const h = Math.floor(m / 60);
  if (h < 24) return t('common.hours_ago', { n: h });
  const d = Math.floor(h / 24);
  return t('common.days_ago', { n: d });
}

function getInitials(name?: string): string {
  if (!name) return '';
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p.charAt(0).toUpperCase()).join('');
}

export function Header() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const {
    unreadCount,
    notifications,
    fetchList,
    markRead,
    markAllRead,
  } = useNotifications({ pollInterval: 30_000 });
  const { locale, setLocale, t } = useI18n();

  const [langOpen, setLangOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);

  const langRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  // Single click-outside handler for all popovers
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const tgt = e.target as Node;
      if (langRef.current && !langRef.current.contains(tgt)) setLangOpen(false);
      if (notifRef.current && !notifRef.current.contains(tgt)) setNotifOpen(false);
      if (userRef.current && !userRef.current.contains(tgt)) setUserOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ESC closes any open popover
  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setLangOpen(false);
        setNotifOpen(false);
        setUserOpen(false);
      }
    };
    document.addEventListener('keydown', onEsc);
    return () => document.removeEventListener('keydown', onEsc);
  }, []);

  // Lazy-load notifications when dropdown opens
  const handleNotifToggle = () => {
    const next = !notifOpen;
    setNotifOpen(next);
    if (next) {
      setLangOpen(false);
      setUserOpen(false);
      fetchList();
    }
  };

  const handleUserToggle = () => {
    const next = !userOpen;
    setUserOpen(next);
    if (next) {
      setLangOpen(false);
      setNotifOpen(false);
    }
  };

  const handleLangToggle = () => {
    const next = !langOpen;
    setLangOpen(next);
    if (next) {
      setNotifOpen(false);
      setUserOpen(false);
    }
  };

  const handleNotifClick = async (id: string, isRead: boolean) => {
    if (!isRead) await markRead(id);
    setNotifOpen(false);
    router.push('/notifications');
  };

  const recentNotifications = notifications.slice(0, 6);

  // Header faqat tizimga kirgan foydalanuvchilar uchun ko'rinadi.
  // /help, /contact, /privacy, /terms kabi ochiq sahifalarda yashiriladi.
  if (isLoading || !isAuthenticated) {
    return null;
  }

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 z-50">
      <div className="flex items-center justify-between h-full px-4 lg:px-8">
        {/* Mobile hamburger */}
        <button
          onClick={() => window.dispatchEvent(new CustomEvent('toggle-sidebar'))}
          className="lg:hidden p-2 -ml-2 mr-1 rounded-lg hover:bg-gray-100"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5 text-gray-700" />
        </button>

        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="w-10 h-10 bg-white border border-gray-200 rounded-lg flex items-center justify-center p-1 transition-transform group-hover:scale-105">
            <img
              src="/Uzbekistan_Football_Association_Logo.svg"
              alt="UFA"
              className="w-full h-full object-contain"
            />
          </div>
          <span className="hidden md:block font-semibold text-[#0D3B6E]">
            {t('nav.portal')}
          </span>
        </Link>

        {/* Right side */}
        <div className="flex items-center gap-1">
          {/* Language switcher */}
          <div className="relative" ref={langRef}>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLangToggle}
              className="flex items-center gap-1.5 text-gray-600 h-9"
              aria-label="Language"
              aria-expanded={langOpen}
            >
              <Globe className="w-4 h-4" />
              <span className="text-sm font-medium uppercase">{locale}</span>
            </Button>
            <AnimatePresence>
              {langOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.12 }}
                  className="absolute right-0 top-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden min-w-[160px] z-50"
                >
                  {(['uz', 'ru'] as const).map((lng) => (
                    <button
                      key={lng}
                      onClick={() => {
                        setLocale(lng);
                        setLangOpen(false);
                      }}
                      className={`w-full px-4 py-2.5 text-sm text-left hover:bg-gray-50 transition-colors flex items-center justify-between ${
                        locale === lng ? 'bg-blue-50 text-[#1A56A0] font-medium' : 'text-gray-700'
                      }`}
                    >
                      <span>{t(`languages.${lng}`)}</span>
                      {locale === lng && <Check className="w-4 h-4" />}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Notifications */}
          <div className="relative" ref={notifRef}>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleNotifToggle}
              className="relative"
              aria-label={t('nav.notifications')}
              aria-expanded={notifOpen}
            >
              <Bell className="w-5 h-5 text-gray-600" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </Button>
            <AnimatePresence>
              {notifOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-2 w-[380px] max-w-[calc(100vw-2rem)] bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden z-50"
                >
                  {/* Header */}
                  <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {t('notifications.title')}
                      </p>
                      {unreadCount > 0 && (
                        <p className="text-xs text-gray-500 mt-0.5">
                          {unreadCount} {t('notifications.unread') || ''}
                        </p>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={() => markAllRead()}
                        className="text-xs font-medium text-[#1A56A0] hover:text-[#0D3B6E] flex items-center gap-1"
                      >
                        <CheckCheck className="w-3.5 h-3.5" />
                        {t('notifications.mark_all_read')}
                      </button>
                    )}
                  </div>

                  {/* List */}
                  <div className="max-h-[400px] overflow-y-auto">
                    {recentNotifications.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-10 px-4 text-gray-400">
                        <Inbox className="w-10 h-10 mb-2" />
                        <p className="text-sm">{t('notifications.empty')}</p>
                      </div>
                    ) : (
                      recentNotifications.map((n) => (
                        <button
                          key={n.id}
                          onClick={() => handleNotifClick(n.id, n.is_read)}
                          className={`w-full flex gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-b-0 ${
                            !n.is_read ? 'bg-blue-50/40' : ''
                          }`}
                        >
                          <div
                            className={`w-2 h-2 mt-1.5 rounded-full flex-shrink-0 ${
                              n.is_read ? 'bg-transparent' : 'bg-[#1A56A0]'
                            }`}
                          />
                          <div className="flex-1 min-w-0">
                            <p
                              className={`text-sm leading-snug ${
                                n.is_read ? 'text-gray-700' : 'font-medium text-gray-900'
                              }`}
                            >
                              {n.title}
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                              {n.message}
                            </p>
                            <p className="text-[11px] text-gray-400 mt-1">
                              {relativeTime(n.created_at, t)}
                            </p>
                          </div>
                        </button>
                      ))
                    )}
                  </div>

                  {/* Footer */}
                  <Link
                    href="/notifications"
                    onClick={() => setNotifOpen(false)}
                    className="block text-center text-sm font-medium text-[#1A56A0] hover:text-[#0D3B6E] py-3 border-t border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    {t('dashboard.view_all')}
                  </Link>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* User menu */}
          <div className="relative ml-2 pl-3 border-l border-gray-200" ref={userRef}>
            <button
              onClick={handleUserToggle}
              className="flex items-center gap-3 hover:bg-gray-50 rounded-lg px-2 py-1.5 transition-colors"
              aria-expanded={userOpen}
              aria-label="User menu"
            >
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-gray-900 leading-tight max-w-[160px] truncate">
                  {user?.full_name || t('header.user')}
                </p>
                <p className="text-xs text-gray-500 leading-tight">
                  {(user as any)?.job_title || roleLabel(user?.role, t)}
                </p>
              </div>
              <div className="w-9 h-9 bg-gradient-to-br from-[#1A56A0] to-[#0D3B6E] rounded-full flex items-center justify-center text-white text-sm font-semibold">
                {(user as any)?.avatar_url ? (
                  <img
                    src={(user as any).avatar_url}
                    alt=""
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : user?.full_name ? (
                  getInitials(user.full_name)
                ) : (
                  <User className="w-4 h-4" />
                )}
              </div>
              <ChevronDown
                className={`w-4 h-4 text-gray-400 transition-transform hidden sm:block ${
                  userOpen ? 'rotate-180' : ''
                }`}
              />
            </button>

            <AnimatePresence>
              {userOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-2 w-64 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden z-50"
                >
                  {/* User info */}
                  <div className="px-4 py-3 border-b border-gray-100 bg-gradient-to-br from-[#F8FAFC] to-white">
                    <p className="text-sm font-semibold text-gray-900 truncate">
                      {user?.full_name || t('header.user')}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5 truncate">
                      {user?.phone || roleLabel(user?.role, t)}
                    </p>
                  </div>

                  {/* Menu items */}
                  <div className="py-1">
                    <MenuItem
                      icon={User}
                      label={t('nav.profile')}
                      onClick={() => {
                        setUserOpen(false);
                        router.push('/profile');
                      }}
                    />
                    <MenuItem
                      icon={Award}
                      label={t('nav.licenses')}
                      onClick={() => {
                        setUserOpen(false);
                        router.push('/licenses');
                      }}
                    />
                    <MenuItem
                      icon={FileText}
                      label={t('nav.applications')}
                      onClick={() => {
                        setUserOpen(false);
                        router.push('/applications');
                      }}
                    />
                    <MenuItem
                      icon={Settings}
                      label={t('nav.settings')}
                      onClick={() => {
                        setUserOpen(false);
                        router.push('/settings');
                      }}
                    />
                  </div>

                  <div className="border-t border-gray-100 py-1">
                    <MenuItem
                      icon={LogOut}
                      label={t('common.logout')}
                      onClick={() => {
                        setUserOpen(false);
                        logout();
                      }}
                      danger
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </header>
  );
}

function MenuItem({
  icon: Icon,
  label,
  onClick,
  danger = false,
}: {
  icon: any;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left transition-colors ${
        danger
          ? 'text-red-600 hover:bg-red-50'
          : 'text-gray-700 hover:bg-gray-50'
      }`}
    >
      <Icon className="w-4 h-4" />
      <span>{label}</span>
    </button>
  );
}

export default Header;
