'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { apiClient } from '@/lib/api/client';
import { useUserStore } from '@/store/userStore';
import { Step1Name } from '@/components/onboarding/Step1Name';
import { Step2Personal } from '@/components/onboarding/Step2Personal';
import { Step3Work } from '@/components/onboarding/Step3Work';
import { Step4Region } from '@/components/onboarding/Step4Region';
import { OnboardingSuccess } from '@/components/onboarding/OnboardingSuccess';

const STEPS = [
  { id: 1, title: 'Ismingiz', subtitle: "To'liq ismingizni kiriting" },
  { id: 2, title: 'Shaxsiy', subtitle: "Tug'ilgan sana va jinsingiz" },
  { id: 3, title: 'Kasb', subtitle: "Ish joyingiz va tajribangiz" },
  { id: 4, title: 'Manzil', subtitle: "Hududingizni tanlang" },
];

interface OnboardingData {
  first_name: string;
  last_name: string;
  middle_name: string;
  birth_date: string;
  gender: 'male' | 'female' | '';
  email: string;
  workplace: string;
  job_title: string;
  coaching_years: number;
  region: number | null;
}

const INITIAL: OnboardingData = {
  first_name: '',
  last_name: '',
  middle_name: '',
  birth_date: '',
  gender: '',
  email: '',
  workplace: '',
  job_title: '',
  coaching_years: 0,
  region: null,
};

export default function OnboardingPage() {
  const router = useRouter();
  const { setUser } = useUserStore();
  const [step, setStep] = useState(1);
  const [data, setData] = useState<OnboardingData>(INITIAL);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDone, setIsDone] = useState(false);
  const [direction, setDirection] = useState(1);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) router.push('/auth');
  }, [router]);

  const update = (fields: Partial<OnboardingData>) => {
    setData(prev => ({ ...prev, ...fields }));
  };

  const goNext = (fields: Partial<OnboardingData>) => {
    update(fields);
    setDirection(1);
    if (step < STEPS.length) setStep(s => s + 1);
  };

  const goBack = () => {
    setDirection(-1);
    setStep(s => s - 1);
  };

  const handleSubmit = async (finalFields: Partial<OnboardingData>) => {
    const final = { ...data, ...finalFields };
    setIsSubmitting(true);
    try {
      const res = await apiClient.post('/users/onboarding/complete', final);
      setUser(res.data.user);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      
      // Set cookies for middleware (same tokens from login)
      const accessToken = localStorage.getItem('accessToken');
      const refreshToken = localStorage.getItem('refreshToken');
      if (accessToken) {
        document.cookie = `accessToken=${accessToken}; path=/; max-age=900`; // 15 min
      }
      if (refreshToken) {
        document.cookie = `refreshToken=${refreshToken}; path=/; max-age=2592000`; // 30 days
      }
      
      setIsDone(true);
      setTimeout(() => router.push('/dashboard'), 2500);
    } catch (err: any) {
      console.error('Onboarding error:', err.response?.data);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isDone) return <OnboardingSuccess name={data.first_name} />;

  const progress = (step / STEPS.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0D3B6E] via-[#1A56A0] to-[#2D9CDB] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 text-white">
            <span className="text-3xl">⚽</span>
            <div className="text-left">
              <p className="text-xs opacity-70">O'zbekiston Murabbiylar ta'limi</p>
              <p className="font-semibold">Murabbiy Litsenziya Tizimi</p>
            </div>
          </div>
        </div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-2xl overflow-hidden"
        >
          {/* Progress bar */}
          <div className="h-1 bg-gray-100">
            <motion.div
              className="h-full bg-gradient-to-r from-[#1A56A0] to-[#2D9CDB]"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            />
          </div>

          {/* Step header */}
          <div className="px-6 pt-5 pb-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-400 font-medium">
                {step} / {STEPS.length} bosqich
              </span>
              <div className="flex gap-1">
                {STEPS.map(s => (
                  <div key={s.id}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      s.id < step ? 'w-6 bg-green-400' :
                      s.id === step ? 'w-6 bg-[#1A56A0]' :
                      'w-6 bg-gray-200'
                    }`}
                  />
                ))}
              </div>
            </div>
            <h2 className="text-xl font-bold text-[#0D3B6E]">
              {STEPS[step - 1].title}
            </h2>
            <p className="text-sm text-gray-500">{STEPS[step - 1].subtitle}</p>
          </div>

          {/* Step content */}
          <div className="px-6 pb-6 pt-4 overflow-hidden">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={step}
                custom={direction}
                variants={{
                  enter: (d: number) => ({ x: d > 0 ? 60 : -60, opacity: 0 }),
                  center: { x: 0, opacity: 1 },
                  exit: (d: number) => ({ x: d > 0 ? -60 : 60, opacity: 0 }),
                }}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.25, ease: 'easeInOut' }}
              >
                {step === 1 && (
                  <Step1Name data={data} onNext={goNext} />
                )}
                {step === 2 && (
                  <Step2Personal data={data} onNext={goNext} onBack={goBack} />
                )}
                {step === 3 && (
                  <Step3Work data={data} onNext={goNext} onBack={goBack} />
                )}
                {step === 4 && (
                  <Step4Region
                    data={data}
                    onSubmit={handleSubmit}
                    onBack={goBack}
                    isSubmitting={isSubmitting}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Footer */}
        <p className="text-center text-white/50 text-xs mt-4">
          Ma'lumotlaringiz xavfsiz saqlanadi 🔒
        </p>
      </div>
    </div>
  );
}
