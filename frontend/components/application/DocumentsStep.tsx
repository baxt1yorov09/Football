'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Upload, File, X, CheckCircle, AlertCircle, ChevronRight, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LICENSE_REQUIREMENTS } from '@/lib/constants/licenses';

interface DocumentsStepProps {
  data: any;
  licenseType: string;
  onNext: (data: any) => void;
  onBack: () => void;
}

interface DocumentFile {
  id: string;
  name: string;
  file: File;
  size: number;
  status: 'uploading' | 'uploaded' | 'error';
  error?: string;
}

export function DocumentsStep({ data, licenseType, onNext, onBack }: DocumentsStepProps) {
  const licenseConfig = LICENSE_REQUIREMENTS[licenseType as keyof typeof LICENSE_REQUIREMENTS];
  const [documents, setDocuments] = useState<Record<string, DocumentFile[]>>(data.documents || {});
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Document configuration
  const documentConfigs = [
    {
      type: 'passport',
      name: 'Pasport',
      required: true,
      max_size_mb: 5,
      accepted_types: ['.pdf', '.jpg', '.jpeg', '.png']
    },
    {
      type: 'photo_3x4',
      name: '3x4 rasm',
      required: true,
      max_size_mb: 2,
      accepted_types: ['.jpg', '.jpeg', '.png']
    },
    {
      type: 'diploma',
      name: 'Diploma',
      required: false,
      max_size_mb: 5,
      accepted_types: ['.pdf', '.jpg', '.jpeg', '.png']
    },
    {
      type: 'medical_certificate',
      name: 'Tibbiy guvohnoma',
      required: false,
      max_size_mb: 3,
      accepted_types: ['.pdf', '.jpg', '.jpeg', '.png']
    },
    {
      type: 'prev_license',
      name: 'Avvalgi litsenziya',
      required: licenseConfig?.prerequisite !== null,
      max_size_mb: 3,
      accepted_types: ['.pdf', '.jpg', '.jpeg', '.png']
    }
  ].filter(doc => 
    !licenseConfig?.requiredDocs || 
    licenseConfig.requiredDocs.includes(doc.type) || 
    !doc.required
  );

  const handleFileUpload = useCallback((docType: string, files: FileList) => {
    const newFiles: DocumentFile[] = Array.from(files).map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      file,
      size: file.size,
      status: 'uploading',
    }));

    setDocuments(prev => ({
      ...prev,
      [docType]: [...(prev[docType] || []), ...newFiles]
    }));

    // Simulate upload progress
    newFiles.forEach((doc, index) => {
      setTimeout(() => {
        setDocuments(prev => ({
          ...prev,
          [docType]: prev[docType].map(d => 
            d.id === doc.id 
              ? { ...d, status: 'uploaded' as const }
              : d
          )
        }));
      }, 1000 + index * 200);
    });

    setErrors(prev => ({ ...prev, [docType]: '' }));
  }, []);

  const removeFile = useCallback((docType: string, fileId: string) => {
    setDocuments(prev => ({
      ...prev,
      [docType]: prev[docType].filter(doc => doc.id !== fileId)
    }));
  }, []);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    
    documentConfigs.forEach(doc => {
      if (doc.required && (!documents[doc.type] || documents[doc.type].length === 0)) {
        newErrors[doc.type] = `${doc.name} majburiy`;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onNext({ documents });
    }
  };

  const getDocumentStatus = (docType: string) => {
    const docs = documents[docType] || [];
    if (docs.length === 0) return 'missing';
    if (docs.some(doc => doc.status === 'uploading')) return 'uploading';
    if (docs.some(doc => doc.status === 'error')) return 'error';
    return 'complete';
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-[#0D3B6E] mb-2">
        Hujjatlar
      </h2>
      <p className="text-gray-600 mb-6">
        Arizangiz uchun kerakli hujatlarni yuklang
      </p>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Document Upload Areas */}
        {documentConfigs.map((docConfig, index) => {
          const status = getDocumentStatus(docConfig.type);
          const docs = documents[docConfig.type] || [];

          return (
            <motion.div
              key={docConfig.type}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="border border-gray-200 rounded-xl p-6"
            >
              {/* Document Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <h3 className="font-semibold text-[#0D3B6E]">{docConfig.name}</h3>
                  <Badge variant="secondary" className="text-xs">
                    {docConfig.required ? 'Majburiy' : 'Ixtiyoriy'}
                  </Badge>
                  {status === 'complete' && (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  )}
                  {status === 'uploading' && (
                    <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                  )}
                  {status === 'error' && (
                    <AlertCircle className="w-5 h-5 text-red-500" />
                  )}
                </div>
                <span className="text-sm text-gray-500">
                  Maksimal: {formatFileSize(docConfig.max_size_mb * 1024 * 1024)}
                </span>
              </div>

              {/* Upload Area */}
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer hover:border-[#F39C12] hover:bg-[#F39C12]/5 ${
                  errors[docConfig.type] ? 'border-red-500 bg-red-50' : 'border-gray-300'
                }`}
                onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.multiple = true;
                  input.accept = docConfig.accepted_types.join(',');
                  input.onchange = (e) => {
                    const files = (e.target as HTMLInputElement).files;
                    if (files) handleFileUpload(docConfig.type, files);
                  };
                  input.click();
                }}
              >
                <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 font-medium mb-2">
                  Hujjatlarni shu yerga olib boring yoki tanlang
                </p>
                <p className="text-sm text-gray-500">
                  {docConfig.accepted_types.join(', ').replace(/\./g, '')} formatlar
                </p>
              </div>

              {errors[docConfig.type] && (
                <p className="text-red-500 text-sm mt-2">{errors[docConfig.type]}</p>
              )}

              {/* Uploaded Files */}
              {docs.length > 0 && (
                <div className="mt-4 space-y-2">
                  {docs.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <File className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-700">{doc.name}</p>
                          <p className="text-xs text-gray-500">{formatFileSize(doc.size)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {doc.status === 'uploading' && (
                          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                        )}
                        {doc.status === 'uploaded' && (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        )}
                        {doc.status === 'error' && (
                          <AlertCircle className="w-5 h-5 text-red-500" />
                        )}
                        <button
                          type="button"
                          onClick={() => removeFile(docConfig.type, doc.id)}
                          className="p-1 hover:bg-gray-200 rounded"
                        >
                          <X className="w-4 h-4 text-gray-500" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          );
        })}

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

export default DocumentsStep;
