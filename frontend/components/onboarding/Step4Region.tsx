'use client';

import { useState, useEffect } from 'react';
import { MapPin, Loader2 } from 'lucide-react';
import { apiClient } from '@/lib/api/client';

interface Region { id: number; name_uz: string; is_tashkent: boolean; }

interface Props {
  data: any;
  onSubmit: (fields: any) => void;
  onBack: () => void;
  isSubmitting: boolean;
}

export function Step4Region({ data, onSubmit, onBack, isSubmitting }: Props) {
  const [regions, setRegions] = useState<Region[]>([]);
  const [selected, setSelected] = useState<number | null>(data.region || null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.get('/auth/regions')
      .then(res => setRegions(res.data))
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = () => {
    if (!selected) { setError('Hududni tanlang'); return; }
    onSubmit({ region: selected });
  };

  return (
    <div className="space-y-4">

      {/* Viloyatlar */}
      {loading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-[#1A56A0]" />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
          {regions.map(region => (
            <button key={region.id} type="button"
              onClick={() => { setSelected(region.id); setError(''); }}
              className={`flex items-center gap-2 py-2.5 px-3 rounded-xl border text-xs font-medium text-left transition-all ${
                selected === region.id
                  ? 'border-[#1A56A0] bg-blue-50 text-[#1A56A0]'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
              <MapPin className={`w-3 h-3 flex-shrink-0 ${selected === region.id ? 'text-[#1A56A0]' : 'text-gray-300'}`} />
              <span>{region.name_uz}</span>
            </button>
          ))}
        </div>
      )}

      {error && <p className="text-xs text-red-500">{error}</p>}

      <div className="flex gap-3 pt-2">
        <button onClick={onBack} disabled={isSubmitting}
          className="flex-1 py-3 border border-gray-200 text-gray-600 rounded-xl text-sm hover:bg-gray-50 disabled:opacity-50">
          ← Orqaga
        </button>
        <button onClick={handleSubmit} disabled={isSubmitting || !selected}
          className="flex-1 py-3 bg-[#F39C12] hover:bg-[#E67E22] text-white font-semibold rounded-xl text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2">
          {isSubmitting ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Saqlanmoqda...</>
          ) : (
            '✓ Boshlash'
          )}
        </button>
      </div>
    </div>
  );
}
