'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { saveAdminTokens } from '@/lib/adminAuth';
import { apiClient } from '@/lib/api/client';

export default function AdminLoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '/admin/dashboard';
  const errorParam = searchParams.get('error');

  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Allaqachon login bo'lgan bo'lsa — to'g'ridan redirect
  useEffect(() => {
    const token = localStorage.getItem('adminAccessToken');
    const user = localStorage.getItem('adminUser');
    if (token && user) {
      router.replace(redirect);
    }
  }, []);

  // URL dagi error parametrini ko'rsatish
  useEffect(() => {
    if (errorParam === 'session_expired') {
      setError('Sessiya muddati tugadi. Qayta kiring.');
    } else if (errorParam === 'no_permission') {
      setError('Sizda admin huquqi yo\'q.');
    }
  }, [errorParam]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await apiClient.post('/admin/auth/login/', {
        email: form.email.trim().toLowerCase(),
        password: form.password,
      });

      const { access, refresh, user } = res.data;

      // Token va user ni saqlash (cookie + localStorage)
      saveAdminTokens(access, refresh, user);

      // Rol bo'yicha redirect
      router.replace(redirect);

    } catch (err: any) {
      const status = err.response?.status;
      const data = err.response?.data;

      if (status === 401) {
        setError('❌ Kirish taqiqlangan: Email yoki parol noto\'g\'ri');
      } else if (status === 403) {
        setError(data?.detail || 'Sizda admin huquqi yo\'q.');
      } else if (status === 0 || !status) {
        setError('Server bilan bog\'lanib bo\'lmadi.');
      } else {
        setError(data?.detail || data?.error || 'Xatolik yuz berdi.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0D3B6E] to-[#1A56A0] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md"
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-[#0D3B6E] rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4 shadow-lg">
            ⚽
          </div>
          <h1 className="text-2xl font-bold text-[#0D3B6E]">Admin Panel</h1>
          <p className="text-gray-500 text-sm mt-1">
            O'zbekiston Futbol Federatsiyasi
          </p>
        </div>

        {/* Xato xabar */}
        {error && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2"
          >
            <span>⚠️</span> {error}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email manzil
            </label>
            <input
              type="email"
              value={form.email}
              onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg
                         focus:outline-none focus:ring-2 focus:ring-[#1A56A0]
                         focus:border-transparent transition-all"
              placeholder="admin@uff.uz"
              required
              autoFocus
              autoComplete="email"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Parol
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                className="w-full px-4 py-2.5 pr-12 border border-gray-300 rounded-lg
                           focus:outline-none focus:ring-2 focus:ring-[#1A56A0]
                           focus:border-transparent transition-all"
                placeholder="•••••••"
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(p => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400
                           hover:text-gray-600 text-sm"
              >
                {showPassword ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !form.email || !form.password}
            className="w-full py-3 bg-[#1A56A0] hover:bg-[#0D3B6E] text-white
                       font-semibold rounded-lg transition-all duration-200
                       disabled:opacity-50 disabled:cursor-not-allowed
                       flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Tekshirilmoqda...
              </>
            ) : (
              'Kirish →'
            )}
          </button>
        </form>

        <p className="text-center text-xs text-gray-400 mt-6">
          Faqat federatsiya xodimlari uchun
        </p>
      </motion.div>
    </div>
  );
}
