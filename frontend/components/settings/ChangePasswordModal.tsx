'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, X, Lock, CheckCircle } from 'lucide-react';
import { apiClient } from '@/lib/api/client';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

function getPasswordStrength(password: string) {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  const levels = [
    { score: 0, label: '', color: '' },
    { score: 1, label: 'Juda zaif', color: '#E74C3C' },
    { score: 2, label: 'Zaif', color: '#E67E22' },
    { score: 3, label: "O'rtacha", color: '#F39C12' },
    { score: 4, label: 'Kuchli', color: '#27AE60' },
    { score: 5, label: 'Juda kuchli', color: '#1ABC9C' },
  ];
  return levels[Math.min(score, 5)];
}

export function ChangePasswordModal({ isOpen, onClose }: Props) {
  const [form, setForm] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [show, setShow] = useState({ current: false, new: false, confirm: false });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const strength = getPasswordStrength(form.new_password);

  const validate = () => {
    if (!form.current_password) return 'Joriy parolni kiriting';
    if (form.new_password.length < 8) return 'Yangi parol kamida 8 ta belgi';
    if (!/[A-Z]/.test(form.new_password)) return 'Kamida 1 ta katta harf kerak';
    if (!/[0-9]/.test(form.new_password)) return 'Kamida 1 ta raqam kerak';
    if (form.new_password !== form.confirm_password) return 'Parollar mos emas';
    if (form.current_password === form.new_password)
      return 'Yangi parol eskisidan farq qilishi kerak';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const v = validate();
    if (v) {
      setError(v);
      return;
    }
    setLoading(true);
    setError('');
    try {
      await apiClient.post('/users/change-password/', {
        current_password: form.current_password,
        new_password: form.new_password,
      });
      setSuccess(true);
      setTimeout(() => {
        onClose();
        setSuccess(false);
        setForm({ current_password: '', new_password: '', confirm_password: '' });
      }, 2000);
    } catch (err: any) {
      setError(
        err.response?.data?.current_password?.[0] ||
          err.response?.data?.new_password?.[0] ||
          err.response?.data?.detail ||
          'Xatolik yuz berdi'
      );
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
            className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', duration: 0.4 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                    <Lock className="w-5 h-5 text-[#1A56A0]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#0D3B6E]">Parolni o&apos;zgartirish</h3>
                    <p className="text-xs text-gray-500">Xavfsiz parol tanlang</p>
                  </div>
                </div>
                <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {success ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-8"
                >
                  <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-3" />
                  <p className="font-semibold text-gray-800">
                    Parol muvaffaqiyatli o&apos;zgartirildi!
                  </p>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Joriy parol
                    </label>
                    <div className="relative">
                      <input
                        type={show.current ? 'text' : 'password'}
                        value={form.current_password}
                        onChange={(e) =>
                          setForm((p) => ({ ...p, current_password: e.target.value }))
                        }
                        className="w-full px-4 py-2.5 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A56A0]"
                        placeholder="Joriy parolingiz"
                      />
                      <button
                        type="button"
                        onClick={() => setShow((p) => ({ ...p, current: !p.current }))}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                      >
                        {show.current ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Yangi parol
                    </label>
                    <div className="relative">
                      <input
                        type={show.new ? 'text' : 'password'}
                        value={form.new_password}
                        onChange={(e) => setForm((p) => ({ ...p, new_password: e.target.value }))}
                        className="w-full px-4 py-2.5 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A56A0]"
                        placeholder="Kamida 8 belgi"
                      />
                      <button
                        type="button"
                        onClick={() => setShow((p) => ({ ...p, new: !p.new }))}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                      >
                        {show.new ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {form.new_password && (
                      <div className="mt-2">
                        <div className="flex gap-1 mb-1">
                          {[1, 2, 3, 4, 5].map((i) => (
                            <div
                              key={i}
                              className="h-1 flex-1 rounded-full transition-colors"
                              style={{
                                backgroundColor:
                                  i <= strength.score ? strength.color : '#E5E7EB',
                              }}
                            />
                          ))}
                        </div>
                        <p className="text-xs" style={{ color: strength.color }}>
                          {strength.label}
                        </p>
                      </div>
                    )}
                    <div className="mt-2 space-y-1">
                      {[
                        { check: form.new_password.length >= 8, text: 'Kamida 8 ta belgi' },
                        { check: /[A-Z]/.test(form.new_password), text: 'Kamida 1 ta katta harf' },
                        { check: /[0-9]/.test(form.new_password), text: 'Kamida 1 ta raqam' },
                      ].map(({ check, text }) => (
                        <p
                          key={text}
                          className={`text-xs flex items-center gap-1 ${
                            check ? 'text-green-600' : 'text-gray-400'
                          }`}
                        >
                          <span>{check ? '✓' : '○'}</span> {text}
                        </p>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Yangi parolni tasdiqlang
                    </label>
                    <div className="relative">
                      <input
                        type={show.confirm ? 'text' : 'password'}
                        value={form.confirm_password}
                        onChange={(e) =>
                          setForm((p) => ({ ...p, confirm_password: e.target.value }))
                        }
                        className={`w-full px-4 py-2.5 pr-10 border rounded-lg focus:outline-none focus:ring-2 ${
                          form.confirm_password &&
                          form.confirm_password !== form.new_password
                            ? 'border-red-300 focus:ring-red-200'
                            : 'border-gray-300 focus:ring-[#1A56A0]'
                        }`}
                        placeholder="Yangi parolni qaytaring"
                      />
                      <button
                        type="button"
                        onClick={() => setShow((p) => ({ ...p, confirm: !p.confirm }))}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                      >
                        {show.confirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {form.confirm_password && form.confirm_password !== form.new_password && (
                      <p className="text-xs text-red-500 mt-1">Parollar mos emas</p>
                    )}
                  </div>

                  {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                      {error}
                    </div>
                  )}

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={onClose}
                      className="flex-1 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                    >
                      Bekor qilish
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 py-2.5 bg-[#1A56A0] text-white rounded-lg hover:bg-[#0D3B6E] disabled:opacity-50"
                    >
                      {loading ? 'Saqlanmoqda...' : 'Saqlash'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
