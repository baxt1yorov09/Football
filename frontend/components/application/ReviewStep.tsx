'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check, ChevronRight, ChevronLeft, AlertTriangle, Upload, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LICENSE_REQUIREMENTS, LICENSE_COLORS } from '@/lib/constants/licenses';

interface ReviewStepProps {
  data: any;
  licenseType: string;
  onSubmit: () => void;
  onBack: () => void;
  isSubmitting: boolean;
}

export function ReviewStep({ data, licenseType, onSubmit, onBack, isSubmitting }: ReviewStepProps) {
  const [agreed, setAgreed] = useState(false);
  const [regions, setRegions] = useState<Array<{ id: number | string; name_uz: string; name_ru?: string }>>([]);

  useEffect(() => {
    fetch('/api/auth/regions')
      .then((r) => (r.ok ? r.json() : []))
      .then((j) => setRegions(Array.isArray(j) ? j : (j.results || [])))
      .catch(() => setRegions([]));
  }, []);

  const resolveRegion = (id: any) => {
    if (!id) return '';
    const match = regions.find((r) => String(r.id) === String(id));
    return match ? match.name_uz : String(id);
  };
  const regionName = resolveRegion(data?.regionId);
  const studyRegionName = resolveRegion(data?.studyRegionId);
  const licenseConfig = LICENSE_REQUIREMENTS[licenseType as keyof typeof LICENSE_REQUIREMENTS];
  const color = LICENSE_COLORS[licenseType as keyof typeof LICENSE_COLORS] || '#3498DB';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (agreed) {
      onSubmit();
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-[#0D3B6E] mb-2">
        Arizani tekshirish
      </h2>
      <p className="text-gray-600 mb-6">
        Arizangizni yuborishdan oldin ma'lumotlarni tekshiring
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* License Type Summary */}
        <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
          <div className="flex items-center gap-4">
            <div 
              className="w-16 h-16 rounded-xl flex items-center justify-center text-white font-bold"
              style={{ backgroundColor: color }}
            >
              {licenseType}
            </div>
            <div>
              <h3 className="text-xl font-bold text-[#0D3B6E]">{licenseConfig?.name}</h3>
              <p className="text-gray-600">{licenseConfig?.description}</p>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="secondary">
                  Kutilish: {licenseConfig?.waitingDays} kun
                </Badge>
                <Badge variant="secondary">
                  Minimum yosh: {licenseConfig?.minAge} yil
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Personal Information */}
        <div className="border border-gray-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-[#0D3B6E] mb-4 flex items-center gap-2">
            <Check className="w-5 h-5 text-green-500" />
            Shaxsiy ma'lumotlar
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">F.I.O</p>
              <p className="font-medium">{data.firstName} {data.lastName}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Tug'ilgan sana</p>
              <p className="font-medium">{data.birthDate}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Jins</p>
              <p className="font-medium">{data.gender === 'male' ? 'Erkak' : 'Ayol'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Telefon</p>
              <p className="font-medium">{data.phone}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="font-medium">{data.email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Yashaydigan hudud</p>
              <p className="font-medium">{regionName || '—'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">O'qimoqchi bo'lgan hudud</p>
              <p className="font-medium">{studyRegionName || '—'}</p>
            </div>
          </div>
        </div>

        {/* Professional Information */}
        <div className="border border-gray-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-[#0D3B6E] mb-4 flex items-center gap-2">
            <Check className="w-5 h-5 text-green-500" />
            Kasbiy ma'lumotlar
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Ish joyi</p>
              <p className="font-medium">{data.currentClub}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Lavozim</p>
              <p className="font-medium">{data.position}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Tajriba</p>
              <p className="font-medium">{data.experience} yil</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Ma'lumoti</p>
              <p className="font-medium">{data.education}</p>
            </div>
          </div>
          {data.achievements && (
            <div className="mt-4">
              <p className="text-sm text-gray-500">Yutuqlar</p>
              <p className="font-medium">{data.achievements}</p>
            </div>
          )}
        </div>

        {/* Documents */}
        <div className="border border-gray-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-[#0D3B6E] mb-4 flex items-center gap-2">
            <Check className="w-5 h-5 text-green-500" />
            Hujjatlar
          </h3>
          <div className="space-y-3">
            {Object.entries(data.documents || {}).map(([docType, files]: [string, any]) => {
              const docNames: Record<string, string> = {
                'passport': 'Pasport',
                'photo_3x4': '3x4 rasm',
                'diploma': 'Diploma',
                'medical_certificate': 'Tibbiy guvohnoma',
                'prev_license': 'Avvalgi litsenziya'
              };

              return (
                <div key={docType} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="font-medium">{docNames[docType] || docType}</p>
                      <p className="text-sm text-gray-500">
                        {files.length} fayl yuklandi
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">
                      {files.reduce((total: number, file: any) => total + file.size, 0) > 0 && 
                        formatFileSize(files.reduce((total: number, file: any) => total + file.size, 0))
                      }
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Warning */}
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
          <div className="flex gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-amber-800">Eslatma</p>
              <p className="text-sm text-amber-700 mt-1">
                Arizani yuborishdan so'ng, ma'lumotlarni o'zgartirib bo'lmaydi. 
                Barcha ma'lumotlarni to'g'ri ekanligiga ishonch hosil qiling.
              </p>
            </div>
          </div>
        </div>

        {/* Agreement */}
        <div className="p-4 bg-gray-50 rounded-xl">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              className="mt-1 w-4 h-4 text-[#F39C12] border-gray-300 rounded focus:ring-[#F39C12]"
            />
            <span className="text-sm text-gray-700">
              Men yuqoridagi barcha ma'lumotlarning to'g'ri ekanligini tasdiqlayman va 
              O'zbekiston Murabbiylar ta'limi qoidalariga rioya qilishga roziman.
            </span>
          </label>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            className="h-12 px-8 border-gray-300 text-gray-700 hover:bg-gray-50"
            disabled={isSubmitting}
          >
            <ChevronLeft className="mr-2 w-5 h-5" />
            Orqaga
          </Button>
          
          <Button
            type="submit"
            className="h-12 px-8 bg-[#F39C12] hover:bg-[#E67E22] text-white font-semibold"
            disabled={!agreed || isSubmitting}
          >
            {isSubmitting ? (
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Yuborilmoqda...
              </div>
            ) : (
              <>
                Arizani yuborish
                <ChevronRight className="ml-2 w-5 h-5" />
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default ReviewStep;
