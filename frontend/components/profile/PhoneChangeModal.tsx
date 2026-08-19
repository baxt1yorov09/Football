'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Phone, X, CheckCircle, Mail } from 'lucide-react';
import { apiClient } from '@/lib/api/client';

interface Props {
  isOpen: boolean;
  currentPhone: string;
  currentEmail?: string;
  onClose: () => void;
  onSuccess: (newPhone: string) => void;
}

const VALID_PREFIXES = ['90','91','93','94','95','97','98','99','88','71','77','78'];

export function PhoneChangeModal({ isOpen, currentPhone, currentEmail, onClose, onSuccess }: Props) {
  const [step, setStep] = useState<'input' | 'otp' | 'success'>('input');
  const [newPhone, setNewPhone] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [emailMasked, setEmailMasked] = useState('');
  const inputs = useRef<(HTMLInputElement | null)[]>([]);
  const timerRef = useRef<NodeJS.Timeout>();

  const formatPhone = (raw: string) => {
    const digits = raw.replace(/\D/g, '').slice(0, 9);
    if (digits.length > 7) return `${digits.slice(0,2)} ${digits.slice(2,5)} ${digits.slice(5,7)} ${digits.slice(7)}`;
    if (digits.length > 5) return `${digits.slice(0,2)} ${digits.slice(2,5)} ${digits.slice(5)}`;
    if (digits.length > 2) return `${digits.slice(0,2)} ${digits.slice(2)}`;
    return digits;
  };

  const startTimer = () => {
    setTimer(60);
    timerRef.current = setInterval(() => {
      setTimer(t => { if (t <= 1) { clearInterval(timerRef.current); return 0; } return t - 1; });
    }, 1000);
  };

  const sendOtp = async () => {
    const digits = newPhone.replace(/\D/g, '');
    if (digits.length !== 9) { setError('9 ta raqam kiriting'); return; }
    const prefix = digits.slice(0, 2);
    if (!VALID_PREFIXES.includes(prefix)) { setError('Noto\'g\'ri operator'); return; }
    if ('+998' + digits === currentPhone.replace(/\s/g, '')) {
      setError('Yangi raqam joriy raqamdan farq qilishi kerak');
      return;
    }
    if (!currentEmail) {
      setError('Tasdiqlash kodini yuborish uchun profilingizda email manzil bo\'lishi kerak');
      return;
    }

    setLoading(true);
    setError('');
    try {
      // Tasdiqlash kodi SMS orqali emas, joriy hisobga bog'langan
      // emailga yuboriladi (SMS xizmati hozircha ishonchli ishlamaydi).
      const res = await apiClient.post('/auth/send-otp', {
        phone: '+998' + digits,
        email: currentEmail,
      });
      if (res.data.email_error) {
        setError(res.data.email_error);
        return;
      }
      setEmailMasked(res.data.email_masked || '');
      setStep('otp');
      startTimer();
    } catch (err: any) {
      setError(err.response?.data?.error || err.response?.data?.detail || 'Kod yuborishda xatolik');
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (overrideOtp?: string[]) => {
    const code = (overrideOtp ?? otp).join('');
    if (code.length < 6) { setError('6 ta raqam kiriting'); return; }

    setLoading(true);
    setError('');
    try {
      await apiClient.post('/users/change-phone/', {
        new_phone: '+998' + newPhone.replace(/\D/g, ''),
        otp: code,
      });
      setStep('success');
      setTimeout(() => {
        onSuccess('+998' + newPhone.replace(/\D/g, ''));
      }, 1500);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Noto\'g\'ri kod');
      setOtp(['', '', '', '', '', '']);
      inputs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleOtpInput = (i: number, value: string) => {
    const v = value.replace(/\D/g, '').slice(-1);
    const newOtp = [...otp];
    newOtp[i] = v;
    setOtp(newOtp);
    if (v && i < 5) inputs.current[i + 1]?.focus();
    if (newOtp.every(c => c)) verifyOtp(newOtp);
  };

  const handleClose = () => {
    setStep('input');
    setNewPhone('');
    setOtp(['', '', '', '', '', '']);
    setError('');
    setEmailMasked('');
    clearInterval(timerRef.current);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm" onClick={handleClose} />

          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4">

            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>

              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center">
                    <Phone className="w-4 h-4 text-[#1A56A0]" />
                  </div>
                  <h3 className="font-semibold text-[#0D3B6E]">Telefon o'zgartirish</h3>
                </div>
                <button onClick={handleClose}><X className="w-5 h-5 text-gray-400" /></button>
              </div>

              {step === 'input' && (
                <div className="space-y-4">
                  <p className="text-sm text-gray-600">Yangi telefon raqamingizni kiriting:</p>
                  <div className="flex border border-gray-300 rounded-lg overflow-hidden focus-within:border-[#1A56A0] focus-within:ring-2 focus-within:ring-blue-100">
                    <span className="bg-gray-50 px-3 flex items-center text-sm text-gray-500 border-r border-gray-300">
                      +998
                    </span>
                    <input type="tel" value={newPhone}
                      onChange={e => { setNewPhone(formatPhone(e.target.value)); setError(''); }}
                      className="flex-1 px-3 py-2.5 text-sm outline-none bg-white"
                      placeholder="90 123 45 67" autoFocus />
                  </div>
                  <p className="text-xs text-gray-400 flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5" />
                    Tasdiqlash kodi emailingizga yuboriladi{currentEmail ? ` (${currentEmail})` : ''}
                  </p>
                  {error && <p className="text-xs text-red-500">{error}</p>}
                  <button onClick={sendOtp} disabled={loading}
                    className="w-full py-2.5 bg-[#1A56A0] text-white rounded-lg text-sm font-medium
                               hover:bg-[#0D3B6E] disabled:opacity-50">
                    {loading ? 'Yuborilmoqda...' : 'Kod yuborish →'}
                  </button>
                </div>
              )}

              {step === 'otp' && (
                <div className="space-y-4">
                  <p className="text-sm text-gray-600 text-center">
                    Tasdiqlash kodi {emailMasked || 'emailingizga'} yuborildi
                  </p>
                  <div className="flex gap-2 justify-center">
                    {otp.map((digit, i) => (
                      <input key={i} ref={el => { inputs.current[i] = el; }}
                        type="tel" maxLength={1} value={digit}
                        onChange={e => handleOtpInput(i, e.target.value)}
                        onKeyDown={e => { if (e.key === 'Backspace' && !digit && i > 0) inputs.current[i-1]?.focus(); }}
                        className={`w-10 h-12 text-center text-lg font-bold border-2 rounded-xl outline-none transition-all
                          ${digit ? 'border-[#1A56A0] bg-blue-50' : 'border-gray-200'}
                          focus:border-[#1A56A0]`}
                      />
                    ))}
                  </div>
                  {error && <p className="text-xs text-red-500 text-center">{error}</p>}
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{timer > 0 ? `${timer}s da qayta yuborish` : ''}</span>
                    <button onClick={() => { setStep('input'); setOtp(['','','','','','']); }}
                      className="text-[#1A56A0] hover:underline">
                      Raqamni o'zgartirish
                    </button>
                  </div>
                  {timer === 0 && (
                    <button onClick={sendOtp} disabled={loading}
                      className="w-full py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
                      Qayta yuborish
                    </button>
                  )}
                </div>
              )}

              {step === 'success' && (
                <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-6">
                  <CheckCircle className="w-14 h-14 text-green-500 mx-auto mb-3" />
                  <p className="font-semibold text-gray-800">Telefon yangilandi!</p>
                  <p className="text-sm text-gray-500 mt-1">+998 {newPhone}</p>
                </motion.div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
