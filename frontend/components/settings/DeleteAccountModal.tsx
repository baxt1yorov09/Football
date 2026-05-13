'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { apiClient } from '@/lib/api/client';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  userPhone: string;
}

export function DeleteAccountModal({ isOpen, onClose, userPhone }: Props) {
  const router = useRouter();
  const [step, setStep] = useState<'warning' | 'confirm' | 'deleted'>('warning');
  const [inputPhone, setInputPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const normalizePhone = (phone: string) => phone.replace(/\D/g, '');

  const handleDelete = async () => {
    if (normalizePhone(inputPhone) !== normalizePhone(userPhone)) {
      setError('Telefon raqam mos emas');
      return;
    }
    setLoading(true);
    try {
      await apiClient.delete('/users/me/delete/');
      setStep('deleted');
      setTimeout(() => {
        localStorage.clear();
        router.push('/auth?account_deleted=true');
      }, 3000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm"
            onClick={step !== 'deleted' ? onClose : undefined}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {step === 'warning' && (
                <>
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
                        <AlertTriangle className="w-5 h-5 text-red-500" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">Hisobni o&apos;chirish</h3>
                        <p className="text-xs text-red-500">Bu amal qaytarib bo&apos;lmaydi</p>
                      </div>
                    </div>
                    <button onClick={onClose}>
                      <X className="w-5 h-5 text-gray-400" />
                    </button>
                  </div>

                  <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
                    <p className="text-sm font-medium text-red-800 mb-2">
                      O&apos;chiriladigan ma&apos;lumotlar:
                    </p>
                    <ul className="space-y-1">
                      {[
                        "Barcha shaxsiy ma'lumotlar",
                        'Arizalar tarixi',
                        'Litsenziyalar',
                        'Yuklangan hujjatlar',
                      ].map((item) => (
                        <li
                          key={item}
                          className="text-sm text-red-700 flex items-center gap-2"
                        >
                          <span className="w-1.5 h-1.5 bg-red-400 rounded-full" />
                          {item}
                        </li>
                      ))}
                    </ul>
                    <p className="text-xs text-red-600 mt-3 font-medium">
                      ⚠️ 30 kun ichida qayta tiklash mumkin. Undan keyin to&apos;liq o&apos;chadi.
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={onClose}
                      className="flex-1 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                    >
                      Bekor qilish
                    </button>
                    <button
                      onClick={() => setStep('confirm')}
                      className="flex-1 py-2.5 bg-red-500 text-white rounded-lg hover:bg-red-600"
                    >
                      Davom etish →
                    </button>
                  </div>
                </>
              )}

              {step === 'confirm' && (
                <>
                  <div className="mb-6">
                    <h3 className="font-semibold text-gray-900 mb-2">
                      Telefon raqamni tasdiqlang
                    </h3>
                    <p className="text-sm text-gray-600">
                      Tasdiqlash uchun ro&apos;yxatdan o&apos;tgan telefon raqamingizni kiriting:
                    </p>
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Telefon raqam
                    </label>
                    <input
                      type="tel"
                      value={inputPhone}
                      onChange={(e) => {
                        setInputPhone(e.target.value);
                        setError('');
                      }}
                      className={`w-full px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 ${
                        error
                          ? 'border-red-300 focus:ring-red-200'
                          : 'border-gray-300 focus:ring-red-200'
                      }`}
                      placeholder="+998 90 123 45 67"
                      autoFocus
                    />
                    {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => setStep('warning')}
                      className="flex-1 py-2.5 border border-gray-300 rounded-lg text-gray-700"
                    >
                      Orqaga
                    </button>
                    <button
                      onClick={handleDelete}
                      disabled={loading || !inputPhone}
                      className="flex-1 py-2.5 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50"
                    >
                      {loading ? "O'chirilmoqda..." : "Hisobni o'chirish"}
                    </button>
                  </div>
                </>
              )}

              {step === 'deleted' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-8"
                >
                  <div className="text-5xl mb-4">🗑️</div>
                  <p className="font-semibold text-gray-800 mb-2">Hisobingiz o&apos;chirildi</p>
                  <p className="text-sm text-gray-500">
                    30 kun ichida qayta tiklash mumkin.
                    <br />
                    Bosh sahifaga o&apos;tilmoqda...
                  </p>
                  <div className="mt-4 w-8 h-8 border-4 border-gray-300 border-t-red-400 rounded-full animate-spin mx-auto" />
                </motion.div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
