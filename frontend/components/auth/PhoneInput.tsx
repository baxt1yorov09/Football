'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Phone, ArrowRight, Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { apiClient, API_ENDPOINTS } from '@/lib/api/client';
import { phoneSchema } from '@/lib/validations/auth';

interface PhoneInputProps {
  onSubmit: (phone: string) => void;
}

export function PhoneInput({ onSubmit }: PhoneInputProps) {
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const formatPhone = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '');
    
    // Handle Uzbekistan phone format
    if (digits.startsWith('998')) {
      return '+' + digits;
    } else if (digits.startsWith('0')) {
      return '+998' + digits.substring(1);
    } else if (digits.length > 0) {
      return '+998' + digits;
    }
    return '+998';
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    setPhone(formatted);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate phone
    const result = phoneSchema.safeParse({ phone });
    if (!result.success) {
      const firstError = result.error.issues[0];
      setError(firstError?.message || "Noto'g'ri telefon raqam");
      return;
    }

    setLoading(true);
    try {
      // Send OTP request
      await apiClient.post(API_ENDPOINTS.auth.sendOtp, { phone });
      onSubmit(phone);
    } catch (err: any) {
      setError(err.response?.data?.error || "SMS yuborishda xatolik");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-bold text-[#0D3B6E] mb-2">
        Telefon raqamingiz
      </h2>
      <p className="text-gray-600 text-sm mb-6">
        SMS kod yuborish uchun telefon raqamingizni kiriting
      </p>

      <form onSubmit={handleSubmit}>
        <div className="relative mb-4">
          <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            type="tel"
            value={phone}
            onChange={handleChange}
            placeholder="+998 XX XXX-XX-XX"
            className="pl-12 h-14 text-lg"
            maxLength={13}
          />
        </div>

        {error && (
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-red-500 text-sm mb-4"
          >
            {error}
          </motion.p>
        )}

        <Button
          type="submit"
          className="w-full h-14 bg-[#F39C12] hover:bg-[#E67E22] text-white text-lg font-semibold"
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              Davom etish
              <ArrowRight className="ml-2 w-5 h-5" />
            </>
          )}
        </Button>
      </form>

      <p className="text-center text-gray-500 text-sm mt-6">
        Davom etish orqali siz{' '}
        <a href="/terms" className="text-[#1A56A0] hover:underline">
          foydalanish shartlari
        </a>{' '}
        bilan tanishgan bo'lasiz
      </p>

      <div className="mt-4 flex justify-center">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-[#1A56A0] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Bosh sahifaga qaytish
        </Link>
      </div>
    </div>
  );
}

export default PhoneInput;
