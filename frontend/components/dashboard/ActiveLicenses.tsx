'use client';

import { motion } from 'framer-motion';
import { Award, Download, QrCode, Share2, Star, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { LICENSE_COLORS } from '@/lib/constants/licenses';

const licenses = [
  {
    id: '1',
    type: 'PRO',
    number: 'UFF-2026-PRO-000042',
    name: 'Jasur Karimov',
    issued: '2024-03-15',
    expires: '2026-03-15',
    status: 'active',
  },
  {
    id: '2',
    type: 'GK_2',
    number: 'UFF-2026-GK2-000017',
    name: 'Jasur Karimov',
    issued: '2024-01-20',
    expires: '2026-01-20',
    status: 'active',
  },
  {
    id: '3',
    type: 'FITNESS_1',
    number: 'UFF-2026-FIT-000003',
    name: 'Jasur Karimov',
    issued: '2024-02-05',
    expires: '2024-08-05', // Expiring soon
    status: 'expiring_soon',
  },
];

export function ActiveLicenses() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-bold text-[#0D3B6E]">
          Faol litsenziyalar
        </CardTitle>
        <Link 
          href="/licenses"
          className="text-sm text-[#1A56A0] hover:text-[#F39C12] flex items-center gap-1"
        >
          Barchasini ko'rish
          <ChevronRight className="w-4 h-4" />
        </Link>
      </CardHeader>
      <CardContent className="space-y-4">
        {licenses.map((license, index) => {
          const color = LICENSE_COLORS[license.type as keyof typeof LICENSE_COLORS] || '#3498DB';
          const isPro = license.type === 'PRO';
          const isExpiring = license.status === 'expiring_soon';

          return (
            <motion.div
              key={license.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ x: 4 }}
              className={`relative p-4 rounded-xl border-2 transition-all cursor-pointer ${
                isExpiring ? 'border-[#E74C3C] bg-red-50' : 'border-gray-100 hover:border-[#F39C12]'
              }`}
            >
              {/* Shimmer effect for PRO */}
              {isPro && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-pulse rounded-xl" />
              )}

              {/* Expiring warning */}
              {isExpiring && (
                <div className="absolute -top-3 left-4 px-3 py-1 bg-[#E74C3C] text-white text-xs rounded-full">
                  30 kun qoldi!
                </div>
              )}

              <div className="flex items-start gap-4">
                {/* License Badge */}
                <div 
                  className="w-16 h-16 rounded-xl flex flex-col items-center justify-center text-white font-bold text-xs"
                  style={{ backgroundColor: color }}
                >
                  {isPro && <Star className="w-4 h-4 mb-1 fill-white" />}
                  <span>{license.type.replace('_', '-')}</span>
                </div>

                {/* License Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-[#0D3B6E]">{license.name}</h3>
                    {isPro && (
                      <Badge className="bg-[#F39C12] text-white">EXCLUSIVE</Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 font-mono">{license.number}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                    <span>Berildi: {license.issued}</span>
                    <span className={isExpiring ? 'text-[#E74C3C] font-semibold' : ''}>
                      Tugaydi: {license.expires}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2">
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Download className="w-4 h-4 text-gray-400" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <QrCode className="w-4 h-4 text-gray-400" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Share2 className="w-4 h-4 text-gray-400" />
                  </Button>
                </div>
              </div>
            </motion.div>
          );
        })}

        {/* Renewal CTA for expiring license */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="p-4 bg-gradient-to-r from-[#E74C3C]/10 to-[#F39C12]/10 rounded-xl border border-[#E74C3C]/20"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-[#0D3B6E]">Fitness L1 litsenziyangiz 30 kunda tugaydi</p>
              <p className="text-sm text-gray-600">Yangilash arizasini hoziroq topshiring</p>
            </div>
            <Link href="/apply/FITNESS_1_RENEWAL">
              <Button className="bg-[#F39C12] hover:bg-[#E67E22]">
                Yangilash
              </Button>
            </Link>
          </div>
        </motion.div>
      </CardContent>
    </Card>
  );
}

export default ActiveLicenses;
