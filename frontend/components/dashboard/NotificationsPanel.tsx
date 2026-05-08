'use client';

import { motion } from 'framer-motion';
import { Bell, Check, FileCheck, XCircle, Clock, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const notifications = [
  {
    id: '1',
    type: 'app_approved',
    title: 'Ariza tasdiqlandi',
    message: 'PRO litsenziya arizangiz tasdiqlandi!',
    time: '2 soat oldin',
    read: false,
  },
  {
    id: '2',
    type: 'expiry_30',
    title: 'Litsenziya muddati',
    message: 'Fitness L1 litsenziyangiz 30 kunda tugaydi',
    time: '5 soat oldin',
    read: false,
  },
  {
    id: '3',
    type: 'app_under_review',
    title: "Ariza ko'rib chiqilmoqda",
    message: 'PRO litsenziya arizangiz ko\'rib chiqilmoqda',
    time: '1 kun oldin',
    read: true,
  },
  {
    id: '4',
    type: 'system',
    title: 'Tizim yangilanishi',
    message: 'Platforma yangi funksiyalar bilan boyitildi',
    time: '2 kun oldin',
    read: true,
  },
];

const notificationIcons = {
  app_received: { icon: FileCheck, color: '#3498DB' },
  app_approved: { icon: Check, color: '#27AE60' },
  app_rejected: { icon: XCircle, color: '#E74C3C' },
  expiry_30: { icon: AlertTriangle, color: '#F39C12' },
  expiry_14: { icon: AlertTriangle, color: '#E67E22' },
  expiry_7: { icon: AlertTriangle, color: '#E74C3C' },
  docs_required: { icon: FileCheck, color: '#E67E22' },
  system: { icon: Bell, color: '#9B59B6' },
};

export function NotificationsPanel() {
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div className="flex items-center gap-2">
          <CardTitle className="text-lg font-bold text-[#0D3B6E]">
            Bildirishnomalar
          </CardTitle>
          {unreadCount > 0 && (
            <Badge className="bg-[#F39C12] text-white">{unreadCount}</Badge>
          )}
        </div>
        <Button variant="ghost" size="sm" className="text-[#1A56A0] text-xs">
          Barchasini o'qish
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <div className="max-h-[400px] overflow-y-auto">
          {notifications.map((notification, index) => {
            const config = notificationIcons[notification.type as keyof typeof notificationIcons] || 
                          { icon: Bell, color: '#9B59B6' };
            const Icon = config.icon;

            return (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`p-4 border-b border-gray-100 last:border-0 hover:bg-gray-50 cursor-pointer transition-colors ${
                  !notification.read ? 'bg-[#F39C12]/5' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Icon */}
                  <div 
                    className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: config.color + '15' }}
                  >
                    <Icon className="w-4 h-4" style={{ color: config.color }} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-[#0D3B6E] text-sm truncate">
                        {notification.title}
                      </p>
                      {!notification.read && (
                        <div className="w-2 h-2 bg-[#F39C12] rounded-full flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                      {notification.message}
                    </p>
                    <p className="text-xs text-gray-400 mt-2">
                      {notification.time}
                    </p>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

export default NotificationsPanel;
