'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, X, CheckCircle, Copy, Download, AlertTriangle } from 'lucide-react';
import { apiClient } from '@/lib/api/client';

interface Props {
  isOpen: boolean;
  isEnabled: boolean;
  onClose: () => void;
  onSuccess: (enabled: boolean) => void;
}

export function TwoFactorModal({ isOpen, isEnabled, onClose, onSuccess }: Props) {
  const [step, setStep] = useState<'info' | 'qr' | 'verify' | 'recovery' | 'success'>('info');
  const [qrCode, setQrCode] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [recoveryCodes, setRecoveryCodes] = useState<string[]>([]);
  const [recoveryAck, setRecoveryAck] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (isOpen) {
      setStep(isEnabled ? 'verify' : 'info');
      setCode(['', '', '', '', '', '']);
      setRecoveryCodes([]);
      setRecoveryAck(false);
      setCopied(false);
      setError('');
    }
  }, [isOpen, isEnabled]);

  const copyRecoveryCodes = () => {
    const text = recoveryCodes.join('\n');
    navigator.clipboard?.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const downloadRecoveryCodes = () => {
    const text = [
      "UFA Murabbiy Tizimi — 2FA zaxira kodlari",
      "Bu kodlar maxfiy! Telefoningiz yo'qolsa kirish uchun ishlatiladi.",
      "Har bir kod faqat BIR MARTA ishlatiladi.",
      "",
      ...recoveryCodes,
    ].join('\n');
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ufa-2fa-recovery-codes-${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const finishWithRecoveryCodes = () => {
    setStep('success');
    setTimeout(() => {
      onSuccess(true);
      onClose();
    }, 1500);
  };

  const loadQR = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiClient.get('/users/2fa/setup/');
      setQrCode(res.data.qr_code);
      setSecretKey(res.data.secret);
      setStep('qr');
    } catch (e) {
      setError('QR kod yuklashda xatolik');
    } finally {
      setLoading(false);
    }
  };

  const handleCodeInput = (index: number, value: string) => {
    const v = value.replace(/\D/g, '').slice(-1);
    const newCode = [...code];
    newCode[index] = v;
    setCode(newCode);
    if (v && index < 5) inputs.current[index + 1]?.focus();
    if (newCode.every((c) => c) && newCode.join('').length === 6) {
      submitCode(newCode.join(''));
    }
  };

  const submitCode = async (full: string) => {
    setLoading(true);
    setError('');
    try {
      if (isEnabled) {
        await apiClient.post('/users/2fa/disable/', { code: full });
        setStep('success');
        setTimeout(() => {
          onSuccess(false);
          onClose();
        }, 1500);
      } else {
        const res = await apiClient.post('/users/2fa/verify/', { code: full });
        const codes: string[] = res.data?.recovery_codes || [];
        if (codes.length > 0) {
          setRecoveryCodes(codes);
          setStep('recovery');
        } else {
          // Recovery kodlar allaqachon yaratilgan — to'g'ridan-to'g'ri yakunlash
          setStep('success');
          setTimeout(() => {
            onSuccess(true);
            onClose();
          }, 1500);
        }
      }
    } catch (e: any) {
      const msg =
        e?.response?.data?.detail ||
        "Noto'g'ri kod. Qayta urinib ko'ring.";
      setError(msg);
      setCode(['', '', '', '', '', '']);
      inputs.current[0]?.focus();
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
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                    <Shield className="w-5 h-5 text-[#1A56A0]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#0D3B6E]">2FA</h3>
                    <p className="text-xs text-gray-500">
                      {isEnabled ? "O'chirishni tasdiqlang" : 'Hisobingizni himoyalang'}
                    </p>
                  </div>
                </div>
                <button onClick={onClose}>
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              {step === 'info' && !isEnabled && (
                <div className="space-y-4">
                  <div className="bg-blue-50 rounded-xl p-4 space-y-2">
                    {[
                      "Google Authenticator ilovasini telefonga o'rnating",
                      'QR kodni ilova orqali skanerlang',
                      "Ilova ko'rsatgan 6 raqamli kodni kiriting",
                    ].map((text, i) => (
                      <div key={i} className="flex items-start gap-3">
                        <span className="w-6 h-6 bg-[#1A56A0] text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                          {i + 1}
                        </span>
                        <p className="text-sm text-gray-700">{text}</p>
                      </div>
                    ))}
                  </div>
                  {error && <p className="text-sm text-red-500 text-center">{error}</p>}
                  <button
                    onClick={loadQR}
                    disabled={loading}
                    className="w-full py-3 bg-[#1A56A0] text-white rounded-lg hover:bg-[#0D3B6E] disabled:opacity-50"
                  >
                    {loading ? 'Yuklanmoqda...' : 'Boshlash →'}
                  </button>
                </div>
              )}

              {step === 'qr' && (
                <div className="space-y-4">
                  <div className="flex justify-center">
                    {qrCode ? (
                      <img
                        src={qrCode}
                        alt="QR Code"
                        className="w-48 h-48 border-2 border-gray-200 rounded-xl p-2"
                      />
                    ) : (
                      <div className="w-48 h-48 bg-gray-100 rounded-xl animate-pulse" />
                    )}
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-xs text-gray-500 mb-1">Qo&apos;lda kiritish uchun:</p>
                    <p className="font-mono text-sm text-gray-800 break-all select-all">
                      {secretKey}
                    </p>
                  </div>
                  <button
                    onClick={() => setStep('verify')}
                    className="w-full py-3 bg-[#1A56A0] text-white rounded-lg hover:bg-[#0D3B6E]"
                  >
                    Skanerlangan → Kodni kiriting
                  </button>
                </div>
              )}

              {step === 'verify' && (
                <div className="space-y-4">
                  <p className="text-sm text-gray-600 text-center">
                    {isEnabled
                      ? "2FA ni o'chirish uchun kodingizni kiriting"
                      : 'Google Authenticator kodini kiriting'}
                  </p>
                  <div className="flex gap-2 justify-center">
                    {code.map((digit, i) => (
                      <input
                        key={i}
                        ref={(el) => {
                          inputs.current[i] = el;
                        }}
                        type="tel"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleCodeInput(i, e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Backspace' && !digit && i > 0)
                            inputs.current[i - 1]?.focus();
                        }}
                        className={`w-11 h-14 text-center text-xl font-bold border-2 rounded-xl outline-none transition-colors ${
                          digit ? 'border-[#1A56A0] bg-blue-50' : 'border-gray-300'
                        } focus:border-[#1A56A0]`}
                      />
                    ))}
                  </div>
                  {error && <p className="text-sm text-red-500 text-center">{error}</p>}
                  {loading && (
                    <p className="text-sm text-gray-500 text-center">Tekshirilmoqda...</p>
                  )}
                </div>
              )}

              {step === 'recovery' && (
                <div className="space-y-4">
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-amber-900">
                      <p className="font-semibold mb-1">Bu kodlarni hozir saqlang!</p>
                      <p className="text-amber-800">
                        Telefoningiz yo'qolsa, bu kodlardan biri bilan kirishingiz mumkin.
                        Har bir kod faqat <strong>BIR MARTA</strong> ishlatiladi. Bu kodlar
                        bu yerda boshqa <strong>ko'rsatilmaydi</strong>.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 bg-gray-50 rounded-xl p-4 font-mono text-sm">
                    {recoveryCodes.map((c, i) => (
                      <div
                        key={c}
                        className="px-3 py-2 bg-white rounded-lg border border-gray-200 text-center select-all"
                      >
                        <span className="text-gray-400 mr-1.5 text-xs">{i + 1}.</span>
                        <span className="text-gray-900 font-semibold tracking-wider">{c}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={copyRecoveryCodes}
                      className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center justify-center gap-2"
                    >
                      <Copy className="w-4 h-4" />
                      {copied ? 'Nusxa olindi' : 'Nusxa olish'}
                    </button>
                    <button
                      onClick={downloadRecoveryCodes}
                      className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center justify-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Yuklab olish
                    </button>
                  </div>

                  <label className="flex items-start gap-2 text-sm text-gray-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={recoveryAck}
                      onChange={(e) => setRecoveryAck(e.target.checked)}
                      className="mt-0.5 w-4 h-4 accent-[#1A56A0]"
                    />
                    <span>Men kodlarni xavfsiz joyda saqladim va tushundim</span>
                  </label>

                  <button
                    onClick={finishWithRecoveryCodes}
                    disabled={!recoveryAck}
                    className="w-full py-3 bg-[#1A56A0] text-white rounded-lg hover:bg-[#0D3B6E] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Tugallash
                  </button>
                </div>
              )}

              {step === 'success' && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-8"
                >
                  <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-3" />
                  <p className="font-semibold text-gray-800">
                    {isEnabled ? "2FA o'chirildi" : '2FA muvaffaqiyatli yoqildi!'}
                  </p>
                </motion.div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
