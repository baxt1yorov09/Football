'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Calendar, MapPin, ArrowRight, Loader2, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { apiClient, API_ENDPOINTS } from '@/lib/api/client';

interface ProfileFormProps {
  onSubmit: (data: any) => void;
}

export function ProfileForm({ onSubmit }: ProfileFormProps) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    birthDate: '',
    gender: '',
    regionId: '',
  });
  const [regions, setRegions] = useState<any[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

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
      newErrors.regionId = 'Hududni tanlash majburiy';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validate()) return;

    setLoading(true);
    try {
      await onSubmit(formData);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-xl font-bold text-[#0D3B6E] mb-2">
        Profilni to'ldiring
      </h2>
      <p className="text-gray-600 text-sm mb-6">
        Iltimos, shaxsiy ma'lumotlaringizni kiriting
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* First Name */}
        <div>
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Ism"
              value={formData.firstName}
              onChange={(e) => handleChange('firstName', e.target.value)}
              className={`pl-12 h-12 ${errors.firstName ? 'border-red-500' : ''}`}
            />
          </div>
          {errors.firstName && (
            <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>
          )}
        </div>

        {/* Last Name */}
        <div>
          <div className="relative">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Familiya"
              value={formData.lastName}
              onChange={(e) => handleChange('lastName', e.target.value)}
              className={`pl-12 h-12 ${errors.lastName ? 'border-red-500' : ''}`}
            />
          </div>
          {errors.lastName && (
            <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>
          )}
        </div>

        {/* Birth Date */}
        <div>
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

        {/* Gender */}
        <div>
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

        {/* Region */}
        <div>
          <div className="relative">
            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 z-10" />
            <select
              value={formData.regionId}
              onChange={(e) => handleChange('regionId', e.target.value)}
              className={`w-full h-12 pl-12 pr-4 border rounded-lg focus:outline-none focus:border-[#F39C12] appearance-none bg-white ${
                errors.regionId ? 'border-red-500' : 'border-gray-200'
              }`}
            >
              <option value="">Hududni tanlang</option>
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

        {/* Submit */}
        <Button
          type="submit"
          className="w-full h-14 bg-[#F39C12] hover:bg-[#E67E22] text-white text-lg font-semibold mt-6"
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              Davom etish
              <ArrowRight className="ml-2 w-5 h-5" />
            </>
          )}
        </Button>
      </form>
    </div>
  );
}

export default ProfileForm;
