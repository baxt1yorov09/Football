'use client';

import { motion } from 'framer-motion';
import {
  FileText, Clock, CheckCircle, XCircle, ChevronRight, Eye, AlertCircle, Plus, Sparkles, Users,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useUserDashboard, DashboardApplication } from '@/hooks/useUserDashboard';
import { useI18n } from '@/lib/i18n/I18nProvider';

const STATUS_CFG: Record<string, { color: string; icon: any; tKey: string }> = {
  pending:          { color: '#F39C12', icon: Clock,       tKey: 'applications.status.pending' },
  under_review:     { color: '#3498DB', icon: Eye,         tKey: 'applications.status.under_review' },
  additional_docs:  { color: '#E67E22', icon: FileText,    tKey: 'applications.status.additional_docs' },
  approved:         { color: '#27AE60', icon: CheckCircle, tKey: 'applications.status.approved' },
  license_issued:   { color: '#27AE60', icon: CheckCircle, tKey: 'applications.status.license_issued' },
  rejected:         { color: '#E74C3C', icon: XCircle,     tKey: 'applications.status.rejected' },
  cancelled:        { color: '#95A5A6', icon: XCircle,     tKey: 'applications.status.cancelled' },
};

function formatDate(iso: string | null, locale: string = 'uz'): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString(locale === 'ru' ? 'ru-RU' : 'uz-UZ', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch { return iso; }
}

function AppRow({ app, index, t, locale }: { app: DashboardApplication; index: number; t: (k: string, v?: any) => string; locale: string }) {
  const cfg = STATUS_CFG[app.status] || STATUS_CFG.pending;
  const StatusIcon = cfg.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      className="flex items-center justify-between p-4 rounded-xl border border-gray-100 hover:border-[#1A56A0]/30 hover:bg-gray-50 transition-all gap-3"
    >
      <div className="flex items-center gap-4 min-w-0 flex-1">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: cfg.color + '15' }}
        >
          <StatusIcon className="w-5 h-5" style={{ color: cfg.color }} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-[#0D3B6E] font-mono text-xs">
              #{app.id.slice(0, 8).toUpperCase()}
            </span>
            <Badge
              variant="secondary"
              style={{
                backgroundColor: cfg.color + '15',
                color: cfg.color,
                border: 'none',
              }}
            >
              {t(cfg.tKey)}
            </Badge>
          </div>
          <p className="text-sm text-gray-700 mt-1 truncate">
            {app.license_type_name || app.license_type_code || t('applications.title')}
          </p>
          <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 flex-wrap">
            <span>{t('applications.submitted_at')}: {formatDate(app.submitted_at, locale)}</span>
            {app.reviewed_at && <span>{t('applications.reviewed_at')}: {formatDate(app.reviewed_at, locale)}</span>}
          </div>
          {app.queue_position != null && (
            <div className="flex items-center gap-1 mt-1.5">
              <Users className={`w-3 h-3 ${app.status === 'approved' ? 'text-[#27AE60]' : 'text-[#F39C12]'}`} />
              <span className={`text-xs font-medium ${app.status === 'approved' ? 'text-[#27AE60]' : 'text-[#F39C12]'}`}>
                {locale === 'ru'
                  ? `Ваша позиция в очереди: ${app.queue_position} из ${app.queue_total} (${app.queue_region})`
                  : `Navbatdagi o'rningiz: ${app.queue_position} / ${app.queue_total} (${app.queue_region})`}
              </span>
            </div>
          )}
          {app.rejection_reason && (
            <p className="text-xs text-red-500 mt-1 line-clamp-1">
              {t('applications.rejection_reason')}: {app.rejection_reason}
            </p>
          )}
        </div>
      </div>

      <Link href={`/applications/${app.id}`} className="flex-shrink-0">
        <Button variant="ghost" size="sm" className="text-[#1A56A0]">
          {t('applications.view_details')}
        </Button>
      </Link>
    </motion.div>
  );
}

function AppSkeleton() {
  return (
    <div className="p-4 rounded-xl border border-gray-100 animate-pulse flex items-center gap-4">
      <div className="w-10 h-10 bg-gray-200 rounded-lg" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-1/3 bg-gray-200 rounded" />
        <div className="h-3 w-2/3 bg-gray-100 rounded" />
      </div>
    </div>
  );
}

export function RecentApplications() {
  const { data, loading, error } = useUserDashboard();
  const { t, locale } = useI18n();
  const apps = data?.recent_applications || [];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-bold text-[#0D3B6E] flex items-center gap-2">
          <FileText className="w-5 h-5" />
          {t('dashboard.recent_applications')}
        </CardTitle>
        <Link
          href="/applications"
          className="text-sm text-[#1A56A0] hover:text-[#F39C12] flex items-center gap-1"
        >
          {t('dashboard.view_all')}
          <ChevronRight className="w-4 h-4" />
        </Link>
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="space-y-3">
            <AppSkeleton />
            <AppSkeleton />
            <AppSkeleton />
          </div>
        ) : error ? (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        ) : apps.length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-14 h-14 mx-auto mb-3 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl flex items-center justify-center">
              <Sparkles className="w-7 h-7 text-[#1A56A0]" />
            </div>
            <p className="font-medium text-gray-900 mb-1">{t('applications.empty_title')}</p>
            <p className="text-sm text-gray-500 mb-4">{t('applications.empty_subtitle')}</p>
            <Link href="/apply">
              <Button className="bg-[#1A56A0] hover:bg-[#0D3B6E]">
                <Plus className="w-4 h-4 mr-2" />
                {t('licenses.empty_action')}
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {apps.map((app, idx) => (
              <AppRow key={app.id} app={app} index={idx} t={t} locale={locale} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default RecentApplications;
