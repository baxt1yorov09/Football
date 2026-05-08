'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Shield, CheckCircle, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function VerifyPage() {
  const [verificationCode, setVerificationCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleVerify = async () => {
    if (!verificationCode.trim()) {
      setError('Iltimos, tasdiqlash kodini kiriting');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simulate verification logic
      if (verificationCode === 'VERIFY123' || verificationCode.length === 8) {
        setSuccess(true);
      } else {
        setError('Noto\'g\'ri tasdiqlash kodi. Iltimos, qayta urinib ko\'ring.');
      }
    } catch (err) {
      setError('Tasdiqlash jarayonida xatolik yuz berdi. Iltimos, keyinroq urinib ko\'ring.');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-[#F4F6F9] flex items-center justify-center">
        <Header />
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full mx-4"
        >
          <Card className="text-center">
            <CardHeader>
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <CardTitle className="text-green-600">Tasdiqlandi!</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600">
                Litsenziyangiz muvaffaqiyatli tasdiqlandi!
              </p>
              <p className="text-sm text-gray-500">
                Endi barcha imkoniyatlardan foydalanishingiz mumkin.
              </p>
              <Link href="/dashboard">
                <Button className="w-full">
                  Asosiy sahifaga o'tish
                </Button>
              </Link>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F4F6F9] flex items-center justify-center">
      <Header />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full mx-4"
      >
        <Card>
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-blue-600" />
            </div>
            <CardTitle>Litsenziyani tasdiqlash</CardTitle>
            <p className="text-gray-600 mt-2">
              Litsenziyangizni tasdiqlash uchun kodni kiriting
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label htmlFor="verification-code" className="block text-sm font-medium text-gray-700 mb-2">
                Tasdiqlash kodi
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <Input
                  id="verification-code"
                  type="text"
                  placeholder="XXXX-XXXX"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.toUpperCase())}
                  className="pl-10"
                  maxLength={8}
                />
              </div>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg"
              >
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                <p className="text-red-700 text-sm">{error}</p>
              </motion.div>
            )}

            <Button
              onClick={handleVerify}
              disabled={isLoading || !verificationCode.trim()}
              className="w-full"
            >
              {isLoading ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                />
              ) : (
                'Tasdiqlash'
              )}
            </Button>

            <div className="text-center text-sm text-gray-500">
              <p>Tasdiqlash kodini olmadingizmi?</p>
              <Link href="/auth" className="text-blue-600 hover:underline">
                Kirish qismiga o'ting
              </Link>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
