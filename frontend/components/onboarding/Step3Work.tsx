'use client';

import { useState } from 'react';
import { Building2, Briefcase } from 'lucide-react';

interface Props {
  data: any;
  onNext: (fields: any) => void;
  onBack: () => void;
}

const JOB_TITLES = [
  'Bosh murabbiy',
  'Yordamchi murabbiy',
  'Darvozabon murabbiy',
  'Fitnes murabbiy',
  'Sport psixologi',
  'Seleksioner',
  'Analitik',
  'Boshqa',
];

export function Step3Work({ data, onNext, onBack }: Props) {
  const [fields, setFields] = useState({
    workplace: data.workplace || '',
    job_title: data.job_title || '',
    coaching_years: data.coaching_years || 0,
  });
  const [customJobTitle, setCustomJobTitle] = useState('');

  const handleNext = () => {
    const finalJobTitle = fields.job_title === 'Boshqa' ? customJobTitle : fields.job_title;
    onNext({ ...fields, job_title: finalJobTitle });
  };

  return (
    <div className="space-y-4">
      {/* Ish joyi */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Ish joyi / Klub
          <span className="text-gray-400 font-normal ml-1">(ixtiyoriy)</span>
        </label>
        <div className="relative">
          <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={fields.workplace}
            onChange={e => setFields(p => ({ ...p, workplace: e.target.value }))}
            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#1A56A0] focus:ring-2 focus:ring-blue-100 transition-all"
            placeholder="Paxtakor FC, Bunyodkor..."
          />
        </div>
      </div>

      {/* Lavozim */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Lavozim
          <span className="text-gray-400 font-normal ml-1">(ixtiyoriy)</span>
        </label>
        <div className="grid grid-cols-2 gap-2">
          {JOB_TITLES.map(title => (
            <button key={title} type="button"
              onClick={() => setFields(p => ({ ...p, job_title: title }))}
              className={`py-2.5 px-3 rounded-xl border text-xs font-medium text-left transition-all ${
                fields.job_title === title
                  ? 'border-[#1A56A0] bg-blue-50 text-[#1A56A0]'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
              {title}
            </button>
          ))}
        </div>
        {fields.job_title === 'Boshqa' && (
          <input
            type="text"
            value={customJobTitle}
            onChange={e => setCustomJobTitle(e.target.value)}
            placeholder="Lavozimingizni kiriting"
            className="mt-2 w-full px-4 py-2.5 border border-[#1A56A0] rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-100"
            autoFocus
          />
        )}
      </div>

      {/* Tajriba */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Murabbiylik tajribasi
          <span className="text-gray-400 font-normal ml-1">(yil)</span>
        </label>
        <div className="flex gap-2 flex-wrap">
          {[0, 1, 2, 3, 5, 7, 10, 15, 20].map(y => (
            <button key={y} type="button"
              onClick={() => setFields(p => ({ ...p, coaching_years: y }))}
              className={`px-4 py-2 rounded-xl border text-sm font-medium transition-all ${
                fields.coaching_years === y
                  ? 'border-[#1A56A0] bg-blue-50 text-[#1A56A0]'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
              {y === 0 ? 'Yangi' : `${y}+`}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button onClick={onBack}
          className="flex-1 py-3 border border-gray-200 text-gray-600 rounded-xl text-sm hover:bg-gray-50">
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
