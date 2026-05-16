'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Lock,
  Eye,
  EyeOff,
  Loader2,
  CheckCircle,
  AlertCircle,
  Shield,
  ArrowLeft,
} from 'lucide-react';

export default function AdminResetPasswordPage() {
  const params = useParams<{ uid: string; token: string }>();
  const router = useRouter();

  const [pwd, setPwd] = useState('');
  const [confirm, setConfirm] = useState('');
  const [show, setShow] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const rules = [
    { ok: pwd.length >= 8, text: 'Kamida 8 ta belgi' },
    { ok: /[A-Z]/.test(pwd), text: 'Kamida 1 ta katta harf' },
    { ok: /[0-9]/.test(pwd), text: 'Kamida 1 ta raqam' },
    { ok: !!confirm && pwd === confirm, text: 'Parollar mos' },
  ];

  const allOk = rules.every((r) => r.ok);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!allOk) {
      setError('Iltimos, barcha shartlarni bajaring');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/admin/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: params.uid,
          token: params.token,
          new_password: pwd,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const fieldErr =
          (Array.isArray(data?.new_password) && data.new_password[0]) ||
          data?.detail ||
          data?.error;
        setError(fieldErr || 'Xatolik yuz berdi');
        setLoading(false);
        return;
      }
      setSuccess(true);
      setTimeout(() => router.push('/admin/login'), 2500);
    } catch {
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
          <h1 className="text-2xl font-bold text-[#0D3B6E] text-center">Yangi parol o&apos;rnatish</h1>
          <p className="text-sm text-gray-500 text-center mt-1">
            Xavfsiz parol tanlang va saqlang.
          </p>

          {success ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-8 text-center"
            >
              <CheckCircle className="w-14 h-14 text-green-500 mx-auto mb-3" />
              <p className="font-semibold text-gray-800">Parol yangilandi!</p>
              <p className="text-sm text-gray-500 mt-2">
                Endi yangi parol bilan tizimga kirishingiz mumkin.
              </p>
              <p className="text-xs text-gray-400 mt-3">Login sahifasiga yo&apos;naltirilmoqda...</p>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Yangi parol
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type={show ? 'text' : 'password'}
                    value={pwd}
                    onChange={(e) => setPwd(e.target.value)}
                    placeholder="Yangi parol"
                    className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A56A0]"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShow((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Parolni tasdiqlang
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="Parolni qaytaring"
                    className={`w-full pl-10 pr-10 py-2.5 border rounded-lg focus:outline-none focus:ring-2 ${
                      confirm && confirm !== pwd
                        ? 'border-red-300 focus:ring-red-200'
                        : 'border-gray-300 focus:ring-[#1A56A0]'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {pwd && (
                <div className="space-y-1">
                  {rules.map(({ ok, text }) => (
                    <p
                      key={text}
                      className={`text-xs flex items-center gap-1.5 ${
                        ok ? 'text-green-600' : 'text-gray-400'
                      }`}
                    >
                      <span>{ok ? '✓' : '○'}</span> {text}
                    </p>
                  ))}
                </div>
              )}

              {error && (
                <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !allOk}
                className="w-full py-2.5 bg-[#1A56A0] text-white rounded-lg hover:bg-[#0D3B6E] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Saqlanmoqda...
                  </>
                ) : (
                  'Parolni yangilash'
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
