'use client';

import { useState, useEffect } from 'react';
import { Plus, X, Loader2 } from 'lucide-react';
import { apiClient } from '@/lib/api/client';
import { useI18n } from '@/lib/i18n/I18nProvider';

interface LicenseTypeOption {
  code: string;
  name_uz: string;
  name_ru?: string | null;
  category: string;
}

// Foydalanuvchi o'zi litsenziya qo'shishda ko'rsatilmaydigan turlar:
// E/F toifalari, barcha yangilash (RENEWAL_*) turlari va maxsus/nofaol turlar.
const EXCLUDED_CODES = new Set([
  'E', 'F',
  'RENEWAL_A', 'RENEWAL_B', 'RENEWAL_C', 'RENEWAL_D', 'RENEWAL_E', 'RENEWAL_F',
  'TEMPORARY', 'ASSISTANT', 'INTERNATIONAL', 'HONORARY',
]);

interface AddLicenseModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: () => void;
}

/**
 * Foydalanuvchi o'zining mavjud litsenziyasini tizimga qo'shish uchun modal.
 * Backendga POST /licenses/self/ so'rovi yuboriladi (multipart, image + metadata).
 */
export function AddLicenseModal({ open, onClose, onCreated }: AddLicenseModalProps) {
  const { t, locale } = useI18n();
  const [types, setTypes] = useState<LicenseTypeOption[]>([]);
  const [typeCode, setTypeCode] = useState('');
  const [issuedAt, setIssuedAt] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [licenseNumber, setLicenseNumber] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    (async () => {
      try {
        const res = await apiClient.get('/licenses/types/');
        const list: LicenseTypeOption[] = (res.data?.results || []).filter(
          (tp: LicenseTypeOption) => !EXCLUDED_CODES.has(tp.code)
        );
        setTypes(list);
        if (list.length && !typeCode) setTypeCode(list[0].code);
      } catch {
        setTypes([]);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Modal yopilganda tozalash
  useEffect(() => {
    if (!open) {
      setLicenseNumber('');
      setImageFile(null);
      setImagePreview('');
      setErr(null);
    }
  }, [open]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) {
      setErr(t('profile.license.add_image_hint'));
      return;
    }
    setImageFile(f);
    if (f.type.startsWith('image/')) {
      const url = URL.createObjectURL(f);
      setImagePreview(url);
    } else {
      setImagePreview('');
    }
    setErr(null);
  };

  const submit = async () => {
    setErr(null);
    if (!typeCode) {
      setErr(t('profile.license.err_type'));
      return;
    }
    if (!licenseNumber.trim()) {
      setErr(t('profile.license.err_number'));
      return;
    }
    if (!issuedAt) {
      setErr(t('profile.license.err_issued'));
      return;
    }
    if (!imageFile) {
      setErr(t('profile.license.err_image'));
      return;
    }
    setLoading(true);
    try {
      const form = new FormData();
      form.append('license_type_code', typeCode);
      form.append('issued_at', issuedAt);
      form.append('license_number', licenseNumber.trim());
      form.append('image', imageFile);

      await apiClient.post('/licenses/self/', form, {
        headers: { 'Content-Type': undefined },
      });
      onCreated();
    } catch (e: any) {
      setErr(e?.response?.data?.detail || 'Xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  const isValid = !!(typeCode && licenseNumber.trim() && issuedAt && imageFile);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md my-8">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-lg text-gray-900">
                {t('profile.license.add_title')}
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                {t('profile.license.add_subtitle')}
              </p>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>

          {err && (
            <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {err}
            </div>
          )}

          <div className="space-y-4">
            {/* Litsenziya turi */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('profile.license.add_type_label')} <span className="text-red-500">*</span>
              </label>
              <select
                value={typeCode}
                onChange={(e) => setTypeCode(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1A56A0]"
              >
                {types.length === 0 ? (
                  <option value="">{t('profile.license.add_type_placeholder')}</option>
                ) : (
                  types.map((tp) => (
                    <option key={tp.code} value={tp.code}>
                      {tp.code} — {locale === 'ru' && tp.name_ru ? tp.name_ru : tp.name_uz}
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* Litsenziya raqami */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('profile.license.add_number_label')} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={licenseNumber}
                onChange={(e) => setLicenseNumber(e.target.value)}
                placeholder={t('profile.license.add_number_placeholder')}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#1A56A0]"
              />
              <p className="text-xs text-gray-500 mt-1.5">
                {t('profile.license.add_number_hint')}
              </p>
            </div>

            {/* Berilgan sana */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('profile.license.add_issued_label')} <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={issuedAt}
                max={new Date().toISOString().slice(0, 10)}
                onChange={(e) => setIssuedAt(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#1A56A0]"
              />
              <p className="text-xs text-gray-500 mt-1.5">
                {t('profile.license.add_note')}
              </p>
            </div>

            {/* Rasm/PDF yuklash */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('profile.license.add_image_label')} <span className="text-red-500">*</span>
              </label>

              {imageFile ? (
                <div className="border border-gray-200 rounded-xl p-3 flex items-center gap-3">
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt="preview"
                      className="w-16 h-16 object-cover rounded-lg border border-gray-100"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 text-xs font-mono">
                      PDF
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{imageFile.name}</p>
                    <p className="text-xs text-gray-500">
                      {(imageFile.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setImageFile(null); setImagePreview(''); }}
                    className="p-2 text-gray-400 hover:text-red-600"
                    aria-label="remove"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label className="flex items-center justify-center gap-2 border-2 border-dashed border-gray-200 rounded-xl px-4 py-6 cursor-pointer hover:border-[#1A56A0] hover:bg-blue-50/30 transition-colors">
                  <Plus className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-600">
                    {t('profile.license.add_image_upload')}
                  </span>
                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp,application/pdf"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              )}

              <p className="text-xs text-gray-500 mt-1.5">
                {t('profile.license.add_image_hint')}
              </p>
            </div>
          </div>

          <div className="flex gap-2 mt-6">
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50"
            >
              {t('profile.license.add_cancel')}
            </button>
            <button
              onClick={submit}
              disabled={loading || !isValid}
              className="flex-1 py-2.5 bg-[#1A56A0] hover:bg-[#0D3B6E] text-white rounded-xl text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {t('profile.license.add_submit')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AddLicenseModal;
