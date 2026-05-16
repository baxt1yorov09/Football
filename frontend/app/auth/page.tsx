'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useSearchParams, useRouter } from 'next/navigation';
import { PhoneInput } from '@/components/auth/PhoneInput';
import { OTPInput } from '@/components/auth/OTPInput';
import { TwoFactorChallenge } from '@/components/auth/TwoFactorChallenge';
import { useAuth } from '@/hooks/useAuth';

export default function AuthPage() {
  const [step, setStep] = useState<'phone' | 'otp' | '2fa'>('phone');
  const [phone, setPhone] = useState('');
  const [twoFactorToken, setTwoFactorToken] = useState('');
  const { login, verify2FA, isAuthenticated } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect');

  // If already authenticated, redirect to target or dashboard
  useEffect(() => {
    if (isAuthenticated) {
      router.push(redirectUrl || '/dashboard');
    }
  }, [isAuthenticated, redirectUrl, router]);

  const handlePhoneSubmit = (phoneNumber: string) => {
    setPhone(phoneNumber);
    setStep('otp');
  };

  const handleOTPSubmit = async (code: string) => {
    const result: any = await login(phone, code);
    console.log('Login result:', result);

    if (!result?.success) return;

    // 2FA bosqichi kerak — TOTP/recovery kod so'raymiz
    if (result.requires2FA) {
      setTwoFactorToken(result.twoFactorToken);
      setStep('2fa');
      return;
    }

    if (result.isNewUser) {
      router.push('/onboarding');
    } else {
      router.push(redirectUrl || '/dashboard');
    }
  };

  const handle2FASubmit = async (code: string) => {
    const result = await verify2FA(twoFactorToken, code);
    if (result.success) {
      if (result.isNewUser) {
        router.push('/onboarding');
      } else {
        router.push(redirectUrl || '/dashboard');
      }
    }
    return result;
  };

  const handleResendOTP = () => {
    // Resend OTP
    console.log('Resending OTP to', phone);
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
            <div className="w-14 h-14 bg-[#F39C12] rounded-2xl flex items-center justify-center">
              <span className="text-2xl font-bold text-white">UFF</span>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-white">
            O&apos;zbekiston Futbol Federatsiyasi
          </h1>
          <p className="text-white/70 mt-2">Murabbiy litsenziya tizimi</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* Progress indicator */}
          <div className="flex">
            {['phone', 'otp', '2fa'].map((s, i) => (
              <div
                key={s}
                className={`flex-1 h-1 transition-colors duration-300 ${
                  ['phone', 'otp', '2fa'].indexOf(step) >= i
                    ? 'bg-[#F39C12]'
                    : 'bg-gray-200'
                }`}
              />
            ))}
          </div>

          <div className="p-8">
            {step === 'phone' && (
              <PhoneInput onSubmit={handlePhoneSubmit} />
            )}

            {step === 'otp' && (
              <OTPInput
                phone={phone}
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
          © 2026 O&apos;zbekiston Futbol Federatsiyasi
        </p>
      </motion.div>
    </div>
  );
}
