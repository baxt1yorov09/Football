'use client';

import { motion } from 'framer-motion';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, Shield, Award, Users } from 'lucide-react';
import Link from 'next/link';

export default function ApplyPage() {
  const licenseTypes = [
    {
      type: 'PRO',
      title: 'PRO Litsenziya',
      description: 'Professional murabbiylar uchun eng yuqori toifadagi litsenziya',
      icon: Shield,
      color: 'bg-blue-500',
      href: '/apply/PRO'
    },
    {
      type: 'A',
      title: 'A Toifa Litsenziya',
      description: 'Yuqori darajadagi murabbiylar uchun litsenziya',
      icon: Award,
      color: 'bg-green-500',
      href: '/apply/A'
    },
    {
      type: 'B',
      title: 'B Toifa Litsenziya',
      description: 'O\'rta darajadagi murabbiylar uchun litsenziya',
      icon: Users,
      color: 'bg-orange-500',
      href: '/apply/B'
    },
    {
      type: 'C',
      title: 'C Toifa Litsenziya',
      description: 'Boshlang\'ich darajadagi murabbiylar uchun litsenziya',
      icon: Award,
      color: 'bg-purple-500',
      href: '/apply/C'
    },
    {
      type: 'D',
      title: 'D Toifa Litsenziya',
      description: 'Yoshlar jamoalari uchun litsenziya',
      icon: Users,
      color: 'bg-red-500',
      href: '/apply/D'
    }
  ];

  return (
    <div className="min-h-screen bg-[#F4F6F9]">
      <Header />
      
      <main className="pt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl font-bold text-[#0D3B6E] mb-4">
              Litsenziya olish
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              O\'zingizga mos litsenziya turini tanlang va arizangizni online tarzda topshiring
            </p>
          </motion.div>

          {/* License Types Grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {licenseTypes.map((license, index) => {
              const Icon = license.icon;
              return (
                <motion.div
                  key={license.type}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                >
                  <Card className="hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer group">
                    <CardHeader className="text-center pb-4">
                      <div className={`w-16 h-16 ${license.color} rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform`}>
                        <Icon className="w-8 h-8 text-white" />
                      </div>
                      <CardTitle className="text-xl mb-2">{license.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="text-center">
                      <p className="text-gray-600 mb-6 min-h-[3rem]">
                        {license.description}
                      </p>
                      <Link href={license.href}>
                        <Button className="w-full group-hover:bg-blue-600 transition-colors">
                          Ariza berish
                          <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </motion.div>

          {/* Info Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="mt-16"
          >
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-8">
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-[#0D3B6E] mb-4">
                    Ariza berish jarayoni
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8 text-left">
                    <div>
                      <div className="w-12 h-12 bg-blue-500 text-white rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="font-bold">1</span>
                      </div>
                      <h4 className="font-semibold text-lg mb-2">Litsenziya turini tanlang</h4>
                      <p className="text-gray-600">
                        O\'zingizga mos keladigan litsenziya turini tanlang
                      </p>
                    </div>
                    <div>
                      <div className="w-12 h-12 bg-blue-500 text-white rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="font-bold">2</span>
                      </div>
                      <h4 className="font-semibold text-lg mb-2">Ma\'lumotlarni to\'ldiring</h4>
                      <p className="text-gray-600">
                        Kerakli barcha ma\'lumotlarni to\'g\'ri kiriting
                      </p>
                    </div>
                    <div>
                      <div className="w-12 h-12 bg-blue-500 text-white rounded-full flex items-center justify-center mx-auto mb-4">
                        <span className="font-bold">3</span>
                      </div>
                      <h4 className="font-semibold text-lg mb-2">Arizani yuboring</h4>
                      <p className="text-gray-600">
                        Arizangizni tekshirish uchun yuboring
                      </p>
                    </div>
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
