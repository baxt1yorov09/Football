'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ChevronRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

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
  const licenseType = params.licenseType as string;
  const licenseConfig = LICENSE_REQUIREMENTS[licenseType as keyof typeof LICENSE_REQUIREMENTS];

  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<any>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load saved form data from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(`application_${licenseType}`);
    if (saved) {
      setFormData(JSON.parse(saved));
    }
  }, [licenseType]);

  // Save form data to localStorage
  useEffect(() => {
    localStorage.setItem(`application_${licenseType}`, JSON.stringify(formData));
  }, [formData, licenseType]);

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

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // TODO: Submit application to API
      console.log('Submitting:', formData);
      // Clear saved data on success
      localStorage.removeItem(`application_${licenseType}`);
      // Redirect to success page
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
