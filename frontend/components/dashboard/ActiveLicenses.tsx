'use client';

import { motion } from 'framer-motion';
import { Award, Download, QrCode, ChevronRight, Star, Sparkles, AlertCircle, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useUserDashboard, DashboardLicense } from '@/hooks/useUserDashboard';
import { useI18n } from '@/lib/i18n/I18nProvider';

function formatDate(iso: string, locale: string = 'uz'): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString(locale === 'ru' ? 'ru-RU' : 'uz-UZ', {
      day: '2-digit', month: 'short', year: 'numeric',
    });
  } catch { return iso; }
}

function LicenseSkeleton() {
  return (
    <div className="p-4 rounded-xl border border-gray-100 animate-pulse">
      <div className="flex items-start gap-4">
        <div className="w-16 h-16 bg-gray-200 rounded-xl" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-3/4 bg-gray-200 rounded" />
          <div className="h-3 w-1/2 bg-gray-100 rounded" />
          <div className="h-3 w-2/3 bg-gray-100 rounded" />
        </div>
      </div>
    </div>
  );
}

function LicenseRow({ lic, index, t, locale }: { lic: DashboardLicense; index: number; t: (k: string, v?: any) => string; locale: string }) {
  const isPro = lic.license_type_code === 'PRO';
  const isExpiring = lic.is_expiring_soon;

  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.08 }}
      whileHover={{ x: 4 }}
      className={`relative p-4 rounded-xl border-2 transition-all ${
        isExpiring ? 'border-[#E74C3C] bg-red-50' : 'border-gray-100 hover:border-[#F39C12]'
      }`}
    >
      {isPro && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent rounded-xl pointer-events-none" />
      )}
      {isExpiring && (
        <div className="absolute -top-3 left-4 px-3 py-1 bg-[#E74C3C] text-white text-xs rounded-full font-medium">
          {t('licenses.days_left_warning', { n: lic.days_left })}
        </div>
      )}

      <div className="flex items-start gap-4 relative">
        {/* Badge */}
        <div
          className="w-16 h-16 rounded-xl flex flex-col items-center justify-center text-white font-bold text-xs flex-shrink-0"
          style={{ backgroundColor: lic.color_hex }}
        >
          {isPro && <Star className="w-4 h-4 mb-1 fill-white" />}
          <span>{lic.license_type_code.replace('_', '-')}</span>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <h3 className="font-bold text-[#0D3B6E] truncate">{lic.license_type_name}</h3>
            {isPro && <Badge className="bg-[#F39C12] text-white text-xs">EXCLUSIVE</Badge>}
          </div>
          <p className="text-sm text-gray-600 font-mono truncate">{lic.license_number}</p>
          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 flex-wrap">
            <span>{t('licenses.issued')}: {formatDate(lic.issued_at, locale)}</span>
            <span className={isExpiring ? 'text-[#E74C3C] font-semibold' : ''}>
              {t('licenses.expires')}: {formatDate(lic.expires_at, locale)}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-1 flex-shrink-0">
          {lic.pdf_url ? (
            <a
              href={lic.pdf_url}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 hover:bg-blue-50 rounded-lg transition-colors"
              title={t('licenses.detail.download_pdf')}
            >
              <Download className="w-4 h-4 text-gray-400 hover:text-[#1A56A0]" />
            </a>
          ) : (
            <button className="p-2 hover:bg-blue-50 rounded-lg" disabled title={t('common.empty')}>
              <Download className="w-4 h-4 text-gray-300" />
            </button>
          )}
          <Link href={`/verify/${lic.id}`} className="p-2 hover:bg-blue-50 rounded-lg" title="QR">
            <QrCode className="w-4 h-4 text-gray-400 hover:text-[#1A56A0]" />
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

export function ActiveLicenses() {
  const { data, loading, error } = useUserDashboard();
  const { t, locale } = useI18n();
  const licenses = data?.active_licenses || [];
  const expiringSoonTotal = data?.stats.expiring_soon || 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-bold text-[#0D3B6E] flex items-center gap-2">
          <Award className="w-5 h-5" />
          {t('dashboard.active_licenses')}
        </CardTitle>
        <Link
          href="/licenses"
          className="text-sm text-[#1A56A0] hover:text-[#F39C12] flex items-center gap-1"
        >
          {t('dashboard.view_all')}
          <ChevronRight className="w-4 h-4" />
        </Link>
      </CardHeader>

      <CardContent className="space-y-4">
        {loading ? (
          <>
            <LicenseSkeleton />
            <LicenseSkeleton />
          </>
        ) : error ? (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        ) : licenses.length === 0 ? (
          <div className="p-8 text-center bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
            <div className="w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-[#1A56A0] to-[#0D3B6E] rounded-2xl flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">{t('licenses.empty_title')}</h3>
            <p className="text-sm text-gray-600 mb-4">
              {t('licenses.empty_subtitle')}
            </p>
            <Link href="/apply">
              <Button className="bg-[#1A56A0] hover:bg-[#0D3B6E]">
                <Plus className="w-4 h-4 mr-2" />
                {t('licenses.empty_action')}
              </Button>
            </Link>
          </div>
        ) : (
          <>
            {licenses.map((lic, idx) => (
              <LicenseRow key={lic.id} lic={lic} index={idx} t={t} locale={locale} />
            ))}

            {/* Renewal CTA if any expiring */}
            {expiringSoonTotal > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-4 bg-gradient-to-r from-[#E74C3C]/10 to-[#F39C12]/10 rounded-xl border border-[#E74C3C]/20"
              >
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-[#0D3B6E]">
                      {t('licenses.expiring_banner_title', { n: expiringSoonTotal })}
                    </p>
                    <p className="text-sm text-gray-600">{t('licenses.expiring_banner_subtitle')}</p>
                  </div>
                  <Link href="/apply">
                    <Button className="bg-[#F39C12] hover:bg-[#E67E22]">
                      {t('licenses.renew')}
                    </Button>
                  </Link>
                </div>
              </motion.div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default ActiveLicenses;
