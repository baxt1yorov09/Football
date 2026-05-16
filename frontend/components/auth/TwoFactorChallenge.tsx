'use client';

import { useState, useRef, useEffect } from 'react';
import { Shield, ChevronLeft, KeyRound, Loader2 } from 'lucide-react';

interface Props {
  onSubmit: (code: string) => Promise<{ success: boolean; error?: string }>;
  onBack: () => void;
}

/**
 * OTP'dan keyingi 2FA bosqichi.
 * Foydalanuvchi Google Authenticator'dagi 6 raqamli kod yoki
 * zaxira (recovery) kodini kiritadi.
 */
export function TwoFactorChallenge({ onSubmit, onBack }: Props) {
  const [mode, setMode] = useState<'totp' | 'recovery'>('totp');
  const [totp, setTotp] = useState(['', '', '', '', '', '']);
  const [recovery, setRecovery] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (mode === 'totp') {
      inputs.current[0]?.focus();
    }
  }, [mode]);

  const submit = async (code: string) => {
    setLoading(true);
    setError('');
    const res = await onSubmit(code);
    if (!res.success) {
      setError(res.error || "Noto'g'ri kod");
      if (mode === 'totp') {
        setTotp(['', '', '', '', '', '']);
        inputs.current[0]?.focus();
      }
    }
    setLoading(false);
  };

  const handleTotpInput = (index: number, value: string) => {
    const v = value.replace(/\D/g, '').slice(-1);
    const next = [...totp];
    next[index] = v;
    setTotp(next);
    if (v && index < 5) inputs.current[index + 1]?.focus();
    if (next.every((c) => c) && next.join('').length === 6) {
      submit(next.join(''));
    }
  };

  const handleRecoverySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (recovery.trim().length < 4) {
      setError('Recovery kodni to\'liq kiriting');
      return;
    }
    submit(recovery.trim());
  };

  return (
    <div className="space-y-5">
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
      >
        <ChevronLeft className="w-4 h-4" />
        Orqaga
      </button>

      <div className="text-center">
        <div className="inline-flex w-12 h-12 bg-blue-50 rounded-2xl items-center justify-center mb-3">
          <Shield className="w-6 h-6 text-[#1A56A0]" />
        </div>
        <h2 className="text-xl font-bold text-[#0D3B6E]">
          Ikki bosqichli tekshiruv
        </h2>
        <p className="text-sm text-gray-600 mt-1">
          {mode === 'totp'
            ? 'Authenticator ilovasidagi 6 raqamli kodni kiriting'
            : 'Zaxira (recovery) kodingizni kiriting'}
        </p>
      </div>

      {mode === 'totp' ? (
        <div className="flex gap-2 justify-center">
          {totp.map((digit, i) => (
            <input
              key={i}
              ref={(el) => {
                inputs.current[i] = el;
              }}
              type="tel"
              maxLength={1}
              value={digit}
              onChange={(e) => handleTotpInput(i, e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Backspace' && !digit && i > 0)
                  inputs.current[i - 1]?.focus();
              }}
              disabled={loading}
              className={`w-12 h-14 text-center text-xl font-bold border-2 rounded-xl outline-none transition-colors ${
                digit ? 'border-[#1A56A0] bg-blue-50' : 'border-gray-300'
              } focus:border-[#1A56A0] disabled:opacity-50`}
            />
          ))}
        </div>
      ) : (
        <form onSubmit={handleRecoverySubmit} className="space-y-3">
          <input
            type="text"
            value={recovery}
            onChange={(e) => setRecovery(e.target.value.toUpperCase())}
            placeholder="XXXX-XXXX"
            disabled={loading}
            className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl text-center font-mono text-lg tracking-wider focus:border-[#1A56A0] focus:outline-none disabled:opacity-50"
            autoFocus
          />
          <button
            type="submit"
            disabled={loading || !recovery.trim()}
            className="w-full py-3 bg-[#1A56A0] text-white rounded-lg hover:bg-[#0D3B6E] disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Tasdiqlash
          </button>
        </form>
      )}

      {error && (
        <p className="text-sm text-red-500 text-center">{error}</p>
      )}
      {loading && mode === 'totp' && (
        <p className="text-sm text-gray-500 text-center">Tekshirilmoqda...</p>
      )}

      <div className="pt-3 border-t border-gray-100 text-center">
        <button
          onClick={() => {
            setMode(mode === 'totp' ? 'recovery' : 'totp');
            setError('');
            setTotp(['', '', '', '', '', '']);
            setRecovery('');
          }}
          className="inline-flex items-center gap-1.5 text-sm text-[#1A56A0] hover:underline"
        >
          <KeyRound className="w-4 h-4" />
          {mode === 'totp'
            ? 'Telefoningiz yo\'qmi? Recovery kod bilan kiring'
            : 'Authenticator kodi bilan kirish'}
        </button>
      </div>
    </div>
  );
}
