'use client';

import { motion } from 'framer-motion';
import { Award, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useUserDashboard } from '@/hooks/useUserDashboard';
import { useI18n } from '@/lib/i18n/I18nProvider';
import Link from 'next/link';

interface StatItem {
  label: string;
  value: number;
  icon: any;
  color: string;
  href?: string;
}

export function StatsOverview() {
  const { data, loading, error } = useUserDashboard();
  const { t } = useI18n();

  const stats: StatItem[] = [
    {
      label: t('dashboard.stats.active_licenses'),
      value: data?.stats.active_licenses ?? 0,
      icon: Award,
      color: '#27AE60',
      href: '/licenses?status=active',
    },
    {
      label: t('dashboard.stats.pending_applications'),
      value: data?.stats.pending_applications ?? 0,
      icon: Clock,
      color: '#F39C12',
      href: '/applications?status=pending',
    },
    {
      label: t('applications.status.approved'),
      value: data?.stats.approved_applications ?? 0,
      icon: CheckCircle,
      color: '#3498DB',
      href: '/applications?status=approved',
    },
    {
      label: t('dashboard.stats.expiring_soon'),
      value: data?.stats.expiring_soon ?? 0,
      icon: AlertTriangle,
      color: '#E74C3C',
      href: '/licenses?expiring=1',
    },
  ];

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
        {t('common.error')}: {error}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        const CardInner = (
          <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <p className="text-sm text-gray-600 mb-1 truncate">{stat.label}</p>
                  {loading ? (
                    <div className="h-9 w-16 bg-gray-100 rounded animate-pulse" />
                  ) : (
                    <p className="text-3xl font-bold" style={{ color: stat.color }}>
                      {stat.value.toLocaleString('uz-UZ')}
                    </p>
                  )}
                </div>
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: stat.color + '15' }}
                >
                  <Icon className="w-6 h-6" style={{ color: stat.color }} />
                </div>
              </div>
            </CardContent>
          </Card>
        );

        return (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08 }}
          >
            {stat.href ? <Link href={stat.href}>{CardInner}</Link> : CardInner}
          </motion.div>
        );
      })}
    </div>
  );
}

export default StatsOverview;
