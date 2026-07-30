'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, ArrowRight, Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { apiClient, API_ENDPOINTS } from '@/lib/api/client';

interface EmailInputProps {
  phone: string;
  onSubmit: (email: string, emailMasked: string, code?: string) => void;
  onBack: () => void;
}

export function EmailInput({ phone, onSubmit, onBack }: EmailInputProps) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim().toLowerCase();
    if (!isValidEmail(trimmed)) {
      setError("To'g'ri email manzil kiriting");
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await apiClient.post(API_ENDPOINTS.auth.sendOtp, {
        phone,
        email: trimmed,
      });
      onSubmit(trimmed, res.data?.email_masked || trimmed, res.data?.code);
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Email yuborishda xatolik');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        onClick={onBack}
        type="button"
        className="flex items-center gap-2 text-gray-500 hover:text-[#1A56A0] mb-4 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Orqaga
      </button>

      <h2 className="text-xl font-bold text-[#0D3B6E] mb-2">Email manzilingiz</h2>
      <p className="text-gray-600 text-sm mb-6">
        Tasdiqlash kodi email manzilingizga yuboriladi
      </p>

      <form onSubmit={handleSubmit}>
        <div className="relative mb-4">
          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError('');
            }}
            placeholder="example@mail.com"
            className="pl-12 h-14 text-lg"
            autoFocus
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
              Kod yuborish
              <ArrowRight className="ml-2 w-5 h-5" />
            </>
          )}
        </Button>
      </form>
    </div>
  );
}

export default EmailInput;
