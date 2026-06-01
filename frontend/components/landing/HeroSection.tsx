'use client';

import { motion } from 'framer-motion';
import { ArrowRight, Shield, MapPin, Award } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

// Animated counter component
function AnimatedCounter({ value, suffix = '' }: { value: number; suffix?: string }) {
  // Use consistent formatting to avoid hydration mismatch
  const formattedValue = typeof window === 'undefined' 
    ? value.toLocaleString('en-US') 
    : value.toLocaleString('en-US');
    
  return (
    <motion.span
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.8, delay: 0.2 }}
      className="text-4xl md:text-5xl font-bold text-white"
    >
      {formattedValue}{suffix}
    </motion.span>
  );
}

// Floating football animation
function FloatingFootball() {
  return (
    <motion.div
      className="absolute top-20 right-10 md:right-32 opacity-20"
      animate={{
        y: [0, -20, 0],
        rotate: [0, 360],
        scale: [1, 1.1, 1],
      }}
      transition={{
        y: { duration: 3, repeat: Infinity, ease: "easeInOut" },
        rotate: { duration: 8, repeat: Infinity, ease: "linear" },
        scale: { duration: 2, repeat: Infinity, ease: "easeInOut" },
      }}
    >
      <svg width="120" height="120" viewBox="0 0 100 100" fill="none" className="text-white">
        <circle cx="50" cy="50" r="45" stroke="currentColor" strokeWidth="2" fill="none"/>
        <path d="M50 5 L50 20 M50 80 L50 95 M5 50 L20 50 M80 50 L95 50" stroke="currentColor" strokeWidth="2"/>
        <circle cx="50" cy="50" r="15" stroke="currentColor" strokeWidth="2"/>
        <path d="M35 35 L25 25 M65 35 L75 25 M35 65 L25 75 M65 65 L75 75" stroke="currentColor" strokeWidth="2"/>
      </svg>
    </motion.div>
  );
}

export function HeroSection() {
  const stats = [
    { value: 2400, suffix: '+', label: 'Murabbiy', icon: Award },
    { value: 14, suffix: '', label: 'Hudud', icon: MapPin },
    { value: 26, suffix: '', label: 'Litsenziya turi', icon: Shield },
  ];

  return (
    <section className="relative min-h-[90vh] bg-gradient-to-br from-[#0D3B6E] via-[#1A56A0] to-[#2D9CDB] overflow-hidden">
      {/* Animated background pattern */}
      <div className="absolute inset-0 opacity-10">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      {/* Floating football */}
      <FloatingFootball />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left content */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-white"
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full mb-6"
            >
              <span className="w-2 h-2 bg-[#27AE60] rounded-full animate-pulse" />
              <span className="text-sm font-medium">O&apos;zbekiston Murabbiylar ta&apos;limi</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight mb-6"
            >
              O&apos;zbekiston futbol murabbiylarini{" "}
              <span className="text-[#F39C12]">litsenziyalash</span>{" "}
              tizimi
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="text-lg md:text-xl text-white/80 mb-8 max-w-xl"
            >
              Barcha 12 ta hudud, Qoraqalpog&apos;iston Respublikasi va Toshkent shahri uchun yagona raqamli platforma. Murabbiylar uchun professional litsenziyalash jarayonini raqamlashtirish.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.6 }}
              className="flex flex-col sm:flex-row gap-4"
            >
              <Link href="/apply/D">
                <Button 
                  size="lg" 
                  className="bg-[#F39C12] hover:bg-[#E67E22] text-white px-8 py-6 text-lg font-semibold group"
                >
                  Ariza berish
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="/verify">
                <Button 
                  variant="outline" 
                  size="lg"
                  className="border-white/30 text-white hover:bg-white/10 px-8 py-6 text-lg"
                >
                  Litsenziyamni tekshirish
                </Button>
              </Link>
            </motion.div>
          </motion.div>

          {/* Right content - Stats cards */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.3 }}
            className="grid grid-cols-1 sm:grid-cols-3 gap-4"
          >
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + index * 0.1, duration: 0.6 }}
                whileHover={{ y: -8, transition: { duration: 0.2 } }}
                className="bg-white/10 backdrop-blur-md rounded-2xl p-6 text-center border border-white/20 hover:bg-white/20 transition-colors"
              >
                <stat.icon className="w-8 h-8 mx-auto mb-4 text-[#F39C12]" />
                <AnimatedCounter value={stat.value} suffix={stat.suffix} />
                <p className="text-white/70 mt-2">{stat.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>

      {/* Bottom wave */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
          <path
            d="M0 120L48 110C96 100 192 80 288 70C384 60 480 60 576 65C672 70 768 80 864 85C960 90 1056 90 1152 85C1248 80 1344 70 1392 65L1440 60V120H1392C1344 120 1248 120 1152 120C1056 120 960 120 864 120C768 120 672 120 576 120C480 120 384 120 288 120C192 120 96 120 48 120H0Z"
            fill="#F4F6F9"
          />
        </svg>
      </div>
    </section>
  );
}

export default HeroSection;
