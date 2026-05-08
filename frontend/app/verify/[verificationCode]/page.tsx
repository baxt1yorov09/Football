'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Award, 
  User, 
  Calendar,
  MapPin,
  Phone,
  Mail,
  Shield
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { apiClient } from '@/lib/api/client';

interface LicenseData {
  valid: boolean;
  license?: {
    license_number: string;
    license_type: string;
    holder_name: string;
    issued_at: string;
    expires_at: string;
    current_club: string;
  };
  reason?: string;
}

export default function VerificationPage() {
  const params = useParams();
  const router = useRouter();
  const verificationCode = params.verificationCode as string;
  
  const [loading, setLoading] = useState(true);
  const [licenseData, setLicenseData] = useState<LicenseData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const verifyLicense = async () => {
      try {
        const response = await apiClient.get(`/licenses/verify/${verificationCode}`);
        setLicenseData(response.data);
      } catch (err: any) {
        setError(err.response?.data?.reason || 'Litsenziyani tekshirishda xatolik');
      } finally {
        setLoading(false);
      }
    };

    if (verificationCode) {
      verifyLicense();
    }
  }, [verificationCode]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('uz-UZ', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F4F6F9] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#F39C12] border-t-transparent rounded-full animate-spin mb-4" />
          <p className="text-gray-600">Litsenziya tekshirilmoqda...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F6F9] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl"
      >
        <Card className="shadow-2xl overflow-hidden">
          <CardContent className="p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-3 mb-4">
                <div className="w-16 h-16 bg-[#F39C12] rounded-2xl flex items-center justify-center">
                  <span className="text-2xl font-bold text-white">UFF</span>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-[#0D3B6E]">
                    O'zbekiston Futbol Federatsiyasi
                  </h1>
                  <p className="text-gray-600">Litsenziya tekshirish tizimi</p>
                </div>
              </div>
            </div>

            {/* Verification Result */}
            {licenseData && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center"
              >
                {licenseData.valid ? (
                  <div className="mb-8">
                    <div className="inline-flex items-center gap-3 px-6 py-3 bg-green-50 border-2 border-green-200 rounded-xl">
                      <CheckCircle className="w-8 h-8 text-green-600" />
                      <div className="text-left">
                        <p className="font-bold text-green-800 text-lg">LITSENZIYA HAQIQIY</p>
                        <p className="text-green-600">LICENSE AUTHENTIC</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="mb-8">
                    <div className="inline-flex items-center gap-3 px-6 py-3 bg-red-50 border-2 border-red-200 rounded-xl">
                      <XCircle className="w-8 h-8 text-red-600" />
                      <div className="text-left">
                        <p className="font-bold text-red-800 text-lg">LITSENZIYA YO'QOLIQ</p>
                        <p className="text-red-600">LICENSE INVALID</p>
                      </div>
                    </div>
                    {licenseData.reason && (
                      <p className="text-red-600 mt-3">{licenseData.reason}</p>
                    )}
                  </div>
                )}
              </motion.div>
            )}

            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center mb-8"
              >
                <div className="inline-flex items-center gap-3 px-6 py-3 bg-red-50 border-2 border-red-200 rounded-xl">
                  <XCircle className="w-8 h-8 text-red-600" />
                  <div className="text-left">
                    <p className="font-bold text-red-800 text-lg">XATOLIK YUZ BERDI</p>
                    <p className="text-red-600">ERROR OCCURRED</p>
                  </div>
                </div>
                <p className="text-red-600 mt-3">{error}</p>
              </motion.div>
            )}

            {/* License Details */}
            {licenseData?.valid && licenseData.license && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="space-y-6"
              >
                {/* License Info */}
                <div className="bg-gradient-to-r from-[#0D3B6E]/5 to-[#1A56A0]/5 p-6 rounded-xl">
                  <div className="flex items-center gap-4 mb-4">
                    <Award className="w-8 h-8 text-[#F39C12]" />
                    <h2 className="text-xl font-bold text-[#0D3B6E]">
                      {licenseData.license.license_type}
                    </h2>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Litsenziya raqami</p>
                      <p className="font-mono font-semibold text-[#0D3B6E]">
                        {licenseData.license.license_number}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Holati</p>
                      <Badge className="bg-green-100 text-green-800 border-green-200">
                        Faol
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Holder Info */}
                <div className="border border-gray-200 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-[#0D3B6E] mb-4 flex items-center gap-2">
                    <User className="w-5 h-5" />
                    Litsenziya egasi
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-gray-600 w-24">F.I.O:</span>
                      <span className="font-medium">{licenseData.license.holder_name}</span>
                    </div>
                    {licenseData.license.current_club && (
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-gray-600 w-24">Klub:</span>
                        <span className="font-medium">{licenseData.license.current_club}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Validity Period */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="border border-gray-200 rounded-xl p-6">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="w-5 h-5 text-green-600" />
                      <h4 className="font-semibold text-green-800">Berilgan sana</h4>
                    </div>
                    <p className="text-lg font-medium text-gray-800">
                      {formatDate(licenseData.license.issued_at)}
                    </p>
                  </div>
                  <div className="border border-gray-200 rounded-xl p-6">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="w-5 h-5 text-amber-600" />
                      <h4 className="font-semibold text-amber-800">Amal qilish muddati</h4>
                    </div>
                    <p className="text-lg font-medium text-gray-800">
                      {formatDate(licenseData.license.expires_at)}
                    </p>
                  </div>
                </div>

                {/* Security Features */}
                <div className="bg-gradient-to-r from-[#F39C12]/10 to-[#E67E22]/10 p-6 rounded-xl">
                  <h3 className="text-lg font-semibold text-[#0D3B6E] mb-4 flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Xavfsizlik xususiyatlari
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full" />
                      <span>Blockchain tekshiruvi</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full" />
                      <span>Raqamli imzo</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full" />
                      <span>Onlayn tekshirish</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full" />
                      <span>Hologram muhr</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Actions */}
            <div className="flex justify-center gap-4 mt-8 pt-6 border-t border-gray-200">
              <Button
                variant="outline"
                onClick={() => router.push('/')}
                className="flex items-center gap-2"
              >
                <Shield className="w-4 h-4" />
                Asosiy sahifa
              </Button>
              <Button
                onClick={() => window.print()}
                className="flex items-center gap-2 bg-[#F39C12] hover:bg-[#E67E22]"
              >
                <Award className="w-4 h-4" />
                Chop etish
              </Button>
            </div>

            {/* Footer */}
            <div className="text-center mt-8 pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-600 mb-2">
                Bu litsenziya haqiqiyligini tekshirish uchun quyidagi ma'lumotlardan foydalaning:
              </p>
              <div className="inline-flex items-center gap-4 px-4 py-2 bg-gray-100 rounded-lg">
                <span className="text-sm font-mono text-gray-700">
                  Tekshirish kodi: {verificationCode}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-4">
                © 2026 O'zbekiston Futbol Federatsiyasi. Barcha huquqlar himoyalangan.
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
