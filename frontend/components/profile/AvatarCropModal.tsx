'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, Camera, Image } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSave: (file: File) => void;
}

export function AvatarCropModal({ isOpen, onClose, onSave }: Props) {
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (selectedFile: File) => {
    if (!selectedFile.type.startsWith('image/')) return;
    if (selectedFile.size > 5 * 1024 * 1024) return;

    setFile(selectedFile);
    const reader = new FileReader();
    reader.onload = e => setPreview(e.target?.result as string);
    reader.readAsDataURL(selectedFile);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  };

  const handleSave = () => {
    if (file) onSave(file);
  };

  const reset = () => {
    setPreview(null);
    setFile(null);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm" onClick={reset} />

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4">

            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>

              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center">
                    <Camera className="w-4 h-4 text-[#1A56A0]" />
                  </div>
                  <h3 className="font-semibold text-[#0D3B6E]">Profil rasmini yangilash</h3>
                </div>
                <button onClick={reset}><X className="w-5 h-5 text-gray-400" /></button>
              </div>

              {preview ? (
                <div className="space-y-4">
                  <div className="flex justify-center">
                    <div className="relative">
                      <img src={preview} alt="Preview"
                        className="w-36 h-36 rounded-full object-cover border-4 border-[#1A56A0]/20" />
                      <button onClick={() => { setPreview(null); setFile(null); }}
                        className="absolute -top-2 -right-2 w-7 h-7 bg-red-500 text-white rounded-full
                                   flex items-center justify-center text-sm hover:bg-red-600">
                        ×
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 text-center">
                    {file?.name} ({((file?.size || 0) / 1024).toFixed(0)} KB)
                  </p>
                  <div className="flex gap-2">
                    <button onClick={() => { setPreview(null); setFile(null); }}
                      className="flex-1 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
                      Boshqa rasm
                    </button>
                    <button onClick={handleSave}
                      className="flex-1 py-2.5 bg-[#1A56A0] text-white rounded-lg text-sm font-medium hover:bg-[#0D3B6E]">
                      Saqlash
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all
                    ${isDragging ? 'border-[#1A56A0] bg-blue-50' : 'border-gray-200 hover:border-[#1A56A0] hover:bg-gray-50'}`}
                >
                  <Image className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm font-medium text-gray-700">Rasm tanlang yoki tashlang</p>
                  <p className="text-xs text-gray-400 mt-1">JPG, PNG — max 5MB</p>
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
                    onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
