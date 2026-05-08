'use client';

import { motion } from 'framer-motion';
import { UserPlus, FileText, Search, FileCheck } from 'lucide-react';

const steps = [
  {
    icon: UserPlus,
    title: "Ro'yxatdan o'ting",
    description: "Telefon raqamingiz orqali bir daqiqada ro'yxatdan o'ting",
    color: '#3498DB',
  },
  {
    icon: FileText,
    title: 'Ariza bering',
    description: "Kerakli hujjatlarni yuklab, onlayn ariza to'ldiring",
    color: '#1ABC9C',
  },
  {
    icon: Search,
    title: "Ko'rib chiqiladi",
    description: "Arizangiz 2-3 ish kuni ichida ko'rib chiqiladi",
    color: '#F39C12',
  },
  {
    icon: FileCheck,
    title: 'Litsenziya oling',
    description: 'PDF formatida litsenziya va QR-kodni yuklab oling',
    color: '#27AE60',
  },
];

export function ProcessSteps() {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-[#0D3B6E] mb-4">
            Jarayon qanday ishlaydi?
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            4 oddiy bosqichda professional murabbiy litsenziyasiga ega bo'ling
          </p>
        </motion.div>

        <div className="relative">
          {/* Connecting line */}
          <div className="hidden md:block absolute top-1/2 left-0 right-0 h-1 bg-gray-200 -translate-y-1/2" />

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.2, duration: 0.6 }}
                className="relative"
              >
                <div className="flex flex-col items-center text-center">
                  {/* Step number circle */}
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    className="relative z-10 w-20 h-20 rounded-full flex items-center justify-center mb-6 shadow-lg"
                    style={{ backgroundColor: step.color }}
                  >
                    <step.icon className="w-8 h-8 text-white" />
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-[#0D3B6E] rounded-full flex items-center justify-center text-white text-sm font-bold">
                      {index + 1}
                    </div>
                  </motion.div>

                  <h3 className="text-xl font-bold text-[#0D3B6E] mb-2">
                    {step.title}
                  </h3>
                  <p className="text-gray-600 text-sm">
                    {step.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export default ProcessSteps;
