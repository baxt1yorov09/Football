'use client';

import { motion } from 'framer-motion';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, FileText, Lock, Eye } from 'lucide-react';

export default function PrivacyPage() {
  const privacySections = [
    {
      title: 'Ma\'lumotlarni yig\'ish',
      icon: Shield,
      content: [
        'Biz O\'zbekiston Futbol Federatsiyasi litsenziya berish tizimi orqali foydalanuvchilardan quyidagilarni yig\'itamiz:',
        '• Shaxsiy ma\'lumotlar: F.I.O., ism, familiya, tug\'ilgan sana, telefon raqami, elektron pochta manzili',
        '• Litsenziya ma\'lumotlari: Litsenziya turi, raqami, berilgan sana, muddati, tasdiqlash kodi',
        '• Malaka ma\'lumotlari: Olingan malakalar, sertifikatlar, diplomlar',
        '• Ish tajribasi: Ish joylari, lavozimlar, qo\'shimcha malakalar',
        '• Hujjatlar: Pasport nusxalari, diplomlar, malaka sertifikatlari, suratlar',
        '• To\'lov ma\'lumotlari: Bank kartalari raqamlari, to\'lov sanalari, summalari'
      ]
    },
    {
      title: 'Ma\'lumotlardan foydalanish',
      icon: FileText,
      content: [
        'Biz quyidagi maqsadlarda foydalanuvchilarning ma\'lumotlaridan foydalanamiz:',
        '• Litsenziya berish: Arizalarni ko\'rib chiqish, qabul qilish yoki rad etish',
        '• Litsenziya tasdiqlash: Arizalarni tekshirish, hujjatlar talab qilish',
        '• Hisob-kitob: To\'lovlar qabul qilish, hisob-fakturalar tayyorlash',
        '• Kommunikatsiya: Elektron pochta, SMS xabarlari, telefon qo\'ng\'ilishlar',
        '• Tahlil: Foydalanuvchilar xulq-atini tahlil qilish, statistikani yig\'ish',
        '• Xavfsizlik: Ma\'lumotlarni himoya qilish, xavfsizlik holatlarida to\'g\'ri javob berish'
      ]
    },
    {
      title: 'Ma\'lumotlarni himoyalash',
      icon: Lock,
      content: [
        'Biz quyidagi choralar bilan foydalanuvchilarning ma\'lumotlarini himoya qilamiz:',
        '• Texnikaviy himoya: SSL shifrlash, firewalllar, viruslardan himoya qilish',
        '• Tashkili himoya: Ma\'lumotlarni fizik himoya qilish, kirish nazorati',
        '• Ma\'lumotlarni saqlash: Avtomatik zaxira qilish, ma\'lumotlarni tiklash',
        '• Xodimlar majburiyati: Maxfiylik shartnomalari, o\'qitish majburiyatlari'
      ]
    },
    {
      title: 'Foydalanuvchi huquqlari',
      icon: Eye,
      content: [
        'Foydalanuvchilarga quyidagi huquqlar beriladi:',
        '• Ma\'lumotlarni ko\'rish: O\'z ma\'lumotlarini ko\'rish, tahrirlash, o\'chirish huquqi',
        '• Ma\'lumotlarni tuzatish: Noto\'g\'ri ma\'lumotlarni to\'g\'rilash talab qilish',
        '• Ma\'lumotlarni o\'chirish: O\'z ma\'lumotlarini to\'liq o\'chirish huquqi',
        '• Hisob-kitob: To\'lovlar tarixini ko\'rish, hisob-fakturalar olish',
        '• Shikoyat: Ma\'lumotlarni himoya qilish bo\'yicha shikoyatlar qilish huquqi'
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-[#F4F6F9]">
      <Header />
      
      <main className="pt-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Shield className="w-10 h-10 text-blue-600" />
            </div>
            <h1 className="text-4xl font-bold text-[#0D3B6E] mb-4">
              Maxfiylik siyosati
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              O\'zbekiston Futbol Federatsiyasi litsenziya berish tizimidagi foydalanuvchilarning ma\'lumotlarini himoya qilish siyosati
            </p>
          </motion.div>

          {/* Privacy Sections */}
          <div className="space-y-8">
            {privacySections.map((section, index) => {
              const Icon = section.icon;
              return (
                <motion.div
                  key={section.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + index * 0.1 }}
                >
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <Icon className="w-5 h-5 text-blue-600" />
                        </div>
                        {section.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {section.content.map((item, itemIndex) => (
                          <div key={itemIndex} className="flex items-start gap-3">
                            <div className="w-2 h-2 text-blue-600 mt-1 flex-shrink-0">
                              <span className="w-full h-full bg-blue-600 rounded-full flex items-center justify-center">
                                <span className="w-1 h-1 bg-white rounded-full"></span>
                              </span>
                            </div>
                            <p className="text-gray-700 leading-relaxed flex-1">{item}</p>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>

          {/* Contact */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            <Card className="bg-blue-50 border-blue-200">
              <CardHeader>
                <CardTitle className="text-center">
                  Qo\'shimcha savollaringiz bormi?
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-gray-700 mb-6">
                  Agar maxfiylik siyosati bo\'yicha savollaringiz bo\'lsa, biz bilan bog\'laning
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-semibold mb-2">Elektron pochta</h4>
                    <p className="text-gray-600">privacy@uff.uz</p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Telefon</h4>
                    <p className="text-gray-600">+998 71 200 00 00</p>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Ish vaqti</h4>
                    <p className="text-gray-600">Dushanba-Juma: 9:00 - 18:00</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </main>
    </div>
  );
}
