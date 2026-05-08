'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Settings, Bell, Shield, Globe, Palette, Database, Trash2 } from 'lucide-react';

export default function SettingsPage() {
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [language, setLanguage] = useState('uz');

  const settingsSections = [
    {
      title: 'Umumiy sozlamalar',
      icon: Settings,
      items: [
        { 
          label: 'Til', 
          value: language, 
          onChange: (value: string) => setLanguage(value), 
          type: 'select', 
          options: [
            { value: 'uz', label: 'O\'zbekcha' },
            { value: 'ru', label: 'Русский' },
            { value: 'en', label: 'English' }
          ]
        },
        { 
          label: 'Mavzu', 
          value: darkMode, 
          onChange: (value: boolean) => setDarkMode(value), 
          type: 'toggle' 
        }
      ]
    },
    {
      title: 'Bildirishnomalar',
      icon: Bell,
      items: [
        { 
          label: 'Bildirishnomalarni yoqish', 
          value: notifications, 
          onChange: (value: boolean) => setNotifications(value), 
          type: 'toggle' 
        }
      ]
    },
    {
      title: 'Xavfsizlik',
      icon: Shield,
      items: [
        { 
          label: 'Parolni o\'zgartirish', 
          value: '', 
          onChange: () => {}, 
          type: 'button' 
        },
        { 
          label: 'Ikki faktorli autentifikatsiya', 
          value: false, 
          onChange: (value: boolean) => {}, 
          type: 'toggle' 
        }
      ]
    },
    {
      title: 'Ma\'lumotlar',
      icon: Database,
      items: [
        { 
          label: 'Ma\'lumotlarni eksport qilish', 
          value: '', 
          onChange: () => {}, 
          type: 'button' 
        },
        { 
          label: 'Hisobni o\'chirish', 
          value: '', 
          onChange: () => {}, 
          type: 'danger-button' 
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-[#F4F6F9]">
      <Header />
      <Sidebar />
      
      <main className="ml-64 pt-16">
        <div className="p-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-3xl font-bold text-[#0D3B6E]">
              Sozlamalar
            </h1>
            <p className="text-gray-600 mt-1">
              Hisobingiz sozlamalarini boshqaring
            </p>
          </motion.div>

          {/* Settings Sections */}
          <div className="space-y-6">
            {settingsSections.map((section, sectionIndex) => {
              const Icon = section.icon;
              return (
                <motion.div
                  key={section.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + sectionIndex * 0.1 }}
                >
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Icon className="w-5 h-5" />
                        {section.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {section.items.map((item, itemIndex) => (
                          <div key={item.label} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                            <div>
                              <p className="font-medium">{item.label}</p>
                              {item.type === 'toggle' && (
                                <p className="text-sm text-gray-500">
                                  {item.value ? 'Yoqilgan' : 'O\'chirilgan'}
                                </p>
                              )}
                            </div>
                            <div>
                              {item.type === 'toggle' && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => (item.onChange as (value: boolean) => void)(!item.value)}
                                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                                    item.value ? 'bg-blue-600' : 'bg-gray-200'
                                  }`}
                                >
                                  <span
                                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                      item.value ? 'translate-x-6' : 'translate-x-1'
                                    }`}
                                  />
                                </Button>
                              )}
                              {item.type === 'select' && (
                                <select
                                  value={item.value as string}
                                  onChange={(e) => (item.onChange as (value: string) => void)(e.target.value)}
                                  className="px-3 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                  {('options' in item) && item.options?.map((option: { value: string; label: string }) => (
                                    <option key={option.value} value={option.value}>
                                      {option.label}
                                    </option>
                                  ))}
                                </select>
                              )}
                              {item.type === 'button' && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => (item.onChange as () => void)()}
                                >
                                  {item.label.includes('o\'zgartirish') ? 'O\'zgartirish' : 
                                   item.label.includes('eksport') ? 'Eksport qilish' : 'Ochish'}
                                </Button>
                              )}
                              {item.type === 'danger-button' && (
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => (item.onChange as () => void)()}
                                  className="flex items-center gap-2"
                                >
                                  <Trash2 className="w-4 h-4" />
                                  {item.label.includes('o\'chirish') ? 'O\'chirish' : 'Boshqarish'}
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>

          {/* Save Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-8 text-center"
          >
            <Button size="lg" className="px-8">
              Sozlamalarni saqlash
            </Button>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
