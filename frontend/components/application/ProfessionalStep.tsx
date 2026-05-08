'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Briefcase, GraduationCap, Award, Clock, ChevronRight, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LICENSE_REQUIREMENTS } from '@/lib/constants/licenses';

interface ProfessionalStepProps {
  data: any;
  onNext: (data: any) => void;
  onBack: () => void;
}

export function ProfessionalStep({ data, onNext, onBack }: ProfessionalStepProps) {
  const [formData, setFormData] = useState({
    currentClub: data.currentClub || '',
    position: data.position || '',
    experience: data.experience || '',
    education: data.education || '',
    previousLicense: data.previousLicense || '',
    previousLicenseNumber: data.previousLicenseNumber || '',
    previousLicenseExpiry: data.previousLicenseExpiry || '',
    achievements: data.achievements || '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.currentClub.trim()) {
      newErrors.currentClub = 'Joriy klub kiritish majburiy';
    }
    if (!formData.position.trim()) {
      newErrors.position = 'Lavozim kiritish majburiy';
    }
    if (!formData.experience) {
      newErrors.experience = 'Tajriba yili kiritish majburiy';
    }
    if (!formData.education.trim()) {
      newErrors.education = 'Ma\'lumot kiritish majburiy';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onNext(formData);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-[#0D3B6E] mb-2">
        Kasbiy ma'lumotlar
      </h2>
      <p className="text-gray-600 mb-6">
        Murabbiylik faoliyatingiz haqida ma'lumotlarni kiriting
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Current Club and Position */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Joriy klub <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Klub nomi"
                value={formData.currentClub}
                onChange={(e) => handleChange('currentClub', e.target.value)}
                className={`pl-12 h-12 ${errors.currentClub ? 'border-red-500' : ''}`}
              />
            </div>
            {errors.currentClub && (
              <p className="text-red-500 text-xs mt-1">{errors.currentClub}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Lavozim <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Bosh murabbiy, assistent..."
                value={formData.position}
                onChange={(e) => handleChange('position', e.target.value)}
                className={`pl-12 h-12 ${errors.position ? 'border-red-500' : ''}`}
              />
            </div>
            {errors.position && (
              <p className="text-red-500 text-xs mt-1">{errors.position}</p>
            )}
          </div>
        </div>

        {/* Experience and Education */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Murabbiylik tajribasi (yil) <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="number"
                min="0"
                max="50"
                placeholder="5"
                value={formData.experience}
                onChange={(e) => handleChange('experience', e.target.value)}
                className={`pl-12 h-12 ${errors.experience ? 'border-red-500' : ''}`}
              />
            </div>
            {errors.experience && (
              <p className="text-red-500 text-xs mt-1">{errors.experience}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ma'lumoti <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <GraduationCap className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Oliy ma'lumot, murabbiylik maktabi..."
                value={formData.education}
                onChange={(e) => handleChange('education', e.target.value)}
                className={`pl-12 h-12 ${errors.education ? 'border-red-500' : ''}`}
              />
            </div>
            {errors.education && (
              <p className="text-red-500 text-xs mt-1">{errors.education}</p>
            )}
          </div>
        </div>

        {/* Previous License Section */}
        <div className="p-6 bg-gray-50 rounded-xl">
          <h3 className="text-lg font-semibold text-[#0D3B6E] mb-4 flex items-center gap-2">
            <Award className="w-5 h-5" />
            Avvalgi litsenziya
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Litsenziya turi
              </label>
              <select
                value={formData.previousLicense}
                onChange={(e) => handleChange('previousLicense', e.target.value)}
                className="w-full h-12 px-4 border border-gray-200 rounded-lg focus:outline-none focus:border-[#F39C12] appearance-none bg-white"
              >
                <option value="">Litsenziya tanlang</option>
                <option value="D">D Litsenziya</option>
                <option value="C">C Litsenziya</option>
                <option value="B">B Litsenziya</option>
                <option value="A">A Litsenziya</option>
                <option value="PRO">PRO Litsenziya</option>
              </select>
            </div>

            {formData.previousLicense && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Litsenziya raqami
                    </label>
                    <Input
                      type="text"
                      placeholder="UFF-2024-D-000123"
                      value={formData.previousLicenseNumber}
                      onChange={(e) => handleChange('previousLicenseNumber', e.target.value)}
                      className="h-12"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Muddati tugagan sana
                    </label>
                    <Input
                      type="date"
                      value={formData.previousLicenseExpiry}
                      onChange={(e) => handleChange('previousLicenseExpiry', e.target.value)}
                      className="h-12"
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Achievements */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Yutuqlar va mukofotlar
          </label>
          <textarea
            placeholder="Chempionlik, sovrinlar, boshqa yutuqlaringiz..."
            value={formData.achievements}
            onChange={(e) => handleChange('achievements', e.target.value)}
            className="w-full h-32 px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:border-[#F39C12] resize-none"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            className="h-12 px-8 border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            <ChevronLeft className="mr-2 w-5 h-5" />
            Orqaga
          </Button>
          
          <Button
            type="submit"
            className="h-12 px-8 bg-[#F39C12] hover:bg-[#E67E22] text-white font-semibold"
          >
            Keyingi qadam
            <ChevronRight className="ml-2 w-5 h-5" />
          </Button>
        </div>
      </form>
    </div>
  );
}

export default ProfessionalStep;
