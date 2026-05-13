'use client';

import { motion } from 'framer-motion';
import {
  FileText, Clock, CheckCircle, XCircle, ChevronRight, Eye, AlertCircle, Plus, Sparkles,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useUserDashboard, DashboardApplication } from '@/hooks/useUserDashboard';

const STATUS_CFG: Record<string, { color: string; icon: any; label: string }> = {
  pending:          { color: '#F39C12', icon: Clock,       label: 'Kutilmoqda' },
  under_review:     { color: '#3498DB', icon: Eye,         label: "Ko'rib chiqilmoqda" },
  additional_docs:  { color: '#E67E22', icon: FileText,    label: "Qo'shimcha hujjat" },
  approved:         { color: '#27AE60', icon: CheckCircle, label: 'Tasdiqlangan' },
  license_issued:   { color: '#27AE60', icon: CheckCircle, label: 'Litsenziya berildi' },
  rejected:         { color: '#E74C3C', icon: XCircle,     label: 'Rad etilgan' },
  cancelled:        { color: '#95A5A6', icon: XCircle,     label: 'Bekor qilingan' },
};

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('uz-UZ', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch { return iso; }
}

function AppRow({ app, index }: { app: DashboardApplication; index: number }) {
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
              {cfg.label}
            </Badge>
          </div>
          <p className="text-sm text-gray-700 mt-1 truncate">
            {app.license_type_name || app.license_type_code || 'Litsenziya arizasi'}
          </p>
          <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 flex-wrap">
            <span>Yuborildi: {formatDate(app.submitted_at)}</span>
            {app.reviewed_at && <span>Ko'rib chiqildi: {formatDate(app.reviewed_at)}</span>}
          </div>
          {app.rejection_reason && (
            <p className="text-xs text-red-500 mt-1 line-clamp-1">
              Sabab: {app.rejection_reason}
            </p>
          )}
        </div>
      </div>

      <Link href={`/applications/${app.id}`} className="flex-shrink-0">
        <Button variant="ghost" size="sm" className="text-[#1A56A0]">
          Batafsil
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
  const apps = data?.recent_applications || [];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-bold text-[#0D3B6E] flex items-center gap-2">
          <FileText className="w-5 h-5" />
          So'nggi arizalar
        </CardTitle>
        <Link
          href="/applications"
          className="text-sm text-[#1A56A0] hover:text-[#F39C12] flex items-center gap-1"
        >
          Barchasini ko'rish
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
            <p className="font-medium text-gray-900 mb-1">Hali arizalar yo'q</p>
            <p className="text-sm text-gray-500 mb-4">Birinchi arizangizni yuboring</p>
            <Link href="/apply">
              <Button className="bg-[#1A56A0] hover:bg-[#0D3B6E]">
                <Plus className="w-4 h-4 mr-2" />
                Ariza yuborish
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {apps.map((app, idx) => (
              <AppRow key={app.id} app={app} index={idx} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default RecentApplications;
