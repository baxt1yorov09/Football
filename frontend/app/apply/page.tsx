'use client';

// Litsenziya ariza turlari — backend `/licenses/types/` endpointidan dinamik yuklanadi.
// Rang, ikonka va tavsif kod bo'yicha xaritalanadi (kategoriya asosida ikonka tanlanadi).

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ArrowRight, Shield, Award, Users,
  Trophy, Dumbbell, Brain, LineChart, RefreshCcw, Star, Waves,
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/lib/i18n/I18nProvider';
import { apiClient } from '@/lib/api/client';

interface ApiLicenseType {
  code: string;
  name_uz: string;
  name_ru?: string | null;
  category: string;
  color_hex?: string;
}

// Kategoriya → ikonka + Tailwind bg klassi
const CATEGORY_STYLE: Record<string, { icon: any; bg: string }> = {
  main:       { icon: Award,     bg: 'bg-blue-500' },
  gk:         { icon: Shield,    bg: 'bg-emerald-600' },
  fitness:    { icon: Dumbbell,  bg: 'bg-pink-500' },
  specialist: { icon: Brain,     bg: 'bg-indigo-600' },
  renewal:    { icon: RefreshCcw,bg: 'bg-gray-500' },
  special:    { icon: Star,      bg: 'bg-amber-500' },
};

// Kod bo'yicha maxsus ikonka override
const CODE_ICON: Record<string, any> = {
  PRO: Trophy,
  BEACH: Waves,
  ANALYTICS: LineChart,
  FUTSAL: Users,
};

// Kod bo'yicha inglizcha qisqa tavsif (backend name_uz allaqachon inson uchun mos)
const CODE_DESC_UZ: Record<string, string> = {
  A: 'Professional darajadagi murabbiylik litsenziyasi',
  B: 'Yuqori darajadagi murabbiylik litsenziyasi',
  C: "O'rta darajadagi murabbiylik litsenziyasi",
  D: "Boshlang'ich murabbiylik litsenziyasi",
  E: 'Yordamchi murabbiylik litsenziyasi',
  F: 'Kirish darajasidagi murabbiylik',
  PRO: 'Eng yuqori professional daraja',
  GK: "Darvozabonlar bo'yicha murabbiylik",
  FITNESS: 'Fitness va jismoniy tayyorgarlik',
  SPECIALIST: 'Mutaxassis murabbiy',
  PSYCH: 'Sport psixologiyasi',
  ANALYTICS: "O'yin tahlili va statistikasi",
  SELEK: 'Iste\'dodli o\'yinchilarni saralash',
  BEACH: 'Plaj futboli murabbiyligi',
  FUTSAL: 'Futzal murabbiyligi',
  SPECIAL: 'Maxsus litsenziya',
  TEMPORARY: 'Vaqtinchalik litsenziya',
  ASSISTANT: 'Yordamchi murabbiy',
  INTERNATIONAL: 'Xalqaro daraja',
  HONORARY: 'Fahriy litsenziya',
};

export default function ApplyPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const { t, locale } = useI18n();
  const [types, setTypes] = useState<ApiLicenseType[]>([]);
  const [loadingTypes, setLoadingTypes] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) return;
    (async () => {
      try {
        const res = await apiClient.get('/licenses/types/');
        setTypes(res.data?.results || []);
      } catch {
        setTypes([]);
      } finally {
        setLoadingTypes(false);
      }
    })();
  }, [isAuthenticated]);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F4F6F9] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  // Redirect unauthenticated users to auth page with redirect back to apply
  if (!isAuthenticated) {
    router.push('/auth?redirect=/apply');
    return null;
  }

  const licenseTypes = types.map((tp) => {
    const catStyle = CATEGORY_STYLE[tp.category] || CATEGORY_STYLE.main;
    const Icon = CODE_ICON[tp.code] || catStyle.icon;
    const title = locale === 'ru' && tp.name_ru ? tp.name_ru : tp.name_uz;
    const description = CODE_DESC_UZ[tp.code] || title;
    return {
      type: tp.code,
      title,
      description,
      icon: Icon,
      color: catStyle.bg,
      href: `/apply/${tp.code}`,
    };
  });

  return (
    <div className="min-h-screen bg-[#F4F6F9]">
      <Header />
      
      <main className="pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl font-bold text-[#0D3B6E] mb-4">
              {t('apply.title')}
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {t('apply.subtitle')}
            </p>
          </motion.div>

          {/* License Types Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {licenseTypes.map((license, index) => {
              const Icon = license.icon;
              return (
                <motion.div
                  key={license.type}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                >
                  <Card className="hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer group">
                    <CardHeader className="text-center pb-4">
                      <div className={`w-16 h-16 ${license.color} rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform`}>
                        <Icon className="w-8 h-8 text-white" />
                      </div>
                      <CardTitle className="text-xl mb-2">{license.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="text-center">
                      <p className="text-gray-600 mb-6 min-h-[3rem]">
                        {license.description}
                      </p>
                      <Link href={license.href}>
                        <Button className="w-full group-hover:bg-blue-600 transition-colors">
                          {t('apply.apply_button')}
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </motion.div>

          {/* Info Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="mt-16"
          >
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-8">
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-[#0D3B6E] mb-4">
                    {t('apply.process_title')}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8 text-left">
                    <div>
                      <div className="w-12 h-12 bg-blue-500 text-white rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="font-bold">1</span>
                      </div>
                      <h4 className="font-semibold text-lg mb-2">{t('apply.step1_title')}</h4>
                      <p className="text-gray-600">
                        {t('apply.step1_desc')}
                      </p>
                    </div>
                    <div>
                      <div className="w-12 h-12 bg-blue-500 text-white rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="font-bold">2</span>
                      </div>
                      <h4 className="font-semibold text-lg mb-2">{t('apply.step2_title')}</h4>
                      <p className="text-gray-600">
                        {t('apply.step2_desc')}
                      </p>
                    </div>
                    <div>
                      <div className="w-12 h-12 bg-blue-500 text-white rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="font-bold">3</span>
                      </div>
                      <h4 className="font-semibold text-lg mb-2">{t('apply.step3_title')}</h4>
                      <p className="text-gray-600">
                        {t('apply.step3_desc')}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
