'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Header } from '@/components/layout/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, HelpCircle, Book, Video, MessageSquare, Phone, Mail } from 'lucide-react';

export default function HelpPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  const categories = [
    { id: 'all', name: 'Barchasi', icon: HelpCircle },
    { id: 'getting-started', name: 'Boshlash', icon: Book },
    { id: 'video-tutorials', name: 'Video darslar', icon: Video },
    { id: 'faq', name: 'Tez-tez savollar', icon: MessageSquare },
    { id: 'contact', name: 'Aloqa', icon: Phone }
  ];

  interface HelpItem {
  title: string;
  description: string;
  content?: string[];
  videos?: Array<{
    title: string;
    duration: string;
    thumbnail: string;
  }>;
  faqs?: Array<{
    question: string;
    answer: string;
  }>;
}

interface ContactInfo {
  title: string;
  value: string;
  icon: React.ComponentType<any>;
  action: string;
}

const helpContent = [
    {
      category: 'getting-started',
      title: 'Tizimdan ro\'yxatdan o\'tish',
      description: 'Tizimdan ro\'yxatdan o\'tish va litsenziya olish bo\'yicha qo\'llanma',
      content: [
        '1. Ro\'yxatdan o\'tingiz',
        '2. Kerakli hujatlarni tayyorlang',
        '3. Onlayn ariza topshiring',
        '4. To\'lovni amalga oshiring',
        '5. Litsenziyangizni qabul qiling'
      ]
    },
    {
      category: 'getting-started',
      title: 'Profilni to\'ldirish',
      description: 'Shaxsiy ma\'lumotlarni to\'g\'ri kiriting va yangilang',
      content: [
        '1. Kirish va Profil sahifasiga o\'ting',
        '2. "Tahrirlash" tugmasini bosing',
        '3. Ma\'lumotlarni yangilang',
        '4. O\'zgarishlarni saqlang'
      ]
    },
    {
      category: 'video-tutorials',
      title: 'Ariza berish video qo\'llanmasi',
      description: 'Ariza berish jarayonini video orqali o\'rganing',
      videos: [
        {
          title: 'Ro\'yxatdan o\'tish',
          duration: '3:45',
          thumbnail: '/api/placeholder/320x180'
        },
        {
          title: 'Ariza to\'ldirish',
          duration: '5:20',
          thumbnail: '/api/placeholder/320x180'
        },
        {
          title: 'Hujjatlar yuklash',
          duration: '2:30',
          thumbnail: '/api/placeholder/320x180'
        }
      ]
    },
    {
      category: 'faq',
      title: 'Tez-tez savollar',
      description: 'Eng ko\'p berilgan savollar va javoblari',
      faqs: [
        {
          question: 'Litsenziya olish uchun qanday hujjatlar kerak?',
          answer: 'Pasport nusxasi, diplom, malaka oshirish sertifikatlari va so\'nggi rasm kerak. Barcha hujjatlar skaner qilinib yuklanishi shart.'
        },
        {
          question: 'Ariza qabul qilingandan so\'ng qancha vaqt o\'tadi?',
          answer: 'Arizangiz to\'liq bo\'lgandan so\'ng 5 ish kun ichida ko\'rib chiqiladi. Ba\'zi hollarda qo\'shimcha hujjatlar talab qilinishi mumkin.'
        },
        {
          question: 'Litsenziya narxi qancha?',
          answer: 'Litsenziya narxi turiga va muddatiga qarab belgilanadi. Batafsil ma\'lumot uchun narxlar jadvalida qarash mumkin.'
        },
        {
          question: 'To\'lov qanday usullarda amalga oshiriladi?',
          answer: 'To\'lov bank kartasi, Click, Payme yoki elektron to\'lov tizimlari orqali amalga oshirilishi mumkin. To\'lov qilingandan so\'ng litsenziya raqami beriladi.'
        },
        {
          question: 'Litsenziyani uzaytirish qanday amalga oshiriladi?',
          answer: 'Litsenziyani uzaytirish uchun muddat tugashidan 30 kun oldin yangi ariza berish kerak. Yangi litsenziya berilguncha eski litsenziya amal qiladi.'
        }
      ]
    },
    {
      category: 'contact',
      title: 'Qo\'llab-quvvatlash xizmati',
      description: 'Qo\'llab-quvvatlash xizmati bilan bog\'lanish',
      content: [
        'Telefon raqami: +998 93 998 10 29 / +998 99 452 17 77',
        'Email manzili: murabbiylartalimi@gmail.com',
        'Ish vaqti: Dushanba-Juma: 9:00 - 18:00'
      ]
    }
  ];

  const filteredContent = helpContent.filter(item => 
    activeCategory === 'all' || item.category === activeCategory
  );

  const filteredFAQs = filteredContent
    .filter(item => item.faqs)
    .flatMap(item => item.faqs || [])
    .filter(faq => 
      faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchTerm.toLowerCase())
    );

  return (
    <div className="min-h-screen bg-[#F4F6F9]">
      <Header />
      
      <main className="pt-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <HelpCircle className="w-10 h-10 text-blue-600" />
            </div>
            <h1 className="text-4xl font-bold text-[#0D3B6E] mb-4">
              Yordam
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Tizimdan foydalanish bo\'yicha qo\'llanma va yordam
            </p>
          </motion.div>

          {/* Search */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8"
          >
            <div className="relative max-w-2xl mx-auto">
              <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Yordam izlash..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </motion.div>

          {/* Categories */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-8"
          >
            <div className="flex flex-wrap justify-center gap-4">
              {categories.map((category) => {
                const Icon = category.icon;
                return (
                  <Button
                    key={category.id}
                    variant={activeCategory === category.id ? "default" : "outline"}
                    onClick={() => setActiveCategory(category.id)}
                    className="flex items-center gap-2"
                  >
                    <Icon className="w-4 h-4" />
                    {category.name}
                  </Button>
                );
              })}
            </div>
          </motion.div>

          {/* Content */}
          <div className="space-y-8">
            {filteredContent.map((content, index) => (
              <motion.div
                key={content.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle>{content.title}</CardTitle>
                    <p className="text-gray-600 mt-2">{content.description}</p>
                  </CardHeader>
                  <CardContent>
                    {/* Content List */}
                    {content.content && (
                      <ol className="space-y-2 list-decimal list-inside">
                        {content.content.map((item, itemIndex) => (
                          <li key={itemIndex} className="flex items-start gap-3">
                            <span className="font-medium text-gray-900">{item}</span>
                          </li>
                        ))}
                      </ol>
                    )}

                    {/* Videos */}
                    {content.videos && (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {content.videos.map((video, videoIndex) => (
                          <div key={videoIndex} className="group cursor-pointer">
                            <div className="relative aspect-video bg-gray-200 rounded-lg overflow-hidden">
                              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                                <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center">
                                  <Video className="w-6 h-6 text-gray-700" />
                                </div>
                              </div>
                            </div>
                            <h4 className="mt-3 font-medium">{video.title}</h4>
                            <p className="text-sm text-gray-500">{video.duration}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* FAQs */}
                    {content.faqs && (
                      <div className="space-y-4">
                        {content.faqs.map((faq, faqIndex) => (
                          <Card key={faqIndex} className="border border-gray-200">
                            <CardHeader>
                              <CardTitle className="text-lg">{faq.question}</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <p className="text-gray-700 leading-relaxed">{faq.answer}</p>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}

                    {/* Contact Info */}
                    {content.content && Array.isArray(content.content) && content.content.map((item: any, itemIndex: number) => (
                      itemIndex === 0 && typeof item === 'string' && item.includes('Telefon') && (
                        <div key={itemIndex} className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {content.content.map((contactItem: any, contactIndex: number) => (
                            <div key={contactIndex} className="text-center p-4 bg-gray-50 rounded-lg">
                              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                {contactIndex === 0 && <Phone className="w-6 h-6 text-blue-600" />}
                                {contactIndex === 1 && <Mail className="w-6 h-6 text-blue-600" />}
                                {contactIndex === 2 && <HelpCircle className="w-6 h-6 text-blue-600" />}
                              </div>
                              <h4 className="font-medium mb-1">{contactItem.split(':')[0]}</h4>
                              <p className="text-gray-700">{contactItem.split(':')[1]}</p>
                            </div>
                          ))}
                        </div>
                      )
                    ))}
                  </CardContent>
                </Card>
              </motion.div>
            ))}

            {/* Search Results for FAQs */}
            {searchTerm && filteredFAQs.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <Card>
                  <CardHeader>
                    <CardTitle>Qidirish natijalari</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {filteredFAQs.map((faq, index) => (
                        <div key={index} className="border-b border-gray-100 last:border-0 pb-4 last:pb-0">
                          <h4 className="font-medium text-gray-900 mb-2">{faq.question}</h4>
                          <p className="text-gray-700 leading-relaxed">{faq.answer}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
