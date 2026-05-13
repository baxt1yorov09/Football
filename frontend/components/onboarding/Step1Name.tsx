'use client';

import { useState } from 'react';
import { User } from 'lucide-react';

interface Props {
  data: any;
  onNext: (fields: any) => void;
}

export function Step1Name({ data, onNext }: Props) {
  const [fields, setFields] = useState({
    last_name: data.last_name || '',
    first_name: data.first_name || '',
    middle_name: data.middle_name || '',
  });
  const [errors, setErrors] = useState<any>({});

  const validate = () => {
    const errs: any = {};
    if (!fields.last_name.trim()) errs.last_name = 'Familiyani kiriting';
    if (!fields.first_name.trim()) errs.first_name = 'Ismni kiriting';
    return errs;
  };

  const handleNext = () => {
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    onNext(fields);
  };

  return (
    <div className="space-y-4">
      {/* Avatar placeholder */}
      <div className="flex justify-center mb-2">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#1A56A0] to-[#2D9CDB] flex items-center justify-center text-white text-xl font-bold shadow-lg">
          {fields.first_name?.[0]?.toUpperCase() || fields.last_name?.[0]?.toUpperCase() || (
            <User className="w-7 h-7 opacity-80" />
          )}
        </div>
      </div>

      {/* Familiya */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Familiya <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          value={fields.last_name}
          onChange={e => { setFields(p => ({ ...p, last_name: e.target.value })); setErrors((p: any) => ({ ...p, last_name: '' })); }}
          className={`w-full px-4 py-3 border rounded-xl text-sm outline-none transition-all ${
            errors.last_name
              ? 'border-red-300 bg-red-50 focus:ring-2 focus:ring-red-100'
              : 'border-gray-200 focus:border-[#1A56A0] focus:ring-2 focus:ring-blue-100'
          }`}
          placeholder="Karimov"
          autoFocus
          autoComplete="family-name"
        />
        {errors.last_name && <p className="text-xs text-red-500 mt-1">{errors.last_name}</p>}
      </div>

      {/* Ism */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Ism <span className="text-red-400">*</span>
        </label>
        <input
          type="text"
          value={fields.first_name}
          onChange={e => { setFields(p => ({ ...p, first_name: e.target.value })); setErrors((p: any) => ({ ...p, first_name: '' })); }}
          className={`w-full px-4 py-3 border rounded-xl text-sm outline-none transition-all ${
            errors.first_name
              ? 'border-red-300 bg-red-50 focus:ring-2 focus:ring-red-100'
              : 'border-gray-200 focus:border-[#1A56A0] focus:ring-2 focus:ring-blue-100'
          }`}
          placeholder="Jasur"
          autoComplete="given-name"
        />
        {errors.first_name && <p className="text-xs text-red-500 mt-1">{errors.first_name}</p>}
      </div>

      {/* Otasining ismi */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Otasining ismi
          <span className="text-gray-400 font-normal ml-1">(ixtiyoriy)</span>
        </label>
        <input
          type="text"
          value={fields.middle_name}
          onChange={e => setFields(p => ({ ...p, middle_name: e.target.value }))}
          className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#1A56A0] focus:ring-2 focus:ring-blue-100 transition-all"
          placeholder="Aliyevich"
          autoComplete="additional-name"
        />
      </div>

      <button
        onClick={handleNext}
        className="w-full py-3 bg-[#1A56A0] hover:bg-[#0D3B6E] text-white font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
      >
        Davom etish →
      </button>
    </div>
  );
}
