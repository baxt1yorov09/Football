'use client';

import { useState, useEffect, Suspense } from 'react';
import { motion } from 'framer-motion';
import { useSearchParams, useRouter } from 'next/navigation';
import { PhoneInput } from '@/components/auth/PhoneInput';
import { EmailInput } from '@/components/auth/EmailInput';
import { OTPInput } from '@/components/auth/OTPInput';
import { TwoFactorChallenge } from '@/components/auth/TwoFactorChallenge';
import { useAuth } from '@/hooks/useAuth';
import { apiClient, API_ENDPOINTS } from '@/lib/api/client';

function AuthPageInner() {
  const [step, setStep] = useState<'phone' | 'email' | 'otp' | '2fa'>('phone');
  const [phone, setPhone] = useState('');
  const [emailMasked, setEmailMasked] = useState<string>('');
  const [twoFactorToken, setTwoFactorToken] = useState('');
  const { login, verify2FA, isAuthenticated, user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect');

  // If already authenticated, redirect appropriately.
  // Onboarding tugallanmagan foydalanuvchi har doim /onboarding ga yo'naltiriladi
  // (orqaga tugmasi bilan dashboard'ga kirib qolmasligi uchun).
  useEffect(() => {
    if (!isAuthenticated || !user) return;
    if (user.is_onboarded === false) {
      router.push('/onboarding');
    } else {
      router.push(redirectUrl || '/dashboard');
    }
  }, [isAuthenticated, user, redirectUrl, router]);

  const handlePhoneSubmit = (phoneNumber: string, masked?: string) => {
    setPhone(phoneNumber);
    setEmailMasked(masked || '');
    setStep('otp');
  };

  const handleEmailRequired = (phoneNumber: string) => {
    setPhone(phoneNumber);
    setStep('email');
  };

  const handleEmailSubmit = (_email: string, masked: string) => {
    setEmailMasked(masked);
    setStep('otp');
  };

  const handleOTPSubmit = async (code: string) => {
    const result: any = await login(phone, code);

    if (!result?.success) return;

    // 2FA bosqichi kerak — TOTP/recovery kod so'raymiz
    if (result.requires2FA) {
      setTwoFactorToken(result.twoFactorToken);
      setStep('2fa');
      return;
    }

    if (result.isNewUser || result.user?.is_onboarded === false) {
      router.push('/onboarding');
    } else {
      router.push(redirectUrl || '/dashboard');
    }
  };

  const handle2FASubmit = async (code: string) => {
    const result = await verify2FA(twoFactorToken, code);
    if (result.success) {
      if (result.isNewUser || result.user?.is_onboarded === false) {
        router.push('/onboarding');
      } else {
        router.push(redirectUrl || '/dashboard');
      }
    }
    return result;
  };

  const handleResendOTP = async () => {
    // Emailga qayta yuborish — mavjud foydalanuvchi bo'lsa email allaqachon DB'da,
    // yangi foydalanuvchi bo'lsa OTPCode jadvalidagi email ishlatiladi.
    try {
      await apiClient.post(API_ENDPOINTS.auth.sendOtp, { phone });
    } catch {
      // xatolik jim o'tkaziladi — OTPInput'ning o'z indikatsiyasi bor
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0D3B6E] via-[#1A56A0] to-[#2D9CDB] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center p-1.5">
              <img
                src="/Uzbekistan_Football_Association_Logo.svg"
                alt="UFA"
                className="w-full h-full object-contain"
              />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-white">
            O&apos;zbekiston Murabbiylar ta&apos;limi
          </h1>
          <p className="text-white/70 mt-2">Murabbiy litsenziya tizimi</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Progress indicator */}
          <div className="flex">
            {(['phone', 'email', 'otp', '2fa'] as const).map((s, i) => (
              <div
                key={s}
                className={`flex-1 h-1 transition-colors duration-300 ${
                  ['phone', 'email', 'otp', '2fa'].indexOf(step) >= i
                    ? 'bg-[#F39C12]'
                    : 'bg-gray-200'
                }`}
              />
            ))}
          </div>

          <div className="p-8">
            {step === 'phone' && (
              <PhoneInput
                onSubmit={handlePhoneSubmit}
                onEmailRequired={handleEmailRequired}
              />
            )}

            {step === 'email' && (
              <EmailInput
                phone={phone}
                onSubmit={handleEmailSubmit}
                onBack={() => setStep('phone')}
              />
            )}

            {step === 'otp' && (
              <OTPInput
                phone={phone}
                emailMasked={emailMasked}
                onSubmit={handleOTPSubmit}
                onResend={handleResendOTP}
                onBack={() => setStep('phone')}
              />
            )}

            {step === '2fa' && (
              <TwoFactorChallenge
                onSubmit={handle2FASubmit}
                onBack={() => setStep('otp')}
              />
            )}
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-white/50 text-sm mt-8">
          © 2026 O&apos;zbekiston Murabbiylar ta&apos;limi
        </p>
      </motion.div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={null}>
      <AuthPageInner />
    </Suspense>
  );
}
