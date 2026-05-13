'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Bell, Check, FileCheck, XCircle, AlertTriangle, Inbox } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNotifications, Notification } from '@/hooks/useNotifications';
import { useI18n } from '@/lib/i18n/I18nProvider';

const notificationIcons: Record<string, { icon: any; color: string }> = {
  app_received: { icon: FileCheck, color: '#3498DB' },
  app_approved: { icon: Check, color: '#27AE60' },
  app_rejected: { icon: XCircle, color: '#E74C3C' },
  expiry_30: { icon: AlertTriangle, color: '#F39C12' },
  expiry_14: { icon: AlertTriangle, color: '#E67E22' },
  expiry_7: { icon: AlertTriangle, color: '#E74C3C' },
  docs_required: { icon: FileCheck, color: '#E67E22' },
  system: { icon: Bell, color: '#9B59B6' },
};

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

export function NotificationsPanel() {
  const { t } = useI18n();
  const { notifications, unreadCount, loading, markAllRead } = useNotifications({
    pollInterval: 30_000,
    loadList: true,
  });

  const top = notifications.slice(0, 5);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div className="flex items-center gap-2">
          <CardTitle className="text-lg font-bold text-[#0D3B6E]">
            {t('notifications.title')}
          </CardTitle>
          {unreadCount > 0 && (
            <Badge className="bg-[#F39C12] text-white">{unreadCount}</Badge>
          )}
        </div>
        {unreadCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={markAllRead}
            className="text-[#1A56A0] text-xs"
          >
            {t('notifications.mark_all_read')}
          </Button>
        )}
      </CardHeader>
      <CardContent className="p-0">
        <div className="max-h-[400px] overflow-y-auto">
          {loading && top.length === 0 ? (
            <div className="p-8 text-center text-sm text-gray-400">{t('common.loading')}</div>
          ) : top.length === 0 ? (
            <div className="p-8 text-center">
              <Inbox className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">{t('notifications.empty')}</p>
            </div>
          ) : (
            top.map((n: Notification, index: number) => {
              const config = notificationIcons[n.type] || { icon: Bell, color: '#9B59B6' };
              const Icon = config.icon;
              return (
                <motion.div
                  key={n.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`p-4 border-b border-gray-100 last:border-0 hover:bg-gray-50 cursor-pointer transition-colors ${
                    !n.is_read ? 'bg-[#F39C12]/5' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: config.color + '15' }}
                    >
                      <Icon className="w-4 h-4" style={{ color: config.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-[#0D3B6E] text-sm truncate">
                          {n.title}
                        </p>
                        {!n.is_read && (
                          <div className="w-2 h-2 bg-[#F39C12] rounded-full flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-gray-600 mt-1 line-clamp-2">{n.message}</p>
                      <p className="text-xs text-gray-400 mt-2">{relativeTime(n.created_at, t)}</p>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
        {notifications.length > 0 && (
          <div className="p-3 border-t border-gray-100 text-center">
            <Link href="/notifications">
              <Button variant="ghost" size="sm" className="text-[#1A56A0] text-xs">
                {t('dashboard.view_all')} →
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default NotificationsPanel;
