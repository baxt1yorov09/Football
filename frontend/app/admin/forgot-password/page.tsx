'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Mail, ArrowLeft, Loader2, CheckCircle, AlertCircle, Shield } from 'lucide-react';

export default function AdminForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email || !email.includes('@')) {
      setError('Yaroqli email kiriting');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/admin/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.detail || data.error || 'Xatolik yuz berdi');
        setLoading(false);
        return;
      }
      setSent(true);
    } catch (err) {
      setError("Server bilan bog'lanishda xatolik");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0D3B6E] via-[#1A56A0] to-[#2D7DD2] flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -left-20 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="relative w-full max-w-md"
      >
        <div className="bg-white rounded-3xl shadow-2xl p-8">
          <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-blue-50 mx-auto mb-4">
            <Shield className="w-7 h-7 text-[#1A56A0]" />
          </div>

          <h1 className="text-2xl font-bold text-[#0D3B6E] text-center">Parolni tiklash</h1>
          <p className="text-sm text-gray-500 text-center mt-1">
            Admin email manzilingizni kiriting — sizga parolni tiklash havolasini yuboramiz.
          </p>

          {sent ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-8 text-center"
            >
              <CheckCircle className="w-14 h-14 text-green-500 mx-auto mb-3" />
              <p className="font-semibold text-gray-800">Havola yuborildi!</p>
              <p className="text-sm text-gray-500 mt-2">
                Agar <span className="font-medium text-gray-700">{email}</span> tizimda mavjud
                bo&apos;lsa, parolni tiklash havolasi yuborildi. Email pochtangizni tekshiring
                (Spam papkasini ham).
              </p>
              <Link
                href="/admin/login"
                className="mt-6 inline-flex items-center gap-2 text-[#1A56A0] hover:text-[#0D3B6E] font-medium text-sm"
              >
                <ArrowLeft className="w-4 h-4" /> Login sahifasiga qaytish
              </Link>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email manzil
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="admin@uff.uz"
                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A56A0]"
                    autoFocus
                  />
                </div>
              </div>

              {error && (
                <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-[#1A56A0] text-white rounded-lg hover:bg-[#0D3B6E] disabled:opacity-60 flex items-center justify-center gap-2 transition-all"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Yuborilmoqda...
                  </>
                ) : (
                  'Tiklash havolasini yuborish'
                )}
              </button>

              <Link
                href="/admin/login"
                className="flex items-center justify-center gap-2 text-sm text-gray-600 hover:text-[#1A56A0] mt-2"
              >
                <ArrowLeft className="w-4 h-4" /> Login sahifasiga qaytish
              </Link>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  );
}
