'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X, CheckCircle } from 'lucide-react';
import { apiClient } from '@/lib/api/client';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const EXPORT_ITEMS = [
  { id: 'profile', icon: '👤', label: "Profil ma'lumotlari", format: 'JSON' },
  { id: 'applications', icon: '📋', label: 'Barcha arizalar', format: 'JSON' },
  { id: 'licenses', icon: '📄', label: 'Litsenziyalar', format: 'JSON' },
];

export function ExportDataModal({ isOpen, onClose }: Props) {
  const [selected, setSelected] = useState<string[]>(['profile', 'applications', 'licenses']);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const toggleItem = (id: string) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));

  const handleExport = async () => {
    if (!selected.length) return;
    setLoading(true);
    setProgress(0);
    setError('');

    const interval = setInterval(() => {
      setProgress((p) => Math.min(p + 15, 85));
    }, 300);

    try {
      const response = await apiClient.post(
        '/users/me/export/',
        { items: selected },
        { responseType: 'blob' }
      );
      clearInterval(interval);
      setProgress(100);

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = `ufa_data_${new Date().toISOString().split('T')[0]}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setDone(true);
      setTimeout(() => {
        setDone(false);
        setProgress(0);
        onClose();
      }, 2200);
    } catch (e) {
      clearInterval(interval);
      setError('Eksport qilishda xatolik yuz berdi');
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
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                    <Download className="w-5 h-5 text-[#1A56A0]" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-[#0D3B6E]">Ma&apos;lumotlarni eksport</h3>
                    <p className="text-xs text-gray-500">ZIP formatida yuklab olasiz</p>
                  </div>
                </div>
                <button onClick={onClose} disabled={loading}>
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              {done ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-8"
                >
                  <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-3" />
                  <p className="font-semibold">Yuklab olindi!</p>
                </motion.div>
              ) : (
                <>
                  <p className="text-sm text-gray-600 mb-4">
                    Qaysi ma&apos;lumotlarni yuklab olishni tanlang:
                  </p>

                  <div className="space-y-2 mb-6">
                    {EXPORT_ITEMS.map((item) => (
                      <label
                        key={item.id}
                        className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                          selected.includes(item.id)
                            ? 'border-[#1A56A0] bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selected.includes(item.id)}
                          onChange={() => toggleItem(item.id)}
                          className="sr-only"
                        />
                        <span className="text-xl">{item.icon}</span>
                        <span className="flex-1 text-sm font-medium text-gray-700">
                          {item.label}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-gray-100 text-gray-600">
                          {item.format}
                        </span>
                      </label>
                    ))}
                  </div>

                  {loading && (
                    <div className="mb-4">
                      <div className="flex justify-between text-xs text-gray-500 mb-1">
                        <span>Tayyorlanmoqda...</span>
                        <span>{progress}%</span>
                      </div>
                      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-[#1A56A0] rounded-full"
                          initial={{ width: 0 }}
                          animate={{ width: `${progress}%` }}
                          transition={{ duration: 0.3 }}
                        />
                      </div>
                    </div>
                  )}

                  {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm mb-4">
                      {error}
                    </div>
                  )}

                  <div className="flex gap-3">
                    <button
                      onClick={onClose}
                      disabled={loading}
                      className="flex-1 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                    >
                      Bekor qilish
                    </button>
                    <button
                      onClick={handleExport}
                      disabled={loading || !selected.length}
                      className="flex-1 py-2.5 bg-[#1A56A0] text-white rounded-lg hover:bg-[#0D3B6E] disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      {loading ? `${progress}%` : 'Yuklab olish'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
