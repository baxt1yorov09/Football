'use client';

import { useState } from 'react';

interface Props {
  data: any;
  onNext: (fields: any) => void;
  onBack: () => void;
}

export function Step2Personal({ data, onNext, onBack }: Props) {
  const [fields, setFields] = useState({
    birth_date: data.birth_date || '',
    gender: data.gender || '',
    email: data.email || '',
  });
  const [errors, setErrors] = useState<any>({});

  const validate = () => {
    const errs: any = {};
    if (!fields.birth_date) {
      errs.birth_date = "Tug'ilgan sanani kiriting";
    } else {
      const age = Math.floor((Date.now() - new Date(fields.birth_date).getTime()) / (365.25 * 24 * 3600 * 1000));
      if (age < 16) errs.birth_date = "Yosh 16 dan kam bo'lmasligi kerak";
      if (age > 80) errs.birth_date = "Noto'g'ri sana";
    }
    if (!fields.gender) errs.gender = 'Jinsni tanlang';
    if (fields.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email)) {
      errs.email = 'Email format noto\'g\'ri';
    }
    return errs;
  };

  const handleNext = () => {
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    onNext(fields);
  };

  const age = fields.birth_date
    ? Math.floor((Date.now() - new Date(fields.birth_date).getTime()) / (365.25 * 24 * 3600 * 1000))
    : null;

  return (
    <div className="space-y-4">
      {/* Tug'ilgan sana */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Tug'ilgan sana <span className="text-red-400">*</span>
        </label>
        <input
          type="date"
          value={fields.birth_date}
          max={new Date().toISOString().split('T')[0]}
          onChange={e => { setFields(p => ({ ...p, birth_date: e.target.value })); setErrors((p: any) => ({ ...p, birth_date: '' })); }}
          className={`w-full px-4 py-3 border rounded-xl text-sm outline-none transition-all ${
            errors.birth_date ? 'border-red-300 bg-red-50' : 'border-gray-200 focus:border-[#1A56A0] focus:ring-2 focus:ring-blue-100'
          }`}
        />
        {age && age >= 16 && age <= 80 && (
          <p className="text-xs text-gray-500 mt-1">Yoshingiz: {age} yosh</p>
        )}
        {errors.birth_date && <p className="text-xs text-red-500 mt-1">{errors.birth_date}</p>}
      </div>

      {/* Jins */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Jins <span className="text-red-400">*</span>
        </label>
        <div className="grid grid-cols-2 gap-3">
          {[
            { value: 'male', emoji: '👨', label: 'Erkak' },
            { value: 'female', emoji: '👩', label: 'Ayol' },
          ].map(opt => (
            <button key={opt.value} type="button"
              onClick={() => { setFields(p => ({ ...p, gender: opt.value })); setErrors((p: any) => ({ ...p, gender: '' })); }}
              className={`flex items-center justify-center gap-2 py-3 rounded-xl border-2 font-medium transition-all text-sm ${
                fields.gender === opt.value
                  ? 'border-[#1A56A0] bg-blue-50 text-[#1A56A0]'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
              <span className="text-lg">{opt.emoji}</span>
              {opt.label}
            </button>
          ))}
        </div>
        {errors.gender && <p className="text-xs text-red-500 mt-1">{errors.gender}</p>}
      </div>

      {/* Email */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Email manzil
          <span className="text-gray-400 font-normal ml-1">(ixtiyoriy)</span>
        </label>
        <input
          type="email"
          value={fields.email}
          onChange={e => { setFields(p => ({ ...p, email: e.target.value })); setErrors((p: any) => ({ ...p, email: '' })); }}
          className={`w-full px-4 py-3 border rounded-xl text-sm outline-none transition-all ${
            errors.email ? 'border-red-300 bg-red-50' : 'border-gray-200 focus:border-[#1A56A0] focus:ring-2 focus:ring-blue-100'
          }`}
          placeholder="email@example.com"
          autoComplete="email"
        />
        {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
      </div>

      {/* Navigatsiya */}
      <div className="flex gap-3 pt-2">
        <button onClick={onBack}
          className="flex-1 py-3 border border-gray-200 text-gray-600 rounded-xl text-sm hover:bg-gray-50 transition-all">
          ← Orqaga
        </button>
        <button onClick={handleNext}
          className="flex-1 py-3 bg-[#1A56A0] hover:bg-[#0D3B6E] text-white font-semibold rounded-xl text-sm transition-all">
          Davom etish →
        </button>
      </div>
    </div>
  );
}
