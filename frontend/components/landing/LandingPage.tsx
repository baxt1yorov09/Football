'use client';

import { motion } from 'framer-motion';
import { HeroSection } from './HeroSection';
import { LicenseTypes } from './LicenseTypes';
import { ProcessSteps } from './ProcessSteps';
import { UzbekistanMap } from './UzbekistanMap';
import { FAQ } from './FAQ';
import { Footer } from './Footer';

export function LandingPage() {
  return (
    <div className="min-h-screen bg-[#F4F6F9]">
      {/* Hero Section with animated football */}
      <HeroSection />
      
      {/* License Types */}
      <LicenseTypes />
      
      {/* How it works */}
      <ProcessSteps />
      
      {/* Uzbekistan Map */}
      <UzbekistanMap />
      
      {/* FAQ */}
      <FAQ />
      
      {/* Footer */}
      <Footer />
    </div>
  );
}

export default LandingPage;
