'use client';

import { motion } from 'framer-motion';
import { 
  FileText, 
  CheckCircle, 
  XCircle, 
  User, 
  Award,
  Clock
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useI18n } from '@/lib/i18n/I18nProvider';

const activities = [
  {
    id: '1',
    type: 'application_submitted',
    message: 'Jasur Karimov PRO litsenziyaga ariza yubordi',
    user: 'Jasur Karimov',
    time: '2 daqiqa oldin',
    icon: FileText,
    color: '#3498DB',
  },
  {
    id: '2',
    type: 'application_approved',
    message: 'Azizbek Toshmatovning A litsenziya arizasi tasdiqlandi',
    user: 'Admin User',
    time: '15 daqiqa oldin',
    icon: CheckCircle,
    color: '#27AE60',
  },
  {
    id: '3',
    type: 'application_rejected',
    message: 'Bobur Alimovning D litsenziya arizasi rad etildi',
    user: 'Admin User',
    time: '1 soat oldin',
    icon: XCircle,
    color: '#E74C3C',
  },
  {
    id: '4',
    type: 'license_issued',
    message: 'Dilfuza Rahimova uchun C litsenziya rasmiylashtirildi',
    user: 'System',
    time: '2 soat oldin',
    icon: Award,
    color: '#F39C12',
  },
  {
    id: '5',
    type: 'user_registered',
    message: 'Yangi foydalanuvchi ro\'yxatdan o\'tdi: Gulnora Karimova',
    user: 'System',
    time: '3 soat oldin',
    icon: User,
    color: '#9B59B6',
  },
];

export function RecentActivity() {
  const { t } = useI18n();
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-lg font-bold text-[#0D3B6E]">
          {t('admin.recent_apps')}
        </CardTitle>
        <button className="text-sm text-[#1A56A0] hover:text-[#F39C12]">
          {t('dashboard.view_all')}
        </button>
      </CardHeader>
      <CardContent className="p-0">
        <div className="max-h-[400px] overflow-y-auto">
          {activities.map((activity, index) => {
            const Icon = activity.icon;

            return (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-start gap-3 p-4 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0"
              >
                {/* Icon */}
                <div 
                  className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: activity.color + '15' }}
                >
                  <Icon className="w-4 h-4" style={{ color: activity.color }} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700 line-clamp-2">
                    {activity.message}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-gray-500">{activity.user}</span>
                    <span className="text-xs text-gray-400">•</span>
                    <span className="text-xs text-gray-500">{activity.time}</span>
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

export default RecentActivity;
