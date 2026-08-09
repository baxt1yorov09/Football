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
  const [step, setStep] = useState<'phone' | 'email' | 'otp' | '2fa' | 'restore'>('phone');
  const [phone, setPhone] = useState('');
  const [emailMasked, setEmailMasked] = useState<string>('');
  const [twoFactorToken, setTwoFactorToken] = useState('');
  const [restoreToken, setRestoreToken] = useState('');
  const [daysLeft, setDaysLeft] = useState(0);
  const { login, verify2FA, restoreAccount, isAuthenticated, user } = useAuth();
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

    // O'chirilgan hisob — tiklash imkoniyati
    if (result.accountDeleted) {
      setRestoreToken(result.restoreToken);
      setDaysLeft(result.daysLeft);
      setStep('restore');
      return;
    }

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

  const handleRestore = async () => {
    const result = await restoreAccount(restoreToken);
    if (result.success) {
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
          {step !== 'restore' && (
            <div className="flex">
              {(['phone', 'email', 'otp', '2fa'] as const).map((s, i) => (
                <div
                  key={s}
                  className={`flex-1 h-1 transition-colors duration-300 ${
                    ['phone', 'email', 'otp', '2fa'].indexOf(step as any) >= i
                      ? 'bg-[#F39C12]'
                      : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>
          )}
          {step === 'restore' && (
            <div className="h-1 bg-amber-400" />
          )}

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

            {step === 'restore' && (
              <div>
                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl">⚠️</span>
                  </div>
                  <h2 className="text-xl font-bold text-[#0D3B6E] mb-2">
                    Hisobingiz o&apos;chirilgan
                  </h2>
                  <p className="text-gray-600 text-sm">
                    Hisobingiz o&apos;chirilgan, lekin hali tiklanishi mumkin.
                  </p>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
                  <p className="text-sm text-amber-800 text-center">
                    <span className="font-bold text-2xl text-amber-600">{daysLeft}</span>
                    <br />
                    kun ichida tiklash mumkin
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setStep('phone')}
                    className="flex-1 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium"
                  >
                    Bekor qilish
                  </button>
                  <button
                    onClick={handleRestore}
                    className="flex-1 py-3 bg-[#F39C12] hover:bg-[#E67E22] text-white rounded-lg font-medium"
                  >
                    Tiklash
                  </button>
                </div>
              </div>
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
