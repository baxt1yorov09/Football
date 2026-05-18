'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  Check,
  CheckCheck,
  FileCheck,
  XCircle,
  AlertTriangle,
  Trash2,
  Inbox,
  Filter,
} from 'lucide-react';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { SmartSidebar } from '@/components/layout/SmartSidebar';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNotifications, Notification } from '@/hooks/useNotifications';
import { useI18n } from '@/lib/i18n/I18nProvider';

const TYPE_ICONS: Record<string, { icon: any; color: string }> = {
  app_received: { icon: FileCheck, color: '#3498DB' },
  app_approved: { icon: Check, color: '#27AE60' },
  app_rejected: { icon: XCircle, color: '#E74C3C' },
  expiry_30: { icon: AlertTriangle, color: '#F39C12' },
  expiry_14: { icon: AlertTriangle, color: '#E67E22' },
  expiry_7: { icon: AlertTriangle, color: '#E74C3C' },
  docs_required: { icon: FileCheck, color: '#E67E22' },
  system: { icon: Bell, color: '#9B59B6' },
};

function formatRelative(iso: string, t: (k: string, vars?: any) => string): string {
  if (!iso) return '';
  const date = new Date(iso);
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return t('common.just_now');
  if (diffMin < 60) return t('common.minutes_ago', { n: diffMin });
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return t('common.hours_ago', { n: diffH });
  const diffD = Math.floor(diffH / 24);
  if (diffD < 30) return t('common.days_ago', { n: diffD });
  return date.toLocaleDateString();
}

export default function NotificationsPage() {
  const { t, locale } = useI18n();
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');

  const {
    notifications,
    unreadCount,
    totalCount,
    loading,
    error,
    markRead,
    markAllRead,
    remove,
    fetchList,
  } = useNotifications({ pollInterval: 30_000, loadList: true, filter });

  // Note: useNotifications hook auto-refetches when `filter` changes
  // because fetchList is a useCallback([filter]) dependency of its internal effect.

  const filterButtons: { key: 'all' | 'unread' | 'read'; label: string; count?: number }[] = [
    { key: 'all', label: t('notifications.filter_all'), count: totalCount },
    { key: 'unread', label: t('notifications.filter_unread'), count: unreadCount },
    { key: 'read', label: t('notifications.filter_read') },
  ];

  return (
    <div className="min-h-screen bg-[#F4F6F9]">
      <Header />
      <SmartSidebar />

      <main className="lg:ml-64 pt-16">
        <div className="p-4 lg:p-8 max-w-5xl">
          {/* Page header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 flex items-start justify-between gap-4"
          >
            <div>
              <h1 className="text-3xl font-bold text-[#0D3B6E] flex items-center gap-3">
                <Bell className="w-7 h-7" />
                {t('notifications.title')}
                {unreadCount > 0 && (
                  <Badge className="bg-[#F39C12] text-white">
                    {t('notifications.unread_count', { n: unreadCount })}
                  </Badge>
                )}
              </h1>
              <p className="text-gray-600 mt-1">{t('notifications.subtitle')}</p>
            </div>

            {unreadCount > 0 && (
              <Button
                variant="outline"
                onClick={markAllRead}
                className="flex items-center gap-2"
              >
                <CheckCheck className="w-4 h-4" />
                {t('notifications.mark_all_read')}
              </Button>
            )}
          </motion.div>

          {/* Filter tabs */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex items-center gap-2 mb-6 bg-white rounded-xl p-1.5 border border-gray-200 w-fit"
          >
            <Filter className="w-4 h-4 text-gray-400 ml-2" />
            {filterButtons.map((b) => (
              <button
                key={b.key}
                onClick={() => setFilter(b.key)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                  filter === b.key
                    ? 'bg-[#1A56A0] text-white shadow-sm'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {b.label}
                {b.count !== undefined && b.count > 0 && (
                  <span
                    className={`text-xs px-1.5 py-0.5 rounded-full ${
                      filter === b.key
                        ? 'bg-white/20 text-white'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {b.count}
                  </span>
                )}
              </button>
            ))}
          </motion.div>

          {/* List */}
          <Card>
            <CardContent className="p-0">
              {loading && notifications.length === 0 ? (
                <div className="p-12 text-center text-gray-400">{t('common.loading')}</div>
              ) : error ? (
                <div className="p-12 text-center">
                  <p className="text-red-500 mb-3">{error}</p>
                  <Button variant="outline" onClick={fetchList}>
                    {t('common.retry')}
                  </Button>
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-16 text-center">
                  <Inbox className="w-16 h-16 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium">
                    {filter === 'all'
                      ? t('notifications.empty')
                      : t('notifications.empty_filter')}
                  </p>
                </div>
              ) : (
                <AnimatePresence initial={false}>
                  {notifications.map((n: Notification, idx: number) => {
                    const cfg = TYPE_ICONS[n.type] || { icon: Bell, color: '#9B59B6' };
                    const Icon = cfg.icon;
                    const typeKey = `notifications.types.${n.type}`;
                    const typeLabel = t(typeKey) === typeKey ? n.type_label || n.type : t(typeKey);

                    return (
                      <motion.div
                        key={n.id}
                        layout
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -50 }}
                        transition={{ delay: Math.min(idx * 0.03, 0.3) }}
                        className={`group p-5 border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors ${
                          !n.is_read ? 'bg-[#F39C12]/5' : ''
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          {/* Icon */}
                          <div
                            className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                            style={{ backgroundColor: cfg.color + '15' }}
                          >
                            <Icon className="w-5 h-5" style={{ color: cfg.color }} />
                          </div>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="font-semibold text-[#0D3B6E]">
                                    {n.title}
                                  </p>
                                  {!n.is_read && (
                                    <span className="w-2 h-2 bg-[#F39C12] rounded-full" />
                                  )}
                                  <Badge
                                    variant="outline"
                                    className="text-xs"
                                    style={{ borderColor: cfg.color, color: cfg.color }}
                                  >
                                    {typeLabel}
                                  </Badge>
                                </div>
                                <p className="text-sm text-gray-700 mt-1.5 leading-relaxed">
                                  {n.message}
                                </p>
                                <p className="text-xs text-gray-400 mt-2">
                                  {formatRelative(n.created_at, t)}
                                </p>
                              </div>

                              {/* Actions */}
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                {!n.is_read && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => markRead(n.id)}
                                    title={t('notifications.mark_read')}
                                  >
                                    <Check className="w-4 h-4 text-green-600" />
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => remove(n.id)}
                                  title={t('notifications.delete')}
                                >
                                  <Trash2 className="w-4 h-4 text-red-500" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
