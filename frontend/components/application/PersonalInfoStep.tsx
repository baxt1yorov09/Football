'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Calendar, MapPin, Phone, Mail, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { apiClient, API_ENDPOINTS } from '@/lib/api/client';

interface PersonalInfoStepProps {
  data: any;
  onNext: (data: any) => void;
}

export function PersonalInfoStep({ data, onNext }: PersonalInfoStepProps) {
  const [formData, setFormData] = useState({
    firstName: data.firstName || '',
    lastName: data.lastName || '',
    birthDate: data.birthDate || '',
    gender: data.gender || '',
    regionId: data.regionId || '',
    studyRegionId: data.studyRegionId || '',
    phone: data.phone || '',
    email: data.email || '',
    address: data.address || '',
  });
  const [regions, setRegions] = useState<any[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Load regions
  useEffect(() => {
    const loadRegions = async () => {
      try {
        const response = await apiClient.get(API_ENDPOINTS.auth.regions);
        setRegions(response.data);
      } catch (error) {
        console.error('Failed to load regions');
      }
    };
    loadRegions();
  }, []);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'Ism kiritish majburiy';
    }
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Familiya kiritish majburiy';
    }
    if (!formData.birthDate) {
      newErrors.birthDate = "Tug'ilgan sana kiritish majburiy";
    }
    if (!formData.gender) {
      newErrors.gender = 'Jinsni tanlash majburiy';
    }
    if (!formData.regionId) {
      newErrors.regionId = 'Yashaydigan hududni tanlash majburiy';
    }
    if (!formData.studyRegionId) {
      newErrors.studyRegionId = "O'qimoqchi bo'lgan hududni tanlash majburiy";
    }
    if (!formData.phone) {
      newErrors.phone = 'Telefon raqam kiritish majburiy';
    }
    if (!formData.email) {
      newErrors.email = 'Email kiritish majburiy';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Noto\'g\'ri email formati';
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
        Shaxsiy ma'lumotlar
      </h2>
      <p className="text-gray-600 mb-6">
        Arizangizni to'ldirish uchun shaxsiy ma'lumotlaringizni kiriting
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Name Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ism <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Ismingiz"
                value={formData.firstName}
                onChange={(e) => handleChange('firstName', e.target.value)}
                className={`pl-12 h-12 ${errors.firstName ? 'border-red-500' : ''}`}
              />
            </div>
            {errors.firstName && (
              <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Familiya <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Familiyangiz"
                value={formData.lastName}
                onChange={(e) => handleChange('lastName', e.target.value)}
                className={`pl-12 h-12 ${errors.lastName ? 'border-red-500' : ''}`}
              />
            </div>
            {errors.lastName && (
              <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>
            )}
          </div>
        </div>

        {/* Birth Date and Gender */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tug'ilgan sana <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="date"
                value={formData.birthDate}
                onChange={(e) => handleChange('birthDate', e.target.value)}
                className={`pl-12 h-12 ${errors.birthDate ? 'border-red-500' : ''}`}
              />
            </div>
            {errors.birthDate && (
              <p className="text-red-500 text-xs mt-1">{errors.birthDate}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Jins <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-4">
              {['male', 'female'].map((gender) => (
                <button
                  key={gender}
                  type="button"
                  onClick={() => handleChange('gender', gender)}
                  className={`flex-1 py-3 px-4 rounded-lg border-2 font-medium transition-all ${
                    formData.gender === gender
                      ? 'border-[#F39C12] bg-[#F39C12]/10 text-[#F39C12]'
                      : 'border-gray-200 text-gray-600 hover:border-[#1A56A0]'
                  }`}
                >
                  {gender === 'male' ? "Erkak" : "Ayol"}
                </button>
              ))}
            </div>
            {errors.gender && (
              <p className="text-red-500 text-xs mt-1">{errors.gender}</p>
            )}
          </div>
        </div>

        {/* Region: Yashaydigan + O'qimoqchi bo'lgan */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Yashaydigan hudud <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 z-10" suppressHydrationWarning />
              <select
                value={formData.regionId}
                onChange={(e) => handleChange('regionId', e.target.value)}
                className={`w-full h-12 pl-12 pr-4 border rounded-lg focus:outline-none focus:border-[#F39C12] appearance-none bg-white ${
                  errors.regionId ? 'border-red-500' : 'border-gray-200'
                }`}
              >
                <option value="">Yashaydigan hududni tanlang</option>
                {regions.map((region) => (
                  <option key={region.id} value={region.id}>
                    {region.name_uz}
                  </option>
                ))}
              </select>
            </div>
            {errors.regionId && (
              <p className="text-red-500 text-xs mt-1">{errors.regionId}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              O'qimoqchi bo'lgan hudud <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 z-10" suppressHydrationWarning />
              <select
                value={formData.studyRegionId}
                onChange={(e) => handleChange('studyRegionId', e.target.value)}
                className={`w-full h-12 pl-12 pr-4 border rounded-lg focus:outline-none focus:border-[#F39C12] appearance-none bg-white ${
                  errors.studyRegionId ? 'border-red-500' : 'border-gray-200'
                }`}
              >
                <option value="">O'qimoqchi bo'lgan hududni tanlang</option>
                {regions.map((region) => (
                  <option key={region.id} value={region.id}>
                    {region.name_uz}
                  </option>
                ))}
              </select>
            </div>
            {errors.studyRegionId && (
              <p className="text-red-500 text-xs mt-1">{errors.studyRegionId}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Arizangiz shu hudud admini tomonidan ko'rib chiqiladi.
            </p>
          </div>
        </div>

        {/* Phone */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Telefon <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                type="tel"
                placeholder="+998 XX XXX-XX-XX"
                value={formData.phone}
                onChange={(e) => handleChange('phone', e.target.value)}
                className={`pl-12 h-12 ${errors.phone ? 'border-red-500' : ''}`}
              />
            </div>
            {errors.phone && (
              <p className="text-red-500 text-xs mt-1">{errors.phone}</p>
            )}
          </div>
        </div>

        {/* Email and Address */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              type="email"
              placeholder="email@example.com"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              className={`pl-12 h-12 ${errors.email ? 'border-red-500' : ''}`}
            />
          </div>
          {errors.email && (
            <p className="text-red-500 text-xs mt-1">{errors.email}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Manzil
          </label>
          <div className="relative">
            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              type="text"
              placeholder="To'liq manzilingiz"
              value={formData.address}
              onChange={(e) => handleChange('address', e.target.value)}
              className="pl-12 h-12"
            />
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end pt-4">
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

export default PersonalInfoStep;
