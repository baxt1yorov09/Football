'use client';

import { motion } from 'framer-motion';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Shield, Users, AlertCircle, CheckCircle } from 'lucide-react';
import Link from 'next/link';

export default function TermsPage() {
  const sections = [
    {
      title: '1. Umumiy qoidalar',
      icon: FileText,
      content: [
        'Ushbu litsenziya berish tizimi ("Tizim") O\'zbekiston Murabbiylar ta\'limi ("Markaz") tomonidan boshqariladi.',
        'Tizimdan foydalanish orqali Federatsiyaning rasmiy roziligiga ega bo\'lishini talab qiladi.',
        'Litsenziya olish uchun ariza berishda to\'g\'ri va to\'liq ma\'lumotlarni taqdim etish majburiyati foydalanuvchi zimmasiga yuklanadi.',
        'Federatsiya ma\'lumotlarni tekshirish va tasdiqlash huquqini o\'zida saqlab qoladi.'
      ]
    },
    {
      title: '2. Litsenziya turlari',
      icon: Shield,
      content: [
        'PRO Litsenziya: Professional murabbiylar uchun, yuqori malakali murabbiylar uchun beriladi.',
        'A Toifa Litsenziya: Yuqori darajadagi murabbiylar uchun beriladi.',
        'B Toifa Litsenziya: O\'rta darajadagi murabbiylar uchun beriladi.',
        'C Toifa Litsenziya: Boshlang\'ich darajadagi murabbiylar uchun beriladi.',
        'D Toifa Litsenziya: Yoshlar jamoalari uchun beriladi.'
      ]
    },
    {
      title: '3. Ariza berish tartibi',
      icon: Users,
      content: [
        'Ariza onlayn rejimda Tizim orqali topshiriladi.',
        'Ariza qabul qilingandan so\'ng foydalanuvchi elektron pochtasiga tasdiqlash xabari yuboriladi.',
        'Kerakli hujjatlar skaner qilinib yuklanishi kerak.',
        'Ariza ko\'rib chiqish jarayoni 5 ish kunidan oshmasligi mumkin.',
        'Qo\'shimcha hujjatlar talab qilinsa, foydalanuvchi 3 kun ichida taqdim etishi kerak.'
      ]
    },
    {
      title: '4. To\'lov shartlari',
      icon: Shield,
      content: [
        'Litsenziya to\'lovlari Tizim orqali amalga oshiriladi.',
        'To\'lov uchun bank kartalari va elektron to\'lov tizimlari qo\'llab-quvvatlanadi.',
        'Litsenziya berish to\'lovi ariza tasdiqlangandan so\'ng amalga oshiriladi.',
        'To\'lov qilingandan so\'ng litsenziya raqami beriladi.'
      ]
    },
    {
      title: '5. Mas\'uliyatlar',
      icon: AlertCircle,
      content: [
        'Foydalanuvchi o\'z ma\'lumotlarining to\'g\'riligiga va dolzarbligiga mas\'ul bo\'ladi.',
        'Noto\'g\'ri ma\'lumot berish litsenziyadan mahrum qilishiga olib kelishi mumkin.',
        'Litsenziya shartlarini buzish holatida litsenziya bekor qilinishi mumkin.',
        'Federatsiya foydalanuvchi ma\'lumotlarini himoya qilish majburiyatini oladi.'
      ]
    },
    {
      title: '6. Maxfiylik siyosati',
      icon: Shield,
      content: [
        'Foydalanuvchi ma\'lumotlari maxfiy hisoblanadi va uchinchi shaxslarga berilmaydi.',
        'Shaxsiy ma\'lumotlar faqat litsenziyani berish va tekshirish maqsadida ishlatilishi mumkin.',
        'Ma\'lumotlarni himoya qilish uchun zamonaviy texnik vositalardan foydalaniladi.',
        'Foydalanuvchi o\'z ma\'lumotlarini istalgan vaqtda ko\'rish va o\'zgartirish huquqiga ega.'
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
              <FileText className="w-10 h-10 text-blue-600" />
            </div>
            <h1 className="text-4xl font-bold text-[#0D3B6E] mb-4">
              Foydalanish shartlari
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              O&apos;zbekiston Murabbiylar ta&apos;limi litsenziya berish tizimining rasmiy shartlari
            </p>
          </motion.div>

          {/* Last Updated */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8"
          >
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4 text-center">
                <p className="text-sm text-gray-600">
                  Oxirgi marta yangilangan: <span className="font-semibold">8-may, 2026</span>
                </p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Terms Sections */}
          <div className="space-y-8">
            {sections.map((section, index) => {
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
                      <ul className="space-y-3">
                        {section.content.map((item, itemIndex) => (
                          <li key={itemIndex} className="flex items-start gap-3">
                            <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                            <span className="text-gray-700 leading-relaxed">{item}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>

          {/* Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="text-center"
          >
            <Card className="bg-gray-50 border-gray-200">
              <CardContent className="p-6">
                <h3 className="text-lg font-semibold text-[#0D3B6E] mb-4">
                  Siz rozimisizmi?
                </h3>
                <p className="text-gray-600 mb-6">
                  Tizimdan foydalanish orqali yuqoridagi shartlarni qabul qilasiz
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link href="/apply">
                    <Button size="lg" className="px-8">
                      Ariza berish
                    </Button>
                  </Link>
                  <Link href="/auth">
                    <Button variant="outline" size="lg" className="px-8">
                      Kirish
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Contact */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0 }}
            className="mt-12"
          >
            <Card>
              <CardContent className="p-6 text-center">
                <h3 className="text-lg font-semibold text-[#0D3B6E] mb-4">
                  Qo\'shimcha savollaringiz bormi?
                </h3>
                <p className="text-gray-600 mb-6">
                  Bizga murojaat qiling, mamurlar javob berishadi
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <h4 className="font-medium mb-2">Telefon</h4>
                    <p className="text-gray-700">+998 93 998 10 29 / +998 99 452 17 77</p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Email</h4>
                    <p className="text-gray-700">murabbiylartalimi@gmail.com</p>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Manzil</h4>
                    <p className="text-gray-700">Toshkent shahar, Chilonzor tumani, Bunyodkor shoh ko&apos;chasi 47</p>
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
