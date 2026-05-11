'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ChevronRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { apiClient, API_ENDPOINTS } from '@/lib/api/client';

import { PersonalInfoStep } from '@/components/application/PersonalInfoStep';
import { ProfessionalStep } from '@/components/application/ProfessionalStep';
import { DocumentsStep } from '@/components/application/DocumentsStep';
import { ReviewStep } from '@/components/application/ReviewStep';
import { LICENSE_REQUIREMENTS, LICENSE_COLORS } from '@/lib/constants/licenses';

const steps = [
  { id: 'personal', label: "Shaxsiy ma'lumotlar" },
  { id: 'professional', label: 'Kasbiy ma\'lumotlar' },
  { id: 'documents', label: 'Hujjatlar' },
  { id: 'review', label: 'Tekshirish' },
];

export default function ApplicationWizardPage() {
  const params = useParams();
  const router = useRouter();
  const licenseType = params.licenseType as string;
  
  // Debug URL params
  console.log('=== URL PARAMS DEBUG ===');
  console.log('Window location:', window.location.href);
  console.log('params:', params);
  console.log('licenseType from params:', licenseType);
  console.log('typeof licenseType:', typeof licenseType);
  console.log('Available license types:', Object.keys(LICENSE_REQUIREMENTS));
  
  const licenseConfig = LICENSE_REQUIREMENTS[licenseType as keyof typeof LICENSE_REQUIREMENTS];
  console.log('licenseConfig:', licenseConfig);
  const { isAuthenticated, isLoading } = useAuth();

  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<any>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load saved form data from localStorage
  useEffect(() => {
    // Debug localStorage
    console.log('=== LOCALSTORAGE DEBUG ===');
    console.log('Current licenseType:', licenseType);
    
    // Clear all application localStorage for debugging
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('application_')) {
        console.log('Found localStorage key:', key, localStorage.getItem(key));
        localStorage.removeItem(key);
      }
    });
    
    const saved = localStorage.getItem(`application_${licenseType}`);
    console.log('Saved data for current licenseType:', saved);
    if (saved) {
      setFormData(JSON.parse(saved));
    }
  }, [licenseType]);

  // Save form data to localStorage
  useEffect(() => {
    localStorage.setItem(`application_${licenseType}`, JSON.stringify(formData));
  }, [formData, licenseType]);

  // Check authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F4F6F9] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  // Redirect unauthenticated users to auth page with redirect back
  if (!isAuthenticated) {
    router.push(`/auth?redirect=/apply/${licenseType}`);
    return null;
  }

  const handleNext = (stepData: any) => {
    setFormData((prev: any) => ({ ...prev, ...stepData }));
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const getLicenseTypeId = (licenseCode: string): number => {
    // License code dan ID ga mapping
    const licenseMap: Record<string, number> = {
      'A': 1, 'B': 2, 'C': 3, 'D': 4, 'E': 5, 'F': 6,
      'GK': 7, 'PRO': 8, 'FITNESS': 9, 'SPECIALIST': 10,
      'RENEWAL_A': 11, 'RENEWAL_B': 12, 'RENEWAL_C': 13, 'RENEWAL_D': 14,
      'RENEWAL_E': 15, 'RENEWAL_F': 16, 'RENEWAL_GK': 17, 'RENEWAL_PRO': 18,
      'RENEWAL_FITNESS': 19, 'RENEWAL_SPECIALIST': 20, 'SPECIAL': 21, 'OTHER': 22,
      'TEMPORARY': 23, 'ASSISTANT': 24, 'INTERNATIONAL': 25, 'HONORARY': 26
    };
    return licenseMap[licenseCode] || 1; // Default to 1 if not found
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const form = new FormData();

      // Asosiy maydonlar - Django model field nomlariga moslashtirish
      console.log('=== DEBUG INFO ===');
      console.log('licenseType:', licenseType);
      console.log('typeof licenseType:', typeof licenseType);
      console.log('licenseType === null:', licenseType === null);
      console.log('licenseType === undefined:', licenseType === undefined);
      console.log('licenseType === "":', licenseType === "");
      console.log('JSON.stringify(licenseType):', JSON.stringify(licenseType));
      
      if (!licenseType || licenseType === 'undefined' || licenseType === 'null') {
        console.error('ERROR: licenseType is invalid:', licenseType);
        alert('Litsenziya turi aniqlanmadi. Iltimos, qaytadan urinib ko\'ring.');
        return;
      }
      
      // Backend code bilan ishlaydi
      form.append('license_type', licenseType);
      
      // Add user name from firstName and lastName
      const fullName = `${formData.firstName || ''} ${formData.lastName || ''}`.trim();
      if (fullName) form.append('full_name', fullName);
      
      // Region formData'dan olinadi (user tanlaydi)
      if (formData.regionId) form.append('region', String(formData.regionId));
      
      // Debug work info fields - use correct field names from ProfessionalStep
      console.log('=== DEBUG FORM DATA ===');
      console.log('formData.currentClub:', formData.currentClub);
      console.log('formData.position:', formData.position);
      console.log('formData.experience:', formData.experience);
      
      // Map ProfessionalStep fields to backend fields
      if (formData.currentClub)   form.append('workplace',      formData.currentClub);
      if (formData.position)      form.append('job_title',      formData.position);
      if (formData.experience)    form.append('coaching_years', String(formData.experience));
      
      // Debug FormData content
      console.log('FormData entries:');
      Array.from(form.entries()).forEach(([key, value]) => {
        console.log(`${key}:`, value);
      });
      
      // Optional fields
      if (formData.prev_license_date)     form.append('prev_license_date',     formData.prev_license_date);
      if (formData.license_validity_start) form.append('license_validity_start', formData.license_validity_start);
      if (formData.license_validity_end)   form.append('license_validity_end',   formData.license_validity_end);

      // Fayllar - backend kutayotgan nomlar
      if (formData.passport)    form.append('passport',    formData.passport);
      if (formData.photo_3x4)   form.append('photo_3x4',   formData.photo_3x4);
      if (formData.prev_license) form.append('prev_license', formData.prev_license);

      // Debug FormData content
      console.log('FormData entries:');
      form.forEach((value, key) => {
        console.log(`${key}:`, value);
      });

      const response = await apiClient.post(
        API_ENDPOINTS.applications.list,
        form
      );

      localStorage.removeItem(`application_${licenseType}`);
      router.push('/dashboard?application_submitted=true');

    } catch (error: any) {
      console.error('Application submission error:', error);

      const status = error.response?.status;
      const resData = error.response?.data;

      if (status === 401 || (status === 403 && resData?.code === 'TOKEN_INVALID')) {
        // Token expired or invalid - clear tokens and redirect to login
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        router.push(`/auth?redirect=/apply/${licenseType}`);
        return;
      }

      // Handle pending application error
      if (status === 403 && resData?.code === 'PENDING_APPLICATION') {
        alert('Diqqat: ' + (resData?.error || 'Sizda allaqachon kutilayotgan ariza mavjud. Yangi ariza yuborish uchun oldingi arizangiz tasdiqlanishini kuting.'));
        router.push('/dashboard');
        return;
      }

      if (status === 400 || status === 422) {
        console.error('Validation errors:', resData);
        console.error('Full error details:', JSON.stringify(resData, null, 2));
        
        // Show user-friendly error message
        if (resData?.error) {
          alert('Ariza yuborishda xatolik: ' + JSON.stringify(resData.error, null, 2));
        } else {
          alert('Ariza yuborishda xatolik yuz berdi. Iltimos, barcha maydonlarni to\'g\'ri to\'ldiring.');
        }
      } else {
        console.error('Full error details:', JSON.stringify(resData, null, 2));
        
        // Show user-friendly error message
        if (resData?.error) {
          alert('Ariza yuborishda xatolik: ' + JSON.stringify(resData.error, null, 2));
        } else {
          alert('Ariza yuborishda xatolik yuz berdi. Iltimos, barcha maydonlarni to\'g\'ri to\'ldiring.');
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!licenseConfig) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-500">Litsenziya turi topilmadi</p>
      </div>
    );
  }

  const color = LICENSE_COLORS[licenseType as keyof typeof LICENSE_COLORS] || '#3498DB';

  return (
    <div className="min-h-screen bg-[#F4F6F9]">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link 
            href="/dashboard"
            className="flex items-center gap-2 text-gray-600 hover:text-[#1A56A0]"
          >
            <ArrowLeft className="w-5 h-5" />
            Orqaga
          </Link>
          <div className="flex items-center gap-3">
            <div 
              className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold"
              style={{ backgroundColor: color }}
            >
              {licenseType}
            </div>
            <span className="font-semibold text-[#0D3B6E] hidden sm:block">
              {licenseConfig.name}
            </span>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const isActive = index === currentStep;
              const isCompleted = index < currentStep;

              return (
                <div key={step.id} className="flex items-center flex-1">
                  <div className="flex flex-col items-center">
                    <motion.div
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                        isCompleted
                          ? 'bg-[#27AE60] text-white'
                          : isActive
                          ? 'bg-[#F39C12] text-white'
                          : 'bg-gray-200 text-gray-500'
                      }`}
                      animate={{ scale: isActive ? 1.1 : 1 }}
                    >
                      {isCompleted ? (
                        <Check className="w-5 h-5" />
                      ) : (
                        index + 1
                      )}
                    </motion.div>
                    <span className="text-xs mt-2 hidden sm:block text-center max-w-[100px]">
                      {step.label}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div 
                      className={`flex-1 h-1 mx-2 transition-colors ${
                        isCompleted ? 'bg-[#27AE60]' : 'bg-gray-200'
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Step Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="bg-white rounded-2xl shadow-lg p-6 sm:p-8"
          >
            {currentStep === 0 && (
              <PersonalInfoStep 
                data={formData} 
                onNext={handleNext}
              />
            )}
            {currentStep === 1 && (
              <ProfessionalStep 
                data={formData}
                onNext={handleNext}
                onBack={handleBack}
              />
            )}
            {currentStep === 2 && (
              <DocumentsStep 
                data={formData}
                licenseType={licenseType}
                onNext={handleNext}
                onBack={handleBack}
              />
            )}
            {currentStep === 3 && (
              <ReviewStep 
                data={formData}
                licenseType={licenseType}
                onSubmit={handleSubmit}
                onBack={handleBack}
                isSubmitting={isSubmitting}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
