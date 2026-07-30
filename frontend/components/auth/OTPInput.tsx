'use client';

import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface OTPInputProps {
  phone: string;
  emailMasked?: string;
  onSubmit: (code: string) => void;
  onResend: () => void;
  onBack: () => void;
}

export function OTPInput({ phone, emailMasked, onSubmit, onResend, onBack }: OTPInputProps) {
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(60);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Timer countdown
  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  const handleChange = (index: number, value: string) => {
    if (value.length > 1) return; // Only allow single digit
    if (!/^\d*$/.test(value)) return; // Only allow digits

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);
    setError('');

    // Auto-submit when all digits entered
    if (value && index === 5) {
      const fullCode = [...newCode.slice(0, 5), value].join('');
      if (fullCode.length === 6) {
        handleSubmit(fullCode);
      }
    }

    // Move to next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = async (fullCode: string) => {
    if (fullCode.length !== 6) {
      setError('6 ta raqam kiritish majburiy');
      return;
    }

    setLoading(true);
    try {
      await onSubmit(fullCode);
    } catch (err: any) {
      setError(err.response?.data?.error || "Noto'g'ri kod");
      // Shake animation
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = () => {
    onResend();
    setTimer(60);
    setCode(['', '', '', '', '', '']);
    setError('');
    inputRefs.current[0]?.focus();
  };

  const formatPhone = (phone: string) => {
    return phone.replace(/(\+998)(\d{2})(\d{3})(\d{2})(\d{2})/, '$1 $2 $3-$4-$5');
  };

  return (
    <div>
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-gray-500 hover:text-[#1A56A0] mb-4 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Orqaga
      </button>

      <h2 className="text-xl font-bold text-[#0D3B6E] mb-2">
        Tasdiqlash kodini kiriting
      </h2>
      <p className="text-gray-600 text-sm mb-6">
        {emailMasked
          ? <>Kod <span className="font-semibold">{emailMasked}</span> manziliga yuborildi</>
          : <>{formatPhone(phone)} raqamiga kod yuborildi</>}
      </p>

      {/* OTP Boxes */}
      <div className="flex justify-center gap-3 mb-6">
        {code.map((digit, index) => (
          <motion.input
            key={index}
            ref={(el) => { inputRefs.current[index] = el; }}
            type="text"
            inputMode="numeric"
            maxLength={1}
            value={digit}
            onChange={(e) => handleChange(index, e.target.value)}
            onKeyDown={(e) => handleKeyDown(index, e)}
            className={`w-12 h-14 text-center text-2xl font-bold border-2 rounded-lg focus:outline-none focus:border-[#F39C12] transition-colors ${
              error ? 'border-red-500 bg-red-50' : 'border-gray-200'
            }`}
            whileFocus={{ scale: 1.05 }}
          />
        ))}
      </div>

      {error && (
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-red-500 text-sm text-center mb-4"
        >
          {error}
        </motion.p>
      )}

      {loading && (
        <div className="flex justify-center mb-4">
          <Loader2 className="w-6 h-6 animate-spin text-[#F39C12]" />
        </div>
      )}

      {/* Resend code */}
      <div className="text-center">
        {timer > 0 ? (
          <p className="text-gray-500 text-sm">
            Kodni qayta yuborish:{' '}
            <span className="font-semibold text-[#F39C12]">
              00:{timer.toString().padStart(2, '0')}
            </span>
          </p>
        ) : (
          <button
            onClick={handleResend}
            className="flex items-center gap-2 mx-auto text-[#1A56A0] hover:text-[#F39C12] transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Kodni qayta yuborish
          </button>
        )}
      </div>
    </div>
  );
}

export default OTPInput;
