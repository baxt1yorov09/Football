'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, HelpCircle } from 'lucide-react';

const faqs = [
  {
    question: "Litsenziya olish uchun qanday hujjatlar kerak?",
    answer: "Asosiy hujjatlar: pasport nusxasi, 3x4 formatdagi rasm, va oldingi litsenziya (agar mavjud bo'lsa). Ba'zi litsenziya turlari uchun qo'shimcha sertifikatlar talab qilinishi mumkin."
  },
  {
    question: "Litsenziya olish jarayoni qancha vaqt oladi?",
    answer: "Ariza topshirilgandan so'ng, 2-3 ish kuni ichida ko'rib chiqiladi. Tasdiqlangan taqdirda, litsenziya darhol PDF formatida yuklab olinishi mumkin."
  },
  {
    question: "Bir nechta litsenziya olish mumkinmi?",
    answer: "Ha, siz bir vaqtning o'zida bir nechta litsenziya turiga ega bo'lishingiz mumkin. Masalan, asosiy murabbiy litsenziyasi bilan birga fitness yoki darvozabon litsenziyasini ham olishingiz mumkin."
  },
  {
    question: "PRO litsenziya faqat Toshkentda olinadimi?",
    answer: "Ha, PRO litsenziya faqat Toshkent shahrida o'tkaziladigan maxsus trening va imtihonlardan so'ng beriladi. Boshqa viloyatlarda faqat D, C, B, A litsenziyalarini olish mumkin."
  },
  {
    question: "Litsenziya amal qilish muddati qancha?",
    answer: "Litsenziyalar 2 yil muddatga beriladi. Muddat tugashidan 30 kun oldin yangilash arizasi topshirilishi mumkin."
  },
  {
    question: "Ariza rad etilsa nima qilish kerak?",
    answer: "Agar ariza rad etilsa, sizga rad etish sababi ko'rsatiladi. Xatolarni to'g'rilab, qayta ariza topshirishingiz mumkin. Rad etish sabablarini bartaraf etish uchun 30 kun vaqt beriladi."
  },
  {
    question: "Litsenziya uchun to'lov qilish kerakmi?",
    answer: "Hozirda tizim sinov rejimida ishlamoqda va litsenziyalar bepul berilmoqda. Kelajakda xarajatlarni qoplash uchun nominal to'lovlar joriy etilishi mumkin."
  },
  {
    question: "Telegram botdan qanday foydalanish mumkin?",
    answer: "UFF_License_bot ga start bosing, telefon raqamingizni ulashing va arizangiz holatini real vaqtda kuzating. Shuningdek, litsenziya muddati tugashidan oldin bildirishnomalar olasiz."
  },
];

function FAQItem({ question, answer, isOpen, onClick, index }: {
  question: string;
  answer: string;
  isOpen: boolean;
  onClick: () => void;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.1 }}
      className="border-b border-gray-200 last:border-0"
    >
      <button
        onClick={onClick}
        className="w-full py-5 flex items-center justify-between text-left hover:bg-gray-50 transition-colors px-4 rounded-lg"
      >
        <span className="font-medium text-[#0D3B6E] pr-4">{question}</span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          className="flex-shrink-0"
        >
          <ChevronDown className="w-5 h-5 text-[#1A56A0]" />
        </motion.div>
      </button>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <p className="pb-5 px-4 text-gray-600 leading-relaxed">
              {answer}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#1A56A0]/10 rounded-full mb-4">
            <HelpCircle className="w-4 h-4 text-[#1A56A0]" />
            <span className="text-sm text-[#1A56A0] font-medium">FAQ</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-[#0D3B6E] mb-4">
            Tez-tez so&apos;raladigan savollar
          </h2>
          <p className="text-gray-600">
            Eng mashhur savollar va javoblar
          </p>
        </motion.div>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-100">
          {faqs.map((faq, index) => (
            <FAQItem
              key={index}
              question={faq.question}
              answer={faq.answer}
              isOpen={openIndex === index}
              onClick={() => setOpenIndex(openIndex === index ? null : index)}
              index={index}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

export default FAQ;
